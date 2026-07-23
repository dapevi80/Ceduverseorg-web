import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { useForceLightMode } from "@/components/ThemeProvider";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LayoutDashboard, BookOpen, Users, BarChart3, LogOut, Menu, X, GraduationCap,
  UserCircle, TrendingUp, CheckCircle2, Clock, ArrowRight, School, Award,
  Plus, DollarSign, FileText, Settings, ChevronRight, ChevronLeft,
  Trash2, Save, Send, PenTool, Banknote, Upload, Mic, ArrowLeft, Play, Pause,
  Volume2, RefreshCw, Video, Cpu, Bot,
} from "lucide-react";
import GemeloDigitalTab from "./instructor-gemelo-tab";
import type { LucideIcon } from "lucide-react";

type NavTabItem = { id: string; label: string; icon: LucideIcon };
type NavLinkItem = { id: string; label: string; icon: LucideIcon; href: string };
type NavItem = NavTabItem | NavLinkItem;
function isNavLink(item: NavItem): item is NavLinkItem { return "href" in item; }

type InstructorCourse = {
  id: string; slug: string; title: string; description: string | null;
  instructor: string | null; instructorId: string | null; durationHrs: number | null;
  areaTematica: string | null; nivel: string | null;
  enrolledCount: number; completedCount: number; avgProgress: number;
};

type InstructorStats = {
  totalCourses: number; totalEnrolled: number; totalCompleted: number;
  totalCertificates: number; avgProgress: number;
};

type StudentInfo = {
  userId: string; fullName: string | null; email: string;
  courses: { title: string; progress: number }[];
};

type MyCreatedCourse = {
  id: string; title: string; description: string | null; category: string | null;
  level: string | null; durationHours: number | null; certificationType: string | null;
  status: string | null; price: string | null; isFree: boolean | null;
  availableForAll: boolean | null; tags: string[] | null; nomsRelated: string[] | null;
  modules: { title: string; description: string; durationMin: number; content: string; audioUrl?: string }[] | null;
  quizzes: { moduleIndex: number; questions: { question: string; options: string[]; correctIndex: number }[]; passingScore: number }[] | null;
  rating: string | null; totalStudents: number | null;
  publishedAt: string | null; createdAt: string;
};

type CommissionData = {
  commissionRate: number; totalDc3: number; totalSep: number;
  dc3Commission: number; sepCommission: number; residualCommission: number;
  totalCommission: number; totalEnrolled: number;
  courseBreakdown: { courseId: string; title: string }[];
  // Optional admin-configurable rates/prices — UI falls back to hardcoded defaults if API omits them
  dc3CommissionPct?: number;
  dc3Price?: number;
  sepCommissionPct?: number;
  sepPrice?: number | string;
  referralCommission?: number;
};

type CertificateEntry = {
  id: string; type: string; status: string; studentName: string;
  studentEmail: string; courseTitle: string; createdAt: string;
};

type AnalyticsData = {
  summary: { totalCourses: number; totalEnrolled: number; totalCompleted: number; totalCertificates: number; overallCompletionRate: number };
  courses: { courseId: string; title: string; slug: string; enrolledCount: number; completedCount: number; completionRate: number; avgProgress: number; certificates: number }[];
};

type InstructorProfileData = {
  id: string; bio: string | null; specialty: string | null;
  profileImageUrl: string | null; rating: string | null;
  commissionRate: string | null; bankName: string | null; bankClabe: string | null;
  verified: boolean | null; verifiedAt: string | null;
  instructorBadgeType: "interno" | "acreditado_dc5" | null;
};

const COURSE_CATEGORIES = [
  "Seguridad e Higiene", "Salud Ocupacional", "Desarrollo Humano",
  "Habilidades Directivas", "Competencias Laborales", "Normatividad STPS",
  "Tecnología e Innovación", "Administración", "Comunicación", "Otro",
];

const NOMS_OPTIONS = [
  "NOM-001", "NOM-002", "NOM-004", "NOM-005", "NOM-006", "NOM-009",
  "NOM-010", "NOM-017", "NOM-019", "NOM-020", "NOM-025", "NOM-026",
  "NOM-030", "NOM-031", "NOM-035",
];

function StatsCards({ stats }: { stats: InstructorStats }) {
  const items = [
    { icon: BookOpen, color: "#1b5adf", bg: "#1b5adf", value: stats.totalCourses, label: "Cursos asignados" },
    { icon: Users, color: "#f28023", bg: "#f28023", value: stats.totalEnrolled, label: "Estudiantes inscritos" },
    { icon: CheckCircle2, color: "#00b87a", bg: "#00b87a", value: stats.totalCompleted, label: "Completados" },
    { icon: Award, color: "#7c3aed", bg: "#7c3aed", value: stats.totalCertificates, label: "Certificaciones" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <Card key={i} className="border-black/[0.06]" data-testid={`card-instructor-stat-${i}`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.bg}15` }}>
                  <Icon size={18} style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold text-cedu-ink leading-none font-serif">{item.value}</p>
                  <p className="text-[11px] text-cedu-ink-muted mt-0.5">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function OverviewTab({ stats, courses, students, coursesLoading, studentsLoading, setActiveTab, profileName }: {
  stats: InstructorStats | undefined; courses: InstructorCourse[]; students: StudentInfo[];
  coursesLoading: boolean; studentsLoading: boolean; setActiveTab: (t: string) => void; profileName: string;
}) {
  function getGreeting(): string {
    const h = new Date().getHours();
    return h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches";
  }

  return (
    <div className="space-y-6">
      <Card className="border-black/[0.06] overflow-hidden" data-testid="card-instructor-welcome">
        <div className="h-1 bg-gradient-to-r from-[#7c3aed] via-[#1b5adf] to-[#f28023]" />
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-cedu-violet rounded-2xl flex items-center justify-center text-white font-serif text-2xl flex-shrink-0">
              {profileName.charAt(0).toUpperCase() || "I"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-xl text-cedu-ink truncate" data-testid="text-instructor-welcome">
                {getGreeting()}, {profileName.split(" ").slice(-2).join(" ") || "Instructor"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-cedu-ink-muted">Panel de Instructor</p>
                <Badge className="bg-cedu-orange/10 text-cedu-orange border-0 text-[10px]">Instructor</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats && <StatsCards stats={stats} />}

      <Card className="border-black/[0.06]" data-testid="card-instructor-courses-overview">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-base text-cedu-ink">Tus Cursos</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-cedu-blue" onClick={() => setActiveTab("courses")} data-testid="button-view-all-courses">
              Ver todos <ArrowRight size={12} className="ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {coursesLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : courses.length === 0 ? (
            <p className="text-sm text-cedu-ink-muted text-center py-6">No tienes cursos asignados aún</p>
          ) : (
            <div className="space-y-2">
              {courses.slice(0, 5).map((course) => (
                <div key={course.id} className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] transition-colors" data-testid={`row-instructor-course-${course.slug}`}>
                  <div className="w-8 h-8 bg-cedu-blue-light rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} className="text-cedu-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-cedu-ink truncate">{course.title}</p>
                    <p className="text-[11px] text-cedu-ink-muted">{course.enrolledCount} inscritos · {course.avgProgress}% promedio</p>
                  </div>
                  <div className="w-16"><Progress value={course.avgProgress} className="h-1.5" /></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-black/[0.06]" data-testid="card-instructor-students-overview">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-base text-cedu-ink">Estudiantes Recientes</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-cedu-blue" onClick={() => setActiveTab("students")} data-testid="button-view-all-students">
              Ver todos <ArrowRight size={12} className="ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          ) : students.length === 0 ? (
            <p className="text-sm text-cedu-ink-muted text-center py-6">Aún no tienes estudiantes inscritos</p>
          ) : (
            <div className="space-y-2">
              {students.slice(0, 5).map((s) => (
                <div key={s.userId} className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02]">
                  <div className="w-8 h-8 bg-cedu-violet/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCircle size={16} className="text-cedu-violet" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-cedu-ink truncate">{s.fullName || s.email}</p>
                    <p className="text-[11px] text-cedu-ink-muted">{s.courses.length} curso{s.courses.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CoursesTab({ courses, onSelectCourse }: { courses: InstructorCourse[]; onSelectCourse: (id: string) => void }) {
  if (courses.length === 0) {
    return (
      <Card className="border-black/[0.06]">
        <CardContent className="py-12 text-center">
          <BookOpen size={40} className="mx-auto text-cedu-ink-muted/40 mb-3" />
          <p className="text-sm text-cedu-ink-muted">No tienes cursos asignados aún</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {courses.map((course) => (
        <Card
          key={course.id}
          className="border-black/[0.06] hover:border-cedu-blue/20 transition-colors cursor-pointer"
          onClick={() => onSelectCourse(course.id)}
          data-testid={`card-instructor-course-${course.slug}`}
        >
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-cedu-blue-light rounded-xl flex items-center justify-center flex-shrink-0">
                <GraduationCap size={22} className="text-cedu-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-cedu-ink line-clamp-2">{course.title}</h4>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-cedu-ink-muted">
                  {course.areaTematica && <Badge variant="outline" className="text-[10px] px-2 py-0">{course.areaTematica}</Badge>}
                  {course.nivel && <Badge variant="outline" className="text-[10px] px-2 py-0">{course.nivel}</Badge>}
                  {course.durationHrs && <span className="flex items-center gap-1"><Clock size={12} /> {course.durationHrs}h</span>}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-cedu-ink-muted">
                    <Users size={14} className="text-cedu-orange" />
                    <span>{course.enrolledCount} inscritos</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-cedu-ink-muted">
                    <CheckCircle2 size={14} className="text-cedu-green" />
                    <span>{course.completedCount} completados</span>
                  </div>
                  <div className="flex-1 max-w-[120px]"><Progress value={course.avgProgress} className="h-1.5" /></div>
                  <span className="text-xs font-semibold text-cedu-blue">{course.avgProgress}%</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-cedu-ink-muted/40 mt-3 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type CourseModule = {
  id: string;
  courseId: string;
  order: number;
  title: string;
  description: string | null;
  contentHtml: string | null;
  audioUrl: string | null;
  durationMinutes: number | null;
};

function ModuleCard({ mod, courseId, refetch }: { mod: CourseModule; courseId: string; refetch: () => void }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [videoScript, setVideoScript] = useState("");
  const [showVideoGen, setShowVideoGen] = useState(false);

  const hasCustomAudio = mod.audioUrl?.startsWith("instructor_");
  const hasAudio = !!mod.audioUrl;

  const { data: avatarData } = useQuery<{ hasAvatar: boolean; heygenConfigured: boolean }>({
    queryKey: ["/api/heygen/avatar/me"],
    enabled: expanded,
  });

  const { data: moduleVideo } = useQuery<{ video: any }>({
    queryKey: ["/api/heygen/video/module", courseId, mod.id],
    enabled: expanded,
  });

  const generateVideoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/heygen/video/generate-module", {
        course_id: courseId,
        module_id: mod.id,
        script_text: videoScript,
        title: mod.title,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Video en generación", description: "El proceso toma 2-5 minutos. Recarga para ver el estado." });
      setShowVideoGen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/heygen/video/module", courseId, mod.id] });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function stripHtml(html: string) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = localStorage.getItem("cedu_token");
      const formData = new FormData();
      formData.append("audio", file);
      const res = await fetch(`/api/instructor/courses/${courseId}/modules/${mod.id}/audio`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Error al subir audio");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Audio actualizado" });
      setUploadingAudio(false);
      refetch();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setUploadingAudio(false);
    },
  });

  const deleteAudioMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("cedu_token");
      const res = await fetch(`/api/instructor/courses/${courseId}/modules/${mod.id}/audio`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al eliminar audio");
      return res.json();
    },
    onSuccess: () => { toast({ title: "Audio eliminado" }); refetch(); },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const saveContentMutation = useMutation({
    mutationFn: async (contentHtml: string) => {
      const token = localStorage.getItem("cedu_token");
      const res = await fetch(`/api/instructor/courses/${courseId}/modules/${mod.id}/content`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ contentHtml }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Transcripción guardada", description: "El contenido se actualizó en el curso público." });
      setEditingContent(false);
      refetch();
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  function handleFileSelect() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".mp3,.wav,.m4a,.ogg,.webm";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 100 * 1024 * 1024) {
          toast({ title: "Archivo muy grande", description: "Máximo 100 MB.", variant: "destructive" });
          return;
        }
        setUploadingAudio(true);
        uploadMutation.mutate(file);
      }
    };
    input.click();
  }

  function toggleAudio() {
    if (playingAudio && audioEl) {
      audioEl.pause();
      setPlayingAudio(false);
      setAudioEl(null);
      return;
    }
    if (audioEl) audioEl.pause();
    const url = mod.audioUrl!.startsWith("http") ? mod.audioUrl! : `/audio/${mod.audioUrl}`;
    const el = new Audio(url);
    el.play();
    el.onended = () => { setPlayingAudio(false); setAudioEl(null); };
    setPlayingAudio(true);
    setAudioEl(el);
  }

  function startEditing() {
    setEditedContent(mod.contentHtml || "");
    setEditingContent(true);
  }

  const plainText = mod.contentHtml ? stripHtml(mod.contentHtml) : "";
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  return (
    <Card className={`border-black/[0.06] transition-all ${expanded ? "ring-1 ring-cedu-blue/20" : ""}`} data-testid={`card-module-${mod.id}`}>
      <CardContent className="py-0">
        <button
          className="w-full flex items-center gap-4 py-4 text-left cursor-pointer"
          onClick={() => setExpanded(!expanded)}
          data-testid={`button-expand-module-${mod.id}`}
        >
          <div className="w-9 h-9 bg-cedu-violet/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-cedu-violet">{mod.order}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-cedu-ink line-clamp-1">{mod.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              {hasAudio && (
                <Badge variant="outline" className={`text-[10px] ${hasCustomAudio ? "bg-cedu-green/10 text-cedu-green border-cedu-green/20" : "bg-cedu-blue/10 text-cedu-blue border-cedu-blue/20"}`}>
                  <Volume2 size={10} className="mr-1" />
                  {hasCustomAudio ? "Voz propia" : "Audio IA"}
                </Badge>
              )}
              {mod.contentHtml && <Badge variant="outline" className="text-[10px] text-cedu-ink-muted"><FileText size={10} className="mr-1" /> {wordCount} palabras</Badge>}
            </div>
          </div>
          <ChevronRight size={16} className={`text-cedu-ink-muted/40 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>

        {expanded && (
          <div className="pb-4 space-y-4 border-t border-black/[0.04] pt-4">
            <div>
              <h5 className="text-xs font-semibold text-cedu-ink uppercase tracking-wider mb-3 flex items-center gap-2">
                <Mic size={14} className="text-cedu-blue" /> Audio de Conferencia
              </h5>
              <div className="flex items-center gap-2 flex-wrap">
                {hasAudio && (
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={toggleAudio} data-testid={`button-play-audio-${mod.id}`}>
                    {playingAudio ? <><Pause size={12} className="mr-1.5" /> Pausar</> : <><Play size={12} className="mr-1.5" /> Escuchar {hasCustomAudio ? "mi audio" : "audio IA"}</>}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-cedu-blue/20 text-cedu-blue hover:bg-cedu-blue/5"
                  onClick={handleFileSelect}
                  disabled={uploadingAudio}
                  data-testid={`button-upload-audio-${mod.id}`}
                >
                  {uploadingAudio
                    ? <><RefreshCw size={12} className="mr-1.5 animate-spin" /> Subiendo...</>
                    : <><Upload size={12} className="mr-1.5" /> {hasAudio ? "Subir mi grabación" : "Subir audio"}</>
                  }
                </Button>
                {hasCustomAudio && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => { if (confirm("¿Restaurar al audio original generado por IA?")) deleteAudioMutation.mutate(); }}
                    disabled={deleteAudioMutation.isPending}
                    data-testid={`button-restore-audio-${mod.id}`}
                  >
                    <RefreshCw size={12} className="mr-1" /> Restaurar IA
                  </Button>
                )}
              </div>
              {!hasAudio && <p className="text-xs text-cedu-ink-muted mt-2">Este módulo no tiene audio. Sube una grabación de tu voz para la conferencia.</p>}
            </div>

            {avatarData?.hasAvatar && avatarData?.heygenConfigured && (
              <div>
                <h5 className="text-xs font-semibold text-cedu-ink uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Video size={14} className="text-[#7c3aed]" /> Video Digital Twin
                </h5>
                {moduleVideo?.video ? (
                  <div className="bg-[#7c3aed]/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#00b87a]/10 text-[#00b87a] border-0 text-[10px]">Video generado</Badge>
                      {moduleVideo.video.videoDurationSeconds && (
                        <span className="text-[10px] text-cedu-ink-muted">{Math.round(moduleVideo.video.videoDurationSeconds / 60)} min</span>
                      )}
                    </div>
                    {moduleVideo.video.videoUrl && (
                      <video
                        src={moduleVideo.video.videoUrl}
                        controls
                        className="w-full rounded-lg max-h-48"
                        data-testid={`video-preview-${mod.id}`}
                      />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-[#7c3aed]"
                      onClick={() => { setVideoScript(mod.contentHtml ? stripHtml(mod.contentHtml) : ""); setShowVideoGen(true); }}
                      data-testid={`button-regenerate-video-${mod.id}`}
                    >
                      <RefreshCw size={12} className="mr-1" /> Regenerar video
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {!showVideoGen ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-[#7c3aed]/20 text-[#7c3aed] hover:bg-[#7c3aed]/5"
                        onClick={() => { setVideoScript(mod.contentHtml ? stripHtml(mod.contentHtml) : ""); setShowVideoGen(true); }}
                        data-testid={`button-gen-video-${mod.id}`}
                      >
                        <Cpu size={12} className="mr-1.5" /> Generar video con Digital Twin
                      </Button>
                    ) : (
                      <div className="bg-[#7c3aed]/5 rounded-xl p-3 space-y-3">
                        <p className="text-xs text-cedu-ink-muted">Escribe o edita el guión que tu clon digital dirá en el video:</p>
                        <Textarea
                          value={videoScript}
                          onChange={e => setVideoScript(e.target.value)}
                          placeholder="Escribe el guión del video (mínimo 50 caracteres)..."
                          rows={4}
                          className="text-sm"
                          data-testid={`textarea-video-script-${mod.id}`}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-[#7c3aed] hover:bg-[#7c3aed]/90 h-8 text-xs"
                            onClick={() => generateVideoMutation.mutate()}
                            disabled={generateVideoMutation.isPending || videoScript.trim().length < 50}
                            data-testid={`button-submit-video-${mod.id}`}
                          >
                            {generateVideoMutation.isPending ? (
                              <><RefreshCw size={12} className="mr-1 animate-spin" /> Generando...</>
                            ) : (
                              <><Video size={12} className="mr-1" /> Generar video</>
                            )}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowVideoGen(false)}>
                            Cancelar
                          </Button>
                        </div>
                        <p className="text-[10px] text-cedu-ink-muted">{videoScript.length} caracteres · Mínimo 50</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-xs font-semibold text-cedu-ink uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} className="text-cedu-violet" /> Transcripción / Guión
                </h5>
                <div className="flex items-center gap-1.5">
                  {!editingContent && mod.contentHtml && (
                    <>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowTranscript(!showTranscript)} data-testid={`button-toggle-transcript-${mod.id}`}>
                        {showTranscript ? "Ocultar" : "Ver texto"}
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs border-cedu-violet/20 text-cedu-violet" onClick={startEditing} data-testid={`button-edit-transcript-${mod.id}`}>
                        <PenTool size={11} className="mr-1" /> Editar
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {!editingContent && showTranscript && mod.contentHtml && (
                <div className="bg-white border border-black/[0.06] rounded-xl p-4 max-h-80 overflow-y-auto">
                  <div className="prose prose-sm max-w-none text-cedu-ink text-[13px] leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(mod.contentHtml) }} />
                </div>
              )}

              {!editingContent && !mod.contentHtml && (
                <p className="text-xs text-cedu-ink-muted">Este módulo no tiene transcripción.</p>
              )}

              {editingContent && (
                <div className="space-y-3">
                  <p className="text-xs text-cedu-ink-muted">Edita el guión de la conferencia. Este texto es el que los alumnos ven en el Aula Virtual y se usa como base para generar el audio IA.</p>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[300px] text-sm font-mono leading-relaxed"
                    data-testid={`textarea-transcript-${mod.id}`}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-cedu-blue hover:bg-cedu-blue/90 h-8 text-xs"
                      onClick={() => saveContentMutation.mutate(editedContent)}
                      disabled={saveContentMutation.isPending}
                      data-testid={`button-save-transcript-${mod.id}`}
                    >
                      {saveContentMutation.isPending ? <><RefreshCw size={12} className="mr-1 animate-spin" /> Guardando...</> : <><Save size={12} className="mr-1" /> Guardar cambios</>}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingContent(false)} data-testid={`button-cancel-transcript-${mod.id}`}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-cedu-ink-muted"
                      onClick={() => { setEditedContent(mod.contentHtml || ""); }}
                      data-testid={`button-restore-transcript-${mod.id}`}
                    >
                      <RefreshCw size={12} className="mr-1" /> Restaurar original
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CourseDetailTab({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const { data, isLoading, refetch } = useQuery<{ course: any; modules: CourseModule[] }>({
    queryKey: ["/api/instructor/courses", courseId, "modules"],
    queryFn: async () => {
      const token = localStorage.getItem("cedu_token");
      const res = await fetch(`/api/instructor/courses/${courseId}/modules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar módulos");
      return res.json();
    },
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  const course = data?.course;
  const modules = data?.modules || [];

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-cedu-ink-muted hover:text-cedu-ink" data-testid="button-back-to-courses">
        <ArrowLeft size={16} className="mr-1.5" /> Volver a mis cursos
      </Button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-cedu-blue-light rounded-xl flex items-center justify-center flex-shrink-0">
          <GraduationCap size={24} className="text-cedu-blue" />
        </div>
        <div>
          <h2 className="font-['DM_Serif_Display'] text-xl text-cedu-ink">{course?.title}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {course?.areaTematica && <Badge variant="outline" className="text-[10px]">{course.areaTematica}</Badge>}
            {course?.nivel && <Badge variant="outline" className="text-[10px]">{course.nivel}</Badge>}
            {course?.durationHrs && <span className="text-xs text-cedu-ink-muted flex items-center gap-1"><Clock size={12} /> {course.durationHrs}h</span>}
          </div>
        </div>
      </div>

      <Card className="border-cedu-blue/10 bg-cedu-blue/[0.02]">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-cedu-ink-muted leading-relaxed">
            <strong className="text-cedu-ink">Editor de Curso:</strong> Haz clic en cada módulo para expandirlo. Puedes subir tu propia grabación de voz para reemplazar el audio IA, 
            y editar el guión/transcripción que los alumnos ven en el Aula Virtual.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-cedu-ink flex items-center gap-2">
          Módulos <Badge variant="outline" className="text-[10px] ml-1">{modules.length}</Badge>
        </h3>
        {modules.length === 0 ? (
          <Card className="border-black/[0.06]">
            <CardContent className="py-8 text-center">
              <BookOpen size={32} className="mx-auto text-cedu-ink-muted/40 mb-2" />
              <p className="text-sm text-cedu-ink-muted">Este curso no tiene módulos configurados</p>
            </CardContent>
          </Card>
        ) : (
          modules.map(mod => <ModuleCard key={mod.id} mod={mod} courseId={courseId} refetch={refetch} />)
        )}
      </div>
    </div>
  );
}

function StudentsTab({ students, isLoading }: { students: StudentInfo[]; isLoading: boolean }) {
  const [filter, setFilter] = useState("");
  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  if (students.length === 0) {
    return (
      <Card className="border-black/[0.06]">
        <CardContent className="py-12 text-center">
          <Users size={40} className="mx-auto text-cedu-ink-muted/40 mb-3" />
          <p className="text-sm text-cedu-ink-muted">Aún no tienes estudiantes inscritos</p>
        </CardContent>
      </Card>
    );
  }
  const filtered = filter ? students.filter(s =>
    (s.fullName || "").toLowerCase().includes(filter.toLowerCase()) || s.email.toLowerCase().includes(filter.toLowerCase())
  ) : students;

  return (
    <div className="space-y-4">
      <Input placeholder="Buscar estudiante..." value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-sm" data-testid="input-search-students" />
      <div className="space-y-3">
        {filtered.map((student) => {
          const avg = student.courses.length > 0 ? Math.round(student.courses.reduce((s, c) => s + c.progress, 0) / student.courses.length) : 0;
          return (
            <Card key={student.userId} className="border-black/[0.06]" data-testid={`card-student-${student.userId}`}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-cedu-violet/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCircle size={20} className="text-cedu-violet" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-cedu-ink truncate">{student.fullName || student.email}</p>
                    {student.fullName && <p className="text-xs text-cedu-ink-muted truncate">{student.email}</p>}
                    <div className="mt-2 space-y-1">
                      {student.courses.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className="text-cedu-ink-muted truncate flex-1">{c.title}</span>
                          <div className="w-16"><Progress value={c.progress} className="h-1" /></div>
                          <span className="text-cedu-ink font-semibold w-8 text-right">{c.progress}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Badge className={`text-[10px] px-2 py-0.5 border-0 flex-shrink-0 ${avg === 100 ? "bg-cedu-green/10 text-cedu-green" : avg > 50 ? "bg-cedu-blue/10 text-cedu-blue" : "bg-cedu-orange/10 text-cedu-orange"}`}>
                    {avg}% prom.
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CreateCourseTab({ onComplete }: { onComplete: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "", description: "", category: "", level: "basico",
    durationHours: "", certificationType: "nft", tags: "",
    isFree: true, price: "", availableForAll: true, nomsRelated: [] as string[],
    modules: [{ title: "", description: "", durationMin: 30, content: "" }] as { title: string; description: string; durationMin: number; content: string }[],
    quizzes: [{ moduleIndex: 0, questions: [{ question: "", options: ["", "", "", ""], correctIndex: 0 }], passingScore: 70 }] as { moduleIndex: number; questions: { question: string; options: string[]; correctIndex: number }[]; passingScore: number }[],
  });

  const createMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("POST", "/api/instructor/my-courses", {
        ...form,
        durationHours: form.durationHours ? parseInt(form.durationHours) : null,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        status,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/my-courses"] });
      toast({ title: "Curso creado exitosamente" });
      onComplete();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const addModule = () => {
    setForm(prev => ({
      ...prev,
      modules: [...prev.modules, { title: "", description: "", durationMin: 30, content: "" }],
    }));
  };

  const removeModule = (idx: number) => {
    if (form.modules.length <= 1) return;
    setForm(prev => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== idx),
    }));
  };

  const updateModule = (idx: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      modules: prev.modules.map((m, i) => i === idx ? { ...m, [field]: value } : m),
    }));
  };

  const updateQuizQuestion = (qIdx: number, field: string, value: any) => {
    setForm(prev => {
      const quizzes = [...prev.quizzes];
      if (!quizzes[0]) return prev;
      const questions = [...quizzes[0].questions];
      questions[qIdx] = { ...questions[qIdx], [field]: value };
      quizzes[0] = { ...quizzes[0], questions };
      return { ...prev, quizzes };
    });
  };

  const addQuestion = () => {
    setForm(prev => {
      const quizzes = [...prev.quizzes];
      if (!quizzes[0]) quizzes[0] = { moduleIndex: 0, questions: [], passingScore: 70 };
      quizzes[0] = { ...quizzes[0], questions: [...quizzes[0].questions, { question: "", options: ["", "", "", ""], correctIndex: 0 }] };
      return { ...prev, quizzes };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className={`flex items-center gap-1.5 ${s <= step ? "text-cedu-blue" : "text-cedu-ink-muted"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${s === step ? "bg-cedu-blue text-white" : s < step ? "bg-cedu-blue/20 text-cedu-blue" : "bg-black/5 text-cedu-ink-muted"}`}>
              {s < step ? "✓" : s}
            </div>
            <span className="text-[11px] font-semibold hidden sm:block">
              {s === 1 ? "Info" : s === 2 ? "Contenido" : s === 3 ? "Evaluación" : s === 4 ? "Config" : "Revisión"}
            </span>
            {s < 5 && <ChevronRight size={14} className="text-cedu-ink-muted/50" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="border-black/[0.06]">
          <CardHeader><CardTitle className="font-serif text-base">Información básica</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Nombre del curso *</Label>
              <Input value={form.title} onChange={e => updateField("title", e.target.value)} placeholder="Ej: Seguridad Industrial Avanzada" data-testid="input-course-title" />
            </div>
            <div>
              <Label className="text-xs">Descripción</Label>
              <Textarea value={form.description} onChange={e => updateField("description", e.target.value)} placeholder="Describe el contenido y objetivos del curso..." rows={3} data-testid="input-course-description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Categoría</Label>
                <Select value={form.category} onValueChange={v => updateField("category", v)}>
                  <SelectTrigger data-testid="select-course-category"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    {COURSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Nivel</Label>
                <Select value={form.level} onValueChange={v => updateField("level", v)}>
                  <SelectTrigger data-testid="select-course-level"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="intermedio">Intermedio</SelectItem>
                    <SelectItem value="avanzado">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Duración (horas)</Label>
                <Input type="number" value={form.durationHours} onChange={e => updateField("durationHours", e.target.value)} placeholder="8" data-testid="input-course-duration" />
              </div>
              <div>
                <Label className="text-xs">Tipo de certificación</Label>
                <Select value={form.certificationType} onValueChange={v => updateField("certificationType", v)}>
                  <SelectTrigger data-testid="select-course-cert"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nft">Solo Diploma NFT</SelectItem>
                    <SelectItem value="dc3">DC-3 STPS</SelectItem>
                    <SelectItem value="sep">Certificado SEP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Tags (separados por coma)</Label>
              <Input value={form.tags} onChange={e => updateField("tags", e.target.value)} placeholder="seguridad, STPS, prevención" data-testid="input-course-tags" />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-black/[0.06]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-base">Módulos del curso</CardTitle>
              <Button size="sm" variant="outline" onClick={addModule} data-testid="button-add-module">
                <Plus size={14} className="mr-1" /> Agregar módulo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.modules.map((mod, idx) => (
              <Card key={idx} className="border-black/[0.06] bg-black/[0.01]">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cedu-blue">Módulo {idx + 1}</span>
                    {form.modules.length > 1 && (
                      <Button size="sm" variant="ghost" className="h-6 text-red-500" onClick={() => removeModule(idx)}>
                        <Trash2 size={12} />
                      </Button>
                    )}
                  </div>
                  <Input value={mod.title} onChange={e => updateModule(idx, "title", e.target.value)} placeholder="Título del módulo" data-testid={`input-module-title-${idx}`} />
                  <Input value={mod.description} onChange={e => updateModule(idx, "description", e.target.value)} placeholder="Descripción breve" data-testid={`input-module-desc-${idx}`} />
                  <Textarea value={mod.content} onChange={e => updateModule(idx, "content", e.target.value)} placeholder="Contenido del módulo (HTML o texto)..." rows={4} data-testid={`input-module-content-${idx}`} />
                  <div>
                    <Label className="text-xs">Duración (minutos)</Label>
                    <Input type="number" value={mod.durationMin} onChange={e => updateModule(idx, "durationMin", parseInt(e.target.value) || 0)} data-testid={`input-module-duration-${idx}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-black/[0.06]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-base">Evaluación</CardTitle>
              <Button size="sm" variant="outline" onClick={addQuestion} data-testid="button-add-question">
                <Plus size={14} className="mr-1" /> Agregar pregunta
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Puntaje mínimo para aprobar: {form.quizzes[0]?.passingScore || 70}%</Label>
              <input type="range" min={50} max={100} step={5} value={form.quizzes[0]?.passingScore || 70}
                onChange={e => {
                  const quizzes = [...form.quizzes];
                  if (quizzes[0]) quizzes[0] = { ...quizzes[0], passingScore: parseInt(e.target.value) };
                  setForm(prev => ({ ...prev, quizzes }));
                }}
                className="w-full mt-1"
              />
            </div>
            {(form.quizzes[0]?.questions || []).map((q, qIdx) => (
              <Card key={qIdx} className="border-black/[0.06] bg-black/[0.01]">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cedu-blue">Pregunta {qIdx + 1}</span>
                    <Button size="sm" variant="ghost" className="h-6 text-red-500" onClick={() => {
                      const quizzes = [...form.quizzes];
                      if (quizzes[0]) {
                        quizzes[0] = { ...quizzes[0], questions: quizzes[0].questions.filter((_, i) => i !== qIdx) };
                        setForm(prev => ({ ...prev, quizzes }));
                      }
                    }}><Trash2 size={12} /></Button>
                  </div>
                  <Input value={q.question} onChange={e => updateQuizQuestion(qIdx, "question", e.target.value)} placeholder="Escribe la pregunta..." data-testid={`input-question-${qIdx}`} />
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${qIdx}`} checked={q.correctIndex === oIdx}
                        onChange={() => updateQuizQuestion(qIdx, "correctIndex", oIdx)} />
                      <Input value={opt} onChange={e => {
                        const options = [...q.options]; options[oIdx] = e.target.value;
                        updateQuizQuestion(qIdx, "options", options);
                      }} placeholder={`Opción ${oIdx + 1}`} className="flex-1" data-testid={`input-option-${qIdx}-${oIdx}`} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="border-black/[0.06]">
          <CardHeader><CardTitle className="font-serif text-base">Configuración</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm">¿Curso gratuito?</Label>
              <Button size="sm" variant={form.isFree ? "default" : "outline"} onClick={() => updateField("isFree", true)} className={form.isFree ? "bg-cedu-green hover:bg-cedu-green/90" : ""} data-testid="button-free-yes">Sí</Button>
              <Button size="sm" variant={!form.isFree ? "default" : "outline"} onClick={() => updateField("isFree", false)} className={!form.isFree ? "bg-cedu-orange hover:bg-cedu-orange/90" : ""} data-testid="button-free-no">No</Button>
            </div>
            {!form.isFree && (
              <div>
                <Label className="text-xs">Precio sugerido (MXN)</Label>
                <Input type="number" value={form.price} onChange={e => updateField("price", e.target.value)} placeholder="499" data-testid="input-course-price" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Label className="text-sm">¿Disponible para todos?</Label>
              <Button size="sm" variant={form.availableForAll ? "default" : "outline"} onClick={() => updateField("availableForAll", true)} className={form.availableForAll ? "bg-cedu-blue hover:bg-cedu-blue/90" : ""} data-testid="button-avail-all">Todos</Button>
              <Button size="sm" variant={!form.availableForAll ? "default" : "outline"} onClick={() => updateField("availableForAll", false)} className={!form.availableForAll ? "bg-cedu-violet hover:bg-cedu-violet/90" : ""} data-testid="button-avail-sponsors">Solo patrocinadores</Button>
            </div>
            <div>
              <Label className="text-xs">NOMs relacionadas</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {NOMS_OPTIONS.map(nom => (
                  <Badge key={nom} variant={form.nomsRelated.includes(nom) ? "default" : "outline"}
                    className={`cursor-pointer text-xs ${form.nomsRelated.includes(nom) ? "bg-cedu-blue" : ""}`}
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        nomsRelated: prev.nomsRelated.includes(nom)
                          ? prev.nomsRelated.filter(n => n !== nom)
                          : [...prev.nomsRelated, nom],
                      }));
                    }}
                    data-testid={`badge-nom-${nom}`}
                  >
                    {nom}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card className="border-black/[0.06]">
          <CardHeader><CardTitle className="font-serif text-base">Revisión del curso</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-cedu-ink-muted">Título:</span> <span className="font-semibold">{form.title || "—"}</span></div>
              <div><span className="text-cedu-ink-muted">Categoría:</span> <span className="font-semibold">{form.category || "—"}</span></div>
              <div><span className="text-cedu-ink-muted">Nivel:</span> <span className="font-semibold capitalize">{form.level}</span></div>
              <div><span className="text-cedu-ink-muted">Duración:</span> <span className="font-semibold">{form.durationHours || "—"}h</span></div>
              <div><span className="text-cedu-ink-muted">Certificación:</span> <Badge variant="outline" className="text-[10px]">{form.certificationType.toUpperCase()}</Badge></div>
              <div><span className="text-cedu-ink-muted">Precio:</span> <span className="font-semibold">{form.isFree ? "Gratis" : `$${form.price} MXN`}</span></div>
            </div>
            <div className="pt-2">
              <p className="text-xs text-cedu-ink-muted mb-1">Módulos: {form.modules.length}</p>
              {form.modules.map((m, i) => (
                <div key={i} className="text-xs py-1 border-b border-black/[0.04]">
                  <span className="font-semibold">{i + 1}.</span> {m.title || "(sin título)"} — {m.durationMin}min
                </div>
              ))}
            </div>
            <div className="pt-2">
              <p className="text-xs text-cedu-ink-muted">Preguntas de evaluación: {form.quizzes[0]?.questions.length || 0}</p>
              <p className="text-xs text-cedu-ink-muted">Puntaje mínimo: {form.quizzes[0]?.passingScore || 70}%</p>
            </div>
            {form.nomsRelated.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {form.nomsRelated.map(n => <Badge key={n} variant="outline" className="text-[10px]">{n}</Badge>)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} data-testid="button-wizard-prev">
          <ChevronLeft size={16} className="mr-1" /> Anterior
        </Button>
        <div className="flex gap-2">
          {step === 5 && (
            <>
              <Button variant="outline" onClick={() => createMutation.mutate("draft")} disabled={createMutation.isPending} data-testid="button-save-draft">
                <Save size={14} className="mr-1" /> Guardar borrador
              </Button>
              <Button className="bg-cedu-blue hover:bg-cedu-blue/90" onClick={() => createMutation.mutate("review")} disabled={!form.title || createMutation.isPending} data-testid="button-submit-review">
                <Send size={14} className="mr-1" /> Enviar a revisión
              </Button>
            </>
          )}
          {step < 5 && (
            <Button className="bg-cedu-blue hover:bg-cedu-blue/90" onClick={() => setStep(Math.min(5, step + 1))} disabled={step === 1 && !form.title} data-testid="button-wizard-next">
              Siguiente <ChevronRight size={16} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MyCreatedCoursesTab({ setActiveTab }: { setActiveTab: (t: string) => void }) {
  const [, navigate] = useLocation();
  const { data: myCourses = [], isLoading } = useQuery<MyCreatedCourse[]>({
    queryKey: ["/api/instructor/my-courses"],
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    review: "bg-amber-100 text-amber-700",
    published: "bg-green-100 text-green-700",
    archived: "bg-red-100 text-red-600",
  };
  const statusLabels: Record<string, string> = { draft: "Borrador", review: "En revisión", published: "Publicado", archived: "Archivado" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-cedu-ink">Mis Cursos Creados</h3>
        <Button className="bg-cedu-blue hover:bg-cedu-blue/90" size="sm" onClick={() => setActiveTab("create")} data-testid="button-create-course">
          <Plus size={14} className="mr-1" /> Crear nuevo curso
        </Button>
      </div>

      {myCourses.length === 0 ? (
        <Card className="border-black/[0.06]">
          <CardContent className="py-12 text-center">
            <PenTool size={40} className="mx-auto text-cedu-ink-muted/40 mb-3" />
            <p className="text-sm text-cedu-ink-muted">No has creado cursos aún</p>
            <Button className="bg-cedu-blue hover:bg-cedu-blue/90 mt-3" size="sm" onClick={() => setActiveTab("create")} data-testid="button-create-first-course">
              Crear tu primer curso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {myCourses.map(course => (
            <Card key={course.id} className="border-black/[0.06] hover:border-cedu-blue/20 transition-colors" data-testid={`card-created-course-${course.id}`}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-cedu-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <PenTool size={22} className="text-cedu-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-cedu-ink line-clamp-1">{course.title}</h4>
                      <Badge className={`text-[10px] px-2 py-0 border-0 ${statusColors[course.status || "draft"]}`}>
                        {statusLabels[course.status || "draft"]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-cedu-ink-muted">
                      {course.category && <span>{course.category}</span>}
                      {course.level && <Badge variant="outline" className="text-[10px] px-2 py-0 capitalize">{course.level}</Badge>}
                      {course.durationHours && <span className="flex items-center gap-1"><Clock size={12} /> {course.durationHours}h</span>}
                      <span>{(course.modules || []).length} módulos</span>
                    </div>
                    {course.description && <p className="text-xs text-cedu-ink-muted mt-1 line-clamp-2">{course.description}</p>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => navigate(`/instructor/curso/${course.id}`)}
                    data-testid={`button-editar-curso-${course.id}`}
                  >
                    <PenTool size={13} className="mr-1" /> Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CommissionsTab() {
  const { data, isLoading } = useQuery<CommissionData>({ queryKey: ["/api/instructor/commissions"] });
  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total acumulado", value: `$${data.totalCommission.toLocaleString()}`, icon: DollarSign, color: "#00b87a" },
          { label: "DC-3 vendidos", value: data.totalDc3, icon: FileText, color: "#1b5adf" },
          { label: "SEP vendidos", value: data.totalSep, icon: Award, color: "#7c3aed" },
          { label: "Tasa comisión", value: `${data.commissionRate}%`, icon: TrendingUp, color: "#f28023" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Card key={i} className="border-black/[0.06]" data-testid={`card-commission-stat-${i}`}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                    <Icon size={18} style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-cedu-ink leading-none font-serif">{item.value}</p>
                    <p className="text-[11px] text-cedu-ink-muted mt-0.5">{item.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-black/[0.06]">
        <CardHeader><CardTitle className="font-serif text-base">Desglose de comisiones</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cedu-blue/10 rounded-lg flex items-center justify-center"><Users size={16} className="text-cedu-blue" /></div>
                <div><p className="text-sm font-semibold text-cedu-ink">Comisión residual ({data.commissionRate}%)</p><p className="text-[11px] text-cedu-ink-muted">{data.totalEnrolled} alumnos</p></div>
              </div>
              <span className="font-bold text-cedu-green">${data.residualCommission.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cedu-blue/10 rounded-lg flex items-center justify-center"><FileText size={16} className="text-cedu-blue" /></div>
                <div><p className="text-sm font-semibold text-cedu-ink">Certificados DC-3 ({data.dc3CommissionPct || 40}% de ${data.dc3Price || 399})</p><p className="text-[11px] text-cedu-ink-muted">{data.totalDc3} certificados</p></div>
              </div>
              <span className="font-bold text-cedu-green">${data.dc3Commission.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cedu-violet/10 rounded-lg flex items-center justify-center"><Award size={16} className="text-cedu-violet" /></div>
                <div><p className="text-sm font-semibold text-cedu-ink">Certificados SEP ({data.sepCommissionPct || 10}% de ${data.sepPrice || '1,999'})</p><p className="text-[11px] text-cedu-ink-muted">{data.totalSep} certificados</p></div>
              </div>
              <span className="font-bold text-cedu-green">${data.sepCommission.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cedu-orange/10 rounded-lg flex items-center justify-center"><Users size={16} className="text-cedu-orange" /></div>
                <div><p className="text-sm font-semibold text-cedu-ink">Comisión por referir empresas</p><p className="text-[11px] text-cedu-ink-muted">$500 por empresa referida activa</p></div>
              </div>
              <span className="font-bold text-cedu-green">${(data.referralCommission || 0).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CertificatesTab() {
  const { data: certs = [], isLoading } = useQuery<CertificateEntry[]>({ queryKey: ["/api/instructor/certificates"] });
  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  if (certs.length === 0) {
    return (
      <Card className="border-black/[0.06]">
        <CardContent className="py-12 text-center">
          <Award size={40} className="mx-auto text-cedu-ink-muted/40 mb-3" />
          <p className="text-sm text-cedu-ink-muted">No hay certificados emitidos aún</p>
        </CardContent>
      </Card>
    );
  }

  const typeColors: Record<string, string> = { dc3: "bg-cedu-blue/10 text-cedu-blue", sep: "bg-cedu-violet/10 text-cedu-violet", nft: "bg-cedu-green/10 text-cedu-green" };
  const statusColors: Record<string, string> = { emitido: "bg-green-100 text-green-700", pendiente: "bg-amber-100 text-amber-700", rechazado: "bg-red-100 text-red-600" };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/[0.06]">
              <th className="text-left py-2 text-xs text-cedu-ink-muted font-semibold">Alumno</th>
              <th className="text-left py-2 text-xs text-cedu-ink-muted font-semibold">Curso</th>
              <th className="text-left py-2 text-xs text-cedu-ink-muted font-semibold">Tipo</th>
              <th className="text-left py-2 text-xs text-cedu-ink-muted font-semibold">Estado</th>
              <th className="text-left py-2 text-xs text-cedu-ink-muted font-semibold">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {certs.map(cert => (
              <tr key={cert.id} className="border-b border-black/[0.03] hover:bg-black/[0.02]" data-testid={`row-cert-${cert.id}`}>
                <td className="py-3">
                  <p className="font-semibold text-cedu-ink">{cert.studentName}</p>
                  <p className="text-[11px] text-cedu-ink-muted">{cert.studentEmail}</p>
                </td>
                <td className="py-3 text-cedu-ink-muted max-w-[200px] truncate">{cert.courseTitle}</td>
                <td className="py-3"><Badge className={`text-[10px] border-0 ${typeColors[cert.type] || ""}`}>{cert.type.toUpperCase()}</Badge></td>
                <td className="py-3"><Badge className={`text-[10px] border-0 capitalize ${statusColors[cert.status] || ""}`}>{cert.status}</Badge></td>
                <td className="py-3 text-cedu-ink-muted text-xs">{new Date(cert.createdAt).toLocaleDateString("es-MX")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const { data, isLoading } = useQuery<AnalyticsData>({ queryKey: ["/api/instructor/analytics"] });
  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;
  if (!data) return null;

  const { summary, courses: courseData } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Cursos", value: summary.totalCourses, color: "#1b5adf" },
          { label: "Inscritos", value: summary.totalEnrolled, color: "#f28023" },
          { label: "Completados", value: summary.totalCompleted, color: "#00b87a" },
          { label: "Tasa completación", value: `${summary.overallCompletionRate}%`, color: "#7c3aed" },
        ].map((item, i) => (
          <Card key={i} className="border-black/[0.06]" data-testid={`card-analytics-stat-${i}`}>
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-2xl font-bold font-serif" style={{ color: item.color }}>{item.value}</p>
              <p className="text-[11px] text-cedu-ink-muted mt-0.5">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-black/[0.06]">
        <CardHeader><CardTitle className="font-serif text-base">Rendimiento por curso</CardTitle></CardHeader>
        <CardContent>
          {courseData.length === 0 ? (
            <p className="text-sm text-cedu-ink-muted text-center py-6">No hay datos de cursos</p>
          ) : (
            <div className="space-y-4">
              {courseData.map(course => (
                <div key={course.courseId} className="p-4 rounded-xl bg-black/[0.02]" data-testid={`row-analytics-course-${course.courseId}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-cedu-ink line-clamp-1 flex-1">{course.title}</h4>
                    <Badge variant="outline" className="text-[10px] ml-2">{course.completionRate}% completación</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div><span className="text-cedu-ink-muted">Inscritos</span><p className="font-bold text-cedu-blue">{course.enrolledCount}</p></div>
                    <div><span className="text-cedu-ink-muted">Completados</span><p className="font-bold text-cedu-green">{course.completedCount}</p></div>
                    <div><span className="text-cedu-ink-muted">Progreso prom.</span><p className="font-bold text-cedu-orange">{course.avgProgress}%</p></div>
                    <div><span className="text-cedu-ink-muted">Certificados</span><p className="font-bold text-cedu-violet">{course.certificates}</p></div>
                  </div>
                  <Progress value={course.avgProgress} className="h-1.5 mt-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileTab() {
  const { toast } = useToast();
  const { data: instrProfile, isLoading } = useQuery<InstructorProfileData>({ queryKey: ["/api/instructor/profile"] });
  const { data: userProfile } = useQuery<{ fullName: string | null }>({ queryKey: ["/api/me/profile"] });
  const [bio, setBio] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankClabe, setBankClabe] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (instrProfile && !loaded) {
      setBio(instrProfile.bio || "");
      setSpecialty(instrProfile.specialty || "");
      setBankName(instrProfile.bankName || "");
      setBankClabe(instrProfile.bankClabe || "");
      setLoaded(true);
    }
  }, [instrProfile, loaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/instructor/profile", { bio, specialty, bankName, bankClabe });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/profile"] });
      toast({ title: "Perfil actualizado" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <Card className="border-black/[0.06]">
        <CardHeader><CardTitle className="font-serif text-base">Perfil de instructor</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-cedu-violet rounded-2xl flex items-center justify-center text-white font-serif text-2xl">
              {(userProfile?.fullName || "I").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-cedu-ink">{userProfile?.fullName || "Instructor"}</p>
              {instrProfile?.verified ? (
                <Badge className="bg-cedu-green/10 text-cedu-green border-0 text-[10px]"><CheckCircle2 size={12} className="mr-1" /> Verificado</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">Pendiente de verificación</Badge>
              )}
              {instrProfile?.instructorBadgeType && (
                <Badge className={`${instrProfile.instructorBadgeType === "acreditado_dc5" ? "bg-[#1b5adf]/10 text-[#1b5adf]" : "bg-green-100 text-green-700"} border-0 text-[10px] ml-1`} data-testid="text-profile-badge-type">
                  {instrProfile.instructorBadgeType === "acreditado_dc5" ? "Acreditado STPS (DC-5)" : "Instructor Interno"}
                </Badge>
              )}
              <p className="text-xs text-cedu-ink-muted mt-1">Comisión: {instrProfile?.commissionRate || "15"}%</p>
              {instrProfile?.verifiedAt && (
                <p className="text-[10px] text-cedu-ink-muted">Acreditado: {new Date(instrProfile.verifiedAt).toLocaleDateString("es-MX")}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs">Especialidad</Label>
            <Input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Ej: Seguridad Industrial, NOM-035" data-testid="input-specialty" />
          </div>
          <div>
            <Label className="text-xs">Biografía profesional</Label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Describe tu experiencia y formación profesional..." rows={4} data-testid="input-bio" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-black/[0.06]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Banknote size={18} className="text-cedu-green" />
            <CardTitle className="font-serif text-base">Datos bancarios</CardTitle>
          </div>
          <p className="text-xs text-cedu-ink-muted">Para la dispersión de tus comisiones</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Banco</Label>
            <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Ej: BBVA, Banorte, Santander" data-testid="input-bank-name" />
          </div>
          <div>
            <Label className="text-xs">CLABE interbancaria (18 dígitos)</Label>
            <Input value={bankClabe} onChange={e => setBankClabe(e.target.value)} maxLength={18} placeholder="012345678901234567" data-testid="input-bank-clabe" />
          </div>
        </CardContent>
      </Card>

      <Button className="bg-cedu-blue hover:bg-cedu-blue/90 w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-profile">
        <Save size={16} className="mr-2" /> Guardar perfil
      </Button>
    </div>
  );
}

function SessionsTab() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: "", description: "", sessionType: "individual",
    scheduledDate: "", startTime: "09:00", endTime: "10:00",
    durationMinutes: 60, priceMxn: 500, maxStudents: 1,
  });

  const { data: mySessions = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/private-sessions"] });
  const { data: config } = useQuery<any>({ queryKey: ["/api/instructor-session-config", "me"] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/private-sessions", formData);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Sesión creada" });
      queryClient.invalidateQueries({ queryKey: ["/api/private-sessions"] });
      setShowCreate(false);
      setFormData({ title: "", description: "", sessionType: "individual", scheduledDate: "", startTime: "09:00", endTime: "10:00", durationMinutes: 60, priceMxn: 500, maxStudents: 1 });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/private-sessions/${id}/cancel`); },
    onSuccess: () => { toast({ title: "Sesión cancelada" }); queryClient.invalidateQueries({ queryKey: ["/api/private-sessions"] }); },
  });

  const endMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/private-sessions/${id}/end`); },
    onSuccess: () => { toast({ title: "Sesión finalizada" }); queryClient.invalidateQueries({ queryKey: ["/api/private-sessions"] }); },
  });

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-cedu-blue", completed: "bg-green-100 text-cedu-green",
    cancelled: "bg-red-100 text-red-600", pending: "bg-yellow-100 text-yellow-700",
  };
  const statusLabels: Record<string, string> = {
    scheduled: "Programada", completed: "Completada", cancelled: "Cancelada",
    in_progress: "En curso", pending: "Pendiente",
  };

  return (
    <div className="space-y-6" data-testid="instructor-sessions-tab">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-cedu-ink">Sesiones Privadas</h2>
          <p className="text-sm text-cedu-ink-muted mt-1">Ofrece clases en vivo por videollamada</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-cedu-blue hover:bg-cedu-blue/90 rounded-xl" data-testid="button-create-session">
          <Plus size={16} className="mr-1" /> Crear Sesión
        </Button>
      </div>

      {showCreate && (
        <Card className="border-black/[0.06]">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-serif text-lg text-cedu-ink">Nueva Sesión</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-cedu-ink-muted text-xs mb-1 block">Título</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Mentoría personalizada" data-testid="input-session-title" />
              </div>
              <div>
                <Label className="text-cedu-ink-muted text-xs mb-1 block">Tipo</Label>
                <Select value={formData.sessionType} onValueChange={v => setFormData({...formData, sessionType: v})}>
                  <SelectTrigger data-testid="select-session-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="grupal">Grupal</SelectItem>
                    <SelectItem value="mentoria">Mentoría</SelectItem>
                    <SelectItem value="taller">Taller práctico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-cedu-ink-muted text-xs mb-1 block">Fecha</Label>
                <Input type="date" value={formData.scheduledDate} onChange={e => setFormData({...formData, scheduledDate: e.target.value})} data-testid="input-session-date" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-cedu-ink-muted text-xs mb-1 block">Hora inicio</Label>
                  <Input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} data-testid="input-session-start" />
                </div>
                <div>
                  <Label className="text-cedu-ink-muted text-xs mb-1 block">Hora fin</Label>
                  <Input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} data-testid="input-session-end" />
                </div>
              </div>
              <div>
                <Label className="text-cedu-ink-muted text-xs mb-1 block">Precio (MXN)</Label>
                <Input type="number" value={formData.priceMxn} onChange={e => setFormData({...formData, priceMxn: +e.target.value})} data-testid="input-session-price" />
              </div>
              <div>
                <Label className="text-cedu-ink-muted text-xs mb-1 block">Máx. estudiantes</Label>
                <Input type="number" min={1} max={50} value={formData.maxStudents} onChange={e => setFormData({...formData, maxStudents: +e.target.value})} data-testid="input-session-max-students" />
              </div>
            </div>
            <div>
              <Label className="text-cedu-ink-muted text-xs mb-1 block">Descripción</Label>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe tu sesión..." rows={3} data-testid="input-session-description" />
            </div>
            <p className="text-xs text-cedu-ink-muted">Comisión: 50% instructor / 50% Ceduverse. Tu pago estimado: <strong>${(formData.priceMxn * 0.5).toLocaleString()} MXN</strong></p>
            <div className="flex gap-2">
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !formData.title || !formData.scheduledDate} className="bg-cedu-blue hover:bg-cedu-blue/90 rounded-xl" data-testid="button-submit-session">
                {createMutation.isPending ? "Creando..." : "Crear Sesión"}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)} data-testid="button-cancel-create">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : mySessions.length === 0 ? (
        <Card className="border-black/[0.06]">
          <CardContent className="p-12 text-center">
            <Video size={48} className="mx-auto text-cedu-ink-muted/40 mb-4" />
            <h3 className="font-serif text-xl text-cedu-ink mb-2">Sin sesiones aún</h3>
            <p className="text-sm text-cedu-ink-muted">Crea tu primera sesión privada para empezar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mySessions.map((s: any) => (
            <Card key={s.id} className="border-black/[0.06]" data-testid={`card-instructor-session-${s.id}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-cedu-ink">{s.title || "Sesión Privada"}</h4>
                    <Badge className={statusColors[s.sessionStatus] || "bg-gray-100"}>
                      {statusLabels[s.sessionStatus] || s.sessionStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-cedu-ink-muted">
                    <span className="flex items-center gap-1"><Clock size={12} /> {s.scheduledDate} {s.startTime}–{s.endTime}</span>
                    <span className="flex items-center gap-1"><DollarSign size={12} /> ${Number(s.priceMxn).toLocaleString()} MXN</span>
                    <span className="flex items-center gap-1"><Users size={12} /> Máx. {s.maxStudents}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {s.sessionStatus === "scheduled" && (
                    <>
                      <Button size="sm" variant="outline" className="text-cedu-blue border-cedu-blue/30 rounded-lg" onClick={() => window.open(s.dailyRoomUrl + "?t=" + s.dailyRoomToken, "_blank")} data-testid={`button-join-own-session-${s.id}`}>
                        <Play size={14} className="mr-1" /> Unirse
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => cancelMutation.mutate(s.id)} data-testid={`button-cancel-own-session-${s.id}`}>
                        Cancelar
                      </Button>
                    </>
                  )}
                  {s.sessionStatus === "in_progress" && (
                    <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => endMutation.mutate(s.id)} data-testid={`button-end-own-session-${s.id}`}>
                      Finalizar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InstructorDashboard() {
  useForceLightMode();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: profile } = useQuery<{ id: string; fullName: string | null }>({ queryKey: ["/api/me/profile"], enabled: !!user });
  const { data: account } = useQuery<{ userRole: string; isInstructor: boolean }>({ queryKey: ["/api/me/account"], enabled: !!user });
  const { data: stats, isLoading: statsLoading } = useQuery<InstructorStats>({ queryKey: ["/api/instructor/stats"], enabled: !!user });
  const { data: courses = [], isLoading: coursesLoading } = useQuery<InstructorCourse[]>({ queryKey: ["/api/instructor/courses"], enabled: !!user });
  const { data: students = [], isLoading: studentsLoading } = useQuery<StudentInfo[]>({ queryKey: ["/api/instructor/students"], enabled: !!user });

  useEffect(() => { if (!authLoading && !user) setLocation("/auth"); }, [authLoading, user]);
  if (!authLoading && !user) return null;

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-cedu-cream flex items-center justify-center">
        <div className="w-12 h-12 bg-cedu-blue rounded-2xl flex items-center justify-center text-white font-serif text-2xl animate-pulse">C</div>
      </div>
    );
  }

  const isInstructor = account?.isInstructor === true || account?.userRole === "socio_instructor" || account?.userRole === "admin" || account?.userRole === "superadmin";
  if (!isInstructor) {
    return (
      <div className="min-h-screen bg-cedu-cream flex items-center justify-center">
        <Card className="border-black/[0.06] max-w-md">
          <CardContent className="py-8 text-center">
            <GraduationCap size={48} className="mx-auto text-cedu-ink-muted/40 mb-4" />
            <h2 className="font-serif text-xl text-cedu-ink mb-2">Acceso restringido</h2>
            <p className="text-sm text-cedu-ink-muted mb-4">Esta sección está disponible solo para instructores.</p>
            <Link href="/dashboard"><Button className="bg-cedu-blue hover:bg-cedu-blue-dark" data-testid="button-go-dashboard">Ir al Dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navItems: NavItem[] = [
    { id: "overview", label: "Resumen", icon: LayoutDashboard },
    { id: "courses", label: "Mis Cursos STPS", icon: BookOpen },
    { id: "my-created", label: "Cursos Creados", icon: PenTool },
    { id: "create", label: "Crear Curso", icon: Plus },
    { id: "students", label: "Alumnos", icon: Users },
    { id: "commissions", label: "Comisiones", icon: DollarSign },
    { id: "certificates", label: "Certificados", icon: Award },
    { id: "sessions", label: "Sesiones Privadas", icon: Video },
    { id: "gemelo", label: "Gemelo Digital", icon: Bot },
    { id: "analytics", label: "Estadísticas", icon: BarChart3 },
    { id: "profile", label: "Perfil", icon: UserCircle },
    { id: "aula-virtual-link", label: "Aula Virtual", icon: GraduationCap, href: "/aula-virtual" },
    { id: "dashboard-link", label: "Mi Dashboard", icon: School, href: "/dashboard" },
  ];

  const tabLabels: Record<string, string> = {};
  navItems.forEach(n => { tabLabels[n.id] = n.label; });

  return (
    <div className="min-h-screen bg-cedu-cream flex" data-testid="page-instructor-dashboard">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-black/[0.06] flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`} data-testid="sidebar-instructor">
        <div className="p-6 border-b border-black/[0.06]">
          <Link href="/" className="flex items-center gap-2.5 no-underline" data-testid="link-instructor-logo">
            <div className="w-8 h-8 bg-cedu-blue rounded-[10px] flex items-center justify-center text-white font-serif text-lg">C</div>
            <div className="font-serif text-xl text-cedu-ink tracking-tight" translate="no">Cedu<em className="text-cedu-blue not-italic italic">verse</em></div>
          </Link>
          <div className="mt-2">
            <Badge className="bg-cedu-orange/10 text-cedu-orange border-0 text-[10px] font-semibold">
              <GraduationCap size={12} className="mr-1" /> Instructor
            </Badge>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (isNavLink(item)) {
              return (
                <Link key={item.id} href={item.href}>
                  <span className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer text-cedu-ink-muted hover:bg-black/[0.03] hover:text-cedu-ink" data-testid={`button-nav-instructor-${item.id}`}>
                    <Icon size={20} />{item.label}
                  </span>
                </Link>
              );
            }
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedCourseId(null); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === item.id ? "bg-cedu-blue-light text-cedu-blue" : "text-cedu-ink-muted hover:bg-black/[0.03] hover:text-cedu-ink"}`}
                data-testid={`button-nav-instructor-${item.id}`}
              >
                <Icon size={20} />{item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-black/[0.06]">
          <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-cedu-ink-muted hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer" data-testid="button-instructor-logout">
            <LogOut size={20} />Cerrar Sesión
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 md:ml-64 min-h-screen overflow-x-hidden">
        <header className="sticky top-0 z-20 bg-cedu-cream/85 backdrop-blur-xl border-b border-black/[0.06] px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 text-cedu-ink" onClick={() => setSidebarOpen(!sidebarOpen)} data-testid="button-toggle-instructor-sidebar">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="font-serif text-lg text-cedu-ink" data-testid="text-instructor-page-title">
              {tabLabels[activeTab] || "Panel Instructor"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cedu-violet rounded-full flex items-center justify-center text-white text-sm font-bold">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "I"}
            </div>
            <span className="text-sm font-semibold text-cedu-ink hidden sm:block" data-testid="text-instructor-email">{user?.email}</span>
          </div>
        </header>

        <main className="p-4 sm:p-6 md:p-8 max-w-[960px] overflow-x-hidden">
          {activeTab === "overview" && (
            <OverviewTab stats={stats} courses={courses} students={students} coursesLoading={coursesLoading} studentsLoading={studentsLoading} setActiveTab={setActiveTab} profileName={profile?.fullName || "Instructor"} />
          )}
          {activeTab === "courses" && !selectedCourseId && <CoursesTab courses={courses} onSelectCourse={(id) => setSelectedCourseId(id)} />}
          {activeTab === "courses" && selectedCourseId && <CourseDetailTab courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />}
          {activeTab === "my-created" && <MyCreatedCoursesTab setActiveTab={setActiveTab} />}
          {activeTab === "create" && <CreateCourseTab onComplete={() => setActiveTab("my-created")} />}
          {activeTab === "students" && <StudentsTab students={students} isLoading={studentsLoading} />}
          {activeTab === "commissions" && <CommissionsTab />}
          {activeTab === "certificates" && <CertificatesTab />}
          {activeTab === "sessions" && <SessionsTab />}
          {activeTab === "gemelo" && <GemeloDigitalTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "profile" && <ProfileTab />}
        </main>
      </div>
    </div>
  );
}
