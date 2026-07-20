/**
 * Qué hacer cuando una empresa quiere sumar a alguien a su equipo.
 *
 * Vive fuera de la ruta y recibe hechos ya resueltos, para que la regla se
 * pueda testear sin base de datos (mismo patrón que `cert-request-gate.ts`).
 *
 * **La regla que sostiene todo esto: la membresía sólo nace de un acto de la
 * persona invitada.** Antes, si el correo ya tenía cuenta en Ceduverse, el
 * endpoint insertaba la membresía directo —sin token, sin correo, sin aviso—
 * con la buena intención de evitarle al admin un callejón sin salida. El
 * efecto real era que cualquier admin de empresa podía anexar a su equipo a
 * cualquier usuario de la plataforma con sólo saber su correo, y con eso ver
 * su nombre, sus cursos y su avance (`GET /api/teams/:id/progress`). El
 * correo de una persona no es un secreto; su consentimiento sí importa.
 *
 * Por eso `tieneCuentaEnCeduverse` NO cambia el desenlace: sólo sirve para
 * saber si hay que buscar membresía previa. Tener cuenta te ahorra el registro
 * al aceptar, no el aceptar.
 *
 * El tipo de retorno deliberadamente NO tiene un caso de "anexar directo": no
 * es una rama que esté apagada, es una rama que no existe.
 */

/** Hechos que la ruta resuelve contra la base antes de decidir. */
export interface InvitationFacts {
  /** ¿El correo ya corresponde a un usuario de Ceduverse? */
  tieneCuentaEnCeduverse: boolean;
  /** ¿Ese usuario ya pertenece a ESTE equipo? */
  yaEsMiembroDelEquipo: boolean;
  /** ¿Ya hay una invitación `pending` de este equipo para ese correo? */
  yaTieneInvitacionPendiente: boolean;
}

export type InvitationDecision =
  | { accion: "invitar" }
  | { accion: "ya_es_miembro" }
  | { accion: "ya_invitado"; puedeReenviar: true };

export function decideInvitation(facts: InvitationFacts): InvitationDecision {
  // Ser miembro gana sobre todo lo demás: no hay nada que invitar.
  if (facts.yaEsMiembroDelEquipo) return { accion: "ya_es_miembro" };

  // Ya hay una invitación viva — que el admin la reenvíe en vez de crear otra.
  if (facts.yaTieneInvitacionPendiente) return { accion: "ya_invitado", puedeReenviar: true };

  // Todos los demás casos, tenga cuenta o no, terminan igual: se invita y la
  // persona decide.
  return { accion: "invitar" };
}
