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

<p>Esta manera de pensar —empezar siempre por el activo real y tratar lo digital como una herramienta al servicio de ese activo, nunca como un reemplazo— es exactamente el criterio que vas a encontrar aplicado en cada uno de los siguientes módulos. En el módulo 2 vamos a hablar del problema real que resuelven los RWA legítimos: la iliquidez, la opacidad y la falta de procedencia que han afectado por décadas a activos como los inmuebles. En el módulo 3 vamos a conocer el marco de las <strong>4 patas</strong> que BrainShield exige para considerar que un RWA es defendible. En el módulo 4 entraremos, sin miedo y sin tecnicismos innecesarios, al tema de la atestación on-chain y al token BRAIN. Y en el módulo 5 cerraremos viendo cómo todo esto se conecta en un solo ecosistema.</p>

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

<p>En el siguiente módulo vamos a hablar de cómo, una vez que las cuatro patas están firmes en el mundo off-chain, BrainShield usa la tecnología blockchain —específicamente la red Base— no para reemplazar nada de esto, sino para sellarlo de forma pública e inalterable. Vamos a hablar de atestación, no de tokenización especulativa, y del token BRAIN, diseñado deliberadamente para no tener volatilidad.</p>
      `,
      references: ["Pivote RWA BrainShield 2026-07-14"],
    },
    {
      title: "On-chain sin miedo: atestación vs. tokenización",
      description: "Qué es Base, qué es anclar un hash (atestación, no pago on-chain), el token BRAIN 1:1 USDC/USDT, y por qué KakawChain aún no existe como producto.",
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

<h3>El token BRAIN: estable a propósito</h3>
<p>Ahora hablemos del <strong>token BRAIN</strong>. Si alguna vez has escuchado sobre criptomonedas, probablemente asocias la palabra "token" con volatilidad — gráficas que suben y bajan de forma dramática en cuestión de horas. BRAIN fue diseñado deliberadamente para ser lo opuesto a eso: es un token <strong>pegado 1:1 a USDC o USDT</strong>, dos de las llamadas "stablecoins" (monedas estables) más utilizadas y auditadas del mercado, cuyo valor está a su vez respaldado uno a uno por dólares estadounidenses en reservas verificables.</p>

<p>¿Qué significa esto en la práctica? Que un BRAIN vale, en todo momento, aproximadamente un dólar — ni más, ni menos, sin las subidas ni caídas especulativas que caracterizan a criptomonedas como Bitcoin o Ethereum. La razón de este diseño es simple: BrainShield no busca que participes en un casino de precios. Busca darte un instrumento de valor estable, útil para representar y mover el valor de activos reales estructurados, sin añadir una capa extra de riesgo especulativo encima del riesgo (ya de por sí gestionado con las 4 patas del módulo anterior) del activo subyacente.</p>

<p>Dicho de otra forma: la incertidumbre que existe en cualquier inversión debe venir del activo real —¿se rentará el departamento?, ¿se venderá la patente bajo licencia?— y no de la volatilidad artificial de un token especulativo. BRAIN elimina esa segunda capa de riesgo innecesaria.</p>

<h3>Una aclaración importante: KakawChain y KakawCoin</h3>
<p>Es posible que en algún momento hayas escuchado o escuches en el futuro sobre <strong>KakawChain</strong> o <strong>KakawCoin</strong>, otros proyectos dentro del consorcio al que pertenece BrainShield. Queremos ser completamente transparentes contigo: a la fecha de este curso, <strong>KakawChain y KakawCoin todavía no existen como producto</strong>. Son parte de una visión de largo plazo, pero no son parte de la operación actual de atestación de RWA ni del token BRAIN. Todo lo que hemos descrito en este módulo —Base como red, el hash SHA-256 como mecanismo de atestación, y BRAIN como token 1:1 a USDC/USDT— es lo que existe y opera hoy. Cualquier mención de KakawChain o KakawCoin como si ya estuvieran integrados a la operación de RWA sería, sencillamente, inexacta, y no representa el estado actual del proyecto.</p>

<p>Esta honestidad sobre lo que existe y lo que todavía no existe es, en sí misma, una aplicación directa de todo lo que hemos hablado en este curso: la sustancia siempre antes que la promesa.</p>

<h3>Cerrando el círculo</h3>
<p>Con esto ya tienes el panorama completo de cómo BrainShield conecta lo real con lo digital: un activo pasa primero por las 4 patas —valuación, título, flujo, procedencia— en el mundo off-chain. Una vez verificado, los documentos clave de ese proceso se sellan mediante atestación —un hash inalterable— en la red Base. Y cuando hace falta representar valor de forma estable dentro del ecosistema, se usa el token BRAIN, anclado 1:1 a stablecoins, sin volatilidad especulativa. Nada de esto sustituye al sistema legal y financiero mexicano — todo lo complementa, añadiendo una capa de transparencia e integridad verificable que antes no existía con esta facilidad.</p>

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
<p>Has completado el Curso 1 de Academia RWA. Ya sabes qué es un Real World Asset, qué problema resuelve frente a la iliquidez, la opacidad y la falta de procedencia de los activos tradicionales, cómo se verifica con las 4 patas de BrainShield, y cómo se sella su integridad mediante atestación en Base y el token BRAIN, sin caer nunca en la especulación innecesaria. Tienes ahora el criterio para distinguir un RWA legítimo de uno que solo finge serlo — y ese criterio te va a servir mucho más allá de este curso, en cualquier oportunidad de inversión que se te presente en el futuro.</p>

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
<p>Aquí llega uno de los elementos distintivos de BrainShield. Dentro del sistema, tu identidad no aparece con tu nombre real de forma pública: se te asigna un <strong>alias</strong> —algo como "vault_sol_42k" o "vault_beta_18p"— que es el nombre bajo el cual tu activo se administra, se valúa y, si corresponde, se licencia. BrainShield sí conoce tu identidad real, porque la ley exige procesos de identificación de las partes en cualquier operación formal — pero esa identidad no se expone innecesariamente frente a terceros, otros usuarios, ni al público en general. El alias es la capa que separa "quién eres" de "qué activo administras," para que puedas participar en el ecosistema sin que tu nombre quede ligado públicamente a tu propiedad intelectual.</p>

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
      description: "BRAIN, un token pegado 1:1 a USDC/USDT. Atestación vs. tokenización, por qué se eligió estabilidad sobre especulación, y por qué KakawChain aún no existe.",
      durationMinutes: 11,
      contentHtml: `
<p>Llegamos a un tema que suele generar más dudas de las necesarias: los tokens. En este módulo vamos a hablar específicamente del <strong>token BRAIN</strong>, qué es, qué no es, y por qué su diseño es deliberadamente aburrido —en el buen sentido— comparado con lo que normalmente se asocia a las criptomonedas.</p>

<h3>Qué es BRAIN y qué no es</h3>
<p>BRAIN es un token de valor pensado para representar y mover, dentro del ecosistema de BrainShield, el valor de operaciones ya verificadas: el pago de una regalía, la liquidación de un avalúo, o cualquier otro movimiento de valor asociado a un activo que ya pasó por el proceso de originación que conoces de los módulos anteriores. Está diseñado con una característica central: está <strong>pegado 1:1 a USDC o USDT</strong>, dos de las llamadas "stablecoins" (monedas estables) más utilizadas del mercado cripto, cuyo valor a su vez está respaldado uno a uno por dólares estadounidenses.</p>

<p>Esto significa que un BRAIN vale, en todo momento, aproximadamente un dólar — sin las subidas y caídas dramáticas que caracterizan a criptomonedas como Bitcoin o Ethereum. BRAIN no es, y no pretende ser, un instrumento especulativo.</p>

<h3>Atestación vs. tokenización: dos cosas distintas que conviene no confundir</h3>
<p>Es muy importante que no mezcles dos conceptos que suenan parecido pero son operaciones distintas. La <strong>atestación</strong>, que viste en el módulo anterior, es anclar el hash de un documento en Base como prueba de integridad: no mueve valor, solo prueba que algo existió sin ser alterado. La <strong>tokenización</strong>, en cambio, es representar valor económico —como el derecho a una regalía futura— de forma digital y transferible. BrainShield hoy aplica la atestación de forma completa y en producción; la tokenización más ambiciosa —por ejemplo, convertir la corriente completa de regalías de un activo en un token negociable— es un terreno mucho más delicado, porque tocar un flujo de ingresos futuros de esa manera puede acercarse a lo que la regulación financiera considera un instrumento de inversión, con las obligaciones legales que eso conlleva. Por eso BrainShield avanza aquí con cautela, paso a paso, y no promete lo que todavía no ha construido ni validado legalmente.</p>

<h3>Por qué elegimos estabilidad en vez de especulación</h3>
<p>La razón detrás de anclar BRAIN a stablecoins en vez de dejarlo flotar libremente es sencilla: la incertidumbre de cualquier participación en el ecosistema debe venir del activo real —¿se licenciará la patente?, ¿se rentará el inmueble?— y no de una segunda capa de riesgo artificial causada por la volatilidad de un token especulativo. Si además de preguntarte si tu propiedad intelectual encontrará quién la licencie tuvieras que preocuparte de que el valor de tu regalía suba o baje de forma dramática en una semana por movimientos del mercado cripto, estaríamos añadiendo un riesgo innecesario encima de un riesgo que ya existe de forma natural. BRAIN elimina esa capa extra.</p>

<h3>Una aclaración honesta: KakawChain y KakawCoin</h3>
<p>Es posible que en algún momento escuches hablar de <strong>KakawChain</strong> o <strong>KakawCoin</strong>, otros proyectos dentro del mismo consorcio al que pertenece BrainShield. Queremos ser completamente transparentes: a la fecha de este curso, <strong>KakawChain y KakawCoin todavía no existen como producto</strong>. Son parte de una visión de largo plazo del consorcio, pero no forman parte de la operación actual de BrainShield ni del token BRAIN. Todo lo que describimos en este módulo —Base como red de atestación y BRAIN como token 1:1 a USDC/USDT— es lo que existe y opera hoy. Cualquier mención de KakawChain o KakawCoin como si ya estuvieran integrados sería, sencillamente, inexacta.</p>

<p>Con esto ya conoces las tres piezas técnicas centrales de BrainShield: la bóveda de PI con su alias y su modelo 80/20, la valuación independiente sellada por atestación en Base, y el token BRAIN, estable por diseño. En el último módulo vamos a ver cómo todo esto se conecta en un solo ecosistema, junto con el marketplace de RWA y CryptoVault.</p>
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

};
