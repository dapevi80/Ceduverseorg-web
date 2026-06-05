import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useForceLightMode } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Handshake,
  Building2,
  Users,
  Tag,
  Copy,
  Plus,
  DollarSign,
  BarChart3,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  FileText,
  UserCircle,
  Download,
  Share2,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Shield,
  Star,
  Menu,
  X,
  GraduationCap,
  Award,
  Banknote,
  Target,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import DenueTab from "@/pages/denue-tab";

type PartnerStats = {
  activeCompanies: number;
  monthlyCommission: number;
  trainedCollaborators: number;
  dc3Sold: number;
  totalOrgs: number;
  totalCodes: number;
  totalUsage: number;
  totalCommission: number;
};

type PartnerOrg = {
  id: string;
  name: string;
  description: string | null;
  plan: string | null;
  status: string;
  memberCount: number;
  createdAt: string;
};

type ReferralCode = {
  id: string;
  code: string;
  label: string | null;
  commission: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
};

type PartnerCommission = {
  id: string;
  partnerId: string;
  teamId: string;
  teamName: string;
  amount: number;
  feePercent: number | null;
  commissionPercent: number | null;
  status: string;
  periodMonth: number;
  periodYear: number;
  paidAt: string | null;
  createdAt: string;
};

type PartnerProfile = {
  id: string;
  fullName: string | null;
  country: string | null;
  city: string | null;
  phoneNumber: string | null;
  walletAddress: string | null;
  genre: string | null;
};

type PartnerAccount = {
  id: string;
  accountType: string;
  accountSetup: number;
  referralCode: string | null;
  userRole: string;
};

type AuthUser = {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
};

type TabKey = "overview" | "referidos" | "orgs" | "commissions" | "code" | "material" | "profile" | "denue";

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const SHARE_BASE_URL = "https://ceduverse.org";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

export default function PartnerDashboard() {
  useForceLightMode();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>("overview");
  const [createCodeOpen, setCreateCodeOpen] = useState(false);
  const [codeLabel, setCodeLabel] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: account } = useQuery<PartnerAccount>({
    queryKey: ["/api/me/account"],
    enabled: !!user,
  });

  const { data: profile } = useQuery<PartnerProfile>({
    queryKey: ["/api/me/profile"],
    enabled: !!user,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<PartnerStats>({
    queryKey: ["/api/partner/stats"],
    enabled: !!user,
  });

  const { data: orgs, isLoading: orgsLoading } = useQuery<PartnerOrg[]>({
    queryKey: ["/api/partner/orgs"],
    enabled: !!user,
  });

  const { data: codes, isLoading: codesLoading } = useQuery<ReferralCode[]>({
    queryKey: ["/api/partner/referrals"],
    enabled: !!user,
  });

  const { data: commissions = [], isLoading: commissionsLoading } = useQuery<PartnerCommission[]>({
    queryKey: ["/api/partner/commissions"],
    enabled: !!user,
  });

  const createCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/partner/referrals", { label: codeLabel || null });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Código creado" });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/referrals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/stats"] });
      setCodeLabel("");
      setCreateCodeOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: "Código copiado" });
  };

  const copyShareUrl = (code: string) => {
    const url = `${SHARE_BASE_URL}/empresas?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Enlace copiado", description: "Comparte este enlace con tus prospectos" });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/auth");
    }
  }, [authLoading, user, setLocation]);

  useEffect(() => {
    if (account && account.userRole !== "socio_comercial" && account.userRole !== "partner" && account.userRole !== "director" && account.userRole !== "superadmin") {
      setLocation("/dashboard");
    }
  }, [account, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cedu-violet" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (account && account.userRole !== "socio_comercial" && account.userRole !== "partner" && account.userRole !== "director" && account.userRole !== "superadmin") {
    return null;
  }

  const navItems: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
    { key: "overview", label: "Resumen", icon: BarChart3 },
    { key: "referidos", label: "Mis Referidos", icon: Users },
    { key: "orgs", label: "Organizaciones", icon: Building2 },
    { key: "commissions", label: "Comisiones", icon: DollarSign },
    { key: "code", label: "Código de Referido", icon: Tag },
    { key: "denue", label: "Prospectos", icon: Target },
    { key: "material", label: "Material de Ventas", icon: FileText },
    { key: "profile", label: "Perfil", icon: UserCircle },
  ];

  const externalLinks: { id: string; label: string; icon: typeof BarChart3; href: string }[] = [
    { id: "aula-virtual", label: "Aula Virtual", icon: GraduationCap, href: "/aula-virtual" },
    { id: "certificados", label: "Certificados", icon: Award, href: "/dashboard?tab=certificados" },
    { id: "mi-dashboard", label: "Mi Dashboard", icon: ArrowLeft, href: "/dashboard" },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <header className="bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="sm:hidden p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="button-mobile-menu">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Handshake className="w-6 h-6 text-cedu-violet" />
          <h1 className="font-['DM_Serif_Display'] text-lg sm:text-xl">Ceduverse — Socio Comercial</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </div>
      </header>

      <div className="flex">
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black/30 sm:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}
        <nav className={`${mobileMenuOpen ? "fixed inset-y-0 left-0 z-50 w-64 pt-16" : "hidden"} sm:block sm:static sm:w-56 bg-white border-r min-h-[calc(100vh-73px)] p-4 flex flex-col`}>
          <div className="space-y-1 flex-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                data-testid={`nav-partner-${item.key}`}
                onClick={() => { setTab(item.key); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-['Plus_Jakarta_Sans'] transition-colors ${
                  tab === item.key ? "bg-cedu-violet text-white" : "hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </button>
            ))}
          </div>
          <div className="border-t border-black/[0.06] pt-3 mt-3 space-y-1">
            {externalLinks.map((link) => (
              <button
                key={link.id}
                data-testid={`nav-partner-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                onClick={() => { setMobileMenuOpen(false); setLocation(link.href); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-['Plus_Jakarta_Sans'] text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <link.icon className="w-4 h-4" /> {link.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 p-4 sm:p-6 max-w-5xl">
          {tab === "overview" && (
            <OverviewTab
              profile={profile || null}
              stats={stats || null}
              statsLoading={statsLoading}
              orgs={orgs || []}
              commissions={commissions}
              setTab={setTab}
            />
          )}
          {tab === "referidos" && (
            <ReferidosTab
              codes={codes || []}
              codesLoading={codesLoading}
              createCodeOpen={createCodeOpen}
              setCreateCodeOpen={setCreateCodeOpen}
              codeLabel={codeLabel}
              setCodeLabel={setCodeLabel}
              createCodeMutation={createCodeMutation}
              copiedCode={copiedCode}
              copyCode={copyCode}
            />
          )}
          {tab === "orgs" && <OrgsTab orgs={orgs || []} orgsLoading={orgsLoading} />}
          {tab === "commissions" && (
            <CommissionsTab
              stats={stats || null}
              commissions={commissions}
              commissionsLoading={commissionsLoading}
            />
          )}
          {tab === "code" && (
            <CodigoReferidoTab
              codes={codes || []}
              codesLoading={codesLoading}
              copiedCode={copiedCode}
              copyCode={copyCode}
              copyShareUrl={copyShareUrl}
            />
          )}
          {tab === "denue" && <DenueTab />}
          {tab === "material" && <MaterialVentasTab codes={codes || []} copyShareUrl={copyShareUrl} />}
          {tab === "profile" && (
            <ProfileTab
              profile={profile || null}
              account={account || null}
              user={user}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function OverviewTab({ profile, stats, statsLoading, orgs, commissions, setTab }: {
  profile: PartnerProfile | null;
  stats: PartnerStats | null;
  statsLoading: boolean;
  orgs: PartnerOrg[];
  commissions: PartnerCommission[];
  setTab: (tab: TabKey) => void;
}) {
  const monthlyData = getMonthlyCommissions(commissions);

  return (
    <div className="space-y-6">
      <Card className="border-black/[0.06] overflow-hidden" data-testid="card-partner-welcome">
        <div className="h-1.5 bg-gradient-to-r from-cedu-violet via-cedu-blue to-cedu-orange" />
        <CardContent className="pt-6">
          <div className="flex items-start sm:items-center gap-4 flex-wrap sm:flex-nowrap">
            <div className="w-14 h-14 bg-cedu-violet rounded-2xl flex items-center justify-center text-white font-['DM_Serif_Display'] text-2xl flex-shrink-0">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "S"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-['DM_Serif_Display'] text-xl text-cedu-ink" data-testid="text-partner-greeting">
                {getGreeting()}, {profile?.fullName?.split(" ")[0] || "Socio"}
              </h2>
              <p className="text-sm text-gray-500 font-['Plus_Jakarta_Sans']">
                Panel de Socio Comercial Ceduverse
              </p>
            </div>
            <Badge className="bg-cedu-violet/10 text-cedu-violet border-0 text-xs font-semibold px-3 py-1.5 flex-shrink-0 gap-1" data-testid="badge-partner">
              <Shield className="w-3 h-3" /> Socio Comercial
            </Badge>
          </div>
        </CardContent>
      </Card>

      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-black/[0.06]" data-testid="stat-active-companies">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 bg-cedu-violet/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-cedu-violet" />
                </div>
              </div>
              <p className="text-2xl font-bold font-['DM_Serif_Display']">{stats.activeCompanies}</p>
              <p className="text-[11px] text-gray-500 font-['Plus_Jakarta_Sans']">Empresas Activas</p>
            </CardContent>
          </Card>

          <Card className="border-black/[0.06]" data-testid="stat-monthly-commissions">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 bg-cedu-green/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-cedu-green" />
                </div>
              </div>
              <p className="text-2xl font-bold font-['DM_Serif_Display']">${stats.monthlyCommission.toLocaleString()}</p>
              <p className="text-[11px] text-gray-500 font-['Plus_Jakarta_Sans']">Comisiones del Mes</p>
            </CardContent>
          </Card>

          <Card className="border-black/[0.06]" data-testid="stat-trained-collaborators">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 bg-cedu-blue/10 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-cedu-blue" />
                </div>
              </div>
              <p className="text-2xl font-bold font-['DM_Serif_Display']">{stats.trainedCollaborators}</p>
              <p className="text-[11px] text-gray-500 font-['Plus_Jakarta_Sans']">Colaboradores Capacitados</p>
            </CardContent>
          </Card>

          <Card className="border-black/[0.06]" data-testid="stat-dc3-sold">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 bg-cedu-orange/10 rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4 text-cedu-orange" />
                </div>
              </div>
              <p className="text-2xl font-bold font-['DM_Serif_Display']">{stats.dc3Sold}</p>
              <p className="text-[11px] text-gray-500 font-['Plus_Jakarta_Sans']">DC-3 Vendidos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {monthlyData.length > 0 && (
        <Card className="border-black/[0.06]" data-testid="chart-commissions">
          <CardContent className="pt-5 pb-4">
            <h3 className="font-['DM_Serif_Display'] text-base mb-4">Comisiones — Últimos 6 Meses</h3>
            <SimpleBarChart data={monthlyData} />
          </CardContent>
        </Card>
      )}

      <Card className="border-black/[0.06]" data-testid="table-recent-companies">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['DM_Serif_Display'] text-base">Empresas Referidas Recientes</h3>
            <Button variant="ghost" size="sm" className="text-xs text-cedu-violet" onClick={() => setTab("orgs")} data-testid="button-view-all-orgs">
              Ver todas
            </Button>
          </div>
          {orgs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6 font-['Plus_Jakarta_Sans']">Sin organizaciones referidas aún</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-['Plus_Jakarta_Sans']">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-400">
                    <th className="pb-2 font-medium">Empresa</th>
                    <th className="pb-2 font-medium">Plan</th>
                    <th className="pb-2 font-medium">Miembros</th>
                    <th className="pb-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.slice(0, 5).map((org) => (
                    <tr key={org.id} className="border-b border-gray-50" data-testid={`recent-org-${org.id}`}>
                      <td className="py-3 font-semibold">{org.name}</td>
                      <td className="py-3">{org.plan || "—"}</td>
                      <td className="py-3">{org.memberCount}</td>
                      <td className="py-3">
                        <Badge variant={org.status === "active" ? "default" : "secondary"} className="text-[10px]">
                          {org.status === "active" ? "Activa" : org.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end gap-2 h-36" data-testid="bar-chart">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-500 font-['Plus_Jakarta_Sans']">${item.value.toLocaleString()}</span>
          <div className="w-full relative" style={{ height: `${Math.max((item.value / maxVal) * 100, 4)}%` }}>
            <div className="absolute inset-0 bg-cedu-violet/80 rounded-t" />
          </div>
          <span className="text-[10px] text-gray-500 font-['Plus_Jakarta_Sans']">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function getMonthlyCommissions(commissions: PartnerCommission[]): { label: string; value: number }[] {
  if (!commissions.length) return [];
  const byMonth = new Map<string, number>();
  for (const c of commissions) {
    const key = `${c.periodYear}-${String(c.periodMonth).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) || 0) + c.amount);
  }
  const sorted = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  return sorted.map(([key, value]) => {
    const [, m] = key.split("-");
    return { label: MONTH_NAMES[parseInt(m) - 1] || m, value };
  });
}

function ReferidosTab({ codes, codesLoading, createCodeOpen, setCreateCodeOpen, codeLabel, setCodeLabel, createCodeMutation, copiedCode, copyCode }: {
  codes: ReferralCode[];
  codesLoading: boolean;
  createCodeOpen: boolean;
  setCreateCodeOpen: (v: boolean) => void;
  codeLabel: string;
  setCodeLabel: (v: string) => void;
  createCodeMutation: { mutate: () => void; isPending: boolean };
  copiedCode: string | null;
  copyCode: (code: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-['DM_Serif_Display'] text-2xl">Mis Referidos</h2>
        <Dialog open={createCodeOpen} onOpenChange={setCreateCodeOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cedu-violet hover:bg-cedu-violet/90" data-testid="button-create-code">
              <Plus className="w-4 h-4 mr-2" /> Crear Código
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-['DM_Serif_Display']">Nuevo Código de Referido</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Etiqueta (opcional)</Label>
                <Input
                  data-testid="input-code-label"
                  value={codeLabel}
                  onChange={(e) => setCodeLabel(e.target.value)}
                  placeholder="Ej: Campaña Enero 2026"
                />
              </div>
              <Button
                className="w-full bg-cedu-violet hover:bg-cedu-violet/90"
                onClick={() => createCodeMutation.mutate()}
                disabled={createCodeMutation.isPending}
                data-testid="button-confirm-code"
              >
                {createCodeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Generar Código
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {codesLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (!codes || codes.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-['Plus_Jakarta_Sans']">No has creado códigos de referido</p>
            <p className="text-sm text-gray-400 mt-2">Crea un código para empezar a referir empresas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {codes.map((code) => (
            <Card key={code.id} data-testid={`card-code-${code.id}`}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono font-bold" data-testid={`text-code-${code.id}`}>{code.code}</code>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyCode(code.code)} data-testid={`button-copy-${code.id}`}>
                        {copiedCode === code.code ? <CheckCircle2 className="w-4 h-4 text-cedu-green" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Badge variant={code.isActive ? "default" : "secondary"}>{code.isActive ? "Activo" : "Inactivo"}</Badge>
                    </div>
                    {code.label && <p className="text-sm text-gray-500">{code.label}</p>}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="text-center">
                      <p className="font-bold text-lg" data-testid={`usage-count-${code.id}`}>{code.usageCount}</p>
                      <p className="text-xs text-gray-400">Usos</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg">{code.commission}%</p>
                      <p className="text-xs text-gray-400">Comisión</p>
                    </div>
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

function OrgsTab({ orgs, orgsLoading }: { orgs: PartnerOrg[]; orgsLoading: boolean }) {
  return (
    <div>
      <h2 className="font-['DM_Serif_Display'] text-2xl mb-6">Organizaciones</h2>
      {orgsLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (!orgs || orgs.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-['Plus_Jakarta_Sans']">Aún no tienes organizaciones referidas</p>
            <p className="text-sm text-gray-400 mt-2">Comparte tus códigos de referido para atraer organizaciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orgs.map((org) => (
            <Card key={org.id} data-testid={`card-partner-org-${org.id}`}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cedu-violet/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-cedu-violet" />
                  </div>
                  <div>
                    <p className="font-semibold font-['Plus_Jakarta_Sans']">{org.name}</p>
                    <p className="text-sm text-gray-500">{org.description || "Sin descripción"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {org.plan && <Badge variant="secondary">{org.plan}</Badge>}
                  <Badge variant={org.status === "active" ? "default" : "secondary"}>{org.status === "active" ? "Activa" : org.status}</Badge>
                  <span className="text-gray-500"><Users className="w-3 h-3 inline mr-1" />{org.memberCount} miembros</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CommissionsTab({ stats, commissions, commissionsLoading }: {
  stats: PartnerStats | null;
  commissions: PartnerCommission[];
  commissionsLoading: boolean;
}) {
  const monthlyData = getMonthlyCommissions(commissions);
  const STATUS_LABELS: Record<string, string> = {
    pending: "Pendiente", approved: "Aprobada", paid: "Pagada", cancelled: "Cancelada",
  };
  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600", approved: "bg-blue-50 text-blue-600",
    paid: "bg-green-50 text-green-600", cancelled: "bg-red-50 text-red-600",
  };

  return (
    <div className="space-y-6">
      <h2 className="font-['DM_Serif_Display'] text-2xl">Comisiones</h2>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-black/[0.06]">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-500 font-['Plus_Jakarta_Sans']">Total Acumulado</p>
            <p className="text-3xl font-bold font-['DM_Serif_Display'] text-cedu-green" data-testid="text-total-commission">
              ${stats?.totalCommission?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-black/[0.06]">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-500 font-['Plus_Jakarta_Sans']">Comisión Mensual</p>
            <p className="text-3xl font-bold font-['DM_Serif_Display'] text-cedu-blue" data-testid="text-monthly-commission">
              ${stats?.monthlyCommission?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {monthlyData.length > 0 && (
        <Card className="border-black/[0.06]">
          <CardContent className="pt-5 pb-4">
            <h3 className="font-['DM_Serif_Display'] text-base mb-4">Historial Mensual</h3>
            <SimpleBarChart data={monthlyData} />
          </CardContent>
        </Card>
      )}

      <Card className="border-black/[0.06]" data-testid="card-commissions-breakdown">
        <CardContent className="pt-5 pb-4">
          <h3 className="font-['DM_Serif_Display'] text-base mb-4">Desglose Mensual por Empresa</h3>
          {commissionsLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : commissions.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">Sin comisiones registradas aún</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-['Plus_Jakarta_Sans']">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-400">
                    <th className="pb-2 font-medium">Empresa</th>
                    <th className="pb-2 font-medium">Período</th>
                    <th className="pb-2 font-medium text-right">Residual (est.)</th>
                    <th className="pb-2 font-medium text-right">Certificaciones (est.)</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                    <th className="pb-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.slice(0, 25).map((c) => {
                    const certPortion = Math.round(c.amount * 0.3);
                    const residualPortion = c.amount - certPortion;
                    return (
                      <tr key={c.id} className="border-b border-gray-50" data-testid={`commission-row-${c.id}`}>
                        <td className="py-3 font-semibold">{c.teamName}</td>
                        <td className="py-3 text-gray-500">{MONTH_NAMES[(c.periodMonth || 1) - 1]} {c.periodYear}</td>
                        <td className="py-3 text-right">${residualPortion.toLocaleString()}</td>
                        <td className="py-3 text-right">${certPortion.toLocaleString()}</td>
                        <td className="py-3 text-right font-bold text-cedu-green">${c.amount.toLocaleString()}</td>
                        <td className="py-3">
                          <Badge className={`text-[10px] border-0 ${STATUS_COLORS[c.status] || STATUS_COLORS.pending}`}>
                            {STATUS_LABELS[c.status] || c.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-black/[0.06]" data-testid="card-banking-details">
        <CardContent className="pt-5 pb-4">
          <h3 className="font-['DM_Serif_Display'] text-base mb-3">Datos Bancarios para Dispersión</h3>
          <div className="space-y-3 text-sm font-['Plus_Jakarta_Sans']">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Banco</span>
              <span className="font-medium" data-testid="text-bank-name">BanRegio</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Beneficiario</span>
              <span className="font-medium" data-testid="text-bank-beneficiary">Ceduverse SAPI de CV</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-500">CLABE</span>
              <span className="font-mono text-xs" data-testid="text-bank-clabe">••• ••• •••• •••• ••</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Las comisiones aprobadas se dispersan los días 25 de cada mes. Para actualizar tus datos bancarios, contacta a{" "}
              <a href="mailto:socios@ceduverse.org" className="text-cedu-violet font-semibold" data-testid="link-banking-support">socios@ceduverse.org</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CodigoReferidoTab({ codes, codesLoading, copiedCode, copyCode, copyShareUrl }: {
  codes: ReferralCode[];
  codesLoading: boolean;
  copiedCode: string | null;
  copyCode: (code: string) => void;
  copyShareUrl: (code: string) => void;
}) {
  const primaryCode = codes.find(c => c.isActive) || codes[0];

  if (codesLoading) {
    return (
      <div className="space-y-4">
        <h2 className="font-['DM_Serif_Display'] text-2xl">Código de Referido</h2>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!primaryCode) {
    return (
      <div>
        <h2 className="font-['DM_Serif_Display'] text-2xl mb-6">Código de Referido</h2>
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-['Plus_Jakarta_Sans']">No tienes códigos de referido activos</p>
            <p className="text-sm text-gray-400 mt-2">Ve a "Mis Referidos" para crear tu primer código</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shareUrl = `${SHARE_BASE_URL}/empresas?ref=${primaryCode.code}`;

  return (
    <div className="space-y-6">
      <h2 className="font-['DM_Serif_Display'] text-2xl">Código de Referido</h2>

      <Card className="border-cedu-violet/20" data-testid="card-referral-code-main">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center gap-6">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm" data-testid="qr-code-container">
              <QRCodeSVG
                value={shareUrl}
                size={180}
                fgColor="#7c3aed"
                level="M"
              />
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 font-['Plus_Jakarta_Sans'] mb-2">Tu código de referido</p>
              <code className="text-2xl font-mono font-bold text-cedu-violet bg-cedu-violet/5 px-4 py-2 rounded-lg block" data-testid="text-primary-code">
                {primaryCode.code}
              </code>
            </div>

            <div className="w-full max-w-md">
              <p className="text-xs text-gray-500 font-['Plus_Jakarta_Sans'] mb-2 text-center">Enlace compartible</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-50 px-3 py-2 rounded border text-xs font-mono text-cedu-violet break-all" data-testid="text-share-url">
                  {shareUrl}
                </code>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => copyCode(primaryCode.code)} data-testid="button-copy-primary-code">
                {copiedCode === primaryCode.code ? <CheckCircle2 className="w-4 h-4 mr-2 text-cedu-green" /> : <Copy className="w-4 h-4 mr-2" />}
                Copiar código
              </Button>
              <Button variant="outline" onClick={() => copyShareUrl(primaryCode.code)} data-testid="button-copy-primary-link">
                <Share2 className="w-4 h-4 mr-2" /> Copiar enlace
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {codes.length > 1 && (
        <Card className="border-black/[0.06]">
          <CardContent className="pt-5 pb-4">
            <h3 className="font-['DM_Serif_Display'] text-base mb-3">Otros Códigos</h3>
            <div className="space-y-2">
              {codes.filter(c => c.id !== primaryCode.id).map((code) => (
                <div key={code.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm" data-testid={`other-code-${code.id}`}>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs font-bold">{code.code}</code>
                    {code.label && <span className="text-gray-400">({code.label})</span>}
                    <Badge variant={code.isActive ? "default" : "secondary"} className="text-[10px]">{code.isActive ? "Activo" : "Inactivo"}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{code.usageCount} usos</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyCode(code.code)} data-testid={`button-copy-other-${code.id}`}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MaterialVentasTab({ codes, copyShareUrl }: { codes: ReferralCode[]; copyShareUrl: (code: string) => void }) {
  const materials = [
    {
      title: "Kit Cooperativo PDF",
      description: "Documento completo del modelo cooperativo Ceduverse con beneficios, planes y precios.",
      icon: FileText,
      action: "/kit-cooperativo",
    },
    {
      title: "Presentación Ceduverse para Empresas",
      description: "Deck ejecutivo con propuesta de valor, planes, certificaciones y casos de éxito.",
      icon: FileText,
      action: "/materiales/ceduverse-empresas-2026.pdf",
    },
    {
      title: "Medios de Pago",
      description: "Documento con las formas de pago disponibles para compartir con prospectos.",
      icon: FileText,
      action: "/materiales/medios-de-pago.pdf",
    },
    {
      title: "Bold Assets (Logos y Marca)",
      description: "Logotipos, paleta de colores, tipografías y lineamientos de marca Ceduverse.",
      icon: Star,
      action: null,
    },
    {
      title: "Script de Ventas",
      description: "Guión recomendado para presentaciones con tomadores de decisiones en empresas.",
      icon: FileText,
      action: null,
    },
    {
      title: "Catálogo de Cursos STPS (Aula Virtual)",
      description: "29 cursos con DC-3 disponible. Temáticas: liderazgo, seguridad, habilidades blandas.",
      icon: GraduationCap,
      action: "/aula-virtual",
    },
    {
      title: "Catálogo Tutor IA",
      description: "49 cursos con IA adaptativa y narración de audio. Certificación digital incluida.",
      icon: GraduationCap,
      action: "/studio",
    },
  ];

  const primaryCode = codes.find(c => c.isActive);

  return (
    <div className="space-y-6">
      <h2 className="font-['DM_Serif_Display'] text-2xl">Material de Ventas</h2>

      {primaryCode && (
        <Card className="border-cedu-violet/20 bg-cedu-violet/[0.03]">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-cedu-violet flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-['DM_Serif_Display'] text-base mb-1">Tu Enlace Personalizado</h3>
                <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2">
                  Incluye este enlace en tus materiales y presentaciones. Los registros se vinculan a tu cuenta automáticamente.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="bg-white px-3 py-1.5 rounded border text-xs font-mono text-cedu-violet break-all" data-testid="text-material-share-url">
                    {SHARE_BASE_URL}/empresas?ref={primaryCode.code}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copyShareUrl(primaryCode.code)} data-testid="button-copy-material-link">
                    <Copy className="w-3 h-3 mr-1" /> Copiar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {materials.map((mat, i) => (
          <Card key={i} className="border-black/[0.06]" data-testid={`material-item-${i}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cedu-blue/10 rounded-lg flex items-center justify-center">
                    <mat.icon className="w-5 h-5 text-cedu-blue" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm font-['Plus_Jakarta_Sans']">{mat.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{mat.description}</p>
                  </div>
                </div>
                {mat.action ? (
                  <a href={mat.action} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" data-testid={`button-download-${i}`}>
                      <Download className="w-3 h-3 mr-1" /> Descargar
                    </Button>
                  </a>
                ) : (
                  <Button variant="outline" size="sm" disabled data-testid={`button-download-${i}`}>
                    <Download className="w-3 h-3 mr-1" /> Próximamente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-black/[0.06]">
        <CardContent className="py-6 text-center">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-['Plus_Jakarta_Sans']">
            ¿Necesitas material adicional o personalizado? Contacta a tu ejecutivo de cuenta en{" "}
            <a href="mailto:socios@ceduverse.org" className="text-cedu-violet font-semibold" data-testid="link-sales-support">socios@ceduverse.org</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileTab({ profile, account, user }: {
  profile: PartnerProfile | null;
  account: PartnerAccount | null;
  user: AuthUser;
}) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || "");
  const [city, setCity] = useState(profile?.city || "");
  const [country, setCountry] = useState(profile?.country || "");

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setPhoneNumber(profile.phoneNumber || "");
      setCity(profile.city || "");
      setCountry(profile.country || "");
    }
  }, [profile]);

  const profileMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await apiRequest("PATCH", "/api/me/profile", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Perfil actualizado" });
      queryClient.invalidateQueries({ queryKey: ["/api/me/profile"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    profileMutation.mutate({ fullName, phoneNumber, city, country });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="font-['DM_Serif_Display'] text-2xl">Perfil de Socio</h2>

      <Card className="border-black/[0.06]">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-cedu-violet rounded-2xl flex items-center justify-center text-white font-['DM_Serif_Display'] text-3xl">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "S"}
            </div>
            <div>
              <h3 className="font-['DM_Serif_Display'] text-lg" data-testid="text-profile-name">{profile?.fullName || "Socio Comercial"}</h3>
              <p className="text-sm text-gray-500 font-['Plus_Jakarta_Sans']" data-testid="text-profile-email">{user?.email}</p>
              <Badge className="bg-cedu-violet/10 text-cedu-violet border-0 text-xs mt-1 gap-1" data-testid="badge-profile-role">
                <Shield className="w-3 h-3" /> Socio Comercial
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Nombre completo</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} data-testid="input-profile-name" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Teléfono</Label>
              <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+52..." data-testid="input-profile-phone" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Ciudad</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} data-testid="input-profile-city" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">País</Label>
              <Input value={country} onChange={e => setCountry(e.target.value)} data-testid="input-profile-country" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              className="bg-cedu-violet hover:bg-cedu-violet/90"
              onClick={handleSave}
              disabled={profileMutation.isPending}
              data-testid="button-save-profile"
            >
              {profileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar Cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-black/[0.06]">
        <CardContent className="pt-5 pb-4">
          <h3 className="font-['DM_Serif_Display'] text-base mb-3">Información de Cuenta</h3>
          <div className="space-y-3 text-sm font-['Plus_Jakarta_Sans']">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Email</span>
              <span className="font-medium" data-testid="text-account-email">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Rol</span>
              <Badge className="bg-cedu-violet/10 text-cedu-violet border-0" data-testid="text-account-role">Socio Comercial</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Tipo de Cuenta</span>
              <span className="font-medium capitalize" data-testid="text-account-type">{account?.accountType || "premium"}</span>
            </div>
            {profile?.walletAddress && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">Wallet</span>
                <code className="text-xs font-mono" data-testid="text-wallet-address">{profile.walletAddress.slice(0, 8)}...{profile.walletAddress.slice(-6)}</code>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
