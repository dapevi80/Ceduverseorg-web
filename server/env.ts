/**
 * Centralized environment variable validation.
 * Import this module early in server startup to fail fast on missing config.
 */

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVar[] = [
  // Core — server won't start without these
  { name: "DB_URL", required: true, description: "PostgreSQL connection string" },
  { name: "SESSION_SECRET", required: true, description: "JWT signing secret" },

  // Public base URL — used for absolute links in emails, webhooks, OAuth callbacks
  { name: "BASE_URL", required: false, description: "Public base URL of the deployment (e.g. https://ceduverse.org)" },

  // Supabase — client-side auth + some server paths
  { name: "SUPABASE_URL", required: false, description: "Supabase project URL" },
  { name: "SUPABASE_ANON_KEY", required: false, description: "Supabase anon (public) API key" },

  // Cloudflare R2 — object storage for audio, video, uploads
  { name: "R2_ACCOUNT_ID", required: false, description: "Cloudflare R2 account ID (audio/video storage; falls back to local disk if unset)" },
  { name: "R2_ACCESS_KEY_ID", required: false, description: "Cloudflare R2 access key ID" },
  { name: "R2_SECRET_ACCESS_KEY", required: false, description: "Cloudflare R2 secret access key" },
  { name: "R2_BUCKET_NAME", required: false, description: "Cloudflare R2 bucket name" },
  { name: "R2_PUBLIC_URL", required: false, description: "Cloudflare R2 public URL prefix for served objects" },

  // Admin — separate secret for admin API endpoints. NO fallback. If unset, admin import/export endpoints are disabled.
  { name: "ADMIN_API_KEY", required: false, description: "Admin API key for migration/import endpoints. If unset, those endpoints reject all requests (no fallback)." },

  // Kakaw HQ connector — shared secret for GET /api/hq/metrics. NO fallback. If unset, that endpoint returns 503.
  { name: "HQ_METRICS_SECRET", required: false, description: "Shared secret the Kakaw HQ sends as x-hq-secret to read aggregated metrics. If unset, /api/hq/metrics is disabled." },

  // Email
  { name: "RESEND_API_KEY", required: false, description: "Resend email API key" },

  // AI services
  { name: "OPENAI_API_KEY", required: false, description: "OpenAI API key for TTS audio generation (optional fallback)" },
  { name: "ANTHROPIC_API_KEY", required: false, description: "Anthropic API key for Claude AI" },

  // Video/Avatar
  { name: "HEYGEN_API_KEY", required: false, description: "HeyGen avatar video API key" },
  { name: "DAILY_API_KEY", required: false, description: "Daily.co video conferencing API key" },

  // Payments
  { name: "STRIPE_SECRET_KEY", required: false, description: "Stripe secret key for payments" },
  { name: "STRIPE_WEBHOOK_SECRET", required: false, description: "Stripe webhook signing secret" },

  // Invoicing
  { name: "FACTURAPI_API_KEY", required: false, description: "FacturAPI invoicing key" },

  // Shipping
  { name: "ENVIA_API_KEY", required: false, description: "Envia.com shipping API key" },

  // Precio spot del oro (CryptoVault 24k). Sin esta key no se cotiza el vault (nunca precio simulado).
  { name: "GOLD_API_KEY", required: false, description: "goldapi.io x-access-token para spot XAU (CryptoVault 24k)" },

  // Bank info for SAM payments
  { name: "BANK_NAME", required: false, description: "Bank name for SAM payment info" },
  { name: "BANK_CLABE", required: false, description: "CLABE interbancaria for SAM payments" },
  { name: "BANK_BENEFICIARY", required: false, description: "Beneficiary name for SAM payments" },

  // Superadmin
  { name: "SUPERADMIN_PASSWORD", required: false, description: "Initial superadmin password" },

  // Demo accounts (JSON array, optional). Each entry: { email, fullName, role, isOrgAdmin? }.
  // Demo emails bypass OTP — entering the email logs you in instantly.
  { name: "DEMO_ACCOUNTS", required: false, description: "JSON array of demo account configs (bypasses OTP)" },
  // Required in production if DEMO_ACCOUNTS is set — prevents accidental demo configs in prod.
  { name: "ALLOW_DEMO_ACCOUNTS_IN_PROD", required: false, description: "Set to 'true' to allow DEMO_ACCOUNTS in production. Demo emails restricted to @ceduverse.org domain." },
];

export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const v of ENV_VARS) {
    if (!process.env[v.name]) {
      if (v.required) {
        missing.push(`  ${v.name} — ${v.description}`);
      } else {
        warnings.push(`  ${v.name} — ${v.description}`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(`[env] Optional variables not set (features may be limited):\n${warnings.join("\n")}`);
  }

  if (missing.length > 0) {
    console.error(`[FATAL] Required environment variables missing:\n${missing.join("\n")}`);
    process.exit(1);
  }

  console.log("[env] Environment validation passed");
}

/** Get the admin API key — requires dedicated ADMIN_API_KEY, no fallback */
export function getAdminApiKey(): string {
  const key = process.env.ADMIN_API_KEY;
  if (!key) {
    console.warn("[env] ADMIN_API_KEY not set — admin import/export endpoints are disabled");
    return "";
  }
  return key;
}

/** Get bank info from env vars with defaults */
export function getBankInfo() {
  return {
    bank: process.env.BANK_NAME || "BanRegio",
    type: "Cuenta Empresarial",
    clabe: process.env.BANK_CLABE || "",
    beneficiary: process.env.BANK_BENEFICIARY || "Ceduverse S.C.",
  };
}
