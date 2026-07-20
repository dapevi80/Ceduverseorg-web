/**
 * Costo por minuto de una asesoría EN VIVO con el gemelo digital del instructor.
 *
 * Para qué sirve: saber cuánto te cuesta un minuto para poder ponerle precio.
 *
 * CÓMO USARLO
 *   1. Consigue las cotizaciones reales de cada proveedor (los precios cambian
 *      seguido; los de abajo son marcadores, NO precios verificados).
 *   2. Sustitúyelos en PRECIOS.
 *   3. Corre:  npx tsx script/costo-gemelo.ts
 *
 * Lo único que NO tienes que estimar son las constantes de uso: salieron
 * medidas de los audios reales de Ceduverse.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES MEDIDAS EN TUS DATOS (no las cambies a la ligera)
// ─────────────────────────────────────────────────────────────────────────────

/** Ritmo de habla de tus instructores. Medido sobre 8 audios reales del Tutor
 *  IA (rango 837–881). Un minuto hablado = ~857 caracteres de guion. */
const CARACTERES_POR_MINUTO_HABLADO = 857;

/** Del tiempo total de la sesión, qué fracción habla el GEMELO (el resto habla
 *  el cliente, o hay silencios). En una asesoría de ida y vuelta, 0.6 es una
 *  estimación razonable; súbelo si el gemelo expone más que conversa. */
const FRACCION_QUE_HABLA_EL_GEMELO = 0.6;

/** Tokens que consume el modelo por cada respuesta hablada. La salida se estima
 *  del propio texto que se va a decir; la entrada incluye el contexto que le
 *  mandas en cada turno (instrucciones + historial + material del curso). */
const TOKENS_ENTRADA_POR_MINUTO = 2500;   // ajusta según cuánto contexto mandes
const CARACTERES_POR_TOKEN = 4;           // aproximación estándar para español

// ─────────────────────────────────────────────────────────────────────────────
// PRECIOS — RELLENA CON TUS COTIZACIONES REALES
// ─────────────────────────────────────────────────────────────────────────────

const PRECIOS = {
  /** Avatar de video en vivo, por minuto de streaming (HeyGen, Tavus, D-ID...).
   *  Suele ser el costo DOMINANTE. */
  avatarPorMinutoUSD: 0.10,

  /** Voz clonada (ElevenLabs u otro), por cada 1,000 caracteres sintetizados. */
  vozPor1000CaracteresUSD: 0.30,

  /** Modelo de lenguaje, por millón de tokens. */
  llmEntradaPorMillonUSD: 3.0,
  llmSalidaPorMillonUSD: 15.0,

  /** Transcripción de lo que dice el cliente, por minuto de audio. */
  transcripcionPorMinutoUSD: 0.006,
};

/** Tipo de cambio para verlo también en pesos. */
const USD_A_MXN = 17.0;

// ─────────────────────────────────────────────────────────────────────────────

function costoPorMinuto() {
  const carsGemelo = CARACTERES_POR_MINUTO_HABLADO * FRACCION_QUE_HABLA_EL_GEMELO;
  const tokensSalida = carsGemelo / CARACTERES_POR_TOKEN;

  const avatar = PRECIOS.avatarPorMinutoUSD;
  const voz = (carsGemelo / 1000) * PRECIOS.vozPor1000CaracteresUSD;
  const llmEntrada = (TOKENS_ENTRADA_POR_MINUTO / 1_000_000) * PRECIOS.llmEntradaPorMillonUSD;
  const llmSalida = (tokensSalida / 1_000_000) * PRECIOS.llmSalidaPorMillonUSD;
  const stt = PRECIOS.transcripcionPorMinutoUSD;

  return {
    avatar, voz, llmEntrada, llmSalida, stt,
    total: avatar + voz + llmEntrada + llmSalida + stt,
    carsGemelo,
  };
}

const c = costoPorMinuto();
const pct = (x: number) => `${((x / c.total) * 100).toFixed(0)}%`;

console.log("\n=== COSTO POR MINUTO DE ASESORÍA EN VIVO ===\n");
console.log(`El gemelo habla ${Math.round(c.carsGemelo)} caracteres por minuto`);
console.log(`(${CARACTERES_POR_MINUTO_HABLADO} chars/min medidos × ${FRACCION_QUE_HABLA_EL_GEMELO} de participación)\n`);

const filas: [string, number][] = [
  ["Avatar de video", c.avatar],
  ["Voz clonada", c.voz],
  ["Modelo (entrada)", c.llmEntrada],
  ["Modelo (salida)", c.llmSalida],
  ["Transcripción", c.stt],
];
for (const [nombre, v] of filas.sort((a, b) => b[1] - a[1])) {
  console.log(`  ${nombre.padEnd(20)} $${v.toFixed(4)} USD   ${pct(v).padStart(4)}`);
}
console.log(`  ${"—".repeat(44)}`);
console.log(`  ${"TOTAL".padEnd(20)} $${c.total.toFixed(4)} USD/min  ($${(c.total * USD_A_MXN).toFixed(2)} MXN)\n`);

console.log("=== SESIONES ===\n");
for (const min of [15, 30, 60]) {
  const costo = c.total * min;
  console.log(`  ${String(min).padStart(2)} min → costo $${costo.toFixed(2)} USD ($${(costo * USD_A_MXN).toFixed(0)} MXN)`);
}

console.log("\n=== PRECIO SUGERIDO (sobre el costo directo) ===\n");
for (const min of [30, 60]) {
  const costo = c.total * min * USD_A_MXN;
  console.log(`  ${min} min:`);
  for (const margen of [5, 10, 20]) {
    console.log(`     ×${margen}  →  $${(costo * margen).toFixed(0)} MXN   (margen $${(costo * margen - costo).toFixed(0)})`);
  }
}

console.log(`
NOTA HONESTA: esto es COSTO DIRECTO de cómputo. No incluye lo que de verdad
cuesta el servicio: el tiempo del instructor real revisando que su gemelo diga
lo correcto, el soporte, la infraestructura, ni el riesgo de que una respuesta
equivocada salga con SU voz y SU cara. Ese riesgo no se cubre con margen: se
cubre con revisión humana, y esa revisión tiene costo.
`);
