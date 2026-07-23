// Normaliza cualquier forma de enlace de YouTube a su ID de 11 caracteres.
// Se guarda el ID, no la URL: así el reproductor puede usar youtube-nocookie.com
// sin volver a parsear lo que el instructor haya pegado.

const ID = /^[A-Za-z0-9_-]{11}$/;

export function extractYoutubeId(input: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;

  if (ID.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  let candidate: string | null = null;

  if (host === "youtu.be") {
    candidate = url.pathname.slice(1);
  } else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      candidate = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/embed/")) {
      candidate = url.pathname.slice("/embed/".length);
    }
  }

  if (!candidate) return null;
  const clean = candidate.split("/")[0];
  return ID.test(clean) ? clean : null;
}
