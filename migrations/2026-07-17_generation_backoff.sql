-- Backoff de regeneración de módulos (fix/generacion-backoff).
-- Sin esto, una falla persistente (429 sostenido, key inválida) regeneraba
-- en cada poll del cliente (~5s) sin freno: con key válida cada intento es
-- una llamada real y facturable a Claude. Esta columna cuenta fallas
-- consecutivas; server/lib/generation-retry.ts la usa para espaciar los
-- reintentos automáticos (30s, 2m, 8m... tope 1h) y detenerlos tras el techo.
ALTER TABLE generated_content ADD COLUMN IF NOT EXISTS consecutive_failures integer NOT NULL DEFAULT 0;
