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
      // El tope de "hasta dónde ha escuchado" avanza con la reproducción real.
      // Como el adelanto está bloqueado, currentTime solo alcanza posiciones ya
      // escuchadas, así que tomar el máximo es seguro y NO se queda atrás cuando
      // timeupdate se ralentiza (p.ej. al navegar en otra pantalla) — que era la
      // causa de que el retroceso "regresara todo".
      const secNow = Math.floor(ct);
      if (secNow > maxListenedSecond.current) maxListenedSecond.current = secNow;
      // El % para el diploma sí exige escucha contigua (no contar rangos saltados).
      if (diff > 0 && diff < 2) {
        listenedSegments.current.add(secNow);
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
      // Solo se bloquea el ADELANTO más allá de lo escuchado. El retroceso es
      // siempre libre (currentTime <= la última posición reproducida).
      const dur = audio.duration || 0;
      const allowed = maxListenedSecond.current + dur * 0.1;
      if (audio.currentTime > lastTimeRef.current && audio.currentTime > allowed) {
        audio.currentTime = allowed;
      }
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
    // Solo el adelanto se limita; el retroceso es libre.
    if (trackRef.current?.restrictSeek && target > audio.currentTime) {
      target = clampSeek(target, maxListenedSecond.current, audio.duration);
    }
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
