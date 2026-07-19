# Detector de riesgos — Design

**Fecha:** 2026-07-18
**Producto:** Ceduverse — Tutor IA / Panel de empresa
**Decisiones:** David
**Estado:** APROBADO por David (2026-07-18).
**Reemplaza:** la actividad de campo del playbook (`2026-07-18-playbook-design.md` §4.4). La infraestructura construida ahí se recicla; el sentido cambia.

---

## 1. Problema y objetivo

La actividad que construimos era *"haz el ejercicio y sube tu foto"*: valor para el alumno, **valor cero para la empresa**. Un tablero lleno de fotos de tareas no le sirve a nadie.

**La idea de David:** convertir a cada trabajador capacitado en **un par de ojos que detectan incumplimientos reales**. El que acaba de estudiar la NOM-006 camina por su planta y reporta la calza que falta, la plataforma sin mantenimiento, la rampa mal alineada.

**Objetivo:** que la capacitación produzca **hallazgos accionables** y un **historial documentado de cumplimiento**, y que el trabajador reciba reconocimiento por encontrarlos.

## 2. Decisiones tomadas (David, 2026-07-18)

1. **Reemplaza** la actividad de campo. Un solo flujo claro: detectar y reportar.
2. **El anonimato lo elige el trabajador en cada reporte.** Los hallazgos incómodos van anónimos; los que quiere que le reconozcan, firmados.
3. **Foto + descripción libre; la IA sugiere la norma**, eligiendo SOLO entre las referencias reales del curso, y el trabajador confirma o corrige.
4. **Ciclo completo con evidencia de solución:** estados y foto del riesgo ya corregido.
5. *(Propuesta aceptada)* **Los puntos se acreditan cuando la empresa valida el hallazgo**, no al enviarlo.
6. *(Propuesta aceptada)* El canal vive **también fuera del curso**, disponible desde el panel del trabajador.
7. *(Propuesta aceptada)* El **historial de cumplimiento** es el entregable de valor para la empresa.

## 3. Advertencia honesta que sostiene el diseño

**El anonimato tiene un límite físico:** en un taller de ocho personas, la foto de una máquina específica identifica a quien la tomó, por más que ocultemos el nombre. Por eso la decisión es *"lo elige el trabajador"* y no *"prometemos anonimato"* — el trabajador es quien mejor juzga si un hallazgo lo expone.

El sistema **no debe prometer más de lo que puede cumplir**. La pantalla de reporte lo dice con esas palabras.

## 4. Flujo

```
TRABAJADOR
  escanea el QR del cuaderno (o entra desde su panel)
  → toma la foto
  → describe en sus palabras
  → la IA propone la norma (solo de las referencias reales del curso) → confirma o corrige
  → elige: con mi nombre / anónimo
  → envía                                    [estado: nuevo, puntos: 0]

EMPRESA (admin/empresa_rh de su propio equipo)
  ve el hallazgo: foto, descripción, norma, fecha  [sin nombre si es anónimo]
  → en revisión
  → atendido  + FOTO del riesgo corregido          [se acreditan los puntos]
     ó descartado + motivo escrito (obligatorio)   [no se acreditan]

TRABAJADOR
  ve el estado de su hallazgo (aunque lo mandó anónimo) y sus puntos
```

## 5. Modelo de datos

**`risk_findings`** (nueva). `playbook_evidence` queda retirada: nunca tuvo datos en producción.

| Columna | Tipo | Nota |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | **siempre** se guarda (puntos, antiabuso); no se expone si es anónimo |
| anonymous | boolean not null | elección del trabajador en ESE reporte |
| team_id | **text** FK → teams | la empresa que lo recibe; se resuelve al reportar. (`teams.id` es text en todo el schema, no uuid — corregido al implementar) |
| course_slug | text FK → studio_courses, nullable | de dónde salió (null si reportó fuera de un curso) |
| photo_key | text not null | llave R2, nunca URL pública |
| description | text not null | palabras del trabajador |
| norm_ref | text | la norma confirmada, **verbatim** de las referencias del curso |
| status | text not null | `nuevo` \| `en_revision` \| `atendido` \| `descartado` |
| resolution_photo_key | text nullable | foto del riesgo corregido (obligatoria para `atendido`) |
| resolution_note | text nullable | **obligatoria** para `descartado` |
| points_awarded | integer not null default 0 | se llena al pasar a `atendido` |
| created_at / updated_at / resolved_at | timestamptz | |
| resolved_by | uuid FK → users, nullable | quién de la empresa lo cerró |

Índices: `(team_id, status)` para el tablero; `(user_id)` para "mis hallazgos".

## 6. El anonimato, implementado de verdad

**Regla dura:** si `anonymous = true`, la identidad **no sale del servidor**. No se manda oculta ni "para uso interno del cliente" — cualquiera abre las herramientas del navegador y la lee.

- El endpoint de la empresa **selecciona columnas explícitamente** y omite `user_id`, nombre y correo cuando `anonymous = true`.
- El trabajador ve sus propios hallazgos (anónimos incluidos) porque la consulta va por su sesión.
- La foto sigue sirviéndose por el **proxy autenticado ya construido** (nunca URL pública de R2), y su nombre de archivo no puede contener el `user_id` cuando es anónimo — hoy la llave incluye el id del usuario; **para hallazgos anónimos la llave usa el id del hallazgo**, no el del usuario.

## 7. La sugerencia de norma (anti-invención)

La IA recibe: la descripción del trabajador + **la lista de referencias reales del módulo/curso** (`studio_modules.references`, verbatim). Devuelve **cuál de esas** aplica, o ninguna. **No puede escribir una norma que no esté en la lista** — la validación lo verifica antes de guardar.

Si el reporte se hace fuera de un curso, se ofrecen las referencias de los cursos que el trabajador ha tomado. Si no hay coincidencia, `norm_ref` queda vacío: **un hallazgo sin norma sigue siendo válido**, lo que no es válido es inventarle una.

## 8. Puntos y logros

- `RIESGO_VALIDADO_PUNTOS = 150` — al pasar a `atendido`.
- Descartado: **0 puntos**, sin penalización.
- Logro `detector-riesgos-<n>` por acumulado (primer hallazgo validado, 5, 10...), con el sistema de logros existente.
- **Antiabuso resuelto por diseño:** como los puntos dependen de la validación de la empresa, subir mil fotos de nada no da nada. No hace falta tope por usuario.

## 9. Qué buscar (reciclaje de lo generado)

Los `course_playbooks.exercises` que la IA ya genera se **reencuadran**: dejan de ser "tareas" y pasan a ser **"señales de riesgo que puedes detectar después de este módulo"** — una guía de qué mirar. Aparecen en el cuaderno junto al QR y precargan el reporte. No se tira la generación ya construida.

## 10. El historial de cumplimiento (valor para la empresa)

Vista y exportable: *"riesgo detectado el 12 de marzo, corregido el 14, con foto de ambos momentos y la norma citada"*. Es el respaldo documental que sirve ante una inspección de la STPS y, en la práctica, vale más que la constancia de capacitación.

## 11. Reúso de lo ya construido

| Necesidad | Se reutiliza |
|---|---|
| Subida de foto validada (allowlist, 8 MB, sin SVG) | `server/lib/playbook-upload.ts` + middleware de multer |
| Foto privada | proxy autenticado `GET .../foto` + `canViewEvidence` (se adapta a hallazgos) |
| Alcance por empresa | `getEmpresaAdminTeam` (membresía real de admin/empresa_rh) |
| Puntos y logros | `achievements` / `achievement_users`, `awardAchievement` |
| Pestaña de empresa | `team-playbook-evidence-tab.tsx` (cambia contenido y estados) |
| Página del QR | `playbook-exercise.tsx` (cambia a flujo de reporte) |

## 12. Manejo de errores (cero mock)
- Trabajador sin empresa → mensaje honesto: esta función requiere pertenecer a una empresa. No se guarda un hallazgo huérfano.
- Falla la sugerencia de IA → se guarda **sin norma**, nunca con una inventada.
- Falla la subida a R2 → error explícito; no se registra un hallazgo que apunte a una foto inexistente.
- `atendido` sin foto de solución → rechazado con mensaje claro.
- `descartado` sin motivo → rechazado con mensaje claro.

## 13. Pendientes fuera de lo técnico
- **DECIDIDO (David, 2026-07-18):** si una empresa solicita la identidad de un reportante anónimo, **Ceduverse NO la entrega** — el trabajador podría verse vulnerado. La política aplica también al personal interno de Ceduverse, no sólo a los endpoints.
  - **Para Daniel:** redactar esta política en los términos con la empresa y en el aviso al trabajador, para que no sea sólo una decisión de producto sino un compromiso escrito y oponible.
  - **Límite honesto:** la identidad SÍ existe en la base (hace falta para acreditar puntos y para que el trabajador vea sus hallazgos). O sea, la protección es de política y control de acceso, no de imposibilidad técnica: un administrador de Ceduverse con acceso a la base puede consultarla. Si se quiere endurecer, el siguiente paso es auditar todo acceso a esa columna. No se debe prometer al trabajador más de lo que la arquitectura sostiene.
- Texto de la pantalla de reporte, que debe decir con claridad el límite del anonimato (§3).

## 14. Fuera de alcance
- Notificaciones automáticas a la empresa (correo/WhatsApp) al llegar un hallazgo — fase 2.
- Priorización automática por gravedad con IA — fase 2; por ahora la empresa juzga.
- Reportes de riesgo por parte de la empresa hacia el trabajador.

## 15. Pruebas
- **Anonimato:** un hallazgo anónimo consultado por el endpoint de la empresa **no trae** user_id, nombre ni correo en ninguna parte de la respuesta; uno firmado sí.
- **Llave de la foto** de un hallazgo anónimo no contiene el id del usuario.
- **Norma:** la IA no puede guardar una norma fuera de las referencias reales; sin coincidencia, queda vacía.
- **Puntos:** 0 al enviar; se acreditan sólo al pasar a `atendido`; descartar no acredita; reabrir no duplica.
- **Estados:** `atendido` exige foto de solución; `descartado` exige motivo.
- **Alcance:** la empresa sólo ve hallazgos de su propio equipo; un trabajador sólo ve los suyos.
- **Sin empresa:** el flujo se detiene con mensaje honesto, sin escribir en la base.
