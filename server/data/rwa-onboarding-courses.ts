// ═══════════════════════════════════════════════════════════
// ACADEMIA RWA — Cursos de onboarding BrainShield (Studio)
// Formato: módulos con contentHtml (texto) + "Leer en voz alta"
// ═══════════════════════════════════════════════════════════

interface RwaModule {
  title: string;
  description: string;
  contentHtml: string;
  references?: string[];
  durationMinutes?: number;
}

export const rwaOnboardingModules: Record<string, RwaModule[]> = {

  "que-es-un-rwa": [
    {
      title: "Qué es un Real World Asset (RWA)",
      description: "Definición simple de RWA: activos del mundo real —inmuebles, oro, propiedad intelectual— representados on-chain. Off-chain vs on-chain.",
      durationMinutes: 12,
      contentHtml: `
<p>Bienvenido a Academia RWA. Antes de hablar de blockchain, de tokens o de tecnología, quiero que nos quedemos con una idea muy sencilla, porque todo lo demás se construye sobre ella: un <strong>Real World Asset</strong>, o RWA, es simplemente un activo del mundo real que se representa de forma digital. Nada más y nada menos. No es una promesa, no es un concepto abstracto de internet — es algo que existe, que se puede tocar, habitar, rentar o registrar en un notario, y que además tiene una versión digital que sirve para dar seguimiento, dar certeza y, en algunos casos, facilitar su intercambio.</p>

<p>Piensa en tres ejemplos concretos. El primero: un departamento en Playa del Carmen, con escritura pública, folio real en el Registro Público de la Propiedad, predial al corriente y, quizás, un contrato de arrendamiento vigente que genera renta mensual. El segundo: un lingote de oro de 24 kilates, guardado en una bóveda certificada, con su ensaye, su peso exacto y su número de serie. El tercero: una patente o una marca registrada — propiedad intelectual con valor comercial, protegida legalmente, que genera regalías cada vez que alguien la usa bajo licencia. Los tres son RWA. Los tres tienen algo en común: <strong>el valor no nace en internet, nace en el mundo físico y legal, y de ahí se conecta hacia lo digital</strong>.</p>

<h3>Off-chain vs. on-chain: la distinción que lo cambia todo</h3>
<p>Para entender un RWA hay que separar con toda claridad dos planos que conviven pero que no son lo mismo. El primero es el plano <strong>off-chain</strong>: es el mundo real, el que ya conocemos desde hace siglos. Ahí vive el activo físico —el departamento, el lingote, la patente— y ahí vive también todo su papeleo: la escritura, el avalúo, el certificado de ensaye, el registro ante el IMPI, los CFDI de las rentas, el contrato de arrendamiento, el título de propiedad. Todo esto existe y tiene validez independientemente de cualquier tecnología. Un departamento sigue siendo un departamento aunque nadie jamás lo suba a una computadora.</p>

<p>El segundo plano es el <strong>on-chain</strong>: es la representación digital de ese activo dentro de una red blockchain. Aquí no vive el activo — vive su huella, su registro, su prueba de existencia e integridad. Cuando decimos que un activo está "on-chain," normalmente nos referimos a que hay una entrada en una red pública, verificable por cualquiera, que dice: "este activo existe, tiene estas características, fue valuado de esta manera, en esta fecha, por este experto." Es información, no es el activo mismo.</p>

<p>Esta distinción parece obvia una vez que la explicamos, pero es justo la que más se presta a confusión —y a fraude— en el mundo de las criptomonedas. Mucha gente cree que "tokenizar" un activo significa que el token y el activo son la misma cosa, que basta con crear el token para que el valor aparezca. No es así. El token es un espejo. Si el espejo refleja algo real —un activo con dueño, con papeles en regla, con valor verificado— entonces el espejo es útil: te permite ver, dar seguimiento y en algún momento transferir ese valor con más agilidad. Pero si el espejo no refleja nada, si detrás del token no hay ningún activo defendible, entonces solo tienes un espejo apuntando al vacío. Bonito, quizás, pero vacío.</p>

<h3>Por qué "tokenizar" no es magia</h3>
<p>Aquí es donde queremos ser honestos contigo desde el primer módulo: tokenizar un activo no crea valor de la nada. No convierte un terreno abandonado en una mina de oro, ni una patente sin comprador en una fuente de regalías. Lo que hace la tokenización, cuando se hace bien, es dar <strong>tres cosas que el mundo off-chain por sí solo no siempre ofrece con facilidad</strong>: trazabilidad (puedes ver el historial completo de ese activo sin depender de un solo archivo en un cajón), verificabilidad (cualquiera puede confirmar que la información no fue alterada después de registrada) y, en algunos casos, mayor liquidez (fraccionar un activo grande en partes más pequeñas y accesibles).</p>

<p>Pero estas tres ventajas solo tienen sentido si el activo real sigue siendo sólido. Por eso en BrainShield insistimos tanto en que el trabajo pesado, el trabajo real, sucede off-chain: en la valuación hecha por un corredor certificado, en la revisión del título de propiedad, en la verificación de que el dinero y el activo tienen procedencia lícita. La parte on-chain —de la que hablaremos con calma en el módulo 4— es la última capa, la que sella y hace pública la integridad de todo ese trabajo previo. Nunca al revés.</p>

<h3>¿Por qué esto te importa a ti?</h3>
<p>Quizás estás tomando este curso porque piensas invertir, porque eres dueño de un activo que te gustaría estructurar, o simplemente porque quieres entender de qué se trata esta nueva ola de "RWA" de la que tanto se habla. En cualquiera de los tres casos, la primera defensa que tienes es exactamente esta distinción que acabas de aprender: pregúntate siempre "¿dónde vive el valor real de esto?" Si la respuesta apunta a un activo concreto, con papeles, con historia, con procedencia clara — vas por buen camino. Si la respuesta se queda flotando únicamente en una gráfica de precio y una promesa de comunidad, hay que detenerse y preguntar más.</p>

<p>Esta manera de pensar —empezar siempre por el activo real y tratar lo digital como una herramienta al servicio de ese activo, nunca como un reemplazo— es exactamente el criterio que vas a encontrar aplicado en cada uno de los siguientes módulos. En el módulo 2 vamos a hablar del problema real que resuelven los RWA legítimos: la iliquidez, la opacidad y la falta de procedencia que han afectado por décadas a activos como los inmuebles. En el módulo 3 vamos a conocer el marco de las <strong>4 patas</strong> que BrainShield exige para considerar que un RWA es defendible. En el módulo 4 entraremos, sin miedo y sin tecnicismos innecesarios, al tema de la atestación on-chain y al token CEDU de Ceduverse. Y en el módulo 5 cerraremos viendo cómo todo esto se conecta en un solo ecosistema.</p>

<p>Por ahora, quédate con esta idea simple y poderosa: <strong>un RWA es un activo real con una representación digital honesta de ese activo</strong>. El valor vive en el mundo, no en la pantalla. Todo lo que aprenderás de aquí en adelante es, en el fondo, la manera correcta —y la manera incorrecta— de construir ese puente entre ambos mundos. Sigamos al módulo 2 para entender exactamente qué problema resuelve esto y por qué, hasta ahora, tan pocos proyectos lo han hecho bien.</p>
      `,
      references: ["Pivote RWA BrainShield 2026-07-14"],
    },
    {
      title: "El problema que resuelve",
      description: "Iliquidez, opacidad y falta de procedencia en activos tradicionales. Por qué la mayoría de proyectos 'RWA' fingen la sustancia off-chain.",
      durationMinutes: 12,
      contentHtml: `
<p>En el módulo anterior definimos qué es un RWA: un activo real con una representación digital honesta. Ahora toca preguntarnos algo más práctico: ¿para qué sirve esto? ¿Qué problema resuelve exactamente que no se pudiera resolver antes? Porque si la tokenización no resolviera nada real, sería solo una moda tecnológica más. Y no lo es. Resuelve tres problemas concretos, dolorosos y muy conocidos por cualquiera que haya intentado vender un inmueble, comprar oro con confianza, o invertir en un activo que no fuera una acción de bolsa tradicional: <strong>iliquidez, opacidad y falta de procedencia</strong>.</p>

<h3>Iliquidez: el dinero atrapado en las paredes</h3>
<p>Empecemos con el ejemplo más cotidiano: un inmueble. Si hoy fueras dueño de un departamento y necesitaras el dinero de manera urgente, ¿en cuánto tiempo podrías convertirlo en efectivo? La respuesta honesta, en el mercado mexicano, suele ser: meses. A veces más de un año. Hay que encontrar comprador, negociar precio, esperar a que consiga su crédito o su liquidez, pasar por notario, esperar a que se libere el registro. Mientras tanto, tu dinero está atrapado dentro de las paredes de ese inmueble, sin poder moverse, sin poder usarse para otra oportunidad, sin poder ni siquiera fraccionarse para vender "una parte" y quedarte con el resto.</p>

<p>Esto se llama <strong>iliquidez</strong>, y no es un defecto menor: es probablemente la limitación más costosa de los activos tradicionales fuera del mercado bursátil. Compara esto con una acción de una empresa que cotiza en bolsa: la puedes comprar o vender en segundos, en la cantidad exacta que quieras, a un precio visible en tiempo real. Un inmueble, un lingote de oro guardado en casa, o una patente sin comprador identificado, no tienen ese lujo. La tokenización, cuando está bien construida, ataca justo este problema: permite fraccionar activos grandes en partes accesibles y da un canal más ágil —aunque nunca instantáneo como una acción bursátil— para encontrar contraparte y transferir valor.</p>

<h3>Opacidad: no sabes si el avalúo es real</h3>
<p>El segundo problema es la <strong>opacidad</strong>. Piensa en cuántas veces has escuchado —o vivido— la siguiente situación: alguien ofrece un terreno o un inmueble "avaluado en X millones de pesos," pero ese número sale de un papel sin firma verificable, de un "conocido que sabe de esto," o directamente del interés del propio vendedor en inflar el precio. ¿Cómo sabes si ese avalúo refleja la realidad del mercado o es simple deseo? La mayoría de los compradores no tiene manera fácil de auditar esa cifra. Confían, cruzan los dedos, y a veces pierden dinero por una valuación que nunca debió tomarse en serio.</p>

<p>Esta opacidad no es exclusiva de los inmuebles. Pasa con el oro cuando no hay ensaye certificado. Pasa con la propiedad intelectual cuando "alguien dice" que una patente vale una fortuna sin ningún análisis de mercado, de comparables, o de flujo de regalías proyectado. La falta de un tercero independiente que verifique el valor —y que ponga su firma y su reputación detrás de esa cifra— es lo que permite que la opacidad prospere. Un RWA bien construido resuelve esto exigiendo que la valuación provenga de un experto certificado, con metodología reconocida, y que ese dictamen quede registrado de forma que no se pueda alterar después de emitido.</p>

<h3>Falta de procedencia: ¿de dónde salió esto?</h3>
<p>El tercer problema, y quizás el más delicado, es la <strong>falta de procedencia</strong>. ¿De dónde salió el dinero con el que se compró este activo? ¿De dónde salió el activo mismo? En un país donde el lavado de dinero a través de bienes raíces, arte y metales preciosos ha sido documentado repetidamente por autoridades financieras, esta pregunta no es paranoia — es debida diligencia elemental. Un activo sin procedencia clara es un activo que puede esconder cualquier cosa: fondos de origen ilícito, operaciones simuladas, o title fraud (títulos de propiedad falsificados o disputados).</p>

<p>La procedencia también protege al comprador honesto de otra manera: si compras un activo sin verificar su historia legal, puedes terminar heredando problemas que no creaste —una hipoteca oculta, un litigio pendiente, un dueño anterior con reclamos no resueltos. Verificar la procedencia —quién ha sido dueño, cómo se pagó, si hay CFDI que respalden las transacciones, si el KYC (conocimiento del cliente) de las partes involucradas está en regla— no es un trámite burocrático más. Es la diferencia entre un activo defendible y una bomba de tiempo legal.</p>

<h3>Por qué la mayoría de proyectos "RWA" fingen la sustancia off-chain</h3>
<p>Aquí llegamos al punto más importante de este módulo, y quizás del curso completo. En los últimos años ha surgido un aluvión de proyectos que se anuncian como "RWA," con sitios web atractivos, presentaciones llenas de gráficas ascendentes y promesas de rendimiento. El problema es que una gran parte de ellos hace exactamente lo contrario de lo que hemos explicado hasta ahora: <strong>emiten primero el token, y después —si acaso— buscan un activo real que lo respalde</strong>. O peor: nunca lo buscan. El token existe, se puede comprar y vender, tiene una gráfica de precio... pero detrás no hay ningún inmueble, ningún lingote, ninguna patente que puedas señalar con el dedo y decir "esto es lo que estoy comprando."</p>

<p>Esto ocurre porque hacer bien la parte off-chain es difícil, lento y costoso: contratar un corredor certificado, esperar semanas por un avalúo serio, reunir toda la documentación legal, verificar procedencia con autoridades y bases de datos. En cambio, crear un token y una página web puede tomar días. La tentación de saltarse el trabajo difícil —la sustancia real— y quedarse solo con la fachada digital es enorme, y por eso el mercado de RWA está lleno de proyectos que son, en el fondo, un espejo apuntando al vacío del que hablamos en el módulo anterior.</p>

<p>Esta es exactamente la razón por la que BrainShield construyó un marco explícito de verificación antes de considerar que un activo puede llamarse RWA dentro de nuestro ecosistema. No basta con "tener un token." Se necesita demostrar sustancia real, de manera verificable, en cuatro frentes distintos. A eso le llamamos las <strong>4 patas de un RWA legítimo</strong>, y es exactamente el tema que exploraremos, con calma y con ejemplos concretos, en el módulo 3.</p>
      `,
      references: ["Pivote RWA BrainShield 2026-07-14"],
    },
    {
      title: "Las 4 patas de un RWA legítimo (marco BrainShield)",
      description: "Valuación independiente, título legal, flujo de efectivo y procedencia. La mesa que necesita sus 4 patas para sostenerse.",
      durationMinutes: 14,
      contentHtml: `
<p>Ya entendimos qué es un RWA y qué problema resuelve cuando está bien construido. Ahora llegamos al corazón técnico —pero muy práctico— de este curso: ¿cómo distinguimos un RWA legítimo de uno que solo finge serlo? En BrainShield usamos una analogía sencilla que te va a acompañar cada vez que evalúes un activo: <strong>una mesa necesita sus cuatro patas para sostenerse</strong>. Si le falta una, la mesa no se cae de inmediato —puede parecer estable un rato— pero tarde o temprano, con el peso suficiente, colapsa. Un RWA funciona igual. Necesita sus cuatro patas: valuación independiente, título legal, flujo de efectivo y procedencia. Si falta una sola, el activo no es defendible, sin importar cuán bonita sea la presentación digital que lo acompañe.</p>

<h3>Pata 1: Valuación independiente</h3>
<p>La primera pata es que el valor del activo debe provenir de un tercero independiente, certificado, sin conflicto de interés con quien vende o quien origina el activo. En BrainShield esto lo hacemos a través de un <strong>corredor público titulado</strong> que sigue la metodología de la <strong>NIF C-8</strong> (la Norma de Información Financiera mexicana para activos intangibles, adaptada también a nuestro proceso para tangibles). Este corredor no cobra comisión sobre el resultado del avalúo — trabajamos con un modelo de <strong>0% de margen</strong> en esta pieza específicamente para eliminar cualquier incentivo de inflar el número.</p>

<p>¿Por qué es tan importante esta independencia? Porque un avalúo hecho por el propio vendedor, o por alguien con interés económico en que el precio salga alto, deja de ser información — se convierte en publicidad disfrazada de dato técnico. Un corredor independiente, con su cédula profesional en juego y sin comisión atada al resultado, tiene un solo incentivo: que el número sea correcto. Esa es la diferencia entre "creer" el valor de un activo y poder defenderlo ante cualquiera que lo cuestione.</p>

<h3>Pata 2: Título legal</h3>
<p>La segunda pata es que el activo debe ser <strong>enajenable</strong> — es decir, debe existir la capacidad legal real de transferirlo, venderlo o cederlo. Esto suena obvio, pero en la práctica es donde más fallan los proyectos improvisados. Un inmueble necesita escritura pública en regla, sin gravámenes ocultos, sin litigios pendientes, con el Registro Público de la Propiedad actualizado. Una patente necesita estar efectivamente registrada ante el IMPI (o la autoridad correspondiente si es internacional), con la titularidad clara y sin disputas de coautoría sin resolver. Un lingote de oro necesita certificado de ensaye y cadena de custodia clara desde la refinería hasta la bóveda.</p>

<p>Si el título legal no es claro, todo lo demás se vuelve irrelevante. Puedes tener el mejor avalúo del mundo sobre un activo que, legalmente, no se puede vender, o que está embargado, o cuya titularidad está en disputa entre dos partes. Por eso, antes de que cualquier activo entre al ecosistema BrainShield, se revisa documentalmente su título: quién es el dueño legítimo, qué gravámenes existen, y si efectivamente hay libertad jurídica para transferirlo.</p>

<h3>Pata 3: Flujo de efectivo</h3>
<p>La tercera pata, y una de las que más valor aporta a quien participa en el ecosistema, es que el activo genere —o tenga capacidad demostrable de generar— <strong>flujo de efectivo</strong>. Esto puede ser la renta mensual de un inmueble arrendado, las regalías de una patente bajo licencia comercial, o cualquier otro ingreso recurrente y verificable atado al activo. Un activo que solo existe para "apreciarse" con el tiempo, sin generar ningún flujo mientras tanto, depende enteramente de que alguien más lo quiera comprar después a un precio mayor — lo que en finanzas se conoce coloquialmente como depender de "un mayor tonto." Un activo con flujo de efectivo, en cambio, tiene un valor que se sostiene independientemente de la especulación: genera dinero real, de forma recurrente, mientras esperas.</p>

<p>Este flujo de efectivo también es lo que hace posible, en algunos casos, distribuir rendimientos a quienes participan en la estructura del activo — pero siempre anclado a un ingreso real y documentado, nunca a una promesa.</p>

<h3>Pata 4: Procedencia</h3>
<p>La cuarta y última pata es la <strong>procedencia</strong>: la capacidad de demostrar, con evidencia dura, de dónde viene el activo y de dónde viene el dinero involucrado en su compra, venta o estructuración. Aquí es donde BrainShield es particularmente riguroso, porque sabemos que este es el punto donde el mercado mexicano de activos ha sido más vulnerable al fraude y al lavado de dinero.</p>

<p>La procedencia se demuestra con varias piezas concretas: un <strong>hash SHA-256</strong> que sirve como huella digital inalterable de cada documento clave del expediente (el avalúo, el contrato, el CFDI); los <strong>CFDI</strong> correspondientes a cada operación relevante, para que exista rastro fiscal verificable; el proceso de <strong>KYC</strong> (Know Your Customer) de todas las partes involucradas, para saber con certeza quién participa en la operación; y lo que en BrainShield llamamos el <strong>defense file 69-B</strong> — una carpeta de evidencia estructurada precisamente para poder defender la operación ante una eventual revisión del artículo 69-B del Código Fiscal de la Federación, que es el mecanismo con el que el SAT identifica operaciones simuladas y contribuyentes que facturan sin sustancia real.</p>

<p>Este último punto merece una mención especial: el artículo 69-B ha sido, durante los últimos años, la herramienta más importante del SAT para detectar y sancionar facturación falsa y operaciones inexistentes. Un RWA que no puede sostener un defense file sólido ante ese escrutinio, sencillamente no debería llamarse RWA — sería, en el mejor de los casos, un activo con documentación incompleta, y en el peor, una operación diseñada para no resistir revisión.</p>

<h3>La mesa completa</h3>
<p>Ahora que conoces las cuatro patas, vuelve a la analogía de la mesa. Un activo con excelente valuación pero sin título legal claro es una mesa con tres patas: puede sostenerse un rato, pero se va a caer. Un activo con título perfecto pero sin ninguna procedencia verificable de los fondos involucrados es igual de frágil. Solo cuando las cuatro patas están presentes —valuación independiente, título legal, flujo de efectivo y procedencia— tenemos una mesa que se sostiene sola, sin necesitar apoyos externos ni confianza ciega.</p>

<p>Este es el filtro exacto que BrainShield aplica antes de originar cualquier activo dentro de su ecosistema, y es también el filtro que te recomendamos aplicar tú mismo cada vez que evalúes cualquier oportunidad que se anuncie como "RWA," sea de BrainShield o de cualquier otro proyecto. Pregunta siempre por las cuatro patas. Si alguna falta, o si nadie puede mostrártela con documentos concretos, ya sabes que la mesa no es segura.</p>

<p>En el siguiente módulo vamos a hablar de cómo, una vez que las cuatro patas están firmes en el mundo off-chain, BrainShield usa la tecnología blockchain —específicamente la red Base— no para reemplazar nada de esto, sino para sellarlo de forma pública e inalterable. Vamos a hablar de atestación, no de tokenización especulativa, y del token CEDU de Ceduverse, diseñado deliberadamente para no tener volatilidad — aunque, como vas a ver, todavía no está desplegado.</p>
      `,
      references: ["Pivote RWA BrainShield 2026-07-14"],
    },
    {
      title: "On-chain sin miedo: atestación vs. tokenización",
      description: "Qué es Base, qué es anclar un hash (atestación, no pago on-chain), el token CEDU 1:1 MXN como diseño de Ceduverse (aún no desplegado), y por qué KakawChain aún no existe como producto.",
      durationMinutes: 13,
      contentHtml: `
<p>Si llegaste hasta aquí sin haber tocado nunca una wallet de criptomonedas, tranquilo: este módulo está pensado exactamente para ti. No vamos a llenarte de jerga innecesaria. Vamos a explicar, con la misma calma con la que hemos avanzado hasta ahora, qué es lo que realmente hace BrainShield cuando dice que un activo tiene un "registro on-chain," y por qué eso es mucho más sencillo —y mucho menos riesgoso— de lo que probablemente imaginas.</p>

<h3>Qué es Base, en términos simples</h3>
<p><strong>Base</strong> es una red blockchain de "capa 2" (Layer 2) construida sobre Ethereum, una de las redes blockchain más establecidas y con mayor historial de seguridad del mundo. No necesitas entender la ingeniería detrás de esto para aprovecharlo; basta con saber tres cosas prácticas. Primero: es una red pública, lo que significa que cualquier persona, en cualquier parte del mundo, puede consultar la información registrada ahí sin pedir permiso a nadie — no depende de un solo servidor de una sola empresa que pueda apagarse o borrarse. Segundo: es una red donde, una vez que algo queda registrado, no se puede alterar ni borrar retroactivamente — cada registro queda sellado con fecha y con una prueba criptográfica de que nadie lo modificó después. Tercero: opera con costos de transacción bajos, lo que la hace práctica para registrar documentos y atestaciones de forma frecuente, sin gastar cantidades desproporcionadas de dinero solo en el trámite tecnológico.</p>

<p>Base fue elegida por BrainShield precisamente por este balance: suficiente seguridad y trayectoria (al heredar las garantías de Ethereum), con costos operativos razonables para nuestro caso de uso, que es sellar documentación, no especular con precios de tokens.</p>

<h3>Anclar un hash: la huella digital inalterable</h3>
<p>Aquí llega el concepto más importante de todo el módulo, y quiero que te quede completamente claro: cuando decimos que BrainShield "ancla un hash" en Base, <strong>no estamos hablando de mover dinero a través de la blockchain</strong>. Estamos hablando de algo mucho más simple: tomar un documento —por ejemplo, el dictamen de valuación de un corredor, o el comprobante de un pago realizado— y generar de ese documento una especie de huella digital única, llamada <strong>hash SHA-256</strong>.</p>

<p>Piensa en el hash como la huella dactilar de un documento. Si el documento cambia una sola coma, su huella cambia por completo. Si el documento permanece idéntico, su huella siempre será exactamente la misma. Lo que BrainShield hace es tomar esa huella —no el documento completo, no información confidencial, solo la huella— y registrarla en la red Base. A partir de ese momento, cualquiera puede tomar el documento original y verificar, comparando huellas, que no ha sido alterado desde el día en que se registró. Eso es <strong>atestación</strong>: una prueba pública e inalterable de integridad. No es una transferencia de valor, no es un pago, no es una inversión — es una notaría digital de bajo costo para la evidencia documental.</p>

<p>Esta distinción es la que queremos que nunca olvides: <strong>atestación no es lo mismo que pago on-chain</strong>. El dinero real de una operación de BrainShield —la compra de un activo, el pago de una renta, la liquidación de una comisión— sigue moviéndose por los canales tradicionales: transferencias SPEI, cuentas bancarias reguladas, CFDI ante el SAT. La blockchain, en nuestro modelo, no reemplaza al sistema financiero mexicano ni pretende sustituirlo. Su función es mucho más modesta y, precisamente por eso, mucho más confiable: sellar con una marca de tiempo pública e imposible de falsificar que un documento existió, en cierta forma, en cierta fecha.</p>

<h3>El token CEDU: estable por diseño</h3>
<p>Ahora hablemos del <strong>token CEDU</strong>, el token que Ceduverse ha diseñado para su propio ecosistema. Si alguna vez has escuchado sobre criptomonedas, probablemente asocias la palabra "token" con volatilidad — gráficas que suben y bajan de forma dramática en cuestión de horas. CEDU está pensado deliberadamente para ser lo opuesto a eso: es un token diseñado para estar <strong>pegado 1:1 al peso mexicano (MXN)</strong>, de modo que su valor no dependa de las subidas ni caídas especulativas que caracterizan a criptomonedas como Bitcoin o Ethereum.</p>

<p>Y aquí queremos ser completamente precisos, con la misma honestidad que hemos usado en todo este curso: <strong>CEDU es, a la fecha de este curso, un diseño — no un token desplegado ni en operación</strong>. Existe como especificación dentro de la arquitectura que Ceduverse está construyendo, pero todavía no puedes comprarlo, recibirlo ni usarlo en ninguna operación real. Te explicamos su diseño ahora, en esta etapa temprana, para que entiendas la intención detrás de él —por qué se pensó estable y no especulativo— sin que eso se confunda jamás con "ya existe y funciona".</p>

<p>La razón detrás de este diseño es simple: la idea no es que participes en un casino de precios. La intención es, en su momento, darte un instrumento de valor estable, útil para representar y mover valor dentro del ecosistema de Ceduverse, sin añadir una capa extra de riesgo especulativo encima del riesgo (ya de por sí gestionado con las 4 patas del módulo anterior) del activo subyacente. Dicho de otra forma: la incertidumbre que existe en cualquier inversión debe venir del activo real —¿se rentará el departamento?, ¿se venderá la patente bajo licencia?— y no de la volatilidad artificial de un token especulativo. Ese es el principio detrás del diseño de CEDU, aunque su despliegue todavía esté por llegar.</p>

<h3>Una aclaración importante: qué existe hoy y qué es todavía diseño</h3>
<p>Es posible que en algún momento hayas escuchado o escuches en el futuro sobre <strong>KakawChain</strong> o <strong>KakawCoin</strong>, otros proyectos dentro del consorcio al que pertenece Ceduverse. Queremos ser completamente transparentes contigo: a la fecha de este curso, <strong>KakawChain y KakawCoin todavía no existen como producto</strong>. Son parte de una visión de largo plazo, pero no son parte de la operación actual de atestación de RWA.</p>

<p>Y para que no quede ninguna ambigüedad: lo mismo aplica a los tokens 1:1 que distintos proyectos del consorcio han diseñado, incluido el CEDU del que hablamos arriba. Diseñar un token —definir su paridad, su propósito, su lógica— no es lo mismo que desplegarlo y ponerlo a operar. Lo único que existe y opera hoy, de todo lo que hemos descrito en este módulo, es <strong>Base como red</strong> y <strong>el hash SHA-256 como mecanismo de atestación</strong>. Cualquier mención de un token del consorcio —CEDU o cualquier otro— como si ya estuviera desplegado y en operación sería, sencillamente, inexacta, y no representa el estado actual del proyecto.</p>

<p>Esta honestidad sobre lo que existe y lo que todavía no existe es, en sí misma, una aplicación directa de todo lo que hemos hablado en este curso: la sustancia siempre antes que la promesa.</p>

<h3>Cerrando el círculo</h3>
<p>Con esto ya tienes el panorama completo de cómo BrainShield conecta lo real con lo digital: un activo pasa primero por las 4 patas —valuación, título, flujo, procedencia— en el mundo off-chain. Una vez verificado, los documentos clave de ese proceso se sellan mediante atestación —un hash inalterable— en la red Base; eso, junto con la atestación misma, es lo único que opera hoy. Cuando en el futuro haga falta representar valor de forma estable dentro del ecosistema de Ceduverse, está pensado usarse el token CEDU, diseñado 1:1 al peso mexicano, sin volatilidad especulativa — recordando siempre que ese token, por ahora, es diseño y no una pieza en operación. Nada de esto sustituye al sistema legal y financiero mexicano — todo lo complementa, añadiendo una capa de transparencia e integridad verificable que antes no existía con esta facilidad.</p>

<p>En el módulo final vamos a dar un paso atrás y ver el panorama completo: cómo encajan BrainShield, el marketplace de RWA, CryptoVault 24k y el anonimato del socio en un solo ecosistema coherente — y cómo puedes tú empezar a participar en él.</p>
      `,
      references: ["Pivote RWA BrainShield 2026-07-14"],
    },
    {
      title: "El ecosistema BrainShield",
      description: "Cómo encajan BrainShield (originador), el marketplace de RWA, CryptoVault 24k y el anonimato del socio. Cierre del Curso 1.",
      durationMinutes: 12,
      contentHtml: `
<p>Llegamos al último módulo del Curso 1. Hasta ahora hemos ido construyendo el conocimiento pieza por pieza: qué es un RWA, qué problema resuelve, cómo se verifica con las 4 patas, y cómo se sella su integridad con atestación on-chain sin caer en la volatilidad especulativa. En este módulo vamos a juntar todas esas piezas para que veas el panorama completo: <strong>el ecosistema BrainShield</strong>, de principio a fin, y cómo tú puedes participar en él.</p>

<h3>BrainShield como originador</h3>
<p>Todo comienza con <strong>BrainShield como originador de activos</strong>. Originar significa que BrainShield es quien identifica un activo candidato —un inmueble, un lote de oro, una pieza de propiedad intelectual— y lo somete al proceso completo de verificación que ya conoces: contrata al corredor independiente para la valuación bajo NIF C-8 con 0% de margen, revisa el título legal para confirmar que el activo es efectivamente enajenable, documenta el flujo de efectivo real o proyectado, e integra el expediente de procedencia con hash SHA-256, CFDI, KYC de las partes involucradas y el defense file pensado para resistir una revisión bajo el artículo 69-B.</p>

<p>Este trabajo de originación es, honestamente, la parte más laboriosa y menos visible de todo el ecosistema — y es también la más importante. Es el trabajo que separa a BrainShield de los proyectos que "fingen la sustancia off-chain" de los que hablamos en el módulo 2. Sin un originador serio, dispuesto a hacer el trabajo pesado de verificación antes de ofrecer cualquier activo, todo lo demás —el marketplace, la tecnología, el token— carecería de sentido.</p>

<h3>El marketplace de RWA</h3>
<p>Una vez que un activo pasa por el proceso de originación y las 4 patas quedan firmes, ese activo se incorpora al <strong>marketplace de RWA</strong> de BrainShield. Este marketplace es, en esencia, el lugar donde los activos verificados se presentan de forma ordenada, transparente y comparable: cada uno con su ficha técnica, su dictamen de valuación, su flujo de efectivo documentado, y su expediente de procedencia disponible para revisión.</p>

<p>La diferencia con el mercado tradicional de inversión en activos reales —donde muchas veces la información depende de la palabra de un vendedor o de un intermediario con incentivos poco claros— es que en el marketplace de BrainShield cada activo ya trae consigo la evidencia de sus 4 patas antes de ser ofrecido. Esto no elimina el riesgo inherente a cualquier inversión —ningún activo real está libre de riesgo de mercado, de vacancia, de variación en el valor de reventa— pero sí elimina el riesgo adicional e innecesario de invertir en algo cuya existencia y legitimidad ni siquiera se puede verificar.</p>

<h3>CryptoVault 24k: el oro como puerta de entrada</h3>
<p>Dentro de este ecosistema, uno de los productos insignia es <strong>CryptoVault 24k</strong>: oro físico de 24 kilates, con procedencia y custodia verificadas, pensado como una de las puertas de entrada más accesibles y comprensibles al mundo de los RWA. El oro tiene una ventaja pedagógica enorme para quien recién está conociendo este espacio: es un activo que la gente entiende de forma intuitiva desde hace miles de años. No requiere explicar contratos de arrendamiento ni proyecciones de regalías — su valor es tangible, físico, y universalmente reconocido.</p>

<p>CryptoVault 24k aplica exactamente el mismo marco de las 4 patas que cualquier otro activo del ecosistema: ensaye y custodia verificados (título y procedencia), valuación independiente basada en el precio de mercado del oro (valuación independiente), y en algunos esquemas, la posibilidad de generar valor mediante estructuras de resguardo o intermediación (flujo de efectivo). Es, en muchos sentidos, el ejemplo más claro y accesible de todo lo que hemos enseñado en este curso, hecho tangible en un producto concreto.</p>

<h3>El anonimato del socio</h3>
<p>Un elemento distintivo del ecosistema BrainShield es el cuidado especial que se pone en el <strong>anonimato del socio</strong> — es decir, de la persona que participa económicamente en la estructura de un activo. Esto no significa opacidad ni falta de cumplimiento: como ya sabes, el KYC (conocimiento del cliente) es parte obligatoria de la pata de procedencia, y BrainShield conoce y verifica la identidad de cada participante conforme a la normativa aplicable.</p>

<p>Lo que sí protege el anonimato del socio es su exposición pública innecesaria: no es lo mismo que una autoridad regulatoria conozca tu identidad como parte de un proceso de cumplimiento legítimo, a que tu nombre, tu patrimonio o tu participación en un activo específico queden expuestos frente al público general, frente a otros socios, o frente a terceros sin ninguna necesidad legal de que así sea. BrainShield diseña sus estructuras —incluyendo el uso de alias y mecanismos de verificación que no requieren exponer datos innecesarios— para que puedas participar en el ecosistema de RWA con la confianza de que tu privacidad patrimonial está tan cuidada como la legitimidad legal de los activos en los que participas.</p>

<h3>Cómo encajan todas las piezas</h3>
<p>Ahora que conoces cada pieza por separado, veamos el recorrido completo de principio a fin. BrainShield identifica un activo con potencial real. Lo somete al proceso de originación: valuación independiente, revisión de título legal, documentación de flujo de efectivo, e integración del expediente de procedencia. Una vez verificado, el activo entra al marketplace de RWA, donde queda disponible de forma ordenada y transparente. Los documentos clave de todo este proceso se sellan mediante atestación en la red Base, dejando una huella pública e inalterable de su integridad. Si el activo es oro, puede tomar la forma concreta de CryptoVault 24k. Y en todo momento, la identidad y el patrimonio de cada socio que participa se protegen mediante los mecanismos de anonimato del ecosistema, sin comprometer nunca el cumplimiento legal ni el KYC requerido.</p>

<p>Este es el ecosistema completo: no es un token aislado, no es una promesa de rendimiento, no es una gráfica de precio flotando sin nada detrás. Es un sistema pensado, pieza por pieza, para que cada activo que encuentres ahí tenga sustancia real y verificable, y para que tu participación en él esté protegida tanto legal como personalmente.</p>

<h3>Cierre: tu siguiente paso</h3>
<p>Has completado el Curso 1 de Academia RWA. Ya sabes qué es un Real World Asset, qué problema resuelve frente a la iliquidez, la opacidad y la falta de procedencia de los activos tradicionales, cómo se verifica con las 4 patas de BrainShield, y cómo se sella su integridad mediante atestación en Base — con el token CEDU de Ceduverse diseñado, a futuro, para representar valor sin caer nunca en la especulación innecesaria. Tienes ahora el criterio para distinguir un RWA legítimo de uno que solo finge serlo — y ese criterio te va a servir mucho más allá de este curso, en cualquier oportunidad de inversión que se te presente en el futuro.</p>

<p>El siguiente paso es tuyo: <strong>crea tu cuenta y explora el marketplace de activos reales</strong>. Ahí vas a encontrar, aplicados en la práctica, cada uno de los conceptos que acabas de aprender. No tengas miedo de hacer preguntas, de pedir ver el expediente de procedencia de un activo, o de verificar tú mismo el hash de un dictamen en la red Base. Ese es, precisamente, el espíritu de todo este ecosistema: la transparencia no es un adorno, es el fundamento.</p>
      `,
      references: ["Pivote RWA BrainShield 2026-07-14"],
    },
  ],

  "brainshield-boveda-pi": [
    {
      title: "Qué es BrainShield",
      description: "BrainShield como originador de Real World Assets: tangibles (inmuebles) e intangibles (propiedad intelectual). Qué hace, qué protege y qué NO es.",
      durationMinutes: 11,
      contentHtml: `
<p>Bienvenido al Curso 2 de Academia RWA. En el curso anterior aprendiste qué es un Real World Asset y qué problema resuelve cuando está bien construido: iliquidez, opacidad y falta de procedencia. En este curso vamos a bajar esa idea a un caso concreto y real: <strong>BrainShield</strong>, la empresa que dentro del consorcio se dedica, precisamente, a originar y proteger activos del mundo real. Si no tomaste el Curso 1, no te preocupes — vamos a explicar todo desde cero, sin dar nada por sentado.</p>

<h3>BrainShield: una empresa real, no una promesa de blockchain</h3>
<p>BrainShield es una Sociedad Civil mexicana constituida legalmente ante notario, con registro público y RFC propio. No es un proyecto anónimo de internet ni una comunidad de token — es una empresa con estructura legal, socios de registro y una operación que puedes auditar. Nació enfocada en la administración anónima de propiedad intelectual, y hoy se comunica de forma más amplia como lo que realmente hace: <strong>un originador de Real World Assets</strong>. Es decir, la empresa que hace el trabajo pesado —el trabajo off-chain, legal, documental y de valuación— para que un activo del mundo real pueda tratarse como un RWA defendible, sin fingir sustancia que no existe.</p>

<h3>Dos tipos de RWA: lo tangible y lo intangible</h3>
<p>BrainShield origina dos grandes familias de activos. La primera son los <strong>tangibles</strong>: bienes raíces, como un hotel boutique en Playa del Carmen, cuya operación de estructuración BrainShield acompaña del lado del vendedor. La segunda son los <strong>intangibles</strong>: propiedad intelectual —patentes, marcas, secretos industriales— que un creador o una empresa deposita para que sea administrada, valuada y, si así lo decide su dueño, licenciada a terceros a cambio de una regalía recurrente.</p>

<p>Lo interesante de estas dos familias, aunque parezcan mundos distintos, es que BrainShield las trabaja con la misma maquinaria de fondo: una valuación hecha por un experto independiente, una revisión de que el activo tiene título legal claro y es transferible, una verificación de que genera o puede generar flujo de efectivo, y un expediente de procedencia que sostenga todo lo anterior frente a cualquier revisión. Si tomaste el Curso 1, reconocerás esto como las <strong>4 patas de un RWA legítimo</strong>. Si no lo tomaste, quédate con la idea simple: sea un hotel o una patente, BrainShield exige la misma sustancia real antes de considerar que algo es un activo defendible.</p>

<h3>Qué hace BrainShield exactamente: originar, no solo anunciar</h3>
<p>"Originar" es la palabra clave, y vale la pena detenerse en ella. Originar no es publicar un anuncio de que "este activo existe" — es hacer el trabajo de identificarlo, verificarlo, documentarlo y prepararlo para que pueda circular con confianza dentro del ecosistema. En el caso de la propiedad intelectual, esto significa recibir el activo del creador, ayudarlo a documentar su existencia y su titularidad, coordinar su valuación con un experto independiente, y —cuando el dueño lo decide— conectarlo con empresas interesadas en licenciarlo, siempre bajo un contrato formal y con una regalía definida.</p>

<p>En el caso de los bienes raíces, originar significa acompañar el proceso de estructuración de la operación: revisar la documentación legal del inmueble, coordinar el avalúo, y preparar toda la evidencia de procedencia que un comprador serio necesita para confiar en la operación. En ambos casos, BrainShield no inventa valor — lo verifica, lo documenta, y lo hace visible de forma ordenada.</p>

<h3>Custodiar sin apropiarse</h3>
<p>Un punto que queremos dejarte muy claro desde este primer módulo: BrainShield <strong>custodia y protege</strong> la evidencia de tu activo, pero eso no significa que se vuelva dueño de él. Cuando depositas propiedad intelectual, BrainShield guarda de forma segura los documentos que la respaldan, sella su integridad para que nadie pueda alterarlos después, y administra el proceso de valuación y licenciamiento en tu nombre — pero la titularidad sigue siendo tuya, salvo que tú, de forma explícita y mediante un acuerdo formal, decidas otra cosa. La función de BrainShield es de administrador y custodio de evidencia, no de dueño por defecto.</p>

<p>Con esta base ya puedes entender por qué BrainShield existe: para que activos reales —tangibles o intangibles— que hoy son difíciles de valuar, difíciles de proteger y difíciles de licenciar con confianza, puedan pasar por un proceso serio que los vuelva defendibles. En el siguiente módulo vamos a entrar al corazón de la propuesta para propiedad intelectual: la <strong>bóveda de PI anónima</strong>, cómo se deposita un activo intangible ahí, y cómo funciona el modelo de reparto cuando ese activo empieza a generar valor.</p>
      `,
      references: ["Pivote RWA BrainShield 2026-07-14", "Estructura legal BrainShield S.C. (Acta 5905)"],
    },
    {
      title: "La bóveda de PI anónima",
      description: "Cómo un creador deposita su PI (patente, marca, secreto industrial), el alias, el modelo 80/20, la regalía, y el anonimato como secreto industrial.",
      durationMinutes: 13,
      contentHtml: `
<p>En el módulo anterior conociste a BrainShield como originador de Real World Assets, tanto tangibles como intangibles. En este módulo nos vamos a enfocar exclusivamente en la parte intangible: la <strong>bóveda de PI</strong>, el mecanismo mediante el cual un creador deposita su propiedad intelectual para que sea administrada, protegida y, eventualmente, licenciada — todo esto sin exponer públicamente su identidad.</p>

<h3>Qué puedes depositar en la bóveda</h3>
<p>La bóveda de PI de BrainShield está pensada para tres grandes categorías de propiedad intelectual: <strong>patentes</strong> (invenciones registradas o registrables), <strong>marcas</strong> (signos distintivos con valor comercial) y <strong>secretos industriales</strong> (conocimiento técnico o de negocio que da una ventaja competitiva precisamente porque no es público). Cada una de estas categorías tiene su propia lógica de protección legal en México, pero las tres comparten algo: son activos cuyo valor depende de que alguien pueda demostrar, de forma verificable, que le pertenecen y desde cuándo.</p>

<p>Si eres, por ejemplo, un inventor con una patente registrada que hoy no está generando ingreso porque no tienes la estructura para licenciarla, o una empresa con una fórmula o proceso que preferirías mantener en secreto pero cuyo valor te gustaría poder demostrar y eventualmente monetizar, la bóveda de PI está construida pensando exactamente en tu situación.</p>

<h3>Cómo funciona el depósito: de documento a huella digital</h3>
<p>El proceso empieza de forma sencilla: subes la evidencia documental de tu activo —el registro, los planos, la descripción técnica, cualquier soporte que demuestre su existencia y su titularidad— a un repositorio protegido. A cada archivo que subes se le calcula, de forma automática, una <strong>huella digital única (hash SHA-256)</strong>: una especie de firma matemática que cambia por completo si el documento se altera aunque sea en un solo carácter, y que permanece idéntica si el documento no se toca. Cuando decides sellar tu activo, se genera además un <strong>hash maestro</strong> que combina las huellas de todos tus documentos en una sola prueba de integridad conjunta.</p>

<p>A partir de ese momento, tienes una prueba verificable —no una promesa, no la palabra de alguien— de que tu propiedad intelectual existía, en esa forma exacta, desde esa fecha. Esta es la base sobre la que se construye todo lo demás: la valuación, la posible licencia, y la eventual atestación pública que veremos en el módulo 3.</p>

<h3>Tu alias: quién eres para el sistema</h3>
<p>Aquí llega uno de los elementos distintivos de BrainShield. Dentro del sistema, tu identidad no aparece con tu nombre real de forma pública: se te asigna un <strong>alias</strong> —algo como "vault_sol_42k" o "vault_ejemplo_07x"— que es el nombre bajo el cual tu activo se administra, se valúa y, si corresponde, se licencia. BrainShield sí conoce tu identidad real, porque la ley exige procesos de identificación de las partes en cualquier operación formal — pero esa identidad no se expone innecesariamente frente a terceros, otros usuarios, ni al público en general. El alias es la capa que separa "quién eres" de "qué activo administras," para que puedas participar en el ecosistema sin que tu nombre quede ligado públicamente a tu propiedad intelectual.</p>

<h3>El modelo 80/20: qué pasa cuando tu PI empieza a generar valor</h3>
<p>Cuando tu propiedad intelectual se licencia a una empresa interesada —es decir, cuando alguien paga por usarla bajo un contrato formal— se genera un pago recurrente, una <strong>regalía</strong>, cada vez que esa licencia produce ingreso. BrainShield reparte ese ingreso bajo un modelo que llamamos <strong>80/20</strong>: el 80% del ingreso generado por la licencia se destina a ti, como dueño original del activo, y el 20% restante se queda con BrainShield, por el trabajo de administrar, dar seguimiento y sostener toda la estructura que hace posible que esa regalía llegue de forma ordenada y verificable.</p>

<p>Este reparto no es una promesa de rendimiento ni una proyección especulativa: depende enteramente de que tu activo efectivamente se licencie y de que esa licencia efectivamente genere ingreso. Si tu propiedad intelectual no encuentra quién la licencie, no hay regalía que repartir — esto es, ni más ni menos, la naturaleza de un activo real: su valor depende de su uso efectivo, no de una gráfica.</p>

<h3>El anonimato como secreto industrial</h3>
<p>Un último punto, quizás el más delicado y el más valioso para muchos creadores: BrainShield protege tu anonimato no como un truco de marketing, sino apoyado en una figura legal real, la del <strong>secreto industrial</strong>. Tu identidad como dueño del activo se mantiene fuera del conocimiento público mediante el contrato que firmas con BrainShield, mediante el uso consistente de tu alias en toda la documentación, y mediante el propio proceso de admisión al ecosistema. Esto no significa que operes fuera de la ley — BrainShield sí conoce quién eres para efectos de cumplimiento — significa que tu nombre no queda expuesto frente a quienes no tienen necesidad legal de conocerlo.</p>

<p>Con esto ya sabes cómo se deposita, se identifica y se remunera un activo intangible dentro de BrainShield. Pero para que ese activo tenga valor defendible, alguien tiene que ponerle un número serio y verificable: eso es exactamente lo que vamos a ver en el siguiente módulo, dedicado a la valuación y a la atestación on-chain.</p>
      `,
      references: ["Pivote RWA BrainShield 2026-07-14", "Estructura legal BrainShield S.C. (Acta 5905)", "Master RAW seal / tokenización 2026-07-15"],
    },
    {
      title: "Valuación y atestación",
      description: "Corredor público titulado, NIF C-8, 0% de margen, y cómo se ancla el hash del dictamen en Base. Por qué la sustancia off-chain siempre manda.",
      durationMinutes: 13,
      contentHtml: `
<p>En los módulos anteriores viste cómo BrainShield origina activos tangibles e intangibles, y cómo funciona específicamente la bóveda de propiedad intelectual: el depósito, el hash, el alias y el modelo de reparto 80/20. Ahora toca resolver una pregunta que ya se asomó varias veces: ¿quién le pone un número serio a un activo, y cómo se hace pública esa evidencia sin exponer nada confidencial? Eso es exactamente lo que vamos a ver en este módulo: <strong>valuación y atestación</strong>.</p>

<h3>Quién valúa tu activo, y por qué importa que sea independiente</h3>
<p>La valuación de un activo dentro de BrainShield no la hace la propia empresa, ni el dueño del activo, ni nadie con interés económico en que el número salga alto. La hace un <strong>corredor público titulado</strong>, siguiendo la metodología de la <strong>NIF C-8</strong> —la Norma de Información Financiera mexicana aplicable a activos intangibles— adaptada también al proceso para activos tangibles. Este corredor trabaja bajo un esquema de <strong>0% de margen</strong>: no cobra una parte proporcional al valor que dictamina, precisamente para que no tenga ningún incentivo económico en inflar la cifra.</p>

<p>Esta independencia es la diferencia entre un número que puedes defender ante cualquiera —un comprador, una empresa licenciataria, una autoridad— y un número que solo existe porque alguien interesado lo dijo. Sin esta pieza, todo lo demás que construyamos encima —el sello, la atestación, el token— estaría construido sobre un dato que nadie puede confiar plenamente.</p>

<h3>El portal del corredor: de la solicitud al dictamen</h3>
<p>En la práctica, esto ocurre a través de un portal dedicado donde los corredores atienden las solicitudes de valuación. Cuando pides un avalúo, tu solicitud entra a una fila de trabajo pendiente; un corredor la toma para sí de forma exclusiva —para que dos corredores no trabajen la misma solicitud a la vez— y te presenta una cotización con monto y plazo. Tú decides si aceptas y realizas el pago correspondiente. Una vez pagado, el corredor completa su trabajo y entrega un <strong>dictamen</strong> con el valor, la vida útil estimada y la tasa aplicable del activo. Todo este flujo —solicitud, cotización, pago, dictamen— queda registrado, y tu identidad frente al corredor se mantiene protegida por tu alias, igual que en la bóveda de PI.</p>

<h3>Anclar el hash en Base: qué significa en la práctica</h3>
<p>Una vez que el dictamen existe, ocurre el último paso: se calcula el hash del documento —su huella digital única— y se <strong>ancla en la red Base</strong>, una red blockchain pública construida sobre Ethereum. Esto no es un pago con criptomonedas ni una inversión: es registrar, de forma pública e imposible de alterar después, que ese hash exacto existió en esa fecha exacta. Cualquier persona puede después tomar el documento original y comparar su huella con la que quedó anclada, para confirmar que nadie lo modificó desde entonces.</p>

<p>Este anclaje se hace desde una <strong>wallet dedicada de BrainShield</strong> en la red Base, y es exactamente el mismo mecanismo de atestación que ya conociste si tomaste el Curso 1: no mueve el valor del activo, no representa una transacción financiera del activo mismo — es una notaría digital de bajo costo para la evidencia documental. El dinero de la operación —el pago del avalúo, el pago de la regalía— sigue moviendo por los canales tradicionales, bancarios y fiscales, del sistema mexicano.</p>

<h3>Por qué la sustancia off-chain manda</h3>
<p>Todo lo que hemos descrito en este módulo —el corredor independiente, el dictamen, el hash, el anclaje en Base— tiene un orden que no se puede invertir: primero existe la sustancia real, verificada por un experto humano con su cédula profesional en juego; después, y solo después, esa sustancia se sella de forma pública e inalterable. Nunca al revés. Un sello on-chain sobre un dictamen inventado o inflado seguiría siendo, en el fondo, evidencia de una mentira sellada con mucha tecnología — no un activo defendible.</p>

<p>Esta secuencia —sustancia primero, sello después— es el criterio que separa a BrainShield de los proyectos que solo fingen tener un RWA detrás de su token. En el siguiente módulo vamos a hablar de lo que sí se representa dentro del ecosistema con un token: el <strong>token BRAIN</strong>, y por qué está diseñado deliberadamente para no tener volatilidad.</p>
      `,
      references: ["Portal del Corredor BrainShield 2026-07-14", "Master RAW seal / tokenización 2026-07-15", "Pivote RWA BrainShield 2026-07-14"],
    },
    {
      title: "El token BRAIN",
      description: "BRAIN, el token que BrainShield ha diseñado, pensado 1:1 a USDC/USDT — un diseño de estabilidad, aún no desplegado. Atestación vs. tokenización, y por qué KakawChain aún no existe.",
      durationMinutes: 11,
      contentHtml: `
<p>Llegamos a un tema que suele generar más dudas de las necesarias: los tokens. En este módulo vamos a hablar específicamente del <strong>token BRAIN</strong> —el token que BrainShield ha diseñado para su ecosistema—, qué es, qué no es, y por qué su diseño es deliberadamente aburrido —en el buen sentido— comparado con lo que normalmente se asocia a las criptomonedas. Y vamos a ser precisos desde la primera línea, con la misma honestidad de todo este curso: BRAIN es, a la fecha de este curso, un <strong>diseño</strong> — todavía no está desplegado ni en operación.</p>

<h3>Qué es BRAIN y qué no es</h3>
<p>BRAIN está pensado como un token de valor para representar y mover, dentro del ecosistema de BrainShield, el valor de operaciones ya verificadas: el pago de una regalía, la liquidación de un avalúo, o cualquier otro movimiento de valor asociado a un activo que ya pasó por el proceso de originación que conoces de los módulos anteriores. Su diseño tiene una característica central: está pensado para estar <strong>pegado 1:1 a USDC o USDT</strong>, dos de las llamadas "stablecoins" (monedas estables) más utilizadas del mercado cripto, cuyo valor a su vez está respaldado uno a uno por dólares estadounidenses.</p>

<p>Esto significa que, una vez desplegado, un BRAIN valdría, en todo momento, aproximadamente un dólar — sin las subidas y caídas dramáticas que caracterizan a criptomonedas como Bitcoin o Ethereum. BRAIN no busca ser, ni está diseñado como, un instrumento especulativo. Pero insistimos: hoy es diseño, no una pieza que puedas usar dentro de una operación real de BrainShield.</p>

<h3>Atestación vs. tokenización: dos cosas distintas que conviene no confundir</h3>
<p>Es muy importante que no mezcles dos conceptos que suenan parecido pero son operaciones distintas. La <strong>atestación</strong>, que viste en el módulo anterior, es anclar el hash de un documento en Base como prueba de integridad: no mueve valor, solo prueba que algo existió sin ser alterado. La <strong>tokenización</strong>, en cambio, es representar valor económico —como el derecho a una regalía futura— de forma digital y transferible. BrainShield hoy aplica la atestación de forma completa y en producción; la tokenización más ambiciosa —por ejemplo, convertir la corriente completa de regalías de un activo en un token negociable— es un terreno mucho más delicado, porque tocar un flujo de ingresos futuros de esa manera puede acercarse a lo que la regulación financiera considera un instrumento de inversión, con las obligaciones legales que eso conlleva. Por eso BrainShield avanza aquí con cautela, paso a paso, y no promete lo que todavía no ha construido ni validado legalmente.</p>

<h3>Por qué elegimos estabilidad en vez de especulación</h3>
<p>La razón detrás de diseñar BRAIN anclado a stablecoins, en vez de dejarlo flotar libremente, es sencilla: la incertidumbre de cualquier participación en el ecosistema debe venir del activo real —¿se licenciará la patente?, ¿se rentará el inmueble?— y no de una segunda capa de riesgo artificial causada por la volatilidad de un token especulativo. Si además de preguntarte si tu propiedad intelectual encontrará quién la licencie tuvieras que preocuparte de que el valor de tu regalía suba o baje de forma dramática en una semana por movimientos del mercado cripto, estaríamos añadiendo un riesgo innecesario encima de un riesgo que ya existe de forma natural. Ese es el problema que el diseño de BRAIN busca eliminar, el día que se despliegue.</p>

<h3>Una aclaración honesta: KakawChain, KakawCoin — y el propio BRAIN</h3>
<p>Es posible que en algún momento escuches hablar de <strong>KakawChain</strong> o <strong>KakawCoin</strong>, otros proyectos dentro del mismo consorcio al que pertenece BrainShield. Queremos ser completamente transparentes: a la fecha de este curso, <strong>KakawChain y KakawCoin todavía no existen como producto</strong>. Son parte de una visión de largo plazo del consorcio, pero no forman parte de la operación actual de BrainShield.</p>

<p>Y para que no quede ninguna ambigüedad: lo mismo aplica al propio <strong>BRAIN</strong> que describimos en este módulo. Diseñar un token —su paridad, su propósito— no es lo mismo que desplegarlo y ponerlo a operar. Lo único que existe y opera hoy, de todo lo que hemos descrito en este curso, es <strong>Base como red</strong> y <strong>el hash SHA-256 como mecanismo de atestación</strong>. BRAIN es, por ahora, diseño: la intención de cómo se representará valor estable el día que se despliegue, no una pieza que hoy puedas usar. Cualquier mención de KakawChain, KakawCoin o del propio BRAIN como si ya estuvieran integrados y operando sería, sencillamente, inexacta.</p>

<p>Con esto ya conoces las tres piezas técnicas centrales de BrainShield: la bóveda de PI con su alias y su modelo 80/20, la valuación independiente sellada por atestación en Base, y el token BRAIN, diseñado para ser estable — aunque, como ya sabes, todavía no desplegado. En el último módulo vamos a ver cómo todo esto se conecta en un solo ecosistema, junto con el marketplace de RWA y CryptoVault.</p>
      `,
      references: ["Pivote RWA BrainShield 2026-07-14"],
    },
    {
      title: "El ecosistema BrainShield",
      description: "Cómo encajan BrainShield (originador), el marketplace de RWA y CryptoVault 24k en un solo ecosistema. Cierre del Curso 2.",
      durationMinutes: 12,
      contentHtml: `
<p>Llegamos al último módulo de este curso. Ya conoces a BrainShield como originador de RWA tangibles e intangibles, sabes cómo funciona la bóveda de PI con su alias y su modelo 80/20, entendiste por qué la valuación independiente y la atestación en Base sostienen todo el sistema, y viste por qué el token BRAIN está diseñado para ser estable. En este cierre vamos a ver cómo todas estas piezas conviven en un solo ecosistema, y cuál puede ser tu siguiente paso.</p>

<h3>BrainShield como originador: el trabajo que no se ve</h3>
<p>Todo en este ecosistema empieza con el trabajo de originación que ya conoces: identificar un activo —tangible o intangible—, someterlo a valuación independiente, confirmar su título legal, documentar su flujo de efectivo real o proyectado, e integrar su expediente de procedencia. Este es, honestamente, el trabajo menos visible y más laborioso de todo el ecosistema, pero es también el que le da sustancia a todo lo demás. Sin un originador dispuesto a hacer esta parte difícil antes de mostrar cualquier activo, el resto del ecosistema —marketplace, atestación, token— no tendría nada real detrás.</p>

<h3>El marketplace de RWA: dónde encuentras los activos ya verificados</h3>
<p>Una vez que un activo pasa por el proceso de originación, puede aparecer en el <strong>marketplace de RWA</strong> del consorcio: un espacio donde los activos ya verificados se presentan de forma ordenada y comparable, cada uno con su información de valuación y procedencia disponible para revisión. Ahí puedes encontrar, por ejemplo, inmuebles que BrainShield acompañó en su estructuración, junto con otros activos del ecosistema. La diferencia frente al mercado tradicional de activos alternativos —donde muchas veces la información depende de la palabra del vendedor— es que aquí cada activo ya trae consigo la evidencia de haber pasado por el proceso serio que conoces desde el módulo 1.</p>

<h3>CryptoVault 24k: oro físico como puerta de entrada</h3>
<p>Dentro de este mismo ecosistema existe también <strong>CryptoVault 24k</strong>: piezas de oro físico de 24 kilates, presentadas en ediciones de 100 y 200 gramos, cada una numerada de forma individual dentro de una serie limitada. El oro tiene una ventaja particular para quien recién está conociendo este espacio: es un activo tangible que se entiende de forma intuitiva, sin necesitar explicaciones sobre contratos de licencia o proyecciones de regalías. Su valor es físico, verificable y universalmente reconocido, y aplica exactamente el mismo criterio de procedencia y valuación independiente que cualquier otro activo del ecosistema.</p>

<h3>Cómo se conecta todo</h3>
<p>Visto de principio a fin, el recorrido es este: BrainShield identifica un activo con sustancia real y lo somete al proceso completo de originación. Si es propiedad intelectual, entra a la bóveda de PI bajo tu alias, con el modelo 80/20 listo para cuando se licencie. El dictamen de valuación, sea de un intangible o de un inmueble, se sella mediante atestación en Base. El activo verificado puede aparecer en el marketplace de RWA para que otros lo conozcan. Y si se trata de oro, puede tomar la forma concreta de una pieza de CryptoVault 24k. En todo momento, tu identidad se mantiene protegida por tu alias y por la figura del secreto industrial que ya conoces del módulo 2.</p>

<p>Este es el ecosistema completo: no es un token flotando sin nada detrás, ni una promesa de rendimiento — es un sistema construido, pieza por pieza, para que cada activo tenga sustancia verificable y para que tu participación, si depositas propiedad intelectual o exploras el marketplace, esté protegida tanto legal como personalmente.</p>

<h3>Tu siguiente paso</h3>
<p>Has completado el Curso 2 de Academia RWA. Ya sabes qué es BrainShield, cómo funciona su bóveda de propiedad intelectual, cómo se valúa y se sella un activo, y cómo encaja el token BRAIN en todo esto. El siguiente paso es tuyo: <strong>explora el marketplace de RWA</strong> para ver activos verificados en la práctica, o, si tienes propiedad intelectual que hoy no está generando ningún valor, <strong>conoce más sobre BrainShield</strong> y evalúa si depositarla en la bóveda tiene sentido para ti. No tengas miedo de pedir ver el dictamen de un activo o de verificar tú mismo un hash en la red Base — la transparencia, como ya sabes, no es un adorno en este ecosistema: es el fundamento.</p>
      `,
      references: ["Pivote RWA BrainShield 2026-07-14", "Master RAW seal / tokenización 2026-07-15"],
    },
  ],

  "cryptovault-24k": [
    {
      title: "Qué es CryptoVault 24k",
      description: "Oro físico Au 999.9 en dos ediciones (100 g y 200 g), serie limitada marcada 1/320 · 2026. Qué es exactamente esta pieza y por qué el oro es la puerta de entrada más fácil de entender a los RWA.",
      durationMinutes: 12,
      contentHtml: `
<p>Bienvenido a Academia RWA. Este curso es distinto a los anteriores en un sentido importante: no vamos a hablar de teoría ni de marcos de verificación, vamos a hablar de un producto concreto que existe hoy dentro del consorcio Kakaw, que puedes ver, cotizar y comprar en este momento. Se llama <strong>CryptoVault 24k</strong>, y en este primer módulo vamos a describir exactamente qué es, sin adornos ni promesas — solo lo que realmente es.</p>

<p>CryptoVault 24k es una pieza de <strong>oro físico de 24 kilates</strong>, con pureza <strong>Au 999.9</strong> — es decir, oro prácticamente puro, sin las aleaciones que se usan en la joyería para dar dureza. Está disponible en dos presentaciones: una de <strong>100 gramos</strong> (equivalente a aproximadamente 3.215 onzas troy, la unidad estándar con la que se cotiza el oro en los mercados internacionales) y otra de <strong>200 gramos</strong> (aproximadamente 6.430 onzas troy). Ambas presentaciones pertenecen a la misma serie: una edición limitada marcada <strong>1/320 · 2026</strong>, lo que significa que forman parte de un lote acotado de piezas producidas para este año, no de una línea abierta que se siga fabricando indefinidamente.</p>

<h3>Por qué el oro, y por qué ahora</h3>
<p>Si tomaste el Curso 1 de esta academia, recuerdas que ahí usamos precisamente el oro como ejemplo pedagógico de lo que es un RWA: un lingote guardado en una bóveda certificada, con su peso exacto, es de los activos más fáciles de entender para cualquier persona, tenga o no experiencia con inversiones o con tecnología. No hace falta explicar contratos de arrendamiento, proyecciones de regalías, ni el funcionamiento de una patente. El oro se entiende de forma casi instintiva: es escaso, es tangible, y su valor ha sido reconocido por prácticamente todas las civilizaciones humanas durante miles de años.</p>

<p>CryptoVault 24k toma esa intuición y la convierte en un producto concreto del consorcio Kakaw: en vez de hablarte en abstracto de "qué es un RWA de oro", te ofrece una pieza real, numerada, con un peso y una pureza específicos, que puedes cotizar en vivo con el precio de mercado del oro en el momento exacto de tu compra.</p>

<h3>Qué NO es CryptoVault 24k</h3>
<p>Antes de seguir, vale la pena decir con toda claridad lo que este producto no es, porque es la misma honestidad que hemos mantenido en cada curso de esta academia: CryptoVault 24k <strong>no es un instrumento de inversión</strong>, no es una promesa de rendimiento, y no es una oferta de valores. Es, en su forma más simple, un producto respaldado por oro real. Su valor depende del precio del oro en el mercado —que puede subir o bajar como cualquier materia prima— y no de ninguna proyección, promesa o garantía de ganancia futura que el consorcio pueda ofrecerte. Vamos a volver sobre este punto con más detalle en el último módulo del curso, dedicado enteramente a los guardrails que debes tener siempre presentes.</p>

<h3>Las dos presentaciones, lado a lado</h3>
<p>La diferencia entre las dos ediciones es, sencillamente, el tamaño de la pieza. La de 100 gramos es la presentación de entrada: más accesible en términos de precio total, porque contiene menos gramos de oro. La de 200 gramos duplica el contenido metálico y, con ello, duplica aproximadamente el componente de valor de oro dentro del precio total (el componente de fees, que veremos en el módulo 4, se calcula como un porcentaje sobre ese valor, así que también escala con el tamaño). Ninguna de las dos presentaciones es "mejor" que la otra en términos absolutos — la elección depende de cuánto oro físico quieres poseer y del presupuesto con el que cuentas.</p>

<p>Ambas comparten exactamente la misma pureza (Au 999.9) y pertenecen a la misma serie limitada marcada 1/320 · 2026. Es decir, no hay una edición "premium" y otra "estándar" — son el mismo producto en dos tamaños distintos, producidos dentro del mismo lote acotado del año.</p>

<h3>Un producto con dos capas: lo físico y lo digital</h3>
<p>Lo que hace a CryptoVault 24k particularmente interesante dentro del ecosistema Kakaw es que no es solamente una pieza de oro. Cada pieza está pensada para tener, además del metal físico, una capa digital asociada: un título que identifica de forma específica a esa pieza y no a otra, y —grabada físicamente en el reverso de la pieza— una frase de recuperación de 24 palabras que cumple una función completamente distinta, relacionada con la autocustodia de activos digitales propios de quien la posee.</p>

<p>Estas dos capas digitales —el título asociado a la pieza y la frase grabada en el reverso— son justamente los temas de los siguientes dos módulos. En el módulo 2 vamos a hablar del título 1:1 de la pieza: qué existe hoy, qué está diseñado para existir más adelante, y por qué es importante no confundir ambas cosas. En el módulo 3 vamos a hablar específicamente de las 24 palabras grabadas al reverso, qué son, y por qué separar el pago de una pieza de la custodia de tus propios activos es un principio de seguridad que te conviene entender bien, uses o no CryptoVault 24k. Sigamos.</p>
      `,
      references: ["cryptovault-pricing.ts / CRYPTOVAULT_EDITIONS", "ceduverse-private.tsx (sección CryptoVault24k)"],
    },
    {
      title: "El título 1:1 del lingote: gemelo digital, con cuidado",
      description: "Qué significa un título 1:1 asociado a cada pieza, qué existe hoy (reserva de título, estado 'acuñación pendiente') y qué es todavía diseño (el NFT gemelo sellado, el modelo no-custodio).",
      durationMinutes: 13,
      contentHtml: `
<p>En el módulo anterior conociste CryptoVault 24k como pieza física: oro Au 999.9, dos presentaciones, serie limitada 1/320 · 2026. En este módulo vamos a hablar de la capa digital que acompaña a esa pieza: lo que dentro del consorcio Kakaw se conoce como el <strong>título 1:1</strong> del lingote. Y vamos a hacerlo con el mismo cuidado con el que hemos tratado cada tema técnico en esta academia: separando con toda claridad lo que ya existe hoy de lo que todavía es diseño en construcción.</p>

<h3>La idea central: un título que apunta a una pieza específica</h3>
<p>La idea de fondo es sencilla de entender aunque la tecnología detrás no lo sea: cada pieza física de CryptoVault 24k —identificada por su número de serie dentro de la edición 1/320— tiene asociado un <strong>título digital</strong> que representa, de forma 1:1, esa pieza y ninguna otra. No es un token genérico que representa "oro en general" — es un título que apunta a un lingote específico, con su propio número de serie. Cuando el consorcio habla de un "gemelo digital" del producto físico, se refiere exactamente a esto: una representación digital que refleja, uno a uno, una pieza concreta del mundo físico.</p>

<p>Esta idea es, en el fondo, la misma que aprendiste en los cursos anteriores de esta academia si los tomaste: la representación digital solo tiene sentido si refleja algo real y específico. Un título que no apuntara a ninguna pieza en particular sería, otra vez, un espejo apuntando al vacío.</p>

<h3>Qué ocurre hoy, exactamente, cuando compras una pieza</h3>
<p>Aquí es donde queremos ser muy precisos, porque es fácil confundir "diseño" con "ya construido y funcionando". Hoy, cuando completas la compra de una pieza de CryptoVault 24k, tu pedido se registra con un número de serie asignado y tu título queda en un estado que el sistema llama, literalmente, <strong>"acuñación pendiente"</strong>. Esto significa que tu compra y tu derecho sobre esa pieza específica quedan asegurados y documentados desde el momento del pago — pero la acuñación del título como un registro on-chain propiamente dicho ocurre después, cuando el consorcio despliega los contratos correspondientes de Kakaw. Nada se simula ni se finge en el camino: el sistema no te muestra un token que no existe todavía disfrazado de uno real. Simplemente refleja, con honestidad, que tu pieza y tu título están reservados, y que el paso final de acuñación llegará en su momento.</p>

<p>Este orden —primero la sustancia real (tu pago, tu pieza asignada, tu número de serie), después el sello digital final— es exactamente el mismo principio que ya viste en los cursos anteriores sobre BrainShield: la sustancia siempre antes que el sello. Aquí se aplica igual, solo que con un producto físico de por medio en lugar de un dictamen de valuación.</p>

<h3>Lo que es diseño, todavía no operación diaria: el "gemelo digital sellado" y el modelo no-custodio</h3>
<p>Dentro de la visión del consorcio existe un diseño más amplio para este tipo de productos físicos: que cada pieza —tarjeta metálica o lingote— obtenga un <strong>NFT gemelo con doble sello</strong>, que atestigüe su autenticidad, y que el compromiso de tu frase de recuperación (que veremos en el módulo 3) quede representado únicamente por su huella digital, nunca por la frase completa. Este diseño ya está aprobado dentro de la arquitectura del consorcio, pero te lo presentamos exactamente como lo que es: un diseño aprobado para construirse, no una función que hoy operes de punta a punta dentro de la compra de tu pieza.</p>

<p>Algo parecido ocurre con la idea de un <strong>modelo no-custodio</strong>: la visión de que el título digital de tu pieza viva en una wallet que tú mismo controlas —no en una cuenta custodiada por un tercero— de la misma manera en que hoy existen exchanges de criptomonedas que sí custodian tus activos en tu nombre, y wallets propias donde solo tú tienes la llave. Este es el rumbo hacia el que apunta el diseño del producto. Lo que puedes verificar hoy, con certeza, es esto: tu pieza física queda resguardada en una <strong>bóveda asignada</strong> —este es, de hecho, el único modo de entrega actualmente activo— y tu título queda reservado a tu nombre bajo el estado que ya describimos. La experiencia de recibir la pieza en persona, o de vivir un modelo plenamente no-custodio de principio a fin, forma parte de fases próximas del producto, incluyendo una experiencia conectada con Web3Travel que hoy está marcada como "próximamente".</p>

<h3>Por qué te lo explicamos con este nivel de detalle</h3>
<p>Podríamos habernos ahorrado esta distinción y simplemente decirte "cada pieza tiene un NFT título 1:1". Pero eso sería exactamente el tipo de exageración que hemos criticado en los cursos anteriores de esta academia: hablar de la tecnología como si ya estuviera completamente desplegada cuando en realidad una parte importante todavía está en fase de diseño o construcción. Preferimos que sepas, con toda precisión, qué puedes verificar hoy (tu pedido, tu número de serie, el estado de tu título) y qué es la dirección hacia la que camina el producto (el gemelo digital con doble sello, el modelo no-custodio completo). Esa misma pregunta —¿qué existe hoy y qué es todavía visión?— es la que te recomendamos hacerte siempre frente a cualquier producto que combine algo físico con algo digital.</p>

<p>En el siguiente módulo vamos a hablar de la otra capa digital de tu pieza: las 24 palabras grabadas físicamente en el reverso, qué son realmente, y por qué separar el pago de tu pieza de la custodia de tus propios activos digitales es un principio que te conviene entender bien.</p>
      `,
      references: ["server/routes/vault.ts (markVaultOrderPaid, titleStatus)", "shared/schema.ts (crypto_vault_orders)", "Master RAW seal / tokenización 2026-07-15 (§7 Gemelo digital de productos físicos)"],
    },
    {
      title: "La seed en el reverso: tu propia autocustodia",
      description: "Las 24 palabras grabadas en el reverso de la pieza, la lógica de autocustodia detrás de un respaldo físico, y por qué conviene separar mentalmente el pago de una pieza de la custodia de tus propios activos.",
      durationMinutes: 12,
      contentHtml: `
<p>En los dos módulos anteriores hablamos del oro físico y del título digital asociado a cada pieza de CryptoVault 24k. En este módulo vamos a hablar de un elemento distinto, grabado literalmente en el reverso de la pieza: <strong>24 palabras</strong>. Vamos a explicar qué son, para qué sirven, y por qué este pequeño detalle físico encierra una de las ideas más importantes de todo el mundo cripto: la autocustodia.</p>

<h3>Qué son esas 24 palabras</h3>
<p>Si alguna vez has usado una wallet de criptomonedas —MetaMask, Trust Wallet, Ledger, o cualquier otra— sabes que, al crearla, se te entrega una <strong>frase de recuperación</strong>: una secuencia de palabras en inglés (normalmente 12 o 24, dependiendo del nivel de seguridad) que funciona como la llave maestra de esa wallet. Quien tenga esas palabras, tiene control total sobre lo que esa wallet contiene. Por eso la recomendación universal en el mundo cripto es: nunca compartas tu frase de recuperación con nadie, y guárdala en un lugar seguro, preferiblemente fuera de cualquier dispositivo conectado a internet.</p>

<p>El problema práctico es que un papel con 24 palabras escritas a mano se puede quemar, mojar, perder o deteriorarse con el tiempo. Por eso ha surgido toda una categoría de productos de "respaldo físico indestructible" de la frase de recuperación —placas de metal, tarjetas de acero— pensadas para sobrevivir a un incendio, una inundación o simplemente el paso de los años, algo que el papel no garantiza. CryptoVault 24k lleva esta idea un paso más allá: en vez de una placa de acero cualquiera, tu frase de recuperación queda grabada en el reverso de una pieza de <strong>oro de 24 kilates</strong> — un material que, además de prácticamente indestructible, tiene valor propio independientemente de su función como respaldo.</p>

<h3>Dos funciones distintas en un mismo objeto</h3>
<p>Aquí conviene detenerse, porque hay dos cosas distintas ocurriendo en la misma pieza, y es fácil confundirlas si no se explican por separado. Por un lado, como viste en el módulo 2, la pieza tiene un <strong>título digital</strong> asociado que identifica esa pieza específica dentro de la serie 1/320 · 2026 — eso es la representación de la pieza misma como activo. Por otro lado, las 24 palabras grabadas en el reverso son <strong>tu propia frase de recuperación</strong> — la llave de tu wallet personal, un asunto que le pertenece a ti como persona, no a la pieza de oro como activo. Son dos capas que conviven en el mismo objeto físico, pero que cumplen funciones completamente distintas: una identifica al lingote, la otra te identifica —o más bien, protege— a ti como dueño de tus propios activos digitales.</p>

<h3>Separar el pago de la custodia</h3>
<p>Esto nos lleva a un principio que vale la pena que te quede muy claro, y que aplica mucho más allá de CryptoVault 24k: <strong>quién procesa tu pago no es lo mismo que quién custodia tus activos</strong>. Cuando compras una pieza, el pago puede procesarse mediante una pasarela de tarjeta o mediante una transferencia bancaria —mecanismos que hablaremos con detalle en el módulo 4—. Ese proceso de pago es un trámite financiero tradicional, regulado, con su propio rastro. La custodia de tu frase de recuperación, en cambio, es un asunto completamente distinto: nadie más que tú debería conocer esas 24 palabras, ni siquiera quien procesó tu pago.</p>

<p>Esta separación no es un detalle menor. Es, de hecho, el mismo principio de fondo que aprendiste en el Curso 1 al distinguir entre atestación (una prueba de integridad) y pago (un movimiento de valor): son operaciones distintas, y confundirlas —o dejar que una entidad controle ambas sin que tú lo sepas— es exactamente el tipo de opacidad que un RWA bien construido busca evitar. Aplicado a CryptoVault 24k, el principio se traduce así: quien te vende la pieza y procesa tu pago no necesita ni debería tener acceso a tu frase de recuperación personal. Esa frase es tuya, se graba físicamente para que la conserves tú, y su seguridad depende enteramente de que la resguardes bien —lejos de fotografías, de la nube, de cualquier persona en la que no confíes plenamente.</p>

<h3>Qué hacer y qué no hacer con tus 24 palabras</h3>
<p>Si terminas con una pieza de CryptoVault 24k en tus manos, o si ya usas cualquier otra wallet de criptomonedas con su propia frase de recuperación, las reglas son las mismas de siempre en este espacio: nunca fotografíes tu frase de recuperación, nunca la escribas en un documento digital ni la envíes por correo o mensaje, nunca se la compartas a nadie que te la pida —ni soporte técnico, ni un vendedor, ni una persona de confianza, nadie tiene una razón legítima para pedírtela—, y guárdala en un lugar físico seguro, idealmente distinto de donde guardas la pieza misma o cualquier documento que la identifique como tuya.</p>

<p>Con esto ya entiendes las dos capas digitales de CryptoVault 24k: el título que identifica a la pieza física, y la frase de recuperación que te protege a ti como dueño de tus propios activos. En el siguiente módulo vamos a bajar a lo más práctico: cómo se cotiza el precio de una pieza en tiempo real, qué medios de pago existen hoy, y cuáles todavía están en camino.</p>
      `,
      references: ["ceduverse-private.tsx (Ceduverse Vault Card / CryptoVault24k)", "Master RAW seal / tokenización 2026-07-15 (§7)"],
    },
    {
      title: "Cómo se compra: cotización en vivo y medios de pago",
      description: "El precio se cotiza en tiempo real con el spot del oro (nunca un número inventado): valor del oro + 20% de fee operativo + gas de red estimado. Medios de pago disponibles hoy y los que llegan en próximas fases.",
      durationMinutes: 13,
      contentHtml: `
<p>Ya conoces la pieza física, su título digital y la frase de recuperación grabada en el reverso. En este módulo vamos a lo más práctico: ¿cómo se calcula el precio de una pieza de CryptoVault 24k, y cómo se paga? Vamos a describirlo exactamente como funciona hoy, sin adelantar medios de pago que todavía no están disponibles.</p>

<h3>El precio nunca se inventa: el spot del oro como base</h3>
<p>Lo primero que hay que entender es de dónde sale el número que ves al cotizar una pieza. El sistema de CryptoVault 24k consulta, en el momento en que abres la cotización, el <strong>precio spot del oro de 24 kilates por gramo</strong>, obtenido de un proveedor externo especializado en precios de metales preciosos. Este es un punto en el que el consorcio es particularmente estricto: si por cualquier razón esa fuente de precio no está disponible, el sistema no te muestra un número aproximado, ni un precio de respaldo inventado internamente — simplemente te informa que la cotización no está disponible en ese momento y te pide intentar más tarde. Ningún precio de oro simulado llega jamás a mostrarse como si fuera real. Esto es exactamente el mismo criterio de honestidad que ya viste aplicado a la valuación de activos en los cursos anteriores: si no hay sustancia real y verificable detrás de un número, no se muestra ese número.</p>

<h3>El desglose exacto del precio</h3>
<p>Con ese precio spot como base, el precio total de tu pieza se construye en capas, todas visibles para ti antes de pagar:</p>

<p>Primero, el <strong>valor del oro</strong>: el precio spot por gramo multiplicado por los gramos de la edición que elegiste (100 o 200). Segundo, un <strong>fee operativo del 20%</strong> sobre ese valor del oro, que cubre el proceso de acuñación y la operación de la terminal — este porcentaje no es una comisión oculta ni un margen de especulación sobre el precio del metal: se muestra de forma explícita, línea por línea, como un concepto separado del valor del oro mismo. Tercero, un <strong>gas de red estimado</strong> —el costo de registrar el título de tu pieza en la blockchain correspondiente cuando llegue el momento de la acuñación— que también corre por cuenta del comprador y se muestra por separado. Hoy, además, el modo de entrega disponible es exclusivamente el de <strong>bóveda asignada</strong> (tu pieza queda resguardada, sin costo adicional de envío), por lo que no se suma ningún cargo de paquetería a tu cotización.</p>

<p>La suma de estas tres partes —valor del oro, fee operativo y gas de red— es el total que pagas. Este desglose se te muestra completo antes de que decidas pagar, y el precio queda fijo por un periodo breve (unos quince minutos) para darte tiempo de completar tu pago sin que el spot del oro se mueva de forma significativa mientras decides. Si ese periodo vence, el sistema vuelve a calcular el precio con el spot más reciente al momento de tu pago — nunca confía en un precio antiguo que le hayas enviado desde tu navegador, precisamente para evitar que alguien intente manipular el monto final.</p>

<h3>Medios de pago disponibles hoy</h3>
<p>Actualmente puedes pagar tu pieza de dos maneras. La primera es <strong>con tarjeta</strong>, mediante una pasarela de pago que acepta pesos mexicanos o dólares estadounidenses, según la moneda que elijas para tu cotización — este es el medio de pago principal y el que está disponible sin restricciones para ambas monedas. La segunda es mediante <strong>transferencia bancaria en dólares</strong>, dirigida a una cuenta bancaria en Estados Unidos operada por una de las entidades del consorcio; este medio solo está disponible si cotizaste tu pieza en dólares, y tu título se reserva una vez que el pago se confirma manualmente, lo cual toma típicamente uno o dos días hábiles.</p>

<h3>Lo que todavía no está disponible</h3>
<p>Con la misma honestidad que hemos mantenido en todo el curso, te decimos también lo que hoy <strong>no</strong> puedes hacer: no existe todavía una cuenta bancaria en pesos mexicanos habilitada para recibir el pago de una pieza por transferencia directa, y el pago con criptomonedas —que en algún momento formará parte de las opciones disponibles— hoy sigue marcado como "próximamente" dentro del propio flujo de compra. Si intentas usar cualquiera de estos dos medios en este momento, el sistema te lo indica de forma explícita, en lugar de simular una operación que en realidad no puede completarse.</p>

<p>Esta manera de presentarte las cosas —lo que funciona hoy, claramente separado de lo que llega después— es deliberada. Preferimos que sepas exactamente con qué medios puedes pagar en este momento, en vez de que descubras a mitad de una compra que una opción anunciada en realidad no está lista.</p>

<h3>Tu comprobante y el seguimiento de tu pedido</h3>
<p>Cada compra genera un número de pedido único, y puedes consultar en cualquier momento el estado de ese pedido: si sigue pendiente de pago, si el pago ya fue confirmado y tu título quedó reservado, o si ya avanzó a una etapa posterior. Este seguimiento —tener un número concreto que puedes verificar, en vez de depender de la palabra de alguien— es, otra vez, la misma lógica de trazabilidad que ya conoces de los cursos anteriores de esta academia, aplicada ahora a un producto físico y no solo a un expediente documental.</p>

<p>En el último módulo de este curso vamos a cerrar con los guardrails que debes tener siempre presentes al considerar CryptoVault 24k: qué garantías sí puedes verificar por ti mismo, y qué es importante que nunca esperes de este producto.</p>
      `,
      references: ["server/services/cryptovault-pricing.ts", "server/services/gold-spot.ts (goldapi.io, sin precios simulados)", "server/routes/vault.ts (/api/vault/quote, /api/vault/checkout)"],
    },
    {
      title: "Guardrails: qué sí puedes verificar, qué nunca esperar",
      description: "CryptoVault 24k no es una oferta de valores ni asesoría de inversión. Qué garantías son verificables hoy, y cierre del curso con invitación a reservar tu pieza o conocer más del ecosistema Kakaw.",
      durationMinutes: 11,
      contentHtml: `
<p>Llegamos al último módulo de este curso. Ya conoces la pieza física de CryptoVault 24k, su título digital, la frase de recuperación grabada en el reverso, y la mecánica completa de cotización y pago. En este cierre vamos a hablar de los guardrails: los límites claros que debes tener siempre presentes al considerar este producto, y las garantías que sí puedes verificar por ti mismo.</p>

<h3>Lo que CryptoVault 24k no es</h3>
<p>Empecemos por lo más importante, y lo repetimos con toda intención porque es el guardrail central de todo este curso: <strong>CryptoVault 24k no es un instrumento de inversión, no es una oferta de valores, y no constituye asesoría financiera de ningún tipo</strong>. Es, en su definición más simple y honesta, un producto respaldado por oro físico real. Nadie dentro del consorcio Kakaw te va a prometer un rendimiento, una fecha de retorno, ni una revalorización garantizada. El valor de tu pieza está atado al precio de mercado del oro —que se mueve como cualquier materia prima, hacia arriba y hacia abajo— y a nada más.</p>

<p>Si en algún momento alguien te presenta CryptoVault 24k, o cualquier producto similar dentro de este espacio, como una oportunidad de inversión con retorno prometido, esa afirmación no representa lo que el producto realmente es. Compara siempre lo que te dicen con lo que puedes verificar tú mismo — que es precisamente el tema de la siguiente sección.</p>

<h3>Lo que sí puedes verificar por ti mismo</h3>
<p>A diferencia de una promesa que tienes que creer por la palabra de alguien, hay varias cosas en CryptoVault 24k que puedes comprobar de forma objetiva. Puedes verificar que el precio que se te cotiza parte de un precio spot de oro obtenido de una fuente de mercado externa, no de un número decidido internamente — y que, si esa fuente no está disponible, el sistema te lo dice en vez de mostrarte un precio inventado. Puedes verificar la pureza declarada de la pieza (Au 999.9) y su peso exacto según la edición elegida (100 o 200 gramos). Puedes verificar, con tu número de pedido, el estado exacto en el que se encuentra tu compra en cualquier momento. Y, como viste en el módulo 2, puedes verificar con precisión qué parte de la capa digital de tu pieza ya existe hoy —tu pedido registrado, tu número de serie asignado, tu título en estado de "acuñación pendiente"— y qué parte todavía es un diseño hacia el que camina el producto.</p>

<h3>Lo que todavía está en construcción</h3>
<p>Como ya explicamos en los módulos anteriores, hay piezas del producto que forman parte del diseño aprobado del consorcio pero que todavía no operan de punta a punta: la acuñación efectiva del título on-chain (que ocurre cuando se despliegan los contratos de Kakaw), el gemelo digital con doble sello pensado para atestiguar autenticidad, el modelo plenamente no-custodio, y la experiencia de recibir tu pieza en persona o vivirla junto con Web3Travel. Ninguna de estas piezas está simulada ni fingida en el camino — simplemente todavía no están activas, y preferimos decírtelo así de claro a dejar que lo asumas por tu cuenta.</p>

<h3>Un producto dentro de un ecosistema más grande</h3>
<p>Si tomaste los cursos anteriores de esta academia, ya sabes que CryptoVault 24k no vive aislado: es uno de los productos del consorcio al que también pertenece BrainShield, el originador de RWA tangibles e intangibles que conociste en el Curso 2, y el marketplace de RWA donde se presentan activos ya verificados. El oro tiene, dentro de este ecosistema, un papel particular: es el activo más fácil de entender de todos, la puerta de entrada natural para quien apenas empieza a familiarizarse con la idea de un Real World Asset.</p>

<p>Con esto cerramos el Curso 3 de Academia RWA. Ya sabes qué es CryptoVault 24k, cómo funciona su título digital hoy y hacia dónde camina su diseño, qué protege realmente la frase de recuperación grabada en el reverso, cómo se cotiza y se paga una pieza, y —lo más importante— qué guardrails debes tener siempre presentes: no es inversión, no hay promesa de rendimiento, y todo lo que puedes verificar por ti mismo vale más que cualquier promesa que alguien te haga.</p>

<p>Tu siguiente paso es tuyo: <strong>puedes reservar tu propia pieza</strong> si ya te sientes cómodo con todo lo que aprendiste en este curso, o puedes <strong>conocer más sobre el resto del ecosistema Kakaw y BrainShield</strong> antes de tomar cualquier decisión. No hay prisa. La transparencia, como ya sabes si tomaste los cursos anteriores, no es un adorno en este ecosistema — es el fundamento sobre el que se construye todo lo demás.</p>
      `,
      references: ["ceduverse-private.tsx (\"no un instrumento de inversión\")", "server/services/gold-spot.ts (regla no-mock)", "Master RAW seal / tokenización 2026-07-15"],
    },
  ],

  "bono-bienvenida": [
    {
      title: "La aportación NO es un gasto",
      description: "El reencuadre central: tu aportación a la cooperativa no es dinero que se va, es patrimonio tuyo, reembolsable conforme al procedimiento estatutario. Qué dice la LGSC, con qué condiciones y plazos, y por qué esto cambia la conversación completa.",
      durationMinutes: 12,
      contentHtml: `
<p>Bienvenido al Curso 4 de Academia RWA. Este curso, y los dos que le siguen, están dirigidos exclusivamente a quienes participan en la parte comercial de Ceduverse: socios comerciales, empresas aliadas y directores. La razón es sencilla: aquí entramos a la capa legal y fiscal del modelo cooperativo, con un nivel de detalle que un estudiante que solo quiere tomar un curso de capacitación no necesita — pero que tú, si vas a explicar este modelo a otras personas, sí necesitas dominar por completo.</p>

<p>Y vamos a empezar por el punto que, en nuestra experiencia, más se malentiende de todo el modelo. Cuando alguien escucha "tienes que aportar $150 pesos para ser socio de la cooperativa," su cerebro hace automáticamente una traducción: <em>me van a cobrar $150 pesos</em>. Lo procesa como un costo, como una cuota de inscripción, como dinero que sale de su bolsillo y no vuelve. Esa traducción es incorrecta, y corregirla es el trabajo de este primer módulo.</p>

<h3>Qué es realmente un certificado de aportación</h3>
<p>Ceduverse es una <strong>sociedad cooperativa de consumo</strong>, constituida legalmente ante notario público. No es una empresa que te vende un servicio y se queda con tu dinero. Es una figura distinta, regulada en México por la <strong>Ley General de Sociedades Cooperativas (LGSC)</strong>, en la que las personas que participan no son "clientes" — son <strong>socios</strong>, y ser socio significa, literalmente, ser copropietario de la sociedad.</p>

<p>¿Y cómo se documenta esa copropiedad? A través de un instrumento que se llama <strong>certificado de aportación</strong>. En Ceduverse, cada certificado tiene un <strong>valor nominal de $150 pesos</strong>. Cuando tú aportas esos $150, no estás pagando una cuota: estás <strong>fondeando tu propio certificado</strong>, y ese certificado queda registrado a tu nombre en el Libro de Registro de Certificados de Aportación de la cooperativa. Es tuyo. Aparece en el capital social de la sociedad — la parte del capital que te corresponde a ti.</p>

<p>La diferencia contable es profunda y no es un tecnicismo. Cuando le pagas $150 a una empresa por un servicio, ese dinero entra al <em>ingreso</em> de la empresa: es de ella, se acabó, tú recibiste el servicio y la relación se cerró. Cuando aportas $150 a una cooperativa, ese dinero entra al <strong>capital social</strong>: no es ingreso de la cooperativa, es patrimonio tuyo depositado dentro de ella. Por eso mismo, la aportación no genera un CFDI de ingreso — genera un <strong>recibo de aportación de capital</strong>, que es un documento de naturaleza completamente distinta. Uno documenta una venta; el otro documenta que una parte del capital de la sociedad ahora te pertenece.</p>

<h3>Reembolsable: la prueba de que es tuyo — y con qué condiciones</h3>
<p>Si todavía te queda duda de que la aportación es patrimonio y no gasto, aquí está la prueba: <strong>es reembolsable</strong>. La <strong>Ley General de Sociedades Cooperativas</strong> regula el régimen de las aportaciones de los socios y de su devolución, y las <strong>bases constitutivas</strong> de cada cooperativa —en nuestro caso el acta 6520— desarrollan cómo se ejerce ese derecho. El principio de fondo es claro: cuando un socio se separa, tiene derecho al reembolso de sus aportaciones conforme a la ley y a las bases constitutivas de la sociedad.</p>

<p>Piénsalo con cuidado, porque esta es la frase que quiero que se te quede: <strong>un gasto no se te devuelve nunca; una aportación sí — pero no cuando tú quieras ni necesariamente por el mismo monto</strong>. Y esa segunda mitad de la frase es tan importante como la primera, así que vamos a desarmarla, porque es exactamente donde un socio comercial descuidado promete algo que no puede cumplir.</p>

<p><strong>Primero, el calendario.</strong> El retiro no es instantáneo. Conforme al acta constitutiva, el retiro <strong>no surte efectos sino hasta el fin del ejercicio anual</strong> — o hasta el fin del ejercicio <em>siguiente</em>, si notificas después del último trimestre. En la práctica eso significa que entre que avisas y que se te devuelve pueden pasar meses, y en el peor de los casos cerca de dos años. Hay un procedimiento formal, con notificación fehaciente y con calendario. No es un botón de "retirar saldo."</p>

<p><strong>Segundo, el monto.</strong> Y aquí toca la parte incómoda: <strong>el importe del reembolso no está garantizado a ser igual a lo que aportaste</strong>. La devolución se practica al cierre del ejercicio, respetando el orden de prelación y a prorrata cuando corresponda, y la liquidación se calcula sobre el valor de tus certificados <strong>deducidas en su caso las pérdidas que proporcionalmente te correspondan</strong> — con tu responsabilidad limitada al importe de tus certificados, que es lo que significa la "R.L." del nombre de la sociedad. Además, la devolución nunca puede afectar el capital mínimo fijo sin derecho a retiro. Y hay un punto que a la fecha <strong>sigue pendiente de definirse y aprobarse</strong>: si los certificados capitalizados se reembolsan a su valor nominal de $150 o a un valor contable ajustado por reservas y pérdidas. Ese punto está expresamente marcado como pendiente en el proyecto de Reglamento Interno; no lo inventes ni lo redondees hacia arriba frente a nadie.</p>

<p>Entonces, la formulación honesta —la que sí puedes usar— es esta: el dinero que aportaste no dejó de ser tuyo; cambió de forma, de tu bolsillo a un certificado a tu nombre dentro del capital de la sociedad. Pero pasó a ser <strong>capital de riesgo de una sociedad real</strong>, acotado a $150 por certificado, sujeto a un procedimiento de salida con calendario y a un valor de reembolso que la ley y los estatutos determinan — no tú, no la administración, y no un mercado.</p>

<p>Esto no significa que sea una cuenta de ahorro ni un instrumento líquido: la transmisión de certificados está restringida por los estatutos, el reembolso sigue un procedimiento formal, y su valor se determina conforme a las reglas de la cooperativa, no conforme a un mercado. Un certificado de aportación no se compra y se vende como una acción de bolsa. Pero es, en el sentido más literal de la palabra, tuyo. <strong>Nunca le prometas a un prospecto que "si no le gusta, le devuelven su dinero" sin más</strong>: es reembolsable, sí, con procedimiento, con plazo y sin garantía de monto. Decirlo completo es lo que te protege a ti y a la cooperativa.</p>

<h3>Un aviso legal que vamos a repetir en todo el curso</h3>
<p>Y aquí hacemos la primera de varias pausas obligatorias, porque este curso toca terreno legal y fiscal y queremos ser absolutamente inequívocos. Nada de lo que se dice en este curso constituye una <strong>oferta de valores</strong>: un certificado de aportación cooperativa no es una acción, no es un bono, no es un instrumento financiero colocado en el mercado, y no está registrado como tal ante ninguna autoridad bursátil — porque no lo es ni pretende serlo. Nada de lo que se dice en este curso constituye <strong>asesoría de inversión</strong>: no estamos recomendándote que hagas nada con tu dinero, y si tienes dudas sobre tu situación patrimonial o fiscal particular, consulta a tu propio asesor. Y de forma tajante: en este modelo <strong>no hay rendimientos garantizados</strong> de ningún tipo. Ni un porcentaje, ni una fecha, ni una promesa. Ser copropietario de una cooperativa no es lo mismo que invertir esperando un retorno — y cualquiera que te lo presente así, dentro o fuera de Ceduverse, te está describiendo algo que este modelo no es.</p>

<h3>Por qué este reencuadre importa tanto para ti</h3>
<p>Si tú vas a explicar Ceduverse a otras personas, este módulo es tu cimiento. La objeción más común que vas a enfrentar —"¿o sea que me van a cobrar por entrar?"— se desarma completamente cuando entiendes y transmites esta distinción: no te cobran, <strong>fundas tu patrimonio</strong>. El dinero no se va: cambia de forma y se queda contigo, representado en un certificado a tu nombre.</p>

<p>Y ahora viene la parte interesante, la que probablemente te trajo a este curso. Porque hay un mecanismo diseñado para que ese primer certificado ni siquiera tenga que salir de tu bolsillo: el <strong>bono de bienvenida</strong>. En el siguiente módulo vamos a desarmarlo peso por peso — literalmente, los $170 pesos que lo componen — para que entiendas exactamente qué es cada parte, por qué está diseñado así, y —muy importante— <strong>cuál es su estatus jurídico real</strong>, porque las cifras que vas a leer son política propuesta y todavía no aprobada.</p>
      `,
      references: ["LGSC — régimen de aportaciones y devolución a socios (referencia general; [PENDIENTE confirmar con Daniel/CLO los artículos exactos aplicables a la separación: la mención previa a arts. 49-51 no se sostiene, esos artículos tratan aportaciones/certificados y reducción de capital excedente, no la separación como tal)", "LGSC art. 52 y acta constitutiva 6520 (devolución al cierre del ejercicio, prelación y prorrata, deducción de pérdidas proporcionales)", "Acta constitutiva 6520, Notaría 110 QR (Ceduverse S.C. de C. de R.L. de C.V.) — Art. Sexto: retiro efectivo al fin del ejercicio anual o del siguiente", "Reglamento Interno Ceduverse DRAFT v0.1 — BORRADOR sin aprobación de Asamblea, sin efectos jurídicos (Art. 8: valor de reembolso de certificados capitalizados marcado [PENDIENTE])", "Master RAW seal / tokenización 2026-07-15 (§5 Aportación capitalizada)"],
    },
    {
      title: "El bono de bienvenida: $170 desarmado peso por peso",
      description: "Los $170 del bono = $150 que fundan tu primer certificado de aportación + $20 de crédito de descuento para tu primer certificado DC-3/SEP. Dos naturalezas distintas en un solo bono, por qué se separan, y por qué estas cifras son política propuesta —aún no aprobada por la Asamblea— y no una regla vigente.",
      durationMinutes: 13,
      contentHtml: `
<p>En el módulo anterior establecimos el reencuadre central: la aportación no es un gasto, es patrimonio tuyo, reembolsable con procedimiento y plazo, respaldado por la LGSC. Ahora vamos al mecanismo concreto que hace que ese patrimonio pueda empezar a existir sin que tengas que sacar dinero de tu bolsillo: el <strong>bono de bienvenida</strong>.</p>

<h3>Antes de la primera cifra: qué estatus tiene lo que vas a leer</h3>
<p>Y antes de decir un solo número, tenemos que decirte algo que un curso complaciente se saltaría — y que tú, como socio comercial, necesitas más que ninguna otra cosa de este módulo.</p>

<p>El bono de bienvenida, su monto y su desglose viven en el <strong>Reglamento Interno</strong> de Ceduverse. Y aquí está el punto: <strong>el Reglamento Interno de Ceduverse es hoy un proyecto en borrador. NO ha sido aprobado por la Asamblea General de Socios y, por lo tanto, NO está vigente ni surte efectos jurídicos.</strong> El propio documento lo dice en su cláusula de borrador: mientras conste esa marca, carece de validez jurídica y sirve exclusivamente como propuesta de trabajo para revisión del CLO y aprobación de la Asamblea. Y su artículo de vigencia es igual de tajante: entrará en vigor a partir de su aprobación por la Asamblea General y del asiento del acta respectiva. Antes de eso, no antes.</p>

<p>Por si fuera poco, el propio borrador declara que el monto del bono, su desglose y los parámetros de capitalización son <strong>"parámetros ajustables por acuerdo de la Asamblea General Ordinaria"</strong>. O sea: ni siquiera una vez aprobado quedarían grabados en piedra.</p>

<p>Así que las cifras de este módulo son <strong>política propuesta, sujeta a ratificación o ajuste por la Asamblea General</strong>. Son las cifras con las que el proyecto está diseñado y las que debes conocer al detalle — pero no son todavía una regla en vigor, y <strong>no son un compromiso que tú puedas ofrecer en firme a un prospecto</strong>. Cuando las expliques, explícalas con esta etiqueta puesta: "así está diseñado el bono; el Reglamento que lo contiene está pendiente de aprobación en Asamblea." Un socio comercial que promete $170 como si fueran un derecho adquirido le crea a la cooperativa un reclamo real con una persona real el día que la Asamblea ajuste el parámetro.</p>

<h3>La cifra propuesta: $170 pesos</h3>
<p>Hecha esa aclaración, vamos al diseño. El bono de bienvenida que el proyecto contempla es de <strong>$170 pesos mexicanos</strong>. No es una cifra redonda por casualidad ni un número de marketing: es la suma exacta de dos componentes con naturalezas jurídicas y contables completamente distintas, y entender esa separación es todo el punto de este módulo.</p>

<p>El bono se descompone así: <strong>$150 pesos que fundan tu primer certificado de aportación</strong>, más <strong>$20 pesos de crédito de descuento destinados a tu primer certificado DC-3/SEP</strong>. Ciento cincuenta más veinte: ciento setenta. Simple de sumar, pero no simple de entender — porque esos dos montos, aunque lleguen juntos en un solo bono, viven en dos mundos distintos.</p>

<h3>Los $150: capital, no consumo</h3>
<p>Los primeros $150 pesos van directo al valor nominal de tu primer certificado de aportación. Como ya sabes del módulo anterior, un certificado de Ceduverse vale exactamente $150 pesos, y con esos $150 el certificado queda <strong>totalmente exhibido</strong> — es decir, completamente pagado, sin saldo pendiente. Desde ese momento eres socio con un certificado a tu nombre, registrado en el Libro de Registro de Certificados de Aportación de la cooperativa.</p>

<p>Estos $150 son <strong>capital social</strong>. No son un descuento, no son un cupón, no son un regalo que puedas gastar. Son la fundación de tu patrimonio dentro de la cooperativa. Y como capital que son, siguen la lógica que ya conoces: generan un <strong>recibo de aportación de capital</strong>, no un CFDI de ingreso, porque la cooperativa no te vendió nada — recibió una aportación a su capital, y esa aportación es tuya y es reembolsable en los términos que ya viste en el módulo 1.</p>

<h3>Los $20: crédito de descuento, no capital</h3>
<p>Los otros $20 pesos tienen una naturaleza completamente opuesta. El proyecto los define como un <strong>crédito de descuento</strong> — un saldo en tu billetera dentro de la plataforma — aplicable específicamente a tu <strong>primer certificado profesional DC-3/SEP</strong> (la constancia de competencias o habilidades laborales que reconoce la Secretaría del Trabajo y Previsión Social, o un certificado con reconocimiento SEP).</p>

<p>Su naturaleza, en los términos del propio borrador, es de <strong>promoción o crédito comercial, NO de capital</strong>: no funda certificados de aportación y no forma parte de tu patrimonio societario. Ese es el punto duro y el que debes dominar: los $20 <strong>no te hacen más copropietario</strong>. Te dan poder de compra.</p>

<p>Ahora, la parte donde vamos a ser deliberadamente cuidadosos, porque es fácil pasarse de listo. Un crédito de descuento <strong>no es en sí mismo una venta</strong>: es un descuento aplicable a una venta futura. La venta —y el CFDI de ingreso que la documenta— ocurre cuando efectivamente adquieres el certificado DC-3/SEP, que sí es un servicio que Ceduverse presta. Y el tratamiento fiscal fino de todo esto —cómo se documenta exactamente el crédito, sobre qué base se calcula el IVA de la operación a la que se aplica, y en qué momento— <strong>está expresamente marcado como pendiente de confirmación con el área fiscal y con el CLO</strong> en el propio borrador. No está cerrado. No lo cierres tú.</p>

<p>Así que la distinción que quiero que domines, dicha con la precisión que aguanta una pregunta difícil, es esta: <strong>los $150 son capital (recibo de aportación de capital, no es venta, es patrimonio tuyo) y los $20 son un crédito comercial de descuento (no es capital, no funda certificados, y su tratamiento fiscal exacto está pendiente de confirmar)</strong>. Van en el mismo bono, llegan al mismo tiempo, pero contable y fiscalmente son animales distintos, y por eso el bono los presenta separados en vez de anunciar "$170 de bienvenida" como si fuera un solo monto indiferenciado.</p>

<p>Si un prospecto o un contador te pregunta por el IVA de esos $20, la respuesta correcta —la única honesta— es: <strong>"ese punto está en revisión fiscal y aún no está confirmado."</strong> No lo adivines. Un número fiscal inventado en una conversación comercial es un problema que aparece meses después, en una revisión, y ya no lo puedes retirar.</p>

<h3>Por qué el bono está diseñado así</h3>
<p>Podrías preguntarte: ¿por qué no simplemente dar $170 de saldo, o $170 de aportación, y ya? La respuesta revela la intención completa del diseño. El bono está construido para resolver <strong>dos fricciones distintas al mismo tiempo</strong>, y cada componente resuelve una.</p>

<p>Los $150 resuelven la fricción de la <strong>entrada al patrimonio</strong>: convertirte en copropietario de la cooperativa sin tener que desembolsar dinero para hacerlo. Los $20 resuelven la fricción del <strong>primer uso real</strong>: que no te quedes con un certificado bonito y ninguna experiencia concreta de lo que la cooperativa hace. Con esos $20 puedes empezar a caminar hacia tu primer certificado DC-3/SEP, que es el producto tangible por el que la gente llega a Ceduverse en primer lugar.</p>

<p>Dicho de otra forma: el bono te da a la vez <strong>la propiedad y el uso</strong>. Sin los $150 serías un usuario más. Sin los $20 serías un copropietario sin nada que hacer. Con los dos, eres un socio que además ya está usando lo que es suyo — que es, precisamente, la definición operativa de una cooperativa de consumo: una sociedad cuyos socios son las mismas personas que consumen sus servicios.</p>

<h3>Los certificados digitales: el acta ya lo permite</h3>
<p>Un detalle que vale la pena que conozcas, porque es lo que hace viable todo esto de forma ágil: el <strong>Artículo Sexto del acta constitutiva 6520</strong> de Ceduverse <strong>autoriza expresamente que los certificados de aportación sean digitales</strong>. Esto no es una interpretación creativa ni un vacío legal que estemos aprovechando: está escrito en el acta constitutiva, pasada ante notario. Los certificados pueden ser digitales, nominativos e indivisibles.</p>

<p>Esto importa porque significa que tu certificado de $150 no depende de que alguien imprima un papel, lo firme y te lo mande por paquetería. Puede existir de forma digital desde el primer momento, con todo el respaldo jurídico de un certificado tradicional. En el Curso 5 vamos a profundizar en esto y en su representación como gemelo registral — por ahora quédate con que el acta ya lo permite.</p>

<h3>Los tres avisos, otra vez</h3>
<p>Repetimos los guardrails, y los vamos a seguir repitiendo, porque en un curso que habla de capital y de patrimonio no pueden aparecer una sola vez y darse por dichos. <strong>Esto no es una oferta de valores</strong>: el certificado de aportación no es un título colocable en un mercado. <strong>Esto no es asesoría de inversión</strong>: nada aquí es una recomendación sobre qué hacer con tu dinero. <strong>No hay rendimientos garantizados</strong>: el bono no promete que tu certificado vaya a valer más, ni que vayas a recibir ningún retorno por tenerlo. El bono te hace copropietario; no te promete ganancias.</p>

<p>Ahora bien — hay una pregunta obvia que probablemente ya te estás haciendo, y es la pregunta correcta: si el bono te regala $170 y tú no los pagas, <strong>¿de dónde salen?</strong> Alguien tiene que poner ese valor. Y la respuesta a esa pregunta es el corazón intelectual de este curso, y el tema del siguiente módulo.</p>
      `,
      references: ["Acta constitutiva 6520, Art. Sexto (certificados digitales, nominativos, indivisibles) — VIGENTE", "Reglamento Interno Ceduverse DRAFT v0.1 — BORRADOR sin aprobación de Asamblea, sin efectos jurídicos (Art. 19 vigencia; Art. 20 cláusula de borrador). Art. 14 Bis.1: monto $170 y desglose $150 capital / $20 crédito de descuento; Art. 14 Bis.1.b: los $20 son promoción/crédito comercial, NO capital; Art. 14 Bis.6: monto y desglose son parámetros ajustables por acuerdo de la Asamblea General Ordinaria", "Reglamento Interno Ceduverse DRAFT, Arts. 14.3 y 15 — base de IVA/retenciones marcada [PENDIENTE confirmar con Daniel/fiscal]", "Reglamento Interno Ceduverse DRAFT, Art. 13 (recibo de aportación de capital, no CFDI de ingreso)", "Memoria ceduverse-cobros-web3 (§ bono de bienvenida)"],
    },
    {
      title: "De dónde sale el valor: el origen EXTERNO",
      description: "El valor del bono viene de fuera del capital cooperativo: un token respaldado 1:1 (diseño) o una beca de empresa (canal B2B). Nunca del propio capital social. Por qué un token sin reserva 1:1 sería capital simulado, y por qué CEDU —la vía correcta por ser 1:1 MXN— todavía está pendiente de incorporarse al proyecto de Reglamento.",
      durationMinutes: 14,
      contentHtml: `
<p>Terminamos el módulo anterior con la pregunta correcta: si el bono de bienvenida entrega $170 pesos de valor y el socio no los paga de su bolsillo, <strong>¿de dónde salen esos $170?</strong> Este módulo responde esa pregunta, y es el módulo más importante de todo el curso. Si solo pudieras quedarte con uno, quédate con este.</p>

<h3>La regla que no se negocia: el valor viene de FUERA</h3>
<p>Empecemos por la regla, porque todo lo demás se deriva de ella: <strong>el valor del bono de bienvenida proviene de una fuente EXTERNA al capital cooperativo. Nunca sale del propio capital social de Ceduverse.</strong></p>

<p>Esto tiene un nombre: <strong>financiamiento híbrido</strong>. Híbrido porque la cooperativa se fondea de dos maneras distintas y separadas — por un lado, las aportaciones genuinas de sus socios; por otro, valor que entra desde fuera de la estructura cooperativa para hacer posible el bono. Y "separadas" es la palabra clave: son dos canales que jamás se cruzan.</p>

<p>¿Por qué esta regla es tan rígida? Porque si el bono saliera del propio capital social, estaríamos ante algo grotesco y muy fácil de describir: la cooperativa tomaría dinero del capital aportado por unos socios para fabricar la aportación de otros socios. El capital social crecería en el papel sin que hubiera entrado un solo peso nuevo al sistema. Sería <strong>capital circular</strong>: dinero dando vueltas sobre sí mismo, inflando una cifra sin sustancia detrás. Es exactamente el mismo defecto que en el Curso 1 llamamos "un espejo apuntando al vacío," aplicado ahora al capital de una sociedad. Y en el mundo real tiene consecuencias reales: un capital social inflado con aportaciones fabricadas desde adentro no resiste una auditoría, no resiste una revisión fiscal, y no resiste la primera pregunta seria de cualquier persona informada.</p>

<h3>Los dos canales de origen externo</h3>
<p>El diseño contempla dos canales por los cuales puede entrar ese valor externo. Son distintos entre sí y están en etapas de madurez muy diferentes, así que vamos a ser precisos con cada uno.</p>

<p><strong>Canal B2B — la beca de empresa.</strong> Una empresa aliada financia los bonos de bienvenida de las personas que quiere incorporar a la cooperativa: sus trabajadores, sus prospectos de capacitación, su red. El valor entra desde el presupuesto de esa empresa — que es, por definición, dinero externo a la cooperativa. La empresa paga, el trabajador recibe su bono, funda su certificado y empieza a capacitarse. Este canal es directo, comprensible y no depende de ninguna pieza tecnológica: es una relación comercial entre una empresa y la cooperativa, documentada como tal.</p>

<p><strong>Canal directo — el token respaldado 1:1.</strong> Aquí el diseño contempla que el valor del bono provenga de un token respaldado uno a uno por una reserva real. Y ahora tenemos que ser extremadamente cuidadosos con lo que decimos, porque este es el punto donde un curso descuidado mentiría sin darse cuenta.</p>

<h3>Alto: ningún token está desplegado</h3>
<p>Vamos a decirlo con todas sus letras y sin ambigüedad alguna: <strong>a la fecha de este curso, ninguno de los tokens del consorcio está desplegado. Todos son diseño e intención.</strong> No existe uno solo que tú, como socio, puedas usar hoy.</p>

<p>Dentro del consorcio hay tres tokens diseñados, cada uno perteneciente a una entidad distinta y con una paridad distinta. <strong>CEDU</strong> es el token de Ceduverse, diseñado <strong>1:1 al peso mexicano (MXN)</strong>. <strong>BRAIN</strong> es el de BrainShield, diseñado <strong>1:1 a USDC/USDT</strong>. <strong>KAKAW</strong> es el de Kakaw, diseñado <strong>1:1 al oro</strong>. Los tres son diseño. Ninguno está desplegado ni en operación. Y para cerrar cualquier duda: KakawChain y KakawCoin, de los que quizá hayas escuchado, tampoco existen como producto.</p>

<p>De lo que describimos en este módulo, <strong>lo único que existe y opera hoy es la red Base y el mecanismo de atestación por hash SHA-256</strong> — el sello del que hablaremos en el módulo 5. Todo lo demás relacionado con tokens es arquitectura sobre papel.</p>

<h3>Cuál token es el que importa aquí: CEDU, no BRAIN</h3>
<p>Si el canal de token llegara a operar para el bono, el token relevante sería <strong>CEDU</strong>, el de Ceduverse — no BRAIN. La razón es puramente práctica y bastante elegante: la aportación de $150 está denominada <strong>en pesos mexicanos</strong>, y CEDU está diseñado 1:1 al peso mexicano. Eso significa <strong>cero riesgo cambiario</strong>: no hay que convertir de dólares a pesos, no hay que absorber una fluctuación del tipo de cambio entre el momento en que se financia el bono y el momento en que se acredita la aportación. Peso contra peso, sin FX de por medio.</p>

<p>BRAIN, al estar diseñado 1:1 a USDC/USDT, introduciría exactamente ese riesgo cambiario que no tenemos por qué asumir para fondear un certificado que vale $150 pesos. Cada token pertenece a su entidad y sirve a su propósito; confundirlos no es un error menor de nomenclatura, es un error de arquitectura.</p>

<p>Y ahora una precisión de honestidad documental que te va a servir el día que alguien revise esto con lupa. El <strong>proyecto de Reglamento Interno</strong> —que, recuérdalo, es borrador no aprobado— cuando enumera las vías de fuente externa admitidas para fondear el bono, hoy solo menciona <strong>BRAIN 1:1 USDC/USDT o KAKAW 1:1 oro</strong>. <strong>CEDU no aparece ahí.</strong> No porque se haya descartado, sino porque ese texto quedó desactualizado frente al diseño: CEDU es la vía correcta precisamente por lo que acabamos de explicar —la aportación es en pesos y CEDU es 1:1 MXN, cero FX—, y su incorporación al Reglamento <strong>está pendiente y debe hacerse antes de que el documento vaya a Asamblea</strong>.</p>

<p>¿Por qué te contamos esto en vez de barrerlo debajo del tapete? Porque es exactamente la clase de detalle en el que se nota si un modelo es serio. Citar un artículo como si respaldara lo que decimos, cuando ese artículo dice otra cosa, es el mismo tipo de trampa —a menor escala— que un token sin reserva: aparentar respaldo donde no lo hay todavía. Así que dilo tal cual: <strong>CEDU 1:1 MXN es la vía prevista por el diseño, y el Reglamento aún tiene que actualizarse para recogerla</strong>. No cites el Art. 14 Bis como si ya la autorizara. No lo hace.</p>

<h3>Por qué un token sin reserva 1:1 sería capital simulado</h3>
<p>Y ahora llegamos al fondo del asunto — el corazón intelectual de este curso.</p>

<p>Imagina por un momento el atajo tentador: emitir un NFT o un token, entregárselo al socio como su "bono," y dar por acreditada la aportación. Rápido, barato, tecnológicamente vistoso. En algún punto del diseño de este modelo, esa opción estuvo sobre la mesa. Y fue <strong>explícitamente rechazada</strong>.</p>

<p>La razón es demoledora en su simplicidad. Un token sin una reserva real que lo respalde uno a uno <strong>no tiene valor propio</strong>. Es una entrada en una base de datos. Emitirlo no crea valor; solo crea un registro. Si la cooperativa acreditara aportaciones contra un token así, estaría diciendo: "tu certificado de $150 está pagado con este objeto digital que yo mismo creé de la nada y al que yo mismo le asigné el valor de $150." El capital social crecería $150 pesos sin que hubieran entrado $150 pesos. Eso es <strong>capital simulado</strong>, y es funcionalmente idéntico al capital circular que describimos al inicio del módulo: el sistema se financia a sí mismo con su propia promesa.</p>

<p>Y no es un problema abstracto. Un capital social sostenido por tokens sin reserva se desmorona ante la primera pregunta seria: <em>enséñame el dinero</em>. No hay dinero que enseñar. Hay un token, y detrás del token hay otro token, y detrás no hay nada. Es exactamente el patrón que en el Curso 1 aprendiste a detectar en los proyectos "RWA" que fingen la sustancia off-chain — solo que aquí el daño sería peor, porque no estaríamos hablando del precio de un activo especulativo, sino del <strong>capital social de una sociedad cooperativa real</strong>, con socios reales cuyo patrimonio depende de que esa cifra sea verdadera.</p>

<p>Por eso el diseño exige que, si el bono se fondea con CEDU, exista antes una <strong>reserva 1:1 real en tesorería</strong>: por cada peso de CEDU emitido, un peso de verdad guardado. Sin esa reserva, el canal de token no se activa. Punto. Y ese es exactamente el tema del siguiente módulo.</p>

<h3>Los tres avisos</h3>
<p>Como en cada módulo de este curso: <strong>nada de esto es una oferta de valores</strong> — ni el certificado de aportación, ni el bono, ni un token que todavía no existe. <strong>Nada de esto es asesoría de inversión</strong>. Y <strong>no hay rendimientos garantizados</strong> de ninguna clase. Describimos un diseño de financiamiento del capital de una cooperativa, no un producto de inversión.</p>
      `,
      references: ["Master RAW seal / tokenización 2026-07-15 (§5, §6, §8 fases F1/F2)", "Memoria ceduverse-cobros-web3 (§ bono / origen externo)", "Memoria brainshield-rwa-pivot (tokens 1:1, estado de despliegue: CEDU 1:1 MXN, BRAIN 1:1 USDC/USDT, KAKAW 1:1 oro — ninguno desplegado)", "Reglamento Interno Ceduverse DRAFT v0.1 — BORRADOR sin aprobación de Asamblea, sin efectos jurídicos. Arts. 3 y 14 Bis.2: exigen origen EXTERNO y reserva 1:1 obligatoria, y rechazan el token sin reserva como capital simulado. ATENCIÓN: la enumeración de vías admitidas de ese artículo solo lista BRAIN 1:1 USDC/USDT y KAKAW 1:1 oro — NO menciona CEDU. El artículo NO es autoridad para la vía CEDU; su incorporación al Reglamento está [PENDIENTE] y debe resolverse antes de la Asamblea (confirmar con Daniel/CLO)"],
    },
    {
      title: "La reserva 1:1: sin ella no se emite",
      description: "La tesorería que respalda el bono. Qué significa 1:1 en la práctica, la dependencia explícita (constituir la reserva ANTES de emitir), y la capitalización del 5% con tope de 20 certificados ($3,000).",
      durationMinutes: 13,
      contentHtml: `
<p>En el módulo anterior llegamos a una conclusión inevitable: un token sin respaldo real es capital simulado, y el capital simulado no sostiene a una cooperativa de verdad. La solución a ese problema tiene nombre propio y es el tema de este módulo: la <strong>reserva 1:1</strong>.</p>

<h3>Qué significa 1:1, sin poesía</h3>
<p>Una reserva 1:1 significa exactamente lo que dice, y su belleza está en que no admite interpretaciones: <strong>por cada peso de CEDU que exista, hay un peso mexicano real guardado en tesorería</strong>. No 1:0.8. No "respaldado por activos diversos cuyo valor estimado equivale aproximadamente a." No una canasta de cosas que suman más o menos. Uno a uno, peso contra peso, verificable.</p>

<p>Fíjate en lo que esta definición logra. Si existen $100,000 pesos de CEDU en circulación, entonces hay $100,000 pesos mexicanos reales en la tesorería que los respalda. Eso significa que el token deja de ser una promesa y se convierte en un <strong>recibo</strong>: no es un objeto digital al que alguien le asignó un valor por decreto, es la representación de dinero que efectivamente existe en otro lugar. Y cuando un bono de $170 se financia con ese CEDU, no está financiado con aire — está financiado con los $170 pesos reales que están sentados en la reserva respaldando esa porción de token.</p>

<p>Aquí está el puente conceptual con todo lo que aprendiste en los cursos anteriores de esta academia: la reserva 1:1 es, para un token, exactamente lo que las <strong>4 patas</strong> son para un RWA. Es la sustancia real que vive fuera de la pantalla y que le da sentido a la representación digital. Sin ella, el token es el espejo apuntando al vacío; con ella, el token refleja algo que de verdad está ahí.</p>

<h3>La dependencia explícita, en orden estricto</h3>
<p>De todo este módulo, esta es la frase que no puedes olvidar ni al explicarlo ni al operarlo: <strong>hay que constituir la reserva 1:1 en tesorería ANTES de emitir bonos financiados por token.</strong> Antes. No en paralelo, no "mientras tanto arrancamos y luego la fondeamos," no "ya casi." Antes.</p>

<p>El orden no es una recomendación de prudencia — es la única secuencia que evita que el modelo se convierta justo en lo que rechazó. Si se emitieran bonos primero y se prometiera constituir la reserva después, el sistema estaría operando, durante todo ese intervalo, con capital simulado. Los certificados de esos socios estarían acreditados contra nada. Y el hecho de que la reserva llegara meses después no repararía retroactivamente el momento en el que el capital social creció sin sustancia.</p>

<p>Por eso, en términos prácticos y presentes: <strong>el canal de bono financiado por token no está disponible hoy</strong>. No porque falte escribir el código —eso es lo de menos— sino porque la reserva 1:1 en tesorería todavía no está constituida, y esa es la condición que manda. Cuando exista la reserva, el canal se podrá activar. Mientras no exista, no. El canal B2B de beca de empresa, en cambio, no depende de ninguna de estas piezas: ese sí es un mecanismo comercial ordinario y directo.</p>

<p>Si eres socio comercial, esto tiene una consecuencia muy concreta en tu trabajo: <strong>nunca le describas a un prospecto el bono financiado por token como algo que puede usar hoy</strong>. Es diseño. Explícalo como diseño. La honestidad sobre lo que existe y lo que no es, en sí misma, la mejor demostración de que el modelo tiene sustancia — porque quien no tiene nada que esconder no necesita adornar los tiempos.</p>

<h3>La capitalización del 5%: cómo tu aportación crece con tu actividad</h3>
<p>Hasta aquí hemos hablado de cómo <em>nace</em> tu primer certificado. Ahora hablemos de cómo tu patrimonio en la cooperativa puede <em>crecer</em> — y la respuesta, otra vez, no es que pongas más dinero de tu bolsillo.</p>

<p>El mecanismo se llama <strong>capitalización</strong>, y antes de la mecánica va la etiqueta, igual que con el bono: <strong>es política propuesta en el proyecto de Reglamento Interno —el mismo borrador no aprobado del que hablamos en el módulo 2— y está sujeta a ratificación o ajuste por la Asamblea General.</strong> El propio borrador lo dice sin rodeos: el porcentaje, el tope y las fuentes que cuentan como "movimiento de valor" son <em>"parámetros ajustables por acuerdo de la Asamblea General Ordinaria"</em>. Así que lee lo que sigue como el diseño vigente en el papel de trabajo, no como una regla en vigor.</p>

<p>Hecha la aclaración: el mecanismo que el proyecto contempla es que el <strong>5% de cada consumo o comisión del socio se convierta en su propio capital</strong>. Cada vez que consumes un servicio de la cooperativa, o cada vez que ganas una comisión como socio comercial, un 5% de ese valor no se quedaría en la cooperativa como ingreso: se acreditaría como aportación tuya, fondeando certificados a tu nombre.</p>

<p>Nota que la capitalización se alimenta de dos fuentes distintas, y ambas son actividad tuya que ya ocurre de todas formas: tu <strong>consumo</strong> de los servicios de la cooperativa, y tus <strong>comisiones</strong> como socio comercial, cuya tasa base es del <strong>15%</strong>. No es dinero adicional que pongas — es una fracción del valor que tú ya generaste, reencauzada hacia tu propio patrimonio. El esquema completo de comisiones lo veremos en el Curso 6; aquí solo nos interesa que entiendas de dónde sale la base sobre la que se calcula ese 5%.</p>

<p>Veámoslo con la cifra más grande del catálogo, para que la mecánica quede clara. La <strong>certificación RVOE Academy por experiencias laborales cuesta $49,900 pesos</strong>. El 5% de $49,900 son <strong>$2,495 pesos</strong>. Divididos entre el valor nominal de $150 por certificado, eso equivale aproximadamente a <strong>16 certificados</strong> acreditados a tu nombre a partir de una sola operación. Dieciséis certificados de patrimonio tuyo, generados por una actividad que de todas formas ibas a realizar.</p>

<p>Y aquí entra el límite, que es tan importante como el mecanismo: el proyecto contempla que <strong>la capitalización tenga un tope de 20 certificados, es decir, $3,000 pesos</strong> (20 × $150 = $3,000). Al llegar a ese tope, la capitalización dejaría de acreditar certificados adicionales. Tu actividad puede seguir; tu capital acumulado por esta vía se detiene ahí. Y otra vez, con la misma etiqueta: <strong>ese tope —como el 5% y como los $170 del bono— es un parámetro propuesto, ajustable por acuerdo de la Asamblea General Ordinaria.</strong> Hoy el diseño dice 5% y 20 certificados; quien puede moverlos es la Asamblea, no la administración, no el equipo comercial, y no tú.</p>

<h3>Por qué existe el tope (y por qué es una buena noticia)</h3>
<p>El tope de 20 certificados podría parecer una limitación arbitraria, pero es todo lo contrario: es una <strong>salvaguarda de la naturaleza cooperativa</strong>. Sin él, alguien con mucho volumen de actividad podría acumular cientos de certificados y concentrar una porción desproporcionada del capital social, y la cooperativa empezaría a parecerse a una sociedad mercantil donde manda quien más tiene.</p>

<p>Y aquí conviene aclarar algo que se malinterpreta constantemente, aunque lo veremos a fondo en el Curso 5: en una cooperativa, <strong>1 socio = 1 voto</strong>. Así lo establece la LGSC, y así opera Ceduverse. Tengas 1 certificado o tengas 20, tu voto en la asamblea vale exactamente lo mismo que el de cualquier otro socio. Los certificados representan tu patrimonio, no tu poder de decisión. Una cooperativa es una sociedad <strong>de personas</strong>, no de capitales — y esa frase, que suena a eslogan, es en realidad la diferencia jurídica de fondo entre esta figura y una sociedad anónima.</p>

<p>El tope de $3,000 protege esa naturaleza. Y de paso te dice algo honesto sobre el modelo: <strong>este no es un vehículo para acumular capital</strong>. No está diseñado para que "inviertas" y acumules. Está diseñado para que las personas que usan la cooperativa sean copropietarias de ella, en una proporción sana y acotada.</p>

<h3>Los tres avisos, una vez más</h3>
<p>Y precisamente por lo que acabamos de decir, los guardrails caen aquí con todo su peso. <strong>Esto no es una oferta de valores</strong>: los certificados no son títulos negociables ni instrumentos de mercado. <strong>Esto no es asesoría de inversión</strong>: nada aquí es una recomendación patrimonial para tu caso particular. <strong>No hay rendimientos garantizados</strong>: la capitalización del 5% no es un rendimiento — es la conversión de una fracción de tu propia actividad en tu propio capital. No es dinero que la cooperativa te promete; es valor que tú generaste, reencauzado hacia tu patrimonio, con un tope explícito y sin promesa alguna de que crezca más allá de eso.</p>

<p>Nos falta la última pieza: ya sabemos que el valor viene de fuera y que la reserva debe existir antes. Pero, ¿cómo se <strong>prueba</strong> todo esto? ¿Cómo sabes tú, o un auditor, o el SAT, que tu aportación efectivamente existió y fue cubierta? Ese es el módulo final.</p>
      `,
      references: ["Master RAW seal / tokenización 2026-07-15 (§5 capitalización, §8 F1/F2)", "Reglamento Interno Ceduverse DRAFT v0.1 — BORRADOR sin aprobación de Asamblea, sin efectos jurídicos (Art. 19 vigencia; Art. 20 cláusula de borrador). Art. 14: política de capitalización del 5% y tope de 20 certificados; Art. 14.6: el porcentaje, el tope y las fuentes de 'movimiento de valor' son parámetros ajustables por acuerdo de la Asamblea General Ordinaria", "Reglamento Interno Ceduverse DRAFT, Art. 14 Bis.3 (dependencia de tesorería: reserva 1:1 constituida ANTES de emitir bonos por vía token)", "LGSC y acta constitutiva 6520, Art. Décimo fracc. VII (1 socio = 1 voto)", "Memoria ceduverse-cobros-web3 (§ capitalización 5%, tope 20 certificados)"],
    },
    {
      title: "Materialidad y trazabilidad: la prueba de que tu aportación existe",
      description: "El comprobante sellado on-chain da respaldo real al certificado. Hash SHA-256 en Base, el NFT como gemelo registral (no título negociable), el Libro como fuente de verdad, y la defensa de materialidad ante el 69-B. Cierre del curso.",
      durationMinutes: 12,
      contentHtml: `
<p>Llegamos al último módulo del Curso 4. Ya sabes que tu aportación es patrimonio y no gasto —reembolsable con procedimiento, plazo y sin garantía de monto—; que el bono propuesto son $170, partidos en $150 de capital y $20 de crédito de descuento; que esas cifras son política pendiente de aprobación en Asamblea; que el valor viene de una fuente externa —beca de empresa hoy, token CEDU cuando exista la reserva—; y que sin reserva 1:1 constituida antes, no se emite. Falta la pregunta que todo lo amarra: <strong>¿cómo se prueba?</strong></p>

<h3>Materialidad: la palabra que le importa al SAT</h3>
<p>En el derecho fiscal mexicano hay un concepto que domina cualquier revisión seria: la <strong>materialidad</strong>. Materialidad significa que una operación no solo está documentada en un papel — significa que <strong>efectivamente ocurrió</strong>, y que puedes demostrarlo con evidencia dura y verificable.</p>

<p>El <strong>artículo 69-B del Código Fiscal de la Federación</strong> es la herramienta con la que el SAT identifica operaciones simuladas: operaciones que existen en el papel pero no en los hechos. Y una aportación de capital es exactamente el tipo de operación que un revisor va a querer verificar, porque el capital social es una de las cifras más fáciles de inflar de forma ficticia y, por lo mismo, una de las más escrutadas.</p>

<p>Aquí es donde todo el diseño que has estudiado en este curso encaja en una sola pieza coherente. ¿Por qué insistimos tanto en que el valor del bono viene de FUERA? ¿Por qué la reserva 1:1 es innegociable? ¿Por qué se rechazó el NFT sin respaldo? <strong>Porque cada una de esas decisiones es una decisión de materialidad.</strong> Un bono financiado con dinero externo real deja rastro: hay una transferencia, hay un origen identificable, hay un pagador. Un bono financiado con un token creado de la nada no deja rastro de nada, porque no ocurrió nada. La sustancia no es un adorno ético del modelo — es la condición para que el modelo sea defendible.</p>

<h3>El sello: hash SHA-256 anclado en Base</h3>
<p>El mecanismo concreto de prueba ya lo conoces si tomaste los cursos anteriores, y aquí lo aplicamos a tu aportación. Cuando ocurre un evento de aportación —el alta de tu certificado, o la acreditación de una fracción capitalizada— se genera un <strong>recibo de aportación de capital</strong>. De ese documento se calcula un <strong>hash SHA-256</strong>: una huella digital única que cambia por completo si el documento se altera en un solo carácter, y que permanece idéntica si el documento no se toca. Esa huella se <strong>ancla en la red Base</strong>.</p>

<p>A partir de ese momento existe una prueba pública, con fecha, imposible de alterar retroactivamente, de que ese comprobante existía en esa forma exacta en ese momento exacto. No es la palabra de la cooperativa contra la de nadie: es verificable por cualquiera, sin pedir permiso.</p>

<p>Y aquí está la conexión que quiero que veas con claridad: <strong>el sello no crea el valor de tu aportación — prueba que la aportación ocurrió</strong>. El valor viene del dinero externo real que la fondeó. El sello es el testigo, no la fuente. Un sello sobre una aportación simulada seguiría siendo, como dijimos en el Curso 2, evidencia de una mentira sellada con mucha tecnología. Primero la sustancia; después el sello. Nunca al revés.</p>

<p>Vale la pena recordar el estado real de las cosas, con la honestidad que hemos mantenido en todo el curso: de toda la arquitectura digital que hemos descrito, <strong>lo que existe y opera hoy es la red Base y el mecanismo de atestación por hash SHA-256</strong>. Los tokens del consorcio —CEDU incluido— siguen siendo diseño.</p>

<h3>El NFT es un gemelo registral, no un título negociable</h3>
<p>Ahora una precisión jurídica que es probablemente la más importante de este módulo, y que en el Curso 5 desarrollaremos a fondo.</p>

<p>El diseño contempla que tu certificado de aportación tenga una representación digital: un <strong>NFT gemelo registral</strong>. Lee bien las dos palabras: <strong>gemelo</strong> y <strong>registral</strong>. Es un gemelo porque es el reflejo de algo que ya existe en otro lado. Es registral porque su función es documentar un registro, no ser el registro mismo.</p>

<p>La <strong>fuente de verdad es el Libro de Registro de Certificados de Aportación</strong> de la cooperativa. Ese libro, y no el NFT, es donde vive jurídicamente tu condición de socio y tu titularidad. El NFT es su espejo por hash: refleja lo que el libro dice, con una prueba de integridad pública encima.</p>

<p>Y por eso mismo — dilo así siempre, sin matices: <strong>el NFT NO es un título negociable</strong>. No es un valor. No es un instrumento que puedas vender en un mercado secundario, listar en un exchange, o transferir libremente a quien quieras. La transmisión de certificados de aportación está restringida por los estatutos de la cooperativa y sigue el procedimiento formal que la ley y las bases constitutivas establecen. El NFT documenta esa titularidad; no la transmite ni la libera. Si alguien alguna vez te presenta un certificado de aportación de Ceduverse como algo que se puede comprar y vender en un mercado, está describiendo algo que este instrumento no es y no puede ser.</p>

<p>Un detalle adicional que protege tu privacidad: lo que se ancla on-chain son <strong>hashes</strong>, no datos personales. El registro incluye el hash del titular, no tu nombre; el hash del comprobante, no el comprobante. La red pública prueba integridad sin exponer quién eres — la misma lógica de anonimato que ya viste en BrainShield, aplicada a tu certificado.</p>

<h3>Cerrando el círculo del curso</h3>
<p>Mira el recorrido completo, porque ahora todas las piezas embonan. Tu aportación no es un gasto: es patrimonio, respaldado por la LGSC y el acta 6520 — reembolsable, sí, pero con procedimiento formal, con efectos hasta el cierre del ejercicio (o del siguiente), absorbiendo pérdidas proporcionales, y con el valor de reembolso de los certificados capitalizados <strong>todavía pendiente de definirse</strong>. El bono de bienvenida que el proyecto contempla es de <strong>$170</strong>: <strong>$150</strong> que fundan tu primer certificado como capital y <strong>$20</strong> de crédito comercial de descuento para tu primer certificado DC-3/SEP —cuyo tratamiento fiscal fino sigue en revisión—. Ese valor viene de FUERA —beca de empresa hoy; token CEDU 1:1 MXN cuando exista la reserva y cuando el Reglamento se actualice para recoger esa vía—, nunca del capital social. La reserva 1:1 debe constituirse ANTES de emitir cualquier bono por token, porque sin ella el capital sería simulado. Tu patrimonio puede crecer con la capitalización del <strong>5%</strong> de tu consumo o comisión, hasta un tope de <strong>20 certificados ($3,000)</strong>. Y todo el proceso queda sellado con hash SHA-256 en Base, dándole materialidad verificable a cada evento — con el NFT como gemelo registral del Libro, jamás como título negociable.</p>

<p>Y sobre esas cifras —los $170, su desglose, el 5%, el tope— la etiqueta que debe acompañarlas siempre que salgan de tu boca: <strong>son política propuesta en un Reglamento Interno que todavía es borrador, no aprobado por la Asamblea General y sin efectos jurídicos, y son parámetros expresamente ajustables por acuerdo de esa misma Asamblea.</strong> Lo firme hoy es la LGSC y el acta constitutiva 6520. Lo demás está diseñado, escrito y esperando su Asamblea. Explicar esa diferencia no debilita tu argumento: es tu argumento. Quien distingue con precisión entre lo que rige y lo que se propone es exactamente la clase de persona a la que uno le cree el resto.</p>

<p>Cada pieza de este diseño existe para que la respuesta a la pregunta <em>"enséñame el dinero"</em> sea siempre: <strong>aquí está</strong>. Y para que la respuesta a <em>"¿esto ya es una regla?"</em> sea siempre exacta — un sí o un todavía no, nunca un rodeo.</p>

<h3>Los tres avisos, por última vez</h3>
<p>Y cerramos donde empezamos, porque estos avisos no son letra chica — son la descripción exacta de lo que este modelo es y no es. <strong>Nada en este curso constituye una oferta de valores.</strong> Un certificado de aportación cooperativa no es una acción, ni un bono, ni un título negociable, ni está registrado ante autoridad bursátil alguna. <strong>Nada en este curso constituye asesoría de inversión.</strong> Si tienes dudas sobre tu situación patrimonial o fiscal, consulta a tu propio asesor profesional. <strong>No hay rendimientos garantizados</strong>, de ningún tipo, en ninguna parte de este modelo. Ser copropietario de una cooperativa de consumo no es invertir esperando un retorno: es participar en una sociedad de personas cuyos servicios tú mismo consumes.</p>

<p>Si vas a explicar esto a alguien más, hazlo con estos mismos límites. Un modelo que necesita exagerarse para venderse es un modelo débil. Este no lo necesita.</p>

<h3>Tu siguiente paso</h3>
<p><strong>Activa tu certificado de aportación.</strong> Ya sabes exactamente qué es —tu patrimonio, no un gasto—, de dónde viene el valor que lo funda, por qué la reserva 1:1 no se negocia, y cómo se prueba que existe. Ese es, precisamente, el conocimiento con el que se toma una decisión informada.</p>

<p>Y cuando quieras profundizar en el instrumento mismo —el certificado, el NFT gemelo registral, el principio de 1 socio = 1 voto, y las reglas de transmisión y reembolso— te esperamos en el Curso 5 de Academia RWA.</p>
      `,
      references: ["Master RAW seal / tokenización 2026-07-15 (§4 sello RAW, §5 materialidad, §6 tokenización por entidad)", "CFF art. 69-B (operaciones simuladas / materialidad)", "Acta constitutiva 6520, Art. Sexto — VIGENTE", "Reglamento Interno Ceduverse DRAFT v0.1 — BORRADOR sin aprobación de Asamblea, sin efectos jurídicos (Arts. 19 y 20). Art. 12: certificado digital y sello RAW on-chain, Libro de Registro como fuente de verdad, sin datos personales en cadena; Art. 15: recibo de aportación de capital y comprobante sellado on-chain como materialidad; Arts. 14.6 y 14 Bis.6: bono, 5% y tope son parámetros ajustables por acuerdo de la Asamblea General Ordinaria"],
    },
  ],

  "certificados-aportacion-nft": [
    {
      title: "Qué es un certificado de aportación",
      description: "El título del socio en la cooperativa: nominativo, indivisible, valor nominal $150. La cooperativa detrás de él (acta 6520) y el Artículo Sexto que autoriza que los certificados sean digitales.",
      durationMinutes: 12,
      contentHtml: `
<p>Bienvenido al Curso 5 de Academia RWA. Igual que el anterior, este curso es exclusivo para quienes participan en la parte comercial de Ceduverse: socios comerciales, empresas aliadas y directores. En el Curso 4 hiciste el trabajo conceptual —entendiste que la aportación es patrimonio y no gasto, desarmaste el bono de $170, viste por qué el valor tiene que venir de FUERA y por qué sin reserva 1:1 no se emite nada—. Aquí cambiamos de lente: dejamos de hablar del <em>mecanismo que funda</em> tu certificado y ponemos bajo la lupa <strong>el certificado mismo</strong>. Qué es exactamente, cómo se representa digitalmente, qué derechos te da (y cuáles no), cómo crece y bajo qué reglas —o bajo qué reglas <em>todavía por aprobar</em>— se transmite y se reembolsa.</p>

<h3>La definición precisa</h3>
<p>Un <strong>certificado de aportación</strong> es el título que documenta la aportación de un socio al capital social de la cooperativa. En Ceduverse tiene tres características que conviene decir despacio, porque cada una tiene consecuencias prácticas.</p>

<p>Es <strong>nominativo</strong>: está a tu nombre. No es un título al portador que valga por el simple hecho de tenerlo en la mano; vale porque tú, identificado, apareces como su titular. Es <strong>indivisible</strong>: no existe medio certificado ni un cuarto de certificado. O tienes uno completo o no lo tienes. Y tiene un <strong>valor nominal de $150 pesos</strong>: esa es la cifra que representa, y no fluctúa con la oferta y la demanda porque no hay oferta ni demanda — no cotiza en ningún lado. Un certificado de aportación de Ceduverse vale $150 el día que se emite y vale $150 como valor nominal el día que lo revises tres años después.</p>

<p>Cuando esos $150 están completamente cubiertos, se dice que el certificado está <strong>totalmente exhibido</strong>: pagado por entero, sin saldo pendiente. Esa expresión, que suena a tecnicismo contable, es en realidad la que marca la frontera entre "tienes un certificado" y "tienes un compromiso de certificado a medio fondear".</p>

<h3>La cooperativa que hay detrás del título</h3>
<p>Un título no significa nada si la sociedad que lo emite no existe de verdad. Ceduverse existe: es una <strong>sociedad cooperativa de consumo de responsabilidad limitada de capital variable</strong>, constituida mediante el <strong>acta 6520</strong> ante la <strong>Notaría 110 de Quintana Roo</strong>, e inscrita en el Registro Público de Comercio bajo el folio <strong>N-2026009627</strong>. No es un proyecto, no es una marca, no es una comunidad: es una persona moral con instrumento notarial e inscripción registral, y cualquiera puede ir a verificarla.</p>

<p>Su punto de partida son <strong>5 socios fundadores con 20% cada uno</strong> y <strong>100 certificados de $150</strong>, es decir, $15,000 pesos de capital fundacional. Vale la pena que te detengas en la escala: ciento cincuenta pesos por certificado, cien certificados. No estamos hablando de un vehículo de gran capital. Estamos hablando de una figura pensada para que muchas personas quepan dentro con una participación pequeña y sana — que es, exactamente, lo que una cooperativa de consumo debe ser.</p>

<h3>El Artículo Sexto: el permiso que hace posible todo lo demás</h3>
<p>Y aquí llegamos al corazón de este curso completo. Si de todo el Curso 5 solo pudieras recordar una cosa, que sea esta.</p>

<p>El <strong>Artículo Sexto del acta constitutiva 6520</strong> establece que los certificados de aportación de Ceduverse <strong>podrán ser digitales, nominativos e indivisibles</strong>. Léelo otra vez: <em>digitales</em>. Está escrito en el acta constitutiva, pasada ante notario público e inscrita en el registro. No es una interpretación creativa que estemos forzando, no es un vacío legal que estemos aprovechando, no es una opinión de abogado que alguien podría discutir. <strong>Es el texto del propio instrumento constitutivo de la sociedad, y es la base legal sobre la que se sostiene todo lo que vas a aprender en los siguientes módulos.</strong></p>

<p>Piensa en lo que significa. La gran mayoría de los proyectos que intentan representar digitalmente la participación en una sociedad tienen que hacer malabares: forzar figuras que no encajan, inventar estructuras paralelas, o directamente esperar a que la ley cambie. Ceduverse no tiene ese problema, y no por suerte: porque quien redactó su acta constitutiva previó desde el día uno que los certificados pudieran existir en forma digital. Ese permiso previo, escrito y protocolizado, es lo que convierte la representación digital del certificado en algo <strong>que el acta ya autoriza</strong>, en lugar de algo que habría que ir a pedir.</p>

<p>El mismo Artículo Sexto ordena también que la cooperativa lleve un <strong>Libro de Registro de Certificados de Aportación</strong>, donde se inscriben todas las operaciones sobre certificados: suscripción, adquisición, transmisión o garantía. Retén ese libro en la memoria, porque en el módulo 2 vamos a ver que es, jurídicamente, la pieza más importante de toda la arquitectura — más importante, incluso, que cualquier cosa que ocurra en una blockchain.</p>

<h3>Digital no cambia la naturaleza</h3>
<p>Una precisión que evita el malentendido más común: que un certificado sea digital <strong>no altera en absoluto su naturaleza jurídica</strong>. Un certificado digital de $150 es exactamente el mismo instrumento que un certificado impreso de $150: mismo valor nominal, mismos derechos, mismas obligaciones, mismo régimen de gobierno. Lo digital cambia el <em>soporte</em>, no la <em>sustancia</em>. Es la misma lógica que ya viste en toda esta academia: primero la sustancia real, después la representación. Nunca al revés.</p>

<p>Queda un punto honesto que vale la pena que conozcas, porque este curso no te va a esconder los cabos sueltos: el Artículo Sexto describe el contenido que debe llevar el título e incluye, entre otros elementos, la firma autógrafa de los administradores. Cómo se satisface ese requisito en un título digital —con firma electrónica avanzada o su equivalente— es un punto que está en revisión legal y que se resolverá antes de que la representación digital se opere en forma. Que el acta autorice lo digital no significa que los detalles de implementación ya estén todos cerrados; significa que la puerta está abierta y que ninguno de esos detalles requiere reformar el acta.</p>

<h3>Los tres avisos</h3>
<p>Como en todo el Curso 4, y por las mismas razones, los guardrails aparecen desde el primer módulo y se van a repetir en cada uno. <strong>Nada en este curso constituye una oferta de valores</strong>: un certificado de aportación cooperativa no es una acción, ni un bono, ni un título colocable en un mercado, ni está registrado ante autoridad bursátil alguna — porque no lo es ni pretende serlo. <strong>Nada en este curso constituye asesoría de inversión</strong>: no es una recomendación sobre qué hacer con tu dinero; si tienes dudas sobre tu situación patrimonial o fiscal, consulta a tu propio asesor. Y <strong>no hay rendimientos garantizados</strong>: tener certificados no promete que valgan más mañana ni que produzcan retorno alguno.</p>

<p>Ya sabes qué es el instrumento y por qué el acta permite que sea digital. En el siguiente módulo vamos a ver <em>cómo</em> se representa digitalmente — y por qué esa representación, por más tecnología que lleve encima, jamás es el título.</p>
      `,
      references: ["Acta constitutiva 6520, Notaría 110 QR, RPC N-2026009627 (Art. Sexto: certificados digitales, nominativos, indivisibles; Libro de Registro)", "Master RAW seal / tokenización 2026-07-15 (§2 realidad legal comparada, §6 tokenización por entidad)", "LGSC (régimen de sociedades cooperativas)"],
    },
    {
      title: "El NFT gemelo registral",
      description: "El Libro de Registro es la fuente de verdad; el NFT y el sello on-chain son su espejo por hash, nunca el título negociable. El doble sello Opción A (wallet del proyecto + contrafirma de la wallet madre) y la privacidad sin datos personales on-chain.",
      durationMinutes: 13,
      contentHtml: `
<p>En el Curso 4 te presentamos la idea en una frase: el NFT es un <strong>gemelo registral</strong>, no un título negociable. Fue suficiente para cerrar aquel curso. Aquí no lo es: vas a explicar este modelo a otras personas, y para eso necesitas entender la mecánica completa, incluido el punto donde casi todo el mundo se equivoca.</p>

<h3>Quién manda: el Libro de Registro</h3>
<p>Empecemos por la jerarquía, porque de ella se deriva todo lo demás. La fuente de verdad de tu condición de socio y de tu titularidad sobre los certificados es el <strong>Libro de Registro de Certificados de Aportación</strong> que la cooperativa lleva conforme al Artículo Sexto. No es la blockchain. No es el NFT. No es la pantalla de tu panel de socio. Es el Libro.</p>

<p>La consecuencia es tajante y conviene que la memorices tal cual: <strong>la sociedad reconoce como propietario únicamente a quien aparece inscrito en el Libro de Registro</strong>. Si una operación no está inscrita, no surte efectos frente a la cooperativa — por más que exista un registro digital elegante en algún otro lado. Y si alguna vez hubiera discrepancia entre el Libro y cualquier representación digital, <strong>prevalece el Libro</strong>. Sin excepciones y sin debate.</p>

<p>Esto no es una limitación del diseño: es el diseño. Es lo que impide que el modelo caiga en el error clásico de la industria — creer que porque algo está en una cadena de bloques, es jurídicamente cierto. Una cadena de bloques prueba integridad e inmutabilidad de un dato; no le da validez societaria a nada. La validez societaria la da el Libro, respaldado por el acta y la ley.</p>

<h3>Qué es entonces el gemelo</h3>
<p>Con esa jerarquía clara, la definición se vuelve fácil. El <strong>gemelo registral</strong> es el espejo del Libro. Cuando ocurre un evento —el alta de un certificado, un cambio en el Libro, la acreditación de una aportación— se construye un <strong>registro canónico</strong> de ese evento y se calcula su <strong>hash SHA-256</strong>: la huella digital única que cambia por completo si el dato se altera en un solo carácter, y que permanece idéntica si no se toca. Esa huella se ancla en la red <strong>Base</strong>.</p>

<p>El resultado es una prueba pública, con fecha cierta, imposible de alterar retroactivamente, de que el Libro decía exactamente eso en ese momento exacto. <strong>El gemelo no crea el derecho: lo atestigua.</strong> Es un testigo con memoria perfecta que no puede mentir sobre lo que vio — pero sigue siendo un testigo, no el hecho.</p>

<h3>El doble sello: la Opción A</h3>
<p>Aquí viene la pieza de arquitectura que distingue a este consorcio, y que no vimos en el Curso 4. Cada evento sellable no se ancla una vez: se ancla <strong>dos</strong>. Es lo que llamamos el <strong>doble sello, Opción A</strong>.</p>

<p>El primer sello lo pone la <strong>wallet del propio proyecto</strong> —en este caso, la de Ceduverse—, y significa: <em>la entidad actúa</em>. Es la cooperativa la que asienta y sella su propio evento registral. El segundo sello lo pone la <strong>wallet madre de BrainShield</strong>, que <strong>contrafirma el mismo hash</strong> haciendo referencia a la transacción del proyecto, y significa: <em>el originador RWA del consorcio ratifica</em>. Ambos anclajes viven en <strong>Base</strong>, una sola red, con costos de transacción bajos.</p>

<p>Fíjate en la elegancia de la variante elegida: la madre no repite un anclaje independiente desde cero — ancla el hash <em>más un puntero</em> a la transacción del proyecto. Mismo valor probatorio, aproximadamente la mitad del gas. Y el efecto es una <strong>doble cadena de custodia</strong>: cualquier persona puede verificar, sin permiso y sin ver un solo dato personal, dos cosas por separado — que Ceduverse selló, y que BrainShield ratificó. Dos firmas independientes sobre el mismo hecho, imposibles de fabricar una sin la otra.</p>

<h3>Privacidad: hashes, nunca datos personales</h3>
<p>La regla es absoluta y es uno de los principios rectores del diseño: <strong>on-chain solo va el hash. La información personal nunca toca la cadena.</strong></p>

<p>El registro canónico que se sella contiene el tipo de evento, la entidad, el identificador del certificado, el <strong>hash del titular —no tu nombre—</strong>, el <strong>hash del comprobante —no el comprobante—</strong>, y la fecha en UTC. Tu nombre, tu RFC, tu CURP, tu domicilio y tu correo viven en el Libro de Registro, off-chain, con acceso restringido, tratados conforme a la ley de protección de datos personales. Hacia afuera, tu exposición pública es un <strong>alias</strong> — el mismo patrón que ya conociste en la bóveda de BrainShield.</p>

<p>Esto logra algo que suena contradictorio y no lo es: un tercero puede verificar que tu certificado es auténtico y está vigente, comparando huellas, <strong>sin saber jamás quién eres</strong>. Tú decides si revelas el dato original detrás del hash y ante quién. La cadena prueba integridad sin costar privacidad.</p>

<h3>Lo que el gemelo NO es (la parte que más se malinterpreta)</h3>
<p>Dilo siempre así, sin matices y sin adornos: <strong>el NFT gemelo NO es un título negociable</strong>. No es un valor. No es un instrumento financiero. No se lista en un exchange, no se vende en un mercado secundario, no se transfiere libremente a quien tú quieras. Y por si quedara duda: <strong>la titularidad on-chain no confiere la calidad de socio</strong> — esa deriva exclusivamente de la inscripción en el Libro de Registro. Si alguien tuviera el NFT y no estuviera en el Libro, no sería socio de nada.</p>

<p>El gemelo <strong>documenta</strong> la titularidad; no la transmite ni la libera. Es un espejo: refleja lo que el Libro dice, y cuando el Libro cambia, el espejo cambia. Nunca al contrario.</p>

<h3>Qué existe hoy, con toda honestidad</h3>
<p>Y ahora la parte que un curso descuidado se saltaría. Vamos a ser exactos, porque tú vas a repetir esto frente a prospectos y no puedes decir de más.</p>

<p>Lo que <strong>existe y opera hoy</strong> es la red <strong>Base</strong> y el <strong>mecanismo de atestación por hash SHA-256</strong> — el motor de sellado del consorcio, que ya ancla hashes en Base. Eso es real y funciona. Lo que <strong>todavía no existe</strong> es el NFT de tu certificado: <strong>no está acuñado ni desplegado</strong>. La arquitectura de doble sello aplicada a eventos de certificados y aportaciones es la fase de arranque del proyecto, y el NFT visible como gemelo del libro digital es una fase posterior. Incluso las wallets por proyecto están en proceso de constituirse — existe la madre de BrainShield; las demás se están montando.</p>

<p>Así que cuando expliques esto: <strong>habla del NFT como diseño, nunca como algo que un socio pueda tener hoy</strong>. Y recuerda que todos los tokens del consorcio —CEDU incluido— siguen siendo diseño. Como aprendiste en el Curso 4, la honestidad sobre los tiempos no es una debilidad del pitch: es la mejor prueba de que hay sustancia detrás. Quien no tiene nada que esconder no necesita adornar el calendario.</p>

<h3>Los tres avisos</h3>
<p><strong>Esto no es una oferta de valores</strong> — y en este módulo la frase es casi redundante: un gemelo registral que no es negociable, que no transmite titularidad y que ni siquiera está acuñado difícilmente podría serlo. <strong>Esto no es asesoría de inversión.</strong> <strong>No hay rendimientos garantizados</strong>: el gemelo no promete nada, no rinde nada, no se aprecia. Prueba un hecho. Nada más — y nada menos.</p>

<p>Ya sabes qué documenta el gemelo. Falta la pregunta que todo socio comercial escucha tarde o temprano: <em>"si acumulo certificados, ¿mando más?"</em> La respuesta está en el siguiente módulo, y es un no rotundo.</p>
      `,
      references: ["Master RAW seal / tokenización 2026-07-15 (§3 principios, §4 doble sello Opción A, §8 fases F1/F2, §13 gaps abiertos)", "Acta constitutiva 6520, Art. Sexto (Libro de Registro de Certificados de Aportación)", "LFPDPPP (tratamiento de datos personales del socio)"],
    },
    {
      title: "1 socio = 1 voto",
      description: "Por más certificados que acumules, tu voto sigue siendo uno. La cooperativa es una sociedad de personas, no de capitales — y ningún NFT ni token pondera el voto por tenencia.",
      durationMinutes: 12,
      contentHtml: `
<p>Este es el módulo más corto de explicar y el más difícil de aceptar para quien viene del mundo de las sociedades mercantiles. La regla cabe en cuatro palabras: <strong>1 socio = 1 voto</strong>. Y no tiene asteriscos.</p>

<h3>La regla, sin matices</h3>
<p>En Ceduverse, cada socio tiene <strong>un (1) voto en la Asamblea General, con independencia del número o del valor de los certificados de aportación de que sea titular</strong>. Así lo establece la <strong>Ley General de Sociedades Cooperativas</strong>, así lo recoge el acta constitutiva de la cooperativa, y así opera en los hechos.</p>

<p>Tengas 1 certificado o tengas 20 —el tope máximo que puedes alcanzar por capitalización, como veremos en el siguiente módulo—, tu voto en la asamblea vale exactamente lo mismo que el de cualquier otro socio. Ni un poquito más. El socio que entró ayer con su primer certificado de $150 pesa, en la asamblea, lo mismo que el socio que lleva tres años y llegó al tope. Y lo mismo que un socio fundador.</p>

<h3>De personas, no de capitales</h3>
<p>Detrás de esa regla hay una frase que suena a eslogan y que en realidad es la diferencia jurídica de fondo entre dos mundos: <strong>una cooperativa es una sociedad de personas, no de capitales</strong>.</p>

<p>Compárala con una sociedad anónima, que es el modelo que casi todos llevamos en la cabeza por default. En una S.A., la acción es la unidad de poder: cada acción vale un voto, así que quien tiene el 51% del capital decide el 100% de las cosas, y quien tiene el 2% asiste a la asamblea a ver qué le informan. El capital manda. Es un modelo perfectamente legítimo y tiene su lugar en el mundo — pero es un modelo donde <em>la voz sigue al dinero</em>.</p>

<p>En una cooperativa la lógica se invierte por completo. El certificado de aportación representa <strong>tu patrimonio</strong>, no <strong>tu poder de decisión</strong>. Son dos ejes separados que en la S.A. están fusionados y que aquí, deliberadamente, no lo están. Tu dinero dentro de la sociedad puede crecer (hasta el tope); tu voz, no. Tu voz ya está completa desde el primer certificado, y nada de lo que hagas después la aumenta.</p>

<p>Vale la pena notar el caso de los <strong>5 socios fundadores con 20% cada uno</strong> de Ceduverse: ahí la aritmética patrimonial y la del voto coinciden por casualidad —cinco personas, un quinto cada una—. Pero es solo eso: una coincidencia del punto de partida. Aunque uno de ellos tuviera mañana el doble de certificados que otro, seguiría teniendo exactamente un voto. La coincidencia es del arranque; la regla es estructural.</p>

<h3>Y aquí la parte que te toca a ti: el NFT no vota</h3>
<p>Este es el punto donde todo lo que aprendiste en el módulo anterior se conecta con esta regla, y donde un diseño descuidado habría destruido la naturaleza de la cooperativa sin darse cuenta.</p>

<p>El impulso natural de cualquiera que haya visto proyectos de blockchain es asumir que si tienes un token o un NFT de una organización, ese token te da poder de gobierno proporcional a cuántos tengas. Es literalmente el modelo por defecto de la industria: más tokens, más voto. En Ceduverse, ese modelo es <strong>jurídicamente imposible</strong>.</p>

<p>Por eso el principio de diseño está escrito de forma explícita y sin ambigüedad: <strong>ningún token ni NFT pondera el voto por tenencia</strong>. El gemelo registral no otorga por sí voto ni derecho proporcional alguno. Y ya lo sabes del módulo 2: la titularidad on-chain ni siquiera confiere la calidad de socio — esa deriva exclusivamente de la inscripción en el Libro de Registro. El NFT documenta cuánto patrimonio tienes; el voto no está ahí, y nunca lo estará.</p>

<p>Piénsalo al revés, que es como se ve la gravedad del asunto: si el NFT ponderara el voto, la cooperativa dejaría de ser una cooperativa. Se convertiría, de facto, en una sociedad de capitales operada por tokens, contra su propia acta y contra la LGSC. No sería una mejora tecnológica: sería una violación al régimen societario disfrazada de innovación. Y ese es exactamente el tipo de error que este diseño rechaza por principio, igual que rechazó el NFT sin reserva 1:1 que estudiaste en el Curso 4. La tecnología se adapta al régimen societario. Jamás al revés.</p>

<h3>Por qué esto importa cuando lo explicas</h3>
<p>Si eres socio comercial, esta regla te va a ahorrar problemas serios — y te va a costar algunas conversaciones incómodas. Vale la pena que las tengas de todas formas.</p>

<p>Habrá prospectos que, al escuchar "certificados," "NFT" y "copropiedad" en la misma frase, empiecen a imaginar que acumular certificados es una forma de escalar dentro de la organización, de ganar influencia, de "tener más peso." <strong>Corrígelo de inmediato, en el momento, sin rodeos.</strong> No lo dejes pasar pensando que es un detalle menor que ya entenderán después. Una persona que se vuelve socia creyendo que compró influencia se va a sentir engañada el día de la primera asamblea, y con razón — y tú vas a ser quien se lo dijo.</p>

<p>La forma correcta de decirlo es directa: <em>"Tus certificados son tu patrimonio dentro de la cooperativa. Tu voto es uno, siempre, igual que el mío y el de todos. Aquí no se compra influencia — se comparte propiedad."</em></p>

<p>Y hay algo más profundo que puedes ofrecer, si el prospecto es de los que escuchan: esta regla es <strong>una protección para él</strong>, no una limitación. En una sociedad de capitales, el socio pequeño está estructuralmente a merced del socio grande. Aquí no puede pasar. Nadie puede comprar el control de Ceduverse acumulando certificados, porque el control no está a la venta — no existe como algo comprable. Esa es una garantía que un socio minoritario de una S.A. simplemente no tiene.</p>

<h3>El puente al siguiente módulo</h3>
<p>Ahora bien: si el voto no crece con los certificados, ¿para qué querría alguien más certificados? Porque el patrimonio sí crece — con un límite explícito, y sin que salga un peso adicional de tu bolsillo. Es el mecanismo de la <strong>capitalización del 5%</strong>, que ya conociste en su forma general en el Curso 4 y que aquí vamos a desarmar con números en la mano.</p>

<p>Y un recordatorio de los guardrails, que aplican también aquí: <strong>nada de esto es una oferta de valores</strong> — el certificado no es una acción y no lleva voto proporcional, precisamente porque no es una acción. <strong>Nada de esto es asesoría de inversión.</strong> <strong>No hay rendimientos garantizados.</strong> Ser copropietario de una cooperativa de consumo es participar en una sociedad de personas cuyos servicios tú mismo consumes; no es adquirir una posición de control ni un retorno prometido.</p>
      `,
      references: ["LGSC (1 socio = 1 voto, independientemente del número de certificados)", "Acta constitutiva 6520 (Estatutos: igualdad de derechos de los socios)", "Master RAW seal / tokenización 2026-07-15 (§3.3 respeto al régimen societario, §6 voto per-socio, no por NFT)"],
    },
    {
      title: "La capitalización del 5%",
      description: "Cómo tu aportación crece con tu propia actividad: 5% de cada movimiento de valor, el ejemplo del RVOE de $49,900 → $2,495 ≈ 16 certificados, la indivisibilidad y el tope de 20 certificados ($3,000).",
      durationMinutes: 13,
      contentHtml: `
<p>En el Curso 4 conociste la capitalización del 5% como parte del recorrido del bono: te dijimos que existe, cuánto es y dónde está el tope. Aquí la abrimos por dentro. Vas a ver de dónde sale cada peso, qué pasa con los centavos que no alcanzan a formar un certificado, y por qué el tope —que a primera vista parece una restricción molesta— es en realidad la pieza que sostiene todo lo que aprendiste en el módulo anterior.</p>

<h3>El parámetro</h3>
<p>La regla es esta: se capitaliza el <strong>5% de cada movimiento de valor del socio</strong> —su consumo de cursos y certificaciones, y sus comisiones por referido— convirtiéndolo en <strong>aportación propia</strong>, materializada en certificados de $150 cada uno, hasta un <strong>tope de 20 certificados ($3,000)</strong>.</p>

<p>Y ahora la precisión que separa a quien entendió el modelo de quien memorizó un número. <strong>Ese 5% no es un regalo de la cooperativa. Sale del pago del propio socio.</strong> Cuando tú pagas por un servicio de Ceduverse, una fracción de <em>tu propio pago</em> se reasigna a <em>tu propia cuenta de capital</em>, y el resto se reconoce como consumo. No hay subsidio, no hay dinero externo, no hay desembolso adicional tuyo. Es tu dinero cambiando de casilla: de "pago por un servicio" a "patrimonio tuyo dentro de la sociedad."</p>

<p>Nota la diferencia limpia con el <strong>bono de bienvenida</strong> del Curso 4, porque son dos mecanismos distintos que resuelven cosas distintas. El bono se financia con valor <strong>externo</strong> —beca de empresa o, en el diseño, token respaldado 1:1— y funda tu <em>primer</em> certificado. La capitalización del 5% se financia con <strong>tu propio pago</strong> y hace <em>crecer</em> tu aportación después. Externo para arrancar; propio para crecer. Distinto origen, distinta documentación, misma política coherente: volverte copropietario sin gasto adicional de tu bolsillo.</p>

<h3>El ejemplo grande: el RVOE de $49,900</h3>
<p>Vamos con la cifra más alta del catálogo, porque es donde la mecánica se ve con claridad. La <strong>certificación RVOE Academy por experiencias laborales cuesta $49,900 pesos</strong>.</p>

<p>El <strong>5% de $49,900 son $2,495 pesos</strong>. Esos $2,495 se asignan a tu cuenta de capital como aportación tuya. Los <strong>$47,405</strong> restantes se reconocen como ingreso por servicio de la cooperativa, con su CFDI correspondiente.</p>

<p>Fíjate en lo que acaba de pasar, porque resuelve un problema real y no es un truco contable: <strong>el mismo pago se parte en dos naturalezas distintas</strong>. La porción de capital es tuya y se documenta con un <strong>recibo o constancia de aportación</strong> — no con un CFDI de ingreso, porque la cooperativa no te vendió esa parte: la recibió como aportación a su capital. La porción de servicio sí es una venta, sí es ingreso gravable de la cooperativa, y sí se factura normalmente. Es exactamente la misma distinción entre capital y consumo que ya dominas desde el Curso 4 con los $150 y los $20 del bono — aplicada ahora dentro de una sola transacción.</p>

<p>Un punto de honestidad: el tratamiento fiscal fino de ese split —la base exacta de IVA y retenciones sobre la porción de servicio, y si la porción de capital se detrae antes o después de los impuestos indirectos— está pendiente de validación con el área fiscal y con el CLO. El parámetro del 5% está definido; el asiento contable exacto se está cerrando con contabilidad. No te inventes ese detalle frente a un prospecto: si te preguntan por el IVA, la respuesta correcta es que ese punto está en revisión fiscal.</p>

<h3>Los certificados que salen de ahí (y el residuo)</h3>
<p>¿Cuántos certificados son $2,495? Divide entre el valor nominal de $150: son <strong>aproximadamente 16 certificados</strong>. Y aquí aparece, con toda su fuerza práctica, una característica que en el módulo 1 parecía puro tecnicismo: <strong>la indivisibilidad</strong>.</p>

<p>Porque 16 certificados son $2,400 exactos. Y $2,495 menos $2,400 son <strong>$95 pesos</strong> que sobran. ¿Qué pasa con esos $95? No se pierden, y tampoco fabrican dos tercios de certificado — porque medio certificado no existe. El diseño contempla que ese remanente se <strong>acumule en un saldo de aportación pendiente</strong>, esperando. Cuando ese saldo acumulado alcance $150, se emite el certificado número 17, se inscribe en el Libro de Registro y, en su momento, se sella on-chain.</p>

<p>Así que la acreditación es <strong>fraccionada pero nunca fraccionaria</strong>: el saldo se acumula peso por peso; el certificado nace entero o no nace. La indivisibilidad del título obliga a que exista ese saldo intermedio, y el saldo intermedio hace que ningún peso tuyo se desperdicie. Las dos piezas encajan por diseño.</p>

<h3>El tope: 20 certificados, $3,000</h3>
<p>Ahora el límite: la capitalización tiene un <strong>tope de 20 certificados, es decir, $3,000 pesos</strong> (20 × $150 = $3,000). Al alcanzarlo, la capitalización automática cesa para ese socio. Tu actividad puede seguir creciendo todo lo que quieras; tu capital acumulado por esta vía se detiene ahí.</p>

<p>Haz la cuenta con el producto ancla y vas a ver algo revelador: con una certificación de $49,900 capitalizas ~16 certificados. Con poco más de una sola compra de ese producto <strong>ya estás en el tope</strong>. No hacen falta años ni volumen: el techo está prácticamente al alcance de la mano desde el arranque.</p>

<p>Eso te dice algo importantísimo sobre el modelo, y quiero que lo digas exactamente así: <strong>esto no es un vehículo para acumular capital</strong>. Está diseñado para que las personas que usan la cooperativa sean copropietarias de ella en una proporción sana y acotada — no para que nadie construya una posición grande dentro del capital social.</p>

<h3>Por qué el tope protege lo del módulo anterior</h3>
<p>Y ahora conecta este módulo con el anterior, porque juntos forman una sola idea.</p>

<p>Ya sabes que <strong>1 socio = 1 voto</strong>, así que técnicamente nadie podría comprar control acumulando certificados: el control no está a la venta. Entonces, ¿para qué el tope? Porque el poder no solo se ejerce por el voto. Un socio que concentrara una porción desproporcionada del capital social tendría, de facto, una influencia económica que la asamblea no le dio y que la estructura no contempla: peso en las decisiones patrimoniales, en el reembolso, en la percepción interna de quién es "el grande" de la cooperativa. La sociedad empezaría a <em>parecerse</em> a una sociedad de capitales aunque su acta dijera lo contrario.</p>

<p>El tope de $3,000 cierra esa puerta desde el otro lado. Es la <strong>salvaguarda económica</strong> del principio de gobierno que estudiaste en el módulo 3: uno impide que el capital compre el voto; el otro impide que el capital se concentre. Los dos juntos, y solo los dos juntos, sostienen que Ceduverse sea de verdad una sociedad de personas.</p>

<p>Una nota de precisión: tanto el porcentaje (5%) como el tope (20 certificados) son <strong>parámetros de política</strong>, no cifras grabadas en piedra en el acta. Están diseñados para poder ajustarse por acuerdo de la Asamblea General, dentro de los límites de la LGSC y de los Estatutos. Hoy son 5% y 20 certificados; explícalos con esas cifras exactas, y explica también que la Asamblea es quien puede moverlas — no la administración, no el equipo comercial, no tú.</p>

<h3>Los tres avisos</h3>
<p>Y aquí caen con todo su peso, porque este es el módulo donde alguien podría confundirse. <strong>Esto no es una oferta de valores</strong>: los certificados que salen de la capitalización son idénticos a cualquier otro certificado — no negociables, sin mercado, sin cotización. <strong>Esto no es asesoría de inversión</strong>: nada aquí es una recomendación patrimonial para tu caso particular. Y sobre todo: <strong>no hay rendimientos garantizados, y la capitalización del 5% NO es un rendimiento</strong>. Repítelo así de claro cada vez que lo expliques. No es dinero que la cooperativa te promete, ni un interés, ni un retorno sobre tu aportación. Es <em>una fracción de tu propio pago reencauzada hacia tu propio patrimonio</em>, con un tope explícito de $3,000 y sin promesa alguna de que ese patrimonio crezca más allá de eso. Un prospecto que salga de tu conversación pensando "me dan 5% de rendimiento" entendió exactamente lo contrario de lo que dice el modelo.</p>

<p>Ya sabes cómo nace tu certificado y cómo crece. Falta la parte más incómoda y la más honesta del curso: qué pasa cuando quieres <em>salir</em>.</p>
      `,
      references: ["Master RAW seal / tokenización 2026-07-15 (§5 aportación capitalizada, §13 gaps abiertos)", "Reglamento Interno Ceduverse DRAFT (política de capitalización — borrador pendiente de aprobación en Asamblea)", "Acta constitutiva 6520, Art. Sexto (valor nominal $150, indivisibilidad)", "Memoria ceduverse-cobros-web3 (§ capitalización 5%, tope 20 certificados)"],
    },
    {
      title: "Transmisión y reembolso: lo que está en firme y lo que está por aprobarse",
      description: "Qué dicen hoy el acta y la LGSC sobre salir de la cooperativa, qué contempla el proyecto de Reglamento Interno (aún borrador, no aprobado) sobre transmisión restringida y derecho del tanto, y los puntos que siguen abiertos. Cierre del curso.",
      durationMinutes: 13,
      contentHtml: `
<p>Llegamos al último módulo del Curso 5, y es el que más disciplina exige — de nosotros al escribirlo y de ti al explicarlo. Porque aquí vamos a hablar de reglas que <strong>todavía no están aprobadas</strong>, y la tentación de presentarlas como si ya lo estuvieran es enorme. No lo vamos a hacer. Y tú tampoco.</p>

<h3>Primero: la línea entre lo firme y lo pendiente</h3>
<p>Antes de decir una sola regla, aprende a separar dos categorías, porque de esto depende que no le mientas a nadie sin querer.</p>

<p>Por un lado está lo que <strong>ya está en firme</strong>: la <strong>Ley General de Sociedades Cooperativas</strong> y el <strong>acta constitutiva 6520</strong>. Eso es derecho vigente, protocolizado, inscrito. Manda hoy.</p>

<p>Por el otro está el <strong>Reglamento Interno</strong>, que es donde deberían vivir los detalles de la transmisión de certificados. Y aquí la afirmación central de este módulo: <strong>el Reglamento Interno de Ceduverse es hoy un proyecto en borrador. NO ha sido aprobado por la Asamblea General de Socios y, por lo tanto, NO está vigente ni surte efectos jurídicos.</strong> Todo lo que ese borrador propone es exactamente eso — una propuesta, sujeta a revisión del CLO y a aprobación en Asamblea con el quórum que exigen el acta y la ley.</p>

<p>Así que cuando en los párrafos siguientes leas "el proyecto de Reglamento contempla…", léelo literal. No es un rodeo elegante ni una fórmula de cortesía legal: es la descripción exacta del estatus. Y cuando lo expliques a un prospecto o a un socio, usa esas mismas palabras.</p>

<h3>Lo que sí está en firme hoy</h3>
<p>Empecemos por lo sólido, que no es poco.</p>

<p>El <strong>Artículo Sexto del acta</strong> ordena que toda operación sobre certificados —suscripción, adquisición, <strong>transmisión</strong> o garantía— se inscriba en el <strong>Libro de Registro</strong>. La transmisión existe como figura y debe registrarse. Lo que el acta <em>no</em> hace es detallar el procedimiento: ese es, reconocidamente, un <strong>hueco estatutario</strong> que el acta misma remite a reglamentación interna. Y ese reglamento aún no existe en forma vigente. Ese es, con toda precisión, el estado de las cosas.</p>

<p>Sobre la salida, el acta y la ley sí son claros en varios puntos. La calidad de socio es <strong>voluntaria y de libre retiro</strong>: nadie está atrapado. Pero el retiro <strong>no surte efectos sino hasta el fin del ejercicio anual</strong> — o hasta el del siguiente ejercicio, si notificas después del último trimestre. No es una salida instantánea; tiene calendario.</p>

<p>La devolución de aportaciones se rige por el acta y por el <strong>artículo 52 de la LGSC</strong>: se practica al cierre del ejercicio, respetando el orden de prelación y a prorrata cuando corresponda. Además, la liquidación al socio se calcula sobre el valor de sus certificados, <strong>deducidas en su caso las pérdidas que proporcionalmente le correspondan</strong> — con responsabilidad limitada al importe de sus certificados, que es lo que significa la "R.L." del nombre de la sociedad. Y hay un piso que no se toca: <strong>la devolución nunca puede afectar el capital mínimo fijo sin derecho a retiro de $15,000</strong>.</p>

<p>Lee esa penúltima frase otra vez, porque es la más honesta del curso: <strong>si la cooperativa tuvo pérdidas, tu reembolso las absorbe en tu proporción</strong>. Un certificado no es una cuenta de ahorro ni un depósito garantizado. Es capital de riesgo de una sociedad real — acotado a $150 por certificado y con responsabilidad limitada, pero capital al fin. Dilo así cuando lo expliques. Un modelo que oculta esto no está protegiendo a nadie; está construyendo un reclamo futuro.</p>

<h3>Lo que el proyecto de Reglamento contempla (y aún no rige)</h3>
<p>El borrador que está en revisión propone desarrollar el hueco de la transmisión en esta dirección — y todo lo que sigue está <strong>pendiente de aprobación por la Asamblea</strong>:</p>

<p><strong>Carácter restringido.</strong> Que el certificado no sea un instrumento de libre circulación y que su transmisión esté condicionada a que el adquirente sea, o llegue a ser, socio. Esto no es caprichoso: se sigue directamente de la naturaleza cooperativa que ya estudiaste. Una sociedad de personas no puede permitir que sus títulos circulen hacia cualquiera, porque entonces dejaría de ser de personas.</p>

<p><strong>Entre socios existentes.</strong> Que un socio pueda transmitir certificados a otro socio ya inscrito, con notificación por escrito a la administración e <strong>inscripción en el Libro</strong>. Como ambos ya son socios y rige un socio-un voto, la composición del voto no se altera.</p>

<p><strong>Derecho del tanto hacia terceros.</strong> Que cuando un socio quiera transmitir a alguien que aún no es socio, deba notificar su intención, precio y condiciones, y que los demás socios tengan <strong>derecho del tanto</strong> para adquirir en igualdad de condiciones. El borrador <em>propone</em> un plazo de <strong>15 días naturales</strong> para ejercerlo — por analogía con el plazo de preferencia de 15 días que el Artículo Sexto prevé para aumentos de capital. Subraya lo que acabas de leer: <strong>ese plazo es una propuesta del borrador, no una regla vigente</strong>, y está expresamente marcado como pendiente de confirmación. No lo cites como si ya existiera.</p>

<p><strong>Admisión previa.</strong> Que si nadie ejerce el derecho del tanto, el tercero solo pueda adquirir si es <strong>admitido como socio por la Asamblea General</strong>. Sin admisión, la transmisión no surte efectos ni se inscribe.</p>

<p><strong>Inscripción como requisito de eficacia.</strong> Que ninguna transmisión, adjudicación o garantía surta efectos frente a la cooperativa ni frente a terceros mientras no conste inscrita en el Libro. Nota cómo esto cierra el círculo con el módulo 2: el Libro es la fuente de verdad, y el gemelo on-chain <strong>documenta la transmisión; no la ejecuta</strong>. Ningún movimiento de un NFT transmite un certificado. Jamás.</p>

<h3>Los puntos que siguen abiertos — dilos, no los inventes</h3>
<p>Y ahora la parte que un curso complaciente omitiría. Hay preguntas de fondo que <strong>todavía no tienen respuesta definitiva</strong>, y están marcadas como tales en el propio borrador:</p>

<p>Primero: <strong>si la transmisión puede ser onerosa con lucro para el socio, o si debe limitarse al valor nominal más reservas</strong> para preservar el carácter no especulativo de la cooperativa. Está por definirse.</p>

<p>Segundo: <strong>si los certificados obtenidos por capitalización son transmisibles o quedan afectos</strong> —no negociables— durante cierto periodo, para evitar arbitraje entre socios. Está por definirse.</p>

<p>Tercero: <strong>a qué valor se reembolsan los certificados capitalizados</strong> — valor nominal de $150, o un valor contable ajustado por reservas y pérdidas. Está por definirse.</p>

<p>Fíjate que las tres preguntas apuntan al mismo lugar: al precio. Y no están abiertas por descuido, sino porque responderlas mal convertiría un instrumento cooperativo en un instrumento especulativo. Merecen la Asamblea que les toca. <strong>Si un prospecto te pregunta cualquiera de estas tres cosas, la respuesta correcta —la única honesta— es: "ese punto está pendiente de definirse y aprobarse en Asamblea."</strong> No la adornes. No adivines. No cites el borrador como si fuera ley. Un socio comercial que inventa una regla que no existe le crea a la cooperativa un problema real con una persona real.</p>

<h3>El guardrail comercial que no se negocia</h3>
<p>De todo este módulo, esto es lo que nunca debes hacer: <strong>jamás le presentes a nadie el certificado de aportación como algo que puede vender, revender, negociar o que se va a apreciar</strong>. No lo es y no puede serlo. No hay mercado secundario. No hay exchange. No hay cotización. No hay comprador esperando. Y el NFT gemelo —cuando exista, porque hoy no está acuñado— tampoco cambia eso ni un milímetro: documenta, no negocia.</p>

<p>Si alguien alguna vez te presenta un certificado de aportación de Ceduverse como una oportunidad de compraventa o de plusvalía, está describiendo algo que este instrumento no es y no puede ser — y da igual si lo dice desde dentro o desde fuera de la cooperativa.</p>

<h3>Cerrando el curso</h3>
<p>Mira el recorrido completo. Un certificado de aportación es un título <strong>nominativo, indivisible, de valor nominal $150</strong>, emitido por una cooperativa real —<strong>acta 6520, Notaría 110 QR, RPC N-2026009627</strong>— cuyo <strong>Artículo Sexto autoriza expresamente que los certificados sean digitales</strong>: esa autorización, escrita ante notario, es la base legal de todo lo demás. Su representación digital es un <strong>gemelo registral</strong>: el <strong>Libro de Registro</strong> manda, y el hash SHA-256 anclado en <strong>Base</strong> —con <strong>doble sello: la wallet del proyecto sella, la wallet madre de BrainShield contrafirma</strong>— es su espejo, sin un solo dato personal on-chain. No es título negociable, no transmite nada, y <strong>hoy no está acuñado: es diseño</strong>. Tengas 1 certificado o 20, <strong>tu voto es uno</strong>. Tu patrimonio crece con el <strong>5% de tu propia actividad</strong> hasta un <strong>tope de 20 certificados ($3,000)</strong>, que existe justamente para que el capital no se concentre. Y las reglas de transmisión y reembolso: unas ya firmes en el acta y la LGSC, otras <strong>todavía en borrador, esperando Asamblea</strong>.</p>

<h3>Los tres avisos, por última vez</h3>
<p><strong>Nada en este curso constituye una oferta de valores.</strong> Un certificado de aportación cooperativa no es una acción, ni un bono, ni un título negociable, ni un instrumento colocable en mercado alguno, ni está registrado ante autoridad bursátil — y el gemelo registral que lo espeja tampoco. <strong>Nada en este curso constituye asesoría de inversión.</strong> Si tienes dudas sobre tu situación patrimonial o fiscal, consulta a tu propio asesor profesional. <strong>No hay rendimientos garantizados</strong>, de ningún tipo, en ninguna parte de este modelo: ni el certificado, ni la capitalización, ni el NFT prometen retorno alguno, y el reembolso puede incluso absorber pérdidas proporcionales. Ser copropietario de una cooperativa de consumo no es invertir esperando un retorno — es participar en una sociedad de personas cuyos servicios tú mismo consumes.</p>

<h3>Tu siguiente paso</h3>
<p><strong>Revisa tu propio certificado en tu panel de socio</strong> y contrástalo con lo que acabas de aprender: su valor nominal, su carácter nominativo, su registro. Y si te toca acompañar la <strong>aprobación del Reglamento Interno en Asamblea</strong>, ahora sabes exactamente qué está en juego en esos tres puntos abiertos — y por qué merecen decidirse bien y no rápido.</p>

<p>Ya dominas el instrumento. Lo que falta es lo que haces con él frente a otra persona: cómo se explica, cómo se vende sin exagerar, qué comisiones lo rodean y qué objeciones vas a enfrentar. Te esperamos en el <strong>Curso 6: Modelo cooperativo comercial</strong>.</p>
      `,
      references: ["Acta constitutiva 6520, Art. Sexto (Libro de Registro; retiro al cierre del ejercicio; preferencia de 15 días en aumentos de capital)", "LGSC art. 52 (devolución de aportaciones al cierre del ejercicio, prelación y prorrata)", "Reglamento Interno Ceduverse DRAFT v0.1 — BORRADOR sin aprobación de Asamblea, sin efectos jurídicos (transmisión, derecho del tanto, valor de reembolso: puntos marcados como pendientes)", "Master RAW seal / tokenización 2026-07-15 (§9 plan legal: conseguir el Reglamento Interno, §13 gaps abiertos)"],
    },
  ],

  "modelo-cooperativo-comercial": [
    {
      title: "El pitch en 3 minutos",
      description: "Qué vendes realmente (capacitación y certificación, membresía cooperativa, bóveda de PI, marketplace RWA, CryptoVault 24k) y por qué la sustancia real —no la promesa— es el argumento. La estructura de tres minutos y por qué decir lo que todavía no existe es tu mejor herramienta de venta.",
      durationMinutes: 13,
      contentHtml: `
<p>Bienvenido al Curso 6, el último de Academia RWA y el cierre del arco comercial. Igual que los dos anteriores, es exclusivo para socios comerciales, empresas aliadas y directores — y por una razón que ahora entenderás mejor que nunca: aquí vas a hablar con otras personas.</p>

<p>En el Curso 4 entendiste el mecanismo que funda tu certificado: la aportación como patrimonio, el bono de $170 desarmado peso por peso, el origen externo obligatorio, la reserva 1:1. En el Curso 5 pusiste bajo la lupa el instrumento mismo: el certificado nominativo e indivisible de $150, el gemelo registral, un socio un voto, la capitalización del 5% con su tope, y la parte incómoda de la salida. Ya dominas el modelo. <strong>Lo que falta es lo único que este curso puede darte: qué sale de tu boca cuando tienes enfrente a una persona real que está decidiendo si confiar en ti.</strong></p>

<p>Y aquí va la advertencia que ordena todo el curso: a partir de este momento, cada frase que aprendas la vas a repetir frente a alguien que puede tomar una decisión patrimonial por lo que tú le digas. Un error en un examen se corrige con un clic. Un error frente a un prospecto se convierte en un reclamo real, con una persona real, meses después. Por eso este curso es menos sobre <em>cómo convencer</em> y mucho más sobre <em>cómo no mentir sin darte cuenta</em>.</p>

<h3>Primero: qué vendes realmente</h3>
<p>Si te preguntaran ahora mismo "¿qué vendes?", ¿qué contestarías? Mucha gente nueva contesta "blockchain," "RWA," "tokens," "una oportunidad." Todas esas respuestas son malas, y una de ellas es directamente falsa. Vamos a ordenarlo.</p>

<p>Lo que la gente <strong>paga</strong> hoy, con dinero real, es esto: <strong>capacitación y certificación</strong>. Cursos, certificados <strong>DC-3</strong> (la constancia de competencias o habilidades laborales que reconoce la Secretaría del Trabajo y Previsión Social), certificados con reconocimiento <strong>SEP</strong>, y el producto ancla del catálogo: la <strong>certificación RVOE Academy por experiencias laborales, de $49,900 pesos</strong>. Eso es el negocio. Eso es lo que una empresa contrata y lo que un trabajador usa. Si tu pitch no aterriza ahí en los primeros treinta segundos, estás vendiendo humo aunque tengas la razón en todo lo demás.</p>

<p>Alrededor de ese núcleo hay cuatro cosas más que conviene que sepas nombrar con precisión, porque cada una tiene un estatus distinto:</p>

<p><strong>La membresía cooperativa.</strong> Ceduverse es una sociedad cooperativa de consumo real: <strong>acta 6520, Notaría 110 de Quintana Roo, inscrita en el Registro Público de Comercio bajo el folio N-2026009627</strong>. Quien entra no es cliente: es <strong>socio copropietario</strong>, con su certificado de aportación de $150 a su nombre. Esto existe hoy y es verificable por cualquiera.</p>

<p><strong>La bóveda de PI de BrainShield.</strong> BrainShield es una Sociedad Civil mexicana constituida —acta 5905— que origina RWA tangibles (inmuebles) e intangibles (propiedad intelectual: patentes, marcas, secretos industriales), con valuación de <strong>corredor público titulado bajo NIF C-8 y 0% de margen</strong>, precisamente para que quien valúa no tenga incentivo de inflar el número. Existe y opera.</p>

<p><strong>El marketplace RWA y CryptoVault 24k.</strong> El oro físico Au 999.9 en ediciones de 100 g y 200 g, serie limitada 1/320 · 2026. Producto real, con guardrails propios que ya estudiaste en el Curso 3.</p>

<p>Cuatro cosas, cuatro estatus. Un socio comercial que las mezcla en una sola nube de entusiasmo —"es una cooperativa con blockchain y oro y patentes"— no está vendiendo: está confundiendo. Y un prospecto confundido no compra; asiente y desaparece.</p>

<h3>La estructura de tres minutos</h3>
<p>Tres minutos. No más. Si necesitas veinte para que alguien entienda qué haces, el problema no es el tiempo del prospecto: es que tú todavía no lo entiendes lo suficiente.</p>

<p><strong>Primeros 30 segundos — el problema, en su idioma.</strong> No empieces por ti. Empieza por el dolor que esa persona ya tiene. A una empresa: "la STPS te exige constancias DC-3 de tu personal, y hoy eso te cuesta tiempo, dinero y trámite." A una persona: "tienes quince años de experiencia real y ningún papel que lo acredite." Ese es el gancho, y no tiene una sola palabra de tecnología.</p>

<p><strong>Siguientes 60 segundos — la sustancia.</strong> Aquí explicas qué es Ceduverse y por qué es distinto. Y "distinto" se demuestra con datos verificables, no con adjetivos: una cooperativa constituida ante notario con folio registral que se puede consultar; certificaciones con reconocimiento oficial; un modelo donde quien consume el servicio es copropietario de la sociedad que se lo presta.</p>

<p><strong>Siguientes 60 segundos — qué hay para esa persona.</strong> El reencuadre del Curso 4, dicho en una frase: <strong>no te cobramos por entrar, fundas tu patrimonio</strong>. Tu aportación de $150 no es una cuota que se va: es un certificado a tu nombre dentro del capital social. Y si eres empresa: tu aportación capacita a tu gente y te vuelve parte de la estructura.</p>

<p><strong>Últimos 30 segundos — el siguiente paso, concreto.</strong> No "¿qué te parece?" sino algo que se pueda agendar: una llamada de onboarding, una demo del panel, el envío del kit. Un pitch que termina en admiración y no en calendario no terminó.</p>

<h3>Por qué somos distintos: sustancia real</h3>
<p>Ahora, el corazón del módulo. ¿Cuál es <em>realmente</em> el diferenciador? No es la tecnología. Cualquiera puede comprar tecnología. El diferenciador es exactamente lo que aprendiste en el Curso 1 y que ahora se vuelve tu argumento central: <strong>la sustancia vive off-chain, y nosotros la tenemos</strong>.</p>

<p>La mayoría de los proyectos que se presentan como "RWA" fingen esa sustancia: ponen un token bonito y detrás no hay activo defendible, ni valuación independiente, ni título legal, ni procedencia. Un espejo apuntando al vacío. Nosotros tenemos actas notariales con folio registral, un corredor público que valúa sin margen, certificaciones con reconocimiento oficial, y un capital social que crece solo cuando entra dinero de verdad — nunca fabricado desde adentro.</p>

<p>Dicho en una frase que puedes usar tal cual: <strong>"Lo que nos hace distintos no es lo que prometemos que va a pasar. Es lo que ya se puede verificar hoy, con folio y con nombre."</strong></p>

<h3>Tu mejor herramienta de venta: decir lo que todavía NO existe</h3>
<p>Y ahora la lección más contraintuitiva de todo el curso, la que separa a un socio comercial serio de uno que va a causar un problema.</p>

<p>Tu prospecto ya escuchó veinte pitches. Todos le prometieron todo. Todos le dijeron que ya estaba listo, que ya operaba, que ya era el futuro. Si tú llegas y haces lo mismo, eres el vigésimo primero — indistinguible, y con razón. <strong>Pero si tú eres la primera persona que le dice con naturalidad qué parte todavía no existe, acabas de hacer algo que ninguno de los otros veinte hizo: le diste una razón para creerte el resto.</strong></p>

<p>Así que memoriza esta lista, porque la vas a decir en voz alta y sin nervios:</p>

<p><strong>Ningún token del consorcio está desplegado.</strong> CEDU (diseñado 1:1 al peso mexicano), BRAIN (1:1 USDC/USDT) y KAKAW (1:1 oro) son <strong>diseño</strong>. Ninguno opera. KakawChain y KakawCoin no existen como producto. Lo único que existe y opera hoy es la <strong>red Base y la atestación por hash SHA-256</strong>.</p>

<p><strong>El NFT del certificado de aportación no está acuñado.</strong> Es diseño. Ningún socio puede tenerlo hoy.</p>

<p><strong>El Reglamento Interno es un borrador.</strong> No ha sido aprobado por la Asamblea General y no surte efectos jurídicos. El bono de $170, la capitalización del 5% y el tope de 20 certificados viven ahí: son <strong>política propuesta, ajustable o ratificable por la Asamblea</strong>. No son reglas en vigor.</p>

<p>Fíjate en algo. Nada de esa lista destruye el pitch. Al contrario: cuando dices "los tokens todavía son diseño, lo que opera hoy es el sello en Base," el prospecto entiende que le estás distinguiendo lo real de lo planeado — y por primera vez tiene motivo para pensar que cuando le digas "esto sí existe," sea cierto. <strong>La credibilidad no se construye diciendo más cosas buenas; se construye siendo la persona que dice también las incómodas.</strong></p>

<h3>Los tres avisos</h3>
<p>Como en todo el arco comercial, y desde el primer módulo. <strong>Nada de esto es una oferta de valores</strong>: un certificado de aportación cooperativa no es una acción, ni un bono, ni un título colocable en mercado alguno, ni está registrado ante autoridad bursátil. <strong>Nada de esto es asesoría de inversión</strong>: no es una recomendación sobre qué hacer con el dinero de nadie. <strong>No hay rendimientos garantizados</strong> de ningún tipo: ser copropietario de una cooperativa no es invertir esperando un retorno.</p>

<p>Ya sabes qué vendes y cómo abrirlo. En el siguiente módulo, la pregunta que probablemente te trajo aquí: cuánto ganas tú — y, sobre todo, qué de eso puedes prometer hoy y qué no.</p>
      `,
      references: ["Acta constitutiva 6520, Notaría 110 QR, RPC N-2026009627 (cooperativa de consumo, certificados $150)", "Acta 5905, Notaría 110 QR — BrainShield S.C. (originador de RWA)", "Memoria brainshield-rwa-pivot (tokens 1:1 CEDU/BRAIN/KAKAW: diseño, ninguno desplegado; solo Base + SHA-256 operan)", "Memoria ceduverse-business-model (catálogo: DC-3, SEP, RVOE Academy $49,900)", "Reglamento Interno Ceduverse DRAFT v0.1 — BORRADOR sin aprobación de Asamblea, sin efectos jurídicos (Art. 19 vigencia; Art. 20 cláusula de borrador)"],
    },
    {
      title: "Comisiones: el 15%, el $500 y lo que todavía no puedes prometer",
      description: "La comisión base de agente es 15% y el rol es PLANO: no existe una escalera de rangos. El $500 por referido se paga sobre la primera aportación de la EMPRESA referida, no por estudiante. Qué está definido, qué está implementado, y por qué nunca debes prometer un monto ni una fecha de pago.",
      durationMinutes: 14,
      contentHtml: `
<p>Vamos a la pregunta que probablemente te trajo a este curso: <strong>¿cuánto ganas tú?</strong> Y vamos a contestarla con una precisión que quizá te sorprenda, porque este módulo tiene dos mitades muy distintas. La primera te dice cuáles son los parámetros. La segunda te dice cuáles de esos parámetros <em>ya funcionan</em> y cuáles todavía no — y esa segunda mitad es, de lejos, la más importante que vas a leer en todo el curso.</p>

<h3>La comisión base: 15%</h3>
<p>Tu <strong>comisión base como agente es del 15%</strong>. Cuando un estudiante se convierte en socio comercial, el sistema le genera su código comercial y le asigna ese <strong>15% por defecto</strong>. Es un campo de comisión asociado a tu código, que la administración puede ajustar caso por caso.</p>

<p>Y ahora la precisión que más malentendidos evita: <strong>ese 15% se calcula sobre el fee de administración de Ceduverse, NO sobre la aportación de la empresa</strong>. Lee eso otra vez, porque no es un tecnicismo — es la consecuencia directa de todo el Curso 4. La aportación es <em>capital del socio</em>, patrimonio suyo. Si tu comisión saliera de ahí, la cooperativa estaría pagándote con el patrimonio de otra persona: le entregaría a un socio un certificado de $150 mientras le descuenta una parte para pagarte a ti. Sería tomar capital ajeno y llamarlo comisión. Por eso la comisión sale del <strong>fee de administración</strong>, que sí es ingreso de la cooperativa por el servicio que presta. El capital del socio no se toca. Nunca.</p>

<h3>El rol es PLANO: no hay escalera de rangos</h3>
<p>Aquí viene el punto donde muchos socios comerciales llegan con una idea equivocada, y necesitamos corregirla sin rodeos.</p>

<p><strong>El rol comercial es plano. Todos los agentes son socio_comercial. No existe una escalera de rangos de comisión —agente, luego senior, luego director— dentro del sistema.</strong> Lo que existe es un <strong>campo de comisión por socio</strong>, cuyo valor por defecto es 15%. Eso es todo. Cuando alguien dice "el nivel de agente," lo que quiere decir literalmente es: un socio comercial con su comisión en el valor base de 15%. El "nivel" no es un rango con nombre, insignia ni progresión automática: es un número en un campo.</p>

<p>¿Y el <strong>director</strong>? El director existe, pero no es lo que probablemente imaginas. <strong>Director es un rol distinto —un escalón arriba de comercial en la estructura—, no un peldaño de una escalera de comisiones.</strong> No se llega a director acumulando ventas ni cruzando un umbral automático: es un rol que se asigna. Confundir estas dos cosas —un rol de la estructura con un tier de comisión— es el error conceptual más común en esta materia, y lleva directo a prometerle a alguien un ascenso que el sistema no otorga.</p>

<h3>El $500 por referido</h3>
<p>El otro parámetro que debes conocer al detalle: el bono de <strong>$500 por referido</strong>. Y su condición de activación es muy específica, así que dila completa siempre:</p>

<p><strong>Los $500 se pagan cuando la EMPRESA referida hace su PRIMERA APORTACIÓN.</strong> No cuando se registra. No cuando muestra interés. No cuando firma. Cuando aporta por primera vez, de verdad.</p>

<p>Y la mitad que más se olvida, que es justo la que te protege: <strong>NO hay bono por referir estudiantes</strong>. No se paga por persona inscrita, ni por socio reclutado, ni por cabeza. El bono está atado exclusivamente a que una <em>empresa</em> se vuelva cliente real y aporte. Guarda esa frase, porque en el módulo 3 vas a descubrir que es tu mejor respuesta a la objeción más dura que vas a enfrentar en tu vida comercial.</p>

<h3>La segunda mitad: qué está definido y qué está implementado</h3>
<p>Y ahora el giro. Todo lo anterior es la <strong>política</strong>. Pero un socio comercial honesto tiene que saber distinguir tres estados muy distintos que la gente suele meter en el mismo cajón: lo que está <em>escrito como política</em>, lo que está <em>implementado y funcionando</em>, y lo que está <em>publicado en una página de marketing</em>. No son lo mismo, y confundirlos es exactamente cómo se prometen cosas que no llegan.</p>

<p><strong>El $500 está definido como política, pero todavía no opera en el motor de comisiones.</strong> Está documentado como regla de negocio, sí. Pero a la fecha de este curso no hay un cálculo que lo dispare cuando una empresa referida hace su primera aportación: esa línea aparece en cero. Así que la formulación honesta —la única— es: <strong>"el bono de $500 por referido está definido, atado a la primera aportación de la empresa referida, y su operación en el sistema está pendiente."</strong> No le pongas fecha. No lo prometas como algo que ya se está pagando.</p>

<p><strong>La dispersión no tiene una fecha automática.</strong> Y este punto merece toda tu atención, porque es donde es más fácil quedar mal. Las comisiones se generan por periodo mensual y pasan por estados —pendiente, aprobada, pagada— pero <strong>ese avance lo ejecuta la administración de forma manual</strong>. No hay un proceso automático que corra un día del mes y disperse solo.</p>

<p>Peor todavía, y necesitas saberlo: <strong>hay materiales que se contradicen entre sí sobre la fecha</strong>. Es probable que hayas leído una fecha de corte en algún lado y otra distinta en otro. Ninguna de las dos está implementada como un proceso automático. Así que la regla es absoluta y no admite excepción: <strong>nunca le prometas a nadie —ni a un prospecto, ni a un socio de tu red, ni a ti mismo— una fecha de pago de comisiones.</strong> La respuesta correcta es: <em>"las comisiones se generan por periodo mensual y las dispersa la administración; el calendario exacto confírmalo con administración, no conmigo."</em> Aburrida, sí. Cierta, también.</p>

<h3>Lo que quizá leíste en la página pública</h3>
<p>Y ahora un aviso que este curso te debe, porque nadie más te lo va a dar.</p>

<p>Es muy posible que hayas visto en materiales públicos o de reclutamiento una tabla de perfiles con rangos, porcentajes escalonados que suben con el número de empresas, comisiones "vitalicias," bonos de override sobre la red de otros, y proyecciones de ingreso mensual. <strong>Ese contenido es material comercial, y la estructura que describe no existe hoy en el sistema.</strong> No hay escalera de rangos, no hay escalonamiento automático por volumen, no hay override, no hay una duración "vitalicia" configurada en ningún lado. Lo que existe es lo que ya te dijimos: <strong>un rol plano y un campo de comisión con valor base de 15%</strong>.</p>

<p>¿Por qué te lo contamos en vez de dejarlo pasar? Por la misma razón que en el Curso 4 te dijimos que el Reglamento aún no cita CEDU, y en el Curso 5 que el NFT no está acuñado. <strong>Porque tú eres quien va a estar en la sala cuando alguien pregunte.</strong> Si repites una tabla de rangos que el sistema no implementa, la persona que quede mal no es quien la escribió: eres tú, con tu nombre, frente a alguien que te creyó. Y si le prometiste "vitalicio" y "35%," ese reclamo tiene tu cara.</p>

<p>Y sobre las <strong>proyecciones de ingreso mensual</strong> que puedas haber visto: no las repitas. Una cifra de ganancia proyectada, dicha en una conversación de reclutamiento, funciona exactamente como una promesa de rendimiento — y ya sabes lo que opinamos de esas.</p>

<h3>Una nota que te conviene: tus comisiones y el 5%</h3>
<p>Un detalle que cierra el círculo con el Curso 5. El proyecto de Reglamento contempla que la capitalización del <strong>5%</strong> se aplique a cada movimiento de valor del socio — y ahí incluye expresamente, además del consumo de cursos y certificaciones, <strong>las comisiones por referido</strong>. Es decir: una fracción de tus propias comisiones se reencauzaría a tu propio capital, en certificados de $150, hasta el <strong>tope de 20 certificados ($3,000)</strong>.</p>

<p>Con la etiqueta de siempre, que a estas alturas ya deberías poner tú solo: eso vive en el <strong>Reglamento Interno, que es borrador no aprobado por la Asamblea y sin efectos jurídicos</strong>, y el propio borrador declara el 5% y el tope <strong>parámetros ajustables por acuerdo de la Asamblea General Ordinaria</strong>. Política propuesta. No una regla en vigor.</p>

<h3>Los tres avisos</h3>
<p><strong>Nada de esto es una oferta de valores.</strong> <strong>Nada de esto es asesoría de inversión.</strong> Y <strong>no hay rendimientos garantizados</strong> — lo cual, en este módulo, tiene una consecuencia directa y práctica: tu comisión no es un rendimiento de tu aportación. Son cosas completamente separadas. Tu comisión la ganas por tu trabajo comercial y sale del fee de administración; tu aportación es tu patrimonio y no promete nada. Un prospecto que salga pensando "aporto $150 y me pagan 15%" entendió dos cosas distintas como si fueran una, y esa confusión es tuya para prevenir.</p>

<p>Ya sabes qué ganas y qué no puedes prometer. Ahora, lo que va a pasar en la conversación real: las cuatro preguntas que te van a hacer.</p>
      `,
      references: ["Memoria ceduverse-roles-comision (rol comercial PLANO: todos socio_comercial; el nivel es el campo commissionRate por socio, default 15%; NO hay tiers nombrados; director = user_role distinto, no tier de comisión)", "Memoria ceduverse-business-model (regla 2026-07-13: el bono de $500 por referido se paga cuando la EMPRESA referida hace su primera aportación; NO hay bono por referir socios estudiantes; comisiones se pagan del fee de administración, no de la aportación)", "Reglamento Interno Ceduverse DRAFT v0.1 — BORRADOR sin aprobación de Asamblea, sin efectos jurídicos (Art. 14.2: el 5% aplica a consumo Y comisiones por referido, tope 20 certificados; Art. 14.6: parámetros ajustables por Asamblea)", "[PENDIENTE] Operación del bono de $500 en el motor de comisiones: definido como política, no implementado a la fecha — no prometer con fecha (confirmar con David/administración)", "[PENDIENTE] Calendario de dispersión de comisiones: no existe proceso automático; la dispersión es una acción manual de administración. Materiales comerciales muestran fechas de corte contradictorias entre sí — no citar ninguna (confirmar con administración)"],
    },
    {
      title: "Manejo de objeciones: ¿es cripto?, ¿es legal?, ¿es estafa?, ¿por qué anónimo?",
      description: "Las cuatro preguntas que te van a hacer siempre, con la respuesta honesta de cada una. Por qué la objeción de 'pirámide' se responde con la estructura de comisiones y no con indignación, y por qué el anonimato de BrainShield es hacia el público, nunca hacia la autoridad.",
      durationMinutes: 14,
      contentHtml: `
<p>Hay cuatro preguntas que te van a hacer. No algunas veces: siempre. Y la diferencia entre un socio comercial que cierra y uno que se traba no es que el primero tenga respuestas más ingeniosas — es que tiene <strong>respuestas verdaderas y ya preparadas</strong>, dichas sin ponerse a la defensiva.</p>

<p>Porque eso es lo primero que hay que entender sobre una objeción: <strong>no es un ataque, es una petición de información</strong>. Cuando alguien te dice "¿esto no será una estafa?", no te está insultando: te está diciendo que quiere creerte y no tiene con qué. Si te ofendes, confirmaste su sospecha. Si contestas con datos concretos y además reconoces los límites, la desarmaste.</p>

<h3>Objeción 1: "¿Es cripto?"</h3>
<p>La pregunta viene cargada. Quien la hace normalmente quiere decir: <em>¿esto es de esas cosas volátiles donde la gente pierde su dinero?</em></p>

<p>La respuesta honesta empieza con un <strong>no</strong> claro, y sigue con la distinción del Curso 1:</p>

<p><em>"No. Lo que Ceduverse vende son cursos y certificaciones — DC-3, SEP, certificación por experiencias laborales. Se paga en pesos, por transferencia o tarjeta, como cualquier servicio. No hay ninguna moneda volátil de por medio y tu aportación está denominada en pesos."</em></p>

<p><em>"Ahora, sí usamos una pieza de tecnología blockchain, y te explico exactamente cuál, porque es más aburrida de lo que suena: usamos la red Base para anclar un hash —una huella digital— de ciertos documentos y operaciones. Eso se llama atestación. Sirve para que después nadie pueda alterar el registro sin que se note. No es un pago on-chain, no es una inversión en cripto, y no hay especulación: es un sello de integridad."</em></p>

<p>Y aquí, la parte que te da credibilidad instantánea: <em>"Y para que no haya confusión: hay tokens en el diseño del consorcio —CEDU, BRAIN, KAKAW—, pero <strong>ninguno está desplegado</strong>. Son diseño. Hoy lo único que opera es la red Base y el sello por hash. Si alguien te ofrece hoy un token de este consorcio, te está ofreciendo algo que no existe."</em></p>

<p>Fíjate lo que acabas de lograr: no solo contestaste, sino que le diste a tu prospecto una herramienta para detectar a un estafador — incluso a uno que use nuestro nombre.</p>

<h3>Objeción 2: "¿Es legal?"</h3>
<p>Esta es la más fácil, porque la respuesta es verificable y no depende de que te crean:</p>

<p><em>"Sí, y lo puedes comprobar tú mismo. Ceduverse es una sociedad cooperativa de consumo de responsabilidad limitada de capital variable, constituida mediante el <strong>acta 6520 ante la Notaría 110 de Quintana Roo</strong>, e inscrita en el Registro Público de Comercio con el folio <strong>N-2026009627</strong>. Está regulada por la Ley General de Sociedades Cooperativas. No es un proyecto ni una comunidad: es una persona moral con instrumento notarial e inscripción registral."</em></p>

<p>Y ahora la parte que un vendedor promedio se saltaría, y que tú no vas a saltarte: <em>"Lo que sí te tengo que decir es que el <strong>Reglamento Interno</strong> —que es el documento que desarrolla los detalles operativos, como el bono de bienvenida o la política de capitalización— <strong>todavía es un borrador y no ha sido aprobado por la Asamblea General</strong>. O sea: la sociedad existe y es legal; algunas de las reglas operativas que te voy a explicar son propuestas pendientes de aprobarse. Te las digo con esa etiqueta puesta."</em></p>

<p>¿Te das cuenta de la fuerza de esto? Acabas de separar, frente al prospecto, lo que está en firme de lo que está pendiente. Ningún estafador hace eso jamás. Es literalmente lo contrario de lo que hace un estafador.</p>

<h3>Objeción 3: "¿Es estafa? ¿Es una pirámide?"</h3>
<p>La más dura, y la que más gente contesta mal — porque la contestan con emoción (<em>"¡claro que no!"</em>) en vez de con estructura. La indignación no prueba nada. Los datos sí.</p>

<p>Una pirámide tiene una firma inconfundible: <strong>el dinero entra por reclutar gente, no por vender algo real</strong>. Quien está arriba gana porque abajo entra alguien nuevo, y ese alguien nuevo solo gana si mete a otro. Cuando se acaba la gente, se acaba el dinero — y siempre se acaba la gente.</p>

<p>Entonces, contesta con la estructura, punto por punto:</p>

<p><em>"Te lo contesto con cómo está armado el pago, que es donde se ve. <strong>Uno: no hay bono por referir personas.</strong> No gano nada por meter socios estudiantes, ni por cabeza, ni por reclutar. Cero. El bono de $500 está atado a que una <strong>empresa</strong> se vuelva cliente y haga su primera aportación real. O sea: gano cuando alguien <em>compra capacitación de verdad</em>, no cuando alguien <em>se registra</em>."</em></p>

<p><em>"<strong>Dos: mi comisión sale del fee de administración, no de la aportación de la empresa.</strong> El dinero que un socio aporta es su capital, su patrimonio, y no se toca para pagarme."</em></p>

<p><em>"<strong>Tres: la aportación tiene tope.</strong> La capitalización se detiene en 20 certificados, $3,000 pesos. En una pirámide te empujan a meter cada vez más dinero; aquí hay un techo bajo y explícito que te lo impide."</em></p>

<p><em>"<strong>Cuatro: un socio, un voto.</strong> Tengas 1 certificado o 20, tu voto vale igual que el mío y que el del fundador. No hay nadie arriba con más poder por tener más."</em></p>

<p><em>"<strong>Cinco: no hay rendimiento.</strong> Nadie te promete que tu dinero crezca. Si alguien te promete rendimiento, ese alguien está mintiendo — y da igual si dice que es de Ceduverse."</em></p>

<p>Y remata con honestidad, que es lo que sella: <em>"De hecho, el bono de $500 <strong>ni siquiera está operando todavía</strong> en el sistema: está definido como política y su implementación está pendiente. Si esto fuera un esquema para reclutar, lo primero que estaría funcionando sería justo el pago por reclutar. Es lo último que falta."</em></p>

<h3>Objeción 4: "¿Por qué anónimo?"</h3>
<p>Esta aparece cuando explicas la bóveda de PI de BrainShield, y suena mal si no la explicas bien — porque en el imaginario de la gente, "anónimo" y "sospechoso" están pegados.</p>

<p>La respuesta: <em>"El anonimato aquí protege un valor concreto, y tiene una lógica de negocio simple. Si eres el creador de un secreto industrial o de una patente y depositas ese activo, el hecho mismo de que tú seas el dueño puede ser información comercialmente sensible: le dice a tu competencia qué tienes y en qué estás trabajando. Por eso el socio opera con un alias, y la identidad se trata como secreto industrial. No es para esconder al dueño de la ley: es para esconderlo de su competencia."</em></p>

<p>Y ahora el límite, que es la parte que la vuelve creíble: <em>"Y hay que ser muy claro con el alcance, porque 'anónimo' no significa lo que la gente teme. <strong>El anonimato es hacia el público, no hacia la autoridad ni hacia la propia estructura.</strong> Hay KYC: la identidad se conoce, se verifica y se documenta internamente. Lo que no se hace es publicarla. Y en la cadena no se escribe un solo dato personal: on-chain solo viaja un hash, una huella. Eso no es ocultamiento — es privacidad por diseño, que es exactamente lo contrario."</em></p>

<p>Un anonimato que se cae ante la autoridad no es opacidad: es discreción comercial. Di la diferencia en voz alta, porque es la diferencia entre un modelo serio y uno turbio.</p>

<h3>El principio detrás de las cuatro</h3>
<p>Si te fijas, las cuatro respuestas tienen la misma arquitectura: <strong>un dato verificable, seguido de un límite reconocido</strong>. Acta y folio, pero el Reglamento es borrador. Base y SHA-256 operan, pero los tokens son diseño. La estructura de comisiones no paga por reclutar, y además ese bono todavía no opera. Hay privacidad, pero también hay KYC.</p>

<p>Ese patrón no es un truco retórico: es lo que pasa cuando dices la verdad completa. Y resulta que la verdad completa, dicha con orden, vende mejor que la promesa — porque la promesa la puede hacer cualquiera, y la verdad verificable, no.</p>

<h3>Los tres avisos</h3>
<p><strong>Nada de esto es una oferta de valores. Nada de esto es asesoría de inversión. No hay rendimientos garantizados.</strong> Y en el manejo de objeciones esto tiene una aplicación directa: si un prospecto insiste en que le confirmes un retorno —"pero dime cuánto voy a ganar"—, la respuesta no es un número más bajo ni una estimación prudente. La respuesta es que <strong>este modelo no promete retornos, y si eso es lo que busca, esto no es para él</strong>. Perder esa venta es ganar: el prospecto que compra creyendo que le prometiste un rendimiento es un reclamo con fecha diferida.</p>
      `,
      references: ["Acta constitutiva 6520, Notaría 110 QR, RPC N-2026009627 — VIGENTE", "LGSC (1 socio = 1 voto; régimen de sociedades cooperativas)", "Memoria brainshield-rwa-pivot (bóveda de PI, alias, anonimato como secreto industrial; tokens CEDU/BRAIN/KAKAW: diseño, no desplegados; solo Base + SHA-256 operan)", "Memoria ceduverse-business-model (el $500 se paga sobre la primera aportación de la EMPRESA referida; NO hay bono por referir estudiantes; comisiones del fee de administración)", "Reglamento Interno Ceduverse DRAFT v0.1 — BORRADOR sin aprobación de Asamblea, sin efectos jurídicos", "[PENDIENTE] Operación del bono de $500 en el motor de comisiones: definido como política, no implementado a la fecha"],
    },
    {
      title: "El modelo cooperativo desde la venta: tu rol y tu límite",
      description: "Cómo explicar la aportación capitalizada y la copropiedad sin convertirlas en una promesa de inversión. Por qué 1 socio = 1 voto es tu mejor argumento y tu mejor límite, qué te distingue de un vendedor externo, y cómo se dice la verdad completa sobre el reembolso.",
      durationMinutes: 13,
      contentHtml: `
<p>Ya sabes qué vendes, qué ganas y cómo contestar las cuatro preguntas. Este módulo cambia el ángulo: mira el modelo cooperativo <strong>desde la silla del que vende</strong>. No para repetir los Cursos 4 y 5 —eso ya lo dominas— sino para responder algo que ninguno de los dos contestó: <strong>¿qué eres tú dentro de esta estructura, y qué te impide hacer?</strong></p>

<h3>No eres un vendedor externo. Eres un socio.</h3>
<p>Empecemos por lo que hace a este rol distinto de cualquier otro trabajo comercial que hayas tenido.</p>

<p>Un vendedor de una empresa normal está fuera del producto: la empresa es de otros, él cobra por colocar, y su relación con el comprador termina en la firma. Tú no. <strong>Tú eres socio cooperativista de la misma sociedad a la que estás invitando a entrar.</strong> Tienes tu certificado de $150 a tu nombre, en el mismo Libro de Registro donde va a quedar el de la persona que estás convenciendo. Tienes un voto en la misma Asamblea donde ella va a tener el suyo — y valen exactamente lo mismo.</p>

<p>Esto no es una frase bonita de reclutamiento: tiene una consecuencia práctica incómoda. <strong>La persona a la que le exageras hoy va a estar sentada contigo en la Asamblea mañana.</strong> No es un cliente que se va: es un copropietario que se queda, con voz, con voto y con memoria. En una empresa tradicional, un vendedor que promete de más le crea un problema a la empresa. En una cooperativa, se lo crea <em>a sus propios socios</em>, y él es uno de ellos.</p>

<p>Esa es, en el fondo, la razón por la que este curso insiste tanto en la honestidad. No es moralismo. Es que en esta estructura, la exageración te alcanza.</p>

<h3>1 socio = 1 voto: tu mejor argumento y tu mejor límite</h3>
<p>De todo lo que puedes decir, esta es la frase más poderosa que tienes — y la más peligrosa si la usas mal.</p>

<p>Como argumento es imbatible: <em>"Aquí no puedes comprar poder. Tengas 1 certificado o 20, tengas $150 o $3,000, tu voto es uno. El mío también. El del fundador también. Es una sociedad de personas, no de capitales — y eso está en la ley y en el acta, no en un discurso."</em> Ese es el rasgo que separa a una cooperativa de todo lo demás que tu prospecto ha visto, y no hay letra chica que lo desmienta.</p>

<p>Pero ahora míralo como límite, porque es igual de importante: <strong>si nadie puede comprar más poder, entonces acumular certificados no te da nada extra</strong>. No más voto, no más influencia, no más retorno. Y de ahí se sigue algo que debes decir sin que te lo pregunten: <em>no tiene ningún sentido tratar de "meter más dinero" a esta cooperativa</em>. No hay a qué. El modelo no lo premia y el tope lo impide.</p>

<p>Si alguna vez te sorprendes usando el uno-socio-un-voto para vender y al mismo tiempo insinuando que conviene acumular, detente: te estás contradiciendo en la misma frase.</p>

<h3>La aportación capitalizada, dicha sin mentir</h3>
<p>El 5% es el punto donde más fácil se resbala un socio comercial, porque es el que más se <em>parece</em> a un rendimiento sin serlo.</p>

<p>La forma correcta de decirlo: <em>"Cuando pagas por un servicio de Ceduverse, el proyecto contempla que el 5% de <strong>tu propio pago</strong> se reasigne a <strong>tu propia cuenta de capital</strong>, en certificados de $150. En la certificación RVOE Academy de $49,900, ese 5% son <strong>$2,495</strong> — unos 16 certificados. El resto es ingreso por servicio, con su factura. No es un regalo de la cooperativa, no es un subsidio, no es un interés: es tu dinero cambiando de casilla, de pago a patrimonio tuyo."</em></p>

<p>Y de inmediato, sin que te lo pidan, las dos etiquetas:</p>

<p><em>"Tiene <strong>tope: 20 certificados, $3,000</strong>. Con poco más de una compra del producto ancla ya estás en el techo. Esto no es un vehículo para acumular capital y no está diseñado para serlo."</em></p>

<p><em>"Y su estatus: el 5% y el tope viven en el <strong>Reglamento Interno, que es un borrador no aprobado por la Asamblea</strong>. El propio borrador dice que son parámetros ajustables por acuerdo de la Asamblea General. Te lo explico porque así está diseñado, no porque sea una regla en vigor que yo te pueda garantizar."</em></p>

<p>La prueba de que lo estás diciendo bien es simple. Si tu prospecto sale de la conversación diciendo <em>"me dan 5% de rendimiento"</em>, fallaste — dijiste palabras correctas y transmitiste algo falso. Si sale diciendo <em>"una parte de lo que yo pague se vuelve capital mío, hasta un tope de $3,000, y eso todavía lo tiene que aprobar la Asamblea"</em>, lo hiciste perfecto.</p>

<h3>La copropiedad: potente y acotada</h3>
<p>"Eres copropietario" es verdad y es fuerte. Pero dilo con su tamaño real, porque un prospecto que escucha "copropietario" puede imaginar cualquier cosa.</p>

<p>El tamaño real es este: la cooperativa arrancó con <strong>5 socios fundadores y 100 certificados de $150</strong>, o sea $15,000 pesos de capital fundacional. Tu certificado de $150 es una participación pequeña y sana en una sociedad pensada para que quepa mucha gente con poco. <strong>Copropietario no significa dueño de una parte grande de algo grande.</strong> Significa que no eres cliente: eres parte, con tu voto entero y tu patrimonio acotado.</p>

<p>Dicho así, no defrauda a nadie. Dicho a medias, crea una expectativa que la primera Asamblea va a desinflar.</p>

<h3>El reembolso: la verdad completa, siempre</h3>
<p>Y llegamos a la frase más peligrosa de todo el repertorio comercial, la que suena inofensiva y no lo es: <strong>"si no te gusta, te devuelven tu dinero."</strong></p>

<p>No la digas. Nunca. Es falsa en dos dimensiones a la vez.</p>

<p><strong>Falsa en el tiempo:</strong> el retiro no surte efectos hasta el <strong>fin del ejercicio anual</strong> — o hasta el fin del ejercicio <em>siguiente</em>, si se notifica después del último trimestre. Entre que alguien avisa y se le devuelve pueden pasar meses, y en el peor caso cerca de dos años. No hay botón de retirar.</p>

<p><strong>Falsa en el monto:</strong> el importe <strong>no está garantizado a ser igual a lo aportado</strong>. La devolución se practica al cierre del ejercicio, con orden de prelación y a prorrata, y se calcula sobre el valor de los certificados <strong>deducidas las pérdidas que proporcionalmente correspondan</strong>. Si la cooperativa tuvo pérdidas, el reembolso las absorbe en su proporción. Además hay puntos que <strong>siguen pendientes de definirse</strong>, como a qué valor se reembolsan los certificados capitalizados.</p>

<p>La versión honesta, que sí puedes usar: <em>"Tu aportación es tuya y es reembolsable — con procedimiento, con calendario y sin garantía de monto. No es una cuenta de ahorro ni un depósito. Es capital de una sociedad real, acotado a $150 por certificado, con responsabilidad limitada a ese importe. Si la cooperativa tiene pérdidas, tu reembolso las absorbe en tu parte."</em></p>

<p>¿Vende menos? Sí. ¿Sabes qué vende todavía menos? Un socio que se sintió engañado explicándole a otros doce por qué lo estafaste. La versión completa es más barata que el reclamo.</p>

<h3>Los tres avisos</h3>
<p><strong>Nada de esto es una oferta de valores</strong>: el certificado no es una acción, no se coloca en mercado, no hay secundario. <strong>Nada de esto es asesoría de inversión</strong>: tu trabajo es explicar una estructura, no recomendarle a nadie qué hacer con su patrimonio — y si te piden ese consejo, la respuesta correcta es que consulten a su propio asesor. <strong>No hay rendimientos garantizados</strong>: ni la aportación, ni la capitalización, ni la copropiedad prometen retorno alguno.</p>

<p>Ya sabes qué eres dentro de la estructura. Falta el módulo que más te va a proteger: la lista exacta de lo que no puedes decir, y el guion honesto de cada caso.</p>
      `,
      references: ["Acta constitutiva 6520, Notaría 110 QR, RPC N-2026009627 (5 socios fundadores, 100 certificados de $150; retiro efectivo al fin del ejercicio anual o del siguiente)", "LGSC art. 52 (devolución al cierre del ejercicio, prelación y prorrata, deducción de pérdidas proporcionales)", "Reglamento Interno Ceduverse DRAFT v0.1 — BORRADOR sin aprobación de Asamblea, sin efectos jurídicos (Art. 14: capitalización 5%, tope 20 certificados $3,000, ejemplo RVOE $49,900 → $2,495; Art. 14.6: parámetros ajustables por Asamblea; valor de reembolso de certificados capitalizados marcado [PENDIENTE])", "Memoria ceduverse-estructura-legal (1 socio = 1 voto; cooperativa de consumo)"],
    },
    {
      title: "Guardrails de venta: lo que NO puedes decir (y el guion honesto de cada caso)",
      description: "Las seis frases prohibidas con su reemplazo exacto: rendimientos, la aportación como inversión, política propuesta presentada como vigente, el canal de token como disponible, el $500 y las fechas de pago, y el certificado como algo vendible. Los tres disclaimers y el cierre del arco comercial.",
      durationMinutes: 14,
      contentHtml: `
<p>Último módulo del Curso 6, del arco comercial y de Academia RWA. Y es, sin discusión, el más importante de los tres cursos comerciales — porque todo lo demás te ayuda a vender, y este te impide destruir lo que vendiste.</p>

<p>Vamos a ser muy concretos. Nada de "sé prudente" ni "usa tu criterio." Aquí tienes <strong>seis frases que no puedes decir</strong>, y al lado de cada una, <strong>la frase exacta que la reemplaza</strong>. Apréndete los reemplazos, no las prohibiciones: en una conversación real no basta con saber que algo no se dice — necesitas tener listo qué <em>sí</em> se dice, o vas a improvisar, y la improvisación es donde nacen las promesas.</p>

<h3>1. NO prometer rendimientos</h3>
<p><strong>Prohibido:</strong> "tu aportación crece," "te da un 5%," "vas a recuperar más de lo que metiste," "es un buen retorno."</p>

<p><strong>Guion honesto:</strong> <em>"Aquí no hay rendimiento y no te lo voy a prometer. Lo que hay es distinto: una fracción de tu propio pago se reasigna a tu propio capital, con un tope de $3,000. Eso no es un rendimiento — es tu dinero cambiando de casilla. La cooperativa no te promete que tu certificado valga más mañana, y de hecho, si hubiera pérdidas, tu reembolso las absorbe en tu parte."</em></p>

<p>La trampa: el 5% <em>suena</em> a rendimiento. Si lo dices sin la aclaración, tu prospecto va a hacer la traducción solo, en su cabeza, y va a salir creyendo algo que tú nunca dijiste pero permitiste. <strong>El silencio también promete.</strong></p>

<h3>2. NO vender la aportación como inversión</h3>
<p><strong>Prohibido:</strong> "invierte $150," "es una inversión segura," "estás invirtiendo en el futuro de la cooperativa," "mete lo que puedas."</p>

<p><strong>Guion honesto:</strong> <em>"No estás invirtiendo: estás fundando tu patrimonio dentro de una sociedad de la que te vuelves copropietario. Es capital, no inversión. Y no hay nada que 'meter': la aportación es de $150, el tope de la capitalización es de $3,000, y no hay ningún beneficio en acumular más — porque tu voto es uno pase lo que pase."</em></p>

<p>La trampa está en la palabra "segura," que a veces sale sola por cortesía. <strong>Un certificado de aportación es capital de riesgo de una sociedad real</strong> — acotado y con responsabilidad limitada a $150 por certificado, sí, pero capital de riesgo. "Inversión segura" son dos palabras y las dos están mal.</p>

<h3>3. NO presentar política propuesta como si estuviera vigente</h3>
<p><strong>Prohibido:</strong> "el reglamento dice que...", "te corresponden $170," "la cooperativa te da el bono," "la regla es 5% con tope de 20."</p>

<p><strong>Guion honesto:</strong> <em>"Así está diseñado: un bono de $170, $150 que fundan tu primer certificado y $20 de crédito para tu primer DC-3 o SEP; y una capitalización del 5% con tope de 20 certificados. Ahora, el estatus, que te lo debo decir: todo eso vive en el <strong>Reglamento Interno, que hoy es un borrador y no ha sido aprobado por la Asamblea General</strong> — no está vigente ni surte efectos jurídicos. El propio borrador dice que esos montos son parámetros ajustables por la Asamblea. Te lo explico como diseño, no como algo que yo te pueda garantizar."</em></p>

<p>Esta es la que más se rompe, porque las cifras son atractivas y la etiqueta es fea. Pero mide la consecuencia: si prometes $170 como derecho adquirido y la Asamblea ajusta el parámetro, hay una persona real con un reclamo real — y tu nombre está en él. <strong>La etiqueta cuesta cuatro segundos. El reclamo cuesta años.</strong></p>

<h3>4. NO ofrecer el canal de token como si estuviera disponible</h3>
<p><strong>Prohibido:</strong> "te pagamos el bono con CEDU," "el token respalda tu aportación," "ya puedes recibir tu NFT," "KakawChain lo garantiza."</p>

<p><strong>Guion honesto:</strong> <em>"Ese canal no está disponible hoy, y quiero ser exacto. <strong>Ningún token del consorcio está desplegado</strong>: CEDU, BRAIN y KAKAW son diseño. KakawChain y KakawCoin no existen como producto. Además, la vía del token exige constituir antes una <strong>reserva 1:1</strong> —un peso real guardado por cada peso de token— y esa reserva no existe todavía; sin ella el canal no se activa, por diseño. Y para cerrarlo bien: la billetera del proyecto de Ceduverse ni siquiera está constituida. Lo único que opera hoy es la red Base y el sello por hash SHA-256."</em></p>

<p>Aquí no hay zona gris posible. Ofrecer hoy el canal de token no es exagerar: es <strong>describir algo que no existe</strong>. Y recuerda por qué la reserva 1:1 es innegociable, que ya lo trabajaste en el Curso 4: un token sin respaldo sería <strong>capital simulado</strong>, y acreditar aportaciones contra él inflaría el capital social sin que entrara un peso. La regla no es burocracia — es lo que impide que el modelo sea exactamente el fraude del que quiere distinguirse.</p>

<p>Lo mismo con el <strong>NFT del certificado: no está acuñado</strong>. Es diseño. Nadie puede tenerlo hoy.</p>

<h3>5. NO prometer el $500 ni una fecha de pago</h3>
<p><strong>Prohibido:</strong> "te pagan $500 por cada referido," "cobras el día 20," "cobras el día 25," "la comisión cae automático," "es vitalicio," "con cuatro empresas subes a 30%."</p>

<p><strong>Guion honesto:</strong> <em>"Te digo lo que está definido y lo que está pendiente, por separado. <strong>Definido:</strong> la comisión base de agente es <strong>15%</strong>, calculada sobre el fee de administración —nunca sobre la aportación—, y hay un bono de <strong>$500</strong> atado a que una <strong>empresa</strong> referida haga su <strong>primera aportación</strong>; no hay bono por referir estudiantes. <strong>Pendiente:</strong> el bono de $500 todavía no opera en el motor de comisiones, y no existe una fecha automática de dispersión — las comisiones las genera y las paga la administración por periodo mensual, de forma manual. Así que no te voy a dar una fecha ni un monto: eso lo confirmas con administración."</em></p>

<p>Y el aviso extra, el que te va a salvar: si viste en materiales públicos una <strong>tabla de rangos con escalones, override, "vitalicio" y proyecciones de ingreso mensual</strong>, no la repitas. <strong>Esa estructura no existe en el sistema.</strong> El rol es plano: todos los agentes son socio comercial, y el "nivel" es simplemente un campo de comisión con valor base de 15%. Director es un <strong>rol distinto</strong> de la estructura, no un peldaño que se alcanza vendiendo. Y una proyección de ingreso mensual, dicha en una conversación de reclutamiento, funciona igual que una promesa de rendimiento.</p>

<h3>6. NO presentar el certificado o el NFT como algo vendible</h3>
<p><strong>Prohibido:</strong> "lo puedes vender después," "se va a apreciar," "lo listas en un exchange," "es tu entrada al mercado secundario."</p>

<p><strong>Guion honesto:</strong> <em>"No hay mercado secundario. No hay exchange, no hay cotización, no hay comprador esperando. El certificado vale $150 de valor nominal el día uno y $150 de valor nominal tres años después. Su transmisión está restringida y el procedimiento vive en el Reglamento, que sigue en borrador. Y el gemelo digital, cuando exista, <strong>documenta</strong> una transmisión: no la ejecuta. Ningún movimiento de un NFT transmite un certificado, jamás."</em></p>

<h3>Los tres avisos obligatorios, completos</h3>
<p>Estos tres no son decoración legal ni letra chica: son la descripción exacta de lo que este modelo es. Dilos en toda conversación patrimonial, sin que te los pidan.</p>

<p><strong>Esto NO es una oferta de valores.</strong> Un certificado de aportación cooperativa no es una acción, ni un bono, ni un instrumento financiero colocable en un mercado, ni está registrado ante ninguna autoridad bursátil — porque no lo es ni pretende serlo. Su gemelo registral tampoco.</p>

<p><strong>Esto NO es asesoría de inversión.</strong> Nada de lo que explicas es una recomendación sobre el patrimonio de nadie. Si un prospecto tiene dudas sobre su situación patrimonial o fiscal, la respuesta correcta —siempre— es que consulte a su propio asesor. Y si te preguntan por el tratamiento fiscal fino, como el IVA de los $20 del bono o la base gravable del split del 5%, <strong>esos puntos están pendientes de confirmar con el área fiscal</strong>: no los adivines. Un número fiscal inventado en una charla comercial reaparece meses después, en una revisión, y ya no lo puedes retirar.</p>

<p><strong>NO hay rendimientos garantizados.</strong> Ni un porcentaje, ni una fecha, ni una promesa. Ni el certificado, ni la capitalización, ni el bono, ni el gemelo digital prometen retorno alguno.</p>

<h3>La prueba que resume el curso</h3>
<p>Si alguna vez dudas de si puedes decir algo, aplícale esta prueba de tres preguntas: <strong>¿es verificable hoy? ¿estoy separando lo que está en firme de lo que está propuesto? ¿esta persona podría sentirse engañada en seis meses?</strong></p>

<p>Si la respuesta a la tercera es "quizá," no lo digas. Da igual lo bien que suene y lo cerca que estés de cerrar.</p>

<p>Y quédate con lo que has visto en los tres cursos comerciales: <strong>ninguno de los límites que aprendiste te quita argumentos — todos te los dan</strong>. El tope de $3,000 prueba que esto no es un esquema de captación. El uno-socio-un-voto prueba que el poder no se compra. La reserva 1:1 obligatoria prueba que no se fabrica capital. La ausencia de bono por reclutar prueba que no es pirámide. Decir que el Reglamento es borrador prueba que no te están vendiendo humo. <strong>La honestidad aquí no es el precio de vender: es el producto.</strong></p>

<h3>Cierre del arco</h3>
<p>Mira el camino completo. El <strong>Curso 4</strong> te dio el mecanismo: la aportación como patrimonio, el bono de $170 desarmado, el origen externo obligatorio, la reserva 1:1. El <strong>Curso 5</strong> te dio el instrumento: el certificado de $150, el gemelo registral que espeja el Libro y no lo sustituye, un socio un voto, el 5% con su tope, la salida con su verdad incómoda. El <strong>Curso 6</strong> te dio la conversación: el pitch, los números reales, las objeciones y —lo más valioso— la lista de lo que no puedes decir.</p>

<p>Eso es todo lo que necesitas para representar a Ceduverse sin exponerte y sin exponer a la cooperativa. No porque ya sepas venderlo, sino porque ya sabes <strong>dónde están los bordes</strong> — y esa es la única competencia que no se puede improvisar frente a un prospecto.</p>

<h3>Tu siguiente paso</h3>
<p><strong>Agenda tu sesión de onboarding comercial</strong> con tu director o con administración, y llévale a esa sesión dos cosas concretas: tu <strong>porcentaje de comisión real</strong>, confirmado en tu panel —no el que leíste en una tabla—, y tus dudas sobre el <strong>calendario de dispersión</strong>, que tienes que confirmar con administración y no suponer.</p>

<p>Y antes de tu primera conversación con un prospecto, haz este ejercicio: <strong>di en voz alta las tres cosas que no existen todavía</strong> — ningún token está desplegado, el NFT no está acuñado, el Reglamento es borrador. Si puedes decirlas con naturalidad, sin que te tiemble la voz y sin sentir que estás debilitando tu pitch, estás listo. Si todavía te incomodan, repásalas hasta que no. <strong>Esa comodidad con la verdad incompleta del proyecto es, literalmente, tu producto.</strong></p>
      `,
      references: ["Reglamento Interno Ceduverse DRAFT v0.1 — BORRADOR sin aprobación de Asamblea, sin efectos jurídicos (Art. 19 vigencia; Art. 20 cláusula de borrador; Arts. 14 y 14 Bis: 5%, tope 20 certificados, bono $170, parámetros ajustables por Asamblea)", "Memoria brainshield-rwa-pivot (CEDU/BRAIN/KAKAW: diseño, ninguno desplegado; KakawChain/KakawCoin no existen; solo Base + SHA-256 operan)", "Memoria ceduverse-roles-comision (rol comercial PLANO, commissionRate default 15%, sin tiers nombrados; director = user_role distinto)", "Memoria ceduverse-business-model ($500 sobre la primera aportación de la EMPRESA referida; sin bono por referir estudiantes; comisiones del fee de administración)", "LGSC art. 52 y acta constitutiva 6520 (reembolso al cierre del ejercicio, sin garantía de monto, deducidas pérdidas proporcionales)", "[PENDIENTE] Tratamiento fiscal del $20 del bono y base gravable del split del 5% — confirmar con Daniel/fiscal", "[PENDIENTE] Bono de $500 no implementado en el motor de comisiones; sin calendario automático de dispersión; materiales comerciales públicos muestran una tabla de rangos/override/vitalicio y fechas de corte que el sistema no implementa — confirmar con David/administración"],
    },
  ],

};
