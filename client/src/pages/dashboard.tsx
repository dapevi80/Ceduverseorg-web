import { useAuth } from "@/hooks/use-auth";
import { useViewAs } from "@/hooks/use-view-as";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { extractServerMessage } from "@/lib/server-message";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useForceLightMode } from "@/components/ThemeProvider";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectibleBadge, LockedBadge, EmptyBadgesState } from "@/components/achievements/collectible-badge";
import { CreateWalletModal } from "@/components/wallet/create-wallet-modal";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import TopicDiscovery from "@/components/TopicDiscovery";
import { RoleBadge, getRoleLabel } from "@/components/RoleBadge";
import { ContributionsTab } from "@/pages/contributions-tab";
import { WalletTab } from "@/pages/wallet-tab";
import { CertificatesTab } from "@/pages/certificates-tab";
import { AfiliacionMasivaTab, SamMensualTab } from "@/pages/empresa-excel-tab";
import { TeamRiesgosTab } from "@/pages/team-riesgos-tab";
import MembershipCertificate from "@/components/MembershipCertificate";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  UserCircle,
  LogOut,
  GraduationCap,
  Target,
  Sparkles,
  Menu,
  X,
  School,
  ArrowRight,
  Wallet,
  Copy,
  CheckCircle2,
  Library,
  Search,
  Loader2,
  Users,
  Building2,
  Zap,
  Play,
  Shield,
  Handshake,
  UserPlus,
  FileCheck,
  BadgeCheck,
  Award,
  Compass,
  DollarSign,
  Clock,
  MessageCircle,
  Brain,
  HeartPulse,
  CreditCard,
  ExternalLink,
  Link2,
  QrCode,
  Pencil,
  FileSpreadsheet,
  CalendarDays,
  Download,
  ShieldAlert,
} from "lucide-react";
import { Progress as ProgressBar } from "@/components/ui/progress";

type Profile = {
  id: string;
  fullName: string | null;
  country: string | null;
  city: string | null;
  phoneNumber: string | null;
  walletAddress: string | null;
  interest: any;
  genre: string | null;
};

type Account = {
  id: string;
  accountType: string;
  accountSetup: number;
  referralCode: string | null;
  userRole: string;
  isInstructor: boolean;
};

type CourseEnrollment = {
  id: number;
  userId: string;
  courseId: string;
  courseSlug: string;
  completed: number;
};

type UserAchievement = {
  id: string;
  userId: string;
  achievementId: string;
  status: string;
  isActive: boolean;
  certType: string | null;
  contractAddress: string | null;
  tokenId: string | null;
  pdfUrl: string | null;
  createdAt: string;
};

type CourseInfo = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  instructor: string | null;
  instructorId: string | null;
  durationHrs: number | null;
  durationVirtualHrs: number | null;
  areaTematica: string | null;
  nivel: string | null;
  dc3Disponible: boolean | null;
};

type AchievementInfo = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  value: number;
  category: string | null;
  icon: string | null;
};

type AcademyStats = {
  courses: { total: number; published: number };
};

type TeamInfo = {
  team: {
    id: string;
    name: string;
    description: string | null;
    plan: string | null;
    status: string;
  };
  role: string;
};


function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

type SidebarItem = { id: string; label: string; icon: typeof LayoutDashboard; href?: string; section?: string };

const SIDEBAR_MAP: Record<string, SidebarItem> = {
  resumen: { id: "overview", label: "Resumen", icon: LayoutDashboard },
  mis_cursos: { id: "courses", label: "Mis Cursos", icon: BookOpen },
  aula_virtual: { id: "aula-virtual", label: "Conferencias Ceduverse", icon: School, href: "/conferencias" },
  tutor_ia: { id: "tutor-ia-link", label: "Tutor IA", icon: Brain, href: "/tutor-ia" },
  academy: { id: "academy-link", label: "Academy", icon: Library, href: "/academy" },
  logros: { id: "achievements", label: "Logros", icon: Trophy },
  wallet: { id: "wallet", label: "Wallet", icon: Wallet },
  certificados: { id: "certificates", label: "Certificados", icon: Award },
  perfil: { id: "profile", label: "Perfil", icon: UserCircle },
  crear_curso: { id: "crear-curso-link", label: "Crear Curso", icon: BookOpen, href: "/instructor" },
  mis_alumnos: { id: "mis-alumnos-link", label: "Mis Alumnos", icon: Users, href: "/instructor" },
  comisiones_instructor: { id: "comisiones-instructor-link", label: "Comisiones", icon: DollarSign, href: "/instructor" },
  resumen_socio: { id: "partner-link", label: "Panel Socio", icon: Handshake, href: "/partner" },
  mis_referidos: { id: "mis-referidos-link", label: "Mis Referidos", icon: UserPlus, href: "/partner" },
  organizaciones: { id: "org-link", label: "Organizaciones", icon: Building2, href: "/partner" },
  comisiones: { id: "comisiones-link", label: "Comisiones", icon: DollarSign, href: "/partner" },
  codigo_referido: { id: "codigo-link", label: "Código Referido", icon: Link2, href: "/partner" },
  qr_stickers: { id: "qr-link", label: "QR y Stickers", icon: QrCode, href: "/partner" },
  material_ventas: { id: "material-link", label: "Material de Ventas", icon: FileCheck, href: "/partner" },
  resumen_director: { id: "director-link", label: "Panel Director", icon: LayoutDashboard, href: "/partner" },
  mi_equipo: { id: "mi-equipo-link", label: "Mi Equipo", icon: Users, href: "/partner" },
  territorio: { id: "territorio-link", label: "Mi Territorio", icon: Compass, href: "/partner" },
  ranking: { id: "ranking-link", label: "Ranking", icon: Trophy, href: "/partner" },
  resumen_empresa: { id: "org", label: "Mi Organización", icon: Building2 },
  colaboradores: { id: "colaboradores-link", label: "Colaboradores", icon: Users },
  aportaciones: { id: "contributions", label: "Aportaciones", icon: DollarSign },
  afiliacion_masiva: { id: "afiliacion-masiva", label: "Afiliación Masiva", icon: FileSpreadsheet },
  sam_mensual: { id: "sam-mensual", label: "SAM Mensual", icon: CalendarDays },
  certificados_equipo: { id: "certs-equipo-link", label: "Certificados Equipo", icon: Award },
  facturacion: { id: "facturacion-link", label: "Facturación", icon: CreditCard, href: "/facturacion" },
  perfil_empresa: { id: "perfil-empresa", label: "Perfil Empresa", icon: Building2 },
  dashboard_admin: { id: "admin-link", label: "Panel Admin", icon: Shield, href: "/admin", section: "Administración" },
  usuarios: { id: "usuarios-link", label: "Usuarios", icon: Users, href: "/admin" },
  empresas: { id: "empresas-link", label: "Empresas", icon: Building2, href: "/admin" },
  roles: { id: "roles-link", label: "Roles", icon: Shield, href: "/admin" },
  cursos_admin: { id: "cursos-admin-link", label: "Cursos (Admin)", icon: BookOpen, href: "/admin" },
  certificados_admin: { id: "certs-admin-link", label: "Certificados (Admin)", icon: Award, href: "/admin" },
  pagos: { id: "pagos-link", label: "Pagos", icon: DollarSign, href: "/admin" },
  dispersiones: { id: "dispersiones-link", label: "Dispersiones", icon: DollarSign, href: "/admin" },
  comisiones_crm: { id: "crm-link", label: "CRM Comisiones", icon: DollarSign, href: "/admin" },
  prospectos_denue: { id: "denue-link", label: "Prospectos DENUE", icon: Compass, href: "/admin" },
  documentos_legales: { id: "docs-link", label: "Documentos Legales", icon: FileCheck, href: "/admin" },
  configuracion: { id: "config-link", label: "Configuración", icon: Shield, href: "/admin" },
  logs: { id: "logs-link", label: "Logs", icon: Clock, href: "/admin" },
  soporte: { id: "soporte-link", label: "Soporte", icon: MessageCircle, href: "/admin" },
};

function buildNavItemsFromConfig(sidebarConfig: any | null, fallbackItems: SidebarItem[]): SidebarItem[] {
  if (!sidebarConfig) return fallbackItems;
  const keys: string[] = Array.isArray(sidebarConfig) ? sidebarConfig : (sidebarConfig.items || []);
  if (keys.length === 0) return fallbackItems;
  const items: SidebarItem[] = [];
  for (const key of keys) {
    const item = SIDEBAR_MAP[key];
    if (item) items.push(item);
  }
  return items.length > 0 ? items : fallbackItems;
}

function getRoleGreeting(role: string): string {
  switch (role) {
    case "admin": return "Panel de Administración";
    case "superadmin": return "Panel de Control Total";
    case "socio_comercial":
    case "partner": return "Panel Comercial";
    case "director": return "Panel de Dirección";
    case "socio_instructor":
    case "instructor": return "Panel de Instructor";
    case "empresa":
    case "empresa_rh": return "Panel Empresarial";
    default: return "Mi Espacio de Aprendizaje";
  }
}

function getUserLevel(completedCourses: number): { label: string; color: string; bg: string } {
  if (completedCourses >= 10) return { label: "Avanzado", color: "text-[#7c3aed]", bg: "bg-[#7c3aed]/10" };
  if (completedCourses >= 3) return { label: "Intermedio", color: "text-[#1b5adf]", bg: "bg-[#1b5adf]/10" };
  return { label: "Principiante", color: "text-[#00b87a]", bg: "bg-[#00b87a]/10" };
}

function getOnboardingSlugsForUser(role: string, isTeamAdmin: boolean): string[] {
  if (role === "admin" || role === "superadmin") {
    return ["bienvenido-ceduverse", "modelo-cooperativo", "guia-empresas", "guia-socios", "programa-elite"];
  }
  if (role === "socio_comercial" || role === "partner" || role === "director") {
    return ["bienvenido-ceduverse", "modelo-cooperativo", "guia-socios", "programa-elite"];
  }
  if (isTeamAdmin) {
    return ["bienvenido-ceduverse", "modelo-cooperativo", "guia-empresas"];
  }
  return ["bienvenido-ceduverse", "modelo-cooperativo"];
}

function OverviewTab({ profile, account, enrollments, allCourses, userAchievements, allAchievements, setActiveTab, userTeams }: {
  profile: Profile | null;
  account: Account | null;
  enrollments: CourseEnrollment[];
  allCourses: CourseInfo[];
  userAchievements: UserAchievement[];
  allAchievements: AchievementInfo[];
  setActiveTab: (tab: string) => void;
  userTeams: TeamInfo[];
}) {
  const hasEnrollments = enrollments.length > 0;
  const { data: savedInterests } = useQuery<{ id: string; recommendations: unknown } | null>({
    queryKey: ["/api/learning/interests"],
  });
  const hasSavedRecs = !!savedInterests?.recommendations;
  const [discoveryVisible, setDiscoveryVisible] = useState(!hasEnrollments);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (hasSavedRecs && !discoveryVisible) {
      setDiscoveryVisible(true);
    }
  }, [hasSavedRecs]);

  const { data: academyStats } = useQuery<AcademyStats>({
    queryKey: ["/api/academy/stats"],
  });

  const { data: membership } = useQuery<{
    id: string;
    membershipNumber: string;
    fullName: string;
    status: string;
    membershipType: string;
    acceptedAt: string;
    certificateIssuedAt: string | null;
  } | null>({
    queryKey: ["/api/membership/me"],
  });

  const { data: studioEnrollmentsOverview = [] } = useQuery<StudioEnrollmentInfo[]>({
    queryKey: ["/api/studio/enrollments"],
  });
  // El catalogo del Studio: sin el, la tarjeta mostraria el slug del curso
  // ("nom-035-stps-medina") en vez de su titulo.
  const { data: studioCatalogData } = useQuery<{ courses: StudioCourseInfo[] }>({
    queryKey: ["/api/studio/courses"],
  });
  const studioTitulo = new Map(
    (studioCatalogData?.courses || []).map((c) => [c.slug, c] as const),
  );

  const studioCompletedCount = studioEnrollmentsOverview.filter(e => e.progressPercent >= 100).length;
  const completedCourses = enrollments.filter(e => e.completed === 100).length + studioCompletedCount;
  const stpsModulesCompleted = enrollments.reduce((sum, e) => sum + Math.round(e.completed / 10), 0);
  const studioModulesCompleted = studioEnrollmentsOverview.reduce((sum, e) => sum + Math.round((e.progressPercent || 0) / 10), 0);
  const totalModulesCompleted = stpsModulesCompleted + studioModulesCompleted;
  const estimatedHours = Math.round((stpsModulesCompleted * 15 + studioEnrollmentsOverview.reduce((sum, e) => sum + Math.round((e.progressPercent || 0) / 10) * 20, 0)) / 60);
  const certCount = userAchievements.filter(ua => ua.certType === "dc3" || ua.certType === "sep").length;

  const achievementLookup = new Map(allAchievements.map(a => [a.id, a]));
  const courseLookup = new Map(allCourses.map(c => [c.id, c]));
  // "Continuar aprendiendo" debe apuntar al primer curso EN CURSO, no a uno ya
  // terminado; si todos están completos, caemos al primero como referencia.
  const lastCourse = enrollments.find(e => e.completed < 100) ?? (enrollments.length > 0 ? enrollments[0] : null);
  const lastCourseInfo = lastCourse ? courseLookup.get(lastCourse.courseId) : null;

  // "Continuar aprendiendo" tambien mira el Tutor IA.
  //
  // Este dashboard YA conocia los cursos del Studio (los usa para contar cursos
  // completados, modulos y horas), pero esta tarjeta solo miraba las
  // inscripciones del Aula. Quien solo lleva cursos del Tutor IA veia "Aún no
  // has empezado un curso" con varios en curso. Se toma el mas reciente en
  // curso; el Aula manda solo si tambien tiene uno en curso.
  const studioEnCurso = [...studioEnrollmentsOverview]
    .filter((e) => (e.progressPercent ?? 0) < 100)
    .sort((a, b) => {
      const ta = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : new Date(a.enrolledAt).getTime();
      const tb = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : new Date(b.enrolledAt).getTime();
      return tb - ta;
    })[0] || null;

  const recentAchievements = userAchievements
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const level = getUserLevel(completedCourses);
  const totalActive = enrollments.length + studioEnrollmentsOverview.length;

  return (
    <div className="space-y-6">
      <Card className="border-black/[0.06] overflow-hidden" data-testid="card-welcome">
        <div className="h-1 bg-gradient-to-r from-[#1b5adf] via-[#7c3aed] to-[#f28023]" />
        <CardContent className="pt-6">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1b5adf] rounded-2xl flex items-center justify-center text-white font-serif text-xl sm:text-2xl flex-shrink-0">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "C"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-lg sm:text-xl text-cedu-ink truncate" data-testid="text-welcome-name">
                {getGreeting()}, {profile?.fullName?.split(" ")[0] || "Estudiante"}
              </h2>
              <p className="text-xs sm:text-sm text-cedu-ink-muted" data-testid="text-role-greeting">
                {getRoleGreeting(account?.userRole || "socio_estudiante")} · {totalActive} curso{totalActive !== 1 ? "s" : ""} activo{totalActive !== 1 ? "s" : ""}
              </p>
            </div>
            <Badge className={`${level.bg} ${level.color} border-0 text-xs font-semibold px-3 py-1 flex-shrink-0`} data-testid="badge-user-level">
              {level.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {(() => { const isTeamAdmin = userTeams.some(t => t.role === "admin"); const onboardingSlugs = getOnboardingSlugsForUser(account?.userRole || "socio_estudiante", isTeamAdmin); const completedOnboarding = studioEnrollmentsOverview.filter(e => onboardingSlugs.includes(e.courseIdentifier || "") && e.progressPercent >= 100).length; return completedOnboarding < onboardingSlugs.length; })() && (
        <Link href="/tutor-ia" className="no-underline">
          <div
            className="rounded-2xl border border-cedu-blue/20 bg-gradient-to-r from-cedu-blue/5 via-cedu-violet/5 to-cedu-blue/5 p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
            data-testid="banner-onboarding"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-cedu-blue to-cedu-violet rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-cedu-ink">Completa los cursos de onboarding para aprovechar Ceduverse al máximo</p>
              <p className="text-xs text-cedu-ink-muted mt-0.5">{(() => { const isTeamAdmin = userTeams.some(t => t.role === "admin"); return getOnboardingSlugsForUser(account?.userRole || "socio_estudiante", isTeamAdmin).length; })()} cursos gratuitos sobre la plataforma y marco legal</p>
            </div>
            <ArrowRight size={18} className="text-cedu-blue flex-shrink-0" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-black/[0.06]" data-testid="card-stat-courses">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#1b5adf]/10 rounded-lg flex items-center justify-center">
                <BookOpen size={18} className="text-[#1b5adf]" />
              </div>
              <div>
                <p className="text-xl font-bold text-cedu-ink leading-none font-serif">{totalActive}</p>
                <p className="text-[11px] text-cedu-ink-muted mt-0.5">Cursos activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/[0.06]" data-testid="card-stat-modules">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#00b87a]/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={18} className="text-[#00b87a]" />
              </div>
              <div>
                <p className="text-xl font-bold text-cedu-ink leading-none font-serif">{totalModulesCompleted}</p>
                <p className="text-[11px] text-cedu-ink-muted mt-0.5">Módulos completados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/[0.06]" data-testid="card-stat-certificates">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#7c3aed]/10 rounded-lg flex items-center justify-center">
                <Award size={18} className="text-[#7c3aed]" />
              </div>
              <div>
                <p className="text-xl font-bold text-cedu-ink leading-none font-serif">{userAchievements.length}</p>
                <p className="text-[11px] text-cedu-ink-muted mt-0.5">Certificados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/[0.06]" data-testid="card-stat-hours">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#f28023]/10 rounded-lg flex items-center justify-center">
                <Clock size={18} className="text-[#f28023]" />
              </div>
              <div>
                <p className="text-xl font-bold text-cedu-ink leading-none font-serif">{estimatedHours}h</p>
                <p className="text-[11px] text-cedu-ink-muted mt-0.5">Horas de estudio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {membership && (
        <MembershipCertificate
          membershipNumber={membership.membershipNumber}
          fullName={membership.fullName}
          status={membership.status}
          membershipType={membership.membershipType}
          acceptedAt={membership.acceptedAt}
          certificateIssuedAt={membership.certificateIssuedAt}
          compact
        />
      )}

      {account?.referralCode && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-cedu-violet/[0.06] rounded-xl px-4 sm:px-5 py-3 border border-cedu-violet/10" data-testid="banner-referral-code">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={16} className="text-cedu-violet flex-shrink-0" />
            <p className="text-xs sm:text-sm text-cedu-ink truncate">
              Tu folio de socio / código de referido: <span className="font-bold font-mono text-cedu-violet">{account.referralCode}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-cedu-violet hover:bg-cedu-violet/10 flex-shrink-0"
            onClick={() => {
              navigator.clipboard.writeText(account.referralCode!);
            }}
            data-testid="button-copy-referral"
          >
            <Copy size={14} className="mr-1" />
            Copiar
          </Button>
        </div>
      )}

      {!lastCourseInfo && studioEnCurso ? (
        <Link href={`/tutor-ia/${studioEnCurso.courseIdentifier}`} className="no-underline">
          <div className="bg-white rounded-2xl p-4 border border-black/[0.06] hover:border-cedu-blue/30 transition-colors" data-testid="card-continue-studio">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cedu-violet-light flex items-center justify-center shrink-0">
                <Brain size={18} className="text-cedu-violet" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-cedu-ink line-clamp-2" data-testid="text-continue-studio-course">
                  {studioTitulo.get(studioEnCurso.courseIdentifier)?.title || studioEnCurso.courseIdentifier}
                </p>
                <p className="text-xs text-cedu-ink-muted mt-0.5">Tutor IA</p>
                <div className="mt-2">
                  <Progress value={studioEnCurso.progressPercent || 0} className="h-2" />
                </div>
                <p className="text-[11px] text-cedu-ink-muted mt-1">{studioEnCurso.progressPercent || 0}% completado</p>
              </div>
            </div>
          </div>
        </Link>
      ) : lastCourseInfo ? (
        <Card className="border-black/[0.06]" data-testid="card-continue-learning">
          <CardContent className="pt-5 pb-5">
            <h3 className="font-serif text-base text-cedu-ink mb-3">Continuar aprendiendo</h3>
            <Link href={`/conferencias/${lastCourse!.courseSlug}`} className="no-underline">
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-[#1b5adf]/[0.03] hover:bg-[#1b5adf]/[0.06] transition-colors cursor-pointer">
                <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-[#1b5adf] to-[#7c3aed] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Play size={20} className="text-white sm:hidden" />
                  <Play size={24} className="text-white hidden sm:block" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-cedu-ink line-clamp-1" data-testid="text-continue-course">{lastCourseInfo.title}</p>
                  <p className="text-xs text-cedu-ink-muted mt-0.5 hidden sm:block">{lastCourseInfo.instructor || "Conferencias Ceduverse"}</p>
                  <div className="mt-2">
                    <Progress value={lastCourse!.completed} className="h-2" />
                  </div>
                  <p className="text-[11px] text-cedu-ink-muted mt-1">{lastCourse!.completed}% completado</p>
                </div>
                <Button size="sm" className="bg-[#1b5adf] hover:bg-blue-700 text-white flex-shrink-0" data-testid="button-continue-course">
                  <span className="hidden sm:inline">Continuar</span> <ArrowRight size={14} className="sm:ml-1" />
                </Button>
              </div>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-black/[0.06]" data-testid="card-no-courses">
          <CardContent className="py-8 text-center">
            <GraduationCap size={36} className="mx-auto text-cedu-ink-muted/40 mb-3" />
            <p className="text-sm font-semibold text-cedu-ink mb-1">Aún no has empezado un curso</p>
            <p className="text-xs text-cedu-ink-muted mb-4">¡Explora el catálogo y comienza tu aprendizaje!</p>
            <Link href="/conferencias">
              <Button className="bg-[#1b5adf] hover:bg-blue-700 text-white" data-testid="button-explore-courses">
                Ver cursos <ArrowRight size={14} className="ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/conferencias" className="no-underline">
          <Card className="border-black/[0.06] overflow-hidden hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer h-full" data-testid="card-catalog-aula">
            <div className="h-1.5 bg-gradient-to-r from-[#1b5adf] to-[#7c3aed]" />
            <CardContent className="pt-5 pb-5 text-center">
              <div className="w-12 h-12 bg-[#1b5adf]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BookOpen size={24} className="text-[#1b5adf]" />
              </div>
              <h3 className="font-serif text-base text-cedu-ink">Conferencias Ceduverse</h3>
              <p className="text-xs text-cedu-ink-muted mt-1">29 cursos STPS</p>
              <p className="text-[10px] text-cedu-ink-muted mt-0.5">Instructores reales + DC-3</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/tutor-ia" className="no-underline">
          <Card className="border-black/[0.06] overflow-hidden hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer h-full" data-testid="card-catalog-tutor">
            <div className="h-1.5 bg-gradient-to-r from-[#7c3aed] to-[#f28023]" />
            <CardContent className="pt-5 pb-5 text-center">
              <div className="w-12 h-12 bg-[#7c3aed]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Brain size={24} className="text-[#7c3aed]" />
              </div>
              <h3 className="font-serif text-base text-cedu-ink">Tutor IA</h3>
              <p className="text-xs text-cedu-ink-muted mt-1">49 cursos con IA</p>
              <p className="text-[10px] text-cedu-ink-muted mt-0.5">Personalizado a tu puesto</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/academy" className="no-underline">
          <Card className="border-black/[0.06] overflow-hidden hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer h-full" data-testid="card-catalog-academy">
            <div className="h-1.5 bg-gradient-to-r from-[#f28023] to-amber-400" />
            <CardContent className="pt-5 pb-5 text-center">
              <div className="w-12 h-12 bg-[#f28023]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Library size={24} className="text-[#f28023]" />
              </div>
              <h3 className="font-serif text-base text-cedu-ink">Academy</h3>
              <p className="text-xs text-cedu-ink-muted mt-1">{academyStats?.courses?.total || 988} cursos</p>
              <p className="text-[10px] text-cedu-ink-muted mt-0.5">Catálogo completo</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {recentAchievements.length > 0 && (
        <Card className="border-black/[0.06]" data-testid="card-recent-achievements">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base text-cedu-ink">Logros recientes</h3>
              <button onClick={() => setActiveTab("achievements")} className="text-xs text-[#1b5adf] font-semibold hover:underline" data-testid="button-see-all-achievements">
                Ver todos
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {recentAchievements.map((ua) => {
                const info = achievementLookup.get(ua.achievementId);
                if (!info) return null;
                return (
                  <div key={ua.id} className="text-center p-3 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border border-amber-100" data-testid={`recent-badge-${ua.id}`}>
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-400 flex items-center justify-center shadow-inner">
                      <Trophy size={20} className="text-amber-700" />
                    </div>
                    <p className="text-[11px] font-semibold text-cedu-ink line-clamp-2">{info.name}</p>
                    <Badge className={`mt-1 text-[9px] ${
                      ua.certType === "dc3" ? "bg-amber-100 text-amber-700" :
                      ua.certType === "sep" ? "bg-blue-100 text-blue-700" :
                      "bg-emerald-100 text-emerald-700"
                    } border-0`}>
                      {ua.certType === "dc3" ? "DC-3" : ua.certType === "sep" ? "SEP" : "Diploma"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {discoveryVisible && (
        <Card className="border-black/[0.06] overflow-hidden" data-testid="card-topic-discovery">
          <div className="h-1.5 bg-gradient-to-r from-[#1b5adf] via-[#7c3aed] to-[#f28023]" />
          <CardContent className="pt-6 pb-6">
            <TopicDiscovery
              onDismiss={() => setDiscoveryVisible(false)}
              onCourseClick={(type, id) => {
                if (type === "academy") {
                  setLocation(`/academy/${id}`);
                } else if (type === "tutor-ia") {
                  setLocation(`/tutor-ia/${id}`);
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {!discoveryVisible && (
        <button
          onClick={() => setDiscoveryVisible(true)}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-[#1b5adf]/30 bg-[#1b5adf]/[0.03] hover:bg-[#1b5adf]/[0.06] transition-colors cursor-pointer"
          data-testid="button-open-discovery"
        >
          <div className="w-9 h-9 bg-[#1b5adf]/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Compass size={18} className="text-[#1b5adf]" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-cedu-ink">¿Qué quieres aprender hoy?</p>
            <p className="text-[11px] text-cedu-ink-muted">Descubre cursos personalizados para ti</p>
          </div>
          <ArrowRight size={16} className="text-[#1b5adf]" />
        </button>
      )}

      <Card className="border-[#1b5adf]/10 bg-[#1b5adf]/[0.03]" data-testid="card-support-banner">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1b5adf]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageCircle size={20} className="text-[#1b5adf]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-cedu-ink">¿Necesitas ayuda?</p>
              <p className="text-xs text-cedu-ink-muted">Habla con tu gestor académico</p>
            </div>
            <Link href="/mensajes">
              <Button variant="outline" size="sm" className="border-[#1b5adf]/20 text-[#1b5adf] hover:bg-[#1b5adf]/5" data-testid="button-open-chat">
                Abrir chat <ArrowRight size={12} className="ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type StudioEnrollmentInfo = {
  id: string;
  source: string;
  courseIdentifier: string;
  status: string;
  progressPercent: number;
  enrolledAt: string;
  lastAccessedAt: string | null;
};

type StudioCourseInfo = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  icon: string | null;
  color: string | null;
  tags: string[];
  dc3Available: boolean;
  durationMinutes: number | null;
  level: string | null;
};

function CoursesTab({ enrollments, allCourses }: {
  enrollments: CourseEnrollment[];
  allCourses: CourseInfo[];
}) {
  // Los filtros se recuerdan en sessionStorage para que "Regresar a Mis Cursos"
  // (desde un curso) reabra la vista con lo que el socio estaba buscando.
  const readSaved = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    if (typeof window === "undefined") return fallback;
    const v = sessionStorage.getItem(key) as T | null;
    return v && (allowed as readonly string[]).includes(v) ? v : fallback;
  };
  const [statusFilter, setStatusFilter] = useState<"all" | "in-progress" | "completed">(
    () => readSaved("cedu:cursos:estado", ["all", "in-progress", "completed"] as const, "all"),
  );
  const [sourceFilter, setSourceFilter] = useState<"all" | "stps" | "tutor-ia">(
    () => readSaved("cedu:cursos:tipo", ["all", "stps", "tutor-ia"] as const, "all"),
  );
  useEffect(() => {
    try {
      sessionStorage.setItem("cedu:cursos:estado", statusFilter);
      sessionStorage.setItem("cedu:cursos:tipo", sourceFilter);
    } catch { /* sessionStorage no disponible: los filtros simplemente no se recuerdan */ }
  }, [statusFilter, sourceFilter]);
  const [, setLocation] = useLocation();
  const courseLookup = new Map(allCourses.map(c => [c.id, c]));

  const { data: studioEnrollments = [] } = useQuery<StudioEnrollmentInfo[]>({
    queryKey: ["/api/studio/enrollments"],
  });

  const { data: studioCoursesData } = useQuery<{ courses: StudioCourseInfo[]; total: number }>({
    queryKey: ["/api/studio/courses"],
  });
  const studioCoursesList = studioCoursesData?.courses || [];

  const studioCourseLookup = new Map(studioCoursesList.map(c => [c.slug, c]));

  type UnifiedCourse = {
    id: string;
    title: string;
    subtitle: string;
    progress: number;
    type: "stps" | "tutor-ia";
    href: string;
    icon: string;
    color: string;
    bgColor: string;
    badge?: string;
    badgeColor?: string;
    duration?: string;
  };

  const unifiedCourses: UnifiedCourse[] = [
    ...enrollments.map((e): UnifiedCourse => {
      const course = courseLookup.get(e.courseId);
      return {
        id: `stps-${e.id}`,
        title: course?.title || e.courseSlug,
        subtitle: course?.instructor || "Conferencias Ceduverse",
        progress: e.completed,
        type: "stps",
        href: `/conferencias/${e.courseSlug}`,
        icon: "🏛️",
        color: "text-cedu-blue",
        bgColor: "bg-cedu-blue-light",
        badge: course?.dc3Disponible ? "DC-3" : undefined,
        badgeColor: "bg-green-50 text-green-700 border-green-200",
        duration: course?.durationHrs ? `${course.durationVirtualHrs || course.durationHrs}h` : undefined,
      };
    }),
    ...studioEnrollments.map((e): UnifiedCourse => {
      const course = studioCourseLookup.get(e.courseIdentifier);
      return {
        id: `tutor-${e.id}`,
        title: course?.title || e.courseIdentifier,
        subtitle: course?.category || "Tutor IA",
        progress: e.progressPercent || 0,
        type: "tutor-ia",
        href: `/tutor-ia/${e.courseIdentifier}`,
        icon: course?.icon || "🧠",
        color: "text-cedu-violet",
        bgColor: "bg-cedu-violet-light",
        badge: "IA",
        badgeColor: "bg-violet-50 text-cedu-violet border-violet-200",
        duration: course?.durationMinutes ? `${Math.round(course.durationMinutes / 60)}h` : undefined,
      };
    }),
  ];

  const stpsCount = unifiedCourses.filter(c => c.type === "stps").length;
  const tutorIaCount = unifiedCourses.filter(c => c.type === "tutor-ia").length;

  // Orden: primero los que estás cursando, luego los que no has empezado, y al
  // final los completados — para que se distinga de un vistazo qué sigue pendiente.
  const statusRank = (p: number) => (p >= 100 ? 2 : p > 0 ? 0 : 1);
  const filteredCourses = unifiedCourses.filter(c => {
    if (sourceFilter !== "all" && c.type !== sourceFilter) return false;
    if (statusFilter === "in-progress") return c.progress > 0 && c.progress < 100;
    if (statusFilter === "completed") return c.progress === 100;
    return true;
  }).sort((a, b) => statusRank(a.progress) - statusRank(b.progress));

  const totalCourses = unifiedCourses.length;
  const completedCount = unifiedCourses.filter(c => c.progress === 100).length;
  const inProgressCount = unifiedCourses.filter(c => c.progress > 0 && c.progress < 100).length;

  if (totalCourses === 0) {
    return (
      <div className="space-y-6" data-testid="courses-empty-state">
        <Card className="border-black/[0.06] overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-cedu-blue via-cedu-violet to-cedu-orange" />
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 bg-cedu-blue-light rounded-2xl flex items-center justify-center mx-auto mb-5">
              <GraduationCap size={36} className="text-cedu-blue" />
            </div>
            <h3 className="font-serif text-xl text-cedu-ink mb-2">Tu camino de aprendizaje comienza aquí</h3>
            <p className="text-sm text-cedu-ink-muted max-w-md mx-auto mb-8">
              Elige entre cursos STPS con certificación oficial o cursos personalizados con IA.
              Cada paso te acerca a tus metas profesionales.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
              <Link href="/conferencias" className="no-underline">
                <div className="p-4 rounded-xl border border-black/[0.06] hover:border-cedu-blue/20 hover:shadow-sm transition-all text-center group" data-testid="link-empty-aula">
                  <div className="w-10 h-10 bg-cedu-blue-light rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <School size={20} className="text-cedu-blue" />
                  </div>
                  <p className="text-xs font-semibold text-cedu-ink">Conferencias Ceduverse</p>
                  <p className="text-[10px] text-cedu-ink-muted mt-0.5">29 cursos STPS</p>
                </div>
              </Link>
              <Link href="/tutor-ia" className="no-underline">
                <div className="p-4 rounded-xl border border-black/[0.06] hover:border-cedu-violet/20 hover:shadow-sm transition-all text-center group" data-testid="link-empty-tutor">
                  <div className="w-10 h-10 bg-cedu-violet-light rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Sparkles size={20} className="text-cedu-violet" />
                  </div>
                  <p className="text-xs font-semibold text-cedu-ink">Tutor IA</p>
                  <p className="text-[10px] text-cedu-ink-muted mt-0.5">49 cursos IA</p>
                </div>
              </Link>
              <Link href="/academy" className="no-underline">
                <div className="p-4 rounded-xl border border-black/[0.06] hover:border-cedu-orange/20 hover:shadow-sm transition-all text-center group" data-testid="link-empty-academy">
                  <div className="w-10 h-10 bg-cedu-orange-light rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Library size={20} className="text-cedu-orange" />
                  </div>
                  <p className="text-xs font-semibold text-cedu-ink">Academy</p>
                  <p className="text-[10px] text-cedu-ink-muted mt-0.5">988 cursos</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="courses-tab">
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-black/[0.06]" data-testid="stat-total-courses">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-cedu-ink">{totalCourses}</p>
            <p className="text-[11px] text-cedu-ink-muted">Total inscritos</p>
          </CardContent>
        </Card>
        <Card className="border-black/[0.06]" data-testid="stat-in-progress">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-cedu-blue">{inProgressCount}</p>
            <p className="text-[11px] text-cedu-ink-muted">En progreso</p>
          </CardContent>
        </Card>
        <Card className="border-black/[0.06]" data-testid="stat-completed">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-cedu-green">{completedCount}</p>
            <p className="text-[11px] text-cedu-ink-muted">Completados</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-cedu-ink-muted uppercase tracking-wide mr-1">Estado:</span>
          {([
            { key: "all" as const, label: "Todos", count: totalCourses },
            { key: "in-progress" as const, label: "En progreso", count: inProgressCount },
            { key: "completed" as const, label: "Completados", count: completedCount },
          ]).map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === f.key
                  ? "bg-cedu-blue text-white shadow-sm"
                  : "bg-white text-cedu-ink-muted border border-black/[0.06] hover:bg-black/[0.02]"
              }`}
              data-testid={`filter-${f.key}`}
            >
              {f.label}
              <span className="ml-1 text-[10px] opacity-70">{f.count}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-cedu-ink-muted uppercase tracking-wide mr-1">Tipo:</span>
          <button
            onClick={() => setSourceFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sourceFilter === "all"
                ? "bg-cedu-ink text-white shadow-sm"
                : "bg-white text-cedu-ink-muted border border-black/[0.06] hover:bg-black/[0.02]"
            }`}
            data-testid="filter-source-all"
          >
            Todos <span className="ml-1 text-[10px] opacity-70">{totalCourses}</span>
          </button>
          {stpsCount > 0 && (
            <button
              onClick={() => setSourceFilter("stps")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 ${
                sourceFilter === "stps"
                  ? "bg-cedu-blue text-white shadow-sm"
                  : "bg-white text-cedu-ink-muted border border-black/[0.06] hover:bg-black/[0.02]"
              }`}
              data-testid="filter-source-stps"
            >
              <School size={12} /> Conferencias Ceduverse <span className="ml-1 text-[10px] opacity-70">{stpsCount}</span>
            </button>
          )}
          {tutorIaCount > 0 && (
            <button
              onClick={() => setSourceFilter("tutor-ia")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 ${
                sourceFilter === "tutor-ia"
                  ? "bg-cedu-violet text-white shadow-sm"
                  : "bg-white text-cedu-ink-muted border border-black/[0.06] hover:bg-black/[0.02]"
              }`}
              data-testid="filter-source-tutor-ia"
            >
              <Sparkles size={12} /> Tutor IA <span className="ml-1 text-[10px] opacity-70">{tutorIaCount}</span>
            </button>
          )}
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <Card className="border-black/[0.06]">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-cedu-ink-muted">
              {statusFilter === "completed" ? "Aún no has completado ningún curso" : "No hay cursos con este filtro"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCourses.map((course) => (
            <Link key={course.id} href={course.href} className="no-underline">
              <Card
                className="border-black/[0.06] cursor-pointer hover:border-cedu-blue/20 hover:shadow-sm transition-all group"
                data-testid={`card-course-${course.id}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 ${course.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 text-lg group-hover:scale-105 transition-transform`}>
                      {course.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-cedu-ink line-clamp-1 group-hover:text-cedu-blue transition-colors">
                            {course.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-cedu-ink-muted">{course.subtitle}</span>
                            {course.duration && (
                              <span className="text-[11px] text-cedu-ink-muted">&bull; {course.duration}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {course.badge && (
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-5 ${course.badgeColor}`}>
                              {course.badge}
                            </Badge>
                          )}
                          {course.progress === 100 ? (
                            <div className="w-7 h-7 bg-cedu-green/10 rounded-full flex items-center justify-center">
                              <CheckCircle2 size={16} className="text-cedu-green" />
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-cedu-ink-soft min-w-[2rem] text-right">
                              {course.progress}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <div className="h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              course.progress === 100
                                ? "bg-cedu-green"
                                : course.type === "tutor-ia"
                                  ? "bg-cedu-violet"
                                  : "bg-cedu-blue"
                            }`}
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}

function AchievementsTab({ userAchievements, allAchievements }: {
  userAchievements: UserAchievement[];
  allAchievements: AchievementInfo[];
}) {
  const achievementLookup = new Map(allAchievements.map(a => [a.id, a]));
  const earnedIds = new Set(userAchievements.map(ua => ua.achievementId));

  const stpsTotal = allAchievements.filter(a => a.slug.startsWith("logro-") && !a.slug.startsWith("logro-academy-")).length;
  const earnedStps = userAchievements.filter(ua => {
    const info = achievementLookup.get(ua.achievementId);
    return info && info.slug.startsWith("logro-") && !info.slug.startsWith("logro-academy-");
  }).length;

  const diplomas = userAchievements.filter(ua => !ua.certType || ua.certType === "diploma");
  const dc3Certs = userAchievements.filter(ua => ua.certType === "dc3");
  const sepCerts = userAchievements.filter(ua => ua.certType === "sep");

  if (userAchievements.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg text-cedu-ink">Logros Coleccionables</h3>
            <p className="text-xs text-cedu-ink-muted">{earnedStps} de {stpsTotal} logros STPS obtenidos</p>
          </div>
          <Badge variant="secondary">{stpsTotal} disponibles</Badge>
        </div>
        <EmptyBadgesState />
      </div>
    );
  }

  const renderBadgeGrid = (items: UserAchievement[], testIdPrefix: string) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {items.map((ua) => {
        const info = achievementLookup.get(ua.achievementId);
        if (!info) return null;
        return (
          <CollectibleBadge
            key={ua.id}
            achievement={info}
            userAchievement={ua}
          />
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg text-cedu-ink">Logros Coleccionables</h3>
          <p className="text-xs text-cedu-ink-muted">{earnedStps} de {stpsTotal} logros STPS obtenidos</p>
        </div>
        <Badge variant="secondary" data-testid="badge-achievement-count">
          {userAchievements.length} obtenidos
        </Badge>
      </div>

      <div className="w-full bg-black/[0.04] rounded-full h-2.5 mb-2">
        <div
          className="bg-gradient-to-r from-cedu-blue to-cedu-violet h-2.5 rounded-full transition-all"
          style={{ width: stpsTotal > 0 ? `${(earnedStps / stpsTotal) * 100}%` : "0%" }}
        />
      </div>

      <div className="space-y-2" data-testid="section-diplomas">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-cedu-green flex items-center justify-center">
            <Award size={14} className="text-white" />
          </div>
          <h4 className="font-serif text-base text-cedu-ink">Diplomas Digitales</h4>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px]">{diplomas.length}</Badge>
        </div>
        {diplomas.length > 0 ? renderBadgeGrid(diplomas, "diploma") : (
          <p className="text-xs text-cedu-ink-muted pl-8">Completa un curso para obtener tu primer diploma.</p>
        )}
      </div>

      {dc3Certs.length > 0 && (
        <div className="space-y-2" data-testid="section-dc3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
              <FileCheck size={14} className="text-white" />
            </div>
            <h4 className="font-serif text-base text-cedu-ink">Constancias DC-3 STPS</h4>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px]">{dc3Certs.length}</Badge>
          </div>
          {renderBadgeGrid(dc3Certs, "dc3")}
        </div>
      )}

      {sepCerts.length > 0 && (
        <div className="space-y-2" data-testid="section-sep">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-cedu-blue flex items-center justify-center">
              <BadgeCheck size={14} className="text-white" />
            </div>
            <h4 className="font-serif text-base text-cedu-ink">Certificados SEP</h4>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">{sepCerts.length}</Badge>
          </div>
          {renderBadgeGrid(sepCerts, "sep")}
        </div>
      )}

      <div className="space-y-2">
        <h4 className="font-serif text-sm text-cedu-ink-soft">Próximos logros</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {allAchievements
            .filter((a) => !earnedIds.has(a.id))
            .slice(0, 8)
            .map((a) => (
              <LockedBadge key={a.id} achievement={a} />
            ))}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ profile }: { profile: Profile | null }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || "",
    country: profile?.country || "",
    city: profile?.city || "",
    phoneNumber: profile?.phoneNumber || "",
    genre: profile?.genre || "",
  });

  const updateProfile = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("PATCH", "/api/me/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/profile"] });
      toast({ title: "Perfil actualizado", description: "Tus datos se guardaron correctamente." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const copyAddress = () => {
    if (profile?.walletAddress) {
      navigator.clipboard.writeText(profile.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-black/[0.06]" data-testid="card-profile">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-cedu-ink">Mi Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-cedu-ink-soft text-sm font-semibold">Nombre completo</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Tu nombre"
                  className="h-11"
                  data-testid="input-profile-fullname"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-cedu-ink-soft text-sm font-semibold">País</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="México"
                  className="h-11"
                  data-testid="input-profile-country"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-cedu-ink-soft text-sm font-semibold">Ciudad</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Tu ciudad"
                  className="h-11"
                  data-testid="input-profile-city"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-cedu-ink-soft text-sm font-semibold">Teléfono</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+52 55 1234 5678"
                  className="h-11"
                  data-testid="input-profile-phone"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={updateProfile.isPending}
              className="bg-cedu-blue hover:bg-cedu-blue-dark text-white font-bold rounded-[12px] h-11 px-8"
              data-testid="button-save-profile"
            >
              {updateProfile.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <DigitalCardSection />

      <Card className="border-black/[0.06]" data-testid="card-wallet-section">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-cedu-ink flex items-center gap-2">
            <Wallet size={20} />
            Billetera Web3
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile?.walletAddress ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-cedu-green-light rounded-xl p-4">
                <CheckCircle2 size={20} className="text-cedu-green flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-cedu-ink">Billetera vinculada</p>
                  <p className="text-xs text-cedu-ink-muted font-mono truncate" data-testid="text-wallet-address">
                    {profile.walletAddress}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAddress}
                  data-testid="button-copy-wallet"
                >
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </Button>
              </div>
              <p className="text-xs text-cedu-ink-muted">
                Tus logros coleccionables están vinculados a esta dirección de blockchain.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-cedu-ink-muted">
                Vincula una billetera Web3 para que tus logros sean verificables en blockchain.
              </p>
              <div className="flex flex-wrap gap-3">
                <CreateWalletModal onWalletCreated={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/me/profile"] });
                }} />
                <ConnectWalletButton onConnected={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/me/profile"] });
                }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <InstructorCTACard />
    </div>
  );
}

function DigitalCardSection() {
  const { toast } = useToast();
  const [editingSlug, setEditingSlug] = useState(false);
  const [newSlug, setNewSlug] = useState("");

  const { data: card, isLoading } = useQuery<{
    id: string;
    slug: string;
    displayName: string;
    title: string;
    phone: string | null;
    email: string | null;
    avatarUrl: string | null;
    avatarInitials: string | null;
  } | null>({
    queryKey: ["/api/me/contact-card"],
  });

  const updateSlug = useMutation({
    mutationFn: async (slug: string) => {
      const res = await apiRequest("PATCH", "/api/me/contact-card/slug", { slug });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/contact-card"] });
      setEditingSlug(false);
      toast({ title: "Slug actualizado", description: "Tu enlace personalizado se actualizó." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card className="border-black/[0.06]" data-testid="card-digital-card-loading">
        <CardContent className="py-6">
          <Skeleton className="h-20 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (!card) return null;

  const cardUrl = typeof window !== "undefined" ? `${window.location.origin}/contacto/${card.slug}` : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(cardUrl);
    toast({ title: "Enlace copiado", description: "El enlace de tu tarjeta digital fue copiado al portapapeles." });
  };

  return (
    <Card className="border-black/[0.06]" data-testid="card-digital-card">
      <CardHeader>
        <CardTitle className="font-serif text-xl text-cedu-ink flex items-center gap-2">
          <CreditCard size={20} />
          Mi Tarjeta Digital
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-cedu-blue/5 to-cedu-violet/5 rounded-xl">
          {card.avatarUrl ? (
            <img src={card.avatarUrl} alt={card.displayName} className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow" data-testid="card-preview-avatar" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cedu-blue to-cedu-violet flex items-center justify-center text-white font-serif text-xl ring-2 ring-white shadow" data-testid="card-preview-initials">
              {card.avatarInitials || "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-serif text-base text-cedu-ink truncate" data-testid="card-preview-name">{card.displayName}</p>
            <p className="text-sm text-cedu-blue font-medium truncate" data-testid="card-preview-title">{card.title}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-cedu-ink-soft text-sm font-semibold">Enlace personalizado</Label>
            <button onClick={() => { setEditingSlug(!editingSlug); setNewSlug(card.slug); }} className="text-cedu-blue hover:text-cedu-blue-dark bg-transparent border-none cursor-pointer p-0" data-testid="button-edit-slug">
              <Pencil size={14} />
            </button>
          </div>
          {editingSlug ? (
            <div className="flex gap-2">
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                placeholder="mi-slug"
                className="h-9 text-sm flex-1"
                data-testid="input-slug"
              />
              <Button
                size="sm"
                onClick={() => updateSlug.mutate(newSlug)}
                disabled={updateSlug.isPending || newSlug.length < 3}
                className="bg-cedu-blue hover:bg-cedu-blue-dark text-white h-9"
                data-testid="button-save-slug"
              >
                {updateSlug.isPending ? "..." : "Guardar"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-cedu-ink-muted font-mono bg-gray-50 rounded-lg px-3 py-2" data-testid="text-slug">
              /contacto/{card.slug}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <a href={`/contacto/${card.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-open-card">
              <ExternalLink size={14} />
              Ver tarjeta
            </Button>
          </a>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={copyLink} data-testid="button-copy-card-link">
            <Link2 size={14} />
            Copiar enlace
          </Button>
          <a href={`/api/vcard/${card.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-download-vcf">
              <Download size={14} />
              Descargar vCard
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function InstructorCTACard() {
  const { data: account } = useQuery<{ userRole: string; isInstructor: boolean }>({ queryKey: ["/api/me/account"] });
  const { data: application } = useQuery<any>({ queryKey: ["/api/instructor-application/mine"] });

  if (account?.isInstructor || account?.userRole === "admin" || account?.userRole === "superadmin") return null;
  if (application?.status === "active") return null;

  return (
    <Card className="border-[#7c3aed]/20 bg-gradient-to-r from-[#7c3aed]/5 to-[#1b5adf]/5" data-testid="card-become-instructor">
      <CardContent className="py-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#7c3aed] to-[#1b5adf] rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-serif text-base text-cedu-ink">¿Quieres ser Instructor?</h4>
            <p className="text-xs text-cedu-ink-muted mt-0.5">Comparte tu conocimiento y genera ingresos en Ceduverse</p>
          </div>
          <Link href="/instructor/acreditacion">
            <Button className="bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white" size="sm" data-testid="button-become-instructor">
              Comenzar <ArrowRight size={14} className="ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

type OrgObjectiveItem = {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  status: string;
  assignments: {
    id: string;
    userId: string;
    fullName: string | null;
    status: string;
  }[];
};

type TeamProgressItem = {
  userId: string;
  fullName: string | null;
  role: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  avgProgress: number;
  objectivesAssigned: number;
  objectivesCompleted: number;
};

function OrgTab({ userTeams }: { userTeams: TeamInfo[] }) {
  const { toast } = useToast();
  const adminTeams = userTeams.filter(t => t.role === "admin");
  const [selectedTeam, setSelectedTeam] = useState(adminTeams[0]?.team?.id || "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNombre, setInviteNombre] = useState("");

  const { data: objectives = [], isLoading: objLoading } = useQuery<OrgObjectiveItem[]>({
    queryKey: ["/api/teams", selectedTeam, "objectives"],
    enabled: !!selectedTeam,
  });

  const { data: progress = [], isLoading: progressLoading } = useQuery<TeamProgressItem[]>({
    queryKey: ["/api/teams", selectedTeam, "progress"],
    enabled: !!selectedTeam,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/empresa/invitations", { email: inviteEmail, nombre: inviteNombre });
      return res.json();
    },
    onSuccess: (data: { message?: string }) => {
      toast({ title: data?.message || "Invitación enviada" });
      setInviteEmail("");
      setInviteNombre("");
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam, "progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/empresa/invitations"] });
    },
    onError: (err: any) => {
      toast({ title: "No se pudo invitar", description: extractServerMessage(err), variant: "destructive" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ objId, userIds }: { objId: string; userIds: string[] }) => {
      const res = await apiRequest("POST", `/api/teams/${selectedTeam}/objectives/${objId}/assign`, { userIds });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Objetivo asignado a miembros" });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam, "objectives"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (adminTeams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-cedu-ink-muted">No administras ninguna organización</p>
        </CardContent>
      </Card>
    );
  }

  const currentTeam = adminTeams.find(t => t.team.id === selectedTeam)?.team;

  return (
    <div className="space-y-6">
      {adminTeams.length > 1 && (
        <div className="flex gap-2">
          {adminTeams.map(t => (
            <Button
              key={t.team.id}
              variant={selectedTeam === t.team.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTeam(t.team.id)}
              data-testid={`button-select-team-${t.team.id}`}
            >
              {t.team.name}
            </Button>
          ))}
        </div>
      )}

      {currentTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cedu-blue" />
              {currentTeam.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              {currentTeam.plan && <Badge variant="secondary">{currentTeam.plan}</Badge>}
              <Badge variant={currentTeam.status === "active" ? "default" : "secondary"}>{currentTeam.status}</Badge>
              <span className="text-cedu-ink-muted"><Users className="w-3 h-3 inline mr-1" />{progress.length} miembros</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Target className="w-5 h-5 text-cedu-orange" />
              Objetivos ({objectives.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {objLoading ? (
              <Skeleton className="h-32" />
            ) : objectives.length === 0 ? (
              <p className="text-sm text-cedu-ink-muted text-center py-4">Sin objetivos asignados por el coordinador</p>
            ) : (
              objectives.map((obj) => (
                <div key={obj.id} className="p-3 bg-cedu-cream rounded-xl" data-testid={`org-objective-${obj.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-cedu-blue" />
                      <span className="text-sm font-semibold">{obj.courseTitle}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const unassigned = progress.filter(m => !obj.assignments.some(a => a.userId === m.userId));
                        if (unassigned.length === 0) {
                          toast({ title: "Todos los miembros ya tienen este objetivo asignado" });
                          return;
                        }
                        assignMutation.mutate({ objId: obj.id, userIds: unassigned.map(m => m.userId) });
                      }}
                      disabled={assignMutation.isPending}
                      data-testid={`button-assign-all-${obj.id}`}
                    >
                      <UserPlus className="w-3 h-3 mr-1" /> Asignar a todos
                    </Button>
                  </div>
                  {obj.assignments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {obj.assignments.map(a => (
                        <div key={a.id} className="flex items-center justify-between text-xs text-cedu-ink-muted px-2 py-1 bg-white rounded">
                          <span>{a.fullName || "Sin nombre"}</span>
                          <Badge variant={a.status === "completed" ? "default" : "secondary"} className="text-xs">{a.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Users className="w-5 h-5 text-cedu-violet" />
              Equipo ({progress.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex gap-2">
                <Input
                  value={inviteNombre}
                  onChange={(e) => setInviteNombre(e.target.value)}
                  placeholder="Nombre..."
                  className="flex-1 h-9"
                  data-testid="input-invite-nombre"
                />
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email para invitar..."
                  className="flex-1 h-9"
                  data-testid="input-invite-email"
                />
                <Button
                  size="sm"
                  className="bg-cedu-violet hover:bg-cedu-violet/90"
                  onClick={() => inviteMutation.mutate()}
                  disabled={!inviteEmail || !inviteNombre || inviteMutation.isPending}
                  data-testid="button-invite-member"
                >
                  {inviteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                </Button>
              </div>
            </div>

            {progressLoading ? (
              <Skeleton className="h-32" />
            ) : progress.length === 0 ? (
              <p className="text-sm text-cedu-ink-muted text-center py-4">Sin miembros</p>
            ) : (
              progress.map((m) => (
                <div key={m.userId} className="p-3 bg-cedu-cream rounded-xl" data-testid={`team-member-${m.userId}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{m.fullName || "Sin nombre"}</span>
                    <Badge variant="secondary" className="text-xs">{m.role}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-cedu-ink-muted mb-1">
                    <span>{m.coursesEnrolled} cursos</span>
                    <span>{m.coursesCompleted} completados</span>
                    <span>{m.objectivesAssigned} obj.</span>
                  </div>
                  <ProgressBar value={m.avgProgress} className="h-1.5" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Pestaña inicial desde ?tab= (p.ej. "Regresar a Mis Cursos" abre ?tab=courses).
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "overview";
    return new URLSearchParams(window.location.search).get("tab") || "overview";
  });
  useForceLightMode();

  const { data: account, isLoading: accountLoading } = useQuery<Account>({
    queryKey: ["/api/me/account"],
    enabled: !!user,
  });

  useEffect(() => {
    if (account && account.accountSetup < 4) {
      setLocation("/welcome");
    }
  }, [account?.accountSetup]);

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/me/profile"],
    enabled: !!user,
  });

  const { data: enrollments = [] } = useQuery<CourseEnrollment[]>({
    queryKey: ["/api/me/courses"],
    enabled: !!user,
  });

  const { data: userAchievements = [] } = useQuery<UserAchievement[]>({
    queryKey: ["/api/me/achievements"],
    enabled: !!user,
  });

  const { data: allCourses = [] } = useQuery<CourseInfo[]>({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });

  const { data: allAchievements = [] } = useQuery<AchievementInfo[]>({
    queryKey: ["/api/achievements"],
    enabled: !!user,
  });

  const { data: userTeams = [] } = useQuery<TeamInfo[]>({
    queryKey: ["/api/me/teams"],
    enabled: !!user,
  });

  // "Ver como ROL": todo el nav/paneles de abajo debe reflejar el rol
  // EFECTIVO (lo que un superadmin/admin real está previsualizando), NUNCA
  // el rol real directo — así previsualizar p.ej. socio_estudiante oculta
  // el link de Panel Admin como debe ser. `realIsSuperadmin` (más abajo) es
  // la única excepción: se deriva del rol REAL y gatea el switcher/banner
  // global (ver ViewAsSwitcher, montado en App.tsx), para que el camino de
  // vuelta a superadmin nunca desaparezca mientras se previsualiza otro rol.
  // (Hook llamado antes de cualquier return condicional, como todos los de
  // arriba — debe estar antes de la query de roleDefinition para que su
  // queryKey/enabled puedan usar effectiveRole.)
  const { viewAsRole } = useViewAs();
  const effectiveRole = viewAsRole ?? account?.userRole;

  // El sidebar configurable en BD también debe seguir el rol EFECTIVO: si
  // no, un superadmin previsualizando "empresa" seguiría viendo el sidebar
  // de superadmin en dynamicItems (solo los flags booleanos de abajo
  // reaccionarían a la previsualización).
  const { data: roleDefinition } = useQuery<{ sidebarConfig: any; displayName: string }>({
    queryKey: ["/api/role-definition", effectiveRole],
    enabled: !!effectiveRole,
  });

  useEffect(() => {
    if (!authLoading && !user) setLocation("/auth");
  }, [authLoading, user]);

  if (!authLoading && !user) return null;

  const realIsSuperadmin = account?.userRole === "superadmin";

  const isOrgAdmin = userTeams.some(t => t.role === "admin") || effectiveRole === "empresa" || effectiveRole === "empresa_rh";
  const isPartner = effectiveRole === "socio_comercial" || effectiveRole === "partner" || effectiveRole === "director";
  const isSuperadmin = effectiveRole === "superadmin";
  const isAdmin = effectiveRole === "admin" || isSuperadmin;
  const isInstructor = account?.isInstructor === true || effectiveRole === "socio_instructor";

  if (authLoading || accountLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-cedu-cream flex items-center justify-center">
        <div className="w-12 h-12 bg-cedu-blue rounded-2xl flex items-center justify-center text-white font-serif text-2xl animate-pulse">
          C
        </div>
      </div>
    );
  }

  const defaultNavItems: SidebarItem[] = [
    { id: "overview", label: "Resumen", icon: LayoutDashboard },
    { id: "courses", label: "Mis Cursos", icon: BookOpen },
    { id: "aula-virtual", label: "Conferencias Ceduverse", icon: School, href: "/conferencias" },
    { id: "academy-link", label: "Academy", icon: Library, href: "/academy" },
    { id: "achievements", label: "Logros", icon: Trophy },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "certificates", label: "Certificados", icon: Award },
    { id: "seguros-link", label: "Seguros", icon: HeartPulse, href: "/seguros" },
    { id: "profile", label: "Perfil", icon: UserCircle },
  ];

  const dynamicItems = buildNavItemsFromConfig(
    roleDefinition?.sidebarConfig,
    defaultNavItems
  );

  const navItems: SidebarItem[] = [
    ...dynamicItems,
    ...(!isInstructor && !dynamicItems.some(i => i.id === "acreditacion-link") ? [{ id: "acreditacion-link", label: "Ser Instructor", icon: GraduationCap, href: "/instructor/acreditacion" }] : []),
    ...(isInstructor && !dynamicItems.some(i => i.id.includes("instructor")) ? [{ id: "instructor-link", label: "Panel Instructor", icon: GraduationCap, href: "/instructor" }] : []),
    ...(isPartner && !dynamicItems.some(i => i.id === "partner-link") ? [{ id: "partner-link", label: "Panel Socio", icon: Handshake, href: "/partner" }] : []),
    ...(isAdmin && !dynamicItems.some(i => i.id === "admin-link") ? [{ id: "admin-link", label: "Panel Admin", icon: Shield, href: "/admin", section: "Administración" }] : []),
    ...(isOrgAdmin && !dynamicItems.some(i => i.id === "org") ? [
      { id: "org", label: "Mi Organización", icon: Building2 },
      { id: "contributions", label: "Aportaciones", icon: DollarSign },
      { id: "afiliacion-masiva", label: "Afiliación Masiva", icon: FileSpreadsheet },
      { id: "sam-mensual", label: "SAM Mensual", icon: CalendarDays },
      { id: "riesgos", label: "Detector de Riesgos", icon: ShieldAlert },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-cedu-cream flex" data-testid="page-dashboard">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-black/[0.06] flex flex-col transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        data-testid="sidebar-dashboard"
      >
        <div className="p-6 border-b border-black/[0.06]">
          <Link href="/" className="flex items-center gap-2.5 no-underline" data-testid="link-dashboard-logo">
            <div className="w-8 h-8 bg-cedu-blue rounded-[10px] flex items-center justify-center text-white font-serif text-lg">
              C
            </div>
            <div className="font-serif text-xl text-cedu-ink tracking-tight">
              Cedu<em className="text-cedu-blue not-italic italic">verse</em>
            </div>
          </Link>
          {account?.userRole && (
            <div className="mt-3" data-testid="sidebar-role-badge">
              <RoleBadge role={account.userRole} />
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            const separator = item.section ? (
              <div key={`sep-${item.id}`} className="pt-3 pb-1 px-4">
                <div className="border-t border-black/[0.06]" />
                <p className="text-[10px] font-bold text-cedu-ink-muted uppercase tracking-wider mt-2">{item.section}</p>
              </div>
            ) : null;

            const el = (item as any).href ? (
              <Link key={item.id} href={(item as any).href}>
                <span
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer text-cedu-ink-muted hover:bg-black/[0.03] hover:text-cedu-ink"
                  data-testid={`button-nav-${item.id}`}
                >
                  <item.icon size={20} />
                  {item.label}
                </span>
              </Link>
            ) : (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? "bg-cedu-blue-light text-cedu-blue"
                    : "text-cedu-ink-muted hover:bg-black/[0.03] hover:text-cedu-ink"
                }`}
                data-testid={`button-nav-${item.id}`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            );

            return separator ? [separator, el] : el;
          })}
        </nav>

        <div className="p-4 border-t border-black/[0.06]">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-cedu-ink-muted hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
            data-testid="button-logout"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 md:ml-64 min-h-screen overflow-x-hidden">
        <header className="sticky top-0 z-20 bg-cedu-cream/85 backdrop-blur-xl border-b border-black/[0.06] px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 text-cedu-ink"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="button-toggle-sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="font-serif text-lg text-cedu-ink" data-testid="text-page-title">
              {activeTab === "courses"
                ? "Mis Cursos y Conferencias"
                : navItems.find(n => n.id === activeTab)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cedu-blue rounded-full flex items-center justify-center text-white text-sm font-bold">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            <span className="text-sm font-semibold text-cedu-ink hidden sm:block" data-testid="text-user-email">
              {user?.email}
            </span>
          </div>
        </header>

        <main className="p-4 sm:p-6 md:p-8 max-w-[960px] overflow-x-hidden">
          {activeTab === "overview" && (
            <OverviewTab
              profile={profile || null}
              account={account || null}
              enrollments={enrollments}
              allCourses={allCourses}
              userAchievements={userAchievements}
              allAchievements={allAchievements}
              setActiveTab={setActiveTab}
              userTeams={userTeams}
            />
          )}
          {activeTab === "courses" && (
            <CoursesTab enrollments={enrollments} allCourses={allCourses} />
          )}
          {activeTab === "achievements" && (
            <AchievementsTab userAchievements={userAchievements} allAchievements={allAchievements} />
          )}
          {activeTab === "wallet" && (
            <WalletTab profile={profile || null} />
          )}
          {activeTab === "certificates" && (
            <CertificatesTab />
          )}
          {activeTab === "org" && isOrgAdmin && (
            <OrgTab userTeams={userTeams} />
          )}
          {activeTab === "contributions" && isOrgAdmin && userTeams.filter(t => t.role === "admin").length > 0 && (
            <ContributionsTab teamId={userTeams.filter(t => t.role === "admin")[0].team.id} />
          )}
          {activeTab === "afiliacion-masiva" && isOrgAdmin && (
            <AfiliacionMasivaTab />
          )}
          {activeTab === "sam-mensual" && isOrgAdmin && (
            <SamMensualTab />
          )}
          {activeTab === "riesgos" && isOrgAdmin && (
            <TeamRiesgosTab />
          )}
          {activeTab === "profile" && (
            <ProfileTab profile={profile || null} />
          )}
        </main>
      </div>
    </div>
  );
}
