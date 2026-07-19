import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import DOMPurify from "dompurify";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { authUrlWithNext } from "@/lib/next-destination";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import AudioClassPlayer from "@/components/AudioClassPlayer";
import { useTheme } from "@/components/ThemeProvider";
import {
  ArrowLeft,
  Brain,
  BookOpen,
  Map,
  HelpCircle,
  Link2,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  FileCheck,
  Loader2,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  X,
  Award,
  Download,
  FileText,
  Scale,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Zap,
  Moon,
  Sun,
  Trophy,
  Printer,
  Play,
  RotateCcw,
  LogOut,
  Share2,
  Lock,
  Camera,
  ClipboardList,
} from "lucide-react";
import ShareCourseModal from "@/components/ShareCourseModal";
import { QRCodeSVG } from "qrcode.react";
import { certTabMessage, type CertTabState, type PaidCertType } from "@shared/cert-eligibility";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StudioModule {
  id: string;
  courseId: string;
  moduleIndex: number;
  title: string;
  description: string | null;
  contentHtml: string;
  videoUrl: string | null;
  references: string[] | null;
  durationMinutes: number | null;
}

interface StudioQuiz {
  id: string;
  courseId: string;
  title: string;
  passingScore: number;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

interface StudioCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  durationMinutes: number | null;
  level: string | null;
  tags: string[] | null;
  dc3Available: boolean | null;
  icon: string | null;
  color: string | null;
  source: string | null;
}

function getYouTubeEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${parsed.pathname}`;
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.includes("/embed/")) return url;
      const videoId = parsed.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  } catch {
    return url;
  }
}

interface MindMapBranch {
  label: string;
  color?: string;
  children: ({ label: string; detail?: string } | string)[];
}

interface GeneratedContent {
  id?: string;
  lectureHtml: string;
  mindMap: { central: string; branches: MindMapBranch[] } | null;
  reflections: string[] | null;
  adaptiveQuiz: { question: string; options: string[]; correctIndex: number; explanation: string }[] | null;
  suggestedSources: { title: string; url: string; type: string }[] | null;
  classScript?: string | null;
  isStub?: boolean;
  generationStatus?: string;
  // Present only on a "failed" response while the server is honoring the
  // backoff (see server/lib/generation-retry.ts): tells the user the truth
  // (generation is failing, when/if it retries on its own) instead of
  // silently showing generic content as if it were personalized.
  consecutiveFailures?: number;
  ceilingReached?: boolean;
  nextRetryAt?: string | null;
}

interface ModuleProgress {
  id: string;
  enrollmentId: string;
  moduleIdentifier: string;
  completed: boolean;
  completedAt: string | null;
  quizScore: number | null;
  timeSpentSeconds: number | null;
}

type ContentTab = "lectura" | "mapa" | "quiz" | "fuentes" | "certificado" | "playbook";

const LOADING_TIPS = [
  "El Tutor IA personaliza el contenido a tu puesto e industria",
  "Puedes hacerle preguntas al Tutor IA en el chat",
  "Al aprobar recibirás un certificado con validez curricular",
  "El contenido incluye normatividad mexicana real",
  "Cada módulo tiene mapa mental, quiz y fuentes de consulta",
];

function ModulePill({ index, title, active, completed, locked, onClick }: {
  index: number; title: string; active: boolean; completed: boolean; locked: boolean; onClick: () => void;
}) {
  const lockHint = "Aprueba el quiz del módulo anterior para desbloquear.";
  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      aria-disabled={locked}
      title={locked ? lockHint : undefined}
      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
        locked
          ? "bg-gray-50 dark:bg-gray-900 text-cedu-ink-muted/60 dark:text-gray-600 border border-black/[0.04] dark:border-white/[0.06] cursor-not-allowed"
          : active
            ? "bg-cedu-blue text-white shadow-sm"
            : completed
              ? "bg-cedu-green-light dark:bg-cedu-green/10 text-cedu-green border border-cedu-green/20"
              : "bg-white dark:bg-gray-800 text-cedu-ink-soft dark:text-gray-300 border border-black/[0.06] dark:border-white/[0.08] hover:border-cedu-blue/30"
      }`}
      data-testid={`button-module-${index}`}
    >
      {locked ? (
        <Lock size={14} />
      ) : completed ? (
        <CheckCircle2 size={14} />
      ) : (
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
          active ? "bg-white/20 text-white" : "bg-black/[0.04] text-cedu-ink-muted"
        }`}>{index + 1}</span>
      )}
      {/* En movil el nombre solo se muestra en el modulo ACTIVO: asi sabes que
          estas estudiando sin que la barra se vuelva ilegible. Los demas se
          identifican por su numero. En pantallas grandes se muestran todos. */}
      <span className={`truncate ${active ? "inline max-w-[190px]" : "hidden sm:inline max-w-[140px]"}`}>{title}</span>
    </button>
  );
}

function generateProblem(level: number) {
  const ops = ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * (level > 5 ? 3 : 2))];
  let a: number, b: number, answer: number;
  const max = Math.min(10 + level * 3, 50);
  if (op === "+") {
    a = Math.floor(Math.random() * max) + 1;
    b = Math.floor(Math.random() * max) + 1;
    answer = a + b;
  } else if (op === "-") {
    a = Math.floor(Math.random() * max) + 2;
    b = Math.floor(Math.random() * a) + 1;
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 12) + 2;
    b = Math.floor(Math.random() * 12) + 2;
    answer = a * b;
  }
  return { text: `${a} ${op} ${b}`, answer };
}

function LoadingState({ profile }: { profile?: { jobTitle?: string; industry?: string } }) {
  const [tipIndex, setTipIndex] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [problem, setProblem] = useState(() => generateProblem(1));
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tipTimer = setInterval(() => setTipIndex(i => (i + 1) % LOADING_TIPS.length), 5000);
    return () => clearInterval(tipTimer);
  }, []);

  useEffect(() => {
    if (!gameActive || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000);
    return () => clearTimeout(t);
  }, [gameActive, timeLeft]);

  useEffect(() => {
    if (gameActive && timeLeft === 0 && score > 0) {
      setGameActive(false);
    }
  }, [timeLeft, gameActive, score]);

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    setProblem(generateProblem(1));
    setUserInput("");
    setFeedback(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(userInput);
    if (isNaN(parsed)) return;
    if (parsed === problem.answer) {
      const newStreak = streak + 1;
      const bonus = newStreak >= 5 ? 3 : newStreak >= 3 ? 2 : 1;
      setScore(s => s + bonus);
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      setFeedback("correct");
      setProblem(generateProblem(Math.floor(newStreak / 2) + 1));
    } else {
      setStreak(0);
      setFeedback("wrong");
      setProblem(generateProblem(1));
    }
    setUserInput("");
    setTimeout(() => setFeedback(null), 400);
    inputRef.current?.focus();
  };

  return (
    <div className="flex items-center justify-center py-12" data-testid="loading-state">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-14 h-14 bg-gradient-to-br from-cedu-blue to-cedu-violet rounded-2xl flex items-center justify-center mx-auto">
          <Brain size={28} className="text-white animate-pulse" />
        </div>
        <div>
          <h3 className="font-serif text-lg text-cedu-ink dark:text-white mb-1">Personalizando tu clase a tu perfil…</h3>
          <p className="text-xs text-cedu-ink-muted dark:text-gray-400 mt-1">
            Esto toma cerca de un minuto — tu clase se está adaptando a tu puesto e industria. Vale la pena. ✨
          </p>
          {profile?.jobTitle && (
            <p className="text-xs text-cedu-ink-muted dark:text-gray-400 mt-1">
              Personalizando para: <strong>{profile.jobTitle}</strong> en <strong>{profile.industry || "tu industria"}</strong>
            </p>
          )}
        </div>
        <div className="px-8 flex items-center justify-center gap-2" data-testid="loading-progress-indeterminate">
          <Loader2 size={14} className="text-cedu-blue animate-spin shrink-0" aria-hidden="true" />
          <div className="h-1.5 w-full rounded-full bg-cedu-blue/10 dark:bg-cedu-blue/20 overflow-hidden">
            <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-cedu-blue to-cedu-violet animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 mx-4 shadow-sm" data-testid="mini-game">
          {!gameActive && timeLeft === 0 && score === 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-cedu-orange">
                <Zap size={18} />
                <span className="font-semibold text-sm">Reto Numérico</span>
              </div>
              <p className="text-xs text-cedu-ink-muted dark:text-gray-400">Resuelve operaciones lo más rápido posible. Rachas = puntos extra.</p>
              <button
                onClick={startGame}
                data-testid="button-start-game"
                className="px-5 py-2 bg-cedu-orange hover:bg-cedu-orange/90 text-white rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                Jugar mientras esperas
              </button>
            </div>
          ) : !gameActive && timeLeft === 0 ? (
            <div className="space-y-3">
              <div className="text-3xl font-bold text-cedu-ink dark:text-white">{score}</div>
              <p className="text-sm text-cedu-ink-muted dark:text-gray-400">puntos en 30 segundos</p>
              {bestStreak >= 3 && (
                <p className="text-xs text-cedu-orange font-medium">Mejor racha: {bestStreak} seguidas</p>
              )}
              <button
                onClick={startGame}
                data-testid="button-restart-game"
                className="px-5 py-2 bg-cedu-orange hover:bg-cedu-orange/90 text-white rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
              >
                Jugar de nuevo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cedu-ink dark:text-white text-lg">{score}</span>
                  <span className="text-cedu-ink-muted dark:text-gray-400">pts</span>
                </div>
                {streak >= 3 && (
                  <span className="px-2 py-0.5 bg-cedu-orange/10 text-cedu-orange rounded-full text-[11px] font-bold animate-pulse">
                    {streak}x racha
                  </span>
                )}
                <div className="flex items-center gap-1 text-cedu-ink-muted">
                  <Clock size={12} />
                  <span className={`font-mono font-bold ${timeLeft <= 5 ? "text-red-500" : ""}`}>{timeLeft}s</span>
                </div>
              </div>

              <div className={`text-4xl font-bold font-mono tracking-wider py-3 transition-colors ${
                feedback === "correct" ? "text-cedu-green" : feedback === "wrong" ? "text-red-500" : "text-cedu-ink dark:text-white"
              }`}>
                {problem.text} = ?
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2 justify-center">
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="numeric"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="..."
                  autoFocus
                  data-testid="input-game-answer"
                  className={`w-24 text-center text-xl font-bold py-2 rounded-xl border-2 outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    feedback === "correct" ? "border-cedu-green bg-cedu-green/5" :
                    feedback === "wrong" ? "border-red-400 bg-red-50" :
                    "border-black/10 focus:border-cedu-blue bg-white dark:bg-gray-900"
                  }`}
                />
                <button
                  type="submit"
                  data-testid="button-submit-answer"
                  className="px-4 py-2 bg-cedu-blue hover:bg-cedu-blue/90 text-white rounded-xl font-semibold text-sm transition-all active:scale-95"
                >
                  OK
                </button>
              </form>
              <p className="text-[10px] text-cedu-ink-muted">Presiona Enter para responder</p>
            </div>
          )}
        </div>

        <p className="text-xs text-cedu-ink-muted dark:text-gray-500 italic px-4 min-h-[32px]">{LOADING_TIPS[tipIndex]}</p>
      </div>
    </div>
  );
}

function extractHeadings(html: string): { id: string; text: string }[] {
  const regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const headings: { id: string; text: string }[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, "").trim();
    const id = `heading-${headings.length}`;
    headings.push({ id, text });
  }
  return headings;
}

function addIdsToHeadings(html: string): string {
  let idx = 0;
  return html.replace(/<h2([^>]*)>/gi, () => {
    const id = `heading-${idx++}`;
    return `<h2 id="${id}">`;
  });
}

function StubBanner({ onRegenerate, isRegenerating }: { onRegenerate: () => void; isRegenerating: boolean }) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-xl p-4 mb-4 flex items-start gap-3" data-testid="banner-stub">
      <AlertTriangle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-yellow-800 font-medium">Contenido genérico</p>
        <p className="text-xs text-yellow-700 mt-1">
          Este contenido no está personalizado a tu perfil. Haz clic en "Regenerar" para obtener contenido adaptado a tu puesto e industria.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRegenerate}
        disabled={isRegenerating}
        className="text-yellow-700 border-yellow-300 hover:bg-yellow-100 gap-1 shrink-0"
        data-testid="button-regenerate-stub"
      >
        {isRegenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        Regenerar
      </Button>
    </div>
  );
}

/** Countdown text for the next automatic retry. Re-renders every second so
 *  it stays truthful instead of showing a stale "en 2 minutos" forever. */
function useCountdown(targetIso: string | null | undefined): string | null {
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!targetIso) return;
    const id = setInterval(() => forceTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  if (!targetIso) return null;
  const remainingMs = new Date(targetIso).getTime() - Date.now();
  if (remainingMs <= 0) return "en un momento";
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `en ${seconds}s`;
  return `en ${minutes} min ${seconds}s`;
}

/** Honest failed state: no personalization succeeded (yet). Never dressed up
 *  as real content — states plainly that it's failing, how many times, and
 *  either when it'll retry on its own or that it stopped retrying and needs
 *  a manual push. The project's rule against silent degradation applies here
 *  as much as anywhere: showing static/generic content with no explanation
 *  would look like personalization that never actually happened. */
function GenerationFailedBanner({
  consecutiveFailures,
  ceilingReached,
  nextRetryAt,
  onRegenerate,
  isRegenerating,
}: {
  consecutiveFailures?: number;
  ceilingReached?: boolean;
  nextRetryAt?: string | null;
  onRegenerate: () => void;
  isRegenerating: boolean;
}) {
  const countdown = useCountdown(ceilingReached ? null : nextRetryAt);
  const attempts = consecutiveFailures ?? 1;
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl p-4 mb-4 flex items-start gap-3" data-testid="banner-generation-failed">
      <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-red-800 dark:text-red-300 font-medium">
          No pudimos generar el contenido personalizado de este módulo
        </p>
        <p className="text-xs text-red-700 dark:text-red-400 mt-1">
          {ceilingReached
            ? `Fallaron ${attempts} intentos automáticos seguidos, así que dejamos de reintentar solos. Puedes forzar un nuevo intento con el botón.`
            : `Falló el intento ${attempts}. Reintentaremos automáticamente${countdown ? ` ${countdown}` : ""}, o puedes forzar un intento ahora.`}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRegenerate}
        disabled={isRegenerating}
        className="text-red-700 border-red-300 hover:bg-red-100 gap-1 shrink-0"
        data-testid="button-regenerate-failed"
      >
        {isRegenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        Regenerar
      </Button>
    </div>
  );
}

/** Shown instead of generating content when the module isn't unlocked yet
 *  (normally unreachable via the sidebar/nav, which are locked — this covers
 *  edge cases like a deep link or a resumed session landing on a module
 *  whose previous quiz hasn't been passed). Never silently generates. */
function LockedModuleState({ onGoToPrevious }: { onGoToPrevious: () => void }) {
  return (
    <div className="text-center py-16 px-4" data-testid="locked-module-state">
      <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Lock size={24} className="text-cedu-ink-muted dark:text-gray-500" />
      </div>
      <h3 className="font-serif text-lg text-cedu-ink dark:text-white mb-2">Módulo bloqueado</h3>
      <p className="text-sm text-cedu-ink-muted dark:text-gray-400 max-w-sm mx-auto mb-6">
        Módulo bloqueado — aprueba el quiz del módulo anterior para desbloquearlo.
      </p>
      <Button variant="outline" onClick={onGoToPrevious} className="gap-2 rounded-xl" data-testid="button-locked-go-prev">
        <ArrowLeft size={16} /> Ir al módulo anterior
      </Button>
    </div>
  );
}

function LectureView({ html, reflections, isStub, onRegenerate, isRegenerating, courseSlug, moduleIndex, classScript, moduleTitle }: {
  html: string;
  reflections?: string[] | null;
  isStub?: boolean;
  onRegenerate: () => void;
  isRegenerating: boolean;
  courseSlug?: string;
  moduleIndex?: number;
  classScript?: string | null;
  moduleTitle?: string;
}) {
  const lectureContentRef = useRef<HTMLDivElement>(null);
  const headings = useMemo(() => extractHeadings(html), [html]);
  const processedHtml = useMemo(() => addIdsToHeadings(html), [html]);
  const plainText = useMemo(() => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(), [html]);
  const readingTime = useMemo(() => Math.ceil(plainText.split(/\s+/).length / 200), [plainText]);

  return (
    <div className="flex gap-6" data-testid="view-lectura">
      <div className="flex-1 min-w-0">
        {isStub && <StubBanner onRegenerate={onRegenerate} isRegenerating={isRegenerating} />}

        {courseSlug !== undefined && moduleIndex !== undefined && !isStub && (
          <AudioClassPlayer
            courseSlug={courseSlug}
            moduleIndex={moduleIndex}
            classScript={classScript ?? undefined}
            moduleTitle={moduleTitle}
          />
        )}

        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-cedu-blue bg-cedu-blue-light dark:bg-cedu-blue/15 dark:text-blue-300 px-3 py-1.5 rounded-full">
            <Clock size={14} /> ~{readingTime} min de lectura
          </span>
          {!isStub && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="min-h-9 text-xs sm:text-sm gap-1.5 text-cedu-ink-muted hover:text-cedu-blue hover:bg-cedu-blue-light dark:hover:bg-cedu-blue/10"
              data-testid="button-regenerate"
            >
              {isRegenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Regenerar
            </Button>
          )}
        </div>

        <div
          ref={lectureContentRef}
          className="prose prose-base max-w-none prose-headings:font-serif prose-h1:text-cedu-ink dark:prose-h1:text-white prose-h2:text-cedu-blue dark:prose-h2:text-blue-300 prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-cedu-blue/15 dark:prose-h2:border-cedu-blue/25 prose-h3:text-cedu-violet dark:prose-h3:text-violet-300 prose-h3:mt-8 prose-h3:mb-3 prose-h4:text-cedu-ink dark:prose-h4:text-white prose-p:text-cedu-ink-soft dark:prose-p:text-gray-300 prose-p:leading-[1.8] prose-li:text-cedu-ink-soft dark:prose-li:text-gray-300 prose-li:leading-[1.8] prose-strong:text-cedu-ink dark:prose-strong:text-white prose-blockquote:border-cedu-blue prose-blockquote:bg-cedu-blue-light/30 dark:prose-blockquote:bg-cedu-blue/10 prose-blockquote:rounded-lg prose-blockquote:py-1 prose-blockquote:text-cedu-ink-soft dark:prose-blockquote:text-gray-200 [&_blockquote_em]:text-cedu-ink-soft dark:[&_blockquote_em]:text-gray-300 [&_blockquote_p]:text-cedu-ink-soft dark:[&_blockquote_p]:text-gray-200 [&_blockquote_strong]:text-cedu-ink dark:[&_blockquote_strong]:text-white prose-em:text-cedu-ink-soft dark:prose-em:text-gray-300 prose-table:text-sm [&_td]:border [&_td]:border-black/[0.06] dark:[&_td]:border-white/[0.08] [&_td]:px-3 [&_td]:py-2 [&_td]:text-cedu-ink-soft dark:[&_td]:text-gray-300 [&_th]:border [&_th]:border-black/[0.06] dark:[&_th]:border-white/[0.08] [&_th]:px-3 [&_th]:py-2 [&_th]:bg-gray-50 dark:[&_th]:bg-gray-800 dark:[&_th]:text-white dark:prose-a:text-cedu-blue dark:prose-code:text-gray-200"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(processedHtml) }}
          data-testid="content-lecture"
        />

        {reflections && reflections.length > 0 && (
          <div className="mt-8 p-5 bg-cedu-violet-light dark:bg-cedu-violet/10 rounded-xl border border-cedu-violet/10">
            <h4 className="font-serif text-base text-cedu-ink dark:text-white mb-3 flex items-center gap-2">
              <HelpCircle size={16} className="text-cedu-violet" /> Preguntas de reflexión
            </h4>
            <ul className="space-y-2">
              {reflections.map((r, i) => (
                <li key={i} className="text-sm text-cedu-ink-soft dark:text-gray-300 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cedu-violet/10 text-cedu-violet flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {headings.length > 2 && (
        <aside className="hidden xl:block w-56 shrink-0 sticky top-[120px] self-start">
          <p className="text-xs font-semibold text-cedu-ink-muted uppercase tracking-wide mb-3">Contenido</p>
          <nav className="space-y-1.5">
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                className="block text-xs text-cedu-ink-muted hover:text-cedu-blue transition-colors line-clamp-2"
              >
                {h.text}
              </a>
            ))}
          </nav>
        </aside>
      )}
    </div>
  );
}

function MindMapView({ data }: { data: { central: string; branches: MindMapBranch[] } }) {
  const [expandedBranch, setExpandedBranch] = useState<number | null>(null);
  const BRANCH_COLORS = ["#1b5adf", "#f28023", "#34d399", "#7c3aed", "#ef4444", "#06b6d4"];

  return (
    <div className="p-6" data-testid="view-mind-map">
      <div className="text-center mb-8">
        <div className="inline-block bg-gradient-to-br from-cedu-blue to-cedu-violet text-white px-8 py-4 rounded-2xl font-serif text-lg shadow-md">
          {data.central}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.branches.map((branch, i) => {
          const color = branch.color || BRANCH_COLORS[i % BRANCH_COLORS.length];
          const isExpanded = expandedBranch === i;
          return (
            <button
              key={i}
              onClick={() => setExpandedBranch(isExpanded ? null : i)}
              className="bg-white dark:bg-gray-800 rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-4 text-left hover:shadow-md transition-all"
              data-testid={`mindmap-branch-${i}`}
            >
              <h4 className="font-semibold text-cedu-ink dark:text-white text-sm mb-3 flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {i + 1}
                </span>
                {branch.label}
                <ChevronDown size={14} className={`ml-auto text-cedu-ink-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </h4>
              <ul className="space-y-2">
                {branch.children.map((child, j) => {
                  const childLabel = typeof child === "string" ? child : child.label;
                  const childDetail = typeof child === "string" ? null : child.detail;
                  return (
                    <li key={j} className="text-xs flex items-start gap-1.5">
                      <ChevronRight size={12} className="mt-0.5 flex-shrink-0" style={{ color }} />
                      <div>
                        <span className="text-cedu-ink dark:text-gray-200 font-medium">{childLabel}</span>
                        {isExpanded && childDetail && (
                          <p className="text-cedu-ink-muted dark:text-gray-500 mt-0.5">{childDetail}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepQuizView({ questions, onQuizComplete, courseSlug, moduleIndex, onNextModule, onCompleteModule, isLastModule, isModuleCompleted }: {
  questions: { question: string; options: string[]; correctIndex: number; explanation: string }[];
  onQuizComplete?: (score: number, total: number, passed: boolean) => void;
  courseSlug: string;
  moduleIndex: number;
  onNextModule?: () => void;
  onCompleteModule?: () => void;
  isLastModule?: boolean;
  isModuleCompleted?: boolean;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  const submitQuizMutation = useMutation({
    mutationFn: async (data: { answers: number[]; score: number }) => {
      const res = await apiRequest("POST", `/api/studio/courses/${courseSlug}/modules/${moduleIndex}/quiz/submit`, data);
      return res.json() as Promise<{ score: number; total: number; scorePercent: number; passed: boolean }>;
    },
    onSuccess: (result) => {
      // Report the result only AFTER the server records the attempt, and use
      // the server's verdict (result.passed). Firing on click — before this
      // POST resolves — raced the quiz-attempts refetch against the write and
      // left the next module locked until a manual reload.
      onQuizComplete?.(result.score, result.total, result.passed);
    },
  });

  const total = questions.length;
  const q = questions[currentQ];
  const isCorrect = selectedAnswer === q?.correctIndex;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const passed = score >= 70;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    setAnswers(prev => [...prev, idx]);
    if (idx === q.correctIndex) setCorrectCount(c => c + 1);
  };

  const handleNext = () => {
    if (currentQ < total - 1) {
      setCurrentQ(c => c + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setFinished(true);
      submitQuizMutation.mutate({ answers: [...answers], score: correctCount });
    }
  };

  const handleRetry = () => {
    setCurrentQ(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setCorrectCount(0);
    setFinished(false);
    setAnswers([]);
  };

  if (finished) {
    return (
      <div className="p-6 text-center" data-testid="quiz-result">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${passed ? "bg-green-100 dark:bg-green-900/30" : "bg-orange-100 dark:bg-orange-900/30"}`}>
          {passed ? <CheckCircle2 size={40} className="text-green-600" /> : <BookOpen size={40} className="text-orange-500" />}
        </div>
        <h3 className="font-serif text-2xl text-cedu-ink dark:text-white mb-2">
          {passed ? "¡Aprobaste!" : "Sigue practicando"}
        </h3>
        <p className="text-cedu-ink-muted dark:text-gray-400 mb-2">Puntuación: {score}% ({correctCount}/{total} correctas)</p>
        <p className="text-sm text-cedu-ink-muted dark:text-gray-500 mb-6">
          {passed
            ? "¡Felicidades! Has demostrado dominio del tema."
            : "Te recomendamos repasar el contenido e intentar de nuevo. Necesitas al menos 70% para aprobar."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {passed ? (
            <>
              <Button onClick={handleRetry} variant="outline" data-testid="button-retry-quiz" className="gap-1">
                <RotateCcw size={14} /> Repetir quiz
              </Button>
              {!isModuleCompleted && onCompleteModule && (
                <Button onClick={onCompleteModule} className="bg-cedu-green hover:bg-cedu-green/90 gap-1" data-testid="button-complete-from-quiz">
                  <CheckCircle2 size={14} /> Completar módulo
                </Button>
              )}
              {!isLastModule && onNextModule && (
                <Button onClick={onNextModule} className="bg-cedu-blue hover:bg-cedu-blue/90 gap-1" data-testid="button-next-from-quiz">
                  Siguiente módulo <ChevronRight size={14} />
                </Button>
              )}
              {isLastModule && isModuleCompleted && (
                <p className="text-sm text-cedu-green font-medium mt-2">🎓 ¡Último módulo completado! Revisa tu certificado.</p>
              )}
            </>
          ) : (
            <Button onClick={handleRetry} variant="outline" data-testid="button-retry-quiz" className="gap-1">
              <RotateCcw size={14} /> Intentar de nuevo
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="view-quiz">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-cedu-ink dark:text-white">Pregunta {currentQ + 1} de {total}</span>
        <span className="text-xs text-cedu-ink-muted dark:text-gray-500">{correctCount} correcta{correctCount !== 1 ? "s" : ""}</span>
      </div>
      <Progress value={((currentQ + (answered ? 1 : 0)) / total) * 100} className="h-1.5 mb-6" />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-5" data-testid={`quiz-question-${currentQ}`}>
        <p className="font-medium text-cedu-ink dark:text-white mb-4">{q.question}</p>
        <div className="space-y-2">
          {q.options.map((opt, oi) => {
            const isSelected = selectedAnswer === oi;
            const showCorrect = answered && oi === q.correctIndex;
            const showWrong = answered && isSelected && oi !== q.correctIndex;
            return (
              <button
                key={oi}
                onClick={() => handleSelect(oi)}
                disabled={answered}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all border ${
                  showCorrect
                    ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
                    : showWrong
                      ? "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400"
                      : isSelected
                        ? "bg-cedu-blue-light dark:bg-cedu-blue/20 border-cedu-blue text-cedu-blue"
                        : "bg-white dark:bg-gray-900 border-black/[0.06] dark:border-white/[0.08] text-cedu-ink dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                data-testid={`quiz-option-${currentQ}-${oi}`}
              >
                <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                {opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${isCorrect ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}>
            <p className="font-medium mb-1">{isCorrect ? "¡Correcto!" : `Incorrecto. La respuesta correcta era: ${String.fromCharCode(65 + q.correctIndex)}`}</p>
            <p className="text-xs opacity-80">{q.explanation}</p>
          </div>
        )}
      </div>

      {answered && (
        <div className="flex justify-end mt-4">
          <Button onClick={handleNext} className="bg-cedu-blue hover:bg-cedu-blue/90" data-testid="button-next-question">
            {currentQ < total - 1 ? "Siguiente pregunta" : "Ver resultados"} <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

const SOURCE_ICONS: Record<string, any> = {
  NOM: FileText,
  nom: FileText,
  LFT: Scale,
  lft: Scale,
  guia: BookOpen,
  "Guía": BookOpen,
  articulo: ExternalLink,
};

function SourcesView({ moduleRefs, aiSources }: {
  moduleRefs?: string[] | null;
  aiSources?: { title: string; url: string; type: string }[] | null;
}) {
  const allSources = [
    ...(moduleRefs || []).map(r => ({ title: r, url: "", type: "referencia" })),
    ...(aiSources || []),
  ];

  if (allSources.length === 0) {
    return (
      <div className="text-center py-12" data-testid="view-fuentes">
        <Link2 size={32} className="mx-auto text-cedu-ink-muted/30 dark:text-gray-600 mb-3" />
        <p className="text-sm text-cedu-ink-muted dark:text-gray-500">Las fuentes se mostrarán al generar contenido con IA</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6" data-testid="view-fuentes">
      <h3 className="font-serif text-lg text-cedu-ink dark:text-white">Fuentes y Referencias</h3>
      <ul className="space-y-2">
        {allSources.map((src, i) => {
          const Icon = SOURCE_ICONS[src.type] || Link2;
          return (
            <li key={i} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-black/[0.06] dark:border-white/[0.08] flex items-start gap-3">
              <Icon size={16} className="text-cedu-blue mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                {src.url ? (
                  <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-sm text-cedu-blue hover:underline">
                    {src.title}
                  </a>
                ) : (
                  <span className="text-sm text-cedu-ink-soft dark:text-gray-300">{src.title}</span>
                )}
                <span className="text-[10px] text-cedu-ink-muted dark:text-gray-500 uppercase ml-2">{src.type}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-cedu-ink-muted dark:text-gray-500 text-center pt-2">
        Fuentes sugeridas. Verifica en fuentes oficiales.
      </p>
    </div>
  );
}

function ChatPanel({ courseSlug, moduleIndex, profile }: {
  courseSlug: string; moduleIndex: number; profile?: { jobTitle?: string; industry?: string };
}) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [pendingMsg, setPendingMsg] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatHistoryData } = useQuery<{ messages: { role: string; content: string }[] }>({
    queryKey: ["chat-history", courseSlug, moduleIndex],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/studio/courses/${courseSlug}/modules/${moduleIndex}/chat/history`);
      return res.json();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (chatHistoryData?.messages && !historyLoaded) {
      setChatHistory(chatHistoryData.messages);
      setHistoryLoaded(true);
    }
  }, [chatHistoryData, historyLoaded]);

  useEffect(() => {
    setHistoryLoaded(false);
    setChatHistory([]);
  }, [courseSlug, moduleIndex]);

  const chatMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await apiRequest("POST", `/api/studio/courses/${courseSlug}/modules/${moduleIndex}/chat`, { message: msg });
      return res.json();
    },
    onMutate: (msg) => {
      setPendingMsg(msg);
      setChatHistory(prev => [...prev, { role: "user", content: msg }]);
      setMessage("");
    },
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, { role: "assistant", content: data.message }]);
      setPendingMsg("");
    },
    onError: () => setPendingMsg(""),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatMutation.isPending]);

  const suggestedQuestions = [
    `¿Cómo aplico esto en mi trabajo${profile?.jobTitle ? ` de ${profile.jobTitle}` : ""}?`,
    "¿Qué dice la normatividad sobre este tema?",
    `Dame un ejemplo práctico${profile?.industry ? ` para ${profile.industry}` : ""}`,
  ];

  const handleSend = (msg?: string) => {
    const text = (msg || message).trim();
    if (!text || chatMutation.isPending) return;
    chatMutation.mutate(text);
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-cedu-ink-muted text-center">Inicia sesión para usar el chat con IA</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="chat-panel">
      <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-cedu-violet" />
          <h4 className="font-semibold text-sm text-cedu-ink dark:text-white">Chat con Tutor IA</h4>
        </div>
        <p className="text-[10px] text-cedu-ink-muted dark:text-gray-500 mt-0.5">Pregunta sobre el contenido del módulo</p>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 space-y-3">
        {chatHistory.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle size={32} className="mx-auto text-cedu-ink-muted/30 dark:text-gray-600 mb-3" />
            <p className="text-xs text-cedu-ink-muted dark:text-gray-500 mb-4">Pregunta lo que necesites sobre este módulo</p>
            <div className="space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-cedu-ink-soft dark:text-gray-300 bg-white dark:bg-gray-800 border border-black/[0.06] dark:border-white/[0.08] hover:bg-cedu-blue-light dark:hover:bg-cedu-blue/20 hover:text-cedu-blue transition-colors"
                  data-testid={`button-suggested-q-${i}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex w-full min-w-0 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] min-w-0 px-3 py-2 rounded-xl text-sm break-words overflow-hidden ${
                msg.role === "user"
                  ? "bg-cedu-blue text-white rounded-br-sm whitespace-pre-wrap"
                  : "bg-white dark:bg-gray-800 border border-black/[0.06] dark:border-white/[0.08] text-cedu-ink dark:text-gray-200 rounded-bl-sm [&_*]:max-w-full [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:break-words [&_table]:block [&_table]:overflow-x-auto [&_a]:break-all"
              }`}
              dangerouslySetInnerHTML={msg.role === "assistant" ? { __html: DOMPurify.sanitize(msg.content) } : undefined}
            >
              {msg.role === "user" ? msg.content : null}
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-black/[0.06] dark:border-white/[0.08] px-4 py-2 rounded-xl rounded-bl-sm flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cedu-ink-muted dark:bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cedu-ink-muted dark:bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cedu-ink-muted dark:bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs text-cedu-ink-muted dark:text-gray-500">Escribiendo...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-gray-900">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escribe tu pregunta..."
            className="h-9 text-sm"
            data-testid="input-chat-message"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!message.trim() || chatMutation.isPending}
            size="sm"
            className="bg-cedu-blue hover:bg-cedu-blue/90 h-9 px-3"
            data-testid="button-send-chat"
          >
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CertStatus {
  certType: PaidCertType;
  state: CertTabState;
  message: string;
  eligible: boolean;
  priceMxn: number;
  request: { id: string; status: string; pdfUrl: string | null; rejectReason: string | null } | null;
}

const CERT_TITLE: Record<PaidCertType, string> = {
  dc3: "constancia DC-3 STPS",
  sep: "constancia SEP",
};

function CertBlock({ slug, cert }: { slug: string; cert: CertStatus }) {
  const { toast } = useToast();
  const requestMutation = useMutation({
    mutationFn: async () => {
      // El precio NO se manda: lo resuelve el servidor desde CERT_PRICES_MXN.
      const res = await apiRequest("POST", "/api/me/certificates", { courseSlug: slug, certType: cert.certType });
      return res.json();
    },
    onSuccess: (d: any) => {
      if (d?.checkout_url) { window.location.href = d.checkout_url; return; }
      queryClient.invalidateQueries({ queryKey: ["/api/studio/courses", slug, "certificates"] });
    },
    onError: (e: any) => {
      toast({ title: "No se pudo solicitar", description: e.message, variant: "destructive" });
    },
  });

  const precio = `$${cert.priceMxn.toLocaleString("es-MX")} MXN`;
  const titulo = CERT_TITLE[cert.certType];

  if (cert.state === "elegible") {
    return (
      <div className="max-w-sm mx-auto rounded-xl border border-cedu-orange/30 bg-cedu-orange/5 dark:bg-cedu-orange/10 p-4 space-y-3" data-testid={`cert-elegible-${cert.certType}`}>
        <div className="flex items-center justify-center gap-2">
          <FileCheck size={16} className="text-cedu-orange" />
          <p className="text-sm font-medium text-cedu-ink dark:text-white">Solicita tu {titulo}</p>
        </div>
        <p className="text-2xl font-serif font-bold text-cedu-ink dark:text-white">{precio}</p>
        {cert.request?.status === "rechazado" && cert.request.rejectReason && (
          <p className="text-xs text-red-700 dark:text-red-300">Tu solicitud anterior fue rechazada: {cert.request.rejectReason}</p>
        )}
        <Button
          className="w-full bg-cedu-orange hover:bg-cedu-orange/90 text-white"
          disabled={requestMutation.isPending}
          onClick={() => requestMutation.mutate()}
          data-testid={`button-request-${cert.certType}`}
        >
          {requestMutation.isPending && <Loader2 size={14} className="mr-1 animate-spin" />}
          Solicitar {titulo}
        </Button>
      </div>
    );
  }

  if (cert.state === "pago_pendiente") {
    return (
      <div className="max-w-sm mx-auto rounded-xl border border-amber-300 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-4 space-y-3" data-testid={`cert-pago-pendiente-${cert.certType}`}>
        <p className="text-sm text-amber-900 dark:text-amber-200">{cert.message}</p>
        <Button
          className="w-full bg-cedu-orange hover:bg-cedu-orange/90 text-white"
          disabled={requestMutation.isPending}
          onClick={() => requestMutation.mutate()}
          data-testid={`button-complete-payment-${cert.certType}`}
        >
          {requestMutation.isPending && <Loader2 size={14} className="mr-1 animate-spin" />}
          Completar pago · {precio}
        </Button>
      </div>
    );
  }

  if (cert.state === "emitido") {
    return (
      <div className="max-w-sm mx-auto rounded-xl border border-cedu-green/30 bg-cedu-green/5 dark:bg-cedu-green/10 p-4 space-y-3" data-testid={`cert-emitido-${cert.certType}`}>
        <div className="flex items-center justify-center gap-2">
          <Award size={16} className="text-cedu-green" />
          <p className="text-sm text-cedu-ink dark:text-white">{cert.message}</p>
        </div>
        {cert.request?.pdfUrl && (
          <a href={cert.request.pdfUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-cedu-blue hover:underline"
            data-testid={`link-pdf-${cert.certType}`}>
            <Download size={14} /> Descargar {titulo}
          </a>
        )}
      </div>
    );
  }

  // ya_solicitado / sin_intento_aprobado / curso_sin_certificado / curso_no_encontrado:
  // se dice POR QUÉ, no "próximamente".
  return (
    <div className="max-w-sm mx-auto rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-gray-900/40 p-4" data-testid={`cert-${cert.certType}-${cert.state}`}>
      <p className="text-xs text-cedu-ink-muted dark:text-gray-400">{cert.message || certTabMessage(cert.state, cert.certType)}</p>
    </div>
  );
}

function CertificatesBlock({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useQuery<{ certs: { dc3: CertStatus; sep: CertStatus } }>({
    queryKey: ["/api/studio/courses", slug, "certificates"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/studio/courses/${slug}/certificates`);
      return res.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-cedu-ink-muted dark:text-gray-500" data-testid="cert-loading">
        <Loader2 size={14} className="animate-spin" /> Verificando tus certificados...
      </div>
    );
  }

  // Sin degradación silenciosa: un fallo de consulta NO se muestra como "no elegible".
  if (isError || !data) {
    return (
      <div className="max-w-sm mx-auto rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-4 flex items-start gap-2" data-testid="cert-error">
        <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
        <p className="text-xs text-red-800 dark:text-red-300 text-left">
          No pudimos verificar tus certificados. Recarga la página o inténtalo en unos minutos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CertBlock slug={slug} cert={data.certs.dc3} />
      <CertBlock slug={slug} cert={data.certs.sep} />
    </div>
  );
}

function CompletionCertificate({ courseName, userName, completedModules, totalModules, slug }: {
  courseName: string; userName: string; completedModules: number; totalModules: number; slug: string;
}) {
  const date = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  return (
    <div className="text-center py-8 space-y-6" data-testid="completion-certificate">
      <div className="relative inline-block">
        <div className="w-20 h-20 bg-gradient-to-br from-cedu-orange to-yellow-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Trophy size={36} className="text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 bg-cedu-green rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
          <CheckCircle2 size={14} className="text-white" />
        </div>
      </div>
      <div>
        <h2 className="font-serif text-2xl text-cedu-ink dark:text-white mb-1">¡Curso completado!</h2>
        <p className="text-sm text-cedu-ink-muted dark:text-gray-400">
          Completaste los {completedModules}/{totalModules} módulos de este curso
        </p>
      </div>
      <div className="max-w-sm mx-auto bg-gradient-to-br from-cedu-blue/5 to-cedu-violet/5 dark:from-cedu-blue/10 dark:to-cedu-violet/10 border border-cedu-blue/20 dark:border-cedu-blue/30 rounded-2xl p-6 space-y-3">
        <p className="text-xs text-cedu-ink-muted dark:text-gray-500 uppercase tracking-wide">Certificado de finalización</p>
        <div className="border-t border-b border-cedu-blue/10 dark:border-cedu-blue/20 py-3 my-2">
          <p className="text-sm text-cedu-ink-soft dark:text-gray-300">Se certifica que</p>
          <p className="font-serif text-lg text-cedu-ink dark:text-white font-semibold">{userName}</p>
          <p className="text-sm text-cedu-ink-soft dark:text-gray-300 mt-1">completó exitosamente</p>
          <p className="font-serif text-base text-cedu-blue font-semibold">{courseName}</p>
        </div>
        <p className="text-xs text-cedu-ink-muted dark:text-gray-500">{date} · Ceduverse Tutor IA</p>
      </div>
      <CertificatesBlock slug={slug} />
    </div>
  );
}

interface PlaybookExerciseInfo {
  index: number;
  title: string;
  instruction: string;
}

interface PlaybookTabData {
  course: { slug: string; title: string; icon: string | null };
  playbook: {
    content: { objetivos: string[]; resumen: string[]; estrategias: string[]; preguntas: string[] };
    exercises: PlaybookExerciseInfo[];
    references: string[];
  };
}

// apiRequest (client/src/lib/queryClient.ts) lanza `Error(`${status}: ${bodyText}`)`
// en respuestas no-ok, donde bodyText es el JSON crudo que mandó el servidor
// (p.ej. `{"message":"No se pudo generar el playbook..."}`). Esta función recupera
// ese mensaje real para mostrarlo tal cual; si el cuerpo no es JSON parseable
// (error de red, HTML genérico de un proxy, etc.) cae a un mensaje honesto genérico
// en vez de mostrarle al usuario el string crudo "404: {...}".
function playbookErrorMessage(error: unknown): string {
  const fallback = "No pudimos cargar el Playbook. Recarga la página o inténtalo en unos minutos.";
  if (!(error instanceof Error)) return fallback;
  const bodyText = error.message.replace(/^\d+:\s*/, "");
  try {
    const parsed = JSON.parse(bodyText);
    if (parsed && typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    // cuerpo no era JSON — se queda con el fallback genérico.
  }
  return fallback;
}

function PlaybookTab({ slug }: { slug: string }) {
  const [, navigate] = useLocation();

  const { data, isLoading, isError, error } = useQuery<PlaybookTabData>({
    queryKey: ["/api/playbook", slug],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/playbook/${slug}`);
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="py-12 text-center text-cedu-ink-muted dark:text-gray-500" data-testid="view-playbook-loading">
        <Loader2 className="animate-spin mx-auto mb-3" size={28} />
        Cargando Playbook…
      </div>
    );
  }

  // Sin degradación silenciosa: un fallo real de la consulta (404 curso no
  // encontrado, 503 playbook no generado, error de red) no debe quedarse como
  // spinner infinito ni confundirse con "playbook vacío".
  if (isError || !data) {
    return (
      <div className="max-w-sm mx-auto rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-4 flex items-start gap-2" data-testid="view-playbook-error">
        <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
        <p className="text-xs text-red-800 dark:text-red-300 text-left">
          {playbookErrorMessage(error)}
        </p>
      </div>
    );
  }

  const { playbook } = data;
  const publicUrl = typeof window !== "undefined" ? window.location.origin : "";
  // El detector de riesgos reemplaza la actividad de campo del playbook (spec
  // docs/superpowers/specs/2026-07-18-detector-riesgos-design.md §9): el QR y el
  // CTA de esta pestaña ya no suben evidencia de un ejercicio, apuntan al reporte
  // real de un hallazgo para este curso.
  const reportUrl = `${publicUrl}/riesgos/reportar/${slug}`;

  return (
    <div className="space-y-8" data-testid="view-playbook">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-lg text-cedu-ink dark:text-white">Playbook del curso</h3>
          <p className="text-sm text-cedu-ink-muted dark:text-gray-500">
            Resumen, estrategias y señales de riesgo para aplicar lo que aprendiste
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => window.open(`/api/playbook/${slug}/export.pdf`, "_blank")}
          data-testid="button-download-playbook-pdf"
        >
          <Download size={16} /> Descargar PDF
        </Button>
      </div>

      <section>
        <h4 className="text-sm font-bold text-cedu-blue uppercase tracking-wide mb-2">Objetivos</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-cedu-ink-soft dark:text-gray-300">
          {playbook.content.objetivos.map((o, i) => <li key={i}>{o}</li>)}
        </ul>
      </section>

      <section>
        <h4 className="text-sm font-bold text-cedu-blue uppercase tracking-wide mb-2">Resumen</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-cedu-ink-soft dark:text-gray-300">
          {playbook.content.resumen.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </section>

      <section>
        <h4 className="text-sm font-bold text-cedu-orange uppercase tracking-wide mb-2">Estrategias</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-cedu-ink-soft dark:text-gray-300">
          {playbook.content.estrategias.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      </section>

      <section>
        <h4 className="text-sm font-bold text-cedu-violet uppercase tracking-wide mb-2">Preguntas de reflexión</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-cedu-ink-soft dark:text-gray-300">
          {playbook.content.preguntas.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </section>

      {playbook.exercises.length > 0 && (
        <section>
          <h4 className="text-sm font-bold text-cedu-ink dark:text-white uppercase tracking-wide mb-1">
            Señales de riesgo que puedes detectar
          </h4>
          <p className="text-xs text-cedu-ink-muted dark:text-gray-500 mb-3">
            Después de este módulo, esto es lo que conviene revisar en tu lugar de trabajo:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {playbook.exercises.map((ex) => (
              <Card key={ex.index} className="p-4" data-testid={`card-exercise-${ex.index}`}>
                <p className="font-semibold text-cedu-ink dark:text-white text-sm mb-1">{ex.title}</p>
                <p className="text-xs text-cedu-ink-soft dark:text-gray-400">{ex.instruction}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-cedu-orange/20 bg-cedu-orange/5 dark:bg-cedu-orange/10 p-5 flex items-center gap-4 flex-wrap">
        <div className="bg-white p-2 rounded-lg border border-black/[0.06] shrink-0">
          <QRCodeSVG value={reportUrl} size={80} level="M" fgColor="#1b5adf" bgColor="#ffffff" />
        </div>
        <div className="flex-1 min-w-[220px]">
          <h4 className="font-semibold text-cedu-ink dark:text-white text-sm mb-1">
            ¿Detectaste alguna de estas señales en tu trabajo?
          </h4>
          <p className="text-xs text-cedu-ink-soft dark:text-gray-400 mb-3">
            Escanea el QR o repórtalo desde aquí: foto + descripción. Ganas puntos cuando tu
            empresa valide que el riesgo se corrigió.
          </p>
          <Button
            onClick={() => navigate(`/riesgos/reportar/${slug}`)}
            className="gap-1.5 bg-cedu-orange hover:bg-cedu-orange/90 text-white"
            data-testid="button-report-risk"
          >
            <Camera size={14} /> Reportar un riesgo
          </Button>
        </div>
      </section>

      {playbook.references.length > 0 && (
        <section>
          <h4 className="text-sm font-bold text-cedu-ink dark:text-white uppercase tracking-wide mb-2">Referencias</h4>
          <ul className="space-y-1 text-xs text-cedu-ink-muted dark:text-gray-500">
            {playbook.references.map((r, i) => <li key={i}>[{i + 1}] {r}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function StudioCoursePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeModule, setActiveModule] = useState(0);
  const [activeTab, setActiveTab] = useState<ContentTab>("lectura");
  const [showChat, setShowChat] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Anonymous visitors must never see course content (lecture, modules, etc.) —
  // only redirect once auth is SETTLED (authLoading === false); redirecting
  // while auth is still resolving would bounce a logged-in user on refresh,
  // since `user` starts out null until /api/auth/me resolves.
  useEffect(() => {
    if (!authLoading && !user) {
      // Lleva el destino para volver a este curso tras iniciar sesión.
      navigate(authUrlWithNext(window.location.pathname + window.location.search));
    }
  }, [authLoading, user, navigate]);

  const { data: courseData, isLoading } = useQuery<{
    course: StudioCourse;
    modules: StudioModule[];
    quiz: StudioQuiz | null;
  }>({
    queryKey: ["/api/studio/courses", slug],
    queryFn: async () => {
      const res = await fetch(`/api/studio/courses/${slug}`);
      if (!res.ok) throw new Error("Course not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: studentProfile } = useQuery<{ jobTitle?: string; industry?: string } | null>({
    queryKey: ["/api/me/student-profile"],
    enabled: !!user,
  });

  // Enrollment must be known BEFORE the generation query below decides whether
  // to fire: generation is billable (real Claude calls), so it may only start
  // once the student has actually enrolled/started the course — never from
  // merely opening/browsing it. See `enabled` on the query right below.
  const { data: enrollment } = useQuery<any>({
    queryKey: ["/api/studio/enrollments", slug],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/studio/enrollments");
      const enrollments = await res.json();
      return enrollments.find((e: any) => e.courseIdentifier === slug) || null;
    },
    enabled: !!user,
  });

  // Which modules of THIS course this user has PASSED a quiz for. Drives
  // sequential unlocking: a module's personalized content must not
  // auto-generate — and its nav must stay locked — until the previous
  // module's quiz is passed. Module 0 is always unlocked. Refetched whenever
  // a quiz is passed (see onQuizComplete below) so the next module unlocks
  // immediately without a manual refresh.
  const { data: quizAttempts } = useQuery<{ moduleIndex: number; passed: boolean }[]>({
    queryKey: ["/api/studio/courses", slug, "quiz-attempts"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/studio/courses/${slug}/quiz-attempts`);
      return res.json();
    },
    enabled: !!user && !!slug,
  });

  const passedModules = useMemo(() => {
    const set = new Set<number>();
    (quizAttempts || []).forEach(a => { if (a.passed) set.add(a.moduleIndex); });
    return set;
  }, [quizAttempts]);

  const isModuleUnlocked = useCallback(
    (i: number) => i === 0 || passedModules.has(i - 1),
    [passedModules]
  );

  const { data: generatedContent, isLoading: isGenerating } = useQuery<GeneratedContent>({
    queryKey: ["studio-generated", slug, activeModule],
    queryFn: async () => {
      const res = await apiRequest("POST", `/api/studio/courses/${slug}/modules/${activeModule}/generate`);
      return res.json();
    },
    // Gated on enrollment, not just on having opened the course page: without
    // this, a logged-in visitor merely previewing a course (before clicking
    // "Comenzar curso") would fire this billable generate call on every mount,
    // even though the UI below shows an enroll gate instead of content.
    // Also gated on the module being unlocked: the owner's explicit request
    // is that a locked module must never fire /generate — so we don't have
    // the agent generating personalized content for multiple modules at
    // once before the student has even passed the previous quiz.
    enabled: !!user && !!courseData && !!enrollment?.id && isModuleUnlocked(activeModule),
    // Generation runs async server-side (~3-5 min). While in progress the server
    // returns a "generating" placeholder; poll until the real content lands.
    // While "failed" and backing off, DON'T poll every 5s forever — that would
    // just re-fetch the same honest "still failing" response over and over
    // (harmless now that the server itself refuses to regenerate that often,
    // but wasteful). Instead poll once, right when the server's own backoff
    // window ends, so the next automatic attempt is picked up without a
    // manual refresh. Once the ceiling is reached there's no next automatic
    // attempt, so stop polling entirely — only "Regenerar" moves it forward.
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.generationStatus === "generating") return 5000;
      // content_ready = la lectura ya llegó y se muestra, pero el quiz y el audio
      // siguen generándose (Call 2 + TTS). Seguimos haciendo poll para traerlos
      // en cuanto la fila pase a 'complete'/'partial'.
      if (data?.generationStatus === "content_ready") return 5000;
      if (data?.generationStatus === "failed" && !data.ceilingReached && data.nextRetryAt) {
        const waitMs = new Date(data.nextRetryAt).getTime() - Date.now();
        return Math.max(waitMs, 1000);
      }
      return false;
    },
  });

  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [resumeApplied, setResumeApplied] = useState(false);
  const [showResumeLanding, setShowResumeLanding] = useState(true);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/studio/enroll", { courseSlug: slug });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studio/enrollments", slug] });
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/studio/enrollments/${slug}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studio/enrollments", slug] });
      queryClient.invalidateQueries({ queryKey: ["module-progress"] });
      toast({ title: "Has salido del curso", description: "Tu inscripción ha sido eliminada." });
      navigate("/tutor-ia");
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo salir del curso.", variant: "destructive" });
    },
  });

  const resetProgressMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      await apiRequest("POST", `/api/studio/enrollments/${enrollmentId}/reset`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studio/enrollments", slug] });
      queryClient.invalidateQueries({ queryKey: ["module-progress"] });
      queryClient.invalidateQueries({ queryKey: ["studio-generated"] });
      setActiveModule(0);
      setActiveTab("lectura");
      setResumeApplied(false);
      toast({ title: "Curso reiniciado", description: "Tu progreso ha sido reiniciado." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo reiniciar el curso.", variant: "destructive" });
    },
  });

  const { data: moduleProgressList } = useQuery<ModuleProgress[]>({
    queryKey: ["module-progress", enrollment?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/studio/enrollments/${enrollment.id}/progress`);
      return res.json();
    },
    enabled: !!enrollment?.id,
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/studio/courses/${slug}/modules/${activeModule}/generate?regenerate=true`);
      return res.json();
    },
    onSuccess: (data) => {
      // Server returns a "generating" placeholder; seed the cache so the loading
      // state shows immediately and the query starts polling for the result.
      queryClient.setQueryData(["studio-generated", slug, activeModule], data);
      toast({ title: "Generando contenido", description: "Esto puede tomar unos minutos. Se actualizará automáticamente al terminar." });
    },
    onError: (err: any) => {
      // apiRequest throws `Error("429: <json body>")` for the rate-limit
      // response from POST .../generate?regenerate=true — surface the real
      // "wait N seconds" message instead of a generic failure.
      const message = String(err?.message || "");
      if (message.startsWith("429:")) {
        let description = "Espera unos segundos antes de volver a regenerar este módulo.";
        try {
          const body = JSON.parse(message.slice(message.indexOf(":") + 1).trim());
          if (typeof body?.message === "string") description = body.message;
        } catch {
          // body wasn't JSON — keep the generic-but-honest fallback above.
        }
        toast({ title: "Espera un momento", description, variant: "destructive" });
        return;
      }
      toast({ title: "Error", description: "No se pudo iniciar la regeneración. Intenta de nuevo.", variant: "destructive" });
    },
  });

  const completeModuleMutation = useMutation({
    mutationFn: async (moduleIdentifier: string) => {
      if (!enrollment?.id) throw new Error("No enrollment");
      const res = await apiRequest("PUT", `/api/studio/enrollments/${enrollment.id}/modules/${moduleIdentifier}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-progress", enrollment?.id] });
      toast({ title: "Módulo completado", description: "Tu progreso se ha guardado." });
    },
  });

  const handleRegenerate = useCallback(() => {
    if (confirm("¿Regenerar el contenido? Esto reemplazará el contenido actual con uno nuevo personalizado a tu perfil.")) {
      regenerateMutation.mutate();
    }
  }, [regenerateMutation]);

  const handleCompleteModule = useCallback(() => {
    completeModuleMutation.mutate(`module_${activeModule}`);
  }, [activeModule, completeModuleMutation]);

  const hasEnrollment = enrollment !== null && enrollment !== undefined;
  const completedModuleCount = moduleProgressList?.filter(p => p.completed).length || 0;
  const hasProgress = completedModuleCount > 0;

  useEffect(() => {
    if (hasEnrollment && moduleProgressList && courseData && !resumeApplied) {
      const totalModules = courseData.modules.length;
      const completedSet = new Set(
        moduleProgressList.filter(p => p.completed).map(p => p.moduleIdentifier)
      );
      let resumeIdx = 0;
      for (let i = 0; i < totalModules; i++) {
        if (!completedSet.has(`module_${i}`)) {
          resumeIdx = i;
          break;
        }
        if (i === totalModules - 1) resumeIdx = totalModules - 1;
      }
      if (resumeIdx > 0) setActiveModule(resumeIdx);
      setResumeApplied(true);
    }
  }, [hasEnrollment, moduleProgressList, courseData, resumeApplied]);

  if (isLoading || authLoading || !user) {
    // Covers three states with the same loader: course metadata still
    // loading, auth still resolving (don't flash content before we know),
    // and auth settled with no user (the redirect effect above is about to
    // navigate away — render nothing meanwhile instead of the course).
    return (
      <div className="min-h-screen bg-cedu-cream dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-cedu-blue" size={32} />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen bg-cedu-cream dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-xl text-cedu-ink dark:text-white mb-2">Curso no encontrado</h2>
          <Button variant="outline" onClick={() => navigate("/tutor-ia")} data-testid="button-back-studio">
            Volver al catálogo
          </Button>
        </div>
      </div>
    );
  }

  const { course, modules, quiz } = courseData;

  if (user && !hasEnrollment) {
    return (
      <div className="min-h-screen bg-cedu-cream dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center w-full max-w-md mx-auto">
          <span className="text-5xl mb-4 flex items-center justify-center w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-cedu-blue-light to-cedu-violet-light dark:from-cedu-blue/15 dark:to-cedu-violet/15">
            {course.icon || "📘"}
          </span>
          <h1 className="font-serif text-2xl text-cedu-ink dark:text-white mt-5 mb-2" data-testid="text-course-title">{course.title}</h1>
          <p className="text-sm font-medium text-cedu-blue mb-3">{course.category} · {course.durationMinutes || 60} min</p>
          {course.description && (
            <p className="text-sm text-cedu-ink-soft dark:text-gray-300 mb-7 leading-relaxed">{course.description}</p>
          )}
          <Button
            size="lg"
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending}
            className="bg-cedu-blue hover:bg-cedu-blue/90 text-white gap-2 rounded-xl w-full max-w-xs min-h-12 text-base shadow-sm"
            data-testid="button-start-course"
          >
            {enrollMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Play size={18} />
            )}
            Comenzar curso
          </Button>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate("/tutor-ia")} className="rounded-xl min-h-10" data-testid="button-back-studio">
              <ArrowLeft size={14} className="mr-2" /> Volver al catálogo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (user && hasEnrollment && hasProgress && showResumeLanding) {
    const progressPct = modules.length > 0 ? Math.round((completedModuleCount / modules.length) * 100) : 0;
    return (
      <>
        <div className="min-h-screen bg-cedu-cream dark:bg-gray-950 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <span className="text-5xl mb-4 block">{course.icon || "📘"}</span>
            <h1 className="font-serif text-2xl text-cedu-ink dark:text-white mb-2" data-testid="text-course-title">{course.title}</h1>
            <p className="text-sm text-cedu-ink-muted dark:text-gray-400 mb-2">{course.category} · {completedModuleCount} de {modules.length} módulos completados</p>
            <div className="w-full max-w-xs mx-auto bg-black/[0.06] dark:bg-white/[0.08] rounded-full h-2 mb-6">
              <div className="bg-cedu-blue h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex flex-col gap-3 items-center">
              <Button
                size="lg"
                onClick={() => setShowResumeLanding(false)}
                className="bg-cedu-blue hover:bg-cedu-blue/90 text-white gap-2 w-full max-w-xs rounded-xl min-h-12 text-base shadow-sm"
                data-testid="button-continue-course"
              >
                <Play size={18} /> Continuar curso
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => { setShowResumeLanding(false); setShowResetDialog(true); }}
                className="gap-2 w-full max-w-xs rounded-xl min-h-11"
                data-testid="button-restart-course-landing"
              >
                <RotateCcw size={16} /> Reiniciar curso
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowUnenrollDialog(true); }}
                className="text-cedu-ink-muted dark:text-gray-400 gap-2 min-h-10"
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
                onClick={() => { setShowResetDialog(false); if (enrollment?.id) resetProgressMutation.mutate(enrollment.id); }}
                className="bg-cedu-orange hover:bg-cedu-orange/90 text-white"
                disabled={resetProgressMutation.isPending}
                data-testid="button-confirm-reset-landing"
              >
                {resetProgressMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <RotateCcw size={14} className="mr-2" />}
                Reiniciar curso
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const currentModule = modules[activeModule];

  const isModuleCompleted = (idx: number) => {
    if (!moduleProgressList) return false;
    const mp = moduleProgressList.find(p => p.moduleIdentifier === `module_${idx}`);
    return mp?.completed || false;
  };

  const allModulesCompleted = modules.length > 0 && modules.every((_, i) => isModuleCompleted(i));

  const quizQuestions = generatedContent?.adaptiveQuiz?.length
    ? generatedContent.adaptiveQuiz
    : quiz?.questions || [];

  const contentTabs: { key: ContentTab; label: string; icon: any }[] = [
    { key: "lectura", label: "Lectura", icon: BookOpen },
    { key: "mapa", label: "Mapa Mental", icon: Map },
    { key: "quiz", label: "Quiz", icon: HelpCircle },
    { key: "fuentes", label: "Fuentes", icon: Link2 },
    { key: "playbook", label: "Playbook", icon: ClipboardList },
    ...(allModulesCompleted ? [{ key: "certificado" as ContentTab, label: "Certificado", icon: Trophy }] : []),
  ];

  return (
    <div className="min-h-screen bg-cedu-cream dark:bg-gray-950 transition-colors">
      <header className="bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.08] sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => navigate("/tutor-ia")}
              className="shrink-0 -ml-1 p-1.5 rounded-lg text-cedu-ink-muted dark:text-gray-400 hover:text-cedu-blue hover:bg-cedu-blue-light dark:hover:bg-white/10 dark:hover:text-white transition-colors"
              data-testid="button-back-catalog"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl shrink-0">{course.icon || "📘"}</span>
              <div className="min-w-0">
                <h1 className="font-semibold text-cedu-ink dark:text-white text-sm leading-none truncate" data-testid="text-course-title">
                  {course.title}
                </h1>
                <p className="text-[10px] text-cedu-ink-muted dark:text-gray-500 truncate">{course.category} · {course.durationMinutes || 60} min</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {course.dc3Available && (
              <Badge variant="outline" className="hidden md:inline-flex text-green-600 border-green-300 dark:text-green-400 dark:border-green-700 text-[10px] gap-1">
                <FileCheck size={10} /> DC3 STPS
              </Badge>
            )}
            {hasProgress && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetDialog(true)}
                className="text-cedu-orange border-cedu-orange/30 hover:bg-cedu-orange-light gap-1 text-xs px-2 sm:px-3"
                data-testid="button-restart-course"
              >
                <RotateCcw size={12} /> <span className="hidden sm:inline">Reiniciar</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-1 text-xs text-cedu-ink-muted border-black/10 dark:border-white/10 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 sm:px-3"
              data-testid="button-continue-later"
            >
              <Clock size={12} /> <span>Continuar después</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(true)}
              className="gap-1 text-xs text-cedu-blue border-cedu-blue/20 hover:bg-cedu-blue-light dark:hover:bg-cedu-blue/10 px-2 sm:px-3"
              data-testid="button-share-course"
            >
              <Share2 size={12} /> <span className="hidden sm:inline">Invitar</span>
            </Button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-cedu-ink-muted dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              data-testid="button-toggle-theme"
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-lg transition-colors ${showChat ? "bg-cedu-violet text-white" : "bg-cedu-violet-light dark:bg-cedu-violet/20 text-cedu-violet hover:bg-cedu-violet hover:text-white"}`}
              data-testid="button-toggle-chat"
            >
              {showChat ? <X size={16} /> : <MessageCircle size={16} />}
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.08] overflow-x-auto">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2 flex gap-2">
          {modules.map((mod, i) => (
            <ModulePill
              key={mod.id}
              index={i}
              title={mod.title}
              active={activeModule === i}
              completed={isModuleCompleted(i)}
              locked={!isModuleUnlocked(i)}
              onClick={() => { setActiveModule(i); setActiveTab("lectura"); }}
            />
          ))}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto flex">
        <div className={`flex-1 min-w-0 transition-all ${showChat ? "pr-0 lg:pr-[360px]" : ""}`}>
          <div className="bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="max-w-4xl mx-auto px-3 sm:px-6 md:px-8 flex gap-1 pt-3 overflow-x-auto">
              {contentTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 rounded-t-lg text-sm font-medium transition-colors shrink-0 whitespace-nowrap ${
                      activeTab === tab.key
                        ? "bg-cedu-cream dark:bg-gray-950 text-cedu-blue border border-b-0 border-black/[0.06] dark:border-white/[0.08]"
                        : "text-cedu-ink-muted dark:text-gray-500 hover:text-cedu-ink dark:hover:text-gray-300"
                    }`}
                    data-testid={`tab-${tab.key}`}
                  >
                    <Icon size={14} /> {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6">
            {!isModuleUnlocked(activeModule) ? (
              <LockedModuleState
                onGoToPrevious={() => { setActiveModule(activeModule - 1); setActiveTab("lectura"); window.scrollTo(0, 0); }}
              />
            ) : (isGenerating && !generatedContent) || generatedContent?.generationStatus === "generating" ? (
              <LoadingState profile={studentProfile || undefined} />
            ) : (
              <>
                {activeTab === "lectura" && (
                  <>
                    {generatedContent?.generationStatus === "failed" ? (
                      <div data-testid="view-lectura">
                        <GenerationFailedBanner
                          consecutiveFailures={generatedContent.consecutiveFailures}
                          ceilingReached={generatedContent.ceilingReached}
                          nextRetryAt={generatedContent.nextRetryAt}
                          onRegenerate={handleRegenerate}
                          isRegenerating={regenerateMutation.isPending}
                        />
                        {currentModule?.contentHtml && (
                          <>
                            <p className="text-xs text-cedu-ink-muted dark:text-gray-500 mb-3 italic">
                              Mientras se resuelve, aquí tienes el contenido base del módulo (todavía sin personalizar a tu perfil):
                            </p>
                            <div className="flex items-center gap-3 mb-6 flex-wrap">
                              <span className="text-sm text-cedu-ink-muted dark:text-gray-400 flex items-center gap-1">
                                <Clock size={14} /> ~{Math.ceil((currentModule.contentHtml.replace(/<[^>]*>/g, " ").split(/\s+/).length) / 200)} min de lectura
                              </span>
                            </div>
                            <div
                              className="prose prose-base max-w-none prose-headings:font-serif prose-h2:text-cedu-blue dark:prose-h2:text-blue-300 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-cedu-violet dark:prose-h3:text-violet-300 prose-h1:text-cedu-ink dark:prose-h1:text-white prose-h4:text-cedu-ink dark:prose-h4:text-white prose-p:text-cedu-ink-soft dark:prose-p:text-gray-300 prose-p:leading-[1.8] prose-li:text-cedu-ink-soft dark:prose-li:text-gray-300 prose-strong:text-cedu-ink dark:prose-strong:text-white"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentModule.contentHtml) }}
                              data-testid="content-lecture"
                            />
                          </>
                        )}
                      </div>
                    ) : generatedContent?.lectureHtml ? (
                      <LectureView
                        html={generatedContent.lectureHtml}
                        reflections={generatedContent.reflections}
                        isStub={generatedContent.isStub}
                        onRegenerate={handleRegenerate}
                        isRegenerating={regenerateMutation.isPending}
                        courseSlug={slug}
                        moduleIndex={activeModule}
                        classScript={generatedContent.classScript}
                        moduleTitle={currentModule?.title}
                      />
                    ) : currentModule?.contentHtml ? (
                      <div data-testid="view-lectura">
                        <div className="flex items-center gap-3 mb-6 flex-wrap">
                          <span className="text-sm text-cedu-ink-muted dark:text-gray-400 flex items-center gap-1">
                            <Clock size={14} /> ~{Math.ceil((currentModule.contentHtml.replace(/<[^>]*>/g, " ").split(/\s+/).length) / 200)} min de lectura
                          </span>
                        </div>
                        <div
                          className="prose prose-base max-w-none prose-headings:font-serif prose-h2:text-cedu-blue dark:prose-h2:text-blue-300 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-cedu-violet dark:prose-h3:text-violet-300 prose-h1:text-cedu-ink dark:prose-h1:text-white prose-h4:text-cedu-ink dark:prose-h4:text-white prose-p:text-cedu-ink-soft dark:prose-p:text-gray-300 prose-p:leading-[1.8] prose-li:text-cedu-ink-soft dark:prose-li:text-gray-300 prose-strong:text-cedu-ink dark:prose-strong:text-white"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentModule.contentHtml) }}
                          data-testid="content-lecture"
                        />
                      </div>
                    ) : (
                      <LoadingState profile={studentProfile || undefined} />
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-5 border-t border-black/[0.06] dark:border-white/[0.08]">
                      <Button
                        variant="outline"
                        size="lg"
                        disabled={activeModule <= 0}
                        onClick={() => { setActiveModule(activeModule - 1); setActiveTab("lectura"); window.scrollTo(0, 0); }}
                        className="rounded-xl gap-2 min-h-11"
                        data-testid="button-prev-module"
                      >
                        <ArrowLeft size={16} /> Anterior
                      </Button>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {!isModuleCompleted(activeModule) && generatedContent?.lectureHtml && (
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={handleCompleteModule}
                            disabled={completeModuleMutation.isPending}
                            className="rounded-xl gap-2 min-h-11 text-cedu-green border-cedu-green/30 hover:bg-cedu-green-light"
                            data-testid="button-complete-module"
                          >
                            {completeModuleMutation.isPending ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                            Completar módulo
                          </Button>
                        )}
                        {activeModule < modules.length - 1 ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <Button
                              size="lg"
                              onClick={() => { setActiveModule(activeModule + 1); setActiveTab("lectura"); window.scrollTo(0, 0); }}
                              disabled={!passedModules.has(activeModule)}
                              title={!passedModules.has(activeModule) ? "Aprueba el quiz de este módulo para desbloquear el siguiente." : undefined}
                              className="rounded-xl gap-2 min-h-11 bg-cedu-blue hover:bg-cedu-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
                              data-testid="button-next-module"
                            >
                              Siguiente <ChevronRight size={16} />
                            </Button>
                            {!passedModules.has(activeModule) && (
                              <p className="text-xs text-cedu-ink-muted dark:text-gray-500 text-right max-w-[220px]" data-testid="hint-next-locked">
                                Aprueba el quiz de este módulo para desbloquear el siguiente.
                              </p>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="lg"
                            onClick={() => setActiveTab("quiz")}
                            className="rounded-xl gap-2 min-h-11 bg-cedu-green hover:bg-cedu-green/90"
                            data-testid="button-go-quiz"
                          >
                            <Award size={16} /> Ir al Quiz
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "mapa" && (
                  generatedContent?.mindMap ? (
                    <MindMapView data={generatedContent.mindMap} />
                  ) : (
                    <div className="text-center py-12">
                      <Map size={40} className="mx-auto text-cedu-ink-muted/30 dark:text-gray-600 mb-4" />
                      <h3 className="font-serif text-lg text-cedu-ink dark:text-white mb-2">Mapa Mental</h3>
                      <p className="text-sm text-cedu-ink-muted dark:text-gray-500">
                        {user ? "El mapa mental se generará con el contenido del módulo." : "Inicia sesión para generar contenido personalizado."}
                      </p>
                    </div>
                  )
                )}

                {activeTab === "quiz" && (
                  quizQuestions.length > 0 ? (
                    <StepQuizView
                      questions={quizQuestions}
                      courseSlug={slug}
                      moduleIndex={activeModule}
                      isLastModule={activeModule >= modules.length - 1}
                      isModuleCompleted={isModuleCompleted(activeModule)}
                      onCompleteModule={handleCompleteModule}
                      onNextModule={() => { setActiveModule(activeModule + 1); setActiveTab("lectura"); window.scrollTo(0, 0); }}
                      onQuizComplete={(score, total, passed) => {
                        if (passed) {
                          toast({ title: "¡Quiz aprobado!", description: `Obtuviste ${Math.round((score / total) * 100)}%` });
                          // Unlocks the next module immediately: refetch this
                          // course's passed-modules so isModuleUnlocked() and
                          // the nav lock update without a manual page refresh.
                          queryClient.invalidateQueries({ queryKey: ["/api/studio/courses", slug, "quiz-attempts"] });
                        }
                      }}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <HelpCircle size={40} className="mx-auto text-cedu-ink-muted/30 dark:text-gray-600 mb-4" />
                      <h3 className="font-serif text-lg text-cedu-ink dark:text-white mb-2">Quiz</h3>
                      <p className="text-sm text-cedu-ink-muted dark:text-gray-500">
                        {!user
                          ? "Inicia sesión para acceder al quiz."
                          : generatedContent?.generationStatus === "content_ready"
                            ? "Preparando tu quiz… ya puedes ir leyendo la clase mientras tanto."
                            : "El quiz se generará con el contenido del módulo."}
                      </p>
                    </div>
                  )
                )}

                {activeTab === "fuentes" && (
                  <SourcesView
                    moduleRefs={currentModule?.references}
                    aiSources={generatedContent?.suggestedSources}
                  />
                )}

                {activeTab === "certificado" && allModulesCompleted && (
                  <CompletionCertificate
                    slug={slug}
                    courseName={course.title}
                    userName={user?.fullName || user?.email || "Estudiante"}
                    completedModules={modules.length}
                    totalModules={modules.length}
                  />
                )}

                {activeTab === "playbook" && (
                  <PlaybookTab slug={slug} />
                )}
              </>
            )}
          </div>
        </div>

        {showChat && (
          <div className="fixed right-0 top-[105px] bottom-0 w-[360px] max-w-full overflow-hidden bg-cedu-cream dark:bg-gray-950 border-l border-black/[0.06] dark:border-white/[0.08] z-20 hidden lg:block">
            <ChatPanel courseSlug={slug} moduleIndex={activeModule} profile={studentProfile || undefined} />
          </div>
        )}
      </div>

      {showChat && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowChat(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[320px] max-w-full overflow-hidden bg-cedu-cream dark:bg-gray-950">
            <div className="flex items-center justify-between p-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <span className="font-semibold text-sm text-cedu-ink dark:text-white">Chat con Tutor IA</span>
              <button onClick={() => setShowChat(false)} className="text-cedu-ink-muted dark:text-gray-400" data-testid="button-close-chat-mobile">
                <X size={18} />
              </button>
            </div>
            <div className="h-[calc(100%-49px)]">
              <ChatPanel courseSlug={slug} moduleIndex={activeModule} profile={studentProfile || undefined} />
            </div>
          </div>
        </div>
      )}

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
              onClick={() => { setShowResetDialog(false); if (enrollment?.id) resetProgressMutation.mutate(enrollment.id); }}
              className="bg-cedu-orange hover:bg-cedu-orange/90 text-white"
              disabled={resetProgressMutation.isPending}
              data-testid="button-confirm-reset"
            >
              {resetProgressMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <RotateCcw size={14} className="mr-2" />}
              Reiniciar curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShareCourseModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        courseTitle={courseData?.course?.title || ""}
        courseSlug={slug}
        courseType="tutor-ia"
      />
    </div>
  );
}
