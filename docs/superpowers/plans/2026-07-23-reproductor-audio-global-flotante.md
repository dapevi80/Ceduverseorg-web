# Reproductor de audio global flotante · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un solo reproductor de audio para toda la app, con controles de calidad y barra flotante que sigue sonando al navegar, usado por instructores (editor) y estudiantes (conferencia y Tutor IA); incluye el arreglo del congelamiento de la conferencia.

**Architecture:** Un `AudioPlayerProvider` (contexto React) monta un único `<audio>` por encima del router en `App.tsx`, así el audio sobrevive la navegación. Una barra `FloatingAudioPlayer` app-wide refleja y controla ese audio. La lógica pura (resolución de URL, guarda de anti-adelanto) vive en `client/src/lib/audio-url.ts` con tests. Los tres reproductores actuales (editor, `StpsPlayer`, `AudioClassPlayer`) dejan de manejar su propio audio y llaman al provider.

**Tech Stack:** React 19 + wouter · TypeScript · vitest · lucide-react · Tailwind. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-07-23-reproductor-audio-global-flotante-design.md`

## Global Constraints

- **Una sola pista suena a la vez** en toda la app. `play()` con otra pista detiene la anterior.
- **El `<audio>` se monta por encima de `<Router/>`** en `App.tsx` — si se desmonta al navegar, se pierde todo el objetivo.
- **Se conserva la guarda de integridad del diploma** del alumno: con `restrictSeek: true`, no se puede adelantar más allá de `maxListenedSecond + duración*0.1`; con `onProgress`, se reporta el % escuchado. El instructor va sin guarda (`restrictSeek: false`).
- **Resolución de URL** idéntica a la de hoy: `/audio/` o `http` → tal cual; si no → quitar prefijo `audio-cache/` y servir `/audio/<filename>`.
- Comandos: `npx vitest run <ruta>` (tests), `npx tsc --noEmit` (tipos), `npm run build`, `npm run smoke:boot`.
- No commitear scripts de verificación.

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `client/src/lib/audio-url.ts` | `resolveAudioUrl` y `clampSeek` (puros) |
| `client/src/lib/audio-url.test.ts` | Tests de los dos |
| `client/src/components/audio/audio-player-context.tsx` | `AudioPlayerProvider` + `useAudioPlayer` + tipo `AudioTrack` |
| `client/src/components/audio/floating-audio-player.tsx` | Barra flotante app-wide |
| `client/src/App.tsx` | Montar provider (sobre `Router`) + barra |
| `client/src/components/InfographicView.tsx` | Fix del congelamiento (memoizar el parseo) |
| `client/src/pages/instructor-dashboard.tsx` | `ModuleCard` usa el provider |
| `client/src/pages/curso-virtual.tsx` | `StpsPlayer` usa el provider |
| `client/src/components/AudioClassPlayer.tsx` | Usa el provider |

---

### Task 1: Lógica pura de audio (URL + guarda), TDD

**Files:**
- Create: `client/src/lib/audio-url.ts`
- Test: `client/src/lib/audio-url.test.ts`

**Interfaces:**
- Produces:
  - `resolveAudioUrl(url: string | null | undefined): string | null`
  - `clampSeek(target: number, maxListenedSecond: number, duration: number): number`

- [ ] **Step 1: Escribir el test primero**

Crear `client/src/lib/audio-url.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveAudioUrl, clampSeek } from "./audio-url";

describe("resolveAudioUrl", () => {
  it("devuelve null si no hay url", () => {
    expect(resolveAudioUrl(null)).toBeNull();
    expect(resolveAudioUrl(undefined)).toBeNull();
    expect(resolveAudioUrl("")).toBeNull();
  });
  it("respeta rutas /audio/ y http(s)", () => {
    expect(resolveAudioUrl("/audio/x.mp3")).toBe("/audio/x.mp3");
    expect(resolveAudioUrl("https://cdn/x.mp3")).toBe("https://cdn/x.mp3");
  });
  it("quita el prefijo audio-cache/ y sirve bajo /audio/", () => {
    expect(resolveAudioUrl("audio-cache/instructor_abc.mp3")).toBe("/audio/instructor_abc.mp3");
  });
  it("un nombre pelado se sirve bajo /audio/", () => {
    expect(resolveAudioUrl("instructor_abc.mp3")).toBe("/audio/instructor_abc.mp3");
  });
});

describe("clampSeek", () => {
  it("no deja pasar de maxListened + 10% de la duracion", () => {
    // maxAllowed = 10 + 60*0.1 = 16
    expect(clampSeek(100, 10, 60)).toBe(16);
  });
  it("deja pasar un objetivo por debajo del techo", () => {
    expect(clampSeek(5, 10, 60)).toBe(5);
  });
  it("con duracion 0 el techo es maxListened", () => {
    expect(clampSeek(100, 8, 0)).toBe(8);
  });
});
```

- [ ] **Step 2: Correr el test y verlo fallar**

Run: `npx vitest run client/src/lib/audio-url.test.ts`
Expected: FAIL — `Failed to resolve import "./audio-url"`.

- [ ] **Step 3: Implementar**

Crear `client/src/lib/audio-url.ts`:

```ts
// Resolución de la URL de audio: misma regla que usaba el StpsPlayer. El backend
// guarda unas veces la ruta completa (/audio/... o http) y otras solo el nombre
// (con o sin prefijo audio-cache/), que se sirve estáticamente bajo /audio/.
export function resolveAudioUrl(url: string | null | undefined): string | null {
  const raw = (url || "").trim();
  if (!raw) return null;
  if (raw.startsWith("/audio/") || raw.startsWith("http")) return raw;
  const filename = raw.replace(/^audio-cache\//, "");
  return `/audio/${filename}`;
}

// Guarda de integridad del diploma: el alumno no puede adelantar más allá de lo
// que ya escuchó, con un margen del 10% de la duración. Función pura para poder
// probarla; el provider la aplica solo cuando la pista trae restrictSeek.
export function clampSeek(target: number, maxListenedSecond: number, duration: number): number {
  const maxAllowed = maxListenedSecond + duration * 0.1;
  return Math.min(target, maxAllowed);
}
```

- [ ] **Step 4: Correr el test y verlo pasar**

Run: `npx vitest run client/src/lib/audio-url.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/audio-url.ts client/src/lib/audio-url.test.ts
git commit -m "feat(audio): helpers puros resolveAudioUrl + clampSeek con pruebas"
```

---

### Task 2: Fix del congelamiento de la conferencia (memoizar el parseo)

**Files:**
- Modify: `client/src/components/InfographicView.tsx:227-228`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: nada nuevo (mismo render, sin recomputar en cada pasada).

- [ ] **Step 1: Leer el estado actual**

En `client/src/components/InfographicView.tsx`, el cuerpo del componente hoy hace (líneas ~227-228):

```tsx
export default function InfographicView({ contentHtml, moduleTitle }: { contentHtml: string; moduleTitle: string; }) {
  const sections = parseHtmlToSections(contentHtml);
  const summary = extractSummary(contentHtml);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
```

`parseHtmlToSections` y `extractSummary` crean un `DOMParser` y recorren el DOM **en cada render**. En la conferencia esto bloquea el hilo principal y congela la pestaña.

- [ ] **Step 2: Memoizar ambos cálculos**

Asegurar que `useMemo` esté importado desde `react` al inicio del archivo (hoy importa `useState`; añadir `useMemo`). Reemplazar las dos líneas por:

```tsx
export default function InfographicView({ contentHtml, moduleTitle }: { contentHtml: string; moduleTitle: string; }) {
  const sections = useMemo(() => parseHtmlToSections(contentHtml), [contentHtml]);
  const summary = useMemo(() => extractSummary(contentHtml), [contentHtml]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
```

(No se toca la lógica de `parseHtmlToSections` ni `extractSummary`.)

- [ ] **Step 3: Verificar tipos y build**

Run: `npx tsc --noEmit && npm run build`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/InfographicView.tsx
git commit -m "fix(conferencia): memoizar parseo de infografia (arregla el congelamiento al abrir)"
```

Nota: la confirmación de que la conferencia ya no congela es manual en prod (Task 8, checklist), porque el síntoma es de rendimiento de render, no una aserción unitaria.

---

### Task 3: AudioPlayerProvider + useAudioPlayer

**Files:**
- Create: `client/src/components/audio/audio-player-context.tsx`
- Modify: `client/src/App.tsx` (envolver `<Router/>`)

**Interfaces:**
- Consumes: `resolveAudioUrl`, `clampSeek` (Task 1).
- Produces:
  - `type AudioTrack = { id: string; url: string; title: string; subtitle?: string; restrictSeek?: boolean; onProgress?: (pct: number) => void; initialPct?: number }`
  - `AudioPlayerProvider({ children }): JSX.Element`
  - `useAudioPlayer(): { track: AudioTrack | null; isPlaying: boolean; currentTime: number; duration: number; playbackRate: number; play(t: AudioTrack): void; pause(): void; toggle(t: AudioTrack): void; stop(): void; seekToPct(pct: number): void; skip(sec: number): void; cycleRate(): void }`

- [ ] **Step 1: Crear el provider**

Crear `client/src/components/audio/audio-player-context.tsx`:

```tsx
import { createContext, useContext, useRef, useState, useCallback, useEffect, type ReactNode } from "react";
import { resolveAudioUrl, clampSeek } from "@/lib/audio-url";

export type AudioTrack = {
  id: string;                          // clave única, p.ej. `course:${courseId}:module:${moduleId}`
  url: string;                         // se resuelve con resolveAudioUrl
  title: string;
  subtitle?: string;
  restrictSeek?: boolean;              // guarda anti-adelanto (alumno). Default false.
  onProgress?: (pct: number) => void;  // reporta % escuchado (alumno, diploma)
  initialPct?: number;                 // reanudar progreso previo
};

type AudioPlayerApi = {
  track: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  play: (t: AudioTrack) => void;
  pause: () => void;
  toggle: (t: AudioTrack) => void;
  stop: () => void;
  seekToPct: (pct: number) => void;
  skip: (sec: number) => void;
  cycleRate: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerApi | null>(null);
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function useAudioPlayer(): AudioPlayerApi {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer debe usarse dentro de AudioPlayerProvider");
  return ctx;
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (audioRef.current === null && typeof Audio !== "undefined") {
    const a = new Audio();
    a.preload = "metadata";
    audioRef.current = a;
  }

  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Espejo en ref para que los listeners (registrados una vez) vean la pista viva.
  const trackRef = useRef<AudioTrack | null>(null);
  trackRef.current = track;
  const rateRef = useRef(1);
  rateRef.current = playbackRate;

  // Guarda de escucha (solo relevante con restrictSeek/onProgress).
  const maxListenedSecond = useRef(0);
  const listenedSegments = useRef<Set<number>>(new Set());
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      const ct = audio.currentTime;
      const dur = audio.duration || 0;
      setCurrentTime(ct);
      const diff = ct - lastTimeRef.current;
      if (diff > 0 && diff < 2) {
        const seg = Math.floor(ct);
        listenedSegments.current.add(seg);
        if (seg > maxListenedSecond.current) maxListenedSecond.current = seg;
        const t = trackRef.current;
        if (t?.onProgress && dur > 0) {
          t.onProgress((listenedSegments.current.size / Math.ceil(dur)) * 100);
        }
      }
      lastTimeRef.current = ct;
    };
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => setIsPlaying(false);
    const onSeeking = () => {
      const t = trackRef.current;
      if (!t?.restrictSeek) return;
      const dur = audio.duration || 0;
      const allowed = clampSeek(audio.currentTime, maxListenedSecond.current, dur);
      if (audio.currentTime > allowed) audio.currentTime = allowed;
    };
    const onSeeked = () => { lastTimeRef.current = audio.currentTime; };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("seeking", onSeeking);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("seeking", onSeeking);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  const play = useCallback((t: AudioTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    const resolved = resolveAudioUrl(t.url);
    if (!resolved) return;
    if (trackRef.current?.id !== t.id) {
      audio.src = resolved;
      maxListenedSecond.current = 0;
      listenedSegments.current = new Set();
      lastTimeRef.current = 0;
      setCurrentTime(0);
      setDuration(0);
      setTrack(t);
      if (t.initialPct && t.initialPct > 0) {
        const seed = () => {
          const dur = audio.duration || 0;
          if (dur > 0) {
            const preSegs = Math.floor((t.initialPct! / 100) * Math.ceil(dur));
            for (let s = 0; s < preSegs; s++) listenedSegments.current.add(s);
            maxListenedSecond.current = preSegs;
          }
          audio.removeEventListener("loadedmetadata", seed);
        };
        audio.addEventListener("loadedmetadata", seed);
      }
    }
    audio.playbackRate = rateRef.current;
    audio.play().catch(() => setIsPlaying(false));
  }, []);

  const pause = useCallback(() => { audioRef.current?.pause(); }, []);

  const toggle = useCallback((t: AudioTrack) => {
    const audio = audioRef.current;
    if (trackRef.current?.id === t.id && audio && !audio.paused) audio.pause();
    else play(t);
  }, [play]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); }
    setTrack(null); setIsPlaying(false); setCurrentTime(0); setDuration(0);
  }, []);

  const seekToPct = useCallback((pct: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    let target = pct * audio.duration;
    if (trackRef.current?.restrictSeek) target = clampSeek(target, maxListenedSecond.current, audio.duration);
    audio.currentTime = Math.max(0, Math.min(audio.duration, target));
  }, []);

  const skip = useCallback((sec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = audio.duration || 0;
    let target = audio.currentTime + sec;
    if (sec > 0 && trackRef.current?.restrictSeek) target = clampSeek(target, maxListenedSecond.current, dur);
    audio.currentTime = Math.max(0, Math.min(dur, target));
  }, []);

  const cycleRate = useCallback(() => {
    setPlaybackRate((r) => {
      const next = SPEEDS[(SPEEDS.indexOf(r) + 1) % SPEEDS.length];
      if (audioRef.current) audioRef.current.playbackRate = next;
      return next;
    });
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{ track, isPlaying, currentTime, duration, playbackRate, play, pause, toggle, stop, seekToPct, skip, cycleRate }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}
```

- [ ] **Step 2: Montar el provider en App.tsx**

En `client/src/App.tsx`, importar arriba:

```tsx
import { AudioPlayerProvider } from "@/components/audio/audio-player-context";
```

Envolver `<Router/>` (dentro de `TooltipProvider`), dejando el `ErrorBoundary` interno intacto:

```tsx
              <TooltipProvider>
                <Toaster />
                <PendingTermsModal />
                <ViewAsSwitcher />
                <ReferralCapture />
                <AudioPlayerProvider>
                  <ErrorBoundary>
                    <Router />
                  </ErrorBoundary>
                </AudioPlayerProvider>
              </TooltipProvider>
```

- [ ] **Step 3: Verificar tipos y build**

Run: `npx tsc --noEmit && npm run build`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/audio/audio-player-context.tsx client/src/App.tsx
git commit -m "feat(audio): AudioPlayerProvider global montado sobre el router"
```

---

### Task 4: FloatingAudioPlayer (barra flotante app-wide)

**Files:**
- Create: `client/src/components/audio/floating-audio-player.tsx`
- Modify: `client/src/App.tsx` (renderizar la barra)

**Interfaces:**
- Consumes: `useAudioPlayer` (Task 3).
- Produces: `FloatingAudioPlayer(): JSX.Element | null`

- [ ] **Step 1: Crear la barra**

Crear `client/src/components/audio/floating-audio-player.tsx`:

```tsx
import { useAudioPlayer } from "./audio-player-context";
import { Play, Pause, X, Volume2 } from "lucide-react";

function fmt(s: number): string {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function FloatingAudioPlayer() {
  const { track, isPlaying, currentTime, duration, playbackRate, toggle, skip, seekToPct, cycleRate, stop } = useAudioPlayer();
  if (!track) return null;
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[60] bg-[#0f1729] text-white shadow-2xl border-t border-white/10"
      data-testid="floating-audio-player"
    >
      <div className="mx-auto max-w-3xl px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1b5adf] to-[#7c3aed] flex items-center justify-center flex-shrink-0">
            <Volume2 size={16} className="text-white/90" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate" data-testid="floating-audio-title">{track.title}</p>
            {track.subtitle && <p className="text-[10px] text-white/50 truncate">{track.subtitle}</p>}
          </div>
          <button onClick={() => cycleRate()} className="px-2 py-1 rounded-md bg-white/10 text-[11px] font-bold text-white/70 hover:bg-white/20" data-testid="floating-audio-speed">
            {playbackRate}x
          </button>
          <button onClick={() => skip(-15)} className="text-white/70 hover:text-white text-[11px] font-semibold" data-testid="floating-audio-back">−15</button>
          <button
            onClick={() => toggle(track)}
            className="w-10 h-10 rounded-full bg-white text-[#0f1729] flex items-center justify-center hover:bg-white/90"
            data-testid="floating-audio-toggle"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <button onClick={() => skip(30)} className="text-white/70 hover:text-white text-[11px] font-semibold" data-testid="floating-audio-fwd">+30</button>
          <button onClick={() => stop()} className="text-white/50 hover:text-white" data-testid="floating-audio-close"><X size={16} /></button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-white/50 tabular-nums w-9 text-right">{fmt(currentTime)}</span>
          <div
            className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seekToPct((e.clientX - rect.left) / rect.width);
            }}
            data-testid="floating-audio-bar"
          >
            <div className="h-full bg-gradient-to-r from-[#1b5adf] to-[#7c3aed]" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] text-white/50 tabular-nums w-9">{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Renderizar la barra en App.tsx**

En `client/src/App.tsx`, importar:

```tsx
import FloatingAudioPlayer from "@/components/audio/floating-audio-player";
```

Renderizarla **dentro** de `AudioPlayerProvider`, como hermana del `ErrorBoundary`/`Router`:

```tsx
                <AudioPlayerProvider>
                  <ErrorBoundary>
                    <Router />
                  </ErrorBoundary>
                  <FloatingAudioPlayer />
                </AudioPlayerProvider>
```

- [ ] **Step 3: Verificar tipos y build**

Run: `npx tsc --noEmit && npm run build`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/audio/floating-audio-player.tsx client/src/App.tsx
git commit -m "feat(audio): barra flotante app-wide conectada al provider"
```

---

### Task 5: Integrar el editor del instructor (ModuleCard)

**Files:**
- Modify: `client/src/pages/instructor-dashboard.tsx` (`ModuleCard`: estado de audio y botón "Escuchar")

**Interfaces:**
- Consumes: `useAudioPlayer` (Task 3).

- [ ] **Step 1: Importar el hook**

En `client/src/pages/instructor-dashboard.tsx`, añadir al bloque de imports:

```tsx
import { useAudioPlayer } from "@/components/audio/audio-player-context";
```

- [ ] **Step 2: Reemplazar el estado y la función de audio local**

En `ModuleCard` (empieza en la línea ~302), **borrar** estas dos líneas de estado:

```tsx
  const [playingAudio, setPlayingAudio] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
```

y **borrar** por completo la función `toggleAudio()` (el bloque `function toggleAudio() { ... }`, ~líneas 425-439).

Añadir, cerca del inicio del componente (junto a los otros hooks):

```tsx
  const audio = useAudioPlayer();
  const audioTrackId = `course:${courseId}:module:${mod.id}`;
  const isThisPlaying = audio.track?.id === audioTrackId && audio.isPlaying;
```

- [ ] **Step 3: Cambiar el botón "Escuchar"**

Reemplazar el botón actual (el que llama `onClick={toggleAudio}`, ~líneas 482-486) por:

```tsx
                {hasAudio && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => audio.toggle({
                      id: audioTrackId,
                      url: mod.audioUrl!,
                      title: mod.title,
                      subtitle: hasCustomAudio ? "Tu grabación" : "Audio IA",
                    })}
                    data-testid={`button-play-audio-${mod.id}`}
                  >
                    {isThisPlaying
                      ? <><Pause size={12} className="mr-1.5" /> Pausar</>
                      : <><Play size={12} className="mr-1.5" /> Escuchar {hasCustomAudio ? "mi audio" : "audio IA"}</>}
                  </Button>
                )}
```

- [ ] **Step 4: Verificar tipos y build**

Run: `npx tsc --noEmit && npm run build`
Expected: sin errores. Si `Pause`/`Play` no estuvieran importados de `lucide-react` en este archivo, añadirlos (revisar el import existente antes de agregar).

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/instructor-dashboard.tsx
git commit -m "feat(audio): editor del instructor usa el reproductor global (adios al new Audio pegado)"
```

---

### Task 6: Integrar la conferencia del alumno (StpsPlayer)

**Files:**
- Modify: `client/src/pages/curso-virtual.tsx` (`StpsPlayer`: reemplazar audio propio por el provider)

**Interfaces:**
- Consumes: `useAudioPlayer` (Task 3), `resolveAudioUrl` (Task 1).

- [ ] **Step 1: Importar hook y helper**

En `client/src/pages/curso-virtual.tsx`, añadir a los imports:

```tsx
import { useAudioPlayer } from "@/components/audio/audio-player-context";
import { resolveAudioUrl } from "@/lib/audio-url";
```

- [ ] **Step 2: Cambiar el cuerpo de StpsPlayer para usar el provider**

`StpsPlayer` (línea ~93) deja de tener su propio `<audio>`, sus `useState` de reproducción y su `useEffect` de listeners. Reemplazar todo el bloque interno de estado + efectos + `togglePlay`/`skip`/`changeSpeed` por el consumo del provider. La pista lleva la política del alumno (`restrictSeek: true`, `onProgress`, `initialPct`). Estructura resultante del componente:

```tsx
function StpsPlayer({
  course, modules, audioUrl, onListeningProgress, initialListeningPct,
}: {
  course: CourseInfo; modules: CourseModule[]; audioUrl: string | null;
  onListeningProgress?: (pct: number) => void; initialListeningPct?: number;
}) {
  const player = useAudioPlayer();
  const trackId = `conf:${course.slug ?? course.title}`;
  const resolvedAudioUrl = resolveAudioUrl(audioUrl);
  const isThis = player.track?.id === trackId;
  const isPlaying = isThis && player.isPlaying;
  const currentTime = isThis ? player.currentTime : 0;
  const duration = isThis ? player.duration : 0;
  const playbackRate = isThis ? player.playbackRate : 1;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const startOrToggle = () => player.toggle({
    id: trackId,
    url: audioUrl || "",
    title: course.title,
    subtitle: course.instructor ?? undefined,
    restrictSeek: true,
    onProgress: onListeningProgress,
    initialPct: initialListeningPct,
  });

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };
  const instructorInitial = course.instructor ? course.instructor.replace(/^(Psic\.|Ing\.)\s*/i, "").charAt(0).toUpperCase() : "C";
  const totalDuration = modules.reduce((s, m) => s + (m.durationMinutes || 0), 0);

  // ...el JSX del "coming soon" cuando !resolvedAudioUrl se conserva igual...
  // ...el JSX del reproductor cambia SOLO los handlers y quita el <audio>:
  //   - <audio .../> : ELIMINADO (lo maneja el provider)
  //   - botón play principal: onClick={startOrToggle}, ícono según isPlaying
  //   - botones de skip: onClick={() => isThis ? player.skip(-15) : startOrToggle()}
  //                      onClick={() => isThis ? player.skip(30) : startOrToggle()}
  //   - botón velocidad: onClick={() => isThis && player.cycleRate()} muestra {playbackRate}x
  //   - barra de progreso onClick: if (isThis) player.seekToPct((e.clientX - rect.left)/rect.width)
  //   - currentTime/duration/progress vienen de las consts de arriba
}
```

Aplicar exactamente esos reemplazos de handlers en el JSX existente del reproductor (líneas ~267-350): eliminar la etiqueta `<audio ref={audioRef} .../>`, y cambiar `togglePlay`→`startOrToggle`, `skip(n)`→`isThis ? player.skip(n) : startOrToggle()`, `changeSpeed`→`() => isThis && player.cycleRate()`, y el `onClick` de la barra a `if (isThis) player.seekToPct(...)`. Conservar el resto del markup (carátula, badges, títulos, tiempos) tal cual, alimentado por las consts nuevas.

- [ ] **Step 3: Verificar tipos y build**

Run: `npx tsc --noEmit && npm run build`
Expected: sin errores. Quitar imports que queden sin uso (`useRef`, `useState`, `useEffect` si ya no se usan en StpsPlayer pero sí en el resto del archivo — revisar antes de borrar).

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/curso-virtual.tsx
git commit -m "feat(audio): la conferencia del alumno usa el reproductor global (conserva guarda de diploma)"
```

---

### Task 7: Integrar el Tutor IA del alumno (AudioClassPlayer)

**Files:**
- Modify: `client/src/components/AudioClassPlayer.tsx` (reemplazar `<audio controls>` por el provider)

**Interfaces:**
- Consumes: `useAudioPlayer` (Task 3).

- [ ] **Step 1: Importar el hook**

En `client/src/components/AudioClassPlayer.tsx`, añadir:

```tsx
import { useAudioPlayer } from "@/components/audio/audio-player-context";
import { Play, Pause } from "lucide-react";
```

(`Play`/`Pause` de lucide-react; revisar el import existente para no duplicar.)

- [ ] **Step 2: Reemplazar el `<audio controls>` por un botón que usa el provider**

Dentro del componente, añadir cerca de los otros hooks:

```tsx
  const player = useAudioPlayer();
  const trackId = `studio:${courseSlug}:${moduleIndex}`;
  const isThisPlaying = player.track?.id === trackId && player.isPlaying;
```

En el bloque `status === "ready"` (el `return` con `data-testid="audio-player"`), reemplazar la etiqueta:

```tsx
        <audio
          ref={audioRef}
          src={audioData.audioUrl}
          controls
          preload="metadata"
          className="w-full"
          data-testid="audio-native-player"
        />
```

por:

```tsx
        <button
          onClick={() => player.toggle({ id: trackId, url: audioData.audioUrl!, title: moduleTitle || "Clase en Audio" })}
          className="flex items-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-sm font-semibold justify-center"
          data-testid="audio-native-player"
        >
          {isThisPlaying ? <><Pause className="h-4 w-4" /> Pausar</> : <><Play className="h-4 w-4" /> Escuchar la clase</>}
        </button>
```

Eliminar el `audioRef` (`const audioRef = useRef<HTMLAudioElement>(null);`) y, en `handleRegenerateAudio`, quitar las líneas que usaban `audioRef.current` para pausar (`const audio = audioRef.current; if (audio) { audio.pause(); }`) — reemplazarlas por `player.stop();` para cortar el audio viejo antes de regenerar.

- [ ] **Step 3: Verificar tipos y build**

Run: `npx tsc --noEmit && npm run build`
Expected: sin errores. Quitar `useRef` del import de react si queda sin uso.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/AudioClassPlayer.tsx
git commit -m "feat(audio): el Tutor IA usa el reproductor global (corrige la fuga del audio nativo)"
```

---

### Task 8: Verificación final

**Files:** ninguno (no commitear scripts)

- [ ] **Step 1: Suite + tipos + build + smoke**

Run: `npm test && npx tsc --noEmit && npm run build && npm run smoke:boot`
Expected: todo verde y el bundle levanta.

- [ ] **Step 2: Checklist manual en prod (post-deploy, con David/Yuridia)**

- Abrir una **conferencia** del alumno: **ya no congela**; se pinta la infografía.
- Darle play al audio de la conferencia: suena; **navegar a otra pantalla** → **sigue sonando** con la barra flotante abajo.
- Barra flotante: play/pausa, −15, +30, velocidad y clic en la barra funcionan; el botón cerrar la oculta y detiene.
- Iniciar otra pista (otro módulo) → la anterior se detiene (una sola a la vez).
- **Editor del instructor** (Mis Conferencias → módulo): "Escuchar" abre el mismo reproductor global; puede adelantar/atrasar **libremente** (sin guarda).
- **Alumno en la conferencia**: no puede adelantar más allá de lo escuchado; su progreso avanza (para el diploma).
- **Tutor IA**: el botón "Escuchar la clase" reproduce en el mismo reproductor global; al salir ya no queda sonando descontrolado.

- [ ] **Step 3: Reportar**

Escribir el resultado de cada verificación. Si algo falla, corregir antes de dar por terminado.
