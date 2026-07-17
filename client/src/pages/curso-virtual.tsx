import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useParams, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForceLightMode } from "@/components/ThemeProvider";
import { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Volume2,
  Clock,
  Award,
  AlertCircle,
  PartyPopper,
  RotateCcw,
  ExternalLink,
  GraduationCap,
  FileCheck,
  Lock,
  UserPlus,
  Sparkles,
  LogOut,
  Loader2,
  Share2,
  Mic,
  ListOrdered,
  SkipBack,
  SkipForward,
  PlayCircle,
  ArrowRight,
  Download,
  Headphones,
  Video,
} from "lucide-react";
import ShareCourseModal from "@/components/ShareCourseModal";
import InfographicView from "@/components/InfographicView";

type CourseInfo = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  instructor: string | null;
  durationHrs: number | null;
  durationVirtualHrs: number | null;
  areaTematica: string | null;
  nivel: string | null;
  dc3Disponible: boolean | null;
  categoria: string[] | null;
  temas: string[] | null;
  objetivo: string | null;
  sepCertificatePrice: number | null;
  hasRvoe: boolean | null;
  rvoeUrl: string | null;
};

type CourseModule = {
  id: string;
  courseId: string;
  order: number;
  title: string;
  description: string | null;
  contentHtml: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  heygenVideoUrl: string | null;
  references: string[] | null;
  durationMinutes: number | null;
};



function StpsPlayer({
  course,
  modules,
  audioUrl,
  onListeningProgress,
  initialListeningPct,
}: {
  course: CourseInfo;
  modules: CourseModule[];
  audioUrl: string | null;
  onListeningProgress?: (pct: number) => void;
  initialListeningPct?: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const listenedSegments = useRef<Set<number>>(new Set());
  const lastTimeRef = useRef<number>(0);
  const maxListenedSecond = useRef<number>(0);

  useEffect(() => {
    if (initialListeningPct && initialListeningPct > 0) {
      const audio = audioRef.current;
      if (audio && audio.duration && audio.duration > 0) {
        const totalSegs = Math.ceil(audio.duration);
        const preSegs = Math.floor((initialListeningPct / 100) * totalSegs);
        for (let s = 0; s < preSegs; s++) listenedSegments.current.add(s);
        maxListenedSecond.current = preSegs;
      }
    }
  }, [initialListeningPct, duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // El audio ahora cambia al cambiar de módulo activo. Sin reiniciar los
    // contadores de escucha, el progreso del módulo anterior se arrastraría y
    // el guardia anti-adelanto (maxListenedSecond + 10%) dejaría saltarse el
    // audio nuevo por completo.
    listenedSegments.current = new Set();
    maxListenedSecond.current = 0;
    lastTimeRef.current = 0;
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(false);
    const onTimeUpdate = () => {
      const ct = audio.currentTime;
      const dur = audio.duration;
      setCurrentTime(ct);
      setProgress(dur ? (ct / dur) * 100 : 0);

      const diff = ct - lastTimeRef.current;
      if (diff > 0 && diff < 2) {
        const seg = Math.floor(ct);
        listenedSegments.current.add(seg);
        if (seg > maxListenedSecond.current) maxListenedSecond.current = seg;
        if (dur && dur > 0 && onListeningProgress) {
          const totalSegs = Math.ceil(dur);
          const pct = (listenedSegments.current.size / totalSegs) * 100;
          onListeningProgress(pct);
        }
      }
      lastTimeRef.current = ct;
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    const onSeeking = () => {
      const dur = audio.duration;
      if (!dur || dur <= 0) return;
      const maxAllowed = maxListenedSecond.current + (dur * 0.1);
      if (audio.currentTime > maxAllowed) {
        audio.currentTime = maxAllowed;
      }
    };
    const onSeeked = () => { lastTimeRef.current = audio.currentTime; };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("seeking", onSeeking);
    audio.addEventListener("seeked", onSeeked);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("seeking", onSeeking);
      audio.removeEventListener("seeked", onSeeked);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = audio.duration || 0;
    let target = audio.currentTime + seconds;
    if (seconds > 0) {
      const maxAllowed = maxListenedSecond.current + (dur * 0.1);
      target = Math.min(target, maxAllowed);
    }
    audio.currentTime = Math.max(0, Math.min(dur, target));
  };

  const changeSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newRate = speeds[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) audioRef.current.playbackRate = newRate;
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const instructorInitial = course.instructor ? course.instructor.replace(/^(Psic\.|Ing\.)\s*/i, "").charAt(0).toUpperCase() : "C";
  const totalDuration = modules.reduce((s, m) => s + (m.durationMinutes || 0), 0);

  const resolvedAudioUrl = (() => {
    if (!audioUrl) return null;
    if (audioUrl.startsWith("/audio/") || audioUrl.startsWith("http")) return audioUrl;
    const filename = audioUrl.replace(/^audio-cache\//, "");
    return `/audio/${filename}`;
  })();

  if (!resolvedAudioUrl) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f1729] via-[#1a2744] to-[#0d1f3c] p-6 sm:p-8" data-testid="stps-player-coming-soon">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#1b5adf] rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7c3aed] rounded-full blur-[80px]" />
        </div>
        <div className="relative flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#1b5adf] to-[#7c3aed] flex items-center justify-center text-white text-3xl font-serif flex-shrink-0 shadow-xl">
            {instructorInitial}
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
              <Badge className="bg-[#f28023] text-white text-[10px] border-0">Capacitación STPS</Badge>
              {course.dc3Disponible && <Badge className="bg-white/20 text-white text-[10px] border-0">DC-3</Badge>}
            </div>
            <h2 className="font-serif text-xl sm:text-2xl text-white leading-tight mb-1" data-testid="stps-course-title">{course.title}</h2>
            <p className="text-white/70 text-sm">{course.instructor}</p>
            {totalDuration > 0 && (
              <p className="text-white/50 text-xs mt-1 flex items-center gap-1 justify-center sm:justify-start">
                <Clock size={12} /> {totalDuration} min de contenido
              </p>
            )}
          </div>
        </div>
        <div className="relative mt-6 flex flex-col items-center py-8">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
            <Mic size={28} className="text-white/40" />
          </div>
          <p className="text-white/60 text-sm font-medium">Audio próximamente</p>
          <p className="text-white/40 text-xs mt-1">La sesión está siendo preparada por el instructor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f1729] via-[#1a2744] to-[#0d1f3c] p-6 sm:p-8" data-testid="stps-player">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1b5adf] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7c3aed] rounded-full blur-[80px]" />
      </div>
      <audio ref={audioRef} src={resolvedAudioUrl} preload="metadata" />

      <div className="relative flex flex-col sm:flex-row items-center gap-5 mb-6">
        <div className="relative">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#1b5adf] to-[#7c3aed] flex items-center justify-center text-white text-3xl font-serif flex-shrink-0 shadow-xl transition-transform ${isPlaying ? "scale-105" : ""}`}>
            {instructorInitial}
          </div>
          {isPlaying && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00b87a] rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          )}
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
            <Badge className="bg-[#f28023] text-white text-[10px] border-0">Capacitación STPS</Badge>
            {course.dc3Disponible && <Badge className="bg-white/20 text-white text-[10px] border-0">DC-3</Badge>}
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-white leading-tight mb-1" data-testid="stps-course-title">{course.title}</h2>
          <p className="text-white/70 text-sm">{course.instructor}</p>
        </div>
      </div>

      <div className="relative">
        <div
          className="h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer mb-2"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (audioRef.current && audioRef.current.duration) {
              audioRef.current.currentTime = pct * audioRef.current.duration;
            }
          }}
          data-testid="stps-progress-bar"
        >
          <div className="h-full bg-gradient-to-r from-[#1b5adf] to-[#7c3aed] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-white/50">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="relative flex items-center justify-center gap-4 mt-4">
        <button
          onClick={changeSpeed}
          className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold text-white/70 hover:bg-white/20 transition-colors cursor-pointer"
          data-testid="stps-speed"
        >
          {playbackRate}x
        </button>
        <button
          onClick={() => skip(-15)}
          className="w-10 h-10 rounded-full bg-white/10 text-white/70 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
          data-testid="stps-skip-back"
        >
          <SkipBack size={16} />
        </button>
        <button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-white text-[#0f1729] flex items-center justify-center hover:bg-white/90 transition-all shadow-lg shadow-white/20 cursor-pointer"
          data-testid="stps-play"
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
        </button>
        <button
          onClick={() => skip(30)}
          className="w-10 h-10 rounded-full bg-white/10 text-white/70 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
          data-testid="stps-skip-forward"
        >
          <SkipForward size={16} />
        </button>
        <div className="flex items-center gap-1 text-white/50">
          <Volume2 size={16} />
        </div>
      </div>
    </div>
  );
}

function InfographicFallback({ contentHtml, index }: { contentHtml: string; index: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [needsFallback, setNeedsFallback] = useState(false);

  useEffect(() => {
    const check = () => {
      const parent = containerRef.current?.parentElement;
      if (parent?.querySelector('[data-testid="infographic-empty"]')) {
        setNeedsFallback(true);
      }
    };
    const t = requestAnimationFrame(check);
    return () => cancelAnimationFrame(t);
  }, [contentHtml]);

  return (
    <div ref={containerRef}>
      {needsFallback && (
        <div
          className="prose prose-sm sm:prose max-w-none prose-headings:font-serif prose-headings:text-cedu-ink prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2 prose-p:text-cedu-ink-soft prose-p:leading-relaxed prose-li:text-cedu-ink-soft prose-strong:text-cedu-ink prose-ul:space-y-1 prose-ol:space-y-1 prose-blockquote:border-l-[#1b5adf] prose-blockquote:bg-[#1b5adf]/[0.03] prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:not-italic"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentHtml) }}
          data-testid={`stps-section-content-${index}`}
        />
      )}
    </div>
  );
}

function ModuleContentView({ contentHtml, moduleTitle, index }: { contentHtml: string; moduleTitle: string; index: number }) {
  const [viewMode, setViewMode] = useState<"infographic" | "text">("infographic");

  if (!contentHtml || contentHtml.trim().length < 100) {
    return <p className="text-sm text-cedu-ink-muted text-center py-6">Contenido próximamente.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button
          size="sm"
          variant={viewMode === "infographic" ? "default" : "outline"}
          className={`text-xs rounded-lg h-7 ${viewMode === "infographic" ? "bg-[#1b5adf] text-white" : ""}`}
          onClick={() => setViewMode("infographic")}
          data-testid={`btn-infographic-${index}`}
        >
          <Sparkles size={12} className="mr-1" /> Resumen visual
        </Button>
        <Button
          size="sm"
          variant={viewMode === "text" ? "default" : "outline"}
          className={`text-xs rounded-lg h-7 ${viewMode === "text" ? "bg-[#1b5adf] text-white" : ""}`}
          onClick={() => setViewMode("text")}
          data-testid={`btn-fulltext-${index}`}
        >
          <FileText size={12} className="mr-1" /> Texto completo
        </Button>
      </div>

      {viewMode === "infographic" && (
        <>
          <InfographicView contentHtml={contentHtml} moduleTitle={moduleTitle} />
          <InfographicFallback contentHtml={contentHtml} index={index} />
        </>
      )}

      {viewMode === "text" && (
        <div
          className="prose prose-sm sm:prose max-w-none prose-headings:font-serif prose-headings:text-cedu-ink prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2 prose-p:text-cedu-ink-soft prose-p:leading-relaxed prose-li:text-cedu-ink-soft prose-strong:text-cedu-ink prose-ul:space-y-1 prose-ol:space-y-1 prose-blockquote:border-l-[#1b5adf] prose-blockquote:bg-[#1b5adf]/[0.03] prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:not-italic"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentHtml) }}
          data-testid={`stps-section-content-${index}`}
        />
      )}
    </div>
  );
}

function PdfDownloadButton({ courseTitle }: { courseTitle: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const handleDownload = async () => {
    const sections = document.querySelectorAll('[data-testid^="stps-section-"]');
    if (!sections.length) return;
    setLoading(true);
    try {
      const wrapper = document.createElement("div");
      wrapper.style.padding = "20px";
      wrapper.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
      wrapper.style.color = "#1a1a1a";
      const header = document.createElement("div");
      header.style.marginBottom = "24px";
      header.style.paddingBottom = "16px";
      header.style.borderBottom = "2px solid #1b5adf";
      const h1 = document.createElement("h1");
      h1.style.fontFamily = "'DM Serif Display', serif";
      h1.style.fontSize = "24px";
      h1.style.margin = "0 0 4px";
      h1.textContent = courseTitle;
      const subtitle = document.createElement("p");
      subtitle.style.fontSize = "12px";
      subtitle.style.color = "#666";
      subtitle.style.margin = "0";
      subtitle.textContent = "Material de capacitación — Ceduverse Aula Virtual STPS";
      header.appendChild(h1);
      header.appendChild(subtitle);
      wrapper.appendChild(header);
      sections.forEach((sec) => {
        const content = sec.querySelector('[data-testid^="stps-section-content-"]');
        const title = sec.querySelector('[data-testid^="stps-section-title-"]');
        if (content) {
          const block = document.createElement("div");
          block.style.marginBottom = "20px";
          if (title) {
            const h = document.createElement("h2");
            h.style.fontFamily = "'DM Serif Display',serif";
            h.style.fontSize = "18px";
            h.style.marginBottom = "8px";
            h.textContent = title.textContent || "";
            block.appendChild(h);
          }
          const clone = content.cloneNode(true) as HTMLElement;
          block.appendChild(clone);
          wrapper.appendChild(block);
        }
      });
      const footer = document.createElement("div");
      footer.style.marginTop = "32px";
      footer.style.paddingTop = "12px";
      footer.style.borderTop = "1px solid #ddd";
      footer.style.fontSize = "10px";
      footer.style.color = "#999";
      footer.style.display = "flex";
      footer.style.justifyContent = "space-between";
      const now = new Date();
      const dateStr = now.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
      const footerLeft = document.createElement("span");
      footerLeft.textContent = "Ceduverse — Aula Virtual STPS";
      const footerRight = document.createElement("span");
      footerRight.textContent = `Generado: ${dateStr}`;
      footer.appendChild(footerLeft);
      footer.appendChild(footerRight);
      wrapper.appendChild(footer);
      const mod = await import("html2pdf.js");
      const html2pdf = mod.default;
      await html2pdf()
        .set({
          margin: [15, 15, 15, 15],
          filename: `${courseTitle.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, "").trim()}_Ceduverse.pdf`,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "letter", orientation: "portrait" },
        })
        .from(wrapper)
        .save();
      toast({ title: "PDF descargado", description: "El material del curso se ha guardado." });
    } catch {
      toast({ title: "Error", description: "No se pudo generar el PDF. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1 text-cedu-blue border-cedu-blue/20 hover:bg-cedu-blue/5"
      data-testid="button-download-pdf"
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {loading ? "Generando..." : "Descargar PDF"}
    </Button>
  );
}

function StpsSessionView({
  course,
  modules,
  user,
  isEnrolled,
  completedModules,
  onMarkSectionComplete,
  onAutoComplete,
  slug,
  activeModuleIndex,
  onActiveModuleChange,
}: {
  course: CourseInfo;
  modules: CourseModule[];
  user: any;
  isEnrolled: boolean;
  completedModules: Set<number>;
  onMarkSectionComplete: (index: number) => void;
  onAutoComplete: () => void;
  slug: string;
  activeModuleIndex: number;
  onActiveModuleChange: (index: number) => void;
}) {
  const [tocOpen, setTocOpen] = useState(false);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [listeningPct, setListeningPct] = useState(0);
  const hasListenedEnough = listeningPct >= 95;
  const listeningPctRef = useRef(listeningPct);
  const lastSavedPctRef = useRef(0);

  const { data: userCourseData } = useQuery<any[]>({
    queryKey: ["/api/me/courses"],
    enabled: !!user,
  });

  const enrollmentForCourse = userCourseData?.find((uc: any) => uc.courseSlug === slug);
  const serverListeningPct = enrollmentForCourse?.listeningProgress ?? 0;

  useEffect(() => {
    if (serverListeningPct > 0 && listeningPct < serverListeningPct) {
      setListeningPct(serverListeningPct);
      lastSavedPctRef.current = serverListeningPct;
    }
  }, [serverListeningPct]);

  useEffect(() => { listeningPctRef.current = listeningPct; }, [listeningPct]);

  const autoCompletedRef = useRef(false);
  useEffect(() => {
    if (!user || !enrollmentForCourse) return;
    const interval = setInterval(async () => {
      const current = listeningPctRef.current;
      if (current > lastSavedPctRef.current) {
        lastSavedPctRef.current = current;
        const courseId = enrollmentForCourse.courseId;
        try {
          const res = await apiRequest("PATCH", `/api/me/courses/${courseId}/listening`, {
            listeningProgress: Math.round(current),
          });
          const data = await res.json();
          if (data.autoCompleted && !autoCompletedRef.current) {
            autoCompletedRef.current = true;
            onAutoComplete();
          }
        } catch {}
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user, enrollmentForCourse]);

  const scrollToSection = (index: number) => {
    // Navegar a un módulo lo vuelve el módulo activo: el reproductor de arriba
    // debe seguir a lo que el alumno está leyendo, no quedarse en el módulo 1.
    onActiveModuleChange(index);
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTocOpen(false);
  };

  const allReferences = modules.flatMap(m => m.references || []).filter((v, i, a) => a.indexOf(v) === i);
  // El media del módulo ACTIVO. Antes: `modules[0]?.audioUrl` — siempre el audio
  // del módulo cero sin importar qué módulo se estuviera viendo, que es el
  // "el audio no coincide con lo que está escrito" que reportó el dueño.
  const activeModule = modules[activeModuleIndex] ?? modules[0] ?? null;
  const audioUrl = activeModule?.audioUrl ?? null;
  const heygenVideoUrl = activeModule?.heygenVideoUrl ?? null;
  const hasVideo = !!heygenVideoUrl;
  const hasAudio = !!audioUrl;
  const allCompleted = modules.length > 0 && modules.every((_, i) => completedModules.has(i));

  return (
    <div className="space-y-6" data-testid="stps-session-view">
      {hasVideo && (
        <div className="rounded-2xl overflow-hidden border border-black/[0.06] bg-black" data-testid="stps-video-player">
          <video
            src={heygenVideoUrl}
            controls
            className="w-full max-h-[480px]"
            poster=""
          />
          <div className="bg-white px-4 py-2 flex items-center gap-2">
            <div className="w-6 h-6 bg-[#7c3aed]/10 rounded-full flex items-center justify-center">
              <span className="text-[10px]">🎓</span>
            </div>
            <p className="text-xs text-cedu-ink-muted">Video conferencia con tu instructor</p>
          </div>
        </div>
      )}
      {!hasVideo && <StpsPlayer course={course} modules={modules} audioUrl={audioUrl} onListeningProgress={setListeningPct} initialListeningPct={serverListeningPct} />}

      {hasAudio && user && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-black/[0.06]" data-testid="stps-listening-progress">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
            hasListenedEnough ? "bg-[#00b87a]/10" : "bg-[#1b5adf]/10"
          }`}>
            <Headphones size={18} className={hasListenedEnough ? "text-[#00b87a]" : "text-[#1b5adf]"} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-cedu-ink">
                {hasListenedEnough ? "Audio completado" : "Progreso de escucha"}
              </span>
              <span className="text-xs text-cedu-ink-muted">{Math.min(Math.round(listeningPct), 100)}%</span>
            </div>
            <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${hasListenedEnough ? "bg-[#00b87a]" : "bg-[#1b5adf]"}`}
                style={{ width: `${Math.min(listeningPct, 100)}%` }}
              />
            </div>
            {!hasListenedEnough && (
              <p className="text-[10px] text-cedu-ink-muted mt-1">Escucha el 95% del audio para completar la conferencia y obtener tu diploma</p>
            )}
          </div>
        </div>
      )}

      {modules.length > 1 && (
        <Card className="border-black/[0.06]" data-testid="stps-toc">
          <button
            onClick={() => setTocOpen(!tocOpen)}
            className="w-full flex items-center justify-between p-4 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ListOrdered size={18} className="text-[#1b5adf]" />
              <span className="font-serif text-base text-cedu-ink">Contenido de la sesión</span>
              <Badge variant="secondary" className="text-[10px]">{modules.length} secciones</Badge>
            </div>
            {tocOpen ? <ChevronUp size={18} className="text-cedu-ink-muted" /> : <ChevronDown size={18} className="text-cedu-ink-muted" />}
          </button>
          {tocOpen && (
            <div className="px-4 pb-4 space-y-1">
              {modules.map((mod, i) => (
                <button
                  key={mod.id}
                  onClick={() => scrollToSection(i)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-black/[0.03] transition-colors cursor-pointer"
                  data-testid={`stps-toc-item-${i}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    completedModules.has(i) ? "bg-[#00b87a] text-white" : "bg-black/[0.06] text-cedu-ink-muted"
                  }`}>
                    {completedModules.has(i) ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cedu-ink truncate">{mod.title}</p>
                    {mod.durationMinutes && (
                      <p className="text-[11px] text-cedu-ink-muted">{mod.durationMinutes} min</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="space-y-8">
        {modules.map((mod, i) => {
          const isLocked = !user && i > 0;
          return (
            <div
              key={mod.id}
              ref={(el) => { sectionRefs.current[i] = el; }}
              className="scroll-mt-20"
            >
              <Card className={`border-black/[0.06] overflow-hidden ${completedModules.has(i) ? "border-l-4 border-l-[#00b87a]" : ""}`} data-testid={`stps-section-${i}`}>
                <div className="p-5 sm:p-6 border-b border-black/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                      completedModules.has(i)
                        ? "bg-[#00b87a] text-white"
                        : "bg-[#1b5adf]/10 text-[#1b5adf]"
                    }`}>
                      {completedModules.has(i) ? <CheckCircle2 size={18} /> : i + 1}
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-cedu-ink" data-testid={`stps-section-title-${i}`}>{mod.title}</h3>
                      {mod.durationMinutes && (
                        <p className="text-xs text-cedu-ink-muted flex items-center gap-1">
                          <Clock size={11} /> {mod.durationMinutes} min
                        </p>
                      )}
                    </div>
                  </div>
                  {user && !completedModules.has(i) && !isLocked && (
                    <div className="flex items-center gap-2">
                      {hasAudio && !hasListenedEnough && (
                        <span className="text-[10px] text-cedu-ink-muted hidden sm:inline">
                          {Math.min(Math.round(listeningPct), 100)}% escuchado
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMarkSectionComplete(i)}
                        disabled={hasAudio && !hasListenedEnough}
                        className="text-[#00b87a] border-[#00b87a]/30 hover:bg-[#00b87a]/10 text-xs disabled:opacity-50"
                        data-testid={`stps-complete-section-${i}`}
                      >
                        <CheckCircle2 size={14} className="mr-1" /> Completar
                      </Button>
                    </div>
                  )}
                  {completedModules.has(i) && (
                    <Badge className="bg-[#00b87a]/10 text-[#00b87a] border-0 text-xs">Completado</Badge>
                  )}
                </div>

                {isLocked ? (
                  <div className="p-6 text-center">
                    <Lock size={24} className="mx-auto text-cedu-ink-muted/40 mb-2" />
                    <p className="text-sm text-cedu-ink-muted">Crea tu cuenta gratuita para ver esta sección</p>
                    <Link href="/auth">
                      <Button size="sm" className="bg-[#1b5adf] hover:bg-blue-700 text-white mt-3" data-testid={`stps-signup-section-${i}`}>
                        <UserPlus size={14} className="mr-1" /> Crear cuenta gratis
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <CardContent className="pt-5">
                    <ModuleContentView contentHtml={mod.contentHtml || ""} moduleTitle={mod.title} index={i} />
                  </CardContent>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      {allReferences.length > 0 && (
        <Card className="border-black/[0.06]" data-testid="stps-references">
          <CardContent className="pt-5">
            <h3 className="font-serif text-lg text-cedu-ink mb-4 flex items-center gap-2">
              <FileText size={18} className="text-[#1b5adf]" />
              Referencias y Bibliografía
            </h3>
            <div className="space-y-2">
              {allReferences.map((ref, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-cedu-ink-soft">
                  <span className="text-[#1b5adf] mt-0.5 text-xs">•</span>
                  <span>{ref}</span>
                  {ref.startsWith("http") && (
                    <a href={ref} target="_blank" rel="noopener noreferrer" className="text-[#1b5adf] hover:underline flex-shrink-0">
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!user && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1b5adf]/[0.05] to-[#7c3aed]/[0.05] border border-[#1b5adf]/10" data-testid="stps-cta-signup">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1b5adf] to-[#7c3aed] flex items-center justify-center flex-shrink-0">
              <GraduationCap size={28} className="text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-serif text-lg text-cedu-ink mb-1">Obtén tu certificación</h3>
              <p className="text-sm text-cedu-ink-muted">Regístrate gratis para completar la conferencia, obtener tu diploma digital y optar por la constancia DC-3.</p>
            </div>
            <Link href="/auth">
              <Button className="bg-[#1b5adf] hover:bg-blue-700 text-white shrink-0" data-testid="stps-button-signup">
                <UserPlus size={16} className="mr-1.5" /> Crear cuenta gratis
              </Button>
            </Link>
          </div>
        </div>
      )}

      {user && !allCompleted && (
        <Card className="border-2 border-black/[0.06]" data-testid="stps-progress-cta">
          <CardContent className="py-6 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-black/[0.06]">
              <Headphones size={28} className="text-cedu-ink-muted" />
            </div>
            <h3 className="font-serif text-xl text-cedu-ink mb-2">Sigue escuchando</h3>
            <p className="text-sm text-cedu-ink-muted mb-2">
              Escucha la conferencia completa para completar el curso y obtener tu diploma digital.
            </p>
            <p className="text-xs text-cedu-ink-muted">
              {completedModules.size} de {modules.length} secciones completadas
            </p>
            <Progress value={modules.length > 0 ? (completedModules.size / modules.length) * 100 : 0} className="h-2 mt-3 max-w-xs mx-auto" />
          </CardContent>
        </Card>
      )}

      {user && allCompleted && (
        <Card className="border-2 border-[#7c3aed]/30 bg-[#7c3aed]/[0.03]" data-testid="stps-tutor-cta">
          <CardContent className="py-6 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[#7c3aed]">
              <Sparkles size={28} className="text-white" />
            </div>
            <h3 className="font-serif text-xl text-cedu-ink mb-2">¡Conferencia completada!</h3>
            <p className="text-sm text-cedu-ink-muted mb-4">
              Continúa tu capacitación con el Tutor IA para obtener un segundo diploma digital y tu certificado DC-3 o SEP.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href={`/tutor-ia/${slug}`}>
                <Button className="bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white" data-testid="stps-button-go-tutor-ia">
                  <Sparkles size={16} className="mr-2" /> Ir al Tutor IA de este curso
                </Button>
              </Link>
              <Link href="/tutor-ia-vivo">
                <Button className="bg-[#1b5adf] hover:bg-[#1b5adf]/90 text-white" data-testid="stps-button-go-tutor-vivo">
                  <Video size={16} className="mr-2" /> Tutor IA en Vivo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {user && allCompleted && (
        <div className="rounded-2xl overflow-hidden" data-testid="stps-next-steps">
          <div className="bg-gradient-to-r from-[#7c3aed] to-[#1b5adf] p-6 sm:p-8">
            <div className="text-center mb-6">
              <PartyPopper size={36} className="text-white/80 mx-auto mb-3" />
              <h2 className="font-serif text-2xl sm:text-3xl text-white mb-2" data-testid="text-congrats-title">
                ¡Felicidades! Completaste {course.title}
              </h2>
              <p className="text-white/70 text-sm">Ahora puedes obtener tu certificación oficial</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10 text-center" data-testid="cert-option-nft">
                <div className="w-12 h-12 rounded-full bg-[#00b87a]/20 flex items-center justify-center mx-auto mb-3">
                  <Award size={24} className="text-[#00b87a]" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">Diploma NFT</h3>
                <p className="text-white/60 text-xs mb-3">Gratis — Se emite automáticamente</p>
                <Badge className="bg-[#00b87a] text-white border-0 text-xs">Incluido</Badge>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10 text-center" data-testid="cert-option-dc3">
                <div className="w-12 h-12 rounded-full bg-[#f28023]/20 flex items-center justify-center mx-auto mb-3">
                  <FileCheck size={24} className="text-[#f28023]" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">Constancia DC-3 STPS</h3>
                <p className="text-white/60 text-xs mb-3">$499 MXN — Validez oficial ante STPS</p>
                <div className="flex flex-col gap-1.5">
                  <Link href="/dashboard?tab=certificados">
                    <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs w-full" data-testid="button-request-dc3">
                      Solicitar DC-3
                    </Button>
                  </Link>
                  <Link href={`/tutor-ia/${slug}`}>
                    <Button size="sm" variant="ghost" className="text-white/60 hover:text-white text-[10px] w-full" data-testid="button-dc3-tutor-ia">
                      Profundiza con Tutor IA
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10 text-center" data-testid="cert-option-sep">
                <div className="w-12 h-12 rounded-full bg-[#1b5adf]/20 flex items-center justify-center mx-auto mb-3">
                  <GraduationCap size={24} className="text-[#60a5fa]" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">Certificado SEP</h3>
                <p className="text-white/60 text-xs mb-3">$1,999 MXN — Validez federal vía INEC</p>
                <Link href="/dashboard?tab=certificados">
                  <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs" data-testid="button-request-sep">
                    Solicitar SEP
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-cedu-cream border-t border-black/[0.06] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-cedu-violet" />
                <span className="text-sm text-cedu-ink">¿Quieres profundizar?</span>
              </div>
              <Link href={`/tutor-ia/${slug}`}>
                <Button variant="outline" size="sm" className="gap-1 text-cedu-violet border-cedu-violet/30 hover:bg-cedu-violet/5" data-testid="button-tutor-ia-deepdive">
                  Toma este curso con el Tutor IA <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-black/[0.06]">
              <div className="flex items-center gap-2">
                <Download size={18} className="text-cedu-blue" />
                <span className="text-sm text-cedu-ink">Material del curso</span>
              </div>
              <PdfDownloadButton courseTitle={course.title} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CursoVirtual() {
  useForceLightMode();
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(`ceduverse-completed-${slug}`);
      return saved ? new Set(JSON.parse(saved)) : new Set<number>();
    } catch { return new Set<number>(); }
  });
  const [resumeApplied, setResumeApplied] = useState(false);
  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showResumeLanding, setShowResumeLanding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem(`aula_virtual_onboarding_${slug}`); } catch { return true; }
  });

  const { data: allCourses = [] } = useQuery<CourseInfo[]>({
    queryKey: ["/api/courses"],
  });

  const course = allCourses.find(c => c.slug === slug);

  const { data: modules = [], isLoading: modulesLoading } = useQuery<CourseModule[]>({
    queryKey: ["/api/courses", course?.id, "modules"],
    enabled: !!course,
    queryFn: async () => {
      const res = await fetch(`/api/courses/${course!.id}/modules`);
      if (!res.ok) throw new Error("Error cargando módulos");
      return res.json();
    },
  });

  const { data: userCourses = [] } = useQuery<any[]>({
    queryKey: ["/api/me/courses"],
    enabled: !!user,
  });

  const userEnrollment = course ? userCourses.find((uc: any) => uc.courseId === course.id) : null;
  const isEnrolled = !!userEnrollment;
  const hasProgress = completedModules.size > 0;

  useEffect(() => {
    if (modules.length > 0 && !resumeApplied) {
      let resumeIdx = 0;
      for (let i = 0; i < modules.length; i++) {
        if (!completedModules.has(i)) {
          resumeIdx = i;
          break;
        }
        if (i === modules.length - 1) resumeIdx = modules.length - 1;
      }
      setActiveModuleIndex(resumeIdx);
      setResumeApplied(true);
    }
  }, [modules, completedModules, resumeApplied]);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!course) return;
      await apiRequest("POST", "/api/me/courses", { courseId: course.id, courseSlug: course.slug });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/courses"] });
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: async () => {
      if (!course) return;
      await apiRequest("DELETE", `/api/me/courses/${course.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/courses"] });
      localStorage.removeItem(`ceduverse-completed-${slug}`);
      setCompletedModules(new Set());
      toast({ title: "Has salido del curso", description: "Tu inscripción ha sido eliminada." });
      navigate("/aula-virtual");
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo salir del curso.", variant: "destructive" });
    },
  });

  const handleResetProgress = () => {
    localStorage.removeItem(`ceduverse-completed-${slug}`);
    setCompletedModules(new Set());
    setActiveModuleIndex(0);
    setResumeApplied(false);
    if (user && course) {
      apiRequest("PATCH", `/api/me/courses/${course.id}`, { completed: 0 }).catch(() => {});
    }
    toast({ title: "Curso reiniciado", description: "Tu progreso ha sido reiniciado." });
  };

  const saveCompleted = (newSet: Set<number>) => {
    setCompletedModules(newSet);
    try {
      localStorage.setItem(`ceduverse-completed-${slug}`, JSON.stringify(Array.from(newSet)));
    } catch {}
  };

  useEffect(() => {
    if (!userEnrollment || modules.length === 0) return;
    const serverPct = userEnrollment.completed || 0;
    if (serverPct >= 100) {
      if (completedModules.size < modules.length) {
        saveCompleted(new Set(modules.map((_: any, i: number) => i)));
      }
      return;
    }
    // Progreso PARCIAL: reconstruimos cuántos módulos equivalen al % guardado en
    // el servidor y solo hidratamos si va MÁS adelante que el avance local, para
    // que al abrir el curso en otro dispositivo no se vea 0% habiendo progreso.
    const serverCount = Math.round((serverPct / 100) * modules.length);
    if (serverCount > completedModules.size) {
      const hydrated = new Set(modules.map((_: any, i: number) => i).slice(0, serverCount));
      saveCompleted(hydrated);
    }
  }, [userEnrollment?.completed, modules.length]);

  if (!course) {
    if (allCourses.length === 0) {
      return (
        <div className="min-h-screen bg-cedu-cream flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="w-48 h-6 mx-auto mb-4" />
            <Skeleton className="w-64 h-4 mx-auto" />
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-cedu-cream flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-cedu-ink-muted/40 mb-4" />
          <h2 className="font-serif text-xl text-cedu-ink mb-2">Curso no encontrado</h2>
          <Link href="/aula-virtual">
            <Button className="bg-cedu-blue hover:bg-cedu-blue-dark mt-4" data-testid="button-back-aula">
              Volver al Aula Virtual
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (user && !isEnrolled) {
    return (
      <div className="min-h-screen bg-cedu-cream flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <GraduationCap size={56} className="mx-auto text-cedu-blue/40 mb-4" />
          <h1 className="font-serif text-2xl text-cedu-ink mb-2" data-testid="text-course-title">{course.title}</h1>
          {course.areaTematica && (
            <p className="text-sm text-cedu-ink-muted mb-1">{course.areaTematica}</p>
          )}
          {course.description && (
            <p className="text-sm text-cedu-ink-soft mb-6">{course.description}</p>
          )}
          <Button
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending}
            className="bg-cedu-blue hover:bg-cedu-blue-dark text-white gap-2"
            data-testid="button-start-course"
          >
            {enrollMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Play size={16} />
            )}
            Iniciar curso
          </Button>
          <div className="mt-4">
            <Link href="/aula-virtual">
              <Button variant="outline" data-testid="button-back-aula">
                <ArrowLeft size={14} className="mr-2" /> Volver al Aula Virtual
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user && isEnrolled && hasProgress && showResumeLanding) {
    const progressPct = modules.length > 0 ? Math.round((completedModules.size / modules.length) * 100) : 0;
    return (
      <>
        <div className="min-h-screen bg-cedu-cream flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <GraduationCap size={56} className="mx-auto text-cedu-blue/40 mb-4" />
            <h1 className="font-serif text-2xl text-cedu-ink mb-2" data-testid="text-course-title">{course.title}</h1>
            <p className="text-sm text-cedu-ink-muted mb-2">{completedModules.size} de {modules.length} módulos completados</p>
            <div className="w-full max-w-xs mx-auto bg-black/[0.06] rounded-full h-2 mb-6">
              <div className="bg-cedu-blue h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex flex-col gap-3 items-center">
              <Button
                onClick={() => setShowResumeLanding(false)}
                className="bg-cedu-blue hover:bg-cedu-blue-dark text-white gap-2 w-full max-w-xs"
                data-testid="button-continue-course"
              >
                <Play size={16} /> Continuar curso
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowResumeLanding(false); setShowResetDialog(true); }}
                className="gap-2 w-full max-w-xs"
                data-testid="button-restart-course-landing"
              >
                <RotateCcw size={14} /> Reiniciar curso
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowUnenrollDialog(true); }}
                className="text-cedu-ink-muted gap-2"
                data-testid="button-leave-course-landing"
              >
                <LogOut size={14} /> Salir del curso
              </Button>
            </div>
          </div>
        </div>
        <Dialog open={showUnenrollDialog} onOpenChange={setShowUnenrollDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Salir del curso?</DialogTitle>
              <DialogDescription>
                Se eliminará tu inscripción y todo tu progreso en este curso. Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUnenrollDialog(false)} data-testid="button-cancel-unenroll-landing">
                Cancelar
              </Button>
              <Button
                onClick={() => { setShowUnenrollDialog(false); unenrollMutation.mutate(); }}
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={unenrollMutation.isPending}
                data-testid="button-confirm-unenroll-landing"
              >
                {unenrollMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <LogOut size={14} className="mr-2" />}
                Salir del curso
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Reiniciar curso?</DialogTitle>
              <DialogDescription>
                Se borrará todo tu progreso y comenzarás el curso desde el principio. Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetDialog(false)} data-testid="button-cancel-reset-landing">
                Cancelar
              </Button>
              <Button
                onClick={() => { setShowResetDialog(false); handleResetProgress(); }}
                className="bg-cedu-orange hover:bg-cedu-orange/90 text-white"
                data-testid="button-confirm-reset-landing"
              >
                <RotateCcw size={14} className="mr-2" /> Reiniciar curso
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }


  const handleMarkSectionComplete = async (index: number) => {
    const newSet = new Set(completedModules);
    newSet.add(index);
    // Guardamos SIEMPRE el progreso local primero: aunque el servidor rechace
    // el sync, el usuario no pierde el avance de esta sesión.
    saveCompleted(newSet);
    if (user && course) {
      const progressPct = Math.round((newSet.size / modules.length) * 100);
      try {
        await apiRequest("PATCH", `/api/me/courses/${course.id}`, { completed: progressPct });
        toast({ title: "Sección completada", description: "Tu progreso se ha guardado." });
      } catch {
        toast({ title: "Guardado localmente", description: "Tu avance se guardó en este dispositivo y se sincronizará más tarde." });
      }
    } else {
      toast({ title: "Sección completada", description: "Tu progreso se ha guardado." });
    }
  };

  return (
    <div className="min-h-screen bg-cedu-cream" data-testid="page-curso-virtual">
      <header className="sticky top-0 z-20 bg-cedu-cream/85 backdrop-blur-xl border-b border-black/[0.06] px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/aula-virtual">
            <Button variant="ghost" size="sm" className="gap-1 text-cedu-ink-muted" data-testid="button-back-aula">
              <ArrowLeft size={16} /> <span className="hidden sm:inline">Aula Virtual</span>
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="font-serif text-sm sm:text-base text-cedu-ink truncate" data-testid="text-header-title">
              {course.title}
            </h1>
            {course.instructor && (
              <p className="text-[11px] text-cedu-ink-muted truncate hidden sm:block">{course.instructor}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {course.dc3Disponible && (
            <Badge className="bg-cedu-orange text-white text-[10px] hidden sm:inline-flex">DC-3</Badge>
          )}
          {user && isEnrolled && hasProgress && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              className="text-cedu-orange border-cedu-orange/30 hover:bg-cedu-orange-light gap-1 text-xs"
              data-testid="button-restart-course"
            >
              <RotateCcw size={12} /> Reiniciar
            </Button>
          )}
          {user && isEnrolled && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareModal(true)}
                className="gap-1 text-xs text-cedu-blue border-cedu-blue/20 hover:bg-cedu-blue-light"
                data-testid="button-share-course"
              >
                <Share2 size={12} /> <span className="hidden sm:inline">Invitar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUnenrollDialog(true)}
                className="text-red-500 border-red-200 hover:bg-red-50 gap-1 text-xs"
                data-testid="button-leave-course"
              >
                <LogOut size={12} /> <span className="hidden sm:inline">Salir</span>
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {modulesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="empty-modules-placeholder">
            <div className="w-20 h-20 rounded-2xl bg-cedu-blue-light flex items-center justify-center mb-6">
              <BookOpen size={36} className="text-cedu-blue" />
            </div>
            <h2 className="font-serif text-2xl text-cedu-ink mb-3" data-testid="text-empty-modules-title">Contenido en preparación</h2>
            <p className="text-sm text-cedu-ink-muted max-w-md mb-2">
              Estamos trabajando en el contenido de este curso. La sesión estará disponible muy pronto.
            </p>
            <Link href="/aula-virtual">
              <Button className="bg-cedu-blue hover:bg-cedu-blue-dark mt-4" data-testid="button-back-aula-empty">
                <ArrowLeft size={16} className="mr-2" /> Volver al Aula Virtual
              </Button>
            </Link>
          </div>
        ) : (
          <StpsSessionView
            course={course}
            modules={modules}
            user={user}
            isEnrolled={isEnrolled}
            completedModules={completedModules}
            onMarkSectionComplete={handleMarkSectionComplete}
            onAutoComplete={() => {
              const allIndices = new Set(modules.map((_, i) => i));
              saveCompleted(allIndices);
              queryClient.invalidateQueries({ queryKey: ["/api/me/courses"] });
              queryClient.invalidateQueries({ queryKey: ["/api/me/achievements"] });
              toast({ title: "🎉 ¡Conferencia completada!", description: "Has obtenido tu diploma digital de participación. Continúa con el Tutor IA para tu certificado DC-3 o SEP." });
            }}
            slug={slug}
            activeModuleIndex={activeModuleIndex}
            onActiveModuleChange={setActiveModuleIndex}
          />
        )}
      </main>

      <Dialog open={showUnenrollDialog} onOpenChange={setShowUnenrollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Salir del curso?</DialogTitle>
            <DialogDescription>
              Se eliminará tu inscripción y todo tu progreso en este curso. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnenrollDialog(false)} data-testid="button-cancel-unenroll">
              Cancelar
            </Button>
            <Button
              onClick={() => { setShowUnenrollDialog(false); unenrollMutation.mutate(); }}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={unenrollMutation.isPending}
              data-testid="button-confirm-unenroll"
            >
              {unenrollMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <LogOut size={14} className="mr-2" />}
              Salir del curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Reiniciar curso?</DialogTitle>
            <DialogDescription>
              Se borrará todo tu progreso y comenzarás el curso desde el principio. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)} data-testid="button-cancel-reset">
              Cancelar
            </Button>
            <Button
              onClick={() => { setShowResetDialog(false); handleResetProgress(); }}
              className="bg-cedu-orange hover:bg-cedu-orange/90 text-white"
              data-testid="button-confirm-reset"
            >
              <RotateCcw size={14} className="mr-2" />
              Reiniciar curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShareCourseModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        courseTitle={course?.title || ""}
        courseSlug={slug}
        courseType="aula-virtual"
      />

      <Dialog open={showOnboarding && isEnrolled} onOpenChange={(open) => {
        if (!open) {
          try { localStorage.setItem(`aula_virtual_onboarding_${slug}`, "1"); } catch {}
          setShowOnboarding(false);
        }
      }}>
        <DialogContent className="sm:max-w-lg bg-cedu-cream border-black/[0.06] p-0 gap-0 [&>button]:hidden" data-testid="stps-onboarding">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-cedu-blue/10 flex items-center justify-center">
                <GraduationCap size={28} className="text-cedu-blue" />
              </div>
              <DialogHeader className="space-y-1">
                <DialogTitle className="font-serif text-2xl text-cedu-ink text-center" data-testid="onboarding-title">
                  Bienvenido al Aula Virtual STPS
                </DialogTitle>
                <DialogDescription className="text-cedu-ink-muted text-sm text-center">
                  Así funciona tu capacitación:
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-3">
              {[
                { icon: <PlayCircle size={20} />, title: "Escucha la sesión de audio", desc: "Cada módulo tiene una sesión de audio que puedes escuchar como podcast mientras trabajas." },
                { icon: <FileText size={20} />, title: "Lee el material de apoyo", desc: "Debajo del audio encontrarás el contenido escrito con los puntos clave de la sesión." },
                { icon: <CheckCircle2 size={20} />, title: "Se completa automáticamente", desc: "Al escuchar el 95% del audio, la conferencia se marca como completada y recibes tu diploma." },
                { icon: <Sparkles size={20} />, title: "Continúa con el Tutor IA", desc: "Después de la conferencia, toma el curso con el Tutor IA para tu segundo diploma y certificado DC-3 o SEP." },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3.5 border border-black/[0.06]" data-testid={`onboarding-step-${i + 1}`}>
                  <div className="w-9 h-9 rounded-full bg-cedu-blue/10 flex items-center justify-center text-cedu-blue shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-cedu-ink text-sm">{step.title}</p>
                    <p className="text-xs text-cedu-ink-muted mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => {
                try { localStorage.setItem(`aula_virtual_onboarding_${slug}`, "1"); } catch {}
                setShowOnboarding(false);
              }}
              className="w-full bg-cedu-blue hover:bg-cedu-blue/90 text-white h-11 text-base gap-2"
              data-testid="button-onboarding-start"
            >
              Entendido, comenzar
              <ArrowRight size={18} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
