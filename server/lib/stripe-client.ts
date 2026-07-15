import Stripe from "stripe";

const KEY = process.env.STRIPE_SECRET_KEY || "";
export const stripe: Stripe | null = KEY ? new Stripe(KEY) : null;
export const BASE_URL = process.env.BASE_URL || "https://ceduverse.org";
