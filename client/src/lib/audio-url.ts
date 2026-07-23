// Resolución de la URL de audio: misma regla que usaba el StpsPlayer. El backend
// guarda unas veces la ruta completa (/audio/... o http) y otras solo el nombre
// (con o sin prefijo audio-cache/), que se sirve estáticamente bajo /audio/.
export function resolveAudioUrl(url: string | null | undefined): string | null {
  const raw = (url || "").trim();
  if (!raw) return null;
  if (raw.startsWith("/audio/") || raw.startsWith("http")) return raw;
  const filename = raw.replace(/^audio-cache\//, "");
  return `/audio/${filename}`;
}

// Guarda de integridad del diploma: el alumno no puede adelantar más allá de lo
// que ya escuchó, con un margen del 10% de la duración. Función pura para poder
// probarla; el provider la aplica solo cuando la pista trae restrictSeek.
export function clampSeek(target: number, maxListenedSecond: number, duration: number): number {
  const maxAllowed = maxListenedSecond + duration * 0.1;
  return Math.min(target, maxAllowed);
}
