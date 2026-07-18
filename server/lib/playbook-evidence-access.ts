// Regla de visibilidad de una foto de evidencia del Playbook — quién puede pedir el
// proxy autenticado GET /api/playbook/evidencia/:evidenceId/foto.
// Sin dependencias de DB/auth a propósito (mismo motivo que playbook-upload.ts: los
// módulos de rutas hacen process.exit(1) si faltan env vars, lo que rompe vitest al
// importarlos directamente) — este predicado puro se testea aparte.

/** Decide si `requesterId` puede ver la foto de evidencia cuyo dueño es `ownerId`.
 * Reglas:
 *  - El dueño siempre puede ver su propia evidencia.
 *  - Alguien de la MISMA empresa/equipo que el dueño (admin/empresa_rh) puede verla,
 *    SIEMPRE que `requesterTeamMemberIds` (los miembros del equipo del solicitante,
 *    obtenidos vía getEmpresaTeam) incluya a `ownerId`.
 *  - Cualquier otro caso → false. En particular: sin equipo (null/undefined) o equipo
 *    vacío NUNCA otorgan acceso — nunca hay un camino donde la ausencia de datos se
 *    traduzca en "sí" ([[feedback_no_silent_degradation]]).
 */
export function canViewEvidence(params: {
  requesterId: string;
  ownerId: string;
  requesterTeamMemberIds: string[] | null | undefined;
}): boolean {
  const { requesterId, ownerId, requesterTeamMemberIds } = params;
  if (requesterId === ownerId) return true;
  if (!requesterTeamMemberIds || requesterTeamMemberIds.length === 0) return false;
  return requesterTeamMemberIds.includes(ownerId);
}
