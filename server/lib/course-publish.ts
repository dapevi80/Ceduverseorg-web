// "Confirmada" significa que una persona respondió por la referencia. Por eso un
// curso no se publica mientras quede bibliografía sin verificar: publicar es el
// momento en que el contenido deja de ser borrador y lo ve un alumno.
//
// Un curso sin bibliografía sí se publica: no todos los cursos citan fuentes.

export function canPublish(
  refs: { id: string; title: string; verifiedByInstructor: boolean }[],
): { ok: true } | { ok: false; unverified: { id: string; title: string }[] } {
  const unverified = refs
    .filter((r) => !r.verifiedByInstructor)
    .map((r) => ({ id: r.id, title: r.title }));
  return unverified.length === 0 ? { ok: true } : { ok: false, unverified };
}
