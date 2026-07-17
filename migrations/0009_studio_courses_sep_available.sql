-- Migration: SEP eligibility flag por curso de Studio (spec 2026-07-17, decisión 1)
-- El SEP se rige por la MISMA regla que la DC-3: flag por curso + intento de quiz aprobado.
ALTER TABLE "studio_courses" ADD COLUMN IF NOT EXISTS "sep_available" boolean DEFAULT false;

-- Backfill de las filas ya sembradas: seed-studio.ts es create-only y no las
-- re-sincroniza. Arranca reflejando dc3_available (mismo catálogo STPS); ajustable por curso.
UPDATE "studio_courses" SET "sep_available" = "dc3_available";
