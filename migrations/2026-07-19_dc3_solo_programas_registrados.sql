-- DC-3 sólo en los cursos respaldados por un programa realmente registrado
-- ante la STPS por el instructor que los imparte.
--
-- Por qué: `dc3_available` estaba en true en 47 de 59 cursos, pero un DC-3 sólo
-- es válido si el agente capacitador tiene ESE programa registrado. El cruce
-- contra los registros reales (Medina: 19 programas en el directorio público de
-- la STPS; Yuridia: 10 en su DC-5) dejó 19 cursos prometiendo una constancia
-- que nadie puede emitir. La UI ya sabe decir "DC3 Próximamente" cuando el flag
-- es false; el dato era lo que mentía.
--
-- Criterio: se conserva el DC-3 sólo cuando el título del curso corresponde a un
-- programa registrado del instructor asignado. Los demás quedan en
-- "Próximamente" y se irán activando conforme se registre su DC-5 según demanda.
--
-- Ver docs/legal/validacion-dc5-instructores-externos.md para el cruce completo.

BEGIN;

-- 1) "Capacidad Analítica y Resolución de Problemas" estaba asignado a Yuridia,
--    pero el programa "Capacidad analítica y resolución de problemas en el
--    ámbito laboral" está registrado a nombre de Medina (15/11/2022). Se
--    reasigna al instructor que sí lo tiene registrado: así el curso conserva un
--    DC-3 válido en vez de perderlo.
UPDATE studio_courses
SET instructor = 'Lic. Jorge Armando Medina Castillo', updated_at = now()
WHERE slug = 'capacidad-analitica-resolucion-problemas';

-- 2) "Valores Humanos en la Organización" se renombra al nombre verbatim del
--    programa registrado de Yuridia ("Derechos humanos en la organización"), que
--    hasta ahora ningún curso usaba. El DC-3 debe decir el nombre del programa
--    tal como está registrado.
UPDATE studio_courses
SET title = 'Derechos humanos en la organización', updated_at = now()
WHERE slug = 'valores-humanos-organizacion';

-- 3) Apagar el DC-3 en TODO el catálogo y volver a encenderlo sólo donde hay
--    respaldo. Se hace en dos pasos a propósito: si mañana se agrega un curso
--    nuevo, nace sin DC-3 y hay que justificarlo para encenderlo, en vez de
--    heredarlo por descuido.
UPDATE studio_courses SET dc3_available = false, updated_at = now()
WHERE dc3_available IS DISTINCT FROM false;

UPDATE studio_courses SET dc3_available = true, updated_at = now()
WHERE slug IN (
  -- === Medina — 19 programas registrados ante la STPS ===
  'prevencion-riesgos-laborales',              -- Prevención de riesgos laborales (6 h)
  'equipo-proteccion-personal',                -- Equipo de protección personal (6 h)
  'nom-017-epp-procadist',                     -- idem EPP, versión Procadist
  'operario-limpieza',                         -- Operario de limpieza (6 h)
  'seguridad-energia-electrica',               -- Condiciones de seguridad en trabajos con energía eléctrica (8 h)
  'brigada-contra-incendios',                  -- Brigada contra incendios (8 h)
  'sistema-globalmente-armonizado-sga',        -- Comunicación de peligros SGA (8 h)
  'nom-035-stps-medina',                       -- NOM-035-STPS-2018 riesgos psicosociales (8 h)
  'formacion-instructores',                    -- Formación de instructores (20 h)
  'bloqueo-etiquetado-loto',                   -- Bloqueo y etiquetado de energías peligrosas (8 h)
  'nom-026-colores-senales-seguridad',         -- NOM-026-STPS-2008 colores y señales (8 h)
  'herramientas-manuales-poder',               -- Uso y manejo de herramientas manuales y de poder (8 h)
  'ergonomia-trastornos-musculoesqueleticos',  -- Ergonomía en el trabajo (8 h)
  'soldadura-corte-seguridad',                 -- Actividades de soldadura y corte (8 h)
  'operacion-segura-montacargas',              -- Operación segura de montacargas (20 h)
  'actualizacion-montacargas',                 -- Actualización en operación segura de montacargas (8 h)
  'nom-019-comisiones-seguridad-higiene',      -- NOM-019-STPS-2011 comisiones de seguridad e higiene (8 h)
  'nom-019-comisiones-procadist',              -- idem NOM-019, versión Procadist
  'capacidad-analitica-resolucion-problemas',  -- Capacidad analítica y resolución de problemas (4 h) — reasignado arriba

  -- === Yuridia — programas de su DC-5 ===
  'planeacion-vida-trabajo',                   -- Planeación de vida y trabajo (9 h)
  'diagnostico-prevencion-bullying',           -- Diagnóstico, prevención e intervención del Bullying (9 h)
  'camino-autodependencia',                    -- Camino a la autodependencia (9 h)
  'como-es-mi-comunicacion',                   -- Cómo es mi comunicación (10 h)
  'relaciones-humanas',                        -- Relaciones humanas (6 h)
  'autoestima',                                -- Autoestima (6 h)
  'manejo-conflictos-toma-decisiones',         -- Manejo de conflictos y toma de decisiones (10 h)
  'integracion-grupos-equipo',                 -- Integración de grupos y el equipo (10 h)
  'valores-humanos-organizacion'               -- Derechos humanos en la organización (6 h) — renombrado arriba
);

-- Nota de los que se quedan SIN DC-3 y por qué, para no re-litigarlo:
--   Medina, sin programa registrado equivalente: nom-002-prevencion-incendios,
--     nom-006-manejo-almacenamiento, nom-009-trabajos-altura,
--     nom-020-recipientes-presion, nom-025-iluminacion,
--     nom-030-servicios-preventivos, nom-031-construccion,
--     administracion-capacitacion-rh-1 y -2, comisiones-mixtas-capacitacion
--     (la CMCAP no es la NOM-019 de seguridad e higiene), control-sanitario-alimentos.
--   Yuridia: atencion-comensales, habilidades-directivas, habitos-saludables-trabajo,
--     comunicacion-efectiva-trabajo y trabajo-en-equipo-procadist (estos dos se
--     parecen a un programa suyo, pero ese programa ya lo usa otro curso; no puede
--     haber dos cursos con el mismo nombre registrado).
--   Daniel Zavala: derechos-laborales-reforma, orientacion-asesoria-juridica-laboral,
--     trabajo-infantil-derechos-nna — no tiene registro STPS todavía. Los cursos se
--     quedan con él porque el contenido es su materia; el DC-3 espera a su DC-5.
--   Programas registrados de Medina que aún no tienen curso, candidatos naturales
--     a curso nuevo: "Liderazgo y trabajo colaborativo" y "Brigada de primeros auxilios".
--   Programa de Yuridia sin curso: "Factores de riesgo psicosociales en salud mental
--     y adicciones" (es el tema de la NOM-035 desde la mirada de salud mental).

COMMIT;

-- Addendum: el catálogo tenía al mismo instructor con dos grafías
-- ("David Pérez" y "David Pérez Villaseñor"). Antes daba igual porque el nombre
-- no se mostraba; ahora aparece en la ficha del curso, así que se unifica.
UPDATE studio_courses
SET instructor = 'David Pérez Villaseñor', updated_at = now()
WHERE instructor = 'David Pérez';
