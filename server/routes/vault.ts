import type { Express } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { cryptoVaultOrders } from "@shared/schema";
import { requireAuth, requireAdmin } from "../auth";
import { getUsdBankInfo } from "../env";
import { getGoldSpot } from "../services/gold-spot";
import { quoteCryptoVault, CRYPTOVAULT_EDITIONS, type EditionKey, type VaultQuoteBreakdown } from "../services/cryptovault-pricing";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const BASE_URL = process.env.BASE_URL || "https://ceduverse.org";
const QUOTE_LOCK_MINUTES = 15;

let stripe: Stripe | null = null;
if (STRIPE_SECRET_KEY) stripe = new Stripe(STRIPE_SECRET_KEY);

const CURRENCIES = ["MXN", "USD"] as const;
type Currency = (typeof CURRENCIES)[number];

function isEdition(k: unknown): k is EditionKey {
  return k === "100" || k === "200";
}
function isCurrency(c: unknown): c is Currency {
  return c === "MXN" || c === "USD";
}
function toMinor(major: number): number {
  return Math.round((major + Number.EPSILON) * 100);
}

// Estimaciones de gas de red (acuñar NFT título) y envío. Se cotizan al comprador y
// se afinan al enviar/acuñar. Configurables por env; defaults conservadores.
function estimateExtras(currency: Currency): { gas: number; shipping: number } {
  const gas = Number(process.env[`VAULT_GAS_FEE_${currency}`] ?? (currency === "USD" ? 15 : 300));
  const shipping = Number(process.env[`VAULT_SHIPPING_FEE_${currency}`] ?? (currency === "USD" ? 25 : 450));
  return {
    gas: Number.isFinite(gas) && gas >= 0 ? gas : 0,
    shipping: Number.isFinite(shipping) && shipping >= 0 ? shipping : 0,
  };
}

async function buildQuote(editionKey: EditionKey, currency: Currency): Promise<{ breakdown: VaultQuoteBreakdown; spotFetchedAt: string }> {
  const spot = await getGoldSpot();
  const spotPerGram = currency === "USD" ? spot.usdPerGram24k : spot.mxnPerGram24k;
  const { gas, shipping } = estimateExtras(currency);
  const breakdown = quoteCryptoVault({ editionKey, spotPerGram, currency, gasFee: gas, shippingFee: shipping });
  return { breakdown, spotFetchedAt: spot.fetchedAt };
}

function genOrderNumber(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `KV-${date}-${rand}`;
}

/**
 * Marca un pedido como pagado y RESERVA el título 1:1 (acuñación pendiente).
 * No acuña on-chain: el mint real ocurre al desplegar los contratos Kakaw.
 * Idempotente: si ya está pagado o reservado, no lo revierte.
 */
export async function markVaultOrderPaid(orderNumber: string, paymentRef?: string): Promise<void> {
  const [order] = await db.select().from(cryptoVaultOrders).where(eq(cryptoVaultOrders.orderNumber, orderNumber)).limit(1);
  if (!order) {
    console.error(`[vault] Pedido no encontrado al confirmar pago: ${orderNumber}`);
    return;
  }
  if (order.status === "paid" || order.status === "title_reserved" || order.status === "minted") return;
  await db.update(cryptoVaultOrders).set({
    status: "title_reserved",
    titleStatus: "pendiente_acunacion",
    paymentRef: paymentRef || order.paymentRef,
    paidAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(cryptoVaultOrders.id, order.id));
}

export function registerVaultRoutes(app: Express) {
  // Cotización en vivo del CryptoVault 24k. No crea pedido.
  app.post("/api/vault/quote", async (req, res, next) => {
    try {
      const { editionKey, currency } = req.body || {};
      if (!isEdition(editionKey)) return res.status(400).json({ message: "editionKey debe ser '100' o '200'" });
      if (!isCurrency(currency)) return res.status(400).json({ message: "currency debe ser 'MXN' o 'USD'" });
      const { breakdown, spotFetchedAt } = await buildQuote(editionKey, currency);
      const ed = CRYPTOVAULT_EDITIONS[editionKey];
      res.json({
        edition: { ...ed, key: editionKey },
        quote: breakdown,
        spotFetchedAt,
        lockMinutes: QUOTE_LOCK_MINUTES,
        note: "Precio referencial. El monto final se fija con el spot al confirmar la compra. Gas de red y envío son estimados y se afinan al enviar/acuñar.",
      });
    } catch (err: any) {
      // Sin GOLD_API_KEY o API caída: error explícito, nunca precio simulado.
      if (String(err?.message || "").includes("GOLD_API_KEY")) {
        return res.status(503).json({ message: "Cotización de oro no disponible (configuración pendiente). Intenta más tarde." });
      }
      next(err);
    }
  });

  // Crea el pedido y devuelve instrucciones de pago según el rail elegido.
  app.post("/api/vault/checkout", async (req, res, next) => {
    try {
      const { editionKey, currency, rail, buyer, shippingAddress } = req.body || {};
      if (!isEdition(editionKey)) return res.status(400).json({ message: "editionKey debe ser '100' o '200'" });
      if (!isCurrency(currency)) return res.status(400).json({ message: "currency debe ser 'MXN' o 'USD'" });
      if (!["stripe", "transfer_us", "transfer_mx", "crypto"].includes(rail)) {
        return res.status(400).json({ message: "rail inválido" });
      }
      const email = String(buyer?.email || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return res.status(400).json({ message: "Se requiere un correo válido del comprador" });
      }
      const buyerName = buyer?.name ? String(buyer.name).trim() : null;

      // Recotiza server-side con spot fresco: NUNCA se confía en el precio del cliente.
      const { breakdown } = await buildQuote(editionKey, currency);
      const lockedUntil = new Date(Date.now() + QUOTE_LOCK_MINUTES * 60 * 1000);
      const orderNumber = genOrderNumber();

      const [order] = await db.insert(cryptoVaultOrders).values({
        orderNumber,
        userId: (req as any).supabaseUserId || null,
        buyerEmail: email,
        buyerName,
        editionKey,
        grams: breakdown.grams,
        currency,
        spotPerGram: String(breakdown.spotPerGram),
        operationalFeePct: String(breakdown.operationalFeePct),
        goldValueMinor: toMinor(breakdown.goldValue),
        operationalFeeMinor: toMinor(breakdown.operationalFee),
        subtotalMinor: toMinor(breakdown.subtotal),
        gasFeeMinor: toMinor(breakdown.gasFee),
        shippingFeeMinor: toMinor(breakdown.shippingFee),
        totalMinor: toMinor(breakdown.total),
        rail,
        status: "pending_payment",
        shippingAddress: shippingAddress || null,
        quoteLockedUntil: lockedUntil,
      }).returning();

      // ---- Stripe (tarjeta fiat) ----
      if (rail === "stripe") {
        if (!stripe) return res.status(503).json({ message: "Pago con tarjeta no configurado (Stripe pendiente)." });
        const ed = CRYPTOVAULT_EDITIONS[editionKey];
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          customer_email: email,
          line_items: [{
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `CryptoVault 24k — ${ed.label} (${ed.purity})`,
                description: `Edición ${ed.edition} · ${ed.year} · NFT título 1:1 de lingote (acuñación pendiente) · incluye 20% fee operativo, gas de red y envío`,
              },
              unit_amount: toMinor(breakdown.total),
            },
            quantity: 1,
          }],
          metadata: { kind: "vault", orderNumber },
          success_url: `${BASE_URL}/ceduverse?vault=success&order=${orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${BASE_URL}/ceduverse?vault=cancel&order=${orderNumber}`,
        });
        await db.update(cryptoVaultOrders).set({ stripeSessionId: session.id, updatedAt: new Date() }).where(eq(cryptoVaultOrders.id, order.id));
        return res.json({ orderNumber, rail, checkout_url: session.url });
      }

      // ---- Transferencia USD (MeCorrieron LLC) ----
      if (rail === "transfer_us") {
        if (currency !== "USD") return res.status(400).json({ message: "La transferencia USD requiere currency USD." });
        const bank = getUsdBankInfo();
        if (!bank) return res.status(503).json({ message: "Cuenta USD no configurada." });
        return res.json({
          orderNumber, rail,
          instructions: {
            title: "Transferencia / Wire USD (MeCorrieron LLC · Mercury)",
            amount: breakdown.total, currency: "USD",
            reference: orderNumber,
            bank,
            note: "Usa el número de pedido como referencia. Tu título se reserva al confirmar el pago (1–2 días hábiles).",
          },
        });
      }

      // ---- Transferencia MXN (Ceduverse) — cuenta pendiente ----
      if (rail === "transfer_mx") {
        return res.status(503).json({ orderNumber, message: "Transferencia MXN aún no disponible (cuenta de Ceduverse pendiente)." });
      }

      // ---- Cripto — fase futura ----
      return res.status(503).json({ orderNumber, message: "Pago en cripto disponible en una próxima fase." });
    } catch (err: any) {
      if (String(err?.message || "").includes("GOLD_API_KEY")) {
        return res.status(503).json({ message: "Cotización de oro no disponible (configuración pendiente)." });
      }
      next(err);
    }
  });

  // Consultar un pedido (para la pantalla de éxito).
  app.get("/api/vault/orders/:orderNumber", async (req, res, next) => {
    try {
      const [order] = await db.select().from(cryptoVaultOrders)
        .where(eq(cryptoVaultOrders.orderNumber, String(req.params.orderNumber))).limit(1);
      if (!order) return res.status(404).json({ message: "Pedido no encontrado" });
      res.json(order);
    } catch (err) { next(err); }
  });

  // Admin: confirmar manualmente un pago por transferencia → reserva el título.
  app.post("/api/admin/vault/:id/confirm-payment", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const [order] = await db.select().from(cryptoVaultOrders).where(eq(cryptoVaultOrders.id, String(req.params.id))).limit(1);
      if (!order) return res.status(404).json({ message: "Pedido no encontrado" });
      await markVaultOrderPaid(order.orderNumber, req.body?.paymentRef);
      const [updated] = await db.select().from(cryptoVaultOrders).where(eq(cryptoVaultOrders.id, order.id)).limit(1);
      res.json(updated);
    } catch (err) { next(err); }
  });

  // Admin: listar pedidos del vault.
  app.get("/api/admin/vault/orders", requireAuth, requireAdmin, async (_req, res, next) => {
    try {
      const orders = await db.select().from(cryptoVaultOrders);
      res.json(orders);
    } catch (err) { next(err); }
  });
}
