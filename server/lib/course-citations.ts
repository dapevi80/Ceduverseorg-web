// Citas dentro del texto de un módulo. Van como [[ref:<uuid>]] en content_html
// y apuntan a una fila de instructor_course_references del MISMO curso.
//
// El uuid debe ser un uuid bien formado: una marca malformada se ignora en vez
// de contarse como "referencia faltante", porque no es una cita, es texto roto.

const MARCA = /\[\[ref:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]\]/g;

export function extractCitationRefIds(html: string): string[] {
  if (!html) return [];
  const vistos = new Set<string>();
  const orden: string[] = [];
  for (const m of html.matchAll(MARCA)) {
    const id = m[1];
    if (!vistos.has(id)) {
      vistos.add(id);
      orden.push(id);
    }
  }
  return orden;
}

export function validateCitations(
  html: string,
  availableRefIds: string[],
): { ok: true } | { ok: false; missing: string[] } {
  const disponibles = new Set(availableRefIds);
  const missing = extractCitationRefIds(html).filter((id) => !disponibles.has(id));
  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}

export function findModulesCiting(
  refId: string,
  modules: { id: string; title: string; contentHtml: string | null }[],
): { id: string; title: string }[] {
  return modules
    .filter((m) => extractCitationRefIds(m.contentHtml || "").includes(refId))
    .map((m) => ({ id: m.id, title: m.title }));
}
