-- CryptoVault 24k (Kakaw) — pedidos. Ejecutar en el Supabase de Ceduverse.
-- Precio dinámico (spot de oro) + 20% fee; NFT título 1:1 se reserva al pagar,
-- se acuña al desplegar contratos (sin mock on-chain).

DO $$ BEGIN
  CREATE TYPE crypto_vault_order_status AS ENUM
    ('pending_payment','paid','title_reserved','minted','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE crypto_vault_rail AS ENUM
    ('stripe','transfer_us','transfer_mx','crypto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS crypto_vault_orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          varchar(30) NOT NULL UNIQUE,
  user_id               uuid REFERENCES users(id) ON DELETE SET NULL,
  buyer_email           text NOT NULL,
  buyer_name            text,
  edition_key           varchar(8) NOT NULL,
  grams                 integer NOT NULL,
  currency              varchar(3) NOT NULL,
  spot_per_gram         numeric(14,4) NOT NULL,
  operational_fee_pct   numeric(5,4) NOT NULL,
  gold_value_minor      integer NOT NULL,
  operational_fee_minor integer NOT NULL,
  subtotal_minor        integer NOT NULL,
  gas_fee_minor         integer NOT NULL DEFAULT 0,
  shipping_fee_minor    integer NOT NULL DEFAULT 0,
  total_minor           integer NOT NULL,
  rail                  crypto_vault_rail NOT NULL,
  status                crypto_vault_order_status NOT NULL DEFAULT 'pending_payment',
  stripe_session_id     text,
  payment_ref           text,
  title_status          text NOT NULL DEFAULT 'pendiente_acunacion',
  bar_serial            text,
  assay_cert_hash       text,
  shipping_address      jsonb,
  quote_locked_until    timestamptz,
  paid_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz
);

CREATE INDEX IF NOT EXISTS idx_crypto_vault_orders_user   ON crypto_vault_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_vault_orders_status ON crypto_vault_orders(status);
