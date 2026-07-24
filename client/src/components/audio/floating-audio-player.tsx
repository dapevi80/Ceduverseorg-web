import { useRef, useEffect } from "react";
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
  const barRef = useRef<HTMLDivElement>(null);

  // La barra es fixed y no ocupa espacio en el layout: sin esto tapa lo último de
  // la página. Se reserva ese alto empujando el contenido con padding en el body,
  // y se libera al cerrar el reproductor.
  useEffect(() => {
    if (!track) { document.body.style.paddingBottom = ""; return; }
    const h = barRef.current?.offsetHeight ?? 80;
    document.body.style.paddingBottom = `${h}px`;
    return () => { document.body.style.paddingBottom = ""; };
  }, [track]);

  if (!track) return null;
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={barRef}
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
