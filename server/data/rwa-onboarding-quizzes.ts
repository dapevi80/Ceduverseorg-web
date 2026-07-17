// ═══════════════════════════════════════════════════════════
// ACADEMIA RWA — Quizzes de onboarding
// ═══════════════════════════════════════════════════════════

interface RwaQuiz {
  title: string;
  passingScore: number;
  questions: Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>;
}

export const rwaOnboardingQuizzes: Record<string, RwaQuiz> = {

  "que-es-un-rwa": {
    title: "Evaluación: ¿Qué es un RWA?",
    passingScore: 70,
    questions: [
      {
        question: "¿Qué es un Real World Asset (RWA)?",
        options: [
          "Una criptomoneda sin respaldo",
          "Un activo del mundo real (inmueble, oro, PI) representado on-chain",
          "Un videojuego con NFTs",
          "Una acción de bolsa tradicional",
        ],
        correctIndex: 1,
        explanation: "Un RWA es un activo real —inmueble, oro, propiedad intelectual— cuyo valor vive en el mundo físico/legal y se representa digitalmente on-chain.",
      },
      {
        question: "¿Cuáles son las 4 patas de un RWA legítimo según BrainShield?",
        options: [
          "Marketing, token, comunidad y hype",
          "Valuación independiente, título legal, flujo de efectivo y procedencia",
          "Compra, venta, renta y reventa",
          "Bitcoin, Ethereum, Base y Solana",
        ],
        correctIndex: 1,
        explanation: "Las 4 patas son: valuación independiente (corredor NIF C-8, 0% margen), título legal (activo enajenable), flujo de efectivo (rentas/regalías) y procedencia/sustancia (hash, CFDIs, KYC).",
      },
      {
        question: "En BrainShield, la atestación on-chain significa:",
        options: [
          "Que el pago se hace con criptomonedas",
          "Que se ancla un hash (huella) del dictamen/pago en la red Base, sin ser pago on-chain",
          "Que el activo se vende en una subasta",
          "Que se emite una acción bursátil",
        ],
        correctIndex: 1,
        explanation: "La atestación ancla un hash inalterable en Base como prueba de integridad. El pago sigue siendo fiat/SPEI; no es un pago on-chain.",
      },
      {
        question: "El token CEDU de Ceduverse está diseñado para:",
        options: [
          "Especular con alta volatilidad",
          "Estar pegado 1:1 al peso mexicano (MXN) — un diseño, aún no desplegado",
          "Reemplazar al peso mexicano",
          "Pagar comisiones de Bitcoin",
        ],
        correctIndex: 1,
        explanation: "CEDU es el token que Ceduverse ha diseñado, pensado 1:1 al peso mexicano (MXN) para evitar volatilidad. A la fecha de este curso es diseño: todavía no está desplegado ni en operación.",
      },
      {
        question: "¿Por qué muchos proyectos 'RWA' del mercado son débiles?",
        options: [
          "Porque usan blockchain",
          "Porque fingen la sustancia off-chain: ponen un token sin un activo real y defendible detrás",
          "Porque cobran comisiones",
          "Porque son demasiado transparentes",
        ],
        correctIndex: 1,
        explanation: "La mitad difícil de un RWA es el activo real con valuación, título, flujo y procedencia. Muchos proyectos sólo emiten el token y fingen esa sustancia.",
      },
    ],
  },

  "brainshield-boveda-pi": {
    title: "Evaluación: BrainShield y la bóveda de PI",
    passingScore: 70,
    questions: [
      {
        question: "¿Qué tipo de empresa es BrainShield?",
        options: [
          "Una DAO anónima sin registro legal",
          "Una Sociedad Civil mexicana, originador de RWA tangibles e intangibles",
          "Un banco regulado por la CNBV",
          "Una criptomoneda",
        ],
        correctIndex: 1,
        explanation: "BrainShield es una Sociedad Civil (S.C.) mexicana constituida legalmente, que origina RWA tanto tangibles (inmuebles) como intangibles (propiedad intelectual).",
      },
      {
        question: "¿Qué puedes depositar en la bóveda de PI de BrainShield?",
        options: [
          "Solo criptomonedas",
          "Patentes, marcas y secretos industriales",
          "Acciones de bolsa",
          "Únicamente bienes inmuebles",
        ],
        correctIndex: 1,
        explanation: "La bóveda de PI está pensada para las tres grandes categorías de propiedad intelectual: patentes, marcas y secretos industriales.",
      },
      {
        question: "¿Qué es el modelo 80/20 de BrainShield?",
        options: [
          "El reparto de partes sociales entre los socios legales",
          "El reparto de la regalía generada al licenciar la PI: 80% para el dueño original, 20% para BrainShield",
          "Un descuento en el plan anual",
          "El porcentaje de aportación de un socio cooperativista",
        ],
        correctIndex: 1,
        explanation: "Cuando la PI depositada se licencia y genera regalía, el 80% se destina al dueño original del activo y el 20% se queda con BrainShield por administrar la estructura.",
      },
      {
        question: "¿Quién valúa los activos dentro de BrainShield, y bajo qué condición?",
        options: [
          "El propio dueño del activo",
          "Un corredor público titulado, bajo NIF C-8 y con 0% de margen, para eliminar conflicto de interés",
          "Un algoritmo de IA sin supervisión",
          "Cualquier usuario de la plataforma",
        ],
        correctIndex: 1,
        explanation: "La valuación la hace un corredor público titulado, siguiendo la NIF C-8, sin cobrar margen sobre el resultado, precisamente para que no tenga incentivo de inflar el número.",
      },
      {
        question: "¿Qué es el token BRAIN?",
        options: [
          "Una criptomoneda volátil para especular",
          "Un token diseñado para estar pegado 1:1 a USDC/USDT, sin volatilidad — a la fecha, un diseño aún no desplegado",
          "Una parte social de BrainShield S.C.",
          "KakawCoin con otro nombre",
        ],
        correctIndex: 1,
        explanation: "BRAIN está diseñado para no tener volatilidad (pegado 1:1 a stablecoins), pero es un diseño: todavía no está desplegado ni en operación. No debe confundirse con KakawChain/KakawCoin, que tampoco existen como producto.",
      },
    ],
  },

  "cryptovault-24k": {
    title: "Evaluación: CryptoVault 24k",
    passingScore: 70,
    questions: [
      {
        question: "¿Qué es CryptoVault 24k?",
        options: [
          "Un token especulativo sin respaldo físico",
          "Oro físico Au 999.9, en dos ediciones (100 g y 200 g), serie limitada 1/320 · 2026",
          "Un fondo de inversión en metales preciosos",
          "Una acción de la empresa Kakaw",
        ],
        correctIndex: 1,
        explanation: "CryptoVault 24k es oro físico de 24 kilates (Au 999.9), disponible en presentaciones de 100 g y 200 g, dentro de una serie limitada marcada 1/320 · 2026.",
      },
      {
        question: "¿Qué son las 24 palabras grabadas en el reverso de la pieza?",
        options: [
          "El certificado de ensaye del oro",
          "Tu propia frase de recuperación (autocustodia), un asunto distinto al título de la pieza",
          "El código de la garantía de devolución",
          "El número de serie de la edición",
        ],
        correctIndex: 1,
        explanation: "Las 24 palabras son la frase de recuperación de tu propia wallet, protegida por autocustodia. Es una capa distinta del título digital que identifica a la pieza física.",
      },
      {
        question: "¿Cómo se calcula el precio de una pieza al cotizarla?",
        options: [
          "Un precio fijo decidido internamente, sin relación con el mercado",
          "Spot del oro por gramo × gramos de la edición, más un fee operativo del 20% y el gas de red estimado",
          "El precio de Bitcoin del día",
          "Una subasta entre compradores",
        ],
        correctIndex: 1,
        explanation: "El precio parte del spot de oro 24k (fuente externa de mercado) por los gramos de la edición, más un 20% de fee operativo (acuñación + terminal) y el gas de red estimado, cotizado en vivo y bloqueado unos minutos.",
      },
      {
        question: "Cuando pagas tu pieza, tu título queda en estado 'acuñación pendiente'. ¿Qué significa esto?",
        options: [
          "Que el NFT ya fue acuñado on-chain y solo falta entregarlo",
          "Que tu pedido y tu pieza quedan reservados y documentados; la acuñación on-chain ocurre cuando se despliegan los contratos de Kakaw",
          "Que la compra fue rechazada",
          "Que necesitas pagar de nuevo",
        ],
        correctIndex: 1,
        explanation: "Tu pieza y tu título quedan reservados desde el pago, pero la acuñación on-chain propiamente dicha es un paso posterior, atado al despliegue de los contratos del consorcio. Nada se simula en el camino.",
      },
      {
        question: "¿Cuál de los siguientes es un guardrail correcto sobre CryptoVault 24k?",
        options: [
          "Es una oferta de valores con rendimiento garantizado",
          "No es un instrumento de inversión ni asesoría financiera: su valor depende únicamente del precio de mercado del oro",
          "Es un producto exclusivo para inversionistas acreditados",
          "Garantiza una revalorización anual fija",
        ],
        correctIndex: 1,
        explanation: "CryptoVault 24k es un producto respaldado por oro físico real, no una oferta de valores ni una promesa de rendimiento. Su valor sigue el precio de mercado del oro, sin garantías de retorno.",
      },
    ],
  },

  "bono-bienvenida": {
    title: "Evaluación: Bono de bienvenida (cómo te vuelves copropietario)",
    passingScore: 70,
    questions: [
      {
        question: "¿Cómo se descompone el bono de bienvenida de $170 MXN que contempla el proyecto de Reglamento Interno?",
        options: [
          "$170 de saldo para comprar cursos",
          "$150 que fundan tu primer certificado de aportación + $20 de crédito de descuento para tu primer certificado DC-3/SEP",
          "$170 de aportación al capital social",
          "$85 de aportación + $85 de descuento en la tienda",
        ],
        correctIndex: 1,
        explanation: "El bono propuesto son $170: $150 fondean el valor nominal de tu primer certificado de aportación (capital, se documenta con recibo de aportación de capital, NO con CFDI de ingreso) y $20 son un crédito de descuento aplicable a tu primer certificado DC-3/SEP — de naturaleza de promoción/crédito comercial, NO capital: no funda certificados. Un crédito de descuento no es en sí mismo una venta, y su tratamiento fiscal fino (base de IVA, momento y documentación) está marcado como PENDIENTE de confirmar con el área fiscal y el CLO. Importante: el monto y el desglose viven en el Reglamento Interno, que hoy es un BORRADOR no aprobado por la Asamblea General y sin efectos jurídicos; son parámetros expresamente ajustables por acuerdo de esa Asamblea.",
      },
      {
        question: "¿De dónde proviene el valor del bono de bienvenida?",
        options: [
          "Del propio capital social de la cooperativa",
          "De una fuente EXTERNA al capital cooperativo: una beca de empresa (canal B2B) o, en el diseño, un token respaldado 1:1",
          "De las cuotas mensuales de los demás socios",
          "De un préstamo bancario a nombre del socio",
        ],
        correctIndex: 1,
        explanation: "El financiamiento es híbrido y el valor SIEMPRE viene de fuera del capital cooperativo. Si saliera del propio capital social sería capital circular: la cooperativa fabricaría aportaciones con dinero de otros socios, inflando el capital sin que entre un peso nuevo al sistema.",
      },
      {
        question: "¿Cuál es el estado real de los tokens del consorcio (CEDU, BRAIN, KAKAW) a la fecha de este curso?",
        options: [
          "Los tres están desplegados y el socio puede usarlos hoy",
          "Todos son diseño e intención: ninguno está desplegado. Lo único que existe y opera hoy es la red Base y la atestación por hash SHA-256",
          "Solo CEDU está desplegado y en operación",
          "KakawChain ya opera y los otros dos siguen su estándar",
        ],
        correctIndex: 1,
        explanation: "CEDU (1:1 MXN), BRAIN (1:1 USDC/USDT) y KAKAW (1:1 oro) son diseño; ninguno está desplegado. KakawChain/KakawCoin no existen como producto. Hoy solo operan la red Base y el mecanismo de atestación SHA-256. Para el bono de Ceduverse el token relevante sería CEDU —no BRAIN— porque la aportación está en pesos y CEDU está diseñado 1:1 MXN: cero riesgo cambiario. Nota de honestidad documental: el proyecto de Reglamento Interno (borrador no aprobado) solo enumera hoy BRAIN 1:1 USDC/USDT y KAKAW 1:1 oro como vías admitidas; CEDU no aparece ahí. Su incorporación al Reglamento está PENDIENTE y debe resolverse antes de la Asamblea — no cites ese artículo como si ya autorizara la vía CEDU.",
      },
      {
        question: "¿Por qué un NFT o token sin reserva 1:1 fue rechazado como forma de acreditar aportaciones?",
        options: [
          "Porque la tecnología aún no está madura",
          "Porque sería capital simulado: el token no tiene valor propio, así que el capital social crecería sin que entrara dinero real — y no resistiría una auditoría ni una revisión fiscal",
          "Porque los NFTs son ilegales en México",
          "Porque el costo de gas en Base es demasiado alto",
        ],
        correctIndex: 1,
        explanation: "Un token sin respaldo real es solo una entrada en una base de datos: emitirlo no crea valor. Acreditar aportaciones contra él sería capital simulado/circular — el sistema financiándose con su propia promesa. Por eso la dependencia es explícita: hay que constituir la reserva 1:1 en tesorería ANTES de emitir bonos por token; mientras no exista, ese canal no se activa.",
      },
      {
        question: "Sobre la capitalización, el voto y el NFT en Ceduverse, ¿cuál afirmación es correcta?",
        options: [
          "El proyecto contempla capitalizar el 5% del consumo/comisión con tope de 20 certificados ($3,000) —parámetros propuestos, ajustables por la Asamblea General—; 1 socio = 1 voto sin importar cuántos certificados tenga; y el NFT es un gemelo registral, NO un título negociable",
          "Capitaliza el 15% sin tope y cada certificado da un voto adicional",
          "El NFT es un título negociable que puedes vender en un mercado secundario",
          "La capitalización garantiza un rendimiento anual sobre tu aportación",
        ],
        correctIndex: 0,
        explanation: "El proyecto contempla capitalizar el 5% de cada consumo/comisión del socio (ej.: certificación RVOE Academy de $49,900 → $2,495 ≈ 16 certificados de $150), con tope de 20 certificados = $3,000, que protege la naturaleza cooperativa. Ojo con el estatus: el 5% y el tope están en el Reglamento Interno, que hoy es un BORRADOR no aprobado por la Asamblea y sin efectos jurídicos, y el propio borrador los declara parámetros ajustables por acuerdo de la Asamblea General Ordinaria — no son una regla en vigor ni un compromiso que puedas ofrecer en firme. Lo que sí está firme: el voto es per-socio (LGSC y acta 6520): 1 socio = 1 voto. El NFT es espejo por hash del Libro de Registro —la fuente de verdad— y no es título negociable. Nada de esto es oferta de valores ni asesoría de inversión, y no hay rendimientos garantizados: la capitalización no es un rendimiento, es tu propia actividad reencauzada a tu patrimonio.",
      },
    ],
  },

  "certificados-aportacion-nft": {
    title: "Evaluación: Certificados de aportación NFT",
    passingScore: 70,
    questions: [
      {
        question: "¿Cuál es la base legal que permite que los certificados de aportación de Ceduverse sean digitales?",
        options: [
          "Una interpretación de la LGSC hecha por el equipo legal",
          "El Artículo Sexto del acta constitutiva 6520, que autoriza expresamente que los certificados sean digitales, nominativos e indivisibles",
          "Un acuerdo privado entre los socios fundadores",
          "La Ley Fintech",
        ],
        correctIndex: 1,
        explanation: "El Artículo Sexto del acta constitutiva 6520 (Notaría 110 QR, RPC N-2026009627) autoriza expresamente que los certificados de aportación sean digitales, nominativos e indivisibles. No es una interpretación creativa ni un vacío legal: está escrito en el instrumento constitutivo pasado ante notario, y es la base sobre la que se sostiene toda la representación digital del certificado. Que el certificado sea digital no altera su naturaleza jurídica: mismo valor nominal de $150, mismos derechos, mismo régimen.",
      },
      {
        question: "¿Cuál es la fuente de verdad de tu titularidad como socio, y qué papel juega el NFT gemelo?",
        options: [
          "El NFT es la fuente de verdad; el Libro de Registro es solo un respaldo administrativo",
          "El Libro de Registro de Certificados de Aportación es la fuente de verdad; el NFT es su espejo por hash y, en caso de discrepancia, prevalece el Libro",
          "Ambos tienen el mismo valor jurídico y cualquiera puede invocarse",
          "La wallet del socio determina la calidad de socio",
        ],
        correctIndex: 1,
        explanation: "La cooperativa reconoce como propietario únicamente a quien aparece inscrito en el Libro de Registro; la titularidad on-chain NO confiere la calidad de socio. El NFT es un gemelo registral: espeja el Libro mediante el hash SHA-256 del evento y lo atestigua, pero no crea el derecho, no lo transmite y no prevalece sobre el Libro. Es un testigo del hecho, no el hecho.",
      },
      {
        question: "¿En qué consiste el doble sello (Opción A) de un evento de certificado, y qué existe realmente hoy?",
        options: [
          "El socio firma dos veces con su wallet personal, y el NFT ya está acuñado y disponible",
          "La wallet del proyecto ancla el hash ('la entidad actúa') y la wallet madre de BrainShield contrafirma el mismo hash ('el originador ratifica'), todo en Base. Hoy operan Base y la atestación SHA-256; el NFT del certificado NO está acuñado: es diseño",
          "Se ancla el hash en dos blockchains distintas para tener redundancia",
          "Un notario firma en papel y luego se sube el PDF completo a la cadena",
        ],
        correctIndex: 1,
        explanation: "El doble sello Opción A ancla un mismo hash canónico dos veces en la red Base: primero la wallet del proyecto (Ceduverse), y luego la wallet madre de BrainShield, que contrafirma por referencia a la tx del proyecto (mismo valor probatorio, ~mitad de gas). Eso da una doble cadena de custodia verificable por cualquiera. Estado real: la red Base y el mecanismo de atestación por hash SHA-256 existen y operan; el NFT gemelo del certificado NO está acuñado ni desplegado — es diseño, igual que todos los tokens del consorcio (CEDU incluido). Explícalo siempre como diseño, nunca como algo que un socio pueda tener hoy.",
      },
      {
        question: "Un socio acumula 20 certificados de aportación. ¿Cuántos votos tiene en la Asamblea?",
        options: [
          "20 votos, uno por certificado",
          "Un (1) voto — igual que cualquier otro socio, sin importar el número o valor de sus certificados",
          "Depende de cuántos NFTs tenga en su wallet",
          "4 votos, uno por cada 5 certificados",
        ],
        correctIndex: 1,
        explanation: "1 socio = 1 voto, conforme a la LGSC y al acta constitutiva: cada socio tiene un voto con independencia del número o valor de sus certificados. La cooperativa es una sociedad de personas, no de capitales: el certificado representa tu patrimonio, no tu poder de decisión. Por eso ningún token ni NFT pondera el voto por tenencia — hacerlo convertiría de facto a la cooperativa en una sociedad de capitales, contra su propia acta y contra la LGSC. La tecnología se adapta al régimen societario, nunca al revés.",
      },
      {
        question: "Sobre la capitalización del 5% en una certificación RVOE Academy de $49,900, ¿cuál afirmación es correcta?",
        options: [
          "El 5% ($2,495) se asigna a la cuenta de capital del socio ≈ 16 certificados de $150, con el remanente acumulándose porque el certificado es indivisible; el tope es de 20 certificados ($3,000)",
          "El socio recibe $2,495 en efectivo como rendimiento garantizado de su aportación",
          "Se capitaliza el 5% sin tope alguno, y cada certificado adicional aumenta su voto",
          "Los $2,495 los aporta la cooperativa como subsidio, además del pago del socio",
        ],
        correctIndex: 0,
        explanation: "El 5% de $49,900 son $2,495 que se asignan a la cuenta de capital del propio socio (≈16 certificados: 16 × $150 = $2,400, y los $95 restantes se acumulan como saldo de aportación pendiente hasta completar el siguiente certificado, porque el título es indivisible). Los $47,405 restantes son ingreso por servicio con CFDI. El 5% NO es un rendimiento ni un subsidio: sale del pago del propio socio y se reencauza a su propio patrimonio. El tope es de 20 certificados ($3,000), que junto con el principio de 1 socio = 1 voto impide que el capital se concentre. El tratamiento fiscal fino del split (base de IVA y retenciones) está pendiente de validación con el área fiscal. Nada de esto es oferta de valores ni asesoría de inversión, y no hay rendimientos garantizados.",
      },
      {
        question: "Un prospecto te pregunta si puede vender sus certificados a un tercero y a qué precio. ¿Cuál es la respuesta correcta?",
        options: [
          "Que sí, libremente, y que el NFT se puede listar en un exchange",
          "Que el acta remite el procedimiento de transmisión al Reglamento Interno, que hoy es un BORRADOR no aprobado por la Asamblea y sin efectos jurídicos: el carácter restringido, el derecho del tanto y el valor de transmisión/reembolso son propuestas pendientes de aprobarse",
          "Que se transmite al valor de mercado que fijen las partes",
          "Que basta con transferir el NFT a la wallet del comprador",
        ],
        correctIndex: 1,
        explanation: "En firme hoy: el Art. Sexto del acta ordena inscribir toda transmisión en el Libro de Registro, pero NO detalla el procedimiento (hueco estatutario que el acta remite a reglamentación interna); la LGSC (art. 52) y el acta rigen la devolución al cierre del ejercicio, con prelación y a prorrata, deducidas las pérdidas proporcionales y sin afectar el capital mínimo fijo. Pendiente: el proyecto de Reglamento Interno contempla carácter restringido, transmisión entre socios con inscripción, derecho del tanto hacia terceros (propone 15 días naturales, plazo aún por confirmar) y admisión previa por Asamblea — pero es un borrador sin aprobar. Siguen abiertos: si la transmisión puede ser onerosa con lucro o limitarse al valor nominal, si los certificados capitalizados quedan afectos, y a qué valor se reembolsan. Nunca presentes el certificado como algo vendible o que se aprecia: no hay mercado secundario, y el NFT documenta la transmisión, no la ejecuta.",
      },
    ],
  },

  "modelo-cooperativo-comercial": {
    title: "Evaluación: Modelo cooperativo comercial (cómo vender)",
    passingScore: 70,
    questions: [
      {
        question: "Sobre los niveles de comisión de un socio comercial, ¿cuál afirmación es correcta?",
        options: [
          "Existe una escalera de rangos (agente → senior → director) y se asciende automáticamente por volumen de ventas",
          "El rol es PLANO: todos los agentes son socio_comercial y el 'nivel' es simplemente el campo de comisión, con valor base de 15%. 'Director' es un rol distinto de la estructura, NO un peldaño de comisión",
          "La comisión sube automáticamente a 30% con 4 empresas y a 35% con 8 empresas",
          "Cada socio comercial negocia su propio tier vitalicio al firmar",
        ],
        correctIndex: 1,
        explanation: "El rol comercial es plano: todos los agentes son socio_comercial. No existe ninguna escalera de rangos nombrados en el sistema. El 'nivel' es literalmente un campo de comisión asociado al código del socio, cuyo valor por defecto es 15% (ajustable caso por caso por la administración). 'Director' es un rol distinto dentro de la estructura —un escalón arriba de comercial—, no un tier de comisión que se alcance vendiendo. ATENCIÓN: si viste en materiales públicos una tabla de perfiles con escalones (25/30/35%), override sobre la red de otros, comisiones 'vitalicias' o proyecciones de ingreso mensual, esa estructura NO existe en el sistema — es material comercial. No la repitas frente a un prospecto: quien queda mal es quien la dice, no quien la escribió.",
      },
      {
        question: "¿Cuándo se paga el bono de $500 por referido, y cuál es su estado real hoy?",
        options: [
          "Por cada estudiante que refieras, en automático al registrarse",
          "Cuando la EMPRESA referida hace su PRIMERA APORTACIÓN. No hay bono por referir estudiantes. Estado: está definido como política, pero todavía NO opera en el motor de comisiones — no se promete con fecha",
          "Cuando la empresa referida firma la carta de intención",
          "Cada mes mientras la empresa referida siga activa, de forma vitalicia y garantizada",
        ],
        correctIndex: 1,
        explanation: "Los $500 están atados a que una EMPRESA referida haga su primera aportación real — no a que se registre, ni a que muestre interés, ni a que firme. Y la mitad que más se olvida: NO hay bono por referir socios estudiantes; no se paga por cabeza ni por reclutar. Estado real: el bono está documentado como regla de negocio, pero a la fecha no hay un cálculo que lo dispare en el motor de comisiones (esa línea aparece en cero). La formulación honesta es: 'está definido, atado a la primera aportación de la empresa referida, y su operación está pendiente'. Nunca le pongas fecha ni lo presentes como algo que ya se está pagando.",
      },
      {
        question: "Un prospecto te pregunta qué día del mes se pagan las comisiones. ¿Cuál es la respuesta correcta?",
        options: [
          "El día 20 de cada mes, por transferencia bancaria",
          "El día 25 de cada mes, en automático",
          "Que no existe una fecha automática de dispersión: las comisiones se generan por periodo mensual y la administración las aprueba y paga de forma manual; el calendario exacto se confirma con administración",
          "El primer día hábil tras el cierre de cada trimestre",
        ],
        correctIndex: 2,
        explanation: "No hay ningún proceso automático que disperse comisiones en una fecha. Las comisiones se generan por periodo mensual y avanzan por estados (pendiente → aprobada → pagada), pero ese avance lo ejecuta la administración manualmente. Además, hay materiales que se contradicen entre sí sobre la fecha de corte, y ninguna de esas fechas está implementada. Por eso la regla es absoluta: nunca prometas una fecha de pago de comisiones —ni a un prospecto, ni a tu red, ni a ti mismo—. La respuesta correcta remite a administración. Es una respuesta aburrida, y es la única cierta.",
      },
      {
        question: "¿Sobre qué base se calcula tu comisión, y por qué?",
        options: [
          "Sobre la aportación de la empresa, porque es el monto más grande",
          "Sobre el fee de administración de Ceduverse, NUNCA sobre la aportación — porque la aportación es capital del socio (patrimonio suyo) y pagar comisiones con ella sería tomar capital ajeno",
          "Sobre el valor nominal de los certificados emitidos",
          "Sobre el total facturado incluyendo IVA",
        ],
        correctIndex: 1,
        explanation: "La comisión sale del fee de administración, que sí es ingreso de la cooperativa por el servicio que presta. Jamás de la aportación. Y la razón es la consecuencia directa del Curso 4: la aportación es capital del socio, patrimonio suyo. Si tu comisión saliera de ahí, la cooperativa le entregaría a un socio un certificado de $150 mientras le descuenta una parte para pagarte — sería tomar el patrimonio de otra persona y llamarlo comisión. El capital del socio no se toca. Nunca. Nota además que tu comisión NO es un rendimiento de tu aportación: son cosas separadas (tu comisión la ganas por tu trabajo comercial; tu aportación no promete nada).",
      },
      {
        question: "Un prospecto te dice: '¿esto no será una pirámide?'. ¿Cuál es la mejor respuesta?",
        options: [
          "Ofenderte y asegurarle que definitivamente no lo es",
          "Contestar con la estructura: no hay bono por referir personas (el $500 se paga cuando una EMPRESA compra y aporta de verdad, no por cabeza); la comisión sale del fee, no de la aportación; la capitalización tiene tope de 20 certificados ($3,000); 1 socio = 1 voto; y no hay rendimiento",
          "Explicarle que todas las empresas modernas funcionan así",
          "Prometerle que si no le gusta, le devuelven su dinero completo",
        ],
        correctIndex: 1,
        explanation: "Una pirámide tiene una firma inconfundible: el dinero entra por reclutar gente, no por vender algo real. La objeción se contesta con estructura, no con indignación (la indignación no prueba nada; los datos sí). Los cinco puntos: (1) no hay bono por referir personas — el $500 está atado a que una EMPRESA compre capacitación real y aporte; (2) la comisión sale del fee de administración, no del capital del socio; (3) la capitalización se detiene en 20 certificados ($3,000) — en una pirámide te empujan a meter cada vez más; (4) 1 socio = 1 voto, nadie tiene más poder por tener más certificados; (5) no hay rendimiento prometido. Y el remate honesto que sella la respuesta: el bono de $500 ni siquiera está operando todavía — si esto fuera un esquema para reclutar, el pago por reclutar sería lo PRIMERO en funcionar, no lo último que falta.",
      },
      {
        question: "¿Cuál de estas frases SÍ puedes decirle a un prospecto?",
        options: [
          "'Si no te gusta, te devuelven tu dinero'",
          "'Tu aportación es tuya y es reembolsable — con procedimiento, con calendario y sin garantía de monto: no es una cuenta de ahorro, es capital de una sociedad real, y si hubiera pérdidas tu reembolso las absorbe en tu parte'",
          "'Es una inversión segura con un 5% de rendimiento'",
          "'Puedes vender tus certificados después, cuando se aprecien'",
        ],
        correctIndex: 1,
        explanation: "'Si no te gusta, te devuelven tu dinero' es falsa en dos dimensiones a la vez. Falsa en el TIEMPO: el retiro no surte efectos hasta el fin del ejercicio anual — o del ejercicio siguiente si se notifica después del último trimestre; pueden pasar meses y hasta cerca de dos años. Falsa en el MONTO: la devolución se practica al cierre del ejercicio, con prelación y a prorrata, deducidas las pérdidas que proporcionalmente correspondan (LGSC art. 52 y acta 6520), y hay puntos aún pendientes de definir, como a qué valor se reembolsan los certificados capitalizados. Las otras dos opciones también están prohibidas: el 5% NO es un rendimiento (es una fracción de tu propio pago reencauzada a tu propio capital, con tope de $3,000) y 'inversión segura' es doblemente incorrecto — un certificado es capital de riesgo de una sociedad real. Y no hay mercado secundario: el certificado vale $150 de valor nominal el día uno y $150 tres años después.",
      },
      {
        question: "Un prospecto te pregunta si puede recibir su bono financiado con el token CEDU y ver su NFT de certificado. ¿Qué contestas?",
        options: [
          "Que sí, que CEDU ya está desplegado 1:1 al peso y su NFT se acuña al aportar",
          "Que ese canal NO está disponible: ningún token del consorcio está desplegado (CEDU, BRAIN y KAKAW son diseño), el NFT del certificado no está acuñado, la reserva 1:1 no existe todavía y sin ella el canal no se activa por diseño. Hoy solo operan la red Base y la atestación por hash SHA-256",
          "Que espere unas semanas porque el despliegue es inminente",
          "Que KakawChain ya lo garantiza y el NFT llega por correo",
        ],
        correctIndex: 1,
        explanation: "Ofrecer hoy el canal de token no es exagerar: es describir algo que no existe. Ningún token del consorcio está desplegado — CEDU (diseñado 1:1 MXN), BRAIN (1:1 USDC/USDT) y KAKAW (1:1 oro) son diseño, y KakawChain/KakawCoin no existen como producto. El NFT del certificado tampoco está acuñado. Además, la vía del token exige constituir ANTES la reserva 1:1 (un peso real guardado por cada peso de token), que no existe; y la billetera del proyecto de Ceduverse ni siquiera está constituida. La regla de la reserva no es burocracia: un token sin respaldo sería capital simulado, e inflaría el capital social sin que entrara un peso — exactamente el fraude del que el modelo quiere distinguirse. Lo único que opera hoy es Base + SHA-256. Tampoco le pongas fecha al despliegue.",
      },
      {
        question: "¿Cuál es el estatus del bono de $170 y de la capitalización del 5% con tope de 20 certificados, y cómo debes presentarlos?",
        options: [
          "Son reglas vigentes de la cooperativa y puedes ofrecerlas en firme como un derecho adquirido",
          "Son política PROPUESTA: viven en el Reglamento Interno, que es un BORRADOR no aprobado por la Asamblea General y sin efectos jurídicos, y el propio borrador los declara parámetros ajustables por la Asamblea. Se explican como diseño, nunca como garantía",
          "Están en el acta constitutiva 6520 y solo un notario puede cambiarlos",
          "Los fija la administración y puede cambiarlos cuando quiera sin avisar",
        ],
        correctIndex: 1,
        explanation: "El bono de $170 ($150 que fundan el primer certificado + $20 de crédito de descuento para el primer DC-3/SEP) y la capitalización del 5% con tope de 20 certificados ($3,000) viven en el Reglamento Interno, que hoy es un borrador NO aprobado por la Asamblea General y que NO surte efectos jurídicos (Arts. 19 y 20 del propio borrador). Además, el borrador declara expresamente que esos montos son 'parámetros ajustables por acuerdo de la Asamblea General Ordinaria' — ni siquiera una vez aprobados quedarían grabados en piedra. Preséntalos siempre con la etiqueta: 'así está diseñado; el Reglamento que lo contiene está pendiente de aprobación en Asamblea'. Un socio comercial que promete $170 como derecho adquirido le crea a la cooperativa un reclamo real con una persona real el día que la Asamblea ajuste el parámetro — y ese reclamo lleva su nombre.",
      },
    ],
  },

};
