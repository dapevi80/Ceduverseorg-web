import { Router } from "express";
import Stripe from "stripe";
import { eq, and, sql, inArray } from "drizzle-orm";
import { db } from "./db";
import { requireAdmin } from "./auth";
import { markVaultOrderPaid } from "./routes/vault";
import {
  storeProducts,
  storeStock,
  storeOrders,
  storeOrderItems,
  storeShipments,
  storeReferralCodes,
  storeReferralUses,
} from "@shared/schema";

const router = Router();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const ENVIA_API_KEY = process.env.ENVIA_API_KEY || "";
const ENVIA_URL = "https://api.envia.com";
const BASE_URL = process.env.BASE_URL || "https://ceduverse.org";

// If Stripe is configured, the webhook secret is required to verify incoming events.
// Without it, payments would silently never get marked as paid.
if (STRIPE_SECRET_KEY && !STRIPE_WEBHOOK_SECRET) {
  console.error("[FATAL] STRIPE_SECRET_KEY is set but STRIPE_WEBHOOK_SECRET is missing. Webhook verification cannot run; payments would silently fail. Set STRIPE_WEBHOOK_SECRET or unset STRIPE_SECRET_KEY.");
  process.exit(1);
}

let stripe: Stripe | null = null;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY);
}

const ORIGIN = {
  name: "Ceduverse Store",
  company: "Ceducap Educación y Capacitación S.C. de C. de RL de CV",
  email: "hola@ceduverse.org",
  phone: "8111848109",
  street: "TU_CALLE_ALMACEN",
  number: "S/N",
  district: "Centro",
  city: "Monterrey",
  state: "NL",
  country: "MX",
  postalCode: "64000",
};

function genOrderNumber() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CEV-${date}-${rand}`;
}

router.get("/products", async (req, res) => {
  try {
    const products = await db
      .select({
        slug: storeProducts.slug,
        name: storeProducts.name,
        description: storeProducts.description,
        price: storeProducts.priceMxn,
        imageUrl: storeProducts.imageUrl,
        deliveryDays: storeProducts.deliveryDays,
        isActive: storeProducts.isActive,
        isSoldOut: storeProducts.isSoldOut,
        seedPhraseOptions: storeProducts.seedPhraseOptions,
        stock: storeStock.quantity,
        reserved: storeStock.reserved,
      })
      .from(storeProducts)
      .leftJoin(storeStock, eq(storeProducts.id, storeStock.productId))
      .where(eq(storeProducts.isActive, true));

    res.json(products.map((p) => ({
      ...p,
      available: (p.stock || 0) - (p.reserved || 0),
    })));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/validate-referral", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ valid: false, error: "Código requerido" });

    const [ref] = await db
      .select()
      .from(storeReferralCodes)
      .where(and(eq(storeReferralCodes.code, code.toUpperCase().trim()), eq(storeReferralCodes.isActive, true)))
      .limit(1);

    if (!ref) return res.json({ valid: false, error: "Código no válido" });
    if (ref.maxUses && ref.currentUses! >= ref.maxUses) return res.json({ valid: false, error: "Código agotado" });
    if (ref.expiresAt && new Date() > ref.expiresAt) return res.json({ valid: false, error: "Código expirado" });

    res.json({ valid: true, discount: ref.discountPct, message: `${ref.discountPct}% de descuento aplicado` });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/shipping-quote", async (req, res) => {
  try {
    const { destination, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Se requiere al menos un producto" });
    }

    const productSlugs = items.map((i: any) => i.product_id);
    const products = await db.select().from(storeProducts).where(inArray(storeProducts.slug, productSlugs));
    const prodMap = Object.fromEntries(products.map((p) => [p.slug, p]));

    const packages = items.map((item: any) => {
      const prod = prodMap[item.product_id];
      const dims = (prod?.dimensionsJson as any) || { length: 15, width: 10, height: 5 };
      return {
        content: prod?.name || item.product_id,
        amount: item.quantity,
        type: "box",
        weight: Number(prod?.weightKg || 0.3) * item.quantity,
        insurance: 0,
        declaredValue: (prod?.priceMxn || 0) * item.quantity,
        weightUnit: "KG",
        lengthUnit: "CM",
        dimensions: dims,
      };
    });

    if (!ENVIA_API_KEY) {
      return res.json({ quotes: [{ carrier: "Estafeta", service: "Terrestre", price: 199, days: "3–7 días" }] });
    }

    const response = await fetch(`${ENVIA_URL}/ship/rate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ENVIA_API_KEY}` },
      body: JSON.stringify({
        origin: ORIGIN,
        destination: {
          name: destination.name, email: destination.email, phone: destination.phone,
          street: destination.street, number: destination.number || "S/N",
          district: destination.colony || "", city: destination.city,
          state: destination.state, country: "MX", postalCode: destination.zip,
        },
        packages,
        shipment: { carrier: "all", type: 1 },
      }),
    });

    const data = await response.json();
    const quotes = (data.data || [])
      .filter((q: any) => q.totalPrice > 0)
      .sort((a: any, b: any) => a.totalPrice - b.totalPrice)
      .slice(0, 5)
      .map((q: any) => ({
        carrier: q.carrier,
        service: q.service,
        price: Math.ceil(q.totalPrice),
        days: q.deliveryEstimate || q.days || "3–7 días",
      }));

    res.json({ quotes });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/create-order", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe no configurado. Configura STRIPE_SECRET_KEY." });
    }

    const { items, payer, shipping, shippingQuote, referralCode, seedPhraseWords } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Se requiere al menos un producto" });
    }
    if (!payer?.name || !payer?.email) {
      return res.status(400).json({ message: "Nombre y email del comprador son requeridos" });
    }

    const productSlugs = items.map((i: any) => i.product_id);
    const products = await db.select().from(storeProducts).where(inArray(storeProducts.slug, productSlugs));
    const prodMap = Object.fromEntries(products.map((p) => [p.slug, p]));

    for (const item of items) {
      const prod = prodMap[item.product_id];
      if (!prod) return res.status(400).json({ message: `Producto no encontrado: ${item.product_id}` });

      const [stock] = await db.select().from(storeStock).where(eq(storeStock.productId, prod.id));
      const available = (stock?.quantity || 0) - (stock?.reserved || 0);
      if (available < item.quantity) {
        return res.status(400).json({ message: `Stock insuficiente: ${prod.name}` });
      }
    }

    let discount = 0;
    let referralId: number | null = null;
    if (referralCode) {
      const [ref] = await db.select().from(storeReferralCodes)
        .where(and(eq(storeReferralCodes.code, referralCode.toUpperCase().trim()), eq(storeReferralCodes.isActive, true)))
        .limit(1);
      if (ref && (!ref.maxUses || ref.currentUses! < ref.maxUses)) {
        discount = ref.discountPct || 0;
        referralId = ref.id;
      }
    }

    let subtotal = 0;
    const orderItems: any[] = [];
    for (const item of items) {
      const prod = prodMap[item.product_id];
      const unitPrice = Math.round(prod.priceMxn * (1 - discount / 100));
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      orderItems.push({ productId: prod.id, quantity: item.quantity, unitPrice, lineTotal });
    }
    const shippingCost = shippingQuote?.price || 0;
    const discountAmount = items.reduce((sum: number, item: any) => {
      const prod = prodMap[item.product_id];
      return sum + Math.round(prod.priceMxn * (discount / 100)) * item.quantity;
    }, 0);
    const total = subtotal + shippingCost;

    const orderNumber = genOrderNumber();
    const [order] = await db.insert(storeOrders).values({
      orderNumber,
      payerName: payer.name,
      payerEmail: payer.email,
      payerPhone: payer.phone,
      shipStreet: shipping.street,
      shipColony: shipping.colony,
      shipCity: shipping.city,
      shipState: shipping.state,
      shipZip: shipping.zip,
      shipNotes: shipping.notes,
      subtotalMxn: subtotal,
      discountPct: discount,
      discountAmountMxn: discountAmount,
      shippingMxn: shippingCost,
      totalMxn: total,
      referralCodeId: referralId,
      seedPhraseWords: seedPhraseWords || 12,
      status: "pending_payment",
    }).returning();

    for (const oi of orderItems) {
      await db.insert(storeOrderItems).values({
        orderId: order.id,
        productId: oi.productId,
        quantity: oi.quantity,
        unitPriceMxn: oi.unitPrice,
        totalPriceMxn: oi.lineTotal,
      });
    }

    for (const item of items) {
      const prod = prodMap[item.product_id];
      await db.update(storeStock)
        .set({ reserved: sql`${storeStock.reserved} + ${item.quantity}` })
        .where(eq(storeStock.productId, prod.id));
    }

    const lineItems: any[] = orderItems.map((oi, idx) => {
      const item = items[idx];
      const prod = prodMap[item.product_id];
      return {
        price_data: {
          currency: "mxn",
          product_data: {
            name: prod.name + (prod.slug === "vault_kit" ? ` | ${seedPhraseWords || 12} palabras` : ""),
            description: prod.description || undefined,
          },
          unit_amount: oi.unitPrice * 100, // Stripe uses centavos
        },
        quantity: oi.quantity,
      };
    });

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "mxn",
          product_data: {
            name: `Envío ${shippingQuote?.carrier || "nacional"}`,
          },
          unit_amount: shippingCost * 100,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: payer.email,
      metadata: { orderNumber, orderId: String(order.id) },
      success_url: `${BASE_URL}/tienda/success?order=${orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/tienda/failure?order=${orderNumber}`,
    });

    await db.update(storeOrders)
      .set({ mpPreferenceId: session.id })
      .where(eq(storeOrders.id, order.id));

    res.json({
      order_number: orderNumber,
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (err: any) {
    console.error("Create order error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    if (!stripe) {
      console.error("Webhook received but STRIPE_SECRET_KEY not configured");
      return res.sendStatus(200);
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      console.error("[store] STRIPE_WEBHOOK_SECRET not configured — rejecting unverified webhook");
      return res.status(403).json({ message: "Webhook verification not configured" });
    }

    let event: Stripe.Event;
    const sig = req.headers["stripe-signature"] as string;
    if (!sig) {
      console.error("[store] Missing stripe-signature header");
      return res.status(400).json({ message: "Missing signature" });
    }
    event = stripe.webhooks.constructEvent(req.rawBody as string, sig, STRIPE_WEBHOOK_SECRET);

    if (event.type !== "checkout.session.completed") return res.sendStatus(200);

    const session = event.data.object as Stripe.Checkout.Session;
    const orderNumber = session.metadata?.orderNumber;

    // Pedidos del CryptoVault 24k reusan este mismo webhook (marcados con kind=vault).
    // Al pagar se reserva el título 1:1 (acuñación pendiente); no se acuña on-chain aún.
    if (session.metadata?.kind === "vault") {
      if (session.payment_status === "paid" && orderNumber) {
        await markVaultOrderPaid(orderNumber, (session.payment_intent as string) || session.id);
      }
      return res.sendStatus(200);
    }

    const [order] = await db.select().from(storeOrders)
      .where(eq(storeOrders.orderNumber, orderNumber!))
      .limit(1);

    if (!order) { console.error("Order not found:", orderNumber); return res.sendStatus(200); }

    await db.update(storeOrders).set({
      mpPaymentId: session.payment_intent as string || session.id,
      mpStatus: session.payment_status || "unknown",
      updatedAt: new Date(),
    }).where(eq(storeOrders.id, order.id));

    if (session.payment_status === "paid" && order.status === "pending_payment") {
      await db.update(storeOrders).set({
        status: "paid",
        paidAt: new Date(),
      }).where(eq(storeOrders.id, order.id));

      const orderItemsList = await db.select().from(storeOrderItems).where(eq(storeOrderItems.orderId, order.id));
      for (const oi of orderItemsList) {
        await db.update(storeStock).set({
          quantity: sql`${storeStock.quantity} - ${oi.quantity}`,
          reserved: sql`${storeStock.reserved} - ${oi.quantity}`,
        }).where(eq(storeStock.productId, oi.productId));
      }

      if (order.referralCodeId) {
        const existingUse = await db.select().from(storeReferralUses)
          .where(and(eq(storeReferralUses.orderId, order.id), eq(storeReferralUses.referralCodeId, order.referralCodeId)))
          .limit(1);
        if (existingUse.length === 0) {
          await db.insert(storeReferralUses).values({
            referralCodeId: order.referralCodeId,
            orderId: order.id,
            discountAppliedMxn: order.discountAmountMxn || 0,
          });
          await db.update(storeReferralCodes).set({
            currentUses: sql`${storeReferralCodes.currentUses} + 1`,
          }).where(eq(storeReferralCodes.id, order.referralCodeId));
        }
      }

      // Generate Envia.com shipment label (if API key configured)
      if (ENVIA_API_KEY) {
        try {
          const orderItemsList2 = await db.select({ slug: storeProducts.slug, name: storeProducts.name, quantity: storeOrderItems.quantity, weightKg: storeProducts.weightKg, dimensionsJson: storeProducts.dimensionsJson })
            .from(storeOrderItems)
            .leftJoin(storeProducts, eq(storeOrderItems.productId, storeProducts.id))
            .where(eq(storeOrderItems.orderId, order.id));

          const packages = orderItemsList2.map((item) => {
            const dims = (item.dimensionsJson as any) || { length: 15, width: 10, height: 5 };
            return { content: item.name || "Producto", amount: item.quantity, type: "box", weight: Number(item.weightKg || 0.3) * item.quantity, insurance: 0, declaredValue: order.totalMxn, weightUnit: "KG", lengthUnit: "CM", dimensions: dims };
          });

          const shipResponse = await fetch(`${ENVIA_URL}/ship/generate/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${ENVIA_API_KEY}` },
            body: JSON.stringify({
              origin: ORIGIN,
              destination: { name: order.payerName, email: order.payerEmail, phone: order.payerPhone || "", street: order.shipStreet, number: "S/N", district: order.shipColony || "", city: order.shipCity, state: order.shipState, country: "MX", postalCode: order.shipZip },
              packages,
              shipment: { carrier: "estafeta", type: 1 },
            }),
          });
          const shipData = await shipResponse.json();

          if (shipData.data?.[0]?.trackingNumber) {
            await db.insert(storeShipments).values({
              orderId: order.id,
              carrier: shipData.data[0].carrier || "Estafeta",
              trackingNumber: shipData.data[0].trackingNumber,
              labelUrl: shipData.data[0].label || null,
              status: "label_created",
            });
            console.log(`📦 Shipment label created for ${orderNumber}: ${shipData.data[0].trackingNumber}`);
          }
        } catch (shipErr: any) {
          console.error(`[store] Shipment label error for ${orderNumber}:`, shipErr.message);
        }
      }

      // Send confirmation email via Resend
      try {
        const { sendOrderConfirmationEmail } = await import("./email-store");
        await sendOrderConfirmationEmail(order.payerEmail, order.payerName, orderNumber!, order.totalMxn, order.shippingMxn || 0);
        console.log(`📧 Confirmation email sent for ${orderNumber}`);
      } catch (emailErr: any) {
        console.error(`[store] Confirmation email error for ${orderNumber}:`, emailErr.message);
      }

      // Mint NFT certificate if vault_kit ordered
      const vaultItems = await db.select({ slug: storeProducts.slug })
        .from(storeOrderItems)
        .leftJoin(storeProducts, eq(storeOrderItems.productId, storeProducts.id))
        .where(and(eq(storeOrderItems.orderId, order.id), eq(storeProducts.slug, "vault_kit")));
      if (vaultItems.length > 0) {
        console.log(`🔐 NFT certificate pending for ${orderNumber} — vault_kit ordered (manual mint required)`);
        await db.update(storeOrders).set({ shipNotes: (order.shipNotes || "") + " | NFT certificate pending mint" }).where(eq(storeOrders.id, order.id));
      }

      console.log(`✅ Order ${orderNumber} PAID — $${order.totalMxn} MXN`);

    } else if (session.payment_status !== "paid" && order.status === "pending_payment") {
      await db.update(storeOrders).set({ status: "cancelled" }).where(eq(storeOrders.id, order.id));
      const orderItemsList = await db.select().from(storeOrderItems).where(eq(storeOrderItems.orderId, order.id));
      for (const oi of orderItemsList) {
        await db.update(storeStock).set({
          reserved: sql`${storeStock.reserved} - ${oi.quantity}`,
        }).where(eq(storeStock.productId, oi.productId));
      }
      console.log(`❌ Order ${orderNumber} REJECTED`);
    }

    res.sendStatus(200);
  } catch (err: any) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const [totalOrders] = await db.select({ count: sql`count(*)` }).from(storeOrders);
    const [paidOrders] = await db.select({ count: sql`count(*)`, revenue: sql`coalesce(sum(${storeOrders.totalMxn}), 0)` }).from(storeOrders).where(eq(storeOrders.status, "paid"));
    const [pendingOrders] = await db.select({ count: sql`count(*)` }).from(storeOrders).where(eq(storeOrders.status, "pending_payment"));
    const [referralUsesData] = await db.select({ count: sql`count(*)`, totalDiscount: sql`coalesce(sum(${storeReferralUses.discountAppliedMxn}), 0)` }).from(storeReferralUses);

    res.json({
      totalOrders: Number(totalOrders.count),
      paidOrders: Number(paidOrders.count),
      pendingOrders: Number(pendingOrders.count),
      revenue: Number(paidOrders.revenue),
      referralUses: Number(referralUsesData.count),
      referralDiscounts: Number(referralUsesData.totalDiscount),
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/admin/orders", requireAdmin, async (req, res) => {
  try {
    const orders = await db.select().from(storeOrders).orderBy(sql`${storeOrders.createdAt} DESC`).limit(100);
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/admin/orders/:id", requireAdmin, async (req, res) => {
  try {
    const [order] = await db.select().from(storeOrders).where(eq(storeOrders.id, Number(req.params.id)));
    if (!order) return res.status(404).json({ message: "Order not found" });

    const items = await db
      .select({ quantity: storeOrderItems.quantity, unitPrice: storeOrderItems.unitPriceMxn, total: storeOrderItems.totalPriceMxn, productName: storeProducts.name, productSlug: storeProducts.slug })
      .from(storeOrderItems)
      .leftJoin(storeProducts, eq(storeOrderItems.productId, storeProducts.id))
      .where(eq(storeOrderItems.orderId, order.id));

    const [shipment] = await db.select().from(storeShipments).where(eq(storeShipments.orderId, order.id)).limit(1);

    res.json({ order, items, shipment });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/admin/orders/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending_payment", "paid", "preparing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Estado inválido" });

    await db.update(storeOrders).set({
      status,
      updatedAt: new Date(),
      ...(status === "shipped" ? { shippedAt: new Date() } : {}),
    }).where(eq(storeOrders.id, Number(req.params.id)));

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/admin/stock", requireAdmin, async (req, res) => {
  try {
    const stock = await db
      .select({ productId: storeProducts.id, slug: storeProducts.slug, name: storeProducts.name, quantity: storeStock.quantity, reserved: storeStock.reserved, isSoldOut: storeProducts.isSoldOut })
      .from(storeProducts)
      .leftJoin(storeStock, eq(storeProducts.id, storeStock.productId));
    res.json(stock);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/admin/stock/:productId", requireAdmin, async (req, res) => {
  try {
    const { quantity, isSoldOut } = req.body;
    const productId = Number(req.params.productId);

    if (quantity !== undefined) {
      await db.update(storeStock).set({ quantity, updatedAt: new Date() }).where(eq(storeStock.productId, productId));
    }
    if (isSoldOut !== undefined) {
      await db.update(storeProducts).set({ isSoldOut, updatedAt: new Date() }).where(eq(storeProducts.id, productId));
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/admin/referrals", requireAdmin, async (req, res) => {
  try {
    const codes = await db.select().from(storeReferralCodes).orderBy(sql`${storeReferralCodes.createdAt} DESC`);
    res.json(codes);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/admin/referrals", requireAdmin, async (req, res) => {
  try {
    const { code, ownerName, discountPct, maxUses } = req.body;
    const [ref] = await db.insert(storeReferralCodes).values({
      code: code.toUpperCase().trim(),
      ownerName,
      discountPct: discountPct || 15,
      maxUses: maxUses || 100,
    }).returning();
    res.json(ref);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/admin/referrals/:id", requireAdmin, async (req, res) => {
  try {
    await db.update(storeReferralCodes).set({ isActive: false }).where(eq(storeReferralCodes.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
