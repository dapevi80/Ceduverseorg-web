export const CEDU_CART_KEY = "cedu_cart";
export type CeduCart = { vault: number; tangem2: number; tangem3: number };

export function writeCeduCart(cart: CeduCart): void {
  try { localStorage.setItem(CEDU_CART_KEY, JSON.stringify(cart)); } catch { /* no-op */ }
}

export function readCeduCart(): CeduCart | null {
  try {
    const raw = localStorage.getItem(CEDU_CART_KEY);
    if (!raw) return null;
    localStorage.removeItem(CEDU_CART_KEY); // one-shot handoff
    const c = JSON.parse(raw);
    return {
      vault: Number(c.vault) || 0,
      tangem2: Number(c.tangem2) || 0,
      tangem3: Number(c.tangem3) || 0,
    };
  } catch { return null; }
}
