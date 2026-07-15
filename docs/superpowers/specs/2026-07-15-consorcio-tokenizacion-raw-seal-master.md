# Master — Tokenización RWA + Sello RAW on-chain del consorcio

**Fecha:** 2026-07-15
**Alcance:** Ceduverse (cooperativa) · BrainShield S.C. · gancho a HQ Kakaw
**Estado:** diseño aprobado en brainstorm (todas las bifurcaciones elegidas por David).
**Docs relacionados:** `2026-07-15-ceduverse-cobros-certificados-hardware-design.md` (cobros);
memorias `ceduverse-estructura-legal`, `brainshield-estructura-legal`.

> Fuente legal: OCR de escrituras reales (Ceduverse 6,520 + poder 6,756; BrainShield 5,905 +
> asamblea P.A. 6,607). Extractos en scratchpad/extracts/. Este doc cita esas escrituras;
> no inventa estructura.

---

## 1. Objetivo

Estructurar la representación on-chain (NFT gemelo + sello RAW) de:
1. **Certificados de aportación** de Ceduverse (socios cooperativistas).
2. **Partes sociales** de BrainShield S.C. (mal llamadas "acciones"; es S.C.).
3. **Gemelo digital de productos físicos** (tarjeta metálica CryptoVault, certificados impresos).

…manteniendo **la privacidad del socio como prioridad absoluta** (solo el hash toca la cadena,
nunca la PII), y sin chocar con la ley mexicana de cooperativas / sociedades civiles.

## 2. Realidad legal comparada (de las escrituras)

| | Ceduverse | BrainShield S.C. |
|---|---|---|
| Instrumento | Esc. 6,520, Notaría 110 QR | Esc. 5,905, Notaría 110 QR |
| Régimen | Coop. de consumo de RL de CV (LGSC) | Sociedad Civil (CCF) |
| Registro | RPC N-2026009627 (15-abr-2026) | RPPC PM…104 (15-abr-2025) |
| Título del socio | Certificado de aportación ($150) | Parte social ($100) |
| Socios legales | 5 × 20% (Ernesto, Daniel Zavala, Leonardo, Alejandra, **David**) | Ernesto + Leonardo 50/50 (David NO) |
| Voto | **1 socio = 1 voto** | por partes sociales |
| ¿Digitalizable? | **SÍ — Art. Sexto: "digitales, nominativos, indivisibles"** | acta silente |
| Cesión | no detallada (Reglamento Interno) | **Cláusula 12ª: nula sin acuerdo de Asamblea** |
| Anonimato del socio | no previsto | no previsto (**gap del producto**) |
| Poder de David | administración/pleitos/fiscal (NO dominio, NO títulos) | — |

**Consecuencia de diseño:** el NFT tiene naturaleza distinta según la entidad (§6).

## 3. Principios de diseño

1. **Privacy-first / RAW seal:** on-chain solo va el **hash canónico** del registro; la PII y el
   Libro de Registro viven off-chain (app/DB). Exposición pública vía **alias** (patrón
   `vault_echo_3k` de BrainShield). El socio revela el pre-imagen solo cuando quiere.
2. **Gemelo registral, no título negociable:** el NFT **espeja** el Libro de Registro de
   Socios/Certificados; no sustituye al título ni transmite por sí solo la titularidad.
3. **Respeto al régimen societario:** en Ceduverse **1 socio = 1 voto** (ningún token pondera
   voto por tenencia). En BrainShield toda transmisión válida exige acuerdo de Asamblea (12ª).
4. **Extender, no reinventar:** el motor de sello ya existe — `brainshield/src/lib/attestation.js`
   ancla hashes en **Base** con la wallet madre `0x8769…7DC6`. Se reutiliza.

## 4. Arquitectura de sello RAW — Opción A (doble sello)

Cada evento sellable (emitir certificado, cambio en libro, acreditar aportación, gemelo de
producto) produce **un hash canónico** que se ancla dos veces:

1. **Wallet del proyecto** (Ceduverse, DoctoCoin, Kakaw, …) — "la entidad actúa".
2. **Wallet madre BrainShield** `0x8769…7DC6` — **contrafirma el mismo hash** referenciando la
   tx del proyecto — "el originador RWA del consorcio ratifica".

- **Variante elegida:** contrafirma-por-referencia (la madre ancla `hash + puntero a tx del
  proyecto`), no dos anclajes independientes → mismo valor probatorio, ~mitad de gas.
- **Cadena:** todo en **Base** (donde vive la madre). Una sola red, gas barato.
- **Verificación:** cualquiera comprueba (a) que el proyecto selló y (b) que BrainShield ratificó,
  sin ver la PII. Doble cadena de custodia consorcio-wide.
- **Observabilidad:** HQ Kakaw lee ambos sellos como capa de gobierno del consorcio (§9).

Estructura del registro (extiende `construirRegistroHonorario`/`hashRegistro`): tipo de evento,
entidad, id del certificado/parte, hash del titular (no el nombre), hash del comprobante,
fecha UTC. Ethers por import dinámico (como hoy); si falla el anclaje, el evento off-chain no se
revierte (queda `onchain: pendiente`).

## 5. Aportación capitalizada — materialidad del NFT (Ceduverse)

**Reencuadre:** la aportación NO es un gasto del socio; es su **patrimonio** (LGSC art. 49-51),
devolvible en separación. El NFT tiene respaldo porque **incrusta la prueba on-chain de que la
aportación existe y fue cubierta**.

**Fondeo (elegido): capitalización de valor del ecosistema.** El socio no paga extra de su
bolsillo; su aportación de $150/certificado se **acredita** desde el valor que ya genera:
- parte de su **primer consumo** de curso, y/o
- sus **comisiones por referido** (modelo existente 15% + $500/referido).

**Flujo:**
1. Socio se inscribe → alta en Libro de Certificados de Aportación (off-chain) → sello RAW doble
   del alta → (F2) NFT gemelo emitido, con saldo de certificados = por acreditar.
2. Ocurre valor (consumo/comisión) → se **acredita** una fracción como aportación → se genera
   **recibo/constancia de aportación** (capital, **NO CFDI de ingreso**) → hash del recibo →
   sello RAW doble → el NFT actualiza su saldo de certificados respaldados.
3. Al completar el valor nominal, el certificado queda **totalmente exhibido**; el NFT lo refleja.

**Fiscal:** la aportación es capital/patrimonio, no venta → recibo de aportación, no CFDI de
ingreso. (Distinto del cobro de DC-3/SEP, que SÍ es servicio = CFDI ingreso — ver spec de cobros.)
Requiere política de capitalización aprobada por Asamblea + Reglamento Interno.

## 6. Tokenización por entidad

- **Ceduverse (certificado de aportación):** el Art. Sexto ya autoriza certificados **digitales,
  nominativos, indivisibles** → el NFT puede ser el **certificado digital** mismo (cercano al
  título), espejo del Libro. Voto per-socio, no por NFT. Indivisible = NFT no fraccionable.
- **BrainShield (parte social):** el NFT es **solo espejo registral** del Libro de Socios. La
  transmisión válida exige acuerdo de Asamblea (12ª); el NFT documenta, no transmite. Base de
  titularidad hoy: Ernesto + Leonardo 50/50 (los derechos del equipo operativo se estructuran por
  contrato, fuera del acta).

## 7. Gemelo digital de productos físicos

Tarjeta metálica (Vault Card / CryptoVault 24k) y certificados impresos → cada pieza obtiene un
**NFT gemelo** sellado (doble sello) que atestigua autenticidad y, para la tarjeta, el compromiso
de la seed **por hash** (nunca la frase). Punto de enganche existente: el webhook de tienda ya
deja `"NFT certificate pending mint"` para `vault_kit`.

## 8. Fases

- **F1 — Sello RAW (elegida como arranque):** extender `attestation.js` a certificados/partes +
  eventos de aportación, con doble sello Opción A. Es lo legalmente valioso y privacy-safe. Sin
  standard de token todavía.
- **F2 — NFT visible ERC-721:** gemelo nominativo indivisible como espejo del libro ya digital;
  metadata privacy-safe (alias + punteros a sellos), wallet del socio opcional (custodial primero).

## 9. Plan legal / documental / registral (lo NO-digital)

**Ceduverse:**
- Conseguir el **Reglamento Interno** (define transmisión de certificados — hoy gap del acta).
- Aprobar en Asamblea: (a) política de **capitalización de aportaciones** (§5), (b) reconocimiento
  de la **representación digital** de certificados vía sello RAW (respaldado por Art. Sexto).
- Corregir: nº de comisarios (3 estatutos vs 1 transitorio); domicilio fiscal de David.
- Confirmar folio/fecha jurídica (discrepancia 11-dic-2025 vs firma 9-ene-2026).

**BrainShield S.C.:**
- Cerrar gap de **anonimato**: Asamblea que adopte cláusula de confidencialidad de socios +
  convenio entre socios (el acta no lo da; hoy los socios están públicos en RPPC).
- **Ampliar objeto** para custodia/atestación RWA si operará como originador.
- Documentar la relación **equipo operativo (David/Daniel/Irving) ↔ socios legales
  (Ernesto/Leonardo)** por contrato, para dar soporte a la operación.

## 10. Enganche a HQ Kakaw y al spec de cobros

- **HQ Kakaw:** tablero que observa los sellos (proyecto + madre) como capa de gobierno del
  consorcio; no ejecuta transmisiones, atestigua.
- **Spec de cobros Ceduverse:** cuando se emite un certificado o se paga un DC-3/SEP, se dispara
  el sello RAW doble → cobro y gemelo on-chain nacen juntos. El evento de **aportación
  capitalizada** es un nuevo tipo de evento sellable a añadir a ese flujo.

## 11. Datos a confirmar / gaps abiertos

- Reglamento Interno de Ceduverse (transmisión de certificados) — no escaneado.
- Cómo se determina la **fracción** de consumo/comisión que capitaliza aportación (definir %).
- Wallets por proyecto: crear/fondear en Base (existe la madre; falta la de Ceduverse, etc.).
- Standard y custodia del NFT en F2 (custodial vs wallet del socio).
- Objeto social BrainShield: ¿ampliar por reforma o basta el inciso q (blockchain/IA)?

## 12. Fuera de alcance (YAGNI ahora)

- Mercado secundario / transferibilidad libre de NFTs (choca con régimen societario).
- Emisión de token fungible (BRAIN/KAKAW) — separado, ver memorias de tokenomics.
- Automatización de CFDI (sigue manual).
