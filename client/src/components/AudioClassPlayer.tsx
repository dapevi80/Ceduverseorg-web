import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic, Loader2, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface AudioClassPlayerProps {
  courseSlug: string;
  moduleIndex: number;
  classScript?: string;
  moduleTitle?: string;
}

interface SectionMarker {
  label: string;
  position: number;
}

function extractSectionMarkers(script: string): SectionMarker[] {
  const markers: SectionMarker[] = [];
  const totalLen = script.length;
  const patterns = [
    { regex: /\[INTRO\]/g, label: "Intro" },
    { regex: /\[CONCEPTO:([^\]]*)\]/g, label: "" },
    { regex: /\[EJEMPLO\]/g, label: "Ejemplo" },
    { regex: /\[CLAVE\]/g, label: "Clave" },
    { regex: /\[INTERACCION\]/g, label: "Interacción" },
    { regex: /\[CIERRE\]/g, label: "Cierre" },
  ];

  for (const p of patterns) {
    let match;
    while ((match = p.regex.exec(script)) !== null) {
      const label = p.label || match[1] || "Sección";
      markers.push({ label, position: match.index / totalLen });
    }
  }

  markers.sort((a, b) => a.position - b.position);
  return markers;
}

export default function AudioClassPlayer({ courseSlug, moduleIndex, classScript, moduleTitle }: AudioClassPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pollInterval, setPollInterval] = useState<number | false>(false);

  const { data: audioData, refetch } = useQuery<{
    status: string;
    audioUrl?: string;
    duration?: number;
    estimatedSeconds?: number;
    message?: string;
  }>({
    queryKey: ["/api/studio/courses", courseSlug, "modules", moduleIndex, "audio"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/studio/courses/${courseSlug}/modules/${moduleIndex}/audio`);
        return res.json();
      } catch {
        return { status: "pending" };
      }
    },
    enabled: !!courseSlug,
    refetchInterval: pollInterval,
  });

  useEffect(() => {
    if (audioData?.status === "generating") {
      setPollInterval(5000);
    } else {
      setPollInterval(false);
    }
  }, [audioData?.status]);

  const markers = useMemo(() => {
    if (!classScript) return [];
    return extractSectionMarkers(classScript);
  }, [classScript]);

  const [isRegeneratingAudio, setIsRegeneratingAudio] = useState(false);

  const handleGenerateAudio = useCallback(async () => {
    try {
      await apiRequest("GET", `/api/studio/courses/${courseSlug}/modules/${moduleIndex}/audio`);
    } catch {}
    refetch();
  }, [courseSlug, moduleIndex, refetch]);

  const handleRegenerateAudio = useCallback(async () => {
    setIsRegeneratingAudio(true);
    try {
      const audio = audioRef.current;
      if (audio) { audio.pause(); }
      await apiRequest("POST", `/api/studio/courses/${courseSlug}/modules/${moduleIndex}/audio/regenerate`);
      refetch();
    } finally {
      setIsRegeneratingAudio(false);
    }
  }, [courseSlug, moduleIndex, refetch]);

  if (!audioData || audioData.status === "no_script") {
    return null;
  }

  if (audioData.status === "unavailable") {
    return null;
  }

  if (audioData.status === "generating") {
    return (
      <div
        data-testid="audio-player-generating"
        className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-xs mb-4 px-1"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
        <span>🎧 Tu audio se está preparando — puedes ir leyendo; el play se activa solo al terminar.</span>
      </div>
    );
  }

  if (audioData.status === "pending" || (audioData.status !== "ready" && !audioData.audioUrl)) {
    return (
      <div data-testid="audio-player-generate" className="bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Mic className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Clase en Audio</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Escucha este módulo como una clase real</p>
            </div>
          </div>
          <Button
            onClick={handleGenerateAudio}
            size="sm"
            data-testid="button-generate-audio"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          >
            <Mic className="h-4 w-4 mr-1.5" />
            Generar Audio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="audio-player" className="bg-gradient-to-r from-blue-50/80 to-violet-50/80 dark:from-blue-950/30 dark:to-violet-950/30 border border-blue-200/60 dark:border-blue-800/60 rounded-2xl mb-4 overflow-hidden transition-all">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Mic className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                {moduleTitle || "Clase en Audio"}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-[11px]">Audio inmersivo</p>
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1"
            data-testid="button-expand-audio-options"
          >
            Más {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </button>
        </div>

        <audio
          ref={audioRef}
          src={audioData.audioUrl}
          controls
          preload="metadata"
          className="w-full"
          data-testid="audio-native-player"
        />

        {!isCollapsed && (
          <div className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <button
                onClick={handleRegenerateAudio}
                disabled={isRegeneratingAudio}
                title="Regenerar audio con voz mejorada"
                data-testid="button-regenerate-audio"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isRegeneratingAudio ? "animate-spin" : ""}`} />
                Regenerar
              </button>
            </div>

            {markers.length > 0 && (
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1.5">Secciones</p>
                <div className="flex flex-wrap gap-1.5">
                  {markers.map((m, i) => (
                    <span
                      key={i}
                      data-testid={`section-marker-${i}`}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
