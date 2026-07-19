// Selección de equipo cuando un usuario (trabajador) puede pertenecer a MÁS
// DE UN equipo (team_users) a la vez — típicamente porque cambió de
// empleador y la membresía vieja nunca se borró.
//
// Antes: server/routes/riesgos.ts resolvía esto con
// `.orderBy(teamUsers.teamId).limit(1)`, que es determinístico pero
// ARBITRARIO — un trabajador con dos membresías siempre reportaba a la que
// ordena primero por id (lexicográfico), sin que el trabajador lo supiera
// ni lo eligiera. Escenario real: cambia de empleador, fotografía un riesgo
// en su empresa ACTUAL B, pero si A ordena primero el hallazgo aparece en
// el dashboard de A — B nunca lo ve, y A (que ya no lo emplea) recibe un
// reporte de un sitio de trabajo con el que no tiene relación, con el
// nombre del trabajador incluido si anonymous=false. Es una fuga hacia el
// empleador equivocado.
//
// Regla: con UNA sola membresía, se usa esa (mismo comportamiento de
// antes — no hay ambigüedad posible con un solo equipo). Con MÁS de una,
// nunca se elige en silencio: se exige un teamId explícito en la petición,
// y ese teamId se valida contra las membresías REALES del propio usuario
// (nunca se confía en lo que mande el cliente tal cual — un id ajeno cuenta
// como si no se hubiera mandado nada).
//
// PURO a propósito: sin DB. El llamador (server/routes/riesgos.ts) junta
// las membresías reales del usuario y se las pasa a esta función.

export type TeamSelectionResult =
  | { ok: true; teamId: string }
  | { ok: false; error: "no_membership" }
  | { ok: false; error: "ambiguous" };

/**
 * `memberTeamIds`: los equipos a los que el usuario REALMENTE pertenece
 * (team_users.team_id, ya consultado por el llamador — este helper no
 * confía en nada que no venga de ahí).
 * `requestedTeamId`: el team_id que mandó el cliente en la petición, o
 * null/undefined/cadena vacía si no mandó ninguno.
 */
export function resolveTeamSelection(
  memberTeamIds: string[],
  requestedTeamId: string | null | undefined,
): TeamSelectionResult {
  if (memberTeamIds.length === 0) return { ok: false, error: "no_membership" };
  if (memberTeamIds.length === 1) return { ok: true, teamId: memberTeamIds[0] };

  if (requestedTeamId && memberTeamIds.includes(requestedTeamId)) {
    return { ok: true, teamId: requestedTeamId };
  }
  return { ok: false, error: "ambiguous" };
}
