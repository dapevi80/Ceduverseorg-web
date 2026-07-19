# Acciones manuales pendientes — David

Actualizado 2026-07-19. Lo ya verificado contra la base está marcado ✅ y no hay que rehacerlo.

---

## YA HECHO (verificado en tu base, no lo repitas)

- ✅ Migración del playbook aplicada (la columna `source` existe).
- ✅ Backfill de referidos: cero folios sin código.
- ✅ Contador de usos alineado con la realidad.
- ✅ Atribución de `wawawa2415` acreditada a tu folio `CEDU-CVS9`.
- ✅ Roles de empresa revisados: los 4 dueños son `admin`, nadie queda fuera.
- ✅ 59 playbooks sembrados, **ninguno** con contenido de respaldo.

---

# AHORA

## PASO 1 — Deployar `main`

El playbook ya está mergeado. Deploya `main` como siempre.

- [ ] Deployado

## PASO 2 — Probar el link compartido (5 minutos)

Con una cuenta nueva, en ventana privada o desde el celular:

1. Abre el link que compartes de un curso.
2. Regístrate.
3. Completa el alta.
4. **Debes aterrizar en el curso**, no en el dashboard.

Es el único tramo del arreglo que no pude verificar yo.

- [ ] Probado y funciona

## PASO 3 — Cloudflare: cerrar el acceso público a las fotos

⚠️ **CORREGIDO:** son **dos** prefijos, no uno.

| Prefijo | Qué guarda |
|---|---|
| `evidence/` | fotos del playbook (lo que se deploya hoy) |
| `risk/` | fotos del detector de riesgos (lo que viene) |

En el bucket de R2, quítale el acceso público **a esos dos prefijos**.

**No cierres el bucket completo:** los certificados sí se sirven por URL pública y se romperían.

El código nunca emite la URL pública de esas fotos y las llaves son aleatorias, así que en la
práctica ya está sellado — esto es el cierre real.

- [ ] Hecho

---

# DESPUÉS (cuando el detector esté terminado y mergeado)

## PASO 4 — Migración del detector

Correr en Supabase:
```
C:\Users\user\Documents\ceduverse-web\migrations\2026-07-19_risk_findings.sql
```
Trae los `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` desde el principio, así que es seguro
correrla más de una vez.

- [ ] Corrida

## PASO 5 — Borrar la tabla vieja de evidencias (opcional)

Ya verifiqué que **está vacía**: 0 filas, 0 puntos. Nadie pierde nada.
El `DROP` viene comentado al final de esa misma migración; descoméntalo si quieres limpiar.

- [ ] Hecho (o decidido dejarla)

## PASO 6 — Borrar `.env.seed.txt`

**Todavía NO.** Lo estoy usando para verificar contra datos reales. Cuando cerremos el detector:

```
Remove-Item .env.seed.txt
```

Ya está en `.gitignore`, así que no hay riesgo de que se suba.

- [ ] Borrado

---

# PENDIENTES QUE NO SON TÉCNICOS

## Para Daniel (antes de lanzar el detector)

Redactar en los términos con la empresa y en el aviso al trabajador la política que decidiste:
**si una empresa pide la identidad de un reportante anónimo, Ceduverse no la entrega.**

Con su límite honesto asentado: la identidad **sí existe** en la base (hace falta para acreditar
puntos), así que la protección es de política y control de acceso, no de imposibilidad técnica.
Al trabajador se le puede prometer "no se la damos a tu empresa"; **nunca** "nadie puede saberlo".

Ver `docs/superpowers/specs/2026-07-18-detector-riesgos-design.md` §13.

- [ ] Redactado

## Decisiones abiertas contigo

- **Cuaderno de estudio:** pausado en 6/10. Retomarlo cuando decidas.
- **QR a videos de YouTube en el cuaderno:** falta decidir entre biblioteca curada por instructor
  (links reales pegados a mano) o QR que abra una búsqueda del tema. La IA **no** puede inventar
  esos links.
