/**
 * Fuentes de marca para el Cuaderno de estudio (server/cuaderno/*).
 *
 * Ceduverse usa DM Serif Display (títulos) y Plus Jakarta Sans (texto).
 * PDFKit trae Helvetica embebida por defecto; sin este módulo, el PDF se ve
 * genérico y "no Ceduverse". Este módulo incrusta las fuentes reales vía
 * `doc.registerFont()`.
 *
 * Nota sobre el formato de archivo: los paquetes @fontsource (v5.2.8, verificado
 * en este repo) sólo publican `.woff`/`.woff2` bajo `files/` — NO `.ttf` a pesar
 * de lo que suele asumirse. El motor de fuentes de PDFKit (`fontkit`) soporta
 * WOFF y WOFF2 de forma nativa vía `doc.registerFont()`, pero se verificó
 * empíricamente que el subsetter TTF de fontkit 2.0.4 lanza
 * "Offset is outside the bounds of the DataView" al usar `.woff2` con texto
 * que incluye vocales acentuadas (p. ej. "subtítulo") — inaceptable para un
 * cuaderno en español. `.woff` (mismo paquete, mismas fuentes) no tiene ese
 * bug y fue probado con texto acentuado real en las 4 variantes, así que se
 * usa `.woff` aquí.
 *
 * Respaldo honesto: si un archivo de fuente no existe en disco, se usa el
 * equivalente Helvetica y se registra explícitamente en consola. Nunca se
 * degrada en silencio.
 */

import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** Resuelve un specifier de paquete npm a una ruta absoluta en disco, o null si no existe. */
function resolvePackageFile(specifier: string): string | null {
  try {
    return require.resolve(specifier);
  } catch {
    return null;
  }
}

export interface CuadernoFontFiles {
  /** DM Serif Display, normal 400 — títulos */
  serif: string | null;
  /** DM Serif Display, italic 400 */
  serifItalic: string | null;
  /** Plus Jakarta Sans, normal 400 — texto */
  sans: string | null;
  /** Plus Jakarta Sans, bold 700 */
  sansBold: string | null;
}

/** Rutas resueltas de los archivos de fuente reales dentro de node_modules/@fontsource/*. */
export const FONT_FILES: CuadernoFontFiles = {
  serif: resolvePackageFile(
    "@fontsource/dm-serif-display/files/dm-serif-display-latin-400-normal.woff"
  ),
  serifItalic: resolvePackageFile(
    "@fontsource/dm-serif-display/files/dm-serif-display-latin-400-italic.woff"
  ),
  sans: resolvePackageFile(
    "@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff"
  ),
  sansBold: resolvePackageFile(
    "@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff"
  ),
};

export interface CuadernoFontNames {
  serif: string;
  serifItalic: string;
  sans: string;
  sansBold: string;
}

const FONT_NAMES = {
  serif: "Cuaderno-DMSerifDisplay",
  serifItalic: "Cuaderno-DMSerifDisplay-Italic",
  sans: "Cuaderno-PlusJakartaSans",
  sansBold: "Cuaderno-PlusJakartaSans-Bold",
} as const;

const HELVETICA_FALLBACKS = {
  serif: "Helvetica",
  serifItalic: "Helvetica-Oblique",
  sans: "Helvetica",
  sansBold: "Helvetica-Bold",
} as const;

function registerOrFallback(
  doc: PDFKit.PDFDocument,
  key: keyof CuadernoFontFiles,
  filePath: string | null
): string {
  const name = FONT_NAMES[key];
  const fallback = HELVETICA_FALLBACKS[key];

  if (filePath && fs.existsSync(filePath)) {
    doc.registerFont(name, filePath);
    return name;
  }

  // Respaldo honesto: nunca renderizar fuera de marca en silencio.
  console.error(
    `[cuaderno/fonts] Fuente de marca faltante para "${key}" ` +
      `(esperada en ${filePath ?? "ruta no resuelta vía node_modules"}). ` +
      `Usando respaldo "${fallback}". El PDF se verá fuera de marca hasta corregir esto.`
  );
  return fallback;
}

/**
 * Registra las fuentes de marca de Ceduverse en un PDFDocument y devuelve
 * los nombres a pasar a `doc.font(...)`.
 *
 * `files` es inyectable (por defecto usa FONT_FILES) para permitir probar el
 * camino de respaldo sin depender del filesystem real.
 */
export function registerCuadernoFonts(
  doc: PDFKit.PDFDocument,
  files: CuadernoFontFiles = FONT_FILES
): CuadernoFontNames {
  return {
    serif: registerOrFallback(doc, "serif", files.serif),
    serifItalic: registerOrFallback(doc, "serifItalic", files.serifItalic),
    sans: registerOrFallback(doc, "sans", files.sans),
    sansBold: registerOrFallback(doc, "sansBold", files.sansBold),
  };
}
