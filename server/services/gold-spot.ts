// Precio spot del oro (XAU) para el CryptoVault 24k, vía goldapi.io.
//
// REGLA NO-MOCK: si GOLD_API_KEY no está configurada o la API falla, se lanza un
// error explícito. NUNCA se devuelve un precio inventado — cotizar oro con un
// número simulado sería exactamente el tipo de mock silencioso que no permitimos.
//
// goldapi.io devuelve, por moneda solicitada, el precio por gramo de oro 24k ya
// calculado (`price_gram_24k`), que es justo la base del CryptoVault (Au 999.9).

const GOLDAPI_BASE = "https://www.goldapi.io/api/XAU";
const TTL_MS = 5 * 60 * 1000; // caché 5 min: el spot no se mueve tanto y evita rate-limit.

export type GoldSpot = {
  mxnPerGram24k: number;
  usdPerGram24k: number;
  mxnPerOzt: number;
  usdPerOzt: number;
  fetchedAt: string; // ISO
  source: "goldapi.io";
};

let cache: { at: number; value: GoldSpot } | null = null;

async function fetchCurrency(currency: "MXN" | "USD", key: string): Promise<{ perGram24k: number; perOzt: number }> {
  const res = await fetch(`${GOLDAPI_BASE}/${currency}`, {
    headers: { "x-access-token": key, "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`goldapi.io respondió ${res.status} para XAU/${currency}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { price_gram_24k?: number; price?: number };
  const perGram24k = Number(data.price_gram_24k);
  const perOzt = Number(data.price);
  if (!Number.isFinite(perGram24k) || perGram24k <= 0) {
    throw new Error(`goldapi.io devolvió price_gram_24k inválido para XAU/${currency}`);
  }
  return { perGram24k, perOzt };
}

/**
 * Spot actual del oro 24k. Usa caché de 5 min. Lanza si no hay key o si la API falla.
 * `nowMs` se inyecta para poder testear el TTL sin depender del reloj.
 */
export async function getGoldSpot(nowMs: number = Date.now()): Promise<GoldSpot> {
  const key = process.env.GOLD_API_KEY;
  if (!key) {
    throw new Error(
      "GOLD_API_KEY no configurada: no se puede cotizar el CryptoVault 24k. " +
      "No se permite un precio de oro simulado."
    );
  }
  if (cache && nowMs - cache.at < TTL_MS) return cache.value;

  const [mxn, usd] = await Promise.all([fetchCurrency("MXN", key), fetchCurrency("USD", key)]);
  const value: GoldSpot = {
    mxnPerGram24k: mxn.perGram24k,
    usdPerGram24k: usd.perGram24k,
    mxnPerOzt: mxn.perOzt,
    usdPerOzt: usd.perOzt,
    fetchedAt: new Date(nowMs).toISOString(),
    source: "goldapi.io",
  };
  cache = { at: nowMs, value };
  return value;
}

/** Solo para pruebas: limpia la caché en memoria. */
export function _clearGoldSpotCache(): void {
  cache = null;
}
