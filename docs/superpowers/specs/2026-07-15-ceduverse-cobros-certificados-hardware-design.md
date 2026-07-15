# Spec — Cobros reales Ceduverse: certificados DC-3/SEP + tarjeta hardware

**Fecha:** 2026-07-15
**Repo:** ceduverse-web (fork dapevi80), rama base `feat/rwa-onboarding-courses`
**Autor:** David Pérez Villaseñor (con Claude)

## Problema

Dos superficies muestran precio pero **no cobran** (mock):

1. **Certificados DC-3 ($499 MXN) y SEP ($1,999 MXN)** — `client/src/pages/certificates-tab.tsx`.
   Solicitar hace `POST /api/me/certificates` que crea la solicitud en estado `solicitado`
   **gratis**; el admin luego la emite. El precio solo vive en el cliente (`TYPE_CONFIG`),
   lo cual es inseguro. El diploma NFT sí es legítimamente gratis.
2. **Tarjeta hardware** — `client/src/pages/ceduverse-private.tsx:757`. El botón
   "Pagar con tarjeta" hace `alert("...Redirigiendo a pago...")` — checkout falso.
   Vende Vault Card ($2,999), Tangem 2-pack ($1,375), Tangem 3-pack ($1,750): producto
   físico con envío.

## Decisiones tomadas (brainstorm 2026-07-15)

- **Modelo de cobro de certificados:** híbrido — Stripe automático facturado como
  **servicio de certificación** (giro de capacitación de Ceducap S.C. de C. de RL de CV),
  separado de las aportaciones cooperativas. Fiscalmente limpio y automatizado.
- **Forma del flujo de certificados:** **pay-first**. El admin nunca trabaja un
  certificado impago.
- **Alcance:** ambos huecos en un solo spec, pero **dos flujos separados** por su
  naturaleza fiscal distinta (servicio vs producto físico).
- **Webhook de certificados:** **dedicado** `/api/certificates/webhook`, con su propio
  signing secret. No toca el webhook de tienda que ya funciona.

## Restricción de negocio

Ceduverse (Ceducap S.C. de C. de RL de CV, cooperativa de consumo) cobra aportaciones
cooperativas vía factura manual; Stripe se usa para productos físicos de la tienda. El
certificado se trata como **servicio de certificación** (no aportación), por lo que sí
entra por Stripe con etiqueta fiscal explícita. La **emisión del CFDI sigue siendo
manual** (fuera de alcance de código); el spec solo deja el rastro etiquetado en Stripe.

## Infraestructura reutilizada (ya existe y funciona)

- `server/store-routes.ts`: patrón Stripe real y probado (create-order → checkout session
  con metadata → webhook que verifica firma y marca `paid` + side effects). Server-
  authoritative: el monto se calcula desde la BD, nunca del cliente.
- `server/index.ts:68`: `req.rawBody` capturado globalmente (Stripe webhooks funcionan).
- `client/src/pages/tienda.tsx`: checkout **completo** de producto físico — formulario de
  envío, `POST /api/store/shipping-quote`, `POST /api/store/create-order` → `checkout_url`
  → redirect. Carrito en estado `{ vault, tangem2, tangem3 }`.
- `server/seed-store.ts`: los 3 productos ya sembrados (`vault_kit` $2,999,
  `tangem_2pack` $1,375, `tangem_3pack` $1,750) con stock y dimensiones para Envia. Los
  precios coinciden con los mostrados en `/ceduverse`.
- `server/routes/certificates.ts`: endpoint actual de solicitud (gratuito) + gestión admin.

---

## Flow A — Certificados DC-3/SEP (servicio, pay-first)

### A.1 Precio autoritativo en servidor
Crear `shared/cert-pricing.ts` con la fuente única:
```ts
export const CERT_PRICES_MXN = { dc3: 499, sep: 1999 } as const;   // diploma = gratis
export type PaidCertType = keyof typeof CERT_PRICES_MXN;
```
- El servidor **siempre** recalcula el monto desde `certType`; jamás confía en un monto
  del cliente.
- `certificates-tab.tsx` importa `CERT_PRICES_MXN` en vez del literal duplicado en
  `TYPE_CONFIG` (elimina el precio inseguro del cliente).

### A.2 Migración `certificate_requests`
Nueva migración en `migrations/`:
- `+ amount_mxn integer` (null para diploma; monto cobrado para dc3/sep)
- `+ stripe_session_id text`
- `+ paid_at timestamptz`
- `+ 'pending_payment'` como nuevo valor del enum `cert_request_status`

Actualizar `shared/schema.ts` (`certRequestStatusEnum` y la tabla `certificateRequests`)
para reflejar las columnas y el nuevo estado.

### A.3 `POST /api/me/certificates` (server/routes/certificates.ts)
- **diploma** (gratis): sin cambios → crea `solicitado` directamente.
- **dc3 / sep** (pago): mantiene todas las validaciones actuales (curso existe, `dc3Disponible`,
  quiz aprobado, no duplicado). Luego:
  1. Calcula `amount = CERT_PRICES_MXN[certType]`.
  2. Crea el request en estado `pending_payment` con `amount_mxn`.
  3. Crea Stripe checkout session:
     - `mode: "payment"`, `customer_email`, `currency: "mxn"`
     - `line_items[0].price_data.product_data.name`:
       `"Servicio de certificación DC-3 STPS"` / `"Constancia SEP"` (rastro fiscal)
     - `unit_amount: amount * 100`
     - `metadata: { kind: "certificate", certRequestId }`
     - `success_url` / `cancel_url` a la vista de certificados
  4. Guarda `stripe_session_id` en el request y responde `{ checkout_url }`.
- Si Stripe no está configurado (`!stripe`): responder 503 explícito (sin degradación
  silenciosa), igual que `store-routes.ts`.
- **Reintento tras rechazo:** si existe un duplicado en estado `rechazado`, se reusa (como
  hoy) pero para dc3/sep vuelve a `pending_payment` + nuevo checkout.

### A.4 Webhook dedicado `POST /api/certificates/webhook`
- Ruta nueva en `server/routes/certificates.ts`, montada **antes** de cualquier parser que
  consuma el body (usa `req.rawBody` como el store).
- Verifica firma con `STRIPE_WEBHOOK_SECRET_CERTS`. Si falta → 403 (no procesar sin
  verificar).
- Solo maneja `checkout.session.completed`. Si `metadata.kind !== "certificate"` → 200 y
  salir.
- Si `payment_status === "paid"` y el request está en `pending_payment`:
  `pending_payment → solicitado`, set `paid_at`, `stripe_session_id`. Idempotente (si ya
  está `solicitado`, no-op). Recién aquí entra a la cola del admin.
- Si no pagó: dejar en `pending_payment` (el alumno puede reintentar) — no borrar.

### A.5 Cliente `certificates-tab.tsx`
- `requestMutation.onSuccess`: si la respuesta trae `checkout_url` → `window.location.href`
  a Stripe; si no (diploma) → toast "Solicitud enviada" como hoy.
- El diálogo importa `CERT_PRICES_MXN` para mostrar el precio.
- Mostrar el estado `pending_payment` en la lista ("Pago pendiente" con botón "Completar
  pago"). Como las sesiones de Stripe expiran, "Completar pago" **re-solicita** (crea un
  checkout nuevo para ese mismo request `pending_payment`, sin duplicar el registro).

---

## Flow B — Tarjeta hardware (producto físico, reutiliza /tienda)

### B.1 Quitar el mock
Eliminar el `alert()` en `ceduverse-private.tsx:757`.

### B.2 Handoff al checkout real de /tienda
- El carrito de `/ceduverse` (`{ vault, tangem2, tangem3 }`) tiene **la misma forma** que
  el de `/tienda`.
- "Pagar con tarjeta" → escribe el carrito en `localStorage` (clave `cedu_cart`) y navega a
  `/tienda`.
- `tienda.tsx`: al montar, si existe `localStorage.cedu_cart`, inicializa `cart` con esos
  valores y limpia la clave. El resto del checkout (envío, Envia, Stripe, precio de BD) ya
  es real y server-authoritative.
- Mapeo de productos (ya consistente): `vault→vault_kit`, `tangem2→tangem_2pack`,
  `tangem3→tangem_3pack`. Precios idénticos a la BD, sin discrepancia.

---

## Testing

- **Flow A:**
  - Unit del resolvedor de precio: `certType→monto` correcto; `certType` desconocido se
    rechaza; diploma → sin cobro.
  - Transición del webhook: solo `paid` mueve `pending_payment → solicitado`; idempotencia;
    `kind !== certificate` se ignora.
- **Flow B:**
  - Test del handoff: carrito `/ceduverse` → `localStorage` → `cart` de `/tienda` con
    slugs/cantidades correctos; limpieza de la clave.

## Manuales del usuario (post-implementación)

- Aplicar la migración de `certificate_requests` en la BD (Supabase).
- Crear el 2º endpoint de webhook en el dashboard de Stripe apuntando a
  `/api/certificates/webhook` y poner `STRIPE_WEBHOOK_SECRET_CERTS` en el entorno.
- Smoke end-to-end: solicitar un DC-3 real → pagar en Stripe test → verificar que pasa a
  `solicitado`; comprar hardware desde `/ceduverse` → llegar a `/tienda` con carrito
  precargado → completar checkout.

## Fuera de alcance (YAGNI)

- Automatización de emisión de CFDI (sigue manual como las aportaciones).
- Reembolsos / cancelaciones de certificados.
- Descuentos/cupones en certificados (la tienda ya tiene referral codes; certificados no).
- Rediseño del UI de venta de `/ceduverse` (solo se cablea el pago).
