> **BORRADOR — PENDIENTE DE REVISIÓN Y APROBACIÓN (Daniel Zavala, CLO / Asamblea General de Socios).**
> Este documento **NO es un instrumento legal vigente**. Es un borrador de trabajo para revisión, ajuste y, en su caso, aprobación formal por la Asamblea General de Socios de Ceduverse. **No surte efectos jurídicos** hasta ser aprobado en Asamblea con el quórum que exigen el Acta Constitutiva y la LGSC, y asentado/protocolizado en el libro de actas correspondiente.
> **Versión de borrador: v1.0-candidato (2026-07-16).** Evolucionado desde `docs/legal/reglamento-interno-ceduverse-DRAFT.md` (v0.1/v0.2). Redactado por asistencia legal; **requiere validación del CLO antes de circular a socios y antes de someterse a Asamblea.**
>
> **⚠️ Este documento contiene 9 DECISIONES PENDIENTES marcadas inline (`⚠️ DECISIÓN PENDIENTE (Daniel)`) y varios `[PENDIENTE]` fiscales sin resolver. NO se han inventado respuestas.** Mientras cualquiera de ellas siga abierta, el Reglamento **no está listo** para votación. Ver `README.md` de esta carpeta.
>
> **⚠️ Nota sobre el TÍTULO CUARTO BIS (tabulador de anticipos y bonos), incorporado en esta versión.** Los parámetros del Artículo 15 Bis **no provienen de acuerdo de Asamblea, de las Bases Constitutivas ni de documento interno alguno**: a la fecha de este borrador existen **únicamente en el código de la página pública de socios** (`client/src/pages/socios-landing.tsx`). Se incorporan aquí **como PROPUESTA, transcritos tal como hoy se publican**, para que la Asamblea los **ratifique, ajuste o rechace** y exista por primera vez una fuente documental. **No debe leerse este Título como constancia de que tales parámetros sean política vigente.**
>
> **Nota sobre citas legales:** donde no fue posible verificar el texto exacto de un artículo de la LGSC contra una fuente disponible, se insertó `[VERIFICAR CON DANIEL]` en lugar de citar un número de artículo. **Un número de artículo incorrecto asentado en un acta es peor que un espacio en blanco.**

---

# REGLAMENTO INTERNO
## CEDUVERSE, SOCIEDAD COOPERATIVA DE CONSUMO DE RESPONSABILIDAD LIMITADA DE CAPITAL VARIABLE
### (S.C. de C. de R.L. de C.V.)

**Fundamento:** Ley General de Sociedades Cooperativas (LGSC); Bases Constitutivas y Estatutos contenidos en la Escritura Pública número **6,520**, de fecha 11 de diciembre de 2025, otorgada ante el Notario Público número **110** del Estado de Quintana Roo, Dr. Alberto Martínez Albarrán, inscrita en el Registro Público de Comercio bajo el folio **N-2026009627** (en adelante, el "Acta Constitutiva" o los "Estatutos").

> `[VERIFICAR CON DANIEL: confirmar contra el primer testimonio los datos de identificación del instrumento — número de escritura, fecha, nombre y número de notario, y folio de inscripción en el RPC. Estos datos se toman de documentos de trabajo internos y NO fueron cotejados contra el testimonio en esta redacción. Todo dato erróneo aquí se propaga a la convocatoria y al acta.]`

**Nota de jerarquía normativa:** Este Reglamento Interno desarrolla y complementa los Estatutos; en caso de conflicto, prevalecen la LGSC y los Estatutos. El Reglamento no puede modificar materias reservadas a Asamblea Extraordinaria (p. ej. capital fijo, objeto social).

---

## TÍTULO PRIMERO — DISPOSICIONES GENERALES

### Artículo 1. Objeto del Reglamento
El presente Reglamento Interno tiene por objeto desarrollar, en el ámbito operativo, las disposiciones de los Estatutos de Ceduverse, S.C. de C. de R.L. de C.V. (en adelante, la "Cooperativa"), en particular en las materias que el Acta Constitutiva remite expresamente a reglamentación interna: (i) el procedimiento operativo de admisión de nuevos socios (Art. Octavo, fracc. III de los Estatutos); (ii) el procedimiento de **transmisión de certificados de aportación** entre socios y, en su caso, a terceros, que el Acta Constitutiva no detalla; (iii) la operación de los **certificados de aportación en forma digital** reconocida en el Artículo Sexto de los Estatutos; (iv) la **política de capitalización de aportaciones**; (v) el **tabulador propuesto de anticipos de rendimientos y bonos** y la figura del **Coordinador Regional** (Título Cuarto Bis), **cuyos parámetros se someten a ratificación o ajuste de la Asamblea por carecer hoy de fuente documental**; y (vi) las reglas de confidencialidad, registro y gobierno interno que faciliten el cumplimiento de la LGSC.

### Artículo 2. Ámbito de aplicación
Este Reglamento obliga a todos los socios, a los órganos de la Cooperativa (Asamblea General, Administrador Único o Consejo de Administración, y Consejo de Vigilancia) y al personal que preste servicios a la Cooperativa, desde su aprobación por la Asamblea General y mientras no sea reformado o abrogado por el mismo órgano.

### Artículo 3. Definiciones
Para efectos de este Reglamento se entiende por:

- **Certificado de aportación:** título nominativo e indivisible, de valor nominal de $150.00 M.N., que representa la aportación de un socio al capital social, conforme al Artículo Sexto de los Estatutos.
- **Certificado digital:** representación electrónica de uno o más certificados de aportación, admitida por el Artículo Sexto de los Estatutos ("los certificados podrán ser digitales, nominativos, indivisibles").
- **Libro de Registro:** el Libro de Registro de Certificados de Aportación que la Cooperativa lleva conforme al Artículo Sexto de los Estatutos, en el que se inscriben todas las operaciones de suscripción, adquisición, transmisión o garantía de certificados.
- **Sello RAW / registro on-chain:** anotación criptográfica (por hash **SHA-256**) en una cadena de bloques que sirve de espejo o evidencia de una operación asentada en el Libro de Registro, sin sustituirlo. **A la fecha de este borrador, la Cooperativa opera únicamente la red Base y el sellado por atestación SHA-256.**
- **Aportación capitalizada:** política por la cual una fracción (5%) del **pago del propio socio** por productos/servicios se asigna a su cuenta de capital (aportación) mediante la emisión de certificados, mientras el remanente se reconoce como ingreso por servicio; no es subsidio ni desembolso adicional del socio.
- **Bono de bienvenida:** valor de origen **externo al capital social** de la Cooperativa que funda el primer certificado de aportación del socio en el onboarding y otorga un saldo de descuento en billetera, conforme al Artículo 14 Bis.
- **Anticipo de rendimientos:** entrega periódica y a cuenta que la Cooperativa realiza a un socio **en proporción a las operaciones que ese mismo socio realiza con la Cooperativa**, sujeta a liquidación definitiva al cierre del ejercicio conforme a los Estatutos y a la LGSC. **No es comisión ni retribución por venta a terceros.** Su tabulador propuesto consta en el Artículo 15 Bis.
- **Bono de referido:** cantidad fija que se reconoce al socio cuando una organización referida por él realiza su primera aportación/pago a la Cooperativa, conforme al tabulador propuesto del Artículo 15 Bis.
- **Bono por crecimiento regional:** contraprestación por el desempeño efectivo de la función de **Coordinador Regional** (Artículo 15 Ter), integrada por una **cuota fija por la función** y un **variable por metas de zona**. **No es un porcentaje sobre las operaciones de otros socios ni existe cascada de niveles.** **Sus montos NO están definidos.**
- **Zona:** cada una de las **cuatro (4)** demarcaciones comerciales en que la Cooperativa agrupa los 32 estados de la República — **Centro, Norte, Bajío y Sur-Sureste** — conforme al mapeo operativo único que utilizan la plataforma y el CRM (`shared/zonas.ts`).
- **Fuente externa:** valor distinto y separado del capital social de la Cooperativa, admitido en dos vías: (i) **CEDU respaldado 1:1 en pesos** (Artículo 14 Ter), **cuya instrumentación queda condicionada** conforme a dicho artículo; y (ii) **beca/patrocinio de empresa** para el canal B2B. **Un token o NFT sin reserva 1:1 real y verificable NO califica como fuente externa** (sería capital simulado).
- **CEDU:** unidad de **crédito interno de la Cooperativa**, denominada y respaldada **1:1 en pesos mexicanos (MXN)**, **nominativa y NO transferible**, definida en el Artículo 14 Ter. **CEDU es un proyecto de diseño: NO está desplegado ni emitido a la fecha de este borrador.**
- **Reserva 1:1:** respaldo real, íntegro, segregado y verificable **en pesos mexicanos** que debe existir y mantenerse **antes** de acreditar cualquier bono de bienvenida por la vía CEDU.

> **Nota de corrección respecto del borrador anterior (v0.1/v0.2).** El borrador previo nombraba, como fuente externa del bono, los tokens **BRAIN (1:1 USDC/USDT)** y **KAKAW (1:1 oro)**, ambos de terceros del consorcio y **denominados en activos distintos al peso**. Esa redacción **queda superada**: la aportación del socio a esta Cooperativa se realiza y se contabiliza **en pesos mexicanos**, por lo que la única vía token congruente es un instrumento **denominado 1:1 en MXN (CEDU)**, **sin exposición cambiaria**, propio de Ceduverse. Las referencias a BRAIN y KAKAW se eliminan de este Reglamento.

---

## TÍTULO SEGUNDO — DE LOS SOCIOS

### Artículo 4. Igualdad de derechos y principio de un socio, un voto
De conformidad con el Artículo Décimo, fracción VII de los Estatutos y con la LGSC, **cada socio tiene derecho a un (1) voto en la Asamblea General, con independencia del número o valor de los certificados de aportación de que sea titular.** Ninguna disposición de este Reglamento, ni el número de certificados capitalizados, ni la representación digital de los mismos, **ni la titularidad de CEDU**, altera este principio: la titularidad de más certificados no confiere voto proporcional ni preferencia de gobierno.

### Artículo 5. Requisitos para ser socio
Podrá ser socio la persona física que reúna los requisitos del Artículo Octavo de los Estatutos: (i) capacidad jurídica y de obrar conforme al Código Civil Federal; (ii) aportación económica mediante suscripción de al menos un (1) certificado de aportación; y (iii) aportación intelectual o de trabajo orientada a los fines sociales (educación cooperativa, obra editorial/de contenido, o consumo activo del ecosistema conforme al objeto de cooperativa de consumo). La calidad de socio es voluntaria y de libre retiro conforme al Artículo Octavo.

### Artículo 6. Procedimiento operativo de admisión de nuevos socios
Conforme al Artículo Octavo, fracc. II y III de los Estatutos, la admisión de socios con posterioridad a la constitución se sujeta al siguiente procedimiento:

1. **Solicitud.** El interesado presenta solicitud de adhesión, por medios físicos o digitales (incluida la aceptación electrónica de la "Adhesión Cooperativa" en la plataforma Ceduverse), manifestando su voluntad de asociarse, aceptando los Estatutos y este Reglamento, y señalando domicilio y correo electrónico para notificaciones.
2. **Verificación.** El Administrador Único (o el Consejo de Administración) verifica el cumplimiento de requisitos, reputación, trabajos de autoría o conveniencia a los fines sociales (Art. 8.II.a de los Estatutos), y la suscripción del o los certificados correspondientes.
3. **Resolución.** La solicitud se resuelve conforme a la **Decisión Pendiente núm. 1** de este artículo. **Hasta que la Asamblea resuelva dicho punto, la admisión no se perfecciona sino hasta el acuerdo favorable de la Asamblea General Ordinaria.**
4. **Inscripción.** Aprobada la admisión y **acreditada la exhibición de la aportación**, se emite el o los certificados (físicos o digitales) y se inscribe al socio en el Libro de Registro, generándose su número de socio único.
5. **Convocatoria por expansión.** Cuando la Cooperativa requiera admitir socios por necesidades de expansión, el Consejo de Administración emitirá convocatoria dando preferencia a sus trabajadores conforme al Artículo Octavo de los Estatutos. Las inconformidades se resuelven ante la Comisión de Conciliación y Arbitraje en 20 días hábiles.

> ### ⚠️ DECISIÓN PENDIENTE (Daniel) — núm. 1: Admisión digital masiva de socios (reparto Consejo vs. Asamblea)
>
> **Dónde muerde:** Art. 6.3 de este Reglamento. Sin resolverla, **cada alta digital de un socio-consumidor es potencialmente impugnable**, con efecto en cadena sobre los certificados emitidos, los votos y la calidad de socio.
>
> **El hueco:** el Acta es ambigua. El Art. 8.II remite la admisión a la **Asamblea General Ordinaria**; el Art. 8.III habla de "respetando el Consejo de Administración para admitir nuevos socios". Ceduverse pretende admitir socios-consumidores de forma **digital y masiva** vía plataforma, lo que hace materialmente inviable llevar cada alta a votación de Asamblea.
>
> **Opciones y trade-off:**
> - **A.** El Consejo/Administrador Único aprueba admisiones individuales conforme a **criterios objetivos pre-aprobados por Asamblea**, con **ratificación periódica en bloque** (p. ej. trimestral). *Trade-off:* operable a escala y conserva el control último de la Asamblea; **riesgo:** depende de que el Acta admita esa delegación sin reforma estatutaria.
> - **B.** Toda admisión requiere resolución expresa de Asamblea, una por una. *Trade-off:* máxima seguridad jurídica; **mata el modelo de admisión masiva digital.**
> - **C.** El Consejo admite de forma autónoma y definitiva. *Trade-off:* máxima agilidad; **exige confirmar si el Acta lo permite hoy o si requiere reforma estatutaria (Asamblea Extraordinaria).**
> - **D.** Otro esquema a definir por el CLO.
>
> **No se adopta ninguna opción en este borrador.** `[VERIFICAR CON DANIEL: si la delegación de la facultad de admisión al Consejo/Administrador Único es válida bajo la LGSC y bajo el Art. Octavo del Acta sin reforma estatutaria. No se cita artículo de la LGSC porque no fue posible verificar su texto.]`

### Artículo 7. Separación, retiro voluntario y exclusión
1. **Retiro voluntario.** El socio puede separarse en cualquier momento mediante retiro parcial o total de sus aportaciones, notificando fehacientemente a la Cooperativa. Conforme al Artículo Sexto de los Estatutos, el retiro no surte efectos sino hasta el fin del ejercicio anual, o del siguiente si la notificación se hace después del último trimestre.
2. **Exclusión.** Procede por las causas del Artículo Octavo de los Estatutos (falta de intensidad/calidad en labores; inasistencia reiterada e injustificada a asambleas; falta de honestidad en el manejo de fondos; incumplimiento reiterado de obligaciones; infracción reiterada a la Ley, Estatutos, este Reglamento o resoluciones de Asamblea/Consejo). El procedimiento exige notificación por escrito y 20 días naturales para que el socio responda ante el Consejo de Administración o la Comisión de Conciliación y Arbitraje. El socio excluido puede acudir a los órganos jurisdiccionales si estima injustificada la exclusión.

> `[VERIFICAR CON DANIEL: el borrador anterior citaba el "art. 9 LGSC" como fundamento del recurso del socio excluido ante los órganos jurisdiccionales. NO fue posible verificar el texto de ese artículo contra fuente disponible; la cita se retiró. Confirmar el fundamento correcto antes de asentar el Reglamento — o dejar la remisión genérica que aquí se conserva.]`

### Artículo 8. Devolución de aportaciones
La devolución de aportaciones al socio que se separa o es excluido se sujeta al Artículo Sexto de los Estatutos y al **artículo 52 de la LGSC, en los términos en que dicho precepto se encuentra transcrito en el propio Acta Constitutiva**: la devolución se practica al cierre del ejercicio, respetando el orden de prelación y a prorrata cuando corresponda, y **nunca podrá afectar el capital mínimo fijo sin derecho a retiro de $15,000.00 M.N.** La liquidación al socio se calcula sobre el valor de sus certificados, deducidas en su caso las pérdidas que proporcionalmente le correspondan (responsabilidad limitada al importe de sus certificados).

> `[VERIFICAR CON DANIEL: se conserva la referencia al art. 52 LGSC ÚNICAMENTE porque el borrador base indica que dicho artículo está transcrito dentro del Acta Constitutiva. Cotejar la transcripción contra el texto vigente de la LGSC antes de asentar el acta. Si no coincide, retirar el número de artículo.]`

> ### ⚠️ DECISIÓN PENDIENTE (Daniel) — núm. 7: Valor de reembolso de los certificados capitalizados
>
> **Dónde muerde:** Art. 8 de este Reglamento (y, por remisión, Arts. 14 y 14 Bis). Este es el `[PENDIENTE]` que el borrador v0.1 dejaba abierto en su Art. 8 y **sigue abierto**.
>
> **El hueco:** ¿el certificado nacido de la capitalización del 5% o del bono de bienvenida (origen externo) se reembolsa igual que uno suscrito con desembolso directo del socio?
>
> **Opciones y trade-off:**
> - **A.** **Valor nominal fijo ($150 por certificado), sin ajuste.** *Trade-off:* simple y predecible; **pero puede devolver más de lo que vale si la Cooperativa acumula pérdidas — traslada el quebranto a los socios que se quedan.**
> - **B.** **Valor contable en libros, ajustado por reservas y pérdidas** conforme al Art. Sexto de los Estatutos y al art. 52 LGSC — **mismo criterio para todos los certificados**. *Trade-off:* equitativo y alineado al Acta; **exige contabilidad confiable y cierre de ejercicio para calcularlo.**
> - **C.** Valor nominal para los certificados capitalizados (5% / bono) y valor en libros para los suscritos directamente. *Trade-off:* protege al socio-consumidor; **crea dos clases de certificado, lo que roza la igualdad de derechos del Art. Sexto y puede ser cuestionable.**
> - **D.** Otra fórmula a definir por el CLO.
>
> **Riesgo si queda abierto:** arbitraje entre socios que se retiran en momentos distintos, sin criterio objetivo para resolver disputas de devolución.
>
> **No se adopta ninguna opción en este borrador.**

---

## TÍTULO TERCERO — DE LOS CERTIFICADOS DE APORTACIÓN

### Artículo 9. Naturaleza y forma
Los certificados de aportación son nominativos, indivisibles, de igual valor nominal ($150.00 M.N.) y confieren iguales derechos y obligaciones a sus titulares según el tipo de socio (Art. Sexto de los Estatutos). Conforme al mismo Artículo Sexto, **los certificados podrán emitirse en forma digital.** La forma digital no altera su naturaleza jurídica ni el régimen de un socio, un voto.

### Artículo 10. Libro de Registro de Certificados de Aportación
1. La Cooperativa lleva un Libro de Registro en el que se inscriben todas las operaciones de **suscripción, adquisición, transmisión o garantía** de certificados (Art. Sexto de los Estatutos).
2. **La sociedad reconoce como propietario únicamente a quien aparezca inscrito en el Libro de Registro.** Ninguna transmisión surte efectos frente a la Cooperativa mientras no esté inscrita.
3. Cada socio debe mantener actualizados su domicilio y correo electrónico en el Libro; en su defecto, las notificaciones al domicilio/correo registrado surten plenos efectos.
4. El Libro es llevado bajo responsabilidad del Administrador Único (o del Consejo de Administración) y del Consejo de Vigilancia en lo que le corresponda.

> `[PENDIENTE: acreditar exhibición del capital — Libro de Registro de Socios + recibos de aportación]`
> **A la fecha de este borrador NO está confirmado que el capital suscrito por los cinco socios fundadores (100 certificados de $150.00, 20 por socio) se encuentre efectivamente exhibido y documentado.** Antes de la Asamblea debe integrarse el expediente: Libro de Registro de Certificados de Aportación abierto y al corriente, recibos de aportación de cada socio fundador y, en su caso, comprobantes de depósito. **Este Reglamento no afirma ni presume que dicho capital esté pagado.**

### Artículo 11. Transmisión de certificados de aportación (desarrollo del hueco estatutario)
El Acta Constitutiva ordena inscribir toda "transmisión o garantía" de certificados en el Libro, pero **no detalla el procedimiento de transmisión.** Este Reglamento lo establece, en congruencia con la naturaleza cooperativa (asociación de personas, no de capitales) y el principio de un socio, un voto:

1. **Carácter restringido.** El certificado de aportación no es un instrumento de libre circulación bursátil. Su transmisión está condicionada a que el adquirente sea o llegue a ser socio y a los controles siguientes.
2. **Transmisión entre socios existentes.** Un socio puede transmitir uno o más certificados a otro socio ya inscrito, previa **notificación por escrito al Administrador Único / Consejo de Administración** y su **inscripción en el Libro de Registro**. Dado que ambos ya son socios y rige un socio, un voto, la transmisión no altera la composición del voto; se sujeta a validación registral y de no afectación al capital mínimo fijo del transmitente.
3. **Derecho del tanto (transmisión a terceros no socios).** Cuando un socio pretenda transmitir certificados a un tercero que aún no es socio:
   a. Deberá notificar por escrito al Administrador Único / Consejo de Administración su intención, precio y condiciones.
   b. La Cooperativa comunicará a los demás socios, quienes gozarán de **derecho del tanto** para adquirir los certificados en igualdad de condiciones, ejercitable dentro del plazo que resuelva la **Decisión Pendiente núm. 2** de este artículo.
   c. De no ejercerse el derecho del tanto, el tercero solo podrá adquirir los certificados si es **admitido como socio** conforme al Artículo 6 de este Reglamento. Sin admisión, la transmisión a un tercero no socio no surte efectos ni se inscribe.
4. **Garantía/prenda de certificados.** Cualquier gravamen sobre certificados requiere notificación e inscripción en el Libro; su ejecución a favor de un tercero no socio queda sujeta al mismo requisito de admisión como socio.
5. **Inscripción como requisito de eficacia.** Ninguna transmisión, adjudicación o garantía surte efectos frente a la Cooperativa ni frente a terceros mientras no conste inscrita en el Libro de Registro.

> ### ⚠️ DECISIÓN PENDIENTE (Daniel) — núm. 2: Transmisión de certificados — plazo del derecho del tanto y admisibilidad del lucro
>
> **Dónde muerde:** Art. 11.3.b (plazo) y Art. 11 en general (precio). **El artículo no puede aplicarse sin el plazo.**
>
> **2a. Plazo del derecho del tanto.**
> - **A.** **15 días naturales** — propuesta del borrador v0.1, **por analogía** con el plazo de preferencia de 15 días en aumentos de capital del Art. Sexto de los Estatutos. *Trade-off:* coherente con el propio Acta; **la analogía no es fuente obligatoria — es una elección, no una deducción.**
> - **B.** Otro plazo: ____ días (naturales / hábiles). *Trade-off:* más corto agiliza la salida del socio; más largo protege la preferencia de los demás.
>
> **2b. ¿Transmisión onerosa/con lucro, o solo a valor nominal?**
> - **A.** **Solo a valor nominal (+ reservas si aplica).** *Trade-off:* blinda el carácter **no especulativo** de la figura cooperativa; **reduce el atractivo económico de ser socio.**
> - **B.** Onerosa permitida entre socios existentes, en igualdad de condiciones. *Trade-off:* liquidez para el socio; **riesgo de choque con el carácter no especulativo de la LGSC y exposición para los administradores que la autoricen.**
> - **C.** Onerosa entre socios, nunca hacia terceros no socios. *Trade-off:* punto medio; **conserva el riesgo anterior en menor grado.**
> - **D.** Otro criterio a definir por el CLO.
>
> `[VERIFICAR CON DANIEL: si la LGSC permite o prohíbe la transmisión onerosa con lucro de certificados de aportación. NO se cita artículo porque no fue posible verificar el texto aplicable. El borrador anterior afirmaba el "carácter no especulativo cooperativo" sin sustento citado.]`
>
> **No se adopta ninguna opción en este borrador.**

> ### ⚠️ DECISIÓN PENDIENTE (Daniel) — núm. 3: ¿Los certificados capitalizados (5% y bono) son transmisibles o quedan afectos?
>
> **Dónde muerde:** Art. 11 (reglas de transmisión) en relación con los Arts. 14 y 14 Bis (origen del certificado).
>
> **El hueco:** un certificado nacido del **5% del propio pago del socio** o del **bono de bienvenida de origen externo** no tiene el mismo origen que uno suscrito con desembolso directo. El Reglamento no dice si siguen el Art. 11 completo o quedan bloqueados.
>
> **Opciones y trade-off:**
> - **A.** **No transmisibles / afectos** mientras el socio conserve esa calidad; se liberan al retiro (ver Decisión núm. 7). *Trade-off:* cierra por completo la especulación con capital de origen externo; **rigidez total, el socio no puede monetizar.**
> - **B.** **Transmisibles en igualdad de condiciones** que cualquier otro certificado (Art. 11 completo, incluido derecho del tanto). *Trade-off:* trato igualitario, congruente con el Art. Sexto ("iguales derechos"); **abre la puerta a que el mecanismo de copropiedad se use como vehículo de especulación con capital subsidiado/externo.**
> - **C.** **Híbrido:** afectos durante un periodo mínimo de antigüedad (p. ej. 12 meses); después, transmisibles solo entre socios. *Trade-off:* mitiga la especulación de corto plazo conservando liquidez; **añade complejidad operativa al Libro de Registro y a la plataforma (control de antigüedad por certificado).**
> - **D.** Otro esquema a definir por el CLO.
>
> **Cuestión adicional a resolver junto con ésta:** si la respuesta crea de facto **dos clases de certificado**, verificar su compatibilidad con la igualdad de derechos del Art. Sexto de los Estatutos.
>
> **No se adopta ninguna opción en este borrador.**

### Artículo 12. Certificados digitales y sello RAW on-chain (NFT-gemelo)
1. **Reconocimiento.** Con fundamento en el Artículo Sexto de los Estatutos ("los certificados podrán ser digitales"), la Cooperativa puede emitir una representación digital de los certificados de aportación y, opcionalmente, un registro criptográfico en cadena de bloques ("sello RAW" por hash SHA-256), a modo de "gemelo registral" del certificado.
2. **El Libro de Registro es la fuente de verdad.** El registro on-chain es **espejo y evidencia** de las operaciones asentadas en el Libro de Registro; **no lo sustituye ni prevalece sobre él.** En caso de discrepancia, **prevalece el Libro de Registro.**
3. **Contenido registrable on-chain.** Solo se registra on-chain el hash (huella criptográfica) de la operación y los metadatos estrictamente necesarios para verificación. **No se publican en cadena datos personales del socio** (nombre, RFC, CURP, domicilio, correo). La identidad del socio permanece en el Libro de Registro, de acceso restringido.
4. **Indivisibilidad y no fungibilidad de gobierno.** El gemelo registral **no otorga por sí voto ni derecho proporcional alguno**: la gobernanza sigue el principio de un socio, un voto. **La titularidad on-chain no confiere la calidad de socio**; ésta deriva exclusivamente de la inscripción en el Libro de Registro.
5. **Privacidad y verificabilidad.** El diseño debe permitir que un tercero verifique la autenticidad/vigencia de un certificado (por hash) sin exponer la identidad del socio, en congruencia con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
6. **Estado real de la infraestructura.** A la fecha de este borrador, **la Cooperativa opera únicamente la red Base y la atestación por hash SHA-256.** No existe token alguno desplegado ni emitido por la Cooperativa. Cualquier referencia a CEDU en este Reglamento es **de diseño y prospectiva**, conforme al Artículo 14 Ter.

> ### ⚠️ DECISIÓN PENDIENTE (Daniel) — núm. 4: Firma electrónica de los títulos digitales
>
> **Dónde muerde:** Art. 12.1 y Art. 9. **Este es el punto que puede invalidar formalmente todo certificado digital emitido.**
>
> **El hueco:** el **Art. Sexto del Acta exige "firma autógrafa de los administradores"** en el contenido del título. El sello RAW on-chain (Art. 12) es **solo espejo/evidencia del Libro de Registro — no sustituye el requisito de firma del título.** Falta definir cómo se satisface ese requisito en un certificado digital.
>
> **Opciones y trade-off:**
> - **A.** **e.firma (FIEL) del SAT** de los administradores, por certificado o por lote de emisión. *Trade-off:* instrumento reconocido y a la mano; **atarse a la e.firma de una persona física crea dependencia operativa y de custodia de la llave.**
> - **B.** **Firma electrónica avanzada de un Prestador de Servicios de Certificación autorizado**, integrada al flujo de la plataforma. *Trade-off:* escalable y auditable; **costo por firma y dependencia de proveedor.**
> - **C.** Firma electrónica simple + hash on-chain. *Trade-off:* la más barata y ya casi construida; **riesgo alto: puede NO satisfacer el estándar de "firma autógrafa" sin reforma estatutaria — dejaría los certificados digitales formalmente cuestionables.**
> - **D.** Otro mecanismo a definir por el CLO.
>
> `[VERIFICAR CON DANIEL: si la LGSC exige forma física/autógrafa insustituible del título de certificado de aportación, o si admite equivalencia funcional por firma electrónica avanzada. NO se cita artículo porque no fue posible verificar el texto aplicable. De la respuesta depende si esto se resuelve en Reglamento (Ordinaria) o exige REFORMA ESTATUTARIA (Extraordinaria) — lo que cambiaría el tipo de Asamblea a convocar.]`
>
> **No se adopta ninguna opción en este borrador.**

---

## TÍTULO CUARTO — POLÍTICA DE CAPITALIZACIÓN DE APORTACIONES

### Artículo 13. Naturaleza patrimonial, no gasto
La aportación de un socio es **patrimonio** (capital social) y no un gasto ni una contraprestación por un servicio. En consecuencia, su acreditación se documenta mediante **recibo de aportación de capital** y **no** mediante un CFDI de ingreso de la Cooperativa. La capitalización incrementa el capital variable de la Cooperativa y el patrimonio del socio (sus certificados), no los ingresos gravables.

La política de capitalización descansa en **dos mecanismos híbridos, documentados por separado y con origen de fondos distinto**: (i) el **bono de bienvenida** (Artículo 14 Bis), financiado con valor **externo** al capital de la Cooperativa; y (ii) la **capitalización del 5%** (Artículo 14), que proviene del **pago del propio socio**, no de subsidio alguno.

### Artículo 14. Mecanismo de aportación capitalizada (5% del pago del propio socio)
1. **Principio y naturaleza.** Cuando el socio realiza un pago por productos o servicios de la Cooperativa, una fracción de **su propio pago** se asigna a **su propia cuenta de capital** (aportación), y el resto se reconoce como **consumo/servicio** (ingreso de la Cooperativa, con CFDI). No se trata de un subsidio ni de dinero externo: es el **socio asignando parte de su pago a su capital**.
2. **Parámetro (configurable por Asamblea).** Se capitaliza el **5% de cada movimiento de valor del socio** (consumo de cursos/certificaciones y comisiones por referido) como aportación, materializada en certificados de $150.00 c/u, hasta un **tope de 20 certificados ($3,000.00) por socio**. El primer certificado ($150) es el mínimo de materialidad para adquirir/confirmar la calidad de socio.
3. **Desglose de cada pago (ejemplo de asiento).** En un pago de $49,900 (certificación por experiencias laborales con RVOE — "Academy"): **5% = $2,495 se asignan a la cuenta de capital del socio** (aportación → ~16.6 certificados de $150), y **$47,405 se reconocen como ingreso por servicio** con su CFDI correspondiente.
4. **Acreditación fraccionada.** El 5% se acumula en un saldo de aportación pendiente; cuando el saldo acumulado alcanza $150.00, se emite un (1) certificado y se inscribe en el Libro de Registro (y, en su caso, se sella on-chain). Los remanentes menores a $150 permanecen acumulados hasta completar el siguiente certificado.
5. **Tope.** Alcanzados 20 certificados ($3,000), cesa la capitalización automática para ese socio, salvo acuerdo de Asamblea que modifique el parámetro o el tope. Con el producto ancla de $49,900, el tope se alcanza con **≈1.2 compras**.
6. **Política configurable.** El porcentaje (5%), el tope (20 certificados) y las fuentes de "movimiento de valor" son **parámetros ajustables por acuerdo de la Asamblea General Ordinaria**, dentro de los límites de la LGSC y los Estatutos, sin necesidad de reformar este Reglamento salvo que se altere su estructura.

> ### ⚠️ DECISIÓN PENDIENTE (Daniel) — núm. 5: Split contable 5% aportación / 95% servicio — base de IVA y retenciones
>
> **Dónde muerde:** Art. 14.1 y 14.3. **Sin esto, cada cobro que haga la plataforma se emite con un criterio fiscal no validado.**
>
> **El hueco:** falta confirmar la **base gravable exacta de IVA/retenciones** y si la porción de capital se detrae **antes o después** de impuestos indirectos.
>
> **Opciones y trade-off:**
> - **A.** El 5% de aportación **queda fuera de la base de IVA** (es capital); IVA solo sobre el 95% de servicio. *Trade-off:* congruente con la tesis de que la aportación es patrimonio y no contraprestación; **si el SAT recalifica la "aportación" como parte del precio, hay diferencias de IVA con actualización y recargos.**
> - **B.** **IVA sobre el 100%** del pago recibido; la separación 5%/95% ocurre solo a nivel de asiento contable interno. *Trade-off:* conservador, prácticamente sin riesgo de omisión de IVA; **encarece o reduce el margen y debilita el discurso de "aportación sin gasto adicional".**
> - **C.** **Requiere opinión formal de contador público/fiscalista externo** antes de fijar el criterio. *Trade-off:* es la vía sólida; **retrasa la Asamblea o exige aprobar el Reglamento condicionando la entrada en operación del mecanismo al dictamen.**
>
> **Riesgo si queda abierto:** exposición a determinación de diferencias de IVA/ISR, o **recalificación de la "aportación" como ingreso disfrazado.**
>
> **No se adopta ninguna opción en este borrador.**

> **[PENDIENTE confirmar con Daniel / fiscal — NO RESUELTO]** Base gravable exacta de IVA/retenciones sobre la porción de servicio, y si la porción de capital se detrae **antes o después** de impuestos indirectos. *(Proviene del Art. 14.3 del borrador v0.1 y permanece abierto.)*

### Artículo 14 Bis. Bono de bienvenida (materialidad de arranque, origen externo)
Como **mecanismo complementario** a la capitalización del 5% del Artículo 14, y para dar materialidad al primer certificado del socio desde el día uno, la Cooperativa opera un **bono de bienvenida** en el onboarding:

1. **Monto y desglose.** El bono asciende a **$170.00 M.N.**, desglosado así:
   a. **$150.00 → aportación de capital del socio.** Funda su **primer certificado de aportación** ($150 de valor nominal), que se inscribe en el Libro de Registro y, en su caso, se sella on-chain desde el onboarding. Se documenta con **recibo de aportación de capital** (patrimonio del socio, **NO CFDI de ingreso**).
   b. **$20.00 → saldo en billetera del socio.** Crédito de descuento aplicable a su primer certificado profesional DC-3/SEP (certificados de curso de pago). Su naturaleza fiscal es de **promoción/crédito comercial, NO capital**; no funda certificados de aportación ni forma parte del patrimonio societario del socio.

   > **[PENDIENTE confirmar con Daniel / fiscal — NO RESUELTO] Base de IVA del $20.** No está definido el tratamiento del saldo de billetera de $20 frente al IVA: si constituye un **descuento** que reduce la base gravable del servicio DC-3/SEP al momento de aplicarse, si es una **bonificación** con efectos propios, o si tiene otro tratamiento. **Este borrador no resuelve el punto y no debe interpretarse como criterio fiscal.**

2. **CONDICIÓN LEGAL CRÍTICA — origen EXTERNO obligatorio.** Los $170.00 deben provenir **necesariamente de una fuente externa al capital social de la Cooperativa**; **en ningún caso el bono puede financiarse con el capital propio de Ceduverse** (sería circular: el capital neto no aumentaría y el carácter de "patrimonio genuino del socio" sería jurídicamente cuestionable). Se admiten dos vías, según el canal:
   a. **Canal directo — vía CEDU (respaldado 1:1 en MXN).** Regulada de forma **habilitante y condicionada** en el **Artículo 14 Ter**. **Esta vía NO puede operar mientras no se cumplan íntegramente las condiciones suspensivas de dicho artículo.**
   b. **Canal B2B — beca/patrocinio de empresa.** El valor proviene de una **beca o patrocinio de la empresa** (presupuesto de un tercero), externo al capital de la Cooperativa. **Esta vía no depende de reserva alguna, pero exige comprobante documental del origen del patrocinio.**

   En ambas vías, el valor externo ingresa al patrimonio del socio y desde ahí se suscribe el certificado, resultando una **aportación genuina del socio** de $150 al capital social, con incremento real del capital neto de la Cooperativa.

   **Un token o NFT sin reserva 1:1 real y verificable NO sirve** para fondear el bono: representaría **capital simulado**, viciaría la aportación y contaminaría el capital social.

3. **Registro contable.** El valor externo se reconoce como entrada de recursos de tercero afectada a la suscripción del certificado del socio (aumento de capital variable), documentada de forma que quede trazable el origen externo y que el socio figure como titular aportante.

4. **Articulación con el 5%.** El bono cubre la **materialidad de arranque** (el 1er certificado, con valor externo); la **capitalización del 5%** del Artículo 14 hace **crecer** la aportación del socio con **su propio pago** posterior, hasta el tope de 20 certificados.

5. **Parámetros configurables.** El monto del bono ($170), su desglose ($150 capital / $20 billetera) y el porcentaje de capitalización (5%) y su tope (20 certificados) son **parámetros ajustables por acuerdo de la Asamblea General Ordinaria**, dentro de los límites de la LGSC y los Estatutos.

> ### ⚠️ DECISIÓN PENDIENTE (Daniel) — núm. 6: Reserva 1:1 de tesorería para el bono vía token (CEDU)
>
> **Dónde muerde:** Art. 14 Bis.2.a y Art. 14 Ter. **Emitir un solo bono por esta vía sin reserva verificada equivale a capital simulado, con exposición directa para los administradores que lo autoricen y riesgo de nulidad de la suscripción.**
>
> **6a. ¿Quién constituye y custodia la reserva 1:1 en MXN?**
> - **A.** **Cuenta bancaria segregada a nombre de la Cooperativa**, con conciliación mensual publicada al Consejo de Vigilancia. *Trade-off:* simple, en pesos, sin intermediarios; **el control depende de la disciplina interna y de la vigilancia efectiva del Comisario.**
> - **B.** **Fideicomiso** con institución fiduciaria como tercero custodio. *Trade-off:* máxima solidez frente a terceros y auditoría; **costo de constitución y mantenimiento, y rigidez operativa.**
> - **C.** Custodio institucional de terceros con atestación periódica. *Trade-off:* atestación externa; **si la reserva es en MXN, un custodio cripto no es la figura natural — evaluar pertinencia.**
> - **D.** Otro mecanismo a definir por el CLO.
>
> **6b. Responsable designado (nombre y cargo):** __________________ *(propuesta a considerar: Irving González — CFO. NO designado en este borrador.)*
>
> **6c. Tratamiento contable del canje CEDU→aportación vs. beca→aportación:** `[PENDIENTE confirmar con Daniel / fiscal — NO RESUELTO]` el asiento contable preciso que blinde la **no circularidad** y el carácter patrimonial de la aportación.
>
> **No se adopta ninguna opción en este borrador.**

### Artículo 14 Ter. Autorización HABILITANTE y CONDICIONADA de la vía CEDU

> **Naturaleza de este artículo.** Este artículo **NO pone en operación** la vía CEDU. Es una **cláusula habilitante**: la Asamblea **autoriza a la Administración a instrumentarla**, y su eficacia queda **sujeta al cumplimiento previo, íntegro y acreditado** de las condiciones suspensivas del numeral 3. **Mientras cualquiera de esas condiciones no se cumpla, la vía CEDU no puede utilizarse para fondear bono alguno**, y el canal directo del Art. 14 Bis opera exclusivamente por la vía de beca/patrocinio o queda suspendido.

1. **Autorización.** La Asamblea General **autoriza a la Administración (Administrador Único) a instrumentar** un canal de bono de bienvenida fondeado mediante **CEDU**, en los términos y con los límites de este artículo, y a realizar los actos preparatorios necesarios (diseño técnico, contratación de dictámenes, apertura de la reserva y constitución de la billetera de proyecto).

2. **Definición y naturaleza de CEDU — crédito interno NO transferible.** CEDU se define y **debe instrumentarse** con las siguientes características, que son **esenciales y no renunciables**:
   a. **Denominación 1:1 en pesos mexicanos (MXN).** Un (1) CEDU equivale en todo momento a $1.00 M.N. La aportación del socio se realiza y contabiliza **en pesos**; **no existe exposición cambiaria alguna** en este mecanismo.
   b. **Crédito interno de la Cooperativa**, oponible **únicamente frente a la propia Cooperativa** y afectado exclusivamente a la finalidad prevista en el Art. 14 Bis (fondear el bono de bienvenida y el saldo de billetera).
   c. **Nominativo y NO transferible.** CEDU **no puede cederse, endosarse, transmitirse, comercializarse, negociarse en mercado secundario alguno, ni utilizarse como medio de pago frente a terceros.** Cualquier acto en contravención es **nulo** y no se reconoce por la Cooperativa.
   d. **NO redimible en efectivo.** CEDU **no confiere a su titular derecho a exigir su devolución o reembolso en dinero**; se extingue por su aplicación a la finalidad del Art. 14 Bis o por las causas que determine la Administración conforme a este Reglamento.
   e. **Sin derechos de gobierno.** La titularidad de CEDU **no confiere calidad de socio, ni voto, ni derecho patrimonial proporcional alguno.** La calidad de socio deriva exclusivamente de la inscripción en el Libro de Registro (Art. 10).
   f. **Sin rendimiento.** CEDU no devenga intereses ni rendimiento de ninguna naturaleza.

   > **Racional de este diseño (para revisión del CLO).** Las características (c) **no transferibilidad**, (d) **no redimibilidad en efectivo**, (b) **oponibilidad únicamente frente a la Cooperativa** y (f) **ausencia de rendimiento** se incorporan deliberadamente para **distanciar CEDU de la figura de "fondos de pago electrónico"** y de la de un instrumento de pago transferible. Ceduverse es una **cooperativa de consumo — NO es una entidad financiera** ni cuenta con autorización para operar como Institución de Fondos de Pago Electrónico (IFPE). **Este racional es una hipótesis de diseño, no un dictamen.** Ver numeral 4.

3. **Condiciones suspensivas (todas, acumulativas y previas).** La vía CEDU **no podrá instrumentarse ni utilizarse** sino hasta que la Administración acredite documentalmente ante el Consejo de Vigilancia, y éste haga constar, el cumplimiento **íntegro** de las tres condiciones siguientes:
   a. **Constitución de la reserva 1:1 en tesorería.** Que exista, **previamente** a la acreditación de cualquier bono por esta vía, una **reserva real, íntegra, segregada y verificable en pesos mexicanos**, equivalente al 100% de los CEDU emitidos y no aplicados, bajo el mecanismo de custodia y con el responsable que resuelva la **Decisión Pendiente núm. 6**, con conciliación periódica al Consejo de Vigilancia.
   b. **Constitución de la billetera de proyecto de Ceduverse.** Que se constituya y documente formalmente la **billetera institucional del proyecto Ceduverse**, con su política de firmas, custodia de llaves y control de acceso aprobada por la Administración. **A la fecha de este borrador dicha billetera NO existe.**
   c. **Dictamen legal favorable.** Que se emita **dictamen legal favorable del CLO**, que se pronuncie expresamente sobre el punto del numeral 4 y sobre la naturaleza y tratamiento fiscal del canje CEDU→aportación.

4. **⚠️ CUESTIÓN REGULATORIA ABIERTA — Ley Fintech / IFPE (pendiente del dictamen de Daniel).**
   **El CLO ha aprobado el modelo general y el Reglamento en su concepción, pero NO ha emitido opinión sobre este punto regulatorio específico.** Queda expresamente pendiente de dictamen:
   - Si CEDU, tal como se define en el numeral 2 (crédito interno, nominativo, **no transferible**, no redimible en efectivo, sin rendimiento, oponible solo frente a la Cooperativa, denominado 1:1 en MXN), **queda o no fuera** del supuesto de "fondos de pago electrónico" de la **Ley para Regular las Instituciones de Tecnología Financiera** y, por tanto, **fuera** del requisito de autorización como **IFPE**.
   - Qué característica o modificación del diseño haría que CEDU **sí** cayera en dicho supuesto (p. ej. hacerlo transferible, redimible en efectivo, o utilizable como medio de pago frente a terceros), a efecto de establecerlas como **prohibiciones expresas** del Reglamento.
   - Si la condición de **cooperativa de consumo — no entidad financiera** de Ceduverse tiene algún efecto sobre el análisis.

   `[VERIFICAR CON DANIEL: NO se cita artículo alguno de la Ley Fintech ni de su normativa secundaria en este Reglamento, porque no fue posible verificar el texto aplicable contra fuente disponible. La calificación de CEDU como fondo de pago electrónico o su exclusión de dicho supuesto es una determinación jurídica que corresponde exclusivamente al CLO. Este borrador NO afirma que CEDU esté fuera del régimen IFPE — únicamente expone el diseño y la hipótesis que lo sustenta.]`

5. **Estado real del token.** **CEDU NO está desplegado, emitido ni en circulación.** Es un **diseño**. A la fecha de este borrador, la Cooperativa opera únicamente la red **Base** y el sellado por atestación **SHA-256** (Art. 12.6). Ninguna disposición de este artículo debe interpretarse como afirmación de que exista token alguno en operación.

6. **Rendición de cuentas.** Cumplidas las condiciones suspensivas, la Administración informará a la Asamblea General Ordinaria inmediata siguiente sobre la instrumentación de la vía CEDU, el estado de la reserva 1:1 y el volumen de bonos acreditados por esta vía. La Asamblea podrá en cualquier momento **revocar o modificar** esta autorización.

### Artículo 15. Documentación y comprobación
1. Cada certificado emitido por capitalización se respalda con un **recibo de aportación** (no CFDI de ingreso) que identifica al socio, el número de certificado, la fecha y el origen (5% del pago propio / bono externo). La porción de servicio de cada pago se factura por separado con **CFDI de ingreso**.
2. La materialidad de la aportación puede acreditarse adicionalmente con el **comprobante sellado on-chain** (hash SHA-256 de la operación), que sirve de evidencia de integridad y de fecha, espejo del asiento en el Libro de Registro.

> **[PENDIENTE confirmar con Daniel / CLO fiscal — NO RESUELTO]** Validar con contabilidad/fiscal: (i) el asiento del split 5% capital / 95% ingreso en cada pago (abono a capital vs. reconocimiento de ingreso con CFDI); (ii) **la base de IVA/retenciones sobre la porción de servicio**; (iii) **la base de IVA del saldo de billetera de $20** (Art. 14 Bis.1.b); (iv) el asiento del bono según su vía (canje CEDU 1:1 MXN o beca/patrocinio), blindando la no circularidad; (v) implicaciones de PTU/ISR y de los fondos obligatorios del Art. Vigésimo Primero de los Estatutos (reserva legal, previsión social, educación cooperativa).

---

## TÍTULO CUARTO BIS — DE LOS ANTICIPOS DE RENDIMIENTOS Y DE LOS BONOS A LOS SOCIOS

> **⚠️ ADVERTENCIA DE ORIGEN — LÉASE ANTES DE VOTAR ESTE TÍTULO.**
>
> **1. Los parámetros del Artículo 15 Bis carecen de fuente documental.** No derivan de las Bases Constitutivas, ni de acuerdo previo de Asamblea, ni de resolución de la Administración, ni de documento interno alguno. A la fecha de este borrador **existen exclusivamente en el código de la página pública de socios** (`client/src/pages/socios-landing.tsx`). Se transcriben aquí **tal como hoy se publican**, sin corregirlos, sin completarlos y sin sustituirlos por cifras de mejor apariencia. **Quién los fijó, cuándo y con qué criterio: NO CONSTA.**
>
> **2. Los parámetros YA SE ENCUENTRAN PUBLICADOS.** No se trata de una propuesta inédita: están **anunciados al público** en la página de socios, con un simulador que permite a cualquier interesado calcular escenarios con ellos. **La Asamblea debe ponderar expresamente esta circunstancia**: es posible que personas se hayan registrado, o se registren mientras la página siga publicada, **confiando en estas cifras**. Rechazarlas o reducirlas sin más puede generar reclamos de quienes se asociaron sobre esa base; ratificarlas sin análisis las convierte en obligación de la Cooperativa. **Ninguna de las dos consecuencias se resuelve en este borrador.**
>
> **3. Este Título es PROPUESTA, no constancia.** La Asamblea **puede ratificarlos, ajustarlos o rechazarlos**. Ninguna disposición de este Título debe interpretarse como afirmación de que tales parámetros sean política vigente de la Cooperativa, ni como reconocimiento de derecho adquirido alguno a favor de socio o aspirante.
>
> **4. Mitigación sugerida a considerar por el CLO (no adoptada aquí):** la página pública acompaña hoy cada parámetro de una nota que los declara *"política propuesta, sujeta a ratificación o ajuste por la Asamblea General"* y advierte que el Reglamento está en borrador y sin efectos jurídicos. `[VERIFICAR CON DANIEL: si dicha nota es suficiente para excluir la formación de expectativas exigibles frente a quienes se registraron, o si procede alguna medida adicional — p. ej. retirar las cifras de la página hasta la Asamblea, o recabar acuse expreso de su carácter no vinculante en el alta. NO se cita fundamento porque no fue posible verificar el texto aplicable.]`

### Artículo 15 Bis. Tabulador propuesto de anticipos de rendimientos y bonos

1. **Naturaleza cooperativa de las figuras.** Las cantidades de este artículo se reconocen al socio **en proporción a su propia operación con la Cooperativa** y bajo la denominación que corresponde a una sociedad cooperativa de consumo: **anticipo de rendimientos**, **bono de referido**, **bono de bienvenida** (Art. 14 Bis) y **bono por crecimiento regional** (Art. 15 Ter). **No constituyen comisiones mercantiles ni retribución por venta**, y **ningún socio recibe porcentaje alguno sobre las operaciones de otros socios**: no existen niveles ni cascada.

2. **Tabulador propuesto por perfil de socio.** Se somete a ratificación o ajuste de la Asamblea el siguiente tabulador, **transcrito de los valores hoy publicados**:

   | Perfil de socio | Anticipo de rendimientos (% del fee de administración) | Bono por certificación DC-3 | Bono por certificado SEP | Bono de referido | Vigencia |
   |---|---|---|---|---|---|
   | **Trabajador** | **10%** | **20%** | **5%** | **$300.00 M.N.** | **12 meses** |
   | **Instructor** | **10%** | **40%** | **10%** | **$500.00 M.N.** | **24 meses** |
   | **Agente** | **15%** | **40%** | **10%** | **$500.00 M.N.** | `[PENDIENTE: vigencia por definir por la Asamblea]` |
   | **Consultor** | **25%** base; **30%** con 4 o más organizaciones activas; **35%** con 8 o más | **40%** | **10%** | **$500.00 M.N.** | `[PENDIENTE: vigencia por definir por la Asamblea]` |

3. **Bases de cálculo.**
   a. El **anticipo de rendimientos** se calcula sobre el **fee de administración** que la Cooperativa percibe por cada organización **incorporada por el propio socio**, y **únicamente mientras dicha organización permanezca activa**. No se calcula sobre la aportación de la organización.
   b. Los **bonos por certificación** se calculan como porcentaje del precio del certificado profesional respectivo, correspondiente a la operación propia del socio.
   c. El **bono de referido** se reconoce **por una sola vez** por cada organización referida, al momento en que ésta realiza su primer pago/aportación a la Cooperativa.
   d. La **escalación del perfil Consultor** (25% → 30% → 35%) opera por número de organizaciones activas **de su propia cartera**. Ver **Decisión Pendiente núm. 8**.

4. **Precios de referencia hoy publicados** (se hacen constar como **contexto del tabulador, NO como parámetro que este artículo someta a ratificación**): DC-3 en **$499.00 M.N.**; certificado SEP en **$1,999.00 M.N.**; UMA de **$113.14** diarios; y fee de administración de **20%** (plan Impulsa, 6 UMAs/colaborador/mes), **13%** (plan Transforma, 10 UMAs) y **10%** (plan Lidera, 20 UMAs). `[VERIFICAR CON DANIEL: el precio del DC-3 es $499.00 (fuente única: shared/cert-pricing.ts, lo que el servidor efectivamente cobra). La landing publicaba $399.00 mientras el checkout cobraba $499.00 — corregido 2026-07-17. Los fees tampoco constan en documento alguno de la Cooperativa fuera del código; determinar si deben ratificarse por Asamblea, fijarse por la Administración, o documentarse en instrumento separado.]`

5. **Vigencias.** Las vigencias de 12 y 24 meses (perfiles Trabajador e Instructor) se transcriben tal como se publican. Las vigencias de los perfiles **Agente** y **Consultor** están hoy publicadas como *"por definir por la Asamblea"*: **este Reglamento NO propone plazo alguno para ellas y no debe inventarse en Asamblea sin criterio.** `[PENDIENTE: vigencia de los perfiles Agente y Consultor — por definir por la Asamblea]`

6. **Carácter ajustable.** De ratificarse, los parámetros de este artículo son **ajustables por acuerdo posterior de la Asamblea General Ordinaria**, dentro de los límites de la LGSC y los Estatutos, sin necesidad de reformar este Reglamento.

7. **Sin garantía de ingreso.** Ninguna disposición de este artículo garantiza ingreso, rendimiento ni resultado alguno a socio o aspirante. El anticipo depende íntegramente de la operación que el propio socio consiga, y la Cooperativa **no promete** que consiga operación alguna.

> ### ⚠️ DECISIÓN PENDIENTE (Daniel) — núm. 8: ¿Es compatible con una cooperativa de consumo una escalera por volumen (Agente → Consultor, 25%/30%/35%)?
>
> **Dónde muerde:** Art. 15 Bis.2 y 15 Bis.3.d. **Si la respuesta es negativa, el tabulador publicado no puede ratificarse tal como está.**
>
> **El hueco:** una cooperativa de consumo distribuye rendimientos **en proporción a las operaciones que cada socio realiza con la sociedad**. Una **escalera de perfiles** (Trabajador/Instructor/Agente/Consultor) con **porcentajes distintos entre socios** y una **escalación por volumen** (25% → 30% con 4+ organizaciones → 35% con 8+) hace que **dos socios con la misma operación reciban distinto porcentaje** según su perfil, y que el porcentaje **crezca con el volumen**. Esa lógica es propia de un plan de comisiones mercantil, no necesariamente de la proporcionalidad cooperativa.
>
> **Opciones y trade-off:**
> - **A.** **Un solo porcentaje uniforme para todo socio**, aplicado en proporción a su propia operación. *Trade-off:* es la lectura más limpia de la proporcionalidad cooperativa y elimina el riesgo de recalificación; **contradice frontalmente lo hoy publicado y reduce el incentivo del perfil Consultor.**
> - **B.** **Conservar la escalera** justificando que el porcentaje diferenciado retribuye **aportación de trabajo distinta** (no volumen de venta), y no la mera acumulación. *Trade-off:* preserva la propuesta comercial publicada; **exige sustento jurídico que este borrador NO tiene, y la escalación por número de organizaciones es difícil de explicar como algo distinto del volumen.**
> - **C.** **Conservar perfiles, eliminar la escalación por volumen** (porcentaje fijo por perfil, sin saltos por 4+/8+). *Trade-off:* punto medio, elimina el elemento más difícil de defender; **obliga a modificar lo publicado.**
> - **D.** Otro esquema a definir por el CLO.
>
> `[VERIFICAR CON DANIEL: si la LGSC exige que el reparto de rendimientos entre socios sea estrictamente proporcional a las operaciones de cada uno, y si admite tabuladores diferenciados por perfil o escalados por volumen. NO se cita artículo porque no fue posible verificar el texto aplicable.]`
>
> **No se adopta ninguna opción en este borrador.**

> ### ⚠️ DECISIÓN PENDIENTE (Daniel) — núm. 9: Marco jurídico de la figura del "socio comercial"
>
> **Dónde muerde:** todo el TÍTULO CUARTO BIS, y de forma refleja los Arts. 5 (requisitos para ser socio) y 6 (admisión). **Es la cuestión estructural del modelo, no un detalle de redacción.**
>
> **El hueco:** Ceduverse es una **cooperativa de CONSUMO**: sus socios se asocian para **consumir** bienes y servicios de la sociedad, y los rendimientos se distribuyen en proporción **al consumo/operación de cada socio**. Sin embargo, el modelo publicado —y este Título— describe a un **"socio comercial"** que **no consume**: **vende a terceros** (incorpora organizaciones ajenas a la plataforma) y **recibe un porcentaje por esa venta**. Quien vende y cobra un porcentaje por vender **no está operando con la Cooperativa en calidad de consumidor**, y llamar "anticipo de rendimientos" a ese porcentaje **no cambia su naturaleza material**. La figura carece hoy de marco jurídico.
>
> **Opciones y trade-off:**
> - **A.** **Relación laboral** (contrato individual de trabajo con parte variable). *Trade-off:* encuadra sin ambigüedad la retribución variable; **carga de IMSS/INFONAVIT/ISR retenido y PTU, y choca con la figura del socio libre y voluntario.**
> - **B.** **Prestación de servicios independientes** (comisión mercantil o servicios profesionales, con CFDI del socio a la Cooperativa). *Trade-off:* operativamente simple y ya usado en el mercado; **admite expresamente que es una COMISIÓN — lo que contradice el vocabulario cooperativo adoptado y expone a riesgo de subordinación disfrazada / recalificación laboral.**
> - **C.** **Sección o actividad de producción/servicios dentro de la propia Cooperativa**, en que el socio aporta trabajo y participa de los rendimientos de esa sección. *Trade-off:* es la vía más congruente con el discurso cooperativo; **exige verificar si el objeto social de una cooperativa de CONSUMO admite dicha sección, o si requiere reforma estatutaria (Asamblea Extraordinaria) o incluso otro tipo de cooperativa.**
> - **D.** **Reformular el modelo**: que el socio comercial **sea también consumidor** y su anticipo derive de su propia operación de consumo, no de la venta a terceros. *Trade-off:* elimina el problema de raíz; **desarma la propuesta comercial hoy publicada.**
> - **E.** Otro encuadre a definir por el CLO.
>
> **Riesgo si queda abierto:** que la autoridad laboral o fiscal **recalifique** los anticipos como salario o como contraprestación por servicios, con las contingencias correspondientes; y que el esquema sea calificado desde fuera como **plan de comisiones ajeno al objeto de una cooperativa de consumo**, pese al vocabulario empleado.
>
> `[VERIFICAR CON DANIEL: si el objeto social de una cooperativa de consumo admite que un socio sea retribuido por incorporar clientes/organizaciones terceras, y bajo qué figura. NO se cita artículo porque no fue posible verificar el texto aplicable.]`
>
> **No se adopta ninguna opción en este borrador.**

### Artículo 15 Ter. Coordinador Regional y bono por crecimiento regional

1. **Naturaleza — puesto asignado, no nivel alcanzado.** El **Coordinador Regional** es un **puesto que la Cooperativa asigna** y que es **revocable** por el mismo órgano que lo asigna. **No se gana reclutando socios, no se hereda, no se compra y no constituye un nivel jerárquico por encima de otros socios.** Se ocupa mientras se desempeñen efectivamente las funciones del numeral 3.

2. **Zonas y número máximo.** Existe **un (1) Coordinador Regional por zona y máximo cuatro (4) en toda la República**. Las zonas son las **cuatro (4)** que la Cooperativa opera hoy en su plataforma y CRM (`shared/zonas.ts`), y que agrupan los 32 estados:
   a. **Centro** — Ciudad de México, México, Puebla, Tlaxcala, Morelos, Hidalgo y Querétaro (7 estados).
   b. **Norte** — Nuevo León, Chihuahua, Coahuila de Zaragoza, Tamaulipas, Sonora, Baja California, Baja California Sur, Sinaloa, Durango, San Luis Potosí, Zacatecas y Nayarit (12 estados).
   c. **Bajío** — Jalisco, Guanajuato, Aguascalientes, Colima y Michoacán de Ocampo (5 estados).
   d. **Sur-Sureste** — Veracruz de Ignacio de la Llave, Oaxaca, Chiapas, Guerrero, Tabasco, Campeche, Yucatán y Quintana Roo (8 estados).

   Los nombres de los estados se transcriben como constan en el mapeo operativo (denominaciones del DENUE/INEGI). La modificación de la integración de las zonas corresponde a la Administración, informando a la Asamblea.

3. **Funciones del Coordinador Regional.** Corresponde al Coordinador Regional, respecto de su zona:
   a. **Capacitar** a los socios de su zona en el uso de la plataforma y en el modelo cooperativo.
   b. **Dar soporte** a los socios y a las organizaciones de su zona, siendo su primer punto de contacto.
   c. **Abrir plaza**, desarrollando la presencia de la Cooperativa en los estados de su zona.
   d. **Promover el cooperativismo y la economía solidaria**, en congruencia con los fines de educación cooperativa de la Cooperativa y de la LGSC.
   e. **Dar conferencias** y actividades de difusión.
   f. **Ayudar en el onboarding de las organizaciones** de su zona que se incorporen a la plataforma.
   g. **Acompañar a las comisiones mixtas de capacitación, adiestramiento y productividad** a **registrar sus actas ante la Secretaría del Trabajo y Previsión Social (STPS)**.
   `[VERIFICAR CON DANIEL: denominación legal exacta de la comisión mixta y del trámite de registro de sus actas ante la STPS, y si el acompañamiento por parte de la Cooperativa o de un socio genera responsabilidad frente al patrón o requiere registro de agente capacitador. NO se cita fundamento porque no fue posible verificar el texto aplicable.]`

4. **Bono por crecimiento regional — estructura.** El Coordinador Regional percibe un **bono por crecimiento regional** integrado por **dos componentes**:
   a. **Cuota fija** por el desempeño de la función.
   b. **Variable** por el cumplimiento de **metas de zona**.

5. **Ausencia de cascada — regla esencial.** El bono por crecimiento regional retribuye **un servicio efectivamente prestado a la Cooperativa**. **No es, ni puede convertirse en, un porcentaje sobre las operaciones de los socios de la zona.** **No existe cascada, ni niveles, ni porcentaje derivado de terceros**, y el Coordinador **no percibe nada por el hecho de que otros socios operen**. Esta regla se establece como **esencial**: su supresión o modificación requiere acuerdo expreso de la Asamblea.

6. **Montos.** `[PENDIENTE: montos por definir por la Asamblea]` — **la cuota fija del numeral 4.a y las metas de zona y su variable del numeral 4.b NO están definidas.** **Este Reglamento no propone cifra alguna y no debe inventarse ninguna**: corresponde a la Asamblea General determinarlas. En congruencia, la Cooperativa **no publica ni simula** cifras de este bono mientras no existan.

7. **Encuadre jurídico de la función.** El marco jurídico bajo el cual se retribuye al Coordinador Regional (relación laboral, prestación de servicios, u otra figura) queda comprendido en la **Decisión Pendiente núm. 9**, y **no se resuelve en este artículo**.

8. **Asignación y revocación.** `[VERIFICAR CON DANIEL: qué órgano asigna y revoca el puesto de Coordinador Regional — Administrador Único/Consejo de Administración o Asamblea —, con qué causas y con qué procedimiento de audiencia previa. Este borrador NO lo define, para no atribuir facultades no verificadas contra el Acta Constitutiva.]`

---

## TÍTULO QUINTO — CONFIDENCIALIDAD Y GOBIERNO INTERNO

### Artículo 16. Confidencialidad y protección de datos de socios
1. Los datos personales de los socios inscritos en el Libro de Registro (nombre, RFC, CURP, domicilio, correo) se tratan conforme a la LFPDPPP y al Aviso de Privacidad de la Cooperativa, para los fines societarios, de notificación y de cumplimiento legal.
2. El acceso al Libro de Registro y a los datos de socios se restringe a los órganos de la Cooperativa en el ejercicio de sus funciones. No se divulgan datos personales de un socio a otros socios ni a terceros salvo obligación legal o consentimiento.
3. El registro on-chain no expone datos personales (Artículo 12.3).
4. La información confidencial generada al amparo de este Reglamento y de la operación de la plataforma es **propiedad de Ceduverse y de BrainShield**, conforme a los instrumentos que rigen la relación entre ambas.

### Artículo 17. Órganos y competencias (remisión)
La administración corresponde al **Administrador Único (Ernesto Santa Cruz Aranda**, conforme al Transitorio Segundo del Acta**)** o, en su caso, al Consejo de Administración; la vigilancia al Consejo de Vigilancia; y el gobierno supremo a la Asamblea General, conforme a los Artículos Noveno, Décimo y Décimo Octavo de los Estatutos. Este Reglamento no modifica dichas competencias.

### Artículo 18. Reformas al Reglamento
Este Reglamento y sus políticas (incluido el parámetro de capitalización del Artículo 14, el tabulador del Artículo 15 Bis y la autorización condicionada del Artículo 14 Ter) pueden ser reformados o revocados por acuerdo de la Asamblea General Ordinaria, dejando constancia en el libro de actas y comunicando la nueva versión a los socios por los medios de notificación registrados y por la plataforma Ceduverse (re-aceptación digital conforme al Plan de Adopción).

---

## TÍTULO SEXTO — VIGENCIA Y APROBACIÓN

### Artículo 19. Vigencia
Este Reglamento entrará en vigor a partir de su aprobación por la Asamblea General de Socios y del asiento del acta respectiva, y será oponible a los socios existentes desde su re-aceptación digital, y a los nuevos socios desde su adhesión.

### Artículo 20. Cláusula de borrador
**Mientras conste la marca "BORRADOR" en el encabezado, este documento carece de validez jurídica y sirve exclusivamente como propuesta de trabajo para revisión del CLO (Daniel Zavala) y aprobación de la Asamblea.** **NO se retire esta marca sino hasta que el CLO resuelva las 9 decisiones pendientes y la Asamblea apruebe el texto final.**

---

## ANEXO — Índice de puntos abiertos en este borrador

**9 decisiones pendientes (Daniel):**

| # | Decisión | Artículo donde muerde |
|---|---|---|
| 1 | Admisión digital masiva — reparto Consejo vs. Asamblea | Art. 6.3 |
| 2 | Transmisión de certificados — plazo del derecho del tanto y admisibilidad del lucro | Art. 11.3.b y Art. 11 |
| 3 | Certificados capitalizados (5% y bono) — ¿transmisibles o afectos? | Art. 11 / Arts. 14 y 14 Bis |
| 4 | Firma electrónica de títulos digitales ("firma autógrafa", Art. Sexto) | Art. 12.1 y Art. 9 |
| 5 | Split contable 5% aportación / 95% servicio — base de IVA y retenciones | Art. 14.1 y 14.3 |
| 6 | Reserva 1:1 de tesorería para la vía CEDU — custodio, responsable y asiento | Art. 14 Bis.2.a y Art. 14 Ter.3.a |
| 7 | Valor de reembolso de los certificados capitalizados (nominal vs. contable) | Art. 8 |
| 8 | Escalera por perfil y escalación por volumen (25%/30%/35%) vs. proporcionalidad de una cooperativa de consumo | Art. 15 Bis.2 y 15 Bis.3.d |
| 9 | Marco jurídico del "socio comercial" (laboral / servicios / sección de producción) | Todo el Título Cuarto Bis; Arts. 5 y 6 |

> **⚠️ Advertencia de origen — Título Cuarto Bis.** Los parámetros del tabulador del **Art. 15 Bis** **no tienen fuente documental**: existen hoy únicamente en el código de la landing pública de socios (`client/src/pages/socios-landing.tsx`) y **ya están publicados al público**. Se incorporan como **PROPUESTA a ratificar o ajustar**, no como política vigente. Ver la advertencia al inicio de dicho Título.

**`[PENDIENTE]` fiscales/contables no resueltos:** base de IVA/retenciones sobre la porción de servicio (Art. 14.3, Art. 15); **base de IVA del saldo de billetera de $20** (Art. 14 Bis.1.b, Art. 15); asiento del canje CEDU→aportación y beca→aportación (Art. 14 Ter.3, Art. 15); efecto en PTU/ISR y fondos obligatorios del Art. Vigésimo Primero (Art. 15).

**Dictamen regulatorio pendiente:** **Ley Fintech / IFPE respecto de CEDU** (Art. 14 Ter.4).

**Acreditación pendiente:** `[PENDIENTE: acreditar exhibición del capital — Libro de Registro de Socios + recibos de aportación]` (Art. 10).

---

**Aprobado por la Asamblea General de Socios el día [PENDIENTE].**

Administrador Único: **Ernesto Santa Cruz Aranda** — [firma pendiente]
Consejo de Vigilancia (Comisario): **Gladis Noemí Santos Ávila** — [firma pendiente]
Revisión legal: **Daniel Zavala Estrada, CLO** — [firma pendiente]

> `[VERIFICAR CON DANIEL: confirmar contra el Acta Constitutiva la integración exacta del Consejo de Vigilancia y el nombre/cargo de quien deba suscribir el Reglamento y el acta, así como si se requiere Secretario y quién lo ocupa.]`
