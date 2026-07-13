# Auditoría Ceduverse (CÓDIGO VIVO) · Referidos + Estudiante→Socio Comercial

> Workflow multi-agente (Fable), 2026-07-13. Sobre `DeFiYogini/Ceduverseorg-web@3e288e4` — el código que corre en Render/ceduverse.org. Reemplaza la auditoría anterior (que era del repo viejo `dapevi80/ceduverse-org`). Leyenda: ✅ verificado en el código · 📋 citado por la auditoría · 💡 recomendación.

---

# REPORTE EJECUTIVO — Referidos y Flujo Estudiante→Socio Comercial
**Ceduverse (Express/Render, commit 3e288e4) · HQ Kakaw Ops · 2026-07-13**

Consolidé las dos auditorías y **re-verifiqué directamente en el código los hallazgos críticos** antes de emitir este reporte. Cada afirmación está marcada: ✅ = verificado por mí en el repo, 📋 = citado por la auditoría (consistente, no re-verificado línea por línea), 💡 = recomendación de diseño.

---

## 1) Estado real — sin exagerar

### Lo que SÍ funciona hoy
| Componente | Estado | Evidencia |
|---|---|---|
| **Tienda: flujo de código de descuento** | Sano en su núcleo | 📋 Validación server-side en create-order, descuento al crear orden, acreditación solo al pagar vía webhook Stripe con firma + doble idempotencia (`server/store-routes.ts:203-211, 329-387`) |
| **Cambio de rol genérico (superadmin)** | Completo y vivo | ✅ `PATCH /api/admin/users/:id/role` con razón obligatoria, whitelist de 8 roles, audit-log con IP (`server/routes/admin.ts:380-413`). UI viva en `/admin` con confirmación y historial (`client/src/pages/admin-panel.tsx`) |
| **Ecosistema post-promoción a socio** | Funciona al instante | 📋 `requirePartner` lee rol de DB por request (`server/auth.ts:657-680`); `/partner` dashboard con stats/códigos/comisiones ya renderiza (`App.tsx:64`, `server/routes.ts:411-519`); sidebar muestra "Panel Socio" al refetch |
| **Motor de comisiones CRM** | Funciona (vía distinta) | 📋 `POST /api/crm/commissions/generate` deriva de `teams.partnerId` + pagos confirmados (`server/routes/crm.ts:174-227`) |

### Lo que NO funciona
- **El sistema de referidos de cuentas está completamente inoperante en producción.** Ninguna ruta persiste una atribución: los códigos válidos revientan por FK (500) y los códigos que el usuario ve se descartan en silencio. ✅ Verificado (detalle en sección 2).
- **Ninguna atribución por código de referido genera comisión.** ✅ `referralCommission = 0` hardcodeado en `server/routes.ts:952` mientras `REFERRAL_PER_COMPANY = 500` se anuncia en la línea 946 y la landing de socios promete $300-500/empresa.
- **El flujo dedicado de promoción a socio comercial es inalcanzable.** ✅ `AdminPartnersTab` existe en `admin-dashboard.tsx:408` pero admin-panel solo importa `AdminCertsTab` (`admin-panel.tsx:26-28`) y `admin-dashboard` no tiene ruta en `App.tsx` (solo `/admin` → admin-panel, línea 30). Código muerto confirmado.
- **`POST /api/admin/partners` es un bypass del audit.** ✅ Cambia rol sin `roleChangeLog`, sin razón, cero side-effects (`admin.ts:366-378`) — contrasta con el PATCH que sí audita a 15 líneas de distancia.

---

## 2) Referidos: hallazgos + plan

### Arquitectura: 4 mecanismos paralelos que no se hablan
📋 (A) folio cooperativo en `accounts.referralCode/referredBy`, (B) tabla `referralCodes` (partner `P-…` y auto-generados `slug-XXXX`), (C) tienda `storeReferralCodes/Uses`, (D) invitaciones de empleado. Solo C está sano. Comisiones (`partnerCommissions`) no consumen ningún código — se generan de `teams.partnerId`.

### Bugs (los 3 críticos re-verificados por mí)

**BUG 1 — CRÍTICO ✅: `accounts.referredBy` es inescribible.** El FK apunta a `accounts.referral_code` (self-reference, `shared/schema.ts:86-89` — lo leí: `foreignColumns: [table.referralCode]`), pero el servidor valida y escribe códigos de la tabla `referralCodes` (`server/routes/courses.ts:509-513` — lo leí). Esos códigos nunca existen en `accounts.referral_code` → todo UPDATE viola el FK → 500. Efecto colateral grave: en el onboarding, `accountSetup: 1` viaja en el mismo UPDATE → **el usuario referido queda atrapado en el onboarding**. Vía invitación de empresa, explota después de marcar la invitación `accepted` → invitación quemada + 500.

**BUG 2 — CRÍTICO ✅: los códigos que el usuario ve no validan.** El folio `SC-…` se guarda en `accounts.referralCode` y el dashboard lo exhibe como código a compartir, pero **nunca se inserta en `referralCodes`** — verifiqué que solo hay 2 puntos de `insert(referralCodes)` en todo el server (`routes.ts:492` y `1292`, ambos generan `P-…`/`slug-XXXX`, ninguno folios SC). La validación busca solo en `referralCodes` → "Código no válido" o descarte silencioso con 200. **Combinación letal con BUG 1: no existe ningún camino exitoso de atribución.**

**BUG 3 — ALTO ✅: `?ref=` nunca se captura en el cliente.** Grep en `auth.tsx`: cero capturas del query param `ref` (solo lee `invite`). Todos los links virales de ShareCourseModal e invitaciones de empresa son letra muerta; la única entrada es el input manual del onboarding.

**BUG 4 — MEDIO ✅ (visible en courses.ts:514-516):** `usageCount` se incrementa con read-modify-write no atómico y **antes** del UPDATE que siempre falla → cada retry infla el contador sin atribución.

**BUG 5 — MEDIO ✅:** comisión de referido jamás se escribe (`routes.ts:952` = 0 hardcodeado); `storeReferralCodes.commissionPct` sin ledger. 📋

**BUGS 6-7 — BAJOS ✅/📋 (tienda):** `expiresAt` solo se checa en `/validate-referral` (`store-routes.ts:99`, único match de `expiresAt` en el archivo — verificado) pero no en create-order → código expirado aplicado directo obtiene descuento. Tipos rotos: `storeReferralCodes.ownerId` integer vs `users.id` uuid → imposible ligar código de tienda a usuario. 📋

### Plan de reparación (orden interno)
1. 💡 **Fuente única = `referralCodes`.** Migración: insertar un renglón `ownerType:'member'` por cada folio SC- existente; cambiar el FK de `accounts.referredBy` a `referral_codes.code` (o eliminarlo y validar en aplicación). Mata bugs 1 y 2 de raíz.
2. 💡 **Capturar `?ref=`** en `auth.tsx` (junto a `invite`) → localStorage → pre-llenar el input del onboarding. Mata bug 3.
3. 💡 **Transacción de atribución** en courses.ts: UPDATE de cuenta primero, `usageCount = sql\`usage_count + 1\`` solo si tuvo éxito. En empresa.ts, atribuir antes de marcar `accepted`. Mata bug 4.
4. 💡 **Comisiones**: requiere decisión de negocio (sección 4).
5. 💡 **Tienda**: check de `expiresAt` en create-order (1 línea); migrar `ownerId` a uuid solo si se decide pagar `commissionPct`.

---

## 3) Estudiante → Socio Comercial: qué existe y diseño para completarlo

### Existe hoy (verificado)
- ✅ El cambio de rol **ya se puede hacer**: `/admin` → tab usuarios → detalle → select de rol (solo superadmin), con razón obligatoria, delta de permisos y audit-log. Funciona, pero está enterrado y nadie lo percibe como "el flujo de partners".
- ✅ `POST /api/admin/partners` vivo en server pero sin audit ni side-effects; su UI (`AdminPartnersTab`) es código muerto sin import ni ruta.
- 📋 Post-promoción todo funciona sin re-login: gates leen DB por request, `/partner` renderiza datos reales, el partner puede auto-crear códigos `P-…`.
- 📋 **Gap real**: cero onboarding — sin código inicial, sin email de bienvenida (no existe `sendPartnerWelcomeEmail` en `server/email.ts`), sin aviso de que `/partner` existe. El promovido aterriza en un dashboard vacío.

### Diseño para completarlo (💡 recomendación, reutiliza el 80% existente)

**Pasos, en orden:**

1. **Extraer `promoteToPartner(userId, changedBy, reason, ip)`** y usarla desde ambos endpoints (el PATCH genérico y el POST de partners). Lógica:
   - Validar: usuario existe; si ya es `socio_comercial` → 409; `reason` obligatoria (paridad con `admin.ts:383`).
   - `updateAccount(userId, { userRole: "socio_comercial" })`.
   - Insert en `roleChangeLog` (copiar bloque `admin.ts:402-409`) — cierra el bypass de audit.
   - **Código de referido inicial**: si no existe activo para ese owner, crear uno con la lógica de `POST /api/partner/referrals` (`routes.ts:491-499`), label "Inicial", comisión default. Nota: esto depende de que el paso 1 de referidos (fuente única) esté hecho para que el código realmente atribuya.
   - Email `sendPartnerWelcomeEmail(email, nombre, código)` — patrón de `sendSamPartnerNotificationEmail`, best-effort en try/catch para no romper la promoción.
   - Respuesta `{ account, referralCode, emailSent }`.
2. **UI**: nueva tab `partners` en `admin-panel.tsx` — **mover** (no duplicar) `AdminPartnersTab` desde admin-dashboard, con buscador de usuarios existentes en lugar de email libre (reusar el fetch de `EnhancedUsersTab`). Marcar `admin-dashboard.tsx` deprecated.
3. **Detalle de bajo costo**: en `UserDetailPanel`, cuando `newRole === "socio_comercial"`, mostrar en el dialog el checklist de side-effects que se ejecutarán.
4. **Permisos**: mantener `requireSuperadmin` para promover; `GET /api/admin/partners` queda en `requireAdmin` (admin ve, superadmin promueve).
5. **Opcional**: aceptar `teamIds[]` para asignar `teams.partnerId` en la misma transacción si el estudiante ya trae empresas — así el motor CRM le genera comisiones desde el día 0.

**Esfuerzo**: ~medio día (1 refactor de endpoint + 1 template de email + mover 1 tab).

---

## 4) Orden de ejecución + decisiones de negocio pendientes

### Secuencia recomendada 💡
| # | Bloque | Por qué este orden | Esfuerzo |
|---|---|---|---|
| 1 | **Hotfix referidos** (migración FK + folios SC→referralCodes + transacción atómica) | Es el único bloque donde usuarios reales quedan **atrapados en onboarding** e invitaciones se queman — bug activo en producción | 0.5-1 día |
| 2 | **Captura de `?ref=`** en cliente | Sin esto, arreglar el backend no genera volumen: todo link compartido sigue muerto | 2-3 h |
| 3 | **Flujo promoción a socio** (endpoint consolidado + tab + email) | Depende de #1 para que el código inicial del partner funcione | 0.5 día |
| 4 | **Comisiones por referido** | Bloqueado por decisión de negocio (abajo) | 0.5-1 día tras decisión |
| 5 | **Tienda menor** (`expiresAt` en create-order; uuid solo si se paga commissionPct) | Riesgo bajo, exposición acotada | 1-2 h |

### Requiere decisión de negocio (no lo puede decidir ingeniería)
1. **¿El bono por referido es real?** Hoy hay una contradicción viva: la landing de socios promete $300-500/empresa y el código anuncia $500 pero escribe $0. Opciones: (a) implementarlo — que `/api/crm/commissions/generate` haga join `accounts.referredBy → referralCodes.ownerId`; o (b) retirar la promesa de la landing y `REFERRAL_PER_COMPANY`. **Dejarlo como está es un pasivo comercial**: se está prometiendo públicamente algo que el sistema no paga.
2. **¿Quién califica para socio comercial?** Hoy cualquier superadmin promueve a cualquiera sin criterio. Definir: requisitos (¿membresía cooperativa vigente?, ¿N referidos previos?), y si la promoción es solo top-down o existe solicitud del estudiante.
3. **¿% de comisión del código inicial?** El default actual es 10; confirmar si aplica al código "Inicial" auto-creado y si varía por tier.
4. **¿La tienda paga `commissionPct`?** Si sí, se justifica la migración de tipos integer→uuid; si no, se documenta el campo como descuento puro y se ahorra la migración.

### Veredicto honesto
El subsistema de tienda y el motor CRM de comisiones están sanos. El **cambio de rol ya existe y audita bien** — lo que falta es empaquetarlo como flujo de producto (medio día). En cambio, el **sistema de referidos de cuentas está 100% roto en producción** (verificado en código, no es hipótesis): ningún código atribuye, algunos rompen el onboarding del usuario nuevo, y ninguna atribución paga. Antes de invertir en crecimiento viral, el bloque 1 es prerequisito absoluto.

**Archivos clave**: `C:\Users\user\Documents\ceduverse-web\shared\schema.ts` (FK roto, :86-89) · `server\routes\courses.ts` (atribución, :505-520) · `server\routes\admin.ts` (endpoints promoción, :366-413) · `server\routes.ts` (comisión $0, :946-966) · `client\src\pages\admin-panel.tsx` (import muerto, :26-28) · `client\src\pages\admin-dashboard.tsx` (AdminPartnersTab, :408) · `server\store-routes.ts` (expiresAt, :99).

---

# Anexo A · Referidos (agente, detalle)

La auditoría está completa. Reporte:

---

# AUDITORÍA — Sistema de Referidos Ceduverse (commit 3e288e4, Express/Render)

## 1) Mecanismos existentes y redundancia

Existen **4 mecanismos paralelos** más un sistema de comisiones desacoplado:

| # | Mecanismo | Tablas | Estado |
|---|-----------|--------|--------|
| A | Folio cooperativo como código | `accounts.referralCode` / `accounts.referredBy` (shared/schema.ts:77-89) | Roto (ver bugs 1-2) |
| B | Códigos generales | `referralCodes` (schema.ts:352-364) — partner (`P-…`, routes.ts:487-502) y auto-generados por usuario (`slug-XXXX`, routes.ts:1292-1298) | Roto (ver bug 1) |
| C | Tienda | `storeReferralCodes` / `storeReferralUses` (schema.ts:1943-1955, 2013-2019) | **El único sano en su núcleo** |
| D | Invitaciones de empleado | `employeeInvitations.referralCode` (schema.ts:1866), copia códigos de B | Roto (ver bug 1) |

**Comisiones**: `partnerCommissions` se genera manualmente por admin desde `teams.partnerId` + `companyPayments` (server/routes/crm.ts:174-227). **No consume ningún código de referido** — la atribución por código nunca produce comisión. No hay autoritativo real: A es lo que el dashboard muestra al usuario, B es lo que valida el servidor, y no se hablan entre sí.

## 2) Bugs confirmados (con archivo:línea)

**BUG 1 — CRÍTICO: `accounts.referredBy` es inescribible en producción (FK contra la tabla equivocada).**
El FK `accounts_referred_by_accounts_referral_code_fk` apunta a `accounts.referral_code` (shared/schema.ts:86-89; migrations/0000_long_newton_destine.sql:915), pero el servidor valida y escribe códigos de la tabla `referralCodes` (server/routes/courses.ts:509-513). Los códigos de `referralCodes` (`P-…`, `slug-XXXX`) **nunca** existen en `accounts.referral_code` (ningún código de `insert(referralCodes)` en routes.ts:492/1292 se copia a accounts). Resultado: todo `UPDATE accounts SET referred_by=…` viola el FK → 500.
- Vía onboarding: PATCH `/api/me/account` (courses.ts:520 → storage.ts:230) explota, y como `accountSetup: 1` va en el mismo UPDATE (client/src/pages/onboarding.tsx:235-239), **el usuario referido queda atrapado en el onboarding**.
- Vía invitación de empresa: server/routes/empresa.ts:577-580 explota igual (el código viene de `referralCodes` del partner, empresa.ts:169-171), y **después** de que la invitación ya se marcó `accepted` (empresa.ts:562-564) → invitación quemada + 500 al usuario.

**BUG 2 — CRÍTICO (complemento): los códigos que sí se muestran al usuario no validan.**
El folio cooperativo `SC-…` se guarda en `accounts.referralCode` (routes.ts:285-287; server/auth.ts:404; server/routes/membership.ts:53-55) pero **nunca se inserta en `referralCodes`**. `/api/me/referral` lo devuelve como código a compartir (routes.ts:1266-1272) y el dashboard lo exhibe como "código de referido" (client/src/pages/dashboard.tsx:448-463), pero la validación de `/api/referral/:code` (routes.ts:1236-1239) y del PATCH (courses.ts:509-511) buscan solo en `referralCodes` → el folio sale "Código no válido" / se descarta **silenciosamente** (el PATCH responde 200 sin atribuir). Ningún camino tiene éxito: los códigos B revientan por FK (bug 1), los códigos A se ignoran en silencio.

**BUG 3 — ALTO: el parámetro `?ref=` no se captura en NINGÚN punto del cliente.**
ShareCourseModal genera links `?ref=CODE` (client/src/components/ShareCourseModal.tsx:95-96) y empresa.ts:221/261 genera `/auth?ref=…&invite=…`, pero auth.tsx solo lee `invite` (client/src/pages/auth.tsx:94-111) y ningún archivo de client/src lee el query param `ref` (grep exhaustivo: cero capturas, ni localStorage). Todo link viral es letra muerta; la única captura es el input manual del onboarding (onboarding.tsx:188-237).

**BUG 4 — MEDIO: contador `usageCount` no atómico e inflable.**
courses.ts:514-516 incrementa con read-modify-write (`ref.usageCount + 1`, no `sql\`+1\``) y **antes** de escribir `accounts.referredBy`. Con el bug 1, el UPDATE posterior siempre falla pero el contador ya subió; como `referredBy` nunca persiste, el guard `alreadyReferred` (courses.ts:507-508) nunca bloquea reintentos → cada retry infla el contador sin atribución real.

**BUG 5 — MEDIO: comisiones de referido jamás se escriben.**
- Instructor: `referralCommission = 0` hardcodeado (routes.ts:952) aunque se anuncia `REFERRAL_PER_COMPANY = 500` (routes.ts:946) y la landing de socios promete $300-500/empresa (client/src/pages/socios-landing.tsx:240-244).
- `referralCodes.commission` (schema.ts:358) solo se usa para una estimación fallback en stats (routes.ts:433); nunca genera renglón en `partnerCommissions`.
- Tienda: `storeReferralCodes.commissionPct` (schema.ts:1949) no se lee en ningún otro archivo del repo — no existe ledger de comisión de tienda.

**BUG 6 — BAJO (tienda): `create-order` no valida `expiresAt`.**
`/api/store/validate-referral` sí lo checa (server/store-routes.ts:99) pero `create-order` solo checa `isActive` y `maxUses` (store-routes.ts:203-211) → un código expirado aplicado directo al POST obtiene descuento.

**BUG 7 — BAJO (tienda): tipos rotos para atribución.**
`storeReferralCodes.ownerId` es `integer` sin FK (schema.ts:1946) y `users.id` es `uuid` (schema.ts:67) → imposible ligar un código de tienda a un usuario real; ídem `storeOrders.userId` integer (schema.ts:1960). Además `maxUses` tiene carrera leve: `currentUses` solo incrementa en webhook, así que N órdenes pendientes simultáneas pasan el check.

**Lo que SÍ está sano (tienda, núcleo):** validación server-side del código en create-order (store-routes.ts:203-211), descuento aplicado al crear la orden, y **acreditación del uso solo al pagar** vía webhook Stripe verificado con firma (store-routes.ts:329-340), con doble idempotencia: transición `paid && status === 'pending_payment'` (línea 359) + check de `storeReferralUses` existente antes de insertar (líneas 373-387). Ese patrón es el correcto.

## 3) Plan de consolidación

1. **Elegir `referralCodes` como fuente única.** Migración: (a) insertar en `referralCodes` un renglón `ownerType:'member'` por cada `accounts.referralCode` existente (folios SC-); (b) **cambiar el FK de `accounts.referredBy` para referenciar `referral_codes.code`** (o eliminar el FK y validar solo en aplicación). Esto arregla bugs 1 y 2 de raíz.
2. **Capturar `?ref=` en el cliente**: en auth.tsx (junto a `invite`), guardarlo en `localStorage('cedu_ref')` y enviarlo en el PATCH del onboarding pre-llenando el input. Arregla bug 3.
3. **Atomicidad**: en courses.ts, hacer la atribución en una transacción: `UPDATE accounts` primero, y `usageCount = sql\`usage_count + 1\`` solo si aquel tuvo éxito. En empresa.ts, mover el update de `referredBy` antes de marcar la invitación `accepted` (o transacción) y validar el código.
4. **Comisiones**: decidir si el bono por referido es real; si sí, que `/api/crm/commissions/generate` haga join con `accounts.referredBy → referralCodes.owner_id` en lugar de solo `teams.partnerId`; si no, quitar `REFERRAL_PER_COMPANY`/promesas de la landing.
5. **Tienda (menor)**: añadir check de `expiresAt` en create-order; migrar `ownerId`/`userId` a uuid si se quiere pagar `commissionPct`; opcionalmente contar usos pendientes contra `maxUses`.
6. **Eliminar redundancia D**: el `?ref=` en URLs de invitación es peso muerto (la atribución va server-side por token); quitarlo o dejarlo tras el paso 2.

**Veredicto**: el subsistema de tienda es sano en flujo de pago/idempotencia (solo bugs 6-7 menores y comisión no implementada). El sistema general de referidos de cuentas está **completamente inoperante en producción**: ninguna ruta logra persistir una atribución (falla por FK o se descarta en silencio), y ninguna atribución genera comisión.

---

# Anexo B · Roles y admin (agente, detalle)

AUDITORÍA — Flujo socio_estudiante → socio_comercial (repo C:/Users/user/Documents/ceduverse-web)

## 1) Lo que YA EXISTE en el código

**A. Endpoint genérico de cambio de rol — COMPLETO y VIVO**
- `PATCH /api/admin/users/:id/role` — `server/routes/admin.ts:380-413`. Gate `requireSuperadmin`. Valida `reason` (mín. 3 chars, línea 383), mapea roles legacy (`partner→socio_comercial`, línea 386), valida contra whitelist de 8 roles (388), actualiza `accounts.userRole` (399) e inserta en `roleChangeLog` con IP y `changedBy` (402-409). Audit-log ya resuelto.
- UI viva: `client/src/pages/admin-panel.tsx` (ruta `/admin`, `App.tsx:60`) → `UserDetailPanel` (1292). Select de rol + botón "Cambiar" solo visible a superadmin (1550-1572), diálogo de confirmación con `RoleChangeDelta` (permisos ganados/perdidos, 1597) + textarea de razón obligatoria (1600-1611), y el historial de roles se muestra en el mismo panel (1527-1545).

**B. Endpoint de promoción directa a partner — VIVO en server, UI MUERTA**
- `POST /api/admin/partners` — `server/routes/admin.ts:366-378`. `requireSuperadmin`, recibe `email`, hace `updateAccount(user.id, { userRole: "socio_comercial" })` (374). **No escribe `roleChangeLog`, no pide razón, cero side-effects.**
- Su UI `AdminPartnersTab` ("Crear Socio" con dialog de email) vive en `client/src/pages/admin-dashboard.tsx:408-476`, pero es **código muerto**: se exporta y nadie lo importa, y `admin-dashboard.tsx` no tiene ruta en `App.tsx` (solo `/admin` → admin-panel). Por eso el usuario percibe que "no hay proceso": el flujo dedicado a partners es inalcanzable.
- `GET /api/admin/partners` (listado con códigos/orgs) — `admin.ts:340-364`, consumido solo por esa tab muerta.

**C. Ecosistema post-promoción que YA funciona**
- Gates aceptan el rol al instante (leen DB por request, no el token): `requirePartner` en `server/auth.ts:657-680` acepta `socio_comercial|partner|director|superadmin`.
- `/partner` (partner-dashboard) ruteado en `App.tsx:64`; consume `/api/partner/stats|orgs|referrals|commissions` (`server/routes.ts:411-519`) y puede **auto-crear códigos de referido** vía `POST /api/partner/referrals` (routes.ts:487-502, código `P-...`, comisión default 10).
- Sidebar del dashboard estudiante muestra "Panel Comercial/Panel Socio" cuando el rol es socio_comercial (`dashboard.tsx:242-263, 1694, 1730`).
- Comisiones: se generan desde pagos confirmados por `POST /api/crm/commissions/generate` (`server/routes/crm.ts:174-227`, PLAN_CONFIG impulsa/transforma/lidera) — dependen de `teams.partnerId`, no requieren "alta" del partner en tabla alguna.
- `verify-socio` (`/verify/socio/:numero`, `server/routes/membership.ts:63-78`) verifica **membresía cooperativa** (`cooperativeMemberships`), es ortogonal al rol comercial.

## 2) Diagnóstico

La conversión SÍ existe (dos rutas server + una UI viva), pero el flujo está roto como producto:
1. **Descubribilidad**: la única UI alcanzable está enterrada en /admin → tab usuarios → click en usuario → sección al fondo, y solo para **superadmin** (admin normal no ve nada). No existe tab "Socios" en admin-panel (la lista de tabs en `admin-panel.tsx:106-128` no incluye `partners`; solo `comisiones-crm` y `recursos-socios`).
2. **UI dedicada muerta**: `AdminPartnersTab` nunca se monta (sin import, sin ruta).
3. **Endpoints duplicados e inconsistentes**: `POST /api/admin/partners` cambia rol **sin** `roleChangeLog` ni razón — bypass del audit que el PATCH sí cumple.
4. **Cero side-effects de onboarding**: ningún camino crea código de referido inicial, ni notifica por email al promovido (no existe `sendPartnerWelcomeEmail` en `server/email.ts`), ni le dice al usuario que ahora tiene `/partner`. El partner aterriza en un dashboard vacío y debe descubrir solo el botón de crear código.

## 3) Diseño para completar el flujo (reutilizando lo existente)

**Acción del admin (UI)**
- Nueva tab `partners` en `admin-panel.tsx` (agregar a la union type línea ~114 y al nav): portar `AdminPartnersTab` desde admin-dashboard.tsx:408 (moverla, no duplicarla) y borrar admin-dashboard.tsx del árbol o marcarlo deprecated. La tab lista `GET /api/admin/partners` (admin.ts:340) + botón "Promover a Socio Comercial" con buscador de usuarios existentes (reusar el fetch de `EnhancedUsersTab`, admin-panel.tsx:1638+) en vez de email libre — evita typos.
- Adicional de bajo costo: en `UserDetailPanel`, cuando `newRole === "socio_comercial"`, mostrar en el dialog de confirmación (junto a `RoleChangeDelta`, 1597) el checklist de side-effects que se ejecutarán.

**Endpoint server (consolidar, no crear tercero)**
Reescribir `POST /api/admin/partners` (admin.ts:366) como orquestador que llama la misma lógica del PATCH — o mejor: extraer `promoteToPartner(userId, changedBy, reason, ip)` y usarla en ambos:
1. **Validación**: usuario existe; rol actual ∈ {socio_estudiante, empresa…}; si ya es socio_comercial → 409; `reason` obligatoria (paridad con admin.ts:383).
2. **Cambio de rol**: `storage.updateAccount(userId, { userRole: "socio_comercial" })` (como 374/399).
3. **Audit-log**: insert en `roleChangeLog` (copiar bloque admin.ts:402-409) — hoy el POST se lo salta.
4. **Código de referido inicial**: si no existe `referralCodes` activo con `ownerId=userId` y `ownerType="socio_comercial"`, crear uno reusando exactamente la lógica de `POST /api/partner/referrals` (routes.ts:491-499), `label: "Inicial"`, `commission: 10`. Así `/partner` no aterriza vacío y `GET /api/admin/partners` muestra 1 código desde el día 0.
5. **CRM/comisiones**: no requiere alta (crm.ts deriva de `teams.partnerId` + pagos). Opcional: aceptar `teamIds[]` para asignar `teams.partnerId` en la misma transacción si el estudiante ya trajo empresas.
6. **Email**: nueva `sendPartnerWelcomeEmail(email, fullName, referralCode)` en `server/email.ts` (mismo patrón que `sendSamPartnerNotificationEmail`, importada en admin.ts:44): enlace a `/partner`, su código, y resumen del modelo de comisión. Envío best-effort (try/catch, no romper la promoción — patrón de admin.ts:1011-1015).
7. Respuesta: `{ account, referralCode, emailSent }`.

**Qué ve el usuario promovido**
- Sin re-login: `requirePartner` (auth.ts:672) lee el rol de DB por request, y el sidebar (dashboard.tsx:1694/1730) muestra "Panel Socio" al siguiente refetch de `/api/me/account`. Recibe el email con su código y link a `/partner`, donde `partner-dashboard.tsx` ya renderiza stats, código principal (card línea 835), organizaciones y comisiones con datos reales.

**Decisión de permisos**: mantener `requireSuperadmin` para el cambio de rol (consistente con PATCH) pero dejar `GET /api/admin/partners` en `requireAdmin` como ya está — admin ve, superadmin promueve.

**Esfuerzo estimado**: ~1 endpoint refactor + 1 email template + mover 1 componente de tab ≈ medio día; el 80% del flujo ya existe.