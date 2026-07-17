# Paquete de Asamblea General — Ceduverse, S.C. de C. de R.L. de C.V.

> **TODO EL CONTENIDO DE ESTA CARPETA ES BORRADOR PARA REVISIÓN DEL CLO (Daniel Zavala).**
> Nada aquí es un instrumento legal vigente. **Ninguna asamblea se ha convocado ni celebrado.** Ningún documento debe emitirse, firmarse, asentarse ni protocolizarse en su estado actual.
> Versión del paquete: **v0.1 — 2026-07-16**.

---

## 1. Qué es este paquete

Borradores de los cuatro instrumentos necesarios para que la Asamblea General de Socios de Ceduverse apruebe formalmente su **Reglamento Interno** y ratifique la **política de capitalización**, más este índice.

| Archivo | Qué es | Estado |
|---|---|---|
| `reglamento-interno-v1-PARA-DANIEL.md` | Reglamento Interno evolucionado desde `../reglamento-interno-ceduverse-DRAFT.md`. Contiene las **7 decisiones pendientes surgidas inline** donde cada una muerde. | 🔴 **BLOQUEADO** — 7 decisiones abiertas |
| `convocatoria-asamblea.md` | Proyecto de convocatoria + análisis de plazos, quórum, órgano facultado y forma de convocar. | 🔴 **NO EMITIR** |
| `orden-del-dia.md` | Proyecto de orden del día (5 puntos sustantivos + instalación y ejecución). | 🟡 Sujeto a confirmación del tipo de asamblea |
| `proyecto-acta-asamblea.md` | Proyecto de acta con las **9 resoluciones redactadas para firma**, bloques de quórum/votación (1 socio = 1 voto) y hoja de firmas de los 5 socios. | 🔴 **NO CELEBRAR NI LEVANTAR** |

**Documentos base (carpeta padre `docs/legal/`):** `reglamento-interno-ceduverse-DRAFT.md` · `plan-adopcion-firma-reglamento.md` · `reporte-capitalizacion-aportacion.md` · `entrega-daniel/reporte-daniel-editable.md` (cuestionario de las 7 decisiones — **el contenido es válido y se reutilizó aquí; el mecanismo de entrega por correo fue rechazado**, ver `entrega-daniel/_DEMO_NO_ENVIAR.md`).

---

## 2. Lo que este paquete SÍ resolvió

**La cláusula del token se conserva** (decisión del titular) pero **corregida y reestructurada**:

- **Se corrigió el token.** El borrador anterior nombraba **BRAIN (1:1 USDC/USDT)** y **KAKAW (1:1 oro)** — tokens de terceros del consorcio, denominados en activos distintos al peso. Redacción **superada y eliminada**. El token es **CEDU, propio de Ceduverse, denominado 1:1 en MXN**: la aportación es en pesos y **no hay exposición cambiaria**.
- **La cláusula es HABILITANTE + CONDICIONADA, no operativa** (Art. 14 Ter). La Asamblea **autoriza a la Administración a instrumentar** la vía; su eficacia queda sujeta a **tres condiciones suspensivas previas y acumulativas**: (a) **reserva 1:1 en MXN** constituida en tesorería, (b) **billetera de proyecto de Ceduverse** constituida — **hoy NO existe**, (c) **dictamen legal favorable**.
- **CEDU se estructura como crédito interno NO transferible** — nominativo, no redimible en efectivo, oponible solo frente a la Cooperativa, sin rendimiento, sin derechos de gobierno. **Racional (hipótesis de diseño, NO dictamen):** distanciarlo de la figura de "fondos de pago electrónico" de la Ley Fintech, cuya licencia IFPE sería un problema para una cooperativa de consumo — **que NO es entidad financiera**.
- **Estado real de la infraestructura, asentado expresamente:** **ningún token está desplegado** (CEDU, BRAIN y KAKAW son todos diseño). Hoy solo operan la **red Base** y la **atestación SHA-256**.

---

## 3. Lo que FALTA antes de poder celebrar la Asamblea

### 3.1 Las 7 decisiones pendientes (Daniel Zavala, CLO) — 🔴 BLOQUEANTES

Surgidas inline en el Reglamento, cada una donde muerde. **Ninguna tiene respuesta inventada en el paquete.**

| # | Decisión | Dónde muerde | Riesgo si queda abierta |
|---|---|---|---|
| 1 | Admisión digital masiva — reparto Consejo vs. Asamblea | Reglamento Art. 6.3 | Admisiones inválidas o impugnables, en cadena sobre certificados y votos |
| 2 | Transmisión de certificados — plazo del derecho del tanto y admisibilidad del lucro | Art. 11.3.b y Art. 11 | El artículo no es aplicable sin plazo; el lucro puede chocar con el carácter no especulativo |
| 3 | Certificados capitalizados (5% y bono) — ¿transmisibles o afectos? | Art. 11 / Arts. 14 y 14 Bis | Especulación con capital de origen externo/subsidiado |
| 4 | Firma electrónica de títulos digitales ("firma autógrafa", Art. Sexto) | Art. 12.1 y Art. 9 | Certificados digitales sin validez formal — **y posible salto a Asamblea Extraordinaria** |
| 5 | Split contable 5% / 95% — base de IVA y retenciones | Art. 14.1 y 14.3 | Exposición ante el SAT; recalificación de la aportación como ingreso disfrazado |
| 6 | Reserva 1:1 para la vía CEDU — custodio, responsable y asiento | Art. 14 Bis.2.a y Art. 14 Ter.3.a | Capital simulado; exposición directa de los administradores que lo autoricen |
| 7 | Valor de reembolso de certificados capitalizados (nominal vs. contable) | Art. 8 | Arbitraje entre socios que se retiran en momentos distintos |

> **Las decisiones 1 y 4 son especialmente urgentes:** si cualquiera de las dos concluye que se requiere **reforma estatutaria**, el punto correspondiente **no es materia de Asamblea Ordinaria** y cambia el tipo de asamblea a convocar. **Convocar mal el tipo de asamblea vicia las resoluciones.**

### 3.2 `[PENDIENTE]` fiscales/contables — 🔴 no resueltos

- **Base de IVA/retenciones sobre la porción de servicio (95%)** y si el capital se detrae antes o después de impuestos indirectos.
- **Base de IVA del saldo de billetera de $20.00** — ¿descuento que reduce la base gravable, bonificación, u otro tratamiento? **Sin definir.**
- **Valor del reembolso** — nominal $150 vs. valor contable ajustado por reservas/pérdidas (= Decisión núm. 7).
- Asiento contable del canje **CEDU→aportación** y **beca→aportación**, blindando la no circularidad.
- Efectos en **PTU/ISR** y en los **fondos obligatorios del Art. Vigésimo Primero** de las Bases Constitutivas.

### 3.3 Dictamen regulatorio IFPE / Ley Fintech — 🔴 pendiente

**El CLO aprobó el modelo general y el Reglamento, pero NO ha opinado sobre este punto.** Falta dictamen sobre si CEDU —crédito interno, nominativo, **no transferible**, no redimible en efectivo, sin rendimiento, 1:1 MXN— **queda o no fuera** del supuesto de "fondos de pago electrónico" de la Ley Fintech. **La condición suspensiva (c) del Art. 14 Ter subordina toda la vía CEDU a este dictamen.**

### 3.4 Acreditación de la exhibición del capital — 🔴 no confirmada

`[PENDIENTE: acreditar exhibición del capital — Libro de Registro de Socios + recibos de aportación]`

**NO está confirmado que el capital suscrito por los cinco socios fundadores (100 certificados de $150.00, 20 por socio) esté efectivamente exhibido y documentado.** El paquete **no lo afirma en ningún documento**. Debe integrarse el expediente antes de la Asamblea.

### 3.5 Datos que faltan para poder emitir la convocatoria

**Domicilio social exacto** (no consta en ninguna fuente consultada — **no se inventó**) · fecha y hora de primera y segunda convocatoria · **cómputo del plazo en días naturales u hábiles** · **quórum de instalación en segunda convocatoria** · confirmación del medio de publicación · nombres completos cotejados de los cinco socios · integración del Consejo de Vigilancia.

---

## 4. Secuencia correcta

```
0. [BLOQUEANTE] Daniel resuelve las 7 decisiones
   └─ 1 y 4 primero: definen si hay puntos de Extraordinaria
1. [BLOQUEANTE] Validación fiscal/contable de los [PENDIENTE] (§3.2)
   └─ opinión externa si la Decisión 5 se resuelve por la opción C
2. [BLOQUEANTE] Dictamen IFPE / Ley Fintech sobre CEDU (§3.3)
   └─ condición suspensiva (c) del Art. 14 Ter
3. Integrar expediente de exhibición del capital (§3.4)
4. Daniel coteja el Acta 6,520 y resuelve todo [VERIFICAR CON DANIEL]
   └─ plazos, quórum, órgano facultado, admisibilidad de la totalitaria,
      necesidad de protocolización, nombres, domicilio social
5. Reglamento pasa a v1.0 FINAL → SE RETIRA la marca BORRADOR
   └─ NO antes. Los marcadores no se quitan en silencio.
6. Emitir convocatoria (o celebrar totalitaria, si Daniel la confirma admisible)
7. Celebrar Asamblea · 1 socio = 1 voto · unanimidad recomendada
8. Levantar, firmar y asentar el acta en el Libro de Actas (+ protocolizar si procede)
9. RECIÉN ENTONCES: Ruta B del Plan de Adopción — bump de versión en
   `terms_versions` y re-aceptación digital forzada de los 5 socios
10. Exportar evidencia de aceptaciones y conciliar contra el Libro de Registro
```

> **El orden importa.** La aceptación digital **ejecuta y evidencia** una decisión del órgano soberano; **no la sustituye**. Primero Asamblea (Ruta A), después firma digital (Ruta B).

**Lo que NO puede pasar hasta después del paso 2:** instrumentar la vía CEDU, acreditar un solo bono fondeado por token, o desplegar cualquier token.

---

## 5. Convenciones de este paquete

- **`> ⚠️ DECISIÓN PENDIENTE (Daniel): …`** — decisión abierta, con opciones y trade-off. **Sin respuesta inventada.**
- **`[VERIFICAR CON DANIEL: …]`** — dato o fundamento que **no fue posible verificar** contra las fuentes consultadas. **Se dejó en blanco en lugar de adivinar un número.** Un artículo mal citado en un acta es peor que un espacio vacío.
- **`[PENDIENTE: …]`** — punto fiscal/contable o de acreditación heredado de los borradores base y **conservado sin resolver**.
- **Marcas BORRADOR** — **no se retiran** hasta que Daniel firme y la Asamblea apruebe.

**Sobre citas legales:** en este paquete **no se inventó ninguna cita legal**. Solo se conservan referencias a los **Artículos de las Bases Constitutivas** que constan en los documentos base, y al **art. 52 LGSC** —únicamente porque el borrador base señala que está **transcrito dentro del propio Acta**, y aun así marcado para cotejo. La cita al "art. 9 LGSC" del borrador anterior **se retiró** por no haber sido verificable. **No se cita ningún artículo de la Ley Fintech.**

---

*Documentos de trabajo internos. Información confidencial propiedad de **Ceduverse** y **BrainShield**.*
