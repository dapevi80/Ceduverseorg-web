-- Enum: nuevo estado inicial para certificados de pago
ALTER TYPE "cert_request_status" ADD VALUE IF NOT EXISTS 'pending_payment' BEFORE 'solicitado';

-- Columnas de pago
ALTER TABLE "certificate_requests" ADD COLUMN IF NOT EXISTS "amount_mxn" integer;
ALTER TABLE "certificate_requests" ADD COLUMN IF NOT EXISTS "stripe_session_id" text;
ALTER TABLE "certificate_requests" ADD COLUMN IF NOT EXISTS "paid_at" timestamptz;
