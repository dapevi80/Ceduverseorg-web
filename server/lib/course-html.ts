// El instructor escribe contenido que verán terceros: se sanitiza en el SERVIDOR,
// no sólo en el cliente, porque el endpoint se puede llamar directo.
//
// Las marcas [[ref:uuid]] son texto plano, así que sobreviven a la sanitización
// sin necesidad de tratarlas aparte (ver server/lib/course-citations.ts).

import sanitizeHtml from "sanitize-html";

export function sanitizeCourseHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s",
      "h2", "h3", "h4",
      "ul", "ol", "li",
      "blockquote", "code", "pre",
      "a", "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });
}
