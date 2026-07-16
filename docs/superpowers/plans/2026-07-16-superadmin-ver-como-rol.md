# Superadmin "Ver como ROL" + fix lockout de términos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development / executing-plans. Rama: `feat/superadmin-ver-como` (desde main/prod dapevi80). Deploy: Render auto-deploya de dapevi80/main al hacer push+merge.

**Goal:** Que un superadmin pueda **ver y actuar como cualquier rol** (socio_comercial, empresa, empresa_rh, socio_estudiante, socio_instructor, director) con su propia cuenta/datos, para probar y guiar usuarios desde el teléfono, reversible al instante, sin tocar la BD. De paso, exentar a admin/superadmin del gate de términos (arregla el lockout que trabó a superadmins).

**Architecture:** "Rol efectivo" = si el usuario real es superadmin/admin Y manda header `X-View-As: <rol>` (rol válido), el backend usa ESE rol para las decisiones de gating/paneles; si no, usa el rol real. Los endpoints exclusivos de superadmin (config admin, el propio switcher) SIEMPRE usan el rol REAL (para que nunca pierda la capacidad de volver). El frontend renderiza nav/paneles según el rol efectivo y manda el header. Nada sube privilegios — solo los baja para preview.

## Global Constraints
- **Solo superadmin/admin** puede activar "Ver como". El header `X-View-As` se IGNORA si el rol real no es superadmin/admin (nunca escalación).
- **Reversible al instante** — volver a "Superadmin" limpia el header + el estado.
- **Nunca cambia la BD** — es override de sesión/request, no un UPDATE de `accounts`.
- `requireSuperadmin`/`requireAdmin` usan el **rol REAL** (el switcher y el admin siempre accesibles).
- El gating de "experiencia de socio" (courses, partner panel, membership, certs, dashboard nav) usa el **rol EFECTIVO**.

---

### Task 1: Helper de rol efectivo (backend)

**Files:** Create `server/lib/effective-role.ts`; Modify `server/auth.ts` (usar el helper en los role-guards de "experiencia").

**Interfaces:**
- `getEffectiveRole(req, account): string` — devuelve el rol del header `x-view-as` SOLO si `account.userRole` ∈ {superadmin, admin} y el header es un `userRole` válido; si no, `account.userRole`.
- `VIEWABLE_ROLES = ['socio_comercial','empresa','empresa_rh','socio_estudiante','socio_instructor','director']`

- [ ] Step 1: TDD `getEffectiveRole` (vitest): superadmin + header válido → header; no-superadmin + header → rol real; header inválido → rol real; sin header → rol real.
- [ ] Step 2: Implementar el helper.
- [ ] Step 3: En `server/auth.ts`, los guards de EXPERIENCIA (`requirePartner`, `requireInstructor`, `requireOrgAdmin`, etc.) computan el rol con `getEffectiveRole` en vez de `account.userRole` directo. `requireSuperadmin`/`requireAdmin` NO cambian (rol real).
- [ ] Step 4: tsc + commit `feat(ver-como): helper de rol efectivo (X-View-As solo superadmin)`.

### Task 2: Gating de cursos/nav usa rol efectivo

**Files:** Modify `server/routes/courses.ts` (bloque Onboarding subcategory) para usar `getEffectiveRole`.

- [ ] Step 1: Reemplazar el `role` del gating de subcategorías por `getEffectiveRole(req, account)`.
- [ ] Step 2: tsc + commit `feat(ver-como): gating de cursos usa rol efectivo`.

### Task 3: Fix lockout de términos — exentar admin/superadmin

**Files:** Modify `server/auth.ts` (`checkPendingTerms`).

- [ ] Step 1: En `checkPendingTerms`, si el rol REAL del account ∈ {admin, superadmin} → `return next()` (staff interno exento del gate de términos). Esto arregla el lockout que trabó a superadmins Y evita que "Ver como" re-bloquee.
- [ ] Step 2: tsc + commit `fix(terms): exentar admin/superadmin del gate de terminos (arregla lockout)`.

### Task 4: Frontend — switcher "Ver como" + header

**Files:** Modify `client/src/lib/queryClient.ts` (o el wrapper `apiRequest`) para inyectar `X-View-As`; nuevo componente `ViewAsSwitcher`; Modify layout/nav para mostrarlo (solo si rol real es superadmin) + usar rol efectivo para render.

- [ ] Step 1: Estado `viewAsRole` (context o store) — persistido en `sessionStorage` (no localStorage, para que no se pegue entre sesiones). Solo se setea si el rol real es superadmin.
- [ ] Step 2: `apiRequest`/fetch wrapper agrega header `X-View-As: <viewAsRole>` cuando está seteado.
- [ ] Step 3: `ViewAsSwitcher` — dropdown (visible solo a superadmin) con los roles viewables + "Superadmin (yo)". Al cambiar → set `viewAsRole` + invalidar queries (`queryClient.invalidateQueries()`) para refrescar con el nuevo rol.
- [ ] Step 4: **Banner persistente** cuando `viewAsRole` está activo: "Viendo como: <rol> · [Volver a Superadmin]". El botón limpia el estado.
- [ ] Step 5: El nav/paneles del cliente usan el rol efectivo (viewAsRole ?? rolReal) para decidir qué mostrar.
- [ ] Step 6: tsc + commit `feat(ver-como): switcher UI + header X-View-As + banner`.

### Task 5: Verificación end-to-end

- [ ] Step 1: `npm test` (helper effective-role) + `npx tsc --noEmit` limpios.
- [ ] Step 2: Smoke manual documentado: como superadmin, "Ver como socio_estudiante" → aparece Mis Certificados (vista socio) + el flujo de compra DC-3; "Ver como socio_comercial" → aparece Panel Comercial; "Volver a Superadmin" → panel admin. Sin cambiar la BD.
- [ ] Step 3: Commit final.

## Manuales / deploy
- Merge a dapevi80/main → Render auto-deploya. Sin migración de BD.
- Verificar en prod (ceduverse.org): el switcher aparece solo para superadmin; ver-como refleja los paneles reales; volver funciona.

## Fuera de alcance
- Suplantar un USUARIO específico (ver datos de otra persona) — fase 2, requiere auditoría/consentimiento.
- Persistir el "ver como" entre sesiones (a propósito no — se resetea al cerrar sesión).
