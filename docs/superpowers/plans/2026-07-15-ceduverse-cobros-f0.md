# Ceduverse Cobros F0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cobrar de verdad los certificados DC-3/SEP (pay-first vía Stripe) y cablear la venta de hardware de `/ceduverse` al checkout real de `/tienda`, eliminando los dos mocks (solicitud gratuita + `alert()`).

**Architecture:** Reutiliza el patrón Stripe ya probado en `server/store-routes.ts`. El precio es server-authoritative (constante en `shared/`). Los certificados de pago crean una solicitud en `pending_payment` + Stripe Checkout; un **webhook dedicado** `/api/certificates/webhook` la mueve a `solicitado` al confirmar pago. El hardware de `/ceduverse` entrega su carrito a `/tienda` vía `localStorage` (mismo shape de carrito), sin duplicar checkout.

**Tech Stack:** Node/Express (TSX), Drizzle ORM + Postgres (Supabase), Stripe (SDK `stripe`), React + TanStack Query (cliente), Vitest (nuevo, para lógica pura).

## Global Constraints

- **Precio autoritativo en servidor:** el monto SIEMPRE se recalcula desde `certType` en el servidor; nunca se confía en un monto del cliente. Valores exactos: `dc3 = 499`, `sep = 1999` (MXN). `diploma` = gratis (sin cobro).
- **Sin degradación silenciosa:** si `STRIPE_SECRET_KEY` no está configurada, el endpoint de pago responde **503 explícito** (patrón de `store-routes.ts`), nunca "éxito" falso.
- **Webhook dedicado:** ruta `/api/certificates/webhook`, verificada con `STRIPE_WEBHOOK_SECRET_CERTS` (secret propio, distinto del de tienda). Sin ese secret → 403.
- **Idempotencia:** el webhook solo mueve `pending_payment → solicitado`; si ya está `solicitado`, es no-op.
- **No tocar el flujo de tienda existente** (`/api/store/*`) — el hardware lo reutiliza tal cual.
- **Stripe usa centavos:** `unit_amount = pesos * 100`.
- Moneda `mxn`. CFDI/factura fiscal queda manual (fuera de alcance).

---

### Task 1: Configurar Vitest (mínimo, para lógica pura)

El repo no tiene runner de tests. Se agrega Vitest solo para probar funciones puras (precio, mapeo de carrito, decisión del webhook). No se toca el build ni el dev server.

**Files:**
- Modify: `package.json` (devDependency + script `test`)
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: comando `npm test` (ejecuta vitest en modo run).

- [ ] **Step 1: Instalar vitest**

Run: `npm i -D vitest@^2`
Expected: se agrega a devDependencies sin errores.

- [ ] **Step 2: Crear `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["shared/**/*.test.ts", "server/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: { "@shared": new URL("./shared", import.meta.url).pathname },
  },
});
```

- [ ] **Step 3: Agregar script `test` a `package.json`**

En `"scripts"`, agregar:
```json
"test": "vitest run"
```

- [ ] **Step 4: Verificar runner (sin tests aún)**

Run: `npm test`
Expected: vitest arranca y reporta "No test files found" (o 0 tests) — confirma que el runner corre.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for pure-logic unit tests"
```

---

### Task 2: Módulo de precio de certificados (server-authoritative)

**Files:**
- Create: `shared/cert-pricing.ts`
- Test: `shared/cert-pricing.test.ts`

**Interfaces:**
- Produces:
  - `CERT_PRICES_MXN: { dc3: 499; sep: 1999 }`
  - `type PaidCertType = "dc3" | "sep"`
  - `isPaidCertType(t: string): t is PaidCertType`
  - `resolveCertPriceMxn(t: string): number` — devuelve el monto para dc3/sep, lanza `Error` para cualquier otro (incluido `diploma`).

- [ ] **Step 1: Escribir el test que falla**

`shared/cert-pricing.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { CERT_PRICES_MXN, isPaidCertType, resolveCertPriceMxn } from "./cert-pricing";

describe("cert-pricing", () => {
  it("precios exactos dc3=499, sep=1999", () => {
    expect(CERT_PRICES_MXN.dc3).toBe(499);
    expect(CERT_PRICES_MXN.sep).toBe(1999);
  });
  it("isPaidCertType reconoce dc3/sep y rechaza diploma/otros", () => {
    expect(isPaidCertType("dc3")).toBe(true);
    expect(isPaidCertType("sep")).toBe(true);
    expect(isPaidCertType("diploma")).toBe(false);
    expect(isPaidCertType("otro")).toBe(false);
  });
  it("resolveCertPriceMxn devuelve el monto de dc3/sep", () => {
    expect(resolveCertPriceMxn("dc3")).toBe(499);
    expect(resolveCertPriceMxn("sep")).toBe(1999);
  });
  it("resolveCertPriceMxn lanza para diploma o desconocido", () => {
    expect(() => resolveCertPriceMxn("diploma")).toThrow();
    expect(() => resolveCertPriceMxn("xxx")).toThrow();
  });
});
```

- [ ] **Step 2: Correr el test para verlo fallar**

Run: `npm test -- shared/cert-pricing.test.ts`
Expected: FAIL — "Cannot find module './cert-pricing'".

- [ ] **Step 3: Implementar el módulo**

`shared/cert-pricing.ts`:
```ts
// Fuente ÚNICA de verdad del precio de certificados. El servidor recalcula
// siempre desde aquí; el cliente solo lo muestra. NUNCA confiar en un monto
// enviado por el cliente.
export const CERT_PRICES_MXN = { dc3: 499, sep: 1999 } as const;

export type PaidCertType = keyof typeof CERT_PRICES_MXN;

export function isPaidCertType(t: string): t is PaidCertType {
  return t === "dc3" || t === "sep";
}

export function resolveCertPriceMxn(t: string): number {
  if (!isPaidCertType(t)) {
    throw new Error(`certType sin precio de pago: ${t}`);
  }
  return CERT_PRICES_MXN[t];
}
```

- [ ] **Step 4: Correr el test para verlo pasar**

Run: `npm test -- shared/cert-pricing.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/cert-pricing.ts shared/cert-pricing.test.ts
git commit -m "feat(certs): server-authoritative cert pricing module"
```

---

### Task 3: Migración — columnas de pago + estado `pending_payment`

Agrega a `certificate_requests`: `amount_mxn`, `stripe_session_id`, `paid_at`, y el valor `pending_payment` al enum `cert_request_status`.

**Files:**
- Modify: `shared/schema.ts` (enum `certRequestStatusEnum` y tabla `certificateRequests`)
- Create: `migrations/0007_cert_payment_fields.sql`

**Interfaces:**
- Produces: columnas `amountMxn` (int, nullable), `stripeSessionId` (text, nullable), `paidAt` (timestamptz, nullable) en el tipo `CertificateRequest`; estado `"pending_payment"` válido.

- [ ] **Step 1: Modificar el enum en `shared/schema.ts`**

Buscar `certRequestStatusEnum` y agregar `"pending_payment"` como PRIMER valor (para que sea el estado inicial de certificados de pago):
```ts
export const certRequestStatusEnum = pgEnum("cert_request_status", [
  "pending_payment",
  "solicitado",
  "en_proceso",
  "emitido",
  "rechazado",
]);
```

- [ ] **Step 2: Agregar columnas a la tabla `certificateRequests`**

En la definición de `certificateRequests` (después de `pdfUrl`), agregar:
```ts
  amountMxn: integer("amount_mxn"),
  stripeSessionId: text("stripe_session_id"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
```
(Verifica que `integer` esté importado desde `drizzle-orm/pg-core` al inicio del archivo; si no, agrégalo a la lista de imports.)

- [ ] **Step 3: Escribir la migración SQL**

`migrations/0007_cert_payment_fields.sql`:
```sql
-- Enum: nuevo estado inicial para certificados de pago
ALTER TYPE "cert_request_status" ADD VALUE IF NOT EXISTS 'pending_payment' BEFORE 'solicitado';

-- Columnas de pago
ALTER TABLE "certificate_requests" ADD COLUMN IF NOT EXISTS "amount_mxn" integer;
ALTER TABLE "certificate_requests" ADD COLUMN IF NOT EXISTS "stripe_session_id" text;
ALTER TABLE "certificate_requests" ADD COLUMN IF NOT EXISTS "paid_at" timestamptz;
```

- [ ] **Step 4: Verificar que compila el schema**

Run: `npx tsx -e "import('./shared/schema.ts').then(()=>console.log('schema OK'))"`
Expected: imprime `schema OK` sin errores de tipos.

- [ ] **Step 5: Commit**

```bash
git add shared/schema.ts migrations/0007_cert_payment_fields.sql
git commit -m "feat(certs): migration for payment fields + pending_payment status"
```

> **Manual (usuario):** aplicar `0007` en Supabase (SQL editor) o `npm run db:push`. `ALTER TYPE ... ADD VALUE` no corre dentro de transacción en algunos clientes — pegar la línea del enum por separado si falla.

---

### Task 4: Endpoint de solicitud con pago (pay-first)

Modifica `POST /api/me/certificates`: `diploma` sigue gratis; `dc3`/`sep` crean `pending_payment` + Stripe Checkout y devuelven `{ checkout_url }`.

**Files:**
- Modify: `server/routes/certificates.ts` (handler `POST /api/me/certificates`, ~líneas 13-55; imports al inicio)
- Create: `server/lib/stripe-client.ts` (cliente Stripe compartido, para no duplicar init)

**Interfaces:**
- Consumes: `resolveCertPriceMxn`, `isPaidCertType` (Task 2); `storage.createCertificateRequest`, `storage.updateCertificateRequest` (existentes).
- Produces: respuesta `{ checkout_url: string }` para certificados de pago; `201` con el request para diploma (comportamiento actual).

- [ ] **Step 1: Crear el cliente Stripe compartido**

`server/lib/stripe-client.ts`:
```ts
import Stripe from "stripe";

const KEY = process.env.STRIPE_SECRET_KEY || "";
export const stripe: Stripe | null = KEY ? new Stripe(KEY) : null;
export const BASE_URL = process.env.BASE_URL || "https://ceduverse.org";
```

- [ ] **Step 2: Agregar imports en `server/routes/certificates.ts`**

Al inicio del archivo, junto a los imports existentes:
```ts
import { isPaidCertType, resolveCertPriceMxn } from "@shared/cert-pricing";
import { stripe, BASE_URL } from "../lib/stripe-client";
```

- [ ] **Step 3: Insertar la rama de pago en el handler**

En `POST /api/me/certificates`, DESPUÉS de todas las validaciones existentes (curso existe, `dc3Disponible`, quiz aprobado, no duplicado) y ANTES del `storage.createCertificateRequest` actual, reemplazar la creación por esta lógica:

```ts
      // Diploma es gratis: comportamiento actual.
      if (!isPaidCertType(certType)) {
        const request = await storage.createCertificateRequest({
          userId, courseId, certType, status: "solicitado",
        });
        return res.status(201).json(request);
      }

      // dc3 / sep: pay-first. El monto se resuelve SIEMPRE en el servidor.
      if (!stripe) {
        return res.status(503).json({ message: "Pagos no disponibles: STRIPE_SECRET_KEY no configurada." });
      }
      const amount = resolveCertPriceMxn(certType);
      const request = await storage.createCertificateRequest({
        userId, courseId, certType, status: "pending_payment", amountMxn: amount,
      });
      const label = certType === "dc3" ? "Servicio de certificación DC-3 STPS" : "Constancia SEP";
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: (await storage.getUser(userId))?.email || undefined,
        line_items: [{
          price_data: {
            currency: "mxn",
            product_data: { name: `${label} — ${course.title}` },
            unit_amount: amount * 100,
          },
          quantity: 1,
        }],
        metadata: { kind: "certificate", certRequestId: String(request.id) },
        success_url: `${BASE_URL}/?cert=paid&view=certificates`,
        cancel_url: `${BASE_URL}/?cert=cancelled&view=certificates`,
      });
      await storage.updateCertificateRequest(request.id, { stripeSessionId: session.id });
      return res.status(200).json({ checkout_url: session.url });
```

(Nota: el `duplicate` en estado `rechazado` que hoy se reusa — mantener ese bloque tal cual arriba; para dc3/sep, tras reactivar a `pending_payment`, seguir a la creación del checkout. Si el reviewer ve que el reuse choca, mover el reuse a devolver también checkout con el mismo patrón.)

- [ ] **Step 4: Verificar compilación**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores nuevos en `certificates.ts` / `stripe-client.ts`.

- [ ] **Step 5: Smoke manual (documentar, no bloquear)**

Con `STRIPE_SECRET_KEY` de test en `.env`: `npm run dev`, autenticar, solicitar un DC-3 de un curso completado → la respuesta trae `checkout_url` y en la DB el request queda `pending_payment` con `amount_mxn = 499`. (Si no hay entorno, anotar como manual.)

- [ ] **Step 6: Commit**

```bash
git add server/routes/certificates.ts server/lib/stripe-client.ts
git commit -m "feat(certs): pay-first checkout for dc3/sep (server-authoritative price)"
```

---

### Task 5: Webhook dedicado de certificados

**Files:**
- Create: `server/lib/cert-webhook-logic.ts` (decisión pura, testeable)
- Test: `server/lib/cert-webhook-logic.test.ts`
- Modify: `server/routes/certificates.ts` (registrar `POST /api/certificates/webhook`)
- Modify: `server/index.ts` — confirmar que `req.rawBody` está disponible (ya existe, línea ~68)

**Interfaces:**
- Consumes: `req.rawBody` (Buffer/string) del parser global.
- Produces:
  - `decideCertTransition(current: string, paymentStatus: string): "confirm" | "noop"` — `"confirm"` solo si `current === "pending_payment"` y `paymentStatus === "paid"`.
  - ruta `POST /api/certificates/webhook`.

- [ ] **Step 1: Escribir el test de la lógica pura**

`server/lib/cert-webhook-logic.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { decideCertTransition } from "./cert-webhook-logic";

describe("decideCertTransition", () => {
  it("confirma cuando pending_payment y paid", () => {
    expect(decideCertTransition("pending_payment", "paid")).toBe("confirm");
  });
  it("noop si ya solicitado (idempotente)", () => {
    expect(decideCertTransition("solicitado", "paid")).toBe("noop");
  });
  it("noop si no pagó", () => {
    expect(decideCertTransition("pending_payment", "unpaid")).toBe("noop");
  });
});
```

- [ ] **Step 2: Correr el test para verlo fallar**

Run: `npm test -- server/lib/cert-webhook-logic.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar la lógica pura**

`server/lib/cert-webhook-logic.ts`:
```ts
export function decideCertTransition(current: string, paymentStatus: string): "confirm" | "noop" {
  if (current === "pending_payment" && paymentStatus === "paid") return "confirm";
  return "noop";
}
```

- [ ] **Step 4: Correr el test para verlo pasar**

Run: `npm test -- server/lib/cert-webhook-logic.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Registrar la ruta del webhook**

En `server/routes/certificates.ts`, dentro de `registerCertificateRoutes(app)`, agregar (usa el `stripe` compartido de Task 4):
```ts
  app.post("/api/certificates/webhook", async (req, res) => {
    try {
      if (!stripe) return res.sendStatus(200); // sin Stripe, nada que hacer
      const secret = process.env.STRIPE_WEBHOOK_SECRET_CERTS;
      if (!secret) return res.status(403).json({ message: "Webhook de certificados no configurado" });
      const sig = req.headers["stripe-signature"] as string;
      if (!sig) return res.status(400).json({ message: "Missing signature" });

      const event = stripe.webhooks.constructEvent((req as any).rawBody as string, sig, secret);
      if (event.type !== "checkout.session.completed") return res.sendStatus(200);

      const session = event.data.object as any;
      if (session.metadata?.kind !== "certificate") return res.sendStatus(200);

      const id = session.metadata?.certRequestId;
      const request = id ? await storage.getCertificateRequest(id) : null;
      if (!request) return res.sendStatus(200);

      const { decideCertTransition } = await import("../lib/cert-webhook-logic");
      if (decideCertTransition(request.status, session.payment_status) === "confirm") {
        await storage.updateCertificateRequest(request.id, {
          status: "solicitado",
          stripeSessionId: session.id,
          paidAt: new Date(),
        });
      }
      return res.sendStatus(200);
    } catch (e: any) {
      console.error("[certs] webhook error:", e.message);
      return res.sendStatus(400);
    }
  });
```

(Añadir `import { stripe } from "../lib/stripe-client";` si no quedó ya del Task 4 — ya está.)

- [ ] **Step 6: Verificar compilación**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores nuevos.

- [ ] **Step 7: Commit**

```bash
git add server/lib/cert-webhook-logic.ts server/lib/cert-webhook-logic.test.ts server/routes/certificates.ts
git commit -m "feat(certs): dedicated webhook confirms payment -> solicitado"
```

> **Manual (usuario):** en Stripe Dashboard → Webhooks, crear endpoint apuntando a `https://<dominio>/api/certificates/webhook` (evento `checkout.session.completed`) y poner su signing secret en env `STRIPE_WEBHOOK_SECRET_CERTS`.

---

### Task 6: Cliente — redirección a checkout + estado `pending_payment`

**Files:**
- Modify: `client/src/pages/certificates-tab.tsx` (import de precio, `requestMutation.onSuccess`, UI del estado `pending_payment`, `TYPE_CONFIG`)

**Interfaces:**
- Consumes: `{ checkout_url }` del endpoint (Task 4); `CERT_PRICES_MXN` (Task 2).

- [ ] **Step 1: Importar el precio compartido y ajustar `TYPE_CONFIG`**

Al inicio de `certificates-tab.tsx`:
```ts
import { CERT_PRICES_MXN } from "@shared/cert-pricing";
```
En `TYPE_CONFIG`, reemplazar los literales de precio por el módulo:
```ts
  dc3: { label: "DC-3 STPS", badge: "bg-amber-100 text-amber-800", price: `$${CERT_PRICES_MXN.dc3.toLocaleString()} MXN` },
  sep: { label: "Certificado SEP", badge: "bg-cedu-blue/10 text-cedu-blue", price: `$${CERT_PRICES_MXN.sep.toLocaleString()} MXN` },
```

- [ ] **Step 2: Redirigir a Stripe en `onSuccess`**

Reemplazar el cuerpo de `requestMutation.onSuccess` por:
```ts
    onSuccess: (data: any) => {
      if (data?.checkout_url) {
        window.location.href = data.checkout_url; // certificado de pago -> Stripe
        return;
      }
      toast({ title: "Solicitud enviada", description: "Tu certificado ha sido solicitado exitosamente." });
      queryClient.invalidateQueries({ queryKey: ["/api/me/certificates"] });
      setDialogOpen(false);
      setSelectedCourse("");
      setSelectedType("");
    },
```
(`apiRequest` debe devolver el JSON parseado; si devuelve `Response`, ajustar a `const d = await data.json()`.)

- [ ] **Step 3: Mostrar el estado `pending_payment` en la lista**

Donde se renderiza cada `cert` por estado, agregar una rama para `pending_payment` con botón "Completar pago" que re-dispara la solicitud (crea un checkout nuevo para el mismo certType/curso):
```tsx
{cert.status === "pending_payment" && (
  <div className="mt-2 text-xs text-amber-700">
    Pago pendiente.
    <button
      className="ml-2 underline"
      onClick={() => { setSelectedCourse(cert.courseId); setSelectedType(cert.certType); requestMutation.mutate(); }}
      data-testid={`btn-complete-payment-${cert.id}`}
    >Completar pago</button>
  </div>
)}
```

- [ ] **Step 4: Verificar build del cliente**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores nuevos en `certificates-tab.tsx`.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/certificates-tab.tsx
git commit -m "feat(certs): client redirects to Stripe + pending_payment UI"
```

---

### Task 7: Flow B — handoff del carrito hardware `/ceduverse` → `/tienda`

**Files:**
- Create: `client/src/lib/cedu-cart-handoff.ts` (helpers puros)
- Test: `client/src/lib/cedu-cart-handoff.test.ts` (se ejecuta con vitest; ajustar `include` si hace falta)
- Modify: `client/src/pages/ceduverse-private.tsx` (quitar `alert`, escribir carrito + navegar)
- Modify: `client/src/pages/tienda.tsx` (leer carrito al montar)

**Interfaces:**
- Produces:
  - `CEDU_CART_KEY = "cedu_cart"`
  - `type CeduCart = { vault: number; tangem2: number; tangem3: number }`
  - `writeCeduCart(cart: CeduCart): void` (a `localStorage`)
  - `readCeduCart(): CeduCart | null` (lee y BORRA la clave)

- [ ] **Step 1: Ampliar el `include` de vitest para `client/src/lib`**

En `vitest.config.ts`, `test.include`, agregar `"client/src/**/*.test.ts"`. (Requiere `environment: "jsdom"` solo si el test toca `window`; usaremos un mock de `localStorage`, así que `node` basta con inyectar un stub — ver test.)

- [ ] **Step 2: Escribir el test que falla**

`client/src/lib/cedu-cart-handoff.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { writeCeduCart, readCeduCart, CEDU_CART_KEY } from "./cedu-cart-handoff";

const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};

describe("cedu-cart-handoff", () => {
  beforeEach(() => { for (const k in store) delete store[k]; });
  it("escribe y lee el carrito con el mismo shape", () => {
    writeCeduCart({ vault: 1, tangem2: 2, tangem3: 0 });
    expect(readCeduCart()).toEqual({ vault: 1, tangem2: 2, tangem3: 0 });
  });
  it("readCeduCart borra la clave tras leer (one-shot)", () => {
    writeCeduCart({ vault: 1, tangem2: 0, tangem3: 0 });
    readCeduCart();
    expect(readCeduCart()).toBeNull();
    expect(store[CEDU_CART_KEY]).toBeUndefined();
  });
  it("readCeduCart devuelve null si no hay nada", () => {
    expect(readCeduCart()).toBeNull();
  });
});
```

- [ ] **Step 3: Correr el test para verlo fallar**

Run: `npm test -- client/src/lib/cedu-cart-handoff.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 4: Implementar los helpers**

`client/src/lib/cedu-cart-handoff.ts`:
```ts
export const CEDU_CART_KEY = "cedu_cart";
export type CeduCart = { vault: number; tangem2: number; tangem3: number };

export function writeCeduCart(cart: CeduCart): void {
  try { localStorage.setItem(CEDU_CART_KEY, JSON.stringify(cart)); } catch { /* no-op */ }
}

export function readCeduCart(): CeduCart | null {
  try {
    const raw = localStorage.getItem(CEDU_CART_KEY);
    if (!raw) return null;
    localStorage.removeItem(CEDU_CART_KEY); // one-shot handoff
    const c = JSON.parse(raw);
    return {
      vault: Number(c.vault) || 0,
      tangem2: Number(c.tangem2) || 0,
      tangem3: Number(c.tangem3) || 0,
    };
  } catch { return null; }
}
```

- [ ] **Step 5: Correr el test para verlo pasar**

Run: `npm test -- client/src/lib/cedu-cart-handoff.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Quitar el `alert` y hacer el handoff en `ceduverse-private.tsx`**

Reemplazar el `onClick` del botón "Pagar con tarjeta" (línea ~757) por:
```tsx
onClick={() => {
  writeCeduCart({ vault: cart.vault, tangem2: cart.tangem2, tangem3: cart.tangem3 });
  window.location.href = "/tienda";
}}
```
Y agregar el import arriba:
```ts
import { writeCeduCart } from "@/lib/cedu-cart-handoff";
```

- [ ] **Step 7: Leer el carrito al montar en `tienda.tsx`**

Junto al `useState` del carrito (línea ~257), agregar un `useEffect` de arranque:
```tsx
import { readCeduCart } from "@/lib/cedu-cart-handoff";
// ...dentro del componente, después del useState del cart:
useEffect(() => {
  const handed = readCeduCart();
  if (handed && (handed.vault || handed.tangem2 || handed.tangem3)) {
    setCart(handed);
  }
}, []);
```
(Verifica que `useEffect` esté importado de React.)

- [ ] **Step 8: Verificar compilación + tests**

Run: `npx tsc --noEmit -p tsconfig.json && npm test`
Expected: sin errores; todos los tests (pricing, webhook-logic, cart-handoff) PASS.

- [ ] **Step 9: Commit**

```bash
git add client/src/lib/cedu-cart-handoff.ts client/src/lib/cedu-cart-handoff.test.ts client/src/pages/ceduverse-private.tsx client/src/pages/tienda.tsx vitest.config.ts
git commit -m "feat(store): /ceduverse hardware hands off cart to real /tienda checkout"
```

---

## Manuales del usuario (post-implementación)

1. Aplicar `migrations/0007_cert_payment_fields.sql` en Supabase (o `npm run db:push`). Si `ALTER TYPE ... ADD VALUE` falla en transacción, correr esa línea suelta.
2. Stripe Dashboard → Webhooks: nuevo endpoint `POST /api/certificates/webhook` (evento `checkout.session.completed`) → poner secret en env `STRIPE_WEBHOOK_SECRET_CERTS`.
3. Confirmar `STRIPE_SECRET_KEY` y `BASE_URL` en el entorno del servidor.
4. Smoke end-to-end: (a) solicitar DC-3 de un curso completado → pagar en Stripe test → verificar que el request pasa a `solicitado` con `paid_at`; (b) desde `/ceduverse` armar carrito y "Pagar con tarjeta" → aterrizar en `/tienda` con el carrito precargado → completar checkout real.

## Fuera de alcance (este plan)

- Capa Web3 / sello RAW / NFT (plan F1 y F2 aparte — ver master doc).
- Actualización de copy legal / T&C (plan aparte, requiere sign-off de Daniel/CLO).
- Automatización de CFDI.
