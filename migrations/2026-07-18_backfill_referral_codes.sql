-- Regulariza los folios de socio que nunca se registraron como código de referido.
--
-- Al hacerse socio cooperativo se ponía accounts.referral_code = folio, pero no se
-- creaba la fila en referral_codes. Como la validación del invitado
-- (GET /api/referral/:code) y la atribución (PATCH /api/me/account) buscan ahí,
-- todo socio con folio compartía un link que la app rechazaba ("link incorrecto")
-- y su referido no se acreditaba.
--
-- El código ya crea la fila desde el 2026-07-18 (server/lib/ensure-referral-code.ts).
-- Esto repara a los socios que ya existían.

-- 1) Cuántos están afectados ANTES (para tener el número).
SELECT count(*) AS folios_sin_codigo
FROM accounts a
WHERE a.referral_code IS NOT NULL
  AND btrim(a.referral_code) <> ''
  AND NOT EXISTS (SELECT 1 FROM referral_codes rc WHERE rc.code = a.referral_code);

-- 2) Crear la fila que faltaba para cada uno.
INSERT INTO referral_codes (code, owner_id, owner_type, label, commission, is_active)
SELECT a.referral_code, a.id, 'user', 'Folio de socio (backfill)', 0, true
FROM accounts a
WHERE a.referral_code IS NOT NULL
  AND btrim(a.referral_code) <> ''
  AND NOT EXISTS (SELECT 1 FROM referral_codes rc WHERE rc.code = a.referral_code)
ON CONFLICT (code) DO NOTHING;

-- 3) Verificación: debe dar 0.
SELECT count(*) AS folios_sin_codigo_despues
FROM accounts a
WHERE a.referral_code IS NOT NULL
  AND btrim(a.referral_code) <> ''
  AND NOT EXISTS (SELECT 1 FROM referral_codes rc WHERE rc.code = a.referral_code);
