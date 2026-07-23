import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForceLightMode } from "@/components/ThemeProvider";
import { getAuthToken } from "@/lib/auth-token";
import { AdminBlogTab, AdminNewsletterTab } from "@/pages/admin-blog-tab";
import { RoleBadge } from "@/components/RoleBadge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdminCertsTab,
} from "@/pages/admin-dashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Switch,
} from "@/components/ui/switch";
import DenueTab from "@/pages/denue-tab";
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  FileCheck,
  DollarSign,
  TrendingUp,
  Wallet,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Award,
  Handshake,
  Target,
  Loader2,
  Plus,
  RefreshCw,
  ChevronRight,
  UserCheck,
  Send,
  FileText,
  Download,
  Ban,
  Receipt,
  MapPin,
  Newspaper,
  Mail,
  HeartPulse,
  GraduationCap,
  Key,
  Activity,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Globe,
  Server,
  Database,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  RotateCcw,
  Briefcase,
  History,
  ShoppingCart,
  Package,
  Tag,
  Truck,
  Hash,
  AlertCircle,
  Edit3,
  Video,
} from "lucide-react";

type AdminTab =
  | "overview"
  | "usuarios"
  | "empresas"
  | "cursos"
  | "certificados"
  | "instructores"
  | "pagos"
  | "facturacion"
  | "dispersion"
  | "comisiones-crm"
  | "denue"
  | "blog"
  | "newsletter"
  | "soporte"
  | "seguros"
  | "memberships"
  | "documentos-legales"
  | "api-externa"
  | "configuracion"
  | "roles"
  | "matriz"
  | "recursos-socios"
  | "logs"
  | "tienda";

type AdminOverviewStats = {
  totalUsers: number;
  totalOrgs: number;
  totalPartners: number;
  totalInstructors: number;
  coursesCompleted: number;
  completionsThisMonth: number;
  totalObjectives: number;
  certsEmitted: number;
  monthlyRevenue: number;
  unansweredSupportThreads: number;
  overduePayments: number;
  pendingInstructorApps: number;
  recentUsers: { id: string; email: string; fullName: string | null; createdAt: string }[];
  recentActivity: { type: string; description: string; time: string }[];
  userGrowth: { week: string; count: number }[];
  revenueByMonth: { month: string; amount: number }[];
};

type SupportThread = {
  id: string;
  userId: string;
  subject: string;
  academyCourseId: number | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  userName?: string;
  userEmail?: string;
};

type SupportMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: string;
  content: string;
  createdAt: string;
};

type CrmPaymentRow = {
  payment: {
    id: string;
    teamId: string;
    amount: number;
    periodMonth: number;
    periodYear: number;
    paymentMethod: string;
    reference: string | null;
    status: string;
    confirmedAt: string | null;
    createdAt: string;
  };
  teamName: string;
};

type CrmPaymentSummary = {
  totalConfirmed: number;
  totalPending: number;
  totalOverdue: number;
  count: number;
  breakdown?: { status: string; total: number; count: number }[];
};

type CrmCommissionRow = {
  commission: {
    id: string;
    partnerId: string;
    teamId: string;
    amount: number;
    feePercent: number;
    month: number;
    year: number;
    status: string;
    createdAt: string;
  };
  partnerName: string;
  teamName: string;
};

type CrmProspect = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  stage: string;
  notes: string | null;
  partnerId: string;
  createdAt: string;
};

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatMXN(amount: number) {
  return "$" + amount.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "Pendiente", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  confirmed: { label: "Confirmado", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  overdue: { label: "Vencido", color: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle },
  cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-500 border-gray-200", icon: Clock },
  approved: { label: "Aprobada", color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  paid: { label: "Pagada", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
};

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  contact: { label: "Contacto", color: "bg-gray-100 text-gray-600" },
  demo: { label: "Demo", color: "bg-blue-50 text-blue-600" },
  proposal: { label: "Propuesta", color: "bg-violet-50 text-violet-600" },
  negotiation: { label: "Negociación", color: "bg-amber-50 text-amber-600" },
  closed: { label: "Cerrado", color: "bg-green-50 text-green-600" },
  active: { label: "Activa", color: "bg-emerald-50 text-emerald-700" },
  lost: { label: "Perdido", color: "bg-red-50 text-red-600" },
};

const METHOD_LABELS: Record<string, string> = {
  spei: "SPEI",
  deposit: "Depósito",
  domiciliation: "Domiciliación",
  card: "Tarjeta",
  other: "Otro",
};

function useAdminFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refetch(); }, [url]);
  return { data, loading, refetch };
}

function OverviewTab() {
  const { data: stats, loading } = useAdminFetch<AdminOverviewStats>("/api/admin/overview");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!stats) return <p className="text-cedu-ink-muted">Error al cargar estadísticas</p>;

  const statCards: { label: string; value: string | number; icon: typeof Users; color: string; bg: string; isString?: boolean }[] = [
    { label: "Usuarios", value: stats.totalUsers, icon: Users, color: "text-[#1b5adf]", bg: "bg-[#1b5adf]/10" },
    { label: "Empresas activas", value: stats.totalOrgs, icon: Building2, color: "text-[#f28023]", bg: "bg-[#f28023]/10" },
    { label: "Instructores", value: stats.totalInstructors, icon: GraduationCap, color: "text-[#7c3aed]", bg: "bg-[#7c3aed]/10" },
    { label: "Socios Comerciales", value: stats.totalPartners, icon: Briefcase, color: "text-[#00b87a]", bg: "bg-[#00b87a]/10" },
    { label: "Certificados emitidos", value: stats.certsEmitted, icon: Award, color: "text-[#f28023]", bg: "bg-[#f28023]/10" },
    { label: "Ingreso mensual", value: formatMXN(stats.monthlyRevenue), icon: DollarSign, color: "text-[#00b87a]", bg: "bg-[#00b87a]/10", isString: true },
  ];

  const hasAlerts = stats.overduePayments > 0 || stats.unansweredSupportThreads > 0 || stats.pendingInstructorApps > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-cedu-ink" data-testid="text-admin-overview-title">Panel de Administración</h2>
        <p className="text-sm text-cedu-ink-muted">Vista general de la plataforma Ceduverse</p>
      </div>

      {hasAlerts && (
        <div className="flex flex-wrap gap-3" data-testid="admin-alerts-banner">
          {stats.overduePayments > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-sm text-red-700 font-semibold">{stats.overduePayments} pago{stats.overduePayments > 1 ? "s" : ""} vencido{stats.overduePayments > 1 ? "s" : ""}</span>
            </div>
          )}
          {stats.unansweredSupportThreads > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              <MessageCircle size={16} className="text-amber-600" />
              <span className="text-sm text-amber-700 font-semibold">{stats.unansweredSupportThreads} ticket{stats.unansweredSupportThreads > 1 ? "s" : ""} sin respuesta</span>
            </div>
          )}
          {stats.pendingInstructorApps > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5" data-testid="alert-pending-instructor-apps">
              <GraduationCap size={16} className="text-blue-600" />
              <span className="text-sm text-blue-700 font-semibold">{stats.pendingInstructorApps} solicitud{stats.pendingInstructorApps > 1 ? "es" : ""} de instructor pendiente{stats.pendingInstructorApps > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <Card key={card.label} className="border-black/[0.06]" data-testid={`card-overview-stat-${card.label.toLowerCase().replace(/\s/g, "-")}`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <card.icon size={18} className={card.color} />
                </div>
                <div>
                  <p className={`text-xl font-bold leading-none font-serif ${card.color}`}>
                    {card.isString ? card.value : String(card.value)}
                  </p>
                  <p className="text-[11px] text-cedu-ink-muted mt-0.5">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-black/[0.06]" data-testid="chart-user-growth">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-serif text-cedu-ink">Crecimiento de usuarios (8 semanas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.userGrowth}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1b5adf" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1b5adf" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#6b7280" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" name="Nuevos usuarios" stroke="#1b5adf" fill="url(#colorUsers)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/[0.06]" data-testid="chart-revenue">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-serif text-cedu-ink">Ingresos mensuales (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6b7280" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [formatMXN(v), "Ingreso"]} />
                  <Bar dataKey="amount" name="Ingreso" fill="#00b87a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-black/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-serif text-cedu-ink">Usuarios recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentUsers.length === 0 ? (
              <p className="text-sm text-cedu-ink-muted text-center py-4">Sin usuarios recientes</p>
            ) : (
              <div className="space-y-2">
                {stats.recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-black/[0.02]" data-testid={`recent-user-${u.id}`}>
                    <div className="w-8 h-8 bg-cedu-blue/10 rounded-full flex items-center justify-center text-xs font-bold text-cedu-blue">
                      {(u.fullName || u.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-cedu-ink truncate">{u.fullName || "Sin nombre"}</p>
                      <p className="text-[10px] text-cedu-ink-muted truncate">{u.email}</p>
                    </div>
                    <span className="text-[10px] text-cedu-ink-muted flex-shrink-0">
                      {new Date(u.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-black/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-serif text-cedu-ink">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-cedu-ink-muted text-center py-4">Sin actividad reciente</p>
            ) : (
              <div className="space-y-2">
                {stats.recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-lg bg-black/[0.02]" data-testid={`activity-${i}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      a.type === "cert" ? "bg-[#7c3aed]" :
                      a.type === "payment" ? "bg-[#00b87a]" :
                      a.type === "support" ? "bg-[#f28023]" :
                      "bg-[#1b5adf]"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-cedu-ink">{a.description}</p>
                      <p className="text-[10px] text-cedu-ink-muted">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-black/[0.06]">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Handshake size={14} className="text-[#7c3aed]" />
              <span className="text-[10px] text-cedu-ink-muted font-semibold uppercase tracking-wide">Socios</span>
            </div>
            <p className="text-2xl font-bold text-[#7c3aed] font-serif">{stats.totalPartners}</p>
            <p className="text-[10px] text-cedu-ink-muted mt-0.5">Socios comerciales activos</p>
          </CardContent>
        </Card>
        <Card className="border-black/[0.06]">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className="text-[#1b5adf]" />
              <span className="text-[10px] text-cedu-ink-muted font-semibold uppercase tracking-wide">Objetivos</span>
            </div>
            <p className="text-2xl font-bold text-[#1b5adf] font-serif">{stats.totalObjectives}</p>
            <p className="text-[10px] text-cedu-ink-muted mt-0.5">Objetivos de capacitación asignados</p>
          </CardContent>
        </Card>
        <Card className="border-black/[0.06]">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle size={14} className="text-[#f28023]" />
              <span className="text-[10px] text-cedu-ink-muted font-semibold uppercase tracking-wide">Soporte</span>
            </div>
            <p className="text-2xl font-bold text-[#f28023] font-serif">{stats.unansweredSupportThreads}</p>
            <p className="text-[10px] text-cedu-ink-muted mt-0.5">Tickets de soporte abiertos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CursosTab() {
  const { data: coursesList, loading } = useAdminFetch<{ id: string; title: string; slug: string; areaTematica: string | null; durationHrs: number | null; dc3Disponible: boolean | null }[]>("/api/courses");
  const [search, setSearch] = useState("");

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  const filtered = (coursesList || []).filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-cedu-ink" data-testid="text-admin-cursos-title">Gestión de Cursos</h2>
          <p className="text-sm text-cedu-ink-muted">{coursesList?.length || 0} cursos registrados en Conferencias Ceduverse</p>
        </div>
      </div>

      <div className="relative">
        <Input
          placeholder="Buscar por título o slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10"
          data-testid="input-search-courses"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-black/[0.06]">
          <CardContent className="py-10 text-center">
            <BookOpen size={40} className="mx-auto text-cedu-ink-muted/40 mb-3" />
            <p className="text-sm text-cedu-ink-muted">No se encontraron cursos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((course) => (
            <Card key={course.id} className="border-black/[0.06] hover:border-cedu-blue/20 transition-colors" data-testid={`card-admin-course-${course.id}`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cedu-blue-light rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen size={18} className="text-cedu-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-cedu-ink truncate">{course.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-cedu-ink-muted">{course.slug}</span>
                      {course.areaTematica && <Badge variant="outline" className="text-[9px] h-4">{course.areaTematica}</Badge>}
                      {course.durationHrs && <span className="text-[10px] text-cedu-ink-muted">{course.durationHrs}h</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {course.dc3Disponible && <Badge className="bg-amber-100 text-amber-700 border-0 text-[9px]">DC-3</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PagosTab() {
  const { toast } = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);

  const { data: payments = [], isLoading } = useQuery<CrmPaymentRow[]>({
    queryKey: ["/api/crm/payments", month, year],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch(`/api/crm/payments?month=${month}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
  });

  const { data: summary } = useQuery<CrmPaymentSummary>({
    queryKey: ["/api/crm/payments/summary", month, year],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch(`/api/crm/payments/summary?month=${month}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });

  const { data: teamsList = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/teams"],
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/crm/payments/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/payments/summary"] });
      toast({ title: "Pago actualizado" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      await apiRequest("POST", "/api/crm/payments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/payments/summary"] });
      setShowForm(false);
      toast({ title: "Pago registrado" });
    },
  });

  const confirmed = summary?.breakdown?.find(b => b.status === "confirmed");
  const pending = summary?.breakdown?.find(b => b.status === "pending");
  const overdue = summary?.breakdown?.find(b => b.status === "overdue");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-2xl text-cedu-ink" data-testid="text-admin-pagos-title">Pagos</h2>
          <p className="text-sm text-cedu-ink-muted">Dashboard de pagos mensuales por empresa</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-24 h-8 text-xs bg-white" data-testid="select-pagos-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-20 h-8 text-xs bg-white" data-testid="select-pagos-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SmallStatCard label="Cobrado" value={formatMXN(confirmed?.total || 0)} sub={`${confirmed?.count || 0} pagos`} color="text-cedu-green" icon={CheckCircle2} />
        <SmallStatCard label="Pendiente" value={formatMXN(pending?.total || 0)} sub={`${pending?.count || 0} pagos`} color="text-amber-600" icon={Clock} />
        <SmallStatCard label="Vencido" value={formatMXN(overdue?.total || 0)} sub={`${overdue?.count || 0} pagos`} color="text-red-600" icon={AlertTriangle} />
        <SmallStatCard label="Empresas" value={String(payments.length)} sub={`${MONTHS[month - 1]} ${year}`} color="text-cedu-blue" icon={Building2} />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-cedu-ink">Pagos del período</h3>
        <Button size="sm" className="bg-cedu-blue hover:bg-cedu-blue/90 rounded-xl gap-1 text-xs" onClick={() => setShowForm(!showForm)} data-testid="button-admin-new-payment">
          <Plus size={14} /> Registrar pago
        </Button>
      </div>

      {showForm && (
        <PaymentForm
          teams={teamsList}
          month={month}
          year={year}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          isPending={createMutation.isPending}
        />
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : payments.length === 0 ? (
        <Card className="border-black/[0.06]">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-cedu-ink-muted">No hay pagos registrados para este período</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {payments.map((row) => {
            const p = row.payment;
            const st = STATUS_LABELS[p.status] || STATUS_LABELS.pending;
            return (
              <Card key={p.id} className="border-black/[0.06]" data-testid={`admin-payment-${p.id}`}>
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cedu-blue-light rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 size={18} className="text-cedu-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-cedu-ink truncate">{row.teamName || p.teamId}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-cedu-ink-muted">{METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</span>
                        {p.reference && <span className="text-[11px] text-cedu-ink-muted">Ref: {p.reference}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-cedu-ink">{formatMXN(p.amount)}</span>
                      <Badge variant="outline" className={`text-[9px] h-5 ${st.color}`}>{st.label}</Badge>
                    </div>
                    {p.status === "pending" && (
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] text-green-600 hover:bg-green-50" onClick={() => confirmMutation.mutate({ id: p.id, status: "confirmed" })} data-testid={`admin-confirm-payment-${p.id}`}>
                          Confirmar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] text-red-500 hover:bg-red-50" onClick={() => confirmMutation.mutate({ id: p.id, status: "overdue" })}>
                          Vencido
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

type PaymentFormData = { teamId: string; amount: number; paymentMethod: string; reference: string | null; notes: string | null; status: string; paidAt: string | null; periodMonth: number; periodYear: number };

function PaymentForm({ teams, month, year, onSubmit, onCancel, isPending }: {
  teams: { id: string; name: string }[];
  month: number;
  year: number;
  onSubmit: (data: PaymentFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [teamId, setTeamId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("spei");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Card className="border-cedu-blue/20 bg-cedu-blue-light/10" data-testid="admin-form-new-payment">
      <CardContent className="py-4 space-y-3">
        <p className="text-sm font-semibold text-cedu-ink">Nuevo pago — {MONTHS[month - 1]} {year}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select value={teamId} onValueChange={setTeamId}>
            <SelectTrigger className="bg-white text-sm" data-testid="admin-select-team">
              <SelectValue placeholder="Seleccionar empresa" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Monto (MXN)" value={amount} onChange={e => setAmount(e.target.value)} className="bg-white" data-testid="admin-input-amount" />
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="bg-white text-sm" data-testid="admin-select-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spei">SPEI</SelectItem>
              <SelectItem value="deposit">Depósito</SelectItem>
              <SelectItem value="domiciliation">Domiciliación</SelectItem>
              <SelectItem value="card">Tarjeta</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Referencia bancaria" value={reference} onChange={e => setReference(e.target.value)} className="bg-white" data-testid="admin-input-reference" />
        </div>
        <Input placeholder="Notas (opcional)" value={notes} onChange={e => setNotes(e.target.value)} className="bg-white" />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel} className="rounded-xl text-xs">Cancelar</Button>
          <Button
            size="sm"
            className="bg-cedu-blue hover:bg-cedu-blue/90 rounded-xl text-xs gap-1"
            disabled={!teamId || !amount || isPending}
            onClick={() => onSubmit({
              teamId,
              amount: Number(amount),
              paymentMethod: method,
              reference: reference || null,
              notes: notes || null,
              periodMonth: month,
              periodYear: year,
              status: "confirmed",
              paidAt: new Date().toISOString(),
            })}
            data-testid="admin-button-submit-payment"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Registrar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ComisionesCrmTab() {
  const { toast } = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: commissions = [], isLoading } = useQuery<CrmCommissionRow[]>({
    queryKey: ["/api/crm/commissions", month, year],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch(`/api/crm/commissions?month=${month}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch commissions");
      return res.json();
    },
  });

  const { data: prospectsList = [] } = useQuery<CrmProspect[]>({
    queryKey: ["/api/crm/prospects"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/crm/commissions/generate", { month, year });
      return res.json();
    },
    onSuccess: (data: { generated: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/commissions"] });
      toast({ title: `${data.generated} comisiones generadas` });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/crm/commissions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/commissions"] });
      toast({ title: "Comisión actualizada" });
    },
  });

  const updateProspectMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      await apiRequest("PATCH", `/api/crm/prospects/${id}`, { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/prospects"] });
      toast({ title: "Etapa actualizada" });
    },
  });

  const totalPending = commissions.filter(c => c.commission.status === "pending").reduce((s, c) => s + c.commission.amount, 0);
  const totalPaid = commissions.filter(c => c.commission.status === "paid").reduce((s, c) => s + c.commission.amount, 0);

  const partnerGroups = commissions.reduce<Record<string, CrmCommissionRow[]>>((acc, c) => {
    const key = c.commission.partnerId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const stages = ["contact", "demo", "proposal", "negotiation", "closed", "active"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-2xl text-cedu-ink" data-testid="text-admin-comisiones-title">Comisiones CRM</h2>
          <p className="text-sm text-cedu-ink-muted">Ranking de socios, comisiones y pipeline de ventas</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-24 h-8 text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-20 h-8 text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SmallStatCard label="Por pagar" value={formatMXN(totalPending)} sub="Comisiones pendientes" color="text-amber-600" icon={Clock} />
        <SmallStatCard label="Pagadas" value={formatMXN(totalPaid)} sub={`${MONTHS[month - 1]} ${year}`} color="text-cedu-green" icon={CheckCircle2} />
        <SmallStatCard label="Socios" value={String(Object.keys(partnerGroups).length)} sub="Con comisiones" color="text-cedu-violet" icon={UserCheck} />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-cedu-ink">Comisiones del período</h3>
        <Button
          size="sm"
          className="bg-cedu-violet hover:bg-cedu-violet/90 text-white rounded-xl gap-1 text-xs"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          data-testid="button-admin-generate-commissions"
        >
          {generateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Calcular comisiones
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : commissions.length === 0 ? (
        <Card className="border-black/[0.06]">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-cedu-ink-muted">No hay comisiones para este período.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(partnerGroups).map(([partnerId, items]) => {
            const partnerName = items[0].partnerName || partnerId.slice(0, 8);
            const total = items.reduce((s, c) => s + c.commission.amount, 0);
            return (
              <Card key={partnerId} className="border-black/[0.06]" data-testid={`admin-partner-group-${partnerId}`}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-cedu-violet-light rounded-lg flex items-center justify-center">
                        <UserCheck size={14} className="text-cedu-violet" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-cedu-ink">{partnerName}</p>
                        <p className="text-[10px] text-cedu-ink-muted">{items.length} empresa{items.length > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <span className="text-base font-bold text-cedu-violet">{formatMXN(total)}</span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map(c => {
                      const st = STATUS_LABELS[c.commission.status] || STATUS_LABELS.pending;
                      return (
                        <div key={c.commission.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-black/[0.02]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-cedu-ink">{c.teamName || c.commission.teamId}</span>
                            <span className="text-[10px] text-cedu-ink-muted">{c.commission.feePercent}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-cedu-ink">{formatMXN(c.commission.amount)}</span>
                            <Badge variant="outline" className={`text-[9px] h-4 ${st.color}`}>{st.label}</Badge>
                            {c.commission.status === "pending" && (
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] text-green-600" onClick={() => updateMutation.mutate({ id: c.commission.id, status: "paid" })}>
                                Pagar
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="border-t border-black/[0.06] pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-cedu-ink">Pipeline de ventas</h3>
          <span className="text-xs text-cedu-ink-muted">{prospectsList.length} prospecto{prospectsList.length !== 1 ? "s" : ""}</span>
        </div>
        {prospectsList.length === 0 ? (
          <p className="text-sm text-cedu-ink-muted text-center py-4">No hay prospectos en el pipeline</p>
        ) : (
          <div className="grid grid-cols-6 gap-3 overflow-x-auto" data-testid="kanban-pipeline">
            {stages.map(stage => {
              const stageInfo = STAGE_LABELS[stage];
              const stageProspects = prospectsList.filter(p => p.stage === stage);
              const nextStage = stages[stages.indexOf(stage) + 1];
              return (
                <div key={stage} className="min-w-[180px]">
                  <div className={`rounded-t-lg px-3 py-2 ${stageInfo.color} flex items-center justify-between`}>
                    <span className="text-xs font-bold">{stageInfo.label}</span>
                    <span className="text-[10px] font-semibold opacity-70">{stageProspects.length}</span>
                  </div>
                  <div className="bg-black/[0.02] rounded-b-lg min-h-[200px] p-2 space-y-2">
                    {stageProspects.map(p => (
                      <Card key={p.id} className="border-black/[0.08] shadow-sm" data-testid={`admin-prospect-${p.id}`}>
                        <CardContent className="p-2.5">
                          <p className="text-xs font-semibold text-cedu-ink truncate mb-1">{p.companyName}</p>
                          {p.contactName && <p className="text-[10px] text-cedu-ink-muted truncate">{p.contactName}</p>}
                          {p.contactEmail && <p className="text-[10px] text-cedu-ink-muted truncate">{p.contactEmail}</p>}
                          {nextStage && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[10px] text-cedu-blue gap-0.5 mt-1 w-full justify-start px-1"
                              onClick={() => updateProspectMutation.mutate({ id: p.id, stage: nextStage })}
                              data-testid={`prospect-advance-${p.id}`}
                            >
                              <ChevronRight size={10} /> {STAGE_LABELS[nextStage]?.label}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SoporteTab() {
  const { toast } = useToast();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: threads = [], isLoading, refetch: refetchThreads } = useQuery<SupportThread[]>({
    queryKey: ["/api/admin/support/threads"],
  });

  const { data: threadDetail, refetch: refetchMessages } = useQuery<{ thread: SupportThread; messages: SupportMessage[] }>({
    queryKey: ["/api/support/threads", selectedThread],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch(`/api/support/threads/${selectedThread}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar");
      return res.json();
    },
    enabled: !!selectedThread,
    refetchInterval: 10000,
  });

  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      const token = getAuthToken();
      const res = await fetch(`/api/support/threads/${selectedThread}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Error al enviar");
      return res.json();
    },
    onSuccess: () => {
      setReplyText("");
      refetchMessages();
      toast({ title: "Respuesta enviada" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = getAuthToken();
      const res = await fetch(`/api/support/threads/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      return res.json();
    },
    onSuccess: () => {
      refetchThreads();
      refetchMessages();
      toast({ title: "Estado actualizado" });
    },
  });

  const openCount = threads.filter(t => t.status === "open").length;

  if (selectedThread && threadDetail) {
    const thread = threadDetail.thread;
    const messages = threadDetail.messages || [];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedThread(null)} data-testid="button-back-threads">
            <ArrowLeft size={16} className="mr-1" /> Volver
          </Button>
          <div className="flex-1">
            <h3 className="font-serif text-lg text-cedu-ink">{thread.subject}</h3>
            <p className="text-xs text-cedu-ink-muted">
              {thread.userName || thread.userEmail || "Usuario"}
            </p>
          </div>
          <Badge className={thread.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
            {thread.status === "open" ? "Abierto" : "Cerrado"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleStatusMutation.mutate({ id: thread.id, status: thread.status === "open" ? "closed" : "open" })}
            data-testid="button-toggle-thread-status"
          >
            {thread.status === "open" ? "Cerrar" : "Reabrir"}
          </Button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto p-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-xl max-w-[80%] ${
                msg.senderRole === "advisor"
                  ? "ml-auto bg-cedu-blue text-white"
                  : "bg-black/[0.03]"
              }`}
              data-testid={`message-${msg.id}`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className={`text-[10px] mt-1 ${msg.senderRole === "advisor" ? "text-white/70" : "text-cedu-ink-muted"}`}>
                {msg.senderRole === "advisor" ? "Asesor" : "Estudiante"} · {new Date(msg.createdAt).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </div>

        {thread.status === "open" && (
          <div className="flex gap-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Escribe tu respuesta..."
              className="flex-1 min-h-[60px]"
              data-testid="input-reply-message"
            />
            <Button
              className="bg-cedu-blue hover:bg-cedu-blue/90 self-end"
              disabled={!replyText.trim() || replyMutation.isPending}
              onClick={() => replyMutation.mutate(replyText)}
              data-testid="button-send-reply"
            >
              {replyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-cedu-ink" data-testid="text-admin-soporte-title">Soporte</h2>
          <p className="text-sm text-cedu-ink-muted">Tickets de soporte académico</p>
        </div>
        {openCount > 0 && <Badge className="bg-amber-100 text-amber-700">{openCount} abierto{openCount > 1 ? "s" : ""}</Badge>}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : threads.length === 0 ? (
        <Card className="border-black/[0.06]">
          <CardContent className="py-10 text-center">
            <MessageCircle size={40} className="mx-auto text-cedu-ink-muted/40 mb-3" />
            <p className="text-sm text-cedu-ink-muted">No hay tickets de soporte</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <Card
              key={thread.id}
              className="border-black/[0.06] cursor-pointer hover:border-cedu-blue/20 transition-colors"
              onClick={() => setSelectedThread(thread.id)}
              data-testid={`thread-${thread.id}`}
            >
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    thread.status === "open" ? "bg-green-50" : "bg-gray-100"
                  }`}>
                    <MessageCircle size={18} className={thread.status === "open" ? "text-green-600" : "text-gray-400"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-cedu-ink truncate">{thread.subject}</p>
                    <p className="text-[10px] text-cedu-ink-muted">
                      {thread.userName || thread.userEmail || "Usuario"} · {new Date(thread.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <Badge className={thread.status === "open" ? "bg-green-100 text-green-700 text-[9px]" : "bg-gray-100 text-gray-500 text-[9px]"}>
                    {thread.status === "open" ? "Abierto" : "Cerrado"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

type EnhancedUserItem = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  accountType: string | null;
  accountSetup: number;
  country: string | null;
  city: string | null;
  phoneNumber: string | null;
  walletAddress: string | null;
  interest: string[] | null;
  genre: string | null;
  createdAt: string;
  teamName: string | null;
  lastAccessAt: string | null;
};

const PAGE_SIZE = 15;

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  socio_estudiante: { label: "Socio Estudiante", color: "bg-green-50 text-green-700" },
  socio_instructor: { label: "Socio Instructor", color: "bg-violet-50 text-violet-700" },
  socio_comercial: { label: "Socio Comercial", color: "bg-orange-50 text-orange-700" },
  director: { label: "Director", color: "bg-blue-50 text-blue-700" },
  empresa: { label: "Empresa", color: "bg-cyan-50 text-cyan-700" },
  empresa_rh: { label: "Empresa RH", color: "bg-cyan-50 text-cyan-700" },
  admin: { label: "Admin", color: "bg-red-50 text-red-700" },
  superadmin: { label: "Superadmin", color: "bg-red-50 text-red-700" },
  user: { label: "Socio Estudiante", color: "bg-green-50 text-green-700" },
  partner: { label: "Socio Comercial", color: "bg-orange-50 text-orange-700" },
  moderator: { label: "Moderador", color: "bg-teal-50 text-teal-700" },
  instructor: { label: "Socio Instructor", color: "bg-violet-50 text-violet-700" },
};

const ROLE_ACCESS_MAP: Record<string, string[]> = {
  socio_estudiante: ["Cursos STPS", "Certificaciones DC-3", "Conferencias Ceduverse", "Wallet Web3"],
  socio_instructor: ["Cursos STPS", "Certificaciones DC-3", "Conferencias Ceduverse", "Wallet Web3", "Impartir cursos", "Sesiones privadas", "Gemelo Digital", "Panel de instructor"],
  socio_comercial: ["Cursos STPS", "Certificaciones DC-3", "Wallet Web3", "CRM Comercial", "Gestión de prospectos", "Comisiones", "Kit Cooperativo"],
  director: ["Cursos STPS", "Certificaciones DC-3", "Wallet Web3", "CRM Comercial", "Gestión de prospectos", "Comisiones", "Kit Cooperativo", "Equipo comercial", "Métricas de zona"],
  empresa: ["Panel empresarial", "Gestión de empleados", "Objetivos de capacitación", "Reportes", "Facturación CFDI"],
  empresa_rh: ["Panel empresarial", "Gestión de empleados", "Objetivos de capacitación", "Reportes"],
  admin: ["Panel de administración", "Gestión de usuarios", "Gestión de cursos", "Certificados", "Soporte", "Empresas", "Blog"],
  superadmin: ["Panel de administración", "Gestión de usuarios", "Cambio de roles", "Configuración global", "Gestión de cursos", "Certificados", "Soporte", "Empresas", "Blog", "API externa", "Facturación"],
};

function RoleChangeDelta({ currentRole, newRole }: { currentRole: string; newRole: string }) {
  const currentAccess = ROLE_ACCESS_MAP[currentRole] || [];
  const newAccess = ROLE_ACCESS_MAP[newRole] || [];
  const gained = newAccess.filter(a => !currentAccess.includes(a));
  const lost = currentAccess.filter(a => !newAccess.includes(a));

  if (gained.length === 0 && lost.length === 0) return null;

  return (
    <div className="space-y-3 mt-3">
      {gained.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
            <ArrowUpRight size={12} /> Acceso que gana
          </p>
          <div className="flex flex-wrap gap-1">
            {gained.map(a => (
              <Badge key={a} className="bg-green-50 text-green-700 border-green-200 text-[10px]">{a}</Badge>
            ))}
          </div>
        </div>
      )}
      {lost.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
            <ArrowDownRight size={12} /> Acceso que pierde
          </p>
          <div className="flex flex-wrap gap-1">
            {lost.map(a => (
              <Badge key={a} className="bg-red-50 text-red-700 border-red-200 text-[10px]">{a}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserDetailPanel({ user, onClose, onUpdated }: { user: EnhancedUserItem; onClose: () => void; onUpdated: () => void }) {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [newRole, setNewRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertReason, setConvertReason] = useState("");
  const [convertCommission, setConvertCommission] = useState("15");
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState<{ referralCode?: string; commission: number } | null>(null);

  const isSuperadmin = (authUser as { role?: string } | undefined)?.role === "superadmin";
  // El tier "agente" (más bajo de socio comercial) es el punto de entrada desde estudiante.
  const canConvertToPartner = !["socio_comercial", "director", "admin", "superadmin"].includes(user.role);

  const { data: detailData } = useAdminFetch<{
    enrollments: number; completedCourses: number; achievements: number;
    isCooperativeMember: boolean;
    teams: { id: string; name: string; role: string }[];
    referralCode: string | null; referredBy: string | null;
    interest: string[];
    roleHistory: { previousRole: string; newRole: string; reason: string | null; changedAt: string }[];
    certificates: { id: string; certType: string; status: string; createdAt: string }[];
    enrolledCourses: { courseId: string; courseSlug: string; completed: number; enrolledAt: string; courseTitle: string | null }[];
    instructorCourses: { id: string; slug: string; title: string }[];
    termsHistory: { id: string; acceptedAt: string; versionTitle: string | null; versionType: string | null }[];
  }>(`/api/admin/users/${user.id}`);

  const handleRoleChange = async () => {
    if (newRole === user.role) return;
    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole, reason: reason.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al cambiar rol");
      }
      toast({ title: "Rol actualizado", description: `Nuevo rol: ${ROLE_LABELS[newRole]?.label || newRole}` });
      setConfirmOpen(false);
      setReason("");
      onUpdated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleConvertPartner = async () => {
    const commissionNum = Number(convertCommission);
    if (!Number.isInteger(commissionNum) || commissionNum < 0 || commissionNum > 100) {
      toast({ title: "Comisión inválida", description: "Debe ser un entero entre 0 y 100.", variant: "destructive" });
      return;
    }
    setConverting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/users/${user.id}/convert-partner`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ commission: commissionNum, reason: convertReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al convertir");
      setConvertResult({ referralCode: data.referralCode, commission: data.commission });
      toast({ title: "Convertido a socio comercial", description: `Comisión ${data.commission}% · Código ${data.referralCode || "existente"}` });
      onUpdated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setConverting(false);
    }
  };

  return (
    <Card className="border-black/[0.06]" data-testid="panel-user-detail">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-serif">Detalle del usuario</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-detail">
          <X size={16} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-cedu-blue/10 rounded-full flex items-center justify-center text-lg font-bold text-cedu-blue">
            {(user.fullName || user.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-cedu-ink">{user.fullName || "Sin nombre"}</p>
            <p className="text-xs text-cedu-ink-muted">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Rol</p>
            <RoleBadge role={user.role} />
          </div>
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Tipo cuenta</p>
            <p className="text-cedu-ink capitalize">{user.accountType || "free"}</p>
          </div>
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">País</p>
            <p className="text-cedu-ink">{user.country || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Ciudad</p>
            <p className="text-cedu-ink">{user.city || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Teléfono</p>
            <p className="text-cedu-ink">{user.phoneNumber || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Registro</p>
            <p className="text-cedu-ink text-xs">{new Date(user.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Setup</p>
            <p className="text-cedu-ink">{user.accountSetup}/4</p>
          </div>
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Wallet</p>
            <p className="text-cedu-ink text-[10px] font-mono truncate">{user.walletAddress || "—"}</p>
          </div>
        </div>

        {detailData && (
          <div className="space-y-3 pt-3 border-t border-black/[0.06]">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center p-2 bg-cedu-blue/5 rounded-lg">
                <p className="text-lg font-bold text-cedu-blue">{detailData.enrollments}</p>
                <p className="text-[10px] text-cedu-ink-muted">Cursos inscritos</p>
              </div>
              <div className="text-center p-2 bg-cedu-green/5 rounded-lg">
                <p className="text-lg font-bold text-cedu-green">{detailData.completedCourses}</p>
                <p className="text-[10px] text-cedu-ink-muted">Completados</p>
              </div>
              <div className="text-center p-2 bg-cedu-violet/5 rounded-lg">
                <p className="text-lg font-bold text-cedu-violet">{detailData.achievements}</p>
                <p className="text-[10px] text-cedu-ink-muted">Logros</p>
              </div>
            </div>

            {detailData.teams.length > 0 && (
              <div>
                <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold mb-1">Equipos / Empresas</p>
                <div className="space-y-1">
                  {detailData.teams.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs bg-black/[0.02] px-2 py-1 rounded" data-testid={`team-row-${t.id}`}>
                      <span className="text-cedu-ink">{t.name}</span>
                      <Badge variant="outline" className="text-[10px]">{t.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailData.referralCode && (
              <div>
                <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Código referido</p>
                <p className="text-xs text-cedu-ink font-mono">{detailData.referralCode}</p>
              </div>
            )}

            {detailData.referredBy && (
              <div>
                <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Referido por</p>
                <p className="text-xs text-cedu-ink font-mono">{detailData.referredBy}</p>
              </div>
            )}

            {detailData.interest && detailData.interest.length > 0 && (
              <div>
                <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold mb-1">Intereses</p>
                <div className="flex flex-wrap gap-1">
                  {detailData.interest.map((i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{i}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Membresía cooperativa</p>
              <Badge variant={detailData.isCooperativeMember ? "default" : "outline"} className="text-[10px]" data-testid="badge-coop-member">
                {detailData.isCooperativeMember ? "Socio cooperativista" : "No cooperativista"}
              </Badge>
            </div>

            {detailData.enrolledCourses && detailData.enrolledCourses.length > 0 && (
              <div>
                <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold mb-1">
                  <BookOpen size={12} className="inline mr-1" />Cursos inscritos (detalle)
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {detailData.enrolledCourses.map((c) => (
                    <div key={c.courseId} className="flex items-center justify-between text-xs bg-black/[0.02] px-2 py-1.5 rounded" data-testid={`enrolled-course-${c.courseId}`}>
                      <span className="text-cedu-ink truncate max-w-[60%]">{c.courseTitle || c.courseSlug}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-cedu-blue rounded-full" style={{ width: `${Math.min(c.completed, 100)}%` }} />
                        </div>
                        <span className="text-[10px] text-cedu-ink-muted w-8 text-right">{c.completed}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailData.instructorCourses && detailData.instructorCourses.length > 0 && (
              <div>
                <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold mb-1">
                  <Briefcase size={12} className="inline mr-1" />Cursos como instructor
                </p>
                <div className="space-y-1">
                  {detailData.instructorCourses.map((c) => (
                    <div key={c.id} className="text-xs bg-black/[0.02] px-2 py-1 rounded" data-testid={`instructor-course-${c.id}`}>
                      <span className="text-cedu-ink">{c.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailData.certificates && detailData.certificates.length > 0 && (
              <div>
                <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold mb-1">Certificados</p>
                <div className="space-y-1">
                  {detailData.certificates.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-xs bg-black/[0.02] px-2 py-1 rounded" data-testid={`cert-row-${c.id}`}>
                      <span className="text-cedu-ink capitalize">{c.certType.replace(/_/g, " ")}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
                        <span className="text-[10px] text-cedu-ink-muted">{new Date(c.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailData.termsHistory && detailData.termsHistory.length > 0 && (
              <div>
                <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold mb-1">
                  <FileCheck size={12} className="inline mr-1" />Aceptación de términos
                </p>
                <div className="space-y-1">
                  {detailData.termsHistory.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs bg-black/[0.02] px-2 py-1 rounded" data-testid={`terms-row-${t.id}`}>
                      <span className="text-cedu-ink">{t.versionTitle || t.versionType || "Términos"}</span>
                      <span className="text-[10px] text-cedu-ink-muted">{new Date(t.acceptedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailData.roleHistory && detailData.roleHistory.length > 0 && (
              <div>
                <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold mb-1">
                  <History size={12} className="inline mr-1" />Historial de roles
                </p>
                <div className="space-y-1">
                  {detailData.roleHistory.map((r, idx) => (
                    <div key={idx} className="text-xs bg-black/[0.02] px-2 py-1.5 rounded" data-testid={`role-history-${idx}`}>
                      <div className="flex items-center gap-1.5">
                        <RoleBadge role={r.previousRole} />
                        <ChevronRight size={12} className="text-cedu-ink-muted" />
                        <RoleBadge role={r.newRole} />
                      </div>
                      {r.reason && <p className="text-[10px] text-cedu-ink-muted mt-1 italic">"{r.reason}"</p>}
                      <p className="text-[10px] text-cedu-ink-muted">{new Date(r.changedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isSuperadmin && canConvertToPartner && (
          <div className="pt-3 border-t border-black/[0.06]">
            <div className="rounded-xl border border-cedu-green/30 bg-cedu-green/5 p-3">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-cedu-green/15 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={16} className="text-cedu-green" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-cedu-ink">Convertir a Socio Comercial</p>
                  <p className="text-[11px] text-cedu-ink-muted leading-snug mt-0.5">
                    Le asigna el rol de socio comercial (tier <strong>Agente</strong>) y le crea su
                    código para referir <strong>empresas</strong>. La comisión y el bono se pagan sobre
                    la primera aportación de la empresa referida.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => { setConvertResult(null); setConvertReason(""); setConvertCommission("15"); setConvertOpen(true); }}
                className="w-full mt-2.5 h-9 bg-cedu-green hover:bg-cedu-green/90"
                data-testid="button-convert-partner"
              >
                <Briefcase size={14} className="mr-1.5" /> Convertir a Socio Comercial
              </Button>
            </div>

            <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
              <DialogContent data-testid="dialog-convert-partner">
                <DialogHeader>
                  <DialogTitle className="font-serif text-lg">Convertir a Socio Comercial</DialogTitle>
                  <DialogDescription className="text-sm text-cedu-ink-muted">
                    <strong>{user.fullName || user.email}</strong> pasará de <RoleBadge role={user.role} /> a socio comercial (Agente).
                  </DialogDescription>
                </DialogHeader>

                {convertResult ? (
                  <div className="space-y-3 py-2 text-center" data-testid="convert-result">
                    <div className="w-12 h-12 rounded-full bg-cedu-green/15 flex items-center justify-center mx-auto">
                      <UserCheck size={24} className="text-cedu-green" />
                    </div>
                    <p className="text-sm text-cedu-ink font-semibold">¡Convertido a socio comercial!</p>
                    <div className="bg-black/[0.03] rounded-lg p-3 text-left space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-cedu-ink-muted">Comisión</span>
                        <span className="font-semibold text-cedu-ink">{convertResult.commission}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-cedu-ink-muted">Código para referir empresas</span>
                        <span className="font-mono font-semibold text-cedu-ink">{convertResult.referralCode || "—"}</span>
                      </div>
                    </div>
                    <Button onClick={() => setConvertOpen(false)} className="w-full h-9" data-testid="button-convert-done">Listo</Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Comisión sobre fee de empresa (%)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={convertCommission}
                          onChange={e => setConvertCommission(e.target.value)}
                          className="mt-1 h-9 text-sm"
                          data-testid="input-convert-commission"
                        />
                        <p className="text-[10px] text-cedu-ink-muted mt-1">Por defecto 15% (tier Agente). Ajústala si aplica otro nivel.</p>
                      </div>
                      <div>
                        <Label className="text-xs">Razón de la conversión <span className="text-red-500">*</span></Label>
                        <Textarea
                          value={convertReason}
                          onChange={e => setConvertReason(e.target.value)}
                          placeholder="Motivo de la conversión a socio comercial..."
                          className="mt-1 h-20 text-sm"
                          data-testid="input-convert-reason"
                          required
                        />
                        {convertReason.trim().length > 0 && convertReason.trim().length < 3 && (
                          <p className="text-[10px] text-red-500 mt-1">Mínimo 3 caracteres</p>
                        )}
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => setConvertOpen(false)} data-testid="button-cancel-convert">Cancelar</Button>
                      <Button
                        onClick={handleConvertPartner}
                        disabled={converting || convertReason.trim().length < 3}
                        className="bg-cedu-green hover:bg-cedu-green/90"
                        data-testid="button-confirm-convert"
                      >
                        {converting ? <Loader2 size={14} className="animate-spin mr-1" /> : <Briefcase size={14} className="mr-1" />}
                        Convertir
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {isSuperadmin && (
          <div className="pt-3 border-t border-black/[0.06]">
            <Label className="text-xs font-semibold text-cedu-ink-muted">Cambiar rol (solo superadmin)</Label>
            <div className="flex gap-2 mt-2">
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="h-9 flex-1" data-testid="select-change-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["socio_estudiante", "socio_instructor", "socio_comercial", "director", "empresa", "empresa_rh", "admin", "superadmin"].map(r => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]?.label || r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={newRole === user.role}
                onClick={() => setConfirmOpen(true)}
                className="h-9"
                data-testid="button-save-role"
              >
                Cambiar
              </Button>
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogContent data-testid="dialog-confirm-role-change">
                <DialogHeader>
                  <DialogTitle className="font-serif text-lg">Confirmar cambio de rol</DialogTitle>
                  <DialogDescription className="text-sm text-cedu-ink-muted">
                    Estás a punto de cambiar el rol de <strong>{user.fullName || user.email}</strong>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold mb-1">Rol actual</p>
                      <RoleBadge role={user.role} />
                    </div>
                    <ChevronRight size={18} className="text-cedu-ink-muted" />
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold mb-1">Nuevo rol</p>
                      <RoleBadge role={newRole} />
                    </div>
                  </div>

                  <RoleChangeDelta currentRole={user.role} newRole={newRole} />

                  <div>
                    <Label className="text-xs">Razón del cambio <span className="text-red-500">*</span></Label>
                    <Textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Describe el motivo del cambio de rol..."
                      className="mt-1 h-20 text-sm"
                      data-testid="input-role-change-reason"
                      required
                    />
                    {reason.trim().length > 0 && reason.trim().length < 3 && (
                      <p className="text-[10px] text-red-500 mt-1">Mínimo 3 caracteres</p>
                    )}
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setConfirmOpen(false)} data-testid="button-cancel-role-change">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRoleChange}
                    disabled={saving || reason.trim().length < 3}
                    className="bg-cedu-blue hover:bg-cedu-blue/90"
                    data-testid="button-confirm-role-change"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Shield size={14} className="mr-1" />}
                    Confirmar cambio
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EnhancedUsersTab() {
  const { data: usersList, loading, refetch } = useAdminFetch<EnhancedUserItem[]>("/api/admin/users");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [membershipFilter, setMembershipFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  if (loading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;

  const companyNames = Array.from(new Set((usersList || []).map(u => u.teamName).filter(Boolean))) as string[];

  const filtered = (usersList || []).filter(u => {
    const matchesSearch = !search ||
      (u.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesCompany = companyFilter === "all" || u.teamName === companyFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && u.accountSetup >= 4) ||
      (statusFilter === "incomplete" && u.accountSetup < 4) ||
      (statusFilter === "premium" && u.accountType === "premium") ||
      (statusFilter === "free" && (u.accountType === "free" || !u.accountType));
    const matchesMembership = membershipFilter === "all" ||
      (membershipFilter === "with_team" && u.teamName) ||
      (membershipFilter === "no_team" && !u.teamName);
    let matchesDate = true;
    if (dateFilter !== "all") {
      const d = new Date(u.createdAt);
      const now = new Date();
      if (dateFilter === "7d") matchesDate = (now.getTime() - d.getTime()) < 7 * 86400000;
      else if (dateFilter === "30d") matchesDate = (now.getTime() - d.getTime()) < 30 * 86400000;
      else if (dateFilter === "90d") matchesDate = (now.getTime() - d.getTime()) < 90 * 86400000;
    }
    return matchesSearch && matchesRole && matchesCompany && matchesDate && matchesStatus && matchesMembership;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-cedu-ink" data-testid="text-admin-users-title">Gestión de Usuarios</h2>
        <p className="text-sm text-cedu-ink-muted">{usersList?.length || 0} usuarios registrados</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            data-testid="input-search-users"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9" data-testid="filter-role">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            {Object.entries(ROLE_LABELS).map(([key, conf]) => (
              <SelectItem key={key} value={key}>{conf.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={companyFilter} onValueChange={v => { setCompanyFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44 h-9" data-testid="filter-company">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las empresas</SelectItem>
            {companyNames.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36 h-9" data-testid="filter-status">
            <SelectValue placeholder="Estatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="incomplete">Setup incompleto</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
        <Select value={membershipFilter} onValueChange={v => { setMembershipFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36 h-9" data-testid="filter-membership">
            <SelectValue placeholder="Membresía" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="with_team">Con empresa</SelectItem>
            <SelectItem value="no_team">Sin empresa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={v => { setDateFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36 h-9" data-testid="filter-date">
            <SelectValue placeholder="Fecha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fechas</SelectItem>
            <SelectItem value="7d">Últimos 7 días</SelectItem>
            <SelectItem value="30d">Últimos 30 días</SelectItem>
            <SelectItem value="90d">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9" data-testid="button-refresh-users">
          <RefreshCw size={14} className="mr-1" /> Actualizar
        </Button>
      </div>

      <Card className="border-black/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-users">
            <thead>
              <tr className="border-b border-black/[0.06] bg-black/[0.02]">
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Correo</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Rol</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Empresa</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Tipo Cuenta</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Último acceso</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Registro</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">País</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((u) => {
                const rl = ROLE_LABELS[u.role] || ROLE_LABELS.user;
                return (
                  <tr
                    key={u.id}
                    className={`border-b border-black/[0.04] hover:bg-black/[0.02] cursor-pointer transition-colors ${selectedUser === u.id ? "bg-cedu-blue/5" : ""}`}
                    onClick={() => setSelectedUser(selectedUser === u.id ? null : u.id)}
                    data-testid={`row-user-${u.id}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-cedu-blue/10 rounded-full flex items-center justify-center text-xs font-bold text-cedu-blue shrink-0">
                          {(u.fullName || u.email).charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-cedu-ink truncate max-w-[180px]">{u.fullName || "Sin nombre"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-cedu-ink-muted truncate max-w-[200px]">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-cedu-ink-muted text-xs truncate max-w-[150px]">{u.teamName || "—"}</td>
                    <td className="px-4 py-3 text-cedu-ink-muted capitalize">{u.accountType || "free"}</td>
                    <td className="px-4 py-3 text-cedu-ink-muted text-xs">
                      {u.lastAccessAt ? new Date(u.lastAccessAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-cedu-ink-muted text-xs">
                      {new Date(u.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-cedu-ink-muted text-xs">{u.country || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between" data-testid="pagination-users">
          <p className="text-xs text-cedu-ink-muted">
            Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">
              Anterior
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pg = i + 1;
              return (
                <Button
                  key={pg}
                  variant={currentPage === pg ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pg)}
                  data-testid={`button-page-${pg}`}
                >
                  {pg}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-cedu-ink-muted/30 mb-4" />
          <p className="text-cedu-ink-muted font-semibold">No se encontraron usuarios</p>
        </div>
      )}

      {selectedUser && (() => {
        const u = (usersList || []).find(x => x.id === selectedUser);
        if (!u) return null;
        return <UserDetailPanel user={u} onClose={() => setSelectedUser(null)} onUpdated={() => { refetch(); setSelectedUser(null); }} />;
      })()}
    </div>
  );
}

type OrgItem = {
  id: string;
  name: string;
  description: string | null;
  plan: string | null;
  memberCount: number;
  partnerId: string | null;
  partnerName: string | null;
  objectiveCount: number;
  status: string;
  rfc: string | null;
  feePercent: string | null;
  contractUrl: string | null;
  createdAt: string;
};

type OrgContribution = { id: string; month: number; year: number; totalAmount: number; cfdiStatus: string; generatedAt: string };

type OrgDetailData = OrgItem & {
  members: { userId: string; fullName: string | null; role: string; coursesEnrolled: number; coursesCompleted: number; avgProgress: number }[];
  objectives: { id: string; courseTitle: string; courseSlug: string; deadline: string | null }[];
  contributions: OrgContribution[];
  certificateCount: number;
};

function OrgDetailPanel({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const { data, loading } = useAdminFetch<OrgDetailData>(`/api/admin/orgs/${orgId}`);

  if (loading) return <Card className="border-black/[0.06]"><CardContent className="py-8 flex justify-center"><Loader2 className="animate-spin text-cedu-blue" /></CardContent></Card>;
  if (!data) return null;

  const statusColors: Record<string, string> = { active: "bg-green-100 text-green-700", inactive: "bg-gray-100 text-gray-600", suspended: "bg-red-100 text-red-700" };

  return (
    <Card className="border-black/[0.06]" data-testid="panel-org-detail">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-serif">Detalle de empresa</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-org-detail"><X size={16} /></Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#f28023]/10 rounded-xl flex items-center justify-center">
            <Building2 size={20} className="text-[#f28023]" />
          </div>
          <div>
            <p className="font-semibold text-cedu-ink text-lg">{data.name}</p>
            <p className="text-xs text-cedu-ink-muted">{data.description || "Sin descripción"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Plan</p>
            <p className="text-cedu-ink capitalize font-semibold">{data.plan || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Estado</p>
            <Badge className={statusColors[data.status || "active"] || statusColors.active}>{data.status || "active"}</Badge>
          </div>
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Colaboradores</p>
            <p className="text-cedu-ink font-semibold">{data.memberCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Socio referente</p>
            <p className="text-cedu-ink text-xs">{data.partnerName || "Directo"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">RFC</p>
            <p className="text-cedu-ink font-semibold" data-testid="org-rfc">{data.rfc || "Sin registrar"}</p>
          </div>
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Comisión (%)</p>
            <p className="text-cedu-ink font-semibold" data-testid="org-fee">{data.feePercent ? `${data.feePercent}%` : "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-cedu-ink-muted uppercase font-semibold">Contrato</p>
            {data.contractUrl ? (
              <a href={data.contractUrl} target="_blank" rel="noopener noreferrer" className="text-cedu-blue text-xs underline" data-testid="org-contract-link">Ver contrato</a>
            ) : (
              <p className="text-cedu-ink-muted text-xs" data-testid="org-contract">Sin contrato</p>
            )}
          </div>
        </div>

        {data.members && data.members.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-cedu-ink-muted uppercase mb-2">Colaboradores ({data.members.length})</h4>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {data.members.map(m => (
                <div key={m.userId} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-black/[0.02]" data-testid={`org-member-${m.userId}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-cedu-blue/10 rounded-full flex items-center justify-center text-[10px] font-bold text-cedu-blue">
                      {(m.fullName || "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-cedu-ink font-medium">{m.fullName || "Sin nombre"}</span>
                    <Badge variant="outline" className="text-[9px] h-4">{m.role}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-cedu-ink-muted">
                    <span>{m.coursesCompleted}/{m.coursesEnrolled} cursos</span>
                    <span>{m.avgProgress}% avg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.objectives && data.objectives.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-cedu-ink-muted uppercase mb-2">Objetivos ({data.objectives.length})</h4>
            <div className="space-y-1.5">
              {data.objectives.map(obj => (
                <div key={obj.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-black/[0.02]">
                  <span className="text-xs text-cedu-ink">{obj.courseTitle}</span>
                  {obj.deadline && <span className="text-[10px] text-cedu-ink-muted">{new Date(obj.deadline).toLocaleDateString("es-MX")}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.contributions && data.contributions.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-cedu-ink-muted uppercase mb-2">Aportaciones recientes ({data.contributions.length})</h4>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
              {data.contributions.map(c => {
                const cfdiColors: Record<string, string> = { pending: "bg-amber-100 text-amber-700", emitido: "bg-green-100 text-green-700", cancelado: "bg-red-100 text-red-700" };
                return (
                  <div key={c.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-black/[0.02]" data-testid={`org-contribution-${c.id}`}>
                    <span className="text-xs text-cedu-ink">{MONTHS[c.month - 1]} {c.year}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-cedu-ink">{formatMXN(c.totalAmount)}</span>
                      <Badge className={`text-[9px] h-4 ${cfdiColors[c.cfdiStatus] || cfdiColors.pending}`}>{c.cfdiStatus}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm pt-2 border-t border-black/[0.06]">
          <div className="flex items-center gap-1.5">
            <Award size={14} className="text-cedu-violet" />
            <span className="text-cedu-ink font-semibold">{data.certificateCount || 0}</span>
            <span className="text-cedu-ink-muted text-xs">certificados emitidos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EnhancedOrgsTab() {
  const { data: orgsList, loading, refetch } = useAdminFetch<OrgItem[]>("/api/admin/orgs");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;

  const filtered = (orgsList || []).filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase()) || (o.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const planColors: Record<string, string> = {
    impulsa: "bg-blue-50 text-blue-700",
    transforma: "bg-violet-50 text-violet-700",
    lidera: "bg-amber-50 text-amber-700",
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
    suspended: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-cedu-ink" data-testid="text-admin-orgs-title">Gestión de Empresas</h2>
        <p className="text-sm text-cedu-ink-muted">{orgsList?.length || 0} organizaciones registradas</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            data-testid="input-search-orgs"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9" data-testid="button-refresh-orgs">
          <RefreshCw size={14} className="mr-1" /> Actualizar
        </Button>
      </div>

      {selectedOrg && (
        <OrgDetailPanel orgId={selectedOrg} onClose={() => setSelectedOrg(null)} />
      )}

      <Card className="border-black/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-orgs">
            <thead>
              <tr className="border-b border-black/[0.06] bg-black/[0.02]">
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Empresa</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">RFC</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Plan</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Comisión</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Colaboradores</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Socio Referente</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Registro</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((o) => (
                <tr
                  key={o.id}
                  className={`border-b border-black/[0.04] hover:bg-black/[0.02] cursor-pointer transition-colors ${selectedOrg === o.id ? "bg-cedu-blue/5" : ""}`}
                  onClick={() => setSelectedOrg(selectedOrg === o.id ? null : o.id)}
                  data-testid={`row-org-${o.id}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-[#f28023]/10 rounded-lg flex items-center justify-center">
                        <Building2 size={14} className="text-[#f28023]" />
                      </div>
                      <span className="font-semibold text-cedu-ink">{o.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-cedu-ink-muted text-xs font-mono">{o.rfc || "—"}</td>
                  <td className="px-4 py-3">
                    {o.plan ? (
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-md capitalize ${planColors[o.plan] || "bg-gray-100 text-gray-600"}`}>
                        {o.plan}
                      </span>
                    ) : (
                      <span className="text-cedu-ink-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] ${statusColors[o.status || "active"] || statusColors.active}`}>
                      {o.status || "active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-cedu-ink-muted text-xs">{o.feePercent ? `${o.feePercent}%` : "—"}</td>
                  <td className="px-4 py-3 text-cedu-ink font-semibold">{o.memberCount}</td>
                  <td className="px-4 py-3 text-cedu-ink-muted text-xs">{o.partnerName || "Directo"}</td>
                  <td className="px-4 py-3 text-cedu-ink-muted text-xs">
                    {new Date(o.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between" data-testid="pagination-orgs">
          <p className="text-xs text-cedu-ink-muted">
            Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>
              Anterior
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pg = i + 1;
              return (
                <Button key={pg} variant={currentPage === pg ? "default" : "outline"} size="sm" onClick={() => setPage(pg)}>
                  {pg}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Building2 size={48} className="mx-auto text-cedu-ink-muted/30 mb-4" />
          <p className="text-cedu-ink-muted font-semibold">No se encontraron organizaciones</p>
        </div>
      )}
    </div>
  );
}

function DispersionPlaceholder() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-cedu-ink" data-testid="text-admin-dispersion-title">Dispersión</h2>
        <p className="text-sm text-cedu-ink-muted">Gestión de dispersiones financieras</p>
      </div>
      <Card className="border-dashed border-2 border-black/[0.08]">
        <CardContent className="py-16 text-center">
          <Wallet size={48} className="mx-auto text-cedu-ink-muted/30 mb-4" />
          <p className="text-cedu-ink-muted font-semibold">Módulo en desarrollo</p>
          <p className="text-sm text-cedu-ink-muted mt-1">Próximamente: dispersión de fondos a socios y proveedores</p>
        </CardContent>
      </Card>
    </div>
  );
}

type ConfigItem = {
  key: string;
  value: any;
  category: string;
  label: string;
  description: string | null;
  valueType: string;
  updatedBy: string | null;
  updatedAt: string;
};

const CATEGORY_META: Record<string, { label: string; icon: typeof Settings; color: string }> = {
  features: { label: "Feature Flags", icon: Zap, color: "text-[#7c3aed]" },
  platform: { label: "Plataforma", icon: Globe, color: "text-[#1b5adf]" },
  notifications: { label: "Notificaciones", icon: Mail, color: "text-[#f28023]" },
  general: { label: "General", icon: Settings, color: "text-cedu-ink-muted" },
};

function ConfiguracionTab() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const { data: configs, loading, refetch } = useAdminFetch<ConfigItem[]>("/api/admin/config");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const isSuperadmin = (authUser as { role?: string } | undefined)?.role === "superadmin";

  const grouped = (configs || []).reduce<Record<string, ConfigItem[]>>((acc, c) => {
    const cat = c.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {});

  const handleToggle = async (item: ConfigItem) => {
    if (!isSuperadmin) return;
    setSavingKey(item.key);
    try {
      const newVal = item.value === true || item.value === "true" ? false : true;
      const token = getAuthToken();
      const res = await fetch(`/api/admin/config/${item.key}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ value: newVal }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      toast({ title: "Configuración actualizada", description: item.label });
      refetch();
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSave = async (item: ConfigItem) => {
    if (!isSuperadmin) return;
    setSavingKey(item.key);
    try {
      const raw = editValues[item.key];
      let parsed: any = raw;
      if (item.valueType === "number") parsed = Number(raw);
      else if (item.valueType === "string") parsed = raw;
      else parsed = raw;

      const token = getAuthToken();
      const res = await fetch(`/api/admin/config/${item.key}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ value: parsed }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      toast({ title: "Configuración actualizada", description: item.label });
      setEditValues(prev => { const n = { ...prev }; delete n[item.key]; return n; });
      refetch();
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  const getDisplayValue = (item: ConfigItem): string => {
    if (typeof item.value === "string") return item.value;
    return JSON.stringify(item.value);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-cedu-ink" data-testid="text-admin-config-title">Configuración Global</h2>
        <p className="text-sm text-cedu-ink-muted">
          {isSuperadmin ? "Gestiona feature flags y variables de la plataforma" : "Vista de la configuración actual (solo lectura)"}
        </p>
      </div>

      {Object.entries(grouped).map(([category, items]) => {
        const meta = CATEGORY_META[category] || CATEGORY_META.general;
        return (
          <Card key={category} className="border-black/[0.06]" data-testid={`card-config-${category}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif flex items-center gap-2">
                <meta.icon size={18} className={meta.color} />
                {meta.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {items.map(item => {
                const isBool = item.valueType === "boolean";
                const isOn = item.value === true || item.value === "true";
                const editVal = editValues[item.key];
                const currentDisplay = getDisplayValue(item);

                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-black/[0.02] transition-colors"
                    data-testid={`config-item-${item.key}`}
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-semibold text-cedu-ink">{item.label}</p>
                      {item.description && (
                        <p className="text-[11px] text-cedu-ink-muted mt-0.5">{item.description}</p>
                      )}
                    </div>

                    {isBool ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isOn}
                          onCheckedChange={() => handleToggle(item)}
                          disabled={!isSuperadmin || savingKey === item.key}
                          data-testid={`switch-${item.key}`}
                        />
                        {savingKey === item.key && <Loader2 size={14} className="animate-spin text-cedu-ink-muted" />}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {editVal !== undefined ? (
                          <>
                            <Input
                              value={editVal}
                              onChange={e => setEditValues(prev => ({ ...prev, [item.key]: e.target.value }))}
                              className="h-8 w-40 text-sm"
                              data-testid={`input-config-${item.key}`}
                            />
                            <Button
                              size="sm"
                              className="h-8 px-3"
                              onClick={() => handleSave(item)}
                              disabled={savingKey === item.key}
                              data-testid={`button-save-config-${item.key}`}
                            >
                              {savingKey === item.key ? <Loader2 size={12} className="animate-spin" /> : "Guardar"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => setEditValues(prev => { const n = { ...prev }; delete n[item.key]; return n; })}
                            >
                              <X size={14} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="text-sm text-cedu-ink font-mono bg-black/[0.03] px-2 py-1 rounded" data-testid={`value-${item.key}`}>
                              {currentDisplay}
                            </span>
                            {isSuperadmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => setEditValues(prev => ({ ...prev, [item.key]: currentDisplay.replace(/^"|"$/g, "") }))}
                                data-testid={`button-edit-config-${item.key}`}
                              >
                                <Settings size={14} />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SmallStatCard({ label, value, sub, color, icon: Icon }: {
  label: string;
  value: string;
  sub: string;
  color: string;
  icon: typeof DollarSign;
}) {
  return (
    <Card className="border-black/[0.06]">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={14} className={color} />
          <span className="text-[10px] text-cedu-ink-muted font-semibold uppercase tracking-wide">{label}</span>
        </div>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-cedu-ink-muted mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

type InvoiceRow = {
  id: string;
  teamId: string;
  contributionId: string | null;
  invoiceType: string;
  facturapiInvoiceId: string | null;
  cfdiUuid: string | null;
  series: string | null;
  folioNumber: number | null;
  status: string;
  total: string;
  subtotal: string;
  tax: string;
  currency: string;
  concept: string;
  createdAt: string;
};

type OrgForInvoice = { id: string; name: string; rfc: string | null; razonSocial: string | null; regimenFiscal: string | null; codigoPostalFiscal: string | null; facturapiCustomerId: string | null };

function FacturacionTab() {
  const { toast } = useToast();
  const token = getAuthToken();
  const [showCreate, setShowCreate] = useState(false);
  const [showFiscal, setShowFiscal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgForInvoice | null>(null);
  const [filterTeam, setFilterTeam] = useState("");

  const [fiscalForm, setFiscalForm] = useState({ rfc: "", razonSocial: "", regimenFiscal: "", codigoPostalFiscal: "" });
  const [createForm, setCreateForm] = useState({ teamId: "", contributionId: "", invoiceType: "contribution" as string, concept: "", subtotal: "" });
  const [savingFiscal, setSavingFiscal] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const { data: orgs = [] } = useQuery<OrgForInvoice[]>({ queryKey: ["/api/admin/orgs"] });
  const { data: allInvoices = [], refetch: refetchInvoices } = useQuery<InvoiceRow[]>({
    queryKey: ["/api/admin/invoices", filterTeam],
    queryFn: async () => {
      const url = filterTeam && filterTeam !== "all" ? `/api/admin/invoices?teamId=${filterTeam}` : "/api/admin/invoices";
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Error al cargar facturas");
      return res.json();
    },
  });

  const { data: facStatus } = useQuery<{ configured: boolean; sandbox: boolean | null }>({ queryKey: ["/api/facturapi/status"] });

  const orgMap = Object.fromEntries(orgs.map((o: OrgForInvoice) => [o.id, o]));

  async function handleSaveFiscal() {
    if (!selectedOrg) return;
    setSavingFiscal(true);
    try {
      const res = await fetch(`/api/admin/orgs/${selectedOrg.id}/fiscal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(fiscalForm),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error"); }
      toast({ title: "Datos fiscales guardados" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orgs"] });
      setShowFiscal(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSavingFiscal(false); }
  }

  async function handleCreateInvoice() {
    setCreatingInvoice(true);
    try {
      const body = {
        teamId: createForm.teamId,
        contributionId: createForm.contributionId || undefined,
        invoiceType: createForm.invoiceType,
        concept: createForm.concept,
        subtotal: parseFloat(createForm.subtotal),
      };
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error al crear factura"); }
      toast({ title: "Factura creada exitosamente" });
      refetchInvoices();
      setShowCreate(false);
      setCreateForm({ teamId: "", contributionId: "", invoiceType: "contribution", concept: "", subtotal: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setCreatingInvoice(false); }
  }

  async function handleCancel(inv: InvoiceRow) {
    if (!confirm("¿Cancelar esta factura? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/admin/invoices/${inv.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: "02" }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error"); }
      toast({ title: "Factura cancelada" });
      refetchInvoices();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  async function handleDownload(inv: InvoiceRow, format: "pdf" | "xml") {
    try {
      const res = await fetch(`/api/admin/invoices/${inv.id}/download/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CFDI-${inv.cfdiUuid || inv.id}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  const statusBadge = (s: string) => {
    if (s === "active") return <Badge className="bg-green-100 text-green-700" data-testid="badge-status-active">Activa</Badge>;
    if (s === "cancelled") return <Badge className="bg-red-100 text-red-700" data-testid="badge-status-cancelled">Cancelada</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700" data-testid="badge-status-draft">Borrador</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="tab-facturacion">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-cedu-ink font-serif">Facturación CFDI 4.0</h2>
          <p className="text-sm text-cedu-ink-muted">
            {facStatus?.configured
              ? <span className="text-green-600">Facturapi conectado {facStatus.sandbox ? <Badge className="bg-yellow-100 text-yellow-700 ml-1 text-[10px]">Sandbox</Badge> : <Badge className="bg-green-100 text-green-700 ml-1 text-[10px]">Producción</Badge>}</span>
              : <span className="text-yellow-600">Facturapi no configurado — las facturas se guardan como borrador</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowFiscal(true); setSelectedOrg(null); }} data-testid="btn-datos-fiscales">
            <Building2 size={14} className="mr-1" /> Datos Fiscales
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)} data-testid="btn-nueva-factura">
            <Plus size={14} className="mr-1" /> Nueva Factura
          </Button>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Label className="text-sm">Filtrar por empresa:</Label>
        <Select value={filterTeam} onValueChange={setFilterTeam}>
          <SelectTrigger className="w-64" data-testid="select-filter-team">
            <SelectValue placeholder="Todas las empresas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {orgs.map((o: OrgForInvoice) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterTeam && filterTeam !== "all" && (
          <Button size="sm" variant="ghost" onClick={() => setFilterTeam("")} data-testid="btn-clear-filter">
            <X size={14} />
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-invoices">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3">Folio</th>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Concepto</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-right">IVA</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">UUID CFDI</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {allInvoices.length === 0 ? (
                  <tr><td colSpan={11} className="p-6 text-center text-cedu-ink-muted">Sin facturas registradas</td></tr>
                ) : allInvoices.map((inv: InvoiceRow) => (
                  <tr key={inv.id} className="border-t hover:bg-gray-50/50" data-testid={`row-invoice-${inv.id}`}>
                    <td className="p-3 font-mono text-xs">{inv.series ? `${inv.series}-${inv.folioNumber}` : "—"}</td>
                    <td className="p-3">{orgMap[inv.teamId]?.name || inv.teamId}</td>
                    <td className="p-3"><Badge variant="outline">{inv.invoiceType === "contribution" ? "Aportación" : "Certificación"}</Badge></td>
                    <td className="p-3 max-w-[200px] truncate">{inv.concept}</td>
                    <td className="p-3 text-right font-mono">${parseFloat(inv.subtotal).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono">${parseFloat(inv.tax).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono font-semibold">${parseFloat(inv.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                    <td className="p-3">{statusBadge(inv.status)}</td>
                    <td className="p-3 font-mono text-xs max-w-[160px] truncate">{inv.cfdiUuid || "—"}</td>
                    <td className="p-3 text-xs">{new Date(inv.createdAt).toLocaleDateString("es-MX")}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {inv.facturapiInvoiceId && inv.status === "active" && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleDownload(inv, "pdf")} title="Descargar PDF" data-testid={`btn-download-pdf-${inv.id}`}>
                              <Download size={14} />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDownload(inv, "xml")} title="Descargar XML" data-testid={`btn-download-xml-${inv.id}`}>
                              <FileText size={14} />
                            </Button>
                          </>
                        )}
                        {inv.status === "active" && (
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleCancel(inv)} title="Cancelar" data-testid={`btn-cancel-${inv.id}`}>
                            <Ban size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showFiscal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" data-testid="modal-fiscal">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Datos Fiscales de Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Seleccionar Empresa</Label>
                <Select value={selectedOrg?.id || ""} onValueChange={(v) => {
                  const org = orgs.find((o: OrgForInvoice) => o.id === v);
                  if (org) {
                    setSelectedOrg(org);
                    setFiscalForm({
                      rfc: org.rfc || "",
                      razonSocial: org.razonSocial || "",
                      regimenFiscal: org.regimenFiscal || "",
                      codigoPostalFiscal: org.codigoPostalFiscal || "",
                    });
                  }
                }}>
                  <SelectTrigger data-testid="select-org-fiscal"><SelectValue placeholder="Elegir empresa" /></SelectTrigger>
                  <SelectContent>
                    {orgs.map((o: OrgForInvoice) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {selectedOrg && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>RFC</Label>
                      <Input value={fiscalForm.rfc} onChange={e => setFiscalForm(p => ({ ...p, rfc: e.target.value.toUpperCase() }))} placeholder="XAXX010101000" maxLength={13} data-testid="input-rfc" />
                    </div>
                    <div>
                      <Label>C.P. Fiscal</Label>
                      <Input value={fiscalForm.codigoPostalFiscal} onChange={e => setFiscalForm(p => ({ ...p, codigoPostalFiscal: e.target.value }))} placeholder="06600" maxLength={5} data-testid="input-cp" />
                    </div>
                  </div>
                  <div>
                    <Label>Razón Social</Label>
                    <Input value={fiscalForm.razonSocial} onChange={e => setFiscalForm(p => ({ ...p, razonSocial: e.target.value }))} placeholder="Empresa S.A. de C.V." data-testid="input-razon-social" />
                  </div>
                  <div>
                    <Label>Régimen Fiscal</Label>
                    <Select value={fiscalForm.regimenFiscal} onValueChange={v => setFiscalForm(p => ({ ...p, regimenFiscal: v }))}>
                      <SelectTrigger data-testid="select-regimen"><SelectValue placeholder="Seleccionar régimen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="601">601 — General de Ley PM</SelectItem>
                        <SelectItem value="603">603 — Personas Morales Sin Fines de Lucro</SelectItem>
                        <SelectItem value="605">605 — Sueldos y Salarios</SelectItem>
                        <SelectItem value="606">606 — Arrendamiento</SelectItem>
                        <SelectItem value="607">607 — Enajenación de Bienes</SelectItem>
                        <SelectItem value="608">608 — Demás Ingresos</SelectItem>
                        <SelectItem value="610">610 — Residentes en el Extranjero</SelectItem>
                        <SelectItem value="612">612 — Personas Físicas con Actividad Empresarial</SelectItem>
                        <SelectItem value="616">616 — Sin Obligaciones Fiscales</SelectItem>
                        <SelectItem value="620">620 — Sociedades Cooperativas de Producción</SelectItem>
                        <SelectItem value="621">621 — Incorporación Fiscal</SelectItem>
                        <SelectItem value="622">622 — Actividades Agrícolas</SelectItem>
                        <SelectItem value="625">625 — Régimen Simplificado de Confianza</SelectItem>
                        <SelectItem value="626">626 — RESICO Persona Moral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedOrg.facturapiCustomerId && (
                    <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> Sincronizado con Facturapi</p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowFiscal(false)} data-testid="btn-cancel-fiscal">Cancelar</Button>
                    <Button onClick={handleSaveFiscal} disabled={savingFiscal || !fiscalForm.rfc || !fiscalForm.razonSocial || !fiscalForm.regimenFiscal || !fiscalForm.codigoPostalFiscal} data-testid="btn-save-fiscal">
                      {savingFiscal ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Guardar
                    </Button>
                  </div>
                </>
              )}
              {!selectedOrg && (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowFiscal(false)}>Cerrar</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" data-testid="modal-create-invoice">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-lg font-serif">Emitir Factura CFDI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Empresa</Label>
                <Select value={createForm.teamId} onValueChange={v => setCreateForm(p => ({ ...p, teamId: v }))}>
                  <SelectTrigger data-testid="select-org-invoice"><SelectValue placeholder="Seleccionar empresa" /></SelectTrigger>
                  <SelectContent>
                    {orgs.filter((o: OrgForInvoice) => o.rfc && o.razonSocial).map((o: OrgForInvoice) => (
                      <SelectItem key={o.id} value={o.id}>{o.name} — {o.rfc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createForm.teamId && !orgMap[createForm.teamId]?.facturapiCustomerId && facStatus?.configured && (
                  <p className="text-xs text-yellow-600 mt-1">Empresa sin sincronizar con Facturapi — la factura se guardará como borrador.</p>
                )}
              </div>
              <div>
                <Label>Tipo de Factura</Label>
                <Select value={createForm.invoiceType} onValueChange={v => setCreateForm(p => ({ ...p, invoiceType: v }))}>
                  <SelectTrigger data-testid="select-invoice-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contribution">Aportación Mensual</SelectItem>
                    <SelectItem value="certification">Certificación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Concepto</Label>
                <Input value={createForm.concept} onChange={e => setCreateForm(p => ({ ...p, concept: e.target.value }))} placeholder="Aportación mensual cooperativa — Marzo 2026" data-testid="input-concept" />
              </div>
              <div>
                <Label>Subtotal (antes de IVA)</Label>
                <Input type="number" step="0.01" value={createForm.subtotal} onChange={e => setCreateForm(p => ({ ...p, subtotal: e.target.value }))} placeholder="10000.00" data-testid="input-subtotal" />
                {createForm.subtotal && (
                  <p className="text-xs text-cedu-ink-muted mt-1">
                    IVA 16%: ${(parseFloat(createForm.subtotal) * 0.16).toLocaleString("es-MX", { minimumFractionDigits: 2 })} — Total: ${(parseFloat(createForm.subtotal) * 1.16).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreate(false)} data-testid="btn-cancel-create">Cancelar</Button>
                <Button onClick={handleCreateInvoice} disabled={creatingInvoice || !createForm.teamId || !createForm.concept || !createForm.subtotal} data-testid="btn-emit-invoice">
                  {creatingInvoice ? <Loader2 size={14} className="animate-spin mr-1" /> : <Receipt size={14} className="mr-1" />} Emitir Factura
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function AdminSegurosTab() {
  const { data: enrollments, isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/insurance/enrollments"] });
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...body }: { id: string; status?: string; policyNumber?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/insurance/enrollment/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/insurance/enrollments"] });
      toast({ title: "Actualizado", description: "Enrollment actualizado correctamente." });
    },
  });

  const stats = enrollments ? {
    total: enrollments.length,
    active: enrollments.filter((e: any) => e.enrollment.status === "active").length,
    pending: enrollments.filter((e: any) => e.enrollment.status === "pending").length,
  } : { total: 0, active: 0, pending: 0 };

  return (
    <div className="space-y-6" data-testid="admin-seguros-tab">
      <div>
        <h2 className="font-serif text-2xl text-cedu-ink">Seguros</h2>
        <p className="text-sm text-cedu-ink-muted">Gestiona las pólizas de seguros de los socios</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-[10px] text-cedu-ink-muted uppercase tracking-wide">Total asegurados</p>
          <p className="text-2xl font-bold text-cedu-ink">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[10px] text-cedu-ink-muted uppercase tracking-wide">Activos</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[10px] text-cedu-ink-muted uppercase tracking-wide">Pendientes</p>
          <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
        </CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#1b5adf]" /></div>
      ) : !enrollments?.length ? (
        <Card><CardContent className="py-10 text-center">
          <HeartPulse className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-cedu-ink-muted">No hay solicitudes de seguros aún</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Monto</th>
                  <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Póliza</th>
                  <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Acciones</th>
                </tr></thead>
                <tbody className="divide-y">
                  {enrollments.map((row: any) => (
                    <tr key={row.enrollment.id} className="hover:bg-gray-50/50" data-testid={`enrollment-row-${row.enrollment.id}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-cedu-ink">{row.user.fullName}</p>
                        <p className="text-xs text-cedu-ink-muted">{row.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-cedu-ink">{row.plan.name}</td>
                      <td className="px-4 py-3 text-cedu-ink font-mono">${parseFloat(row.enrollment.monthlyAmount || "0").toLocaleString("es-MX")}</td>
                      <td className="px-4 py-3">
                        <Badge variant={row.enrollment.status === "active" ? "default" : row.enrollment.status === "pending" ? "secondary" : "destructive"}>
                          {row.enrollment.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-cedu-ink-muted">{row.enrollment.policyNumber || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {row.enrollment.status === "pending" && (
                            <Button size="sm" variant="outline" className="text-xs h-7"
                              onClick={() => updateMutation.mutate({ id: row.enrollment.id, status: "active" })}
                              data-testid={`btn-activate-${row.enrollment.id}`}>
                              <CheckCircle2 size={12} className="mr-1" /> Activar
                            </Button>
                          )}
                          {row.enrollment.status === "active" && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200"
                              onClick={() => updateMutation.mutate({ id: row.enrollment.id, status: "suspended" })}
                              data-testid={`btn-suspend-${row.enrollment.id}`}>
                              <Ban size={12} className="mr-1" /> Suspender
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AdminMembershipsTab() {
  const { data: memberships, isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/memberships"] });
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, separationReason }: { id: string; status: string; separationReason?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/memberships/${id}/status`, { status, separationReason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/memberships"] });
      toast({ title: "Actualizado", description: "Estado de membresía actualizado." });
    },
  });

  const statusColors: Record<string, string> = {
    activo: "bg-cedu-green/10 text-cedu-green",
    suspendido: "bg-yellow-100 text-yellow-700",
    separado: "bg-gray-100 text-gray-600",
    excluido: "bg-red-100 text-red-600",
  };

  const stats = memberships ? {
    total: memberships.length,
    activos: memberships.filter((m: any) => m.status === "activo").length,
    suspendidos: memberships.filter((m: any) => m.status === "suspendido").length,
    separados: memberships.filter((m: any) => m.status === "separado" || m.status === "excluido").length,
  } : { total: 0, activos: 0, suspendidos: 0, separados: 0 };

  return (
    <div className="space-y-6" data-testid="admin-memberships-tab">
      <div>
        <h2 className="font-serif text-2xl text-cedu-ink">Membresías Cooperativas</h2>
        <p className="text-sm text-cedu-ink-muted">Gestiona los socios cooperativistas de Ceduverse S. C de C de Rl de CV</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-2xl font-bold font-serif text-cedu-ink">{stats.total}</p>
          <p className="text-xs text-cedu-ink-muted">Total socios</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-2xl font-bold font-serif text-cedu-green">{stats.activos}</p>
          <p className="text-xs text-cedu-ink-muted">Activos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-2xl font-bold font-serif text-yellow-600">{stats.suspendidos}</p>
          <p className="text-xs text-cedu-ink-muted">Suspendidos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-2xl font-bold font-serif text-red-500">{stats.separados}</p>
          <p className="text-xs text-cedu-ink-muted">Separados/Excluidos</p>
        </CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-cedu-blue" size={24} /></div>
      ) : !memberships?.length ? (
        <Card><CardContent className="py-12 text-center text-cedu-ink-muted">No hay membresías registradas aún.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-memberships">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left p-3 font-semibold text-cedu-ink-muted">Número</th>
                    <th className="text-left p-3 font-semibold text-cedu-ink-muted">Nombre</th>
                    <th className="text-left p-3 font-semibold text-cedu-ink-muted">Correo</th>
                    <th className="text-left p-3 font-semibold text-cedu-ink-muted">Tipo</th>
                    <th className="text-left p-3 font-semibold text-cedu-ink-muted">Estado</th>
                    <th className="text-left p-3 font-semibold text-cedu-ink-muted">Fecha</th>
                    <th className="text-left p-3 font-semibold text-cedu-ink-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {memberships.map((m: any) => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50/50" data-testid={`row-membership-${m.id}`}>
                      <td className="p-3 font-mono font-bold text-cedu-blue">{m.membershipNumber}</td>
                      <td className="p-3 text-cedu-ink font-medium">{m.fullName}</td>
                      <td className="p-3 text-cedu-ink-muted">{m.email}</td>
                      <td className="p-3 capitalize">{m.membershipType}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[m.status] || ""}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 text-cedu-ink-muted text-xs">
                        {m.acceptedAt ? new Date(m.acceptedAt).toLocaleDateString("es-MX") : "—"}
                      </td>
                      <td className="p-3">
                        <select
                          value={m.status}
                          onChange={(e) => updateStatusMutation.mutate({ id: m.id, status: e.target.value })}
                          className="text-xs border rounded px-2 py-1"
                          data-testid={`select-status-${m.id}`}
                        >
                          <option value="activo">Activo</option>
                          <option value="suspendido">Suspendido</option>
                          <option value="separado">Separado</option>
                          <option value="excluido">Excluido</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type InstructorApplicationRow = {
  id: string;
  userId: string;
  type: "dc5" | "internal";
  status: string;
  fullName: string | null;
  email: string | null;
  userEmail: string;
  specialty: string | null;
  quizScore: number | null;
  quizPassed: boolean | null;
  yearsExperience: number | null;
  termsAccepted: boolean | null;
  adminNotes: string | null;
  instructorNumber: string | null;
  createdAt: string;
};

function AdminInstructorApplicationsTab() {
  const { toast } = useToast();
  const { data: applications, loading, refetch } = useAdminFetch<InstructorApplicationRow[]>("/api/admin/instructor-applications");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<InstructorApplicationRow | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessing(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/instructor-applications/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: actionNotes }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Error");
      toast({ title: action === "approve" ? "Solicitud aprobada" : "Solicitud rechazada" });
      setSelectedApp(null);
      setActionNotes("");
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  const filtered = (applications || []).filter(a => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    return true;
  });

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    pending_review: "bg-amber-100 text-amber-700",
    pending_dc5: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    active: "bg-emerald-100 text-emerald-700",
  };

  const STATUS_LABELS_INST: Record<string, string> = {
    draft: "Borrador",
    pending_review: "En revisión",
    pending_dc5: "DC-5 en trámite",
    approved: "Aprobado",
    rejected: "Rechazado",
    active: "Activo",
  };

  if (selectedApp) {
    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => setSelectedApp(null)} data-testid="button-back-to-list">
          <ArrowLeft size={14} className="mr-2" /> Volver a la lista
        </Button>
        <Card className="border-black/[0.06]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-xl text-cedu-ink">Expediente de Solicitud</CardTitle>
              <Badge className={STATUS_COLORS[selectedApp.status] || "bg-gray-100"}>{STATUS_LABELS_INST[selectedApp.status] || selectedApp.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-cedu-ink-muted block text-xs">Nombre</span><span className="font-medium">{selectedApp.fullName || "—"}</span></div>
              <div><span className="text-cedu-ink-muted block text-xs">Email</span><span className="font-medium">{selectedApp.userEmail}</span></div>
              <div><span className="text-cedu-ink-muted block text-xs">Tipo</span><span className="font-medium">{selectedApp.type === "dc5" ? "STPS Certificado (DC-5)" : "Instructor Interno"}</span></div>
              <div><span className="text-cedu-ink-muted block text-xs">Especialidad</span><span className="font-medium">{selectedApp.specialty || "—"}</span></div>
              <div><span className="text-cedu-ink-muted block text-xs">Experiencia</span><span className="font-medium">{selectedApp.yearsExperience ? `${selectedApp.yearsExperience} años` : "—"}</span></div>
              <div><span className="text-cedu-ink-muted block text-xs">Evaluación</span><span className={`font-medium ${selectedApp.quizPassed ? "text-green-600" : "text-amber-600"}`}>{selectedApp.quizScore != null ? `${selectedApp.quizScore}% ${selectedApp.quizPassed ? "✓" : "✗"}` : "No realizada"}</span></div>
              <div><span className="text-cedu-ink-muted block text-xs">Términos</span><span className="font-medium">{selectedApp.termsAccepted ? "Aceptados ✓" : "Pendientes"}</span></div>
              <div><span className="text-cedu-ink-muted block text-xs">Fecha</span><span className="font-medium">{new Date(selectedApp.createdAt).toLocaleDateString("es-MX")}</span></div>
              {selectedApp.instructorNumber && <div><span className="text-cedu-ink-muted block text-xs">No. Instructor</span><span className="font-medium">{selectedApp.instructorNumber}</span></div>}
            </div>

            {selectedApp.status !== "active" && selectedApp.status !== "rejected" && (
              <div className="border-t border-black/[0.06] pt-4 space-y-3">
                <div>
                  <Label className="text-sm">Notas del administrador</Label>
                  <Textarea value={actionNotes} onChange={e => setActionNotes(e.target.value)} placeholder="Notas opcionales..." rows={3} data-testid="input-admin-notes" />
                </div>
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={processing}
                    onClick={() => handleAction(selectedApp.id, "approve")}
                    data-testid="button-approve-application"
                  >
                    {processing ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} className="mr-2" /> Aprobar</>}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    disabled={processing}
                    onClick={() => handleAction(selectedApp.id, "reject")}
                    data-testid="button-reject-application"
                  >
                    <Ban size={14} className="mr-2" /> Rechazar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-cedu-ink" data-testid="text-admin-instructores-title">Solicitudes de Instructor</h2>
        <p className="text-sm text-cedu-ink-muted">{applications?.length || 0} solicitudes registradas</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9" data-testid="select-status-filter">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="pending_review">En revisión</SelectItem>
            <SelectItem value="pending_dc5">DC-5 en trámite</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 h-9" data-testid="select-type-filter">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="dc5">STPS (DC-5)</SelectItem>
            <SelectItem value="internal">Interno</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-black/[0.06]">
          <CardContent className="py-10 text-center">
            <GraduationCap size={40} className="mx-auto text-cedu-ink-muted/40 mb-3" />
            <p className="text-sm text-cedu-ink-muted">No hay solicitudes de instructor</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((app) => (
            <Card
              key={app.id}
              className="border-black/[0.06] hover:border-cedu-blue/20 transition-colors cursor-pointer"
              onClick={() => setSelectedApp(app)}
              data-testid={`card-instructor-app-${app.id}`}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#7c3aed]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <GraduationCap size={18} className="text-[#7c3aed]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-cedu-ink truncate">{app.fullName || app.userEmail}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-[9px] h-4">{app.type === "dc5" ? "DC-5" : "Interno"}</Badge>
                      {app.specialty && <span className="text-[10px] text-cedu-ink-muted">{app.specialty}</span>}
                      {app.quizScore != null && <span className="text-[10px] text-cedu-ink-muted">Quiz: {app.quizScore}%</span>}
                    </div>
                  </div>
                  <Badge className={`${STATUS_COLORS[app.status] || "bg-gray-100"} border-0 text-[10px]`}>{STATUS_LABELS_INST[app.status] || app.status}</Badge>
                  <span className="text-[10px] text-cedu-ink-muted flex-shrink-0">{new Date(app.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
                  <ChevronRight size={14} className="text-cedu-ink-muted/40 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

type TermsVersionRow = {
  id: string;
  docType: string;
  version: string;
  title: string;
  summary: string | null;
  contentUrl: string | null;
  isBlocking: boolean;
  isActive: boolean;
  requiredForRoles: string[];
  publishedAt: string;
  acceptedCount: number;
  pendingCount: number;
  totalUsers: number;
};

const DOC_TYPE_LABELS: Record<string, string> = {
  terminos_condiciones: "Términos y Condiciones",
  aviso_privacidad: "Aviso de Privacidad",
  politica_cookies: "Política de Cookies",
  adhesion_cooperativa: "Adhesión Cooperativa",
};

function AdminDocumentosLegalesTab() {
  const { data: versions, loading, refetch } = useAdminFetch<TermsVersionRow[]>("/api/admin/terms");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    docType: "terminos_condiciones",
    version: "",
    title: "",
    summary: "",
    contentUrl: "",
    isBlocking: true,
    requiredForRoles: ["socio_estudiante", "socio_instructor", "socio_comercial", "director", "empresa", "empresa_rh", "admin", "superadmin"],
  });
  const [publishing, setPublishing] = useState(false);
  const { toast } = useToast();

  const handlePublish = async () => {
    if (!formData.version || !formData.title) {
      toast({ title: "Error", description: "Versión y título son requeridos", variant: "destructive" });
      return;
    }
    setPublishing(true);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/admin/terms/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Versión publicada", description: `${formData.title} v${formData.version} publicada correctamente.` });
      setShowForm(false);
      setFormData({ docType: "terminos_condiciones", version: "", title: "", summary: "", contentUrl: "", isBlocking: true, requiredForRoles: ["socio_estudiante", "socio_instructor", "socio_comercial", "director", "empresa", "empresa_rh", "admin", "superadmin"] });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Error al publicar", variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  const activeVersions = (versions || []).filter(v => v.isActive);
  const inactiveVersions = (versions || []).filter(v => !v.isActive);

  return (
    <div className="space-y-6" data-testid="tab-documentos-legales">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-cedu-ink" data-testid="text-admin-docs-title">Documentos Legales</h2>
          <p className="text-sm text-cedu-ink-muted">Gestión de versiones de documentos legales y aceptaciones</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-cedu-blue hover:bg-cedu-blue/90 text-white rounded-xl"
          data-testid="button-new-version"
        >
          <Plus size={16} className="mr-2" />
          Nueva versión
        </Button>
      </div>

      {showForm && (
        <Card className="border-cedu-blue/20" data-testid="form-new-version">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-serif text-cedu-ink">Publicar nueva versión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-cedu-ink-soft">Tipo de documento</Label>
                <Select value={formData.docType} onValueChange={(v) => setFormData(prev => ({ ...prev, docType: v, title: DOC_TYPE_LABELS[v] || prev.title }))}>
                  <SelectTrigger className="mt-1" data-testid="select-doc-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terminos_condiciones">Términos y Condiciones</SelectItem>
                    <SelectItem value="aviso_privacidad">Aviso de Privacidad</SelectItem>
                    <SelectItem value="politica_cookies">Política de Cookies</SelectItem>
                    <SelectItem value="adhesion_cooperativa">Adhesión Cooperativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-cedu-ink-soft">Versión</Label>
                <Input
                  placeholder="2.0"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  className="mt-1"
                  data-testid="input-version"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-cedu-ink-soft">Título</Label>
              <Input
                placeholder="Términos y Condiciones"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
                data-testid="input-title"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-cedu-ink-soft">Resumen de cambios</Label>
              <Textarea
                placeholder="Descripción de los cambios en esta versión..."
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                className="mt-1"
                data-testid="input-summary"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-cedu-ink-soft">URL del documento</Label>
              <Input
                placeholder="/terminos"
                value={formData.contentUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, contentUrl: e.target.value }))}
                className="mt-1"
                data-testid="input-content-url"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isBlocking}
                  onChange={(e) => setFormData(prev => ({ ...prev, isBlocking: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-cedu-blue focus:ring-cedu-blue"
                  data-testid="checkbox-blocking"
                />
                <span className="text-sm text-cedu-ink">Bloqueante (impide usar la plataforma)</span>
              </label>
            </div>
            <div>
              <Label className="text-xs font-semibold text-cedu-ink-soft">Roles requeridos</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {(["socio_estudiante", "socio_instructor", "socio_comercial", "director", "empresa", "empresa_rh", "admin", "superadmin"] as const).map((role) => (
                  <label key={role} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiredForRoles.includes(role)}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          requiredForRoles: e.target.checked
                            ? [...prev.requiredForRoles, role]
                            : prev.requiredForRoles.filter(r => r !== role),
                        }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-cedu-blue focus:ring-cedu-blue"
                      data-testid={`checkbox-role-${role}`}
                    />
                    <span className="text-sm text-cedu-ink capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handlePublish}
                disabled={publishing || !formData.version || !formData.title}
                className="bg-cedu-blue hover:bg-cedu-blue/90 text-white rounded-xl"
                data-testid="button-publish-version"
              >
                {publishing ? <Loader2 size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                Publicar versión
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                className="rounded-xl"
                data-testid="button-cancel-publish"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="font-serif text-lg text-cedu-ink mb-3">Versiones vigentes</h3>
        {activeVersions.length === 0 ? (
          <Card className="border-black/[0.06]">
            <CardContent className="py-10 text-center">
              <FileText size={40} className="mx-auto text-cedu-ink-muted/40 mb-3" />
              <p className="text-sm text-cedu-ink-muted">No hay documentos vigentes</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeVersions.map((v) => {
              const pct = v.totalUsers > 0 ? Math.round((v.acceptedCount / v.totalUsers) * 100) : 0;
              return (
                <Card key={v.id} className="border-black/[0.06]" data-testid={`card-active-version-${v.id}`}>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-cedu-ink">{v.title}</p>
                          <Badge variant="outline" className="text-[9px] h-4">v{v.version}</Badge>
                          {v.isBlocking && <Badge className="bg-red-50 text-red-600 border-0 text-[9px]">Bloqueante</Badge>}
                        </div>
                        <p className="text-[10px] text-cedu-ink-muted">{DOC_TYPE_LABELS[v.docType] || v.docType}</p>
                        <p className="text-[10px] text-cedu-ink-muted mt-0.5">Publicado: {new Date(v.publishedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-lg font-bold text-cedu-green font-serif">{v.acceptedCount}</p>
                            <p className="text-[9px] text-cedu-ink-muted">Aceptados</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-amber-600 font-serif">{v.pendingCount}</p>
                            <p className="text-[9px] text-cedu-ink-muted">Pendientes</p>
                          </div>
                        </div>
                        <div className="mt-1.5 w-full bg-black/[0.06] rounded-full h-1.5">
                          <div className="bg-cedu-green rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[9px] text-cedu-ink-muted mt-0.5">{pct}% aceptación</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {inactiveVersions.length > 0 && (
        <div>
          <h3 className="font-serif text-lg text-cedu-ink mb-3">Versiones anteriores</h3>
          <div className="space-y-2">
            {inactiveVersions.map((v) => (
              <Card key={v.id} className="border-black/[0.06] opacity-60" data-testid={`card-inactive-version-${v.id}`}>
                <CardContent className="py-3 px-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-cedu-ink">{v.title}</p>
                        <Badge variant="outline" className="text-[9px] h-4">v{v.version}</Badge>
                        <Badge className="bg-gray-100 text-gray-500 border-0 text-[9px]">Inactiva</Badge>
                      </div>
                      <p className="text-[10px] text-cedu-ink-muted">
                        Publicado: {new Date(v.publishedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}{v.acceptedCount} aceptaciones
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type ApiSubTab = "overview" | "keys" | "logs" | "docs";

function AdminApiExternaTab() {
  const [subTab, setSubTab] = useState<ApiSubTab>("overview");
  const subTabs: { id: ApiSubTab; label: string; icon: typeof Activity }[] = [
    { id: "overview", label: "Vista General", icon: Activity },
    { id: "keys", label: "API Keys", icon: Key },
    { id: "logs", label: "Logs", icon: FileText },
    { id: "docs", label: "Documentación", icon: Globe },
  ];

  return (
    <div className="space-y-6" data-testid="tab-api-externa">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-cedu-black font-serif" data-testid="text-api-title">API Management</h2>
          <p className="text-sm text-gray-500">Directorio Empresarial Ceduverse · 6.1M+ empresas</p>
        </div>
        <div className="flex gap-1 bg-white rounded-xl border border-black/[0.06] p-1">
          {subTabs.map(t => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                subTab === t.id ? "bg-cedu-blue text-white" : "text-cedu-ink-muted hover:bg-black/[0.03]"
              }`}
              data-testid={`subtab-api-${t.id}`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {subTab === "overview" && <ApiOverviewSubTab />}
      {subTab === "keys" && <ApiKeysSubTab />}
      {subTab === "logs" && <ApiLogsSubTab />}
      {subTab === "docs" && <ApiDocsSubTab />}
    </div>
  );
}

function ApiOverviewSubTab() {
  const { data: health, isLoading: healthLoading } = useQuery<any>({ queryKey: ["/api/admin/apis/health"] });
  const { data: realtime, isLoading: rtLoading } = useQuery<any>({
    queryKey: ["/api/admin/apis/analytics/realtime"],
    refetchInterval: 15000,
  });
  const [period, setPeriod] = useState("30d");
  const { data: analytics, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ["/api/admin/apis/analytics", period],
    queryFn: () => fetch(`/api/admin/apis/analytics?period=${period}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("cedu_token")}` },
    }).then(r => r.json()),
  });

  const statCards = [
    {
      label: "Status",
      value: health?.api_status === "operational" ? "Operacional" : "—",
      icon: Server,
      color: "text-cedu-green",
      bg: "bg-green-50",
    },
    {
      label: "Requests (1h)",
      value: rtLoading ? "..." : (realtime?.requests_last_hour ?? 0).toLocaleString(),
      icon: Zap,
      color: "text-cedu-blue",
      bg: "bg-blue-50",
    },
    {
      label: "API Keys Activas",
      value: healthLoading ? "..." : health?.active_api_keys ?? 0,
      icon: Key,
      color: "text-cedu-violet",
      bg: "bg-violet-50",
    },
    {
      label: "Empresas Disponibles",
      value: healthLoading ? "..." : (health?.total_companies_available ?? 0).toLocaleString(),
      icon: Database,
      color: "text-cedu-orange",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6" data-testid="api-overview-subtab">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i} className="border-black/[0.06]">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</span>
                <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center`}>
                  <s.icon size={16} className={s.color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-cedu-black" data-testid={`stat-api-${i}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-cedu-black">Tráfico de API</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 días</SelectItem>
            <SelectItem value="30d">30 días</SelectItem>
            <SelectItem value="90d">90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {analyticsLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : analytics?.requests_per_day?.length > 0 ? (
        <Card className="border-black/[0.06]">
          <CardContent className="pt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.requests_per_day}>
                  <defs>
                    <linearGradient id="apiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1b5adf" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1b5adf" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e5e7eb" }}
                    formatter={(v: number) => [v, "Requests"]}
                  />
                  <Area type="monotone" dataKey="count" stroke="#1b5adf" fill="url(#apiGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-black/[0.06]"><CardContent className="py-12 text-center text-gray-400 text-sm">Sin datos de tráfico en este período</CardContent></Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-black/[0.06]">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Endpoints Más Usados</CardTitle></CardHeader>
          <CardContent>
            {analytics?.requests_per_endpoint?.length > 0 ? (
              <div className="space-y-2">
                {analytics.requests_per_endpoint.slice(0, 5).map((ep: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded truncate max-w-[200px]">{ep.endpoint}</code>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{ep.count} req</span>
                      <span>{ep.avg_time}ms</span>
                      <span className="font-semibold text-cedu-blue">{ep.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin datos</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-black/[0.06]">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Distribución de Status</CardTitle></CardHeader>
          <CardContent>
            {analytics?.status_distribution?.length > 0 ? (
              <div className="space-y-3">
                {analytics.status_distribution.map((s: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">{s.status}</span>
                      <span className="text-gray-500">{s.count} ({s.pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.status === "2xx" ? "bg-cedu-green" : s.status === "4xx" ? "bg-cedu-orange" : "bg-red-500"}`}
                        style={{ width: `${Math.min(s.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin datos</p>
            )}
          </CardContent>
        </Card>
      </div>

      {analytics?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Requests", value: Number(analytics.summary.total_requests || 0).toLocaleString() },
            { label: "IPs Únicos", value: analytics.summary.unique_ips || 0 },
            { label: "Tiempo Promedio", value: `${analytics.summary.avg_response_time_ms || 0}ms` },
            { label: "Tasa de Error", value: `${analytics.summary.error_rate_pct || 0}%` },
          ].map((m, i) => (
            <div key={i} className="bg-white rounded-xl border border-black/[0.06] p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{m.label}</p>
              <p className="text-lg font-bold text-cedu-black mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {realtime?.last_10_requests?.length > 0 && (
        <Card className="border-black/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity size={14} className="text-cedu-green" />
              Actividad en Tiempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {realtime.last_10_requests.map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-xs py-1 border-b border-black/[0.04] last:border-0">
                  <Badge variant={r.status_code < 400 ? "default" : "destructive"} className="text-[10px] w-10 justify-center">
                    {r.status_code}
                  </Badge>
                  <code className="text-gray-600 truncate flex-1">{r.endpoint}</code>
                  <span className="text-gray-400">{r.response_time_ms}ms</span>
                  <span className="text-gray-400 w-16 text-right">{r.key_name || "—"}</span>
                  <span className="text-gray-300 w-20 text-right">
                    {r.created_at ? new Date(r.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ApiKeysSubTab() {
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyOwner, setNewKeyOwner] = useState("");
  const [newKeyOrigins, setNewKeyOrigins] = useState("");
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editOrigins, setEditOrigins] = useState("");
  const [editRateMin, setEditRateMin] = useState("120");
  const [editRateDay, setEditRateDay] = useState("50000");
  const [editExpires, setEditExpires] = useState("");
  const [newRateMin, setNewRateMin] = useState("120");
  const [newRateDay, setNewRateDay] = useState("50000");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmRegen, setConfirmRegen] = useState<string | null>(null);

  const { data: keys, isLoading: keysLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/apis/keys"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/apis/keys", data);
      return res.json();
    },
    onSuccess: (data) => {
      setCreatedRawKey(data.rawKey);
      setNewKeyName(""); setNewKeyOwner(""); setNewKeyOrigins(""); setNewRateMin("120"); setNewRateDay("50000");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/apis/keys"] });
      toast({ title: "API Key creada exitosamente" });
    },
    onError: () => toast({ title: "Error al crear API key", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/apis/keys/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      setEditingKey(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/apis/keys"] });
      toast({ title: "API Key actualizada" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/apis/keys/${id}`);
      return res.json();
    },
    onSuccess: () => {
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/apis/keys"] });
      toast({ title: "API Key desactivada" });
    },
  });

  const regenMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/apis/keys/${id}/regenerate`);
      return res.json();
    },
    onSuccess: (data) => {
      setCreatedRawKey(data.rawKey);
      setConfirmRegen(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/apis/keys"] });
      toast({ title: "Key regenerada exitosamente" });
    },
  });

  return (
    <div className="space-y-4" data-testid="api-keys-subtab">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{keys?.length || 0} keys registradas</p>
        <Button size="sm" onClick={() => setShowCreateModal(true)} data-testid="button-create-api-key">
          <Plus size={14} className="mr-1" /> Nueva API Key
        </Button>
      </div>

      {createdRawKey && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-green-600 mt-1" size={20} />
              <div className="flex-1">
                <p className="font-semibold text-green-800">API Key generada</p>
                <p className="text-xs text-green-700 mt-1">Copia esta key ahora. No se mostrará de nuevo.</p>
                <code className="block mt-2 p-2 bg-white rounded border text-xs break-all font-mono" data-testid="text-raw-key">{createdRawKey}</code>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(createdRawKey);
                    toast({ title: "Copiada al portapapeles" });
                  }} data-testid="button-copy-key"><Copy size={12} className="mr-1" /> Copiar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setCreatedRawKey(null)}>Cerrar</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showCreateModal && (
        <Card className="border-cedu-blue/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Crear Nueva API Key</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div><Label className="text-xs">Nombre</Label><Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="ej: mecorrieron-production" data-testid="input-key-name" /></div>
              <div><Label className="text-xs">Owner / Empresa</Label><Input value={newKeyOwner} onChange={e => setNewKeyOwner(e.target.value)} placeholder="ej: MeCorrieron.mx" data-testid="input-key-owner" /></div>
            </div>
            <div><Label className="text-xs">Origins permitidos (uno por línea)</Label><Textarea value={newKeyOrigins} onChange={e => setNewKeyOrigins(e.target.value)} placeholder={"https://mecorrieron.mx\nhttps://www.mecorrieron.mx"} rows={2} data-testid="input-key-origins" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Rate limit / minuto</Label><Input type="number" value={newRateMin} onChange={e => setNewRateMin(e.target.value)} data-testid="input-key-rate-min" /></div>
              <div><Label className="text-xs">Rate limit / día</Label><Input type="number" value={newRateDay} onChange={e => setNewRateDay(e.target.value)} data-testid="input-key-rate-day" /></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => {
                createMutation.mutate({
                  name: newKeyName, owner: newKeyOwner,
                  allowedOrigins: newKeyOrigins.split("\n").map(s => s.trim()).filter(Boolean),
                  rateLimitPerMinute: parseInt(newRateMin) || 120,
                  rateLimitPerDay: parseInt(newRateDay) || 50000,
                });
                setShowCreateModal(false);
              }} disabled={!newKeyName || !newKeyOwner || createMutation.isPending} data-testid="button-confirm-create">
                {createMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Crear Key
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreateModal(false)} data-testid="button-cancel-create">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {keysLoading ? (
        <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : !keys?.length ? (
        <Card className="border-black/[0.06]"><CardContent className="py-12 text-center text-gray-400 text-sm">No hay API keys configuradas</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {keys.map((k: any) => (
            <Card key={k.id} className={`border-black/[0.06] ${!k.isActive ? "opacity-60" : ""}`} data-testid={`card-api-key-${k.id}`}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.isActive ? "bg-cedu-blue/10" : "bg-gray-100"}`}>
                      <Key size={18} className={k.isActive ? "text-cedu-blue" : "text-gray-400"} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm" data-testid={`text-key-name-${k.id}`}>{k.name}</p>
                        <Badge variant={k.isActive ? "default" : "secondary"} className="text-[10px]">
                          {k.isActive ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{k.owner} · <code className="bg-gray-100 px-1 rounded">{k.keyPrefix}...</code></p>
                      <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-gray-400">
                        <span>Hoy: <strong className="text-gray-600">{k.requestsToday || 0}</strong> req</span>
                        <span>30d: <strong className="text-gray-600">{k.totalRequests30d || 0}</strong> req</span>
                        <span>Límite: {k.rateLimitPerMinute}/min · {(k.rateLimitPerDay || 0).toLocaleString()}/día</span>
                        {k.lastUsedAt && <span>Último uso: {new Date(k.lastUsedAt).toLocaleDateString("es-MX")}</span>}
                        {k.expiresAt && <span className="text-cedu-orange">Expira: {new Date(k.expiresAt).toLocaleDateString("es-MX")}</span>}
                      </div>
                      {k.allowedOrigins?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {k.allowedOrigins.map((o: string, i: number) => (
                            <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{o}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-black/[0.04]">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                    if (editingKey === k.id) { setEditingKey(null); return; }
                    setEditingKey(k.id); setEditName(k.name); setEditOwner(k.owner);
                    setEditOrigins((k.allowedOrigins || []).join("\n"));
                    setEditRateMin(String(k.rateLimitPerMinute)); setEditRateDay(String(k.rateLimitPerDay));
                    setEditExpires(k.expiresAt ? new Date(k.expiresAt).toISOString().split("T")[0] : "");
                  }} data-testid={`button-edit-${k.id}`}>
                    <Settings size={12} className="mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmRegen(k.id)} data-testid={`button-regen-${k.id}`}>
                    <RotateCcw size={12} className="mr-1" /> Regenerar
                  </Button>
                  <Button size="sm" variant={k.isActive ? "outline" : "default"} className="h-7 text-xs" onClick={() => updateMutation.mutate({ id: k.id, data: { isActive: !k.isActive } })} data-testid={`button-toggle-${k.id}`}>
                    {k.isActive ? <><EyeOff size={12} className="mr-1" /> Desactivar</> : <><Eye size={12} className="mr-1" /> Activar</>}
                  </Button>
                  {k.isActive && (
                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setConfirmDelete(k.id)} data-testid={`button-delete-${k.id}`}>
                      <Trash2 size={12} className="mr-1" /> Eliminar
                    </Button>
                  )}
                </div>

                {confirmRegen === k.id && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <p className="font-semibold text-amber-800">¿Regenerar esta key?</p>
                    <p className="text-xs text-amber-700 mt-1">La key anterior dejará de funcionar inmediatamente.</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs" onClick={() => regenMutation.mutate(k.id)}>Confirmar</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmRegen(null)}>Cancelar</Button>
                    </div>
                  </div>
                )}

                {confirmDelete === k.id && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                    <p className="font-semibold text-red-800">¿Desactivar permanentemente?</p>
                    <p className="text-xs text-red-700 mt-1">Esta key quedará inactiva y no podrá hacer requests.</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => deleteMutation.mutate(k.id)}>Desactivar</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                    </div>
                  </div>
                )}

                {editingKey === k.id && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3 border border-black/[0.04]">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div><Label className="text-xs">Nombre</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
                      <div><Label className="text-xs">Owner</Label><Input value={editOwner} onChange={e => setEditOwner(e.target.value)} /></div>
                    </div>
                    <div><Label className="text-xs">Origins permitidos</Label><Textarea value={editOrigins} onChange={e => setEditOrigins(e.target.value)} rows={2} data-testid={`input-edit-origins-${k.id}`} /></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label className="text-xs">Rate/min</Label><Input type="number" value={editRateMin} onChange={e => setEditRateMin(e.target.value)} /></div>
                      <div><Label className="text-xs">Rate/día</Label><Input type="number" value={editRateDay} onChange={e => setEditRateDay(e.target.value)} /></div>
                      <div><Label className="text-xs">Expiración</Label><Input type="date" value={editExpires} onChange={e => setEditExpires(e.target.value)} /></div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={() => updateMutation.mutate({
                        id: k.id,
                        data: {
                          name: editName, owner: editOwner,
                          allowedOrigins: editOrigins.split("\n").map((s: string) => s.trim()).filter(Boolean),
                          rateLimitPerMinute: parseInt(editRateMin), rateLimitPerDay: parseInt(editRateDay),
                          expiresAt: editExpires || null,
                        },
                      })} data-testid={`button-save-edit-${k.id}`}>Guardar Cambios</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingKey(null)}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ApiLogsSubTab() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [endpointFilter, setEndpointFilter] = useState("");
  const [keyFilter, setKeyFilter] = useState("all");
  const { data: keys } = useQuery<any[]>({ queryKey: ["/api/admin/apis/keys"] });
  const { data: logsData, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/apis/logs", page, statusFilter, endpointFilter, keyFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (endpointFilter) params.set("endpoint", endpointFilter);
      if (keyFilter !== "all") params.set("api_key_id", keyFilter);
      return fetch(`/api/admin/apis/logs?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("cedu_token")}` },
      }).then(r => r.json());
    },
  });

  const logs = logsData?.data || [];
  const pagination = logsData?.pagination || { total: 0, total_pages: 0 };

  return (
    <div className="space-y-4" data-testid="api-logs-subtab">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[150px]">
          <Label className="text-xs">Endpoint</Label>
          <Input value={endpointFilter} onChange={e => { setEndpointFilter(e.target.value); setPage(1); }} placeholder="Filtrar por endpoint..." className="h-8 text-xs" data-testid="input-log-endpoint-filter" />
        </div>
        <div className="w-[120px]">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="2xx">2xx OK</SelectItem>
              <SelectItem value="4xx">4xx Error</SelectItem>
              <SelectItem value="5xx">5xx Server</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[160px]">
          <Label className="text-xs">API Key</Label>
          <Select value={keyFilter} onValueChange={v => { setKeyFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las keys</SelectItem>
              {keys?.map((k: any) => <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-gray-400">{pagination.total} registros</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : logs.length === 0 ? (
        <Card className="border-black/[0.06]"><CardContent className="py-12 text-center text-gray-400 text-sm">Sin logs que coincidan con los filtros</CardContent></Card>
      ) : (
        <Card className="border-black/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-black/[0.06]">
                  <th className="text-left p-2.5 font-semibold text-gray-500">Fecha</th>
                  <th className="text-left p-2.5 font-semibold text-gray-500">Método</th>
                  <th className="text-left p-2.5 font-semibold text-gray-500">Endpoint</th>
                  <th className="text-left p-2.5 font-semibold text-gray-500">Status</th>
                  <th className="text-left p-2.5 font-semibold text-gray-500">Tiempo</th>
                  <th className="text-left p-2.5 font-semibold text-gray-500">Key</th>
                  <th className="text-left p-2.5 font-semibold text-gray-500">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any, i: number) => (
                  <tr key={log.id || i} className="border-b border-black/[0.03] hover:bg-gray-50/50">
                    <td className="p-2.5 text-gray-500 whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
                    </td>
                    <td className="p-2.5"><Badge variant="outline" className="text-[10px]">{log.method || "GET"}</Badge></td>
                    <td className="p-2.5"><code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{log.endpoint}</code></td>
                    <td className="p-2.5">
                      <Badge variant={log.status_code < 400 ? "default" : "destructive"} className="text-[10px]">
                        {log.status_code}
                      </Badge>
                    </td>
                    <td className="p-2.5 text-gray-500">{log.response_time_ms}ms</td>
                    <td className="p-2.5 text-gray-500 whitespace-nowrap">{log.api_key_name || "—"}</td>
                    <td className="p-2.5 text-gray-400 font-mono">{log.ip || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-xs text-gray-500">Página {page} de {pagination.total_pages}</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page >= pagination.total_pages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
        </div>
      )}
    </div>
  );
}

function ApiDocsSubTab() {
  const { toast } = useToast();
  const baseUrl = window.location.origin;
  const curlExample = `curl -X GET "${baseUrl}/api/v1/external/empresas?estado=Jalisco&limit=10" \\
  -H "X-API-Key: cdv_tu_api_key_aqui"`;
  const jsExample = `const response = await fetch(
  "${baseUrl}/api/v1/external/empresas?estado=Jalisco&limit=10",
  { headers: { "X-API-Key": "cdv_tu_api_key_aqui" } }
);
const data = await response.json();
console.log(data.empresas);`;

  const endpoints = [
    { method: "GET", path: "/api/v1/external/empresas", desc: "Buscar empresas con filtros (estado, municipio, actividad, etc.)" },
    { method: "GET", path: "/api/v1/external/empresas/:id", desc: "Obtener detalle de una empresa por ID" },
    { method: "GET", path: "/api/v1/external/empresas/nearby", desc: "Empresas cercanas por coordenadas (lat, lng, radius)" },
    { method: "GET", path: "/api/v1/external/stats", desc: "Estadísticas generales del directorio" },
    { method: "GET", path: "/api/v1/external/docs", desc: "Documentación interactiva completa" },
  ];

  return (
    <div className="space-y-6" data-testid="api-docs-subtab">
      <Card className="border-black/[0.06]">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Referencia Rápida de la API</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {endpoints.map((ep, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-black/[0.04] last:border-0">
                <Badge variant={ep.method === "GET" ? "default" : "secondary"} className="text-[10px] mt-0.5 w-12 justify-center">{ep.method}</Badge>
                <div>
                  <code className="text-xs font-mono text-cedu-blue">{ep.path}</code>
                  <p className="text-xs text-gray-500 mt-0.5">{ep.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-black/[0.06]">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Autenticación</CardTitle></CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>Todas las requests requieren el header <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">X-API-Key</code> con tu API key.</p>
          <p>Las keys tienen formato <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">cdv_...</code> (67 caracteres).</p>
          <div className="flex gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1.5"><Zap size={12} className="text-cedu-blue" /> 120 req/min</div>
            <div className="flex items-center gap-1.5"><Activity size={12} className="text-cedu-orange" /> 50,000 req/día</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-black/[0.06]">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Ejemplo cURL</CardTitle>
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { navigator.clipboard.writeText(curlExample); toast({ title: "Copiado" }); }} data-testid="button-copy-curl">
              <Copy size={12} className="mr-1" /> Copiar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs overflow-x-auto font-mono">{curlExample}</pre>
        </CardContent>
      </Card>

      <Card className="border-black/[0.06]">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Ejemplo JavaScript</CardTitle>
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { navigator.clipboard.writeText(jsExample); toast({ title: "Copiado" }); }} data-testid="button-copy-js">
              <Copy size={12} className="mr-1" /> Copiar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-blue-300 p-4 rounded-xl text-xs overflow-x-auto font-mono">{jsExample}</pre>
        </CardContent>
      </Card>

      <Card className="border-black/[0.06]">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Parámetros de Búsqueda</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  <th className="text-left p-2 font-semibold text-gray-500">Parámetro</th>
                  <th className="text-left p-2 font-semibold text-gray-500">Tipo</th>
                  <th className="text-left p-2 font-semibold text-gray-500">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["q", "string", "Búsqueda general (razón social, actividad)"],
                  ["estado", "string", "Filtrar por estado (ej: Jalisco)"],
                  ["municipio", "string", "Filtrar por municipio"],
                  ["actividad", "string", "Filtrar por actividad económica"],
                  ["tamaño", "string", "micro, pequeña, mediana, grande"],
                  ["limit", "number", "Resultados por página (máx 100)"],
                  ["offset", "number", "Número de resultados a saltar"],
                  ["enriched", "boolean", "Solo empresas con datos enriquecidos"],
                ].map(([param, type, desc], i) => (
                  <tr key={i} className="border-b border-black/[0.03]">
                    <td className="p-2"><code className="bg-gray-100 px-1.5 py-0.5 rounded">{param}</code></td>
                    <td className="p-2 text-gray-500">{type}</td>
                    <td className="p-2 text-gray-600">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <a href="/api/v1/external/docs" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" data-testid="link-full-api-docs">
            <Globe size={14} className="mr-1" /> Ver Documentación Interactiva Completa
          </Button>
        </a>
      </div>
    </div>
  );
}

function RolesTab() {
  const { data: roleDefs = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/role-definitions"] });
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
  return (
    <div className="space-y-4" data-testid="tab-roles">
      <h2 className="font-['DM_Serif_Display'] text-2xl">Definiciones de Roles</h2>
      <p className="text-sm text-gray-500">Taxonomía unificada de 8 roles del sistema cooperativo.</p>
      <div className="grid gap-3">
        {roleDefs.map((r: any) => (
          <Card key={r.roleKey}>
            <CardContent className="flex items-center gap-4 py-4">
              <RoleBadge role={r.roleKey} size="md" />
              <div className="flex-1">
                <p className="text-sm font-semibold" data-testid={`text-role-name-${r.roleKey}`}>{r.displayName}</p>
                <p className="text-xs text-gray-500">{r.description}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {r.canViewAdmin && <Badge variant="outline" className="text-[10px]">Admin</Badge>}
                {r.canCreateCourses && <Badge variant="outline" className="text-[10px]">Crear Cursos</Badge>}
                {r.canViewPartner && <Badge variant="outline" className="text-[10px]">Partner</Badge>}
                {r.canViewEmpresa && <Badge variant="outline" className="text-[10px]">Empresa</Badge>}
                {r.isCooperativeMember && <Badge variant="outline" className="text-[10px]">Cooperativa</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

type RoleDefRow = {
  roleKey: string;
  displayName: string;
  description: string | null;
  canViewCourses: boolean;
  canCreateCourses: boolean;
  canViewAdmin: boolean;
  canViewPartner: boolean;
  canViewDirector: boolean;
  canViewEmpresa: boolean;
  isCooperativeMember: boolean;
};

// Permission columns shown in the matrix, in display order.
const PERMISSION_COLUMNS: { key: keyof RoleDefRow; label: string }[] = [
  { key: "canViewCourses", label: "Cursos" },
  { key: "canCreateCourses", label: "Crear cursos" },
  { key: "canViewPartner", label: "CRM / Partner" },
  { key: "canViewDirector", label: "Director" },
  { key: "canViewEmpresa", label: "Empresa" },
  { key: "canViewAdmin", label: "Admin" },
  { key: "isCooperativeMember", label: "Cooperativa" },
];

// Legacy role keys map onto the canonical 8-role taxonomy so their permissions
// resolve correctly even though role_definitions only seeds the canonical set.
const CANONICAL_ROLE: Record<string, string> = {
  user: "socio_estudiante",
  moderator: "socio_estudiante",
  partner: "socio_comercial",
  instructor: "socio_instructor",
};

function PermissionMatrixTab() {
  const { data: users = [], isLoading: usersLoading } = useQuery<EnhancedUserItem[]>({ queryKey: ["/api/admin/users"] });
  const { data: roleDefs = [], isLoading: defsLoading } = useQuery<RoleDefRow[]>({ queryKey: ["/api/role-definitions"] });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const defForUser = (role: string): RoleDefRow | undefined =>
    roleDefs.find(d => d.roleKey === role) || roleDefs.find(d => d.roleKey === CANONICAL_ROLE[role]);

  const roleOptions = useMemo(() => Array.from(new Set(users.map(u => u.role))).sort(), [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (u.fullName || "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [users, search, roleFilter]);

  const exportCsv = () => {
    const header = ["Nombre", "Correo", "Rol", ...PERMISSION_COLUMNS.map(c => c.label)];
    const lines = filtered.map(u => {
      const def = defForUser(u.role);
      return [
        u.fullName || "",
        u.email,
        ROLE_LABELS[u.role]?.label || u.role,
        ...PERMISSION_COLUMNS.map(c => (def && def[c.key] ? "Sí" : "No")),
      ];
    });
    const csv = [header, ...lines]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `matriz-permisos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (usersLoading || defsLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4" data-testid="tab-matriz">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-2xl text-cedu-ink">Matriz de Permisos</h2>
          <p className="text-sm text-cedu-ink-muted">
            {filtered.length} de {users.length} usuarios · permisos efectivos derivados del rol de cada usuario
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} className="h-9" data-testid="button-export-matriz">
          <Download size={14} className="mr-1" /> Exportar CSV
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <Input
          placeholder="Buscar por nombre o correo…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64 h-9"
          data-testid="input-search-matriz"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48 h-9" data-testid="filter-matriz-role">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            {roleOptions.map(r => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]?.label || r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-black/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-matriz">
            <thead>
              <tr className="border-b border-black/[0.06] bg-black/[0.02]">
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs sticky left-0 bg-[#f7f5f0]">Usuario</th>
                <th className="text-left px-4 py-3 font-semibold text-cedu-ink-muted text-xs">Rol</th>
                {PERMISSION_COLUMNS.map(c => (
                  <th key={c.key} className="px-3 py-3 font-semibold text-cedu-ink-muted text-xs text-center whitespace-nowrap">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={2 + PERMISSION_COLUMNS.length} className="text-center py-8 text-cedu-ink-muted">Sin usuarios</td></tr>
              ) : filtered.map(u => {
                const def = defForUser(u.role);
                return (
                  <tr key={u.id} className="border-b border-black/[0.04] hover:bg-black/[0.02]" data-testid={`matriz-row-${u.id}`}>
                    <td className="px-4 py-3 sticky left-0 bg-white">
                      <p className="font-semibold text-cedu-ink truncate max-w-[200px]">{u.fullName || "Sin nombre"}</p>
                      <p className="text-xs text-cedu-ink-muted truncate max-w-[200px]">{u.email}</p>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    {PERMISSION_COLUMNS.map(c => (
                      <td key={c.key} className="px-3 py-3 text-center" data-testid={`matriz-${u.id}-${c.key}`}>
                        {def && def[c.key]
                          ? <CheckCircle2 size={16} className="inline text-emerald-600" />
                          : <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-cedu-ink-muted">
        Los permisos se derivan de la taxonomía de roles (pestaña «Roles»). Para cambiar el acceso de un usuario, ajusta su rol en «Usuarios».
      </p>
    </div>
  );
}

function RoleChangeLogTab() {
  const { data: logs = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/role-change-log"] });
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
  return (
    <div className="space-y-4" data-testid="tab-role-change-log">
      <h2 className="font-['DM_Serif_Display'] text-2xl">Historial de Cambios de Rol</h2>
      <p className="text-sm text-gray-500">Registro de auditoría de todos los cambios de rol realizados por administradores.</p>
      {logs.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-gray-400">Sin cambios de rol registrados</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => (
            <Card key={log.id}>
              <CardContent className="flex items-center gap-4 py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold" data-testid={`text-log-user-${log.id}`}>{log.userEmail || log.userId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <RoleBadge role={log.previousRole} size="sm" />
                    <span>→</span>
                    <RoleBadge role={log.newRole} size="sm" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{log.reason}</p>
                  <p className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleString("es-MX")}</p>
                  {log.changedByEmail && <p className="text-[10px] text-gray-400">Por: {log.changedByEmail}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

type AdminSocioResource = {
  id: string;
  category: string;
  kind: string;
  title: string;
  description: string | null;
  url: string | null;
  sortOrder: number;
  isPublished: boolean;
};

const SR_KINDS: Record<string, { value: string; label: string }[]> = {
  compliance: [
    { value: "approved", label: "Permitido (SÍ decir)" },
    { value: "prohibited", label: "Prohibido (NO decir)" },
    { value: "conditional", label: "Condicional (con aclaración)" },
    { value: "disclaimer", label: "Aviso / Disclaimer" },
  ],
  download: [
    { value: "pdf", label: "PDF" },
    { value: "deck", label: "Presentación" },
    { value: "brand", label: "Marca / Assets" },
    { value: "link", label: "Enlace" },
  ],
};

const SR_BLANK: Partial<AdminSocioResource> = { category: "compliance", kind: "approved", title: "", description: "", url: "", sortOrder: 0, isPublished: true };

function SocioResourcesTab() {
  const { toast } = useToast();
  const { data: resources = [], isLoading } = useQuery<AdminSocioResource[]>({ queryKey: ["/api/admin/socio-resources"] });
  const [editing, setEditing] = useState<Partial<AdminSocioResource> | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/socio-resources"] });
    queryClient.invalidateQueries({ queryKey: ["/api/socio/resources"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (r: Partial<AdminSocioResource>) => {
      const body = { category: r.category, kind: r.kind, title: r.title, description: r.description || null, url: r.url || null, sortOrder: Number(r.sortOrder) || 0, isPublished: r.isPublished ?? true };
      if (r.id) return apiRequest("PATCH", `/api/admin/socio-resources/${r.id}`, body);
      return apiRequest("POST", "/api/admin/socio-resources", body);
    },
    onSuccess: () => { invalidate(); setEditing(null); toast({ title: "Recurso guardado" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/socio-resources/${id}`),
    onSuccess: () => { invalidate(); toast({ title: "Recurso eliminado" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  const groups = [
    { key: "compliance", label: "Cumplimiento y Protección" },
    { key: "download", label: "Descargas y Materiales" },
  ];

  return (
    <div className="space-y-4" data-testid="tab-recursos-socios">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-2xl text-cedu-ink">Recursos para Socios Comerciales</h2>
          <p className="text-sm text-cedu-ink-muted">Reglas de cumplimiento y materiales que ven los socios en su Centro de Recursos.</p>
        </div>
        <Button size="sm" onClick={() => setEditing({ ...SR_BLANK })} data-testid="button-new-resource">
          <Plus size={14} className="mr-1" /> Nuevo recurso
        </Button>
      </div>

      {groups.map(g => {
        const items = resources.filter(r => r.category === g.key).sort((a, b) => a.sortOrder - b.sortOrder);
        return (
          <div key={g.key}>
            <h3 className="font-semibold text-sm text-cedu-ink-muted mb-2 mt-2">{g.label} ({items.length})</h3>
            <div className="space-y-2">
              {items.length === 0 && <p className="text-xs text-cedu-ink-muted">Sin recursos.</p>}
              {items.map(r => (
                <Card key={r.id} className="border-black/[0.06]">
                  <CardContent className="py-3 flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px] whitespace-nowrap">{SR_KINDS[r.category]?.find(k => k.value === r.kind)?.label || r.kind}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-cedu-ink truncate">{r.title}</p>
                      {r.description && <p className="text-xs text-cedu-ink-muted truncate">{r.description}</p>}
                      {r.url && <p className="text-[10px] text-cedu-blue truncate">{r.url}</p>}
                    </div>
                    {!r.isPublished && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200">Oculto</Badge>}
                    <Button variant="ghost" size="sm" onClick={() => setEditing(r)} data-testid={`button-edit-${r.id}`}><Edit3 size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm("¿Eliminar este recurso?")) deleteMutation.mutate(r.id); }} data-testid={`button-delete-${r.id}`}><Trash2 size={14} className="text-red-500" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar recurso" : "Nuevo recurso"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Categoría</Label>
                  <Select value={editing.category} onValueChange={v => setEditing({ ...editing, category: v, kind: SR_KINDS[v][0].value })}>
                    <SelectTrigger data-testid="select-category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliance">Cumplimiento</SelectItem>
                      <SelectItem value="download">Descarga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={editing.kind} onValueChange={v => setEditing({ ...editing, kind: v })}>
                    <SelectTrigger data-testid="select-kind"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(SR_KINDS[editing.category || "compliance"] || []).map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Título</Label>
                <Input value={editing.title || ""} onChange={e => setEditing({ ...editing, title: e.target.value })} data-testid="input-title" />
              </div>
              <div>
                <Label className="text-xs">Descripción / Texto</Label>
                <Textarea value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} data-testid="input-description" />
              </div>
              <div>
                <Label className="text-xs">URL (solo descargas — dejar vacío = "Próximamente")</Label>
                <Input value={editing.url || ""} onChange={e => setEditing({ ...editing, url: e.target.value })} placeholder="/materiales/archivo.pdf" data-testid="input-url" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-xs">Orden</Label>
                  <Input type="number" value={editing.sortOrder ?? 0} onChange={e => setEditing({ ...editing, sortOrder: Number(e.target.value) })} data-testid="input-sort" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch checked={editing.isPublished ?? true} onCheckedChange={v => setEditing({ ...editing, isPublished: v })} data-testid="switch-published" />
                  <Label className="text-xs">Publicado</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={() => saveMutation.mutate(editing)} disabled={!editing.title || saveMutation.isPending} data-testid="button-save-resource">
                  {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "Guardar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StoreOrderListItem {
  id: number;
  orderNumber: string;
  createdAt?: string;
  payerName: string;
  payerEmail: string;
  totalMxn: number;
  status: string;
  shipStreet?: string;
  shipColony?: string;
  shipCity?: string;
  shipState?: string;
  shipZip?: string;
  mpPaymentId?: string;
  mpStatus?: string;
  seedPhraseWords?: number;
}

interface StoreOrderDetail {
  order: StoreOrderListItem;
  items: { quantity: number; unitPrice: number; totalPriceMxn: number; productName: string; productSlug: string }[];
  shipment?: { carrier?: string; trackingNumber?: string; status?: string; estimatedDays?: string };
}

interface StoreStockItem {
  productId: number;
  slug: string;
  name: string;
  quantity?: number;
  reserved?: number;
  isSoldOut?: boolean;
}

interface StoreReferralCode {
  id: number;
  code: string;
  ownerName?: string;
  discountPct: number;
  currentUses?: number;
  maxUses?: number;
  isActive?: boolean;
}

function AdminTiendaTab({ isSuperadmin }: { isSuperadmin: boolean }) {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<"stats" | "orders" | "stock" | "referrals">("stats");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalOrders: number;
    paidOrders: number;
    revenue: number;
    referralUses: number;
  }>({ queryKey: ["/api/store/admin/stats"] });

  const { data: orders, isLoading: ordersLoading } = useQuery<StoreOrderListItem[]>({
    queryKey: ["/api/store/admin/orders"],
    enabled: activeSection === "orders" || activeSection === "stats",
  });

  const { data: orderDetail, isLoading: orderDetailLoading } = useQuery<StoreOrderDetail>({
    queryKey: ["/api/store/admin/orders", selectedOrderId],
    enabled: selectedOrderId !== null,
  });

  const { data: stockItems, isLoading: stockLoading } = useQuery<StoreStockItem[]>({
    queryKey: ["/api/store/admin/stock"],
    enabled: activeSection === "stock",
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery<StoreReferralCode[]>({
    queryKey: ["/api/store/admin/referrals"],
    enabled: activeSection === "referrals",
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/store/admin/orders/${orderId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/store/admin/stats"] });
      if (selectedOrderId) {
        queryClient.invalidateQueries({ queryKey: ["/api/store/admin/orders", selectedOrderId] });
      }
      toast({ title: "Orden actualizada", description: "El estado de la orden se ha actualizado." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar la orden.", variant: "destructive" });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, quantity, isSoldOut }: { productId: number; quantity?: number; isSoldOut?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/store/admin/stock/${productId}`, { quantity, isSoldOut });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/admin/stock"] });
      toast({ title: "Stock actualizado", description: "El inventario se ha actualizado." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el stock.", variant: "destructive" });
    },
  });

  const createReferralMutation = useMutation({
    mutationFn: async (data: { code: string; ownerName: string; discountPct: number; maxUses: number }) => {
      const res = await apiRequest("POST", "/api/store/admin/referrals", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/admin/referrals"] });
      toast({ title: "Código creado", description: "El código de referido se ha creado." });
      setShowCreateReferral(false);
      setNewReferralCode("");
      setNewReferralOwner("");
      setNewReferralDiscount("15");
      setNewReferralMaxUses("100");
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear el código.", variant: "destructive" });
    },
  });

  const deactivateReferralMutation = useMutation({
    mutationFn: async (referralId: number) => {
      const res = await apiRequest("DELETE", `/api/store/admin/referrals/${referralId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/admin/referrals"] });
      toast({ title: "Código desactivado", description: "El código de referido se ha desactivado." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo desactivar el código.", variant: "destructive" });
    },
  });

  const [showCreateReferral, setShowCreateReferral] = useState(false);
  const [newReferralCode, setNewReferralCode] = useState("");
  const [newReferralOwner, setNewReferralOwner] = useState("");
  const [newReferralDiscount, setNewReferralDiscount] = useState("15");
  const [newReferralMaxUses, setNewReferralMaxUses] = useState("100");
  const [editingStock, setEditingStock] = useState<{ id: number; value: string } | null>(null);

  const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending_payment: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
    paid: { label: "Pagado", color: "bg-green-100 text-green-800" },
    preparing: { label: "Preparando", color: "bg-blue-100 text-blue-800" },
    shipped: { label: "Enviado", color: "bg-purple-100 text-purple-800" },
    delivered: { label: "Entregado", color: "bg-cyan-100 text-cyan-800" },
    cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  };

  const formatMXN = (amount: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

  const sections = [
    { id: "stats" as const, label: "Resumen", icon: BarChart3 },
    { id: "orders" as const, label: "Órdenes", icon: ShoppingCart },
    { id: "stock" as const, label: "Inventario", icon: Package },
    { id: "referrals" as const, label: "Referidos", icon: Tag },
  ];

  return (
    <div className="space-y-6" data-testid="admin-tienda-tab">
      <div>
        <h2 className="font-serif text-2xl text-cedu-ink">Tienda</h2>
        <p className="text-sm text-cedu-ink-muted">
          {isSuperadmin ? "Gestión completa de la tienda" : "Vista de la tienda (solo lectura)"}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {sections.map((s) => (
          <Button
            key={s.id}
            variant={activeSection === s.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection(s.id)}
            data-testid={`btn-tienda-section-${s.id}`}
          >
            <s.icon size={14} className="mr-1.5" />
            {s.label}
          </Button>
        ))}
      </div>

      {activeSection === "stats" && (
        <div className="space-y-4">
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}><CardContent className="pt-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card data-testid="stat-total-orders"><CardContent className="pt-4">
                <p className="text-[10px] text-cedu-ink-muted uppercase tracking-wide">Total Órdenes</p>
                <p className="text-2xl font-bold text-cedu-ink">{stats?.totalOrders ?? 0}</p>
              </CardContent></Card>
              <Card data-testid="stat-paid-orders"><CardContent className="pt-4">
                <p className="text-[10px] text-cedu-ink-muted uppercase tracking-wide">Órdenes Pagadas</p>
                <p className="text-2xl font-bold text-green-600">{stats?.paidOrders ?? 0}</p>
              </CardContent></Card>
              <Card data-testid="stat-revenue"><CardContent className="pt-4">
                <p className="text-[10px] text-cedu-ink-muted uppercase tracking-wide">Ingresos</p>
                <p className="text-2xl font-bold text-cedu-blue">{formatMXN(stats?.revenue ?? 0)}</p>
              </CardContent></Card>
              <Card data-testid="stat-referral-uses"><CardContent className="pt-4">
                <p className="text-[10px] text-cedu-ink-muted uppercase tracking-wide">Usos de Referidos</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.referralUses ?? 0}</p>
              </CardContent></Card>
            </div>
          )}
        </div>
      )}

      {activeSection === "orders" && (
        <div className="space-y-4">
          {selectedOrderId !== null ? (
            <div className="space-y-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrderId(null)} data-testid="btn-back-orders">
                <ArrowLeft size={14} className="mr-1.5" /> Volver a Órdenes
              </Button>
              {orderDetailLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-cedu-blue" /></div>
              ) : orderDetail ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Hash size={18} /> Orden #{orderDetail.order.orderNumber}
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${ORDER_STATUS_CONFIG[orderDetail.order.status]?.color || "bg-gray-100 text-gray-800"}`}>
                        {ORDER_STATUS_CONFIG[orderDetail.order.status]?.label || orderDetail.order.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-cedu-ink">Artículos</p>
                        {orderDetail.items?.length ? (
                          <div className="space-y-1">
                            {orderDetail.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm border-b border-black/5 pb-1" data-testid={`order-item-${idx}`}>
                                <span>{item.productName} x{item.quantity}</span>
                                <span className="font-mono">{formatMXN(item.totalPriceMxn)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-cedu-ink-muted">Sin artículos</p>
                        )}
                        <div className="flex justify-between text-sm font-bold pt-1">
                          <span>Total</span>
                          <span className="font-mono">{formatMXN(orderDetail.order.totalMxn)}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {orderDetail.order.shipStreet && (
                          <div>
                            <p className="text-sm font-medium text-cedu-ink flex items-center gap-1"><Truck size={14} /> Dirección de envío</p>
                            <p className="text-xs text-cedu-ink-muted mt-1">
                              {[orderDetail.order.shipStreet, orderDetail.order.shipColony, orderDetail.order.shipCity, orderDetail.order.shipState, orderDetail.order.shipZip].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        )}
                        {orderDetail.order.mpPaymentId && (
                          <div>
                            <p className="text-sm font-medium text-cedu-ink">Stripe</p>
                            <p className="text-xs text-cedu-ink-muted">ID: {orderDetail.order.mpPaymentId}</p>
                            {orderDetail.order.mpStatus && (
                              <p className="text-xs text-cedu-ink-muted">Estado: {orderDetail.order.mpStatus}</p>
                            )}
                          </div>
                        )}
                        {orderDetail.shipment?.trackingNumber && (
                          <div>
                            <p className="text-sm font-medium text-cedu-ink">Rastreo</p>
                            <p className="text-xs font-mono text-cedu-ink-muted">{orderDetail.shipment.trackingNumber}</p>
                            {orderDetail.shipment.carrier && (
                              <p className="text-xs text-cedu-ink-muted">Transportista: {orderDetail.shipment.carrier}</p>
                            )}
                          </div>
                        )}
                        {orderDetail.order.seedPhraseWords != null && (
                          <div>
                            <p className="text-sm font-medium text-cedu-ink">Seed Phrase</p>
                            <p className="text-xs text-cedu-ink-muted">{orderDetail.order.seedPhraseWords} palabras</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {isSuperadmin && (
                      <div className="pt-4 border-t border-black/[0.06]">
                        <Label className="text-sm font-medium">Actualizar Estado</Label>
                        <div className="flex gap-2 mt-1">
                          <Select
                            value={orderDetail.order.status}
                            onValueChange={(val) => {
                              updateOrderStatusMutation.mutate({ orderId: orderDetail.order.id, status: val });
                            }}
                          >
                            <SelectTrigger className="w-48" data-testid="select-order-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => (
                                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {updateOrderStatusMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mt-2" />}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card><CardContent className="py-10 text-center">
                  <p className="text-sm text-cedu-ink-muted">No se encontró la orden</p>
                </CardContent></Card>
              )}
            </div>
          ) : ordersLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-cedu-blue" /></div>
          ) : !orders?.length ? (
            <Card><CardContent className="py-10 text-center">
              <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-cedu-ink-muted">No hay órdenes aún</p>
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-gray-50/50">
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Orden #</th>
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Fecha</th>
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Cliente</th>
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Total</th>
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Estado</th>
                    </tr></thead>
                    <tbody className="divide-y">
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50/50 cursor-pointer"
                          onClick={() => setSelectedOrderId(order.id)}
                          data-testid={`order-row-${order.id}`}
                        >
                          <td className="px-4 py-3 font-mono text-cedu-ink">#{order.orderNumber}</td>
                          <td className="px-4 py-3 text-cedu-ink-muted text-xs">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString("es-MX") : "—"}
                          </td>
                          <td className="px-4 py-3 font-medium text-cedu-ink">{order.payerName}</td>
                          <td className="px-4 py-3 text-cedu-ink-muted text-xs">{order.payerEmail}</td>
                          <td className="px-4 py-3 font-mono text-cedu-ink">{formatMXN(order.totalMxn)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${ORDER_STATUS_CONFIG[order.status]?.color || "bg-gray-100 text-gray-800"}`} data-testid={`order-status-${order.id}`}>
                              {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeSection === "stock" && (
        <div className="space-y-4">
          {stockLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-cedu-blue" /></div>
          ) : !stockItems?.length ? (
            <Card><CardContent className="py-10 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-cedu-ink-muted">No hay productos registrados</p>
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-gray-50/50">
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Producto</th>
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Stock Actual</th>
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Reservado</th>
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Disponible</th>
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Agotado</th>
                      {isSuperadmin && <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Acciones</th>}
                    </tr></thead>
                    <tbody className="divide-y">
                      {stockItems.map((product) => {
                        const available = (product.quantity || 0) - (product.reserved || 0);
                        const isLowStock = available > 0 && available <= 5;
                        return (
                          <tr key={product.productId} className="hover:bg-gray-50/50" data-testid={`product-row-${product.productId}`}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-cedu-ink">{product.name}</p>
                              <p className="text-[10px] text-cedu-ink-muted">{product.slug}</p>
                            </td>
                            <td className="px-4 py-3">
                              {editingStock?.id === product.productId ? (
                                <Input
                                  type="number"
                                  className="w-20 h-7 text-sm"
                                  value={editingStock.value}
                                  onChange={(e) => setEditingStock({ ...editingStock, value: e.target.value })}
                                  onBlur={() => {
                                    const val = parseInt(editingStock.value);
                                    if (!isNaN(val) && val >= 0) {
                                      updateStockMutation.mutate({ productId: product.productId, quantity: val });
                                    }
                                    setEditingStock(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      const val = parseInt(editingStock.value);
                                      if (!isNaN(val) && val >= 0) {
                                        updateStockMutation.mutate({ productId: product.productId, quantity: val });
                                      }
                                      setEditingStock(null);
                                    }
                                  }}
                                  autoFocus
                                  data-testid={`input-stock-${product.productId}`}
                                />
                              ) : (
                                <span className="font-mono text-cedu-ink">{product.quantity ?? 0}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono text-cedu-ink-muted">{product.reserved ?? 0}</td>
                            <td className="px-4 py-3">
                              <span className={`font-mono ${isLowStock ? "text-orange-600 font-bold" : "text-cedu-ink"}`}>
                                {available}
                              </span>
                              {isLowStock && (
                                <span className="ml-1.5 inline-flex items-center text-[10px] text-orange-600" data-testid={`low-stock-warning-${product.productId}`}>
                                  <AlertCircle size={10} className="mr-0.5" /> Stock bajo
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isSuperadmin ? (
                                <Switch
                                  checked={!!product.isSoldOut}
                                  onCheckedChange={(checked) =>
                                    updateStockMutation.mutate({ productId: product.productId, isSoldOut: checked })
                                  }
                                  data-testid={`switch-soldout-${product.productId}`}
                                />
                              ) : (
                                <Badge variant={product.isSoldOut ? "destructive" : "secondary"} data-testid={`badge-soldout-${product.productId}`}>
                                  {product.isSoldOut ? "Agotado" : "Disponible"}
                                </Badge>
                              )}
                            </td>
                            {isSuperadmin && (
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7"
                                  onClick={() => setEditingStock({ id: product.productId, value: String(product.quantity || 0) })}
                                  data-testid={`btn-edit-stock-${product.productId}`}
                                >
                                  <Edit3 size={12} className="mr-1" /> Editar
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeSection === "referrals" && (
        <div className="space-y-4">
          {isSuperadmin && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowCreateReferral(true)} data-testid="btn-create-referral">
                <Plus size={14} className="mr-1.5" /> Nuevo Código
              </Button>
            </div>
          )}

          {referralsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-cedu-blue" /></div>
          ) : !referrals?.length ? (
            <Card><CardContent className="py-10 text-center">
              <Tag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-cedu-ink-muted">No hay códigos de referido</p>
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-gray-50/50">
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Código</th>
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Propietario</th>
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Descuento</th>
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Usos / Máx</th>
                      <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Estado</th>
                      {isSuperadmin && <th className="text-left px-4 py-3 font-medium text-cedu-ink-muted">Acciones</th>}
                    </tr></thead>
                    <tbody className="divide-y">
                      {referrals.map((ref) => (
                        <tr key={ref.id} className="hover:bg-gray-50/50" data-testid={`referral-row-${ref.id}`}>
                          <td className="px-4 py-3 font-mono font-bold text-cedu-ink">{ref.code}</td>
                          <td className="px-4 py-3 text-cedu-ink">{ref.ownerName || "—"}</td>
                          <td className="px-4 py-3 text-cedu-ink">{ref.discountPct}%</td>
                          <td className="px-4 py-3 font-mono text-cedu-ink">{ref.currentUses ?? 0} / {ref.maxUses ?? "∞"}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={ref.isActive !== false ? "default" : "secondary"}
                              data-testid={`referral-status-${ref.id}`}
                            >
                              {ref.isActive !== false ? "Activo" : "Inactivo"}
                            </Badge>
                          </td>
                          {isSuperadmin && (
                            <td className="px-4 py-3">
                              {ref.isActive !== false && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 text-red-600 border-red-200"
                                  onClick={() => deactivateReferralMutation.mutate(ref.id)}
                                  disabled={deactivateReferralMutation.isPending}
                                  data-testid={`btn-deactivate-referral-${ref.id}`}
                                >
                                  <Ban size={12} className="mr-1" /> Desactivar
                                </Button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={showCreateReferral} onOpenChange={(open) => {
            setShowCreateReferral(open);
            if (!open) {
              setNewReferralCode("");
              setNewReferralOwner("");
              setNewReferralDiscount("15");
              setNewReferralMaxUses("100");
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Código de Referido</DialogTitle>
                <DialogDescription>Crea un nuevo código de descuento para referidos.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Código</Label>
                  <Input
                    value={newReferralCode}
                    onChange={(e) => setNewReferralCode(e.target.value.toUpperCase())}
                    placeholder="CEDU2024"
                    data-testid="input-referral-code"
                  />
                </div>
                <div>
                  <Label>Propietario</Label>
                  <Input
                    value={newReferralOwner}
                    onChange={(e) => setNewReferralOwner(e.target.value)}
                    placeholder="Nombre del propietario"
                    data-testid="input-referral-owner"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Descuento (%)</Label>
                    <Input
                      type="number"
                      value={newReferralDiscount}
                      onChange={(e) => setNewReferralDiscount(e.target.value)}
                      min="1"
                      max="100"
                      data-testid="input-referral-discount"
                    />
                  </div>
                  <div>
                    <Label>Máximo de usos</Label>
                    <Input
                      type="number"
                      value={newReferralMaxUses}
                      onChange={(e) => setNewReferralMaxUses(e.target.value)}
                      min="1"
                      data-testid="input-referral-max-uses"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateReferral(false)} data-testid="btn-cancel-referral">
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (!newReferralCode.trim()) {
                      toast({ title: "Error", description: "El código es requerido.", variant: "destructive" });
                      return;
                    }
                    createReferralMutation.mutate({
                      code: newReferralCode.trim(),
                      ownerName: newReferralOwner.trim(),
                      discountPct: parseInt(newReferralDiscount) || 15,
                      maxUses: parseInt(newReferralMaxUses) || 100,
                    });
                  }}
                  disabled={createReferralMutation.isPending}
                  data-testid="btn-submit-referral"
                >
                  {createReferralMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus size={14} className="mr-1" />}
                  Crear Código
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

const NAV_ITEMS: { id: AdminTab; label: string; icon: typeof LayoutDashboard; section?: string; superadminOnly?: boolean }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "usuarios", label: "Usuarios", icon: Users, section: "Gestión" },
  { id: "empresas", label: "Empresas", icon: Building2 },
  { id: "cursos", label: "Cursos", icon: BookOpen },
  { id: "certificados", label: "Certificados", icon: FileCheck },
  { id: "instructores", label: "Instructores", icon: GraduationCap },
  { id: "pagos", label: "Pagos", icon: DollarSign, section: "Finanzas" },
  { id: "facturacion", label: "Facturación CFDI", icon: Receipt },
  { id: "dispersion", label: "Dispersión", icon: Wallet },
  { id: "comisiones-crm", label: "Comisiones CRM", icon: TrendingUp },
  { id: "denue", label: "Prospectos Identificados", icon: MapPin },
  { id: "blog", label: "Blog", icon: Newspaper, section: "Contenido" },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "api-externa", label: "API Management", icon: Shield, section: "Otros", superadminOnly: true },
  { id: "roles", label: "Roles", icon: Users, superadminOnly: true },
  { id: "matriz", label: "Matriz de Permisos", icon: Shield, superadminOnly: true },
  { id: "recursos-socios", label: "Recursos Socios", icon: Handshake, superadminOnly: true },
  { id: "logs", label: "Logs de Cambios", icon: Clock, superadminOnly: true },
  { id: "seguros", label: "Seguros", icon: HeartPulse },
  { id: "memberships", label: "Membresías", icon: Award },
  { id: "documentos-legales", label: "Documentos Legales", icon: FileText },
  { id: "tienda", label: "🛒 Tienda", icon: ShoppingCart, section: "Tienda" },
  { id: "soporte", label: "Soporte", icon: MessageCircle },
  { id: "configuracion", label: "Configuración", icon: Settings, superadminOnly: true },
];

export default function AdminPanel() {
  useForceLightMode();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: account } = useQuery<{ userRole: string }>({
    queryKey: ["/api/me/account"],
    enabled: !!user,
  });

  const { data: profile } = useQuery<{ fullName: string | null }>({
    queryKey: ["/api/me/profile"],
    enabled: !!user,
  });

  const roleKey = account?.userRole || "admin";
  const { data: roleDef } = useQuery<{ sidebarConfig: { adminTabs?: string[] } }>({
    queryKey: ["/api/role-definition", roleKey],
    enabled: !!account && (account.userRole === "admin" || account.userRole === "superadmin"),
  });

  useEffect(() => {
    if (!authLoading && !user) setLocation("/auth");
    if (account && account.userRole !== "admin" && account.userRole !== "superadmin") setLocation("/dashboard");
  }, [authLoading, user, account]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-cedu-blue" />
      </div>
    );
  }

  if (account && account.userRole !== "admin" && account.userRole !== "superadmin") return null;

  const isSuperadmin = account?.userRole === "superadmin";

  const adminTabsFromDef = roleDef?.sidebarConfig?.adminTabs;
  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.superadminOnly && !isSuperadmin) return false;
    if (adminTabsFromDef && adminTabsFromDef.length > 0) {
      return adminTabsFromDef.includes(item.id);
    }
    return true;
  });

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab />;
      case "usuarios": return <EnhancedUsersTab />;
      case "empresas": return <EnhancedOrgsTab />;
      case "cursos": return <CursosTab />;
      case "certificados": return <AdminCertsTab />;
      case "instructores": return <AdminInstructorApplicationsTab />;
      case "pagos": return <PagosTab />;
      case "facturacion": return <FacturacionTab />;
      case "dispersion": return <DispersionPlaceholder />;
      case "comisiones-crm": return <ComisionesCrmTab />;
      case "denue": return <DenueTab />;
      case "blog": return <AdminBlogTab />;
      case "newsletter": return <AdminNewsletterTab />;
      case "seguros": return <AdminSegurosTab />;
      case "api-externa": return <AdminApiExternaTab />;
      case "memberships": return <AdminMembershipsTab />;
      case "documentos-legales": return <AdminDocumentosLegalesTab />;
      case "soporte": return <SoporteTab />;
      case "configuracion": return <ConfiguracionTab />;
      case "roles": return <RolesTab />;
      case "matriz": return <PermissionMatrixTab />;
      case "recursos-socios": return <SocioResourcesTab />;
      case "logs": return <RoleChangeLogTab />;
      case "tienda": return <AdminTiendaTab isSuperadmin={isSuperadmin} />;
      default: return <OverviewTab />;
    }
  };

  let currentSection = "";

  return (
    <div className="min-h-screen bg-[#faf8f4] flex" data-testid="page-admin-panel">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-black/[0.06] flex flex-col transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        data-testid="sidebar-admin"
      >
        <div className="p-6 border-b border-black/[0.06]">
          <Link href="/" className="flex items-center gap-2.5 no-underline" data-testid="link-admin-logo">
            <div className="w-8 h-8 bg-cedu-blue rounded-[10px] flex items-center justify-center text-white font-serif text-lg">
              C
            </div>
            <div className="font-serif text-xl text-cedu-ink tracking-tight">
              Cedu<em className="text-cedu-blue not-italic italic">verse</em>
            </div>
          </Link>
          <div className="mt-3">
            <RoleBadge role={account?.userRole || "admin"} size="sm" />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            let sectionEl = null;
            if (item.section && item.section !== currentSection) {
              currentSection = item.section;
              sectionEl = (
                <div key={`section-${item.section}`} className="pt-4 pb-1 px-4">
                  <div className="border-t border-black/[0.06]" />
                  <p className="text-[10px] font-bold text-cedu-ink-muted uppercase tracking-wider mt-2">{item.section}</p>
                </div>
              );
            }

            const btn = (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? "bg-cedu-blue-light text-cedu-blue"
                    : "text-cedu-ink-muted hover:bg-black/[0.03] hover:text-cedu-ink"
                }`}
                data-testid={`nav-admin-${item.id}`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );

            return sectionEl ? [sectionEl, btn] : btn;
          })}
        </nav>

        <div className="p-4 border-t border-black/[0.06] space-y-1">
          <Link href="/admin/financiero">
            <span
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-cedu-blue hover:bg-cedu-blue-light transition-all cursor-pointer"
              data-testid="nav-admin-financiero"
            >
              <TrendingUp size={18} />
              Modelo Financiero
            </span>
          </Link>
          {user?.isExecutive && (
            <Link href="/admin/google-meet">
              <span
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-cedu-blue hover:bg-cedu-blue-light transition-all cursor-pointer"
                data-testid="nav-admin-google-meet"
              >
                <Video size={18} />
                Google Meet
              </span>
            </Link>
          )}
          <Link href="/conferencias">
            <span
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-cedu-ink-muted hover:bg-black/[0.03] hover:text-cedu-ink transition-all cursor-pointer"
              data-testid="nav-admin-aula-virtual"
            >
              <GraduationCap size={18} />
              Conferencias Ceduverse
            </span>
          </Link>
          <Link href="/dashboard">
            <span
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-cedu-ink-muted hover:bg-black/[0.03] hover:text-cedu-ink transition-all cursor-pointer"
              data-testid="nav-admin-back-dashboard"
            >
              <ArrowLeft size={18} />
              Mi Dashboard
            </span>
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-cedu-ink-muted hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
            data-testid="button-admin-logout"
          >
            <LogOut size={18} />
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
        <header className="sticky top-0 z-20 bg-[#faf8f4]/85 backdrop-blur-xl border-b border-black/[0.06] px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 text-cedu-ink"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="button-admin-toggle-sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="font-serif text-lg text-cedu-ink" data-testid="text-admin-page-title">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cedu-blue rounded-full flex items-center justify-center text-white text-sm font-bold">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "A"}
            </div>
            <span className="text-sm font-semibold text-cedu-ink hidden sm:block" data-testid="text-admin-user-email">
              {user?.email}
            </span>
          </div>
        </header>

        <main className="p-4 sm:p-6 md:p-8 max-w-[1100px] overflow-x-hidden">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
