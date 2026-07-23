# Reproductor de audio global flotante · Diseño

**Fecha:** 2026-07-23
**Repo:** `ceduverse-web`

## Objetivo

Un **único reproductor de audio para toda la app**, con controles de calidad (play/pausa, atrasar 15 s,
adelantar 30 s, barra de avance clicable, velocidad, cerrar) que **sigue sonando al navegar** entre
pantallas, mostrando **controles flotantes** abajo. Lo usan por igual instructores (editor de
conferencias) y estudiantes (conferencia y Tutor IA).

Sustituye tres implementaciones de audio que hoy conviven y ninguna cumple lo que se pide:
1. **Editor del instructor** (`ModuleCard` en `client/src/pages/instructor-dashboard.tsx:425`):
   `toggleAudio()` hace `new Audio(url)` — solo play/pausa, **sin adelantar/atrasar/barra/velocidad**,
   y como crea el audio al vuelo **se queda pegado al cambiar de módulo/sección**.
2. **Conferencia del alumno** (`StpsPlayer` en `client/src/pages/curso-virtual.tsx:93`): SÍ tiene los
   controles buenos (skip ±15/30, barra, velocidad) + **guarda de anti-adelanto y progreso de escucha**
   para el diploma (95 %). Pero está atado a esa página: al salir, se corta.
3. **Tutor IA del alumno** (`AudioClassPlayer` en `client/src/components/AudioClassPlayer.tsx`):
   `<audio controls>` nativo; **no se pausa al desmontar** (sigue sonando al salir, sin control).

## Antecedente medido (no supuesto)

- La conferencia del alumno reproduce **`course_modules.audioUrl`** (canónico a nivel curso). El editor
  del instructor edita ESE mismo audio (subir voz propia → `audioUrl` empieza con `instructor_`;
  restaurar → vuelve al IA). El pipeline instructor→alumno ya está conectado.
- El Tutor IA usa **`generated_content.audioUrl`** (TTS por alumno, vía `/api/studio/.../audio`) — otra
  tubería, por alumno.
- El `StpsPlayer` trae una **guarda de integridad del diploma**: `onSeeking` recorta a
  `maxListenedSecond + 10 %` y `onListeningProgress` reporta el % escuchado. Esa regla **no se pierde**
  en el rediseño: es un requisito del diploma de participación, no un adorno.

## Arquitectura

Una sola fuente de verdad, montada **por encima del router** para sobrevivir la navegación.

### `AudioPlayerProvider` (contexto)
- Archivo nuevo: `client/src/components/audio/audio-player-context.tsx`.
- Monta **un solo `<audio>`** (elemento imperativo, `useRef`) y el estado: `track | null`, `isPlaying`,
  `currentTime`, `duration`, `playbackRate`.
- Expone vía contexto: `play(track)`, `pause()`, `toggle()`, `stop()`, `seekTo(sec)`, `skip(sec)`,
  `setRate(rate)`, y el estado de lectura para los consumidores.
- Se monta en `client/src/App.tsx` **envolviendo `<Router/>`** (dentro de `TooltipProvider`, junto a
  `AuthProvider`), para que el `<audio>` no se desmonte al cambiar de ruta.

### `FloatingAudioPlayer` (barra flotante)
- Archivo nuevo: `client/src/components/audio/floating-audio-player.tsx`.
- Se renderiza como overlay app-wide (hermano de `<Router/>`, al lado de `<Toaster/>`).
- Visible sólo cuando hay `track`. Muestra: carátula/título de la pista, barra de avance clicable,
  tiempos, y los botones **velocidad · −15 s · play/pausa · +30 s · cerrar**. Reutiliza el diseño y la
  lógica de controles del `StpsPlayer` actual (mismos íconos y comportamiento).
- Responsivo: en móvil, barra compacta abajo; en escritorio, barra centrada.

### Hook `useAudioPlayer()`
- Devuelve el API del contexto. Los consumidores llaman `play({...})` en vez de manejar su propio audio.

## El `AudioTrack` y su política por pista

`play()` recibe un objeto que **lleva su propia política** (aquí vive la diferencia instructor vs alumno):

```ts
type AudioTrack = {
  id: string;              // clave única (p.ej. `course:${courseId}:module:${moduleId}`)
  url: string;             // se resuelve con la MISMA regla del StpsPlayer (ver abajo)
  title: string;
  subtitle?: string;       // instructor / curso
  restrictSeek?: boolean;  // true = guarda anti-adelanto (alumno conferencia). Default false.
  onProgress?: (pct: number) => void; // reporta % escuchado (alumno, para el diploma)
  initialPct?: number;     // reanudar el progreso previo del alumno
};
```

- **Editor del instructor:** `restrictSeek: false`, sin `onProgress`. Escucha libre para revisar.
- **Conferencia del alumno:** `restrictSeek: true`, con `onProgress` + `initialPct` (idéntico a hoy).
- **Tutor IA del alumno:** `restrictSeek: false` (hoy es libre), sin guarda.

**Resolución de URL** (se extrae tal cual del `StpsPlayer`, a un helper compartido
`resolveAudioUrl(url)`): si empieza con `/audio/` o `http` se usa tal cual; si no, se quita el prefijo
`audio-cache/` y se sirve como `/audio/<filename>`.

**Una sola pista a la vez:** al llamar `play()` con otra pista, la anterior se detiene. Correcto: nunca
dos audios encimados.

## Consumidores (puntos de integración)

1. **Editor del instructor** — `ModuleCard`: el botón "Escuchar audio IA / mi audio" llama
   `play({ id, url: resolve(mod.audioUrl), title: mod.title, subtitle: course.title })`. Se elimina
   `toggleAudio`, `playingAudio`, `audioEl` y el `new Audio()`. El botón refleja el estado global
   (`isPlaying && currentTrackId === thisId`).
2. **Conferencia del alumno** — `StpsPlayer` deja de tener su propio `<audio>` y su lógica; pasa a
   llamar `play({ ..., restrictSeek: true, onProgress, initialPct })`. La **guarda de anti-adelanto y
   el reporte de progreso se mueven al provider** (activadas por `restrictSeek`/`onProgress`), para no
   perder el requisito del diploma. La tarjeta grande del reproductor puede quedarse como "disparador"
   visual que refleja el estado global.
3. **Tutor IA del alumno** — `AudioClassPlayer`: el `<audio controls>` nativo se reemplaza por
   `play({ id, url, title })`. Con esto se corrige de paso su fuga (hoy no se pausa al desmontar).

## Arreglo del congelamiento (bundled, prerrequisito para el alumno)

Sin esto, el alumno **no llega** al reproductor en la conferencia: abrir `/conferencias/:slug` congela
la pestaña (reproducido 2×; bloqueo del hilo principal, no excepción).

- Causa: `client/src/components/InfographicView.tsx:227-228` — `parseHtmlToSections(contentHtml)` y
  `extractSummary(contentHtml)` corren **en cada render** creando un `DOMParser` cada vez, sin memoizar.
- Fix: envolver ambos en `useMemo` con dependencia `[contentHtml]`. Cambio quirúrgico, sin tocar la
  lógica de parseo.
- Verificación: abrir una conferencia en prod tras el deploy no debe congelar; el visor de infografía
  se pinta.

## Manejo de errores / bordes

- URL nula o audio que no carga (`onError` del `<audio>`): la barra flotante muestra "Audio no
  disponible" y no deja el estado colgado en "cargando".
- Autoplay bloqueado por el navegador: `play()` captura el rechazo de `audio.play()` y refleja pausado
  (no revienta).
- Cambio de pista mientras suena: se pausa y se resetean tiempos/progreso.
- Cerrar la barra (`stop()`): pausa, limpia `track`, oculta la barra.
- La guarda de anti-adelanto se aplica **solo** con `restrictSeek: true`; en el editor el seek es libre.

## Pruebas

- **Puro/unitario** (vitest): `resolveAudioUrl` (las 3 ramas), y la lógica de la guarda de anti-adelanto
  extraída a función pura (`clampSeek(target, maxListened, duration)`), con tests de que en modo
  restringido no deja pasar de `maxListened + 10 %` y en modo libre no recorta.
- **Manual (post-deploy, con David/Yuridia):** una sola pista suena a la vez; sigue sonando al navegar
  entre pantallas; los controles flotan y responden; el editor escucha libre; el alumno no puede
  adelantar más allá de lo escuchado y su progreso se reporta; abrir una conferencia ya no congela.

## Fuera de alcance (por ahora)

- **Grabación en vivo con micrófono** en el editor (sigue siendo solo subir archivo). Es una pieza
  aparte, ya anotada.
- Cola de reproducción / playlist multi-pista. Solo una pista a la vez.
- Persistir la posición de escucha del alumno del lado servidor más allá de lo que ya hace hoy
  (`course_users.listeningProgress` vía el `onProgress` existente) — se conserva igual, no se amplía.
- Editar título/descripción del curso, agregar/reordenar módulos, o el quiz de la conferencia.

## Decisiones cerradas

- Alcance de persistencia: **toda la app** (decisión de David, opción b).
- **Estudiantes incluidos** (decisión de David): mismos controles flotantes que el instructor.
- Se **conserva** la guarda de integridad del diploma del alumno (anti-adelanto + progreso).
- El arreglo del congelamiento va **en esta misma pieza**.
