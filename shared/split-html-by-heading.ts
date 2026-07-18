// Parte el contentHtml gigante de un módulo único en varias secciones
// "de tamaño de módulo", cortando por heading (h2 o h3). Lo usa el seed de
// Studio para romper módulos de 16k+ caracteres en un módulo por sección.
//
// Es una división por regex, no un parser HTML completo: se asume HTML
// bien formado y balanceado (la data fuente es hand-authored y limpia).

export interface HtmlSection {
  title: string;
  contentHtml: string;
}

const DEFAULT_MIN_CHARS = 1200;

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitHtmlBySections(
  html: string,
  headingTag: "h2" | "h3",
  opts?: { minChars?: number }
): HtmlSection[] {
  if (!html || !html.trim()) return [];

  const minChars = opts?.minChars ?? DEFAULT_MIN_CHARS;

  // Encuentra todas las aperturas del heading tag (con posibles atributos)
  // y sus cierres correspondientes, de forma no-greedy, case-insensitive.
  const openRe = new RegExp(`<${headingTag}(\\s[^>]*)?>`, "gi");
  const opens: { start: number; contentStart: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = openRe.exec(html)) !== null) {
    opens.push({ start: m.index, contentStart: m.index + m[0].length });
  }

  if (opens.length === 0) {
    return [{ title: "", contentHtml: html }];
  }

  const closeRe = new RegExp(`</${headingTag}>`, "i");

  // Construye las secciones crudas (heading + contenido hasta el próximo heading).
  const rawSections: HtmlSection[] = [];
  for (let i = 0; i < opens.length; i++) {
    const sectionStart = opens[i].start;
    const sectionEnd = i + 1 < opens.length ? opens[i + 1].start : html.length;
    const sectionHtml = html.slice(sectionStart, sectionEnd);

    // Título: texto plano dentro del heading (entre apertura y su cierre).
    const closeMatch = closeRe.exec(sectionHtml);
    const headingInnerHtml = closeMatch ? sectionHtml.slice(sectionHtml.indexOf(">") + 1, closeMatch.index) : "";
    const title = stripTags(headingInnerHtml);

    rawSections.push({ title, contentHtml: sectionHtml });
  }

  // Contenido antes del primer heading (intro) se prepone a la primera sección,
  // sin perderlo y conservando el título del primer heading.
  const introHtml = html.slice(0, opens[0].start);
  if (introHtml.trim()) {
    rawSections[0] = {
      title: rawSections[0].title,
      contentHtml: introHtml + rawSections[0].contentHtml,
    };
  }

  // Fusiona secciones diminutas para que ninguna quede huérfana o micro.
  // - Si NO es la primera sección y es chica, se fusiona en la ANTERIOR (se
  //   conserva el título de la anterior).
  // - Si la PRIMERA sección es chica, se fusiona en la SIGUIENTE (se conserva
  //   el título de la siguiente), para no dejarla huérfana.
  const merged: HtmlSection[] = [];
  for (const section of rawSections) {
    if (merged.length > 0 && section.contentHtml.length < minChars) {
      const prev = merged[merged.length - 1];
      merged[merged.length - 1] = {
        title: prev.title,
        contentHtml: prev.contentHtml + section.contentHtml,
      };
    } else {
      merged.push(section);
    }
  }

  // La primera sección puede seguir siendo chica (p.ej. si es la única, o si
  // todas las que le seguían ya se fusionaron en ella pero sigue corta):
  // fusiónala hacia la siguiente en vez de dejarla huérfana.
  while (merged.length > 1 && merged[0].contentHtml.length < minChars) {
    const first = merged.shift()!;
    merged[0] = {
      title: merged[0].title,
      contentHtml: first.contentHtml + merged[0].contentHtml,
    };
  }

  return merged;
}
