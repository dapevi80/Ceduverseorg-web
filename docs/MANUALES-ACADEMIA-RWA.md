# Manuales — Academia RWA (pasos que requieren tu entorno)

Estos pasos NO se pudieron correr en la sesión de desarrollo (no hay `.env` con
credenciales de Supabase en el repo). Córrelos tú con tus credenciales cuando estés
listo. Rama: `feat/rwa-onboarding-courses`.

## 1. Sembrar los cursos en la base de datos

Con `DATABASE_URL` / credenciales de Supabase configuradas en tu entorno:

```bash
npx tsx server/seed-studio.ts
```

Esperado: en el log aparecen los 3 cursos nuevos creados:
- `✓ Created course: ¿Qué es un RWA?`
- `✓ Created course: BrainShield + Vault 24k a fondo`
- `✓ Created course: Cómo vender RWA`

Es **idempotente**: correrlo otra vez imprime `already exists, skipping` y crea 0.

## 2. Verificar el gateo por rol (en la app, `npm run dev`)

Ir a la sección Studio/Onboarding y confirmar la matriz de visibilidad:

| Usuario | Curso 1 (Para Todos) | Curso 2 (Empresas) | Curso 3 (Socios) |
|---|---|---|---|
| Sin login | ✅ | ❌ | ❌ |
| socio_estudiante | ✅ | ❌ | ❌ |
| empresa / RH (team admin) | ✅ | ✅ | ❌ |
| socio_comercial / director | ✅ | ❌ | ✅ |
| admin / superadmin | ✅ | ✅ | ✅ |

## 3. Verificar contenido y recompensa

- Los módulos renderizan (HTML sanitizado) y el botón **"Leer en voz alta"** narra el texto.
- El quiz se toma y califica (passingScore 70).
- Completar un curso al 100% dispara el **logro** + el **certificado digital** estándar
  (diploma gratuito; NO aparece DC-3 ni SEP porque `dc3Available: false`).
- El **Tutor IA** (Q&A) responde usando los módulos como contexto.
- En Cursos 2 y 3, el módulo legal muestra el disclaimer exacto.

## 4. Gate antes de producción (merge a DeFiYogini/main)

- **Validación legal:** Daniel/Aimée revisan los disclaimers y el módulo legal del
  Curso 2 antes del merge a producción.
- **Comisiones (Curso 3, módulo 4):** confirmar con David el esquema de comisiones para
  venta de BrainShield/RWA (el módulo quedó con el esquema base Ceduverse + nota
  "pendiente de confirmar").
