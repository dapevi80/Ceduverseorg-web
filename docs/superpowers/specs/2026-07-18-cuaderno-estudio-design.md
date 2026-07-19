# Cuaderno de estudio del curso (rediseño del PDF del Playbook) — Design

**Fecha:** 2026-07-18
**Producto:** Ceduverse — Tutor IA
**Decisiones:** David
**Estado:** Borrador para revisión. No implementar hasta aprobación.
**Reemplaza:** la parte "export PDF" de `2026-07-18-playbook-design.md` (§4.6). El resto de ese spec —evidencias, QR, logros— sigue vigente.

---

## 1. Problema

El PDF que se construyó es un **resumen con QR**: cuatro listas cortas (objetivos, resumen, estrategias, preguntas) y luego una página por ejercicio dominada por su código QR. Al verlo impreso, el dueño identificó tres fallas:

1. **No es material de estudio.** El texto se acaba en las primeras páginas; el resto son ejercicios. No sirve para repasar el curso.
2. **No se puede trabajar encima.** No hay espacio para escribir, subrayar, ni formatos para llenar.
3. **No parece Ceduverse.** Causa concreta: el generador usa **Helvetica**; la marca es **DM Serif Display** + **Plus Jakarta Sans**, que nunca se incrustaron. Y no aparece nada del lenguaje gráfico de la landing (línea fina geométrica).

**Corrección de encuadre (David):** el objetivo real es **dejar material de repaso y estudio** — lo que sustituye a las hojas fotocopiadas o al PowerPoint de una capacitación. **La actividad del QR es OPCIONAL** y no debe organizar el documento: da logros y puntos, y ya cada empresa decide si los premia. Si nadie escanea un QR, el cuaderno debe valer igual por sí solo.

## 2. Objetivo

Un **cuaderno de trabajo imprimible** con el curso completo, módulo por módulo, en el que se pueda estudiar y escribir a mano.

## 3. Decisiones tomadas (David, 2026-07-18)

- **Edición personal (opción B).** El cuaderno se arma **cuando el alumno lo descarga**, con **su** contenido personalizado (la clase que el Tutor IA le escribió a su puesto e industria, su mapa mental, su examen). No se pre-imprime para un grupo.
  - Los módulos que aún no ha tomado salen con el **contenido base del curso**, marcado como tal (§6.3). Nunca se presenta contenido base como si fuera personalizado.
  - La **edición de curso** (perfil neutro, para que una empresa imprima juegos) queda **fuera de alcance**, para cuando una empresa la pida.
- **Ilustración: lenguaje geométrico**, el de la landing (figuras, líneas, retículas). **No** hay ilustración dibujada ni fotos por tema; si algún día se quieren, es encargo de diseño aparte.
- El QR y su ejercicio van **al margen y en chico**, como invitación opcional.

## 4. Sistema visual

### 4.1 Tipografía (la corrección de fondo)
Incrustar las fuentes reales vía `doc.registerFont()`:
- **DM Serif Display** → títulos, numerales de capítulo, portada. Paquete `@fontsource/dm-serif-display` (v5.2.8).
- **Plus Jakarta Sans** → texto corrido, etiquetas, tablas. Paquete `@fontsource/plus-jakarta-sans` (v5.2.8). Se necesitan regular y bold.
- Ambas de licencia libre (SIL OFL), incrustables sin problema.
- **Corrección verificada al implementar:** estos paquetes NO traen `.ttf`, sólo `.woff`/`.woff2`. Y `.woff2` con texto acentuado revienta fontkit (`RangeError` al cerrar el documento), así que se incrustan los **`.woff`**.

### 4.2 Paleta (valores exactos ya en uso)
`cedu-ink #1a1a2e` · `cedu-ink-muted #7a7a99` · `cedu-cream #faf8f4` · `cedu-blue #1b5adf` · `cedu-orange #f28023` · `cedu-violet #7c3aed` · `cedu-green #00b87a`, más los tintes `-light` para fondos de caja.
Cada módulo toma **un color de acento rotando** entre azul, naranja, violeta y verde, como hace la landing por sección.

### 4.3 Motivos gráficos (todos reproducibles con primitivas de pdfkit)
Tomados de `client/src/pages/landing.tsx`:
- **Retícula de puntos** (`dot-grid-bg`): puntos de 1px cada 28px, opacidad ~7%, como textura de portada y portadillas.
- **Hexágono de contorno**: `M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z`, trazo 1.5, opacidad 30%, como ornamento de esquina.
- **Conector punteado con punta de flecha**: `strokeDasharray 6 4` + triángulo de cierre. Ya existe en `server/kit-pdf.ts::drawFlow()` — se reutiliza para diagramas y mapas conceptuales.
- **Tarjetas**: esquina redondeada grande, borde capilar `rgba(0,0,0,0.06)`, barra de acento de color.
- **Numeral fantasma**: número de módulo en serif enorme al 4% de opacidad detrás de la portadilla.
- Los *blobs* animados de la web no se traducen a papel: en su lugar, **bandas de tinte suave** del color del módulo.

## 5. De dónde sale cada pieza

| Pieza del cuaderno | Fuente | Alcance |
|---|---|---|
| Texto de la clase | `generated_content.lectureHtml` (2,300-3,000 palabras/módulo) | por usuario |
| Mapa conceptual | `generated_content.mindMap` — `{central, branches[{label,color?,children[{label,detail?}]}]}` | por usuario |
| Preguntas de reflexión | `generated_content.reflections` | por usuario |
| Autoevaluación | `generated_content.adaptiveQuiz` (7 preguntas con opciones y explicación) | por usuario |
| Fuentes sugeridas | `generated_content.suggestedSources` | por usuario |
| Contenido base (respaldo) | `studio_modules.contentHtml` | por curso |
| Referencias del módulo | `studio_modules.references` (`text[]`, verbatim) | por curso |
| Guía de estudio inicial | `course_playbooks.content` (objetivos, resumen, estrategias, preguntas) | por curso |
| Ejercicios de campo + QR | `course_playbooks.exercises` | por curso |

**Regla anti-invención (se mantiene):** las referencias se imprimen **verbatim**; el cuaderno no agrega ni inventa fuentes. Van **por módulo** y **consolidadas al final**.

## 6. Estructura del documento

### 6.1 Preliminares
1. **Portada** — retícula de puntos, ícono y título del curso, nombre del alumno, instructor, fecha.
2. **Cómo usar este cuaderno** — media página: qué encontrará, que puede escribir encima, y que las actividades con QR son **opcionales** y dan logros.
3. **Índice** con números de página.
4. **Guía de estudio del curso** — objetivos, resumen, estrategias y preguntas del `course_playbooks` existente (así no se tira lo ya construido).

### 6.2 Un capítulo por módulo
1. **Portadilla**: numeral fantasma, título, objetivos del módulo, banda de tinte del color asignado.
2. **La clase completa**, maquetada para leer: jerarquía de títulos, párrafos, listas, tablas y citas — con **margen ancho para anotar** (columna lateral de ~110pt con renglones tenues).
3. **Mapa conceptual dibujado** desde `mindMap`: nodo central, ramas con su color, hijos con su detalle, unidos por los conectores punteados.
4. **Conceptos clave**: cajas con barra de acento.
5. **Reflexiona y escribe**: cada pregunta de `reflections` con **renglones reales** para contestar a mano.
6. **Formato para llenar**: una tabla o lista de verificación vacía por módulo, derivada del tema.
7. **Autoevaluación**: las 7 preguntas con sus opciones y espacio para marcar. **Las respuestas y explicaciones van al final del libro**, no junto a la pregunta.
8. **Actividad opcional** (si el módulo tiene ejercicio): bloque **al margen**, chico, con su QR y una línea de instrucción. No ocupa página propia.
9. **Referencias del módulo**.

### 6.3 Módulos aún no tomados
Salen con el `contentHtml` base y un **aviso explícito**: "Este módulo todavía no lo has tomado en el Tutor IA: aquí va el contenido base del curso. Cuando lo tomes, tu cuaderno lo incluirá personalizado a tu puesto." Nunca se presenta como personalizado ([[feedback_no_silent_degradation]]).

### 6.4 Cierre
- **Respuestas de las autoevaluaciones**, por módulo.
- **Todas las referencias del curso**, consolidadas.
- Página de notas libres.

## 7. El trabajo técnico de fondo

`lectureHtml` es **HTML** (`h2/h3/p/ul/ol/table/blockquote/strong/em`) y hoy el generador de PDF sólo sabe imprimir arreglos de texto. La pieza central de este rediseño es un **renderizador de HTML a pdfkit**: recorrer el árbol y emitir cada nodo con su estilo, respetando saltos de página y sin partir un bloque a la mitad (ya existe el patrón `ensureSpace()` en `kit-pdf.ts`). Las **tablas** son el caso más laborioso.

Es el mayor riesgo de esfuerzo del rediseño y conviene aislarlo en su propio módulo, con pruebas.

## 8. Manejo de errores (cero mock)
- Sin `course_playbooks` → el cuaderno se genera igual con los módulos; no se inventa la guía de estudio.
- Módulo sin contenido personalizado ni base → se imprime la portadilla con el aviso, no una página en blanco silenciosa.
- Fallo al dibujar el mapa conceptual (datos incompletos) → se omite la figura y se listan las ramas como texto; nunca un recuadro vacío.
- Fallo de la descarga → error explícito al usuario, no un PDF a medias.

## 9. Parámetros
```
PAGINA            = LETTER (612x792)
MARGENES          = 54pt sup, 62pt inf (pie de pagina), 54pt izq
COLUMNA_TEXTO     = 330pt
COLUMNA_NOTAS     = 172pt (separada 18pt del texto), renglones al 8% de opacidad
                    -- David 2026-07-18: 130pt se sentia reducido para escribir
PIE_DE_PAGINA     = numero de pagina + nombre del curso, en todas menos la portada
RENGLON           = 22pt de interlínea para escritura a mano
COLORES_MODULO    = [blue, orange, violet, green] rotando
FUENTES           = DM Serif Display (títulos) / Plus Jakarta Sans (texto)
```

## 10. Alcance y expectativas
- Un curso de 8-10 módulos con clases de 2,500 palabras da un cuaderno de **60 a 100 páginas**. Es el resultado buscado, no un efecto secundario.
- La generación **no cuesta llamadas de IA**: todo el contenido ya existe en la base. Sólo es render.
- Se genera bajo demanda al descargar (sin caché por ahora: el contenido cambia conforme el alumno avanza).

## 11. Fuera de alcance
- **Edición de curso / perfil neutro** para imprimir en grupo (fase 2, cuando una empresa lo pida).
- Ilustración dibujada o fotografías por tema.
- Traducción del cuaderno a otros idiomas.

## 12. Pruebas
- HTML→PDF: encabezados, listas anidadas, tablas, citas y negritas se renderizan; ningún bloque queda partido; sin páginas en blanco.
- Mapa conceptual: se dibuja desde un `mindMap` real; con `color`/`detail` ausentes usa valores por defecto.
- Módulo no tomado: aparece el aviso, y el contenido base no se presenta como personalizado.
- Referencias: las impresas coinciden **verbatim** con `studio_modules.references`; ninguna inventada.
- Respuestas del examen: no aparecen junto a las preguntas, sólo al final.
- Tipografía: el PDF incrusta DM Serif Display y Plus Jakarta Sans (verificable en las propiedades del archivo).
- Un curso con un solo módulo y uno con doce se renderizan sin romperse.
