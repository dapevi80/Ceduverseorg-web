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
        question: "El token BRAIN está diseñado para:",
        options: [
          "Especular con alta volatilidad",
          "Estar pegado 1:1 a USDC/USDT (estable, sin volatilidad)",
          "Reemplazar al peso mexicano",
          "Pagar comisiones de Bitcoin",
        ],
        correctIndex: 1,
        explanation: "BRAIN es un token de valor pegado 1:1 a stablecoins (USDC/USDT) para evitar volatilidad.",
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
          "Un token pegado 1:1 a USDC/USDT, sin volatilidad, para representar valor de operaciones ya verificadas",
          "Una parte social de BrainShield S.C.",
          "KakawCoin con otro nombre",
        ],
        correctIndex: 1,
        explanation: "BRAIN está diseñado para no tener volatilidad: pegado 1:1 a stablecoins. No debe confundirse con KakawChain/KakawCoin, que aún no existen como producto.",
      },
    ],
  },

};
