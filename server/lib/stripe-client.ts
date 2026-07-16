import Stripe from "stripe";

const KEY = process.env.STRIPE_SECRET_KEY || "";

// If Stripe is configured, the certificates webhook secret is required to verify
// incoming events. Without it, certificate checkouts would charge customers while
// the webhook 403s and no certificate request ever advances past pending_payment —
// money captured, service undelivered, no startup signal. Mirrors the store's
// STRIPE_WEBHOOK_SECRET boot check (server/store-routes.ts).
if (KEY && !process.env.STRIPE_WEBHOOK_SECRET_CERTS) {
  console.error("[FATAL] STRIPE_SECRET_KEY is set but STRIPE_WEBHOOK_SECRET_CERTS is missing. Webhook verification cannot run; certificate payments would silently fail. Set STRIPE_WEBHOOK_SECRET_CERTS or unset STRIPE_SECRET_KEY.");
  process.exit(1);
}

export const stripe: Stripe | null = KEY ? new Stripe(KEY) : null;
export const BASE_URL = process.env.BASE_URL || "https://ceduverse.org";
