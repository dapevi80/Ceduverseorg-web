import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/auth-token";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Upload,
  Search,
  MapPin,
  Building2,
  Phone,
  Globe,
  Mail,
  Star,
  ChevronRight,
  Loader2,
  Filter,
  Table,
  LayoutGrid,
  X,
  Users,
  Target,
  FileSpreadsheet,
  Sparkles,
  Zap,
  DollarSign,
  CheckSquare,
  Trash2,
  UserPlus,
  FolderPlus,
  ArrowRight,
  Save,
  BookmarkPlus,
  FolderOpen,
  Shield,
  Briefcase,
  CreditCard,
  MoreHorizontal,
  StickyNote,
  Clock,
  Video,
  CalendarClock,
  User,
  FileText,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

type DenueProspecto = {
  id: string;
  denueId: string | null;
  nombreComercial: string;
  razonSocial: string | null;
  actividadEconomica: string | null;
  codigoScian: string | null;
  tipoEstablecimiento: string | null;
  estratoPersonal: string | null;
  empleadosMin: number | null;
  empleadosMax: number | null;
  telefono: string | null;
  correoElectronico: string | null;
  sitioWeb: string | null;
  tipoVialidad: string | null;
  calle: string | null;
  numExterior: string | null;
  numInterior: string | null;
  colonia: string | null;
  codigoPostal: string | null;
  municipio: string | null;
  estado: string | null;
  latitud: number | null;
  longitud: number | null;
  leadScore: number;
  scoreDesglose: Record<string, number> | null;
  stage: string;
  partnerId: string | null;
  nomsAplicables: string[] | null;
  zonaComercial: string | null;
  prioridad: string | null;
  empleadosEstimados: number | null;
  potencialAportacionMensual: number | null;
  nivelRiesgo: string | null;
  grupoSector: string | null;
  planRecomendado: string | null;
  direccionCompleta: string | null;
  contactGroupId: string | null;
  nombreContacto: string | null;
  rfc: string | null;
  notas: string | null;
  lastContactedAt: string | null;
  importBatchId: string | null;
  fechaAlta: string | null;
  createdAt: string;
  updatedAt: string | null;
  efos69b?: { rfc: string; situacion: string; nombre: string } | null;
};

type ContactGroup = {
  id: string;
  name: string;
  description: string | null;
  filterCriteria: any;
  assignedSocioId: string | null;
  prospectCount: number;
  createdAt: string;
  updatedAt: string | null;
};

type SavedFilter = {
  id: string;
  name: string;
  filterConfig: Record<string, string>;
  createdBy: string | null;
  createdAt: string;
};

type DenueStats = {
  total: number;
  avgEmpleados: number;
  conCorreo: number;
  conTelefono: number;
  valorMercado: number;
  trabajados: number;
  enriquecidas: number;
  stages: Record<string, number>;
  avgScore: number;
  topMunicipios: { municipio: string; count: number }[];
  totalPotencial?: number;
  prioridades?: Record<string, number>;
};

type DenueFilters = {
  estados: string[];
  municipios: string[];
  sectores: { codigo: string; actividad: string }[];
};

type PipelineValue = {
  targetId: string;
  byStage: Record<string, { count: number; monthly: number }>;
  totals: {
    totalCount: number;
    openCount: number;
    wonCount: number;
    openMonthly: number;
    openAnnual: number;
    wonMonthly: number;
    wonAnnual: number;
    weightedMonthly: number;
    weightedAnnual: number;
  };
};

type SortField = "leadScore" | "nombreComercial" | "stage" | "createdAt" | "grupoSector" | "actividadEconomica" | "municipio" | "estado" | "zonaComercial" | "estratoPersonal" | "empleadosEstimados" | "potencialAportacionMensual" | "prioridad" | "codigoScian" | "nivelRiesgo" | "planRecomendado";

const DENUE_STAGES = [
  { key: "nuevo", label: "Nuevo", color: "bg-gray-100 text-gray-700" },
  { key: "contactado", label: "Contactado", color: "bg-blue-100 text-blue-700" },
  { key: "demo", label: "Demo", color: "bg-purple-100 text-purple-700" },
  { key: "propuesta", label: "Propuesta", color: "bg-amber-100 text-amber-700" },
  { key: "negociacion", label: "Negociación", color: "bg-orange-100 text-orange-700" },
  { key: "cliente", label: "Cliente", color: "bg-green-100 text-green-700" },
];

function scoreColor(score: number) {
  if (score >= 70) return "text-green-600 bg-green-50";
  if (score >= 40) return "text-amber-600 bg-amber-50";
  return "text-red-500 bg-red-50";
}

function prioridadBadge(prio: string | null) {
  if (prio === "alta") return "bg-green-100 text-green-700";
  if (prio === "media") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-500";
}

function riesgoBadge(nivel: string | null) {
  if (nivel === "Alto") return "bg-red-100 text-red-700";
  if (nivel === "Medio") return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}

const ZONAS_COMERCIALES = ["Centro", "Norte", "Bajío", "Sur-Sureste"];

const ZONA_ESTADOS: Record<string, string[]> = {
  "Centro": ["Ciudad de México", "México", "Puebla", "Tlaxcala", "Morelos", "Hidalgo", "Querétaro"],
  "Norte": ["Nuevo León", "Chihuahua", "Coahuila de Zaragoza", "Tamaulipas", "Sonora", "Baja California", "Baja California Sur", "Sinaloa", "Durango", "San Luis Potosí", "Zacatecas", "Nayarit"],
  "Bajío": ["Jalisco", "Guanajuato", "Aguascalientes", "Colima", "Michoacán de Ocampo"],
  "Sur-Sureste": ["Veracruz de Ignacio de la Llave", "Oaxaca", "Chiapas", "Guerrero", "Tabasco", "Campeche", "Yucatán", "Quintana Roo"],
};

const ESTADOS_MEXICO = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila de Zaragoza",
  "Colima", "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco",
  "México", "Michoacán de Ocampo", "Morelos", "Nayarit", "Nuevo León",
  "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala",
  "Veracruz de Ignacio de la Llave", "Yucatán", "Zacatecas",
];

const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com","hotmail.com","hotmail.es","outlook.com","outlook.es",
  "yahoo.com","yahoo.com.mx","live.com","live.com.mx",
  "prodigy.net.mx","msn.com","aol.com","icloud.com",
  "mail.com","gmx.com","ymail.com","inbox.com",
  "googlemail.com","me.com","mac.com","protonmail.com",
  "tutanota.com","zoho.com","pm.me","fastmail.com",
]);

function inferWebsite(email: string | null, existingWeb: string | null): string | null {
  if (existingWeb) return existingWeb;
  if (!email || !email.includes("@")) return null;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || !domain.includes(".") || GENERIC_EMAIL_DOMAINS.has(domain)) return null;
  return `https://${domain}`;
}

function googleMapsUrl(prospect: DenueProspecto): string | null {
  if (prospect.latitud && prospect.longitud) {
    return `https://www.google.com/maps?q=${prospect.latitud},${prospect.longitud}`;
  }
  const parts = [prospect.nombreComercial, prospect.calle, prospect.numExterior, prospect.colonia, prospect.municipio, prospect.estado].filter(Boolean);
  if (parts.length >= 2) {
    return `https://www.google.com/maps/search/${encodeURIComponent(parts.join(", "))}`;
  }
  return null;
}

function formatMXN(amount: number | null) {
  if (!amount) return "—";
  return "$" + Math.round(amount).toLocaleString("es-MX");
}

export default function DenueTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<"table" | "kanban" | "map">("table");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterZona, setFilterZona] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterMunicipio, setFilterMunicipio] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterScoreMin, setFilterScoreMin] = useState("");
  const [filterScian, setFilterScian] = useState("");
  const [filterPartnerId, setFilterPartnerId] = useState("");
  const [filterEnrichment, setFilterEnrichment] = useState("");
  const [filterEfos, setFilterEfos] = useState("");
  const [sortField, setSortField] = useState<SortField>("leadScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedProspect, setSelectedProspect] = useState<DenueProspecto | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [interactionNote, setInteractionNote] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showSaveFilterDialog, setShowSaveFilterDialog] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  // Hybrid pipeline scope: "mine" = my book, "available" = unclaimed pool, "" = both (default).
  const [scope, setScope] = useState<"" | "mine" | "available">("");
  const [showAddProspect, setShowAddProspect] = useState(false);

  // Who am I? Drives the hybrid own/claim UX vs. the admin reassignment UX.
  const { data: account } = useQuery<{ id: string; userRole: string }>({
    queryKey: ["/api/me/account"],
  });
  const myId = account?.id ?? null;
  const isAdmin = !!account && ["admin", "superadmin", "director"].includes(account.userRole);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50");
    if (search) params.set("search", search);
    if (filterZona) params.set("zona", filterZona);
    if (filterEstado) params.set("estado", filterEstado);
    if (filterMunicipio) params.set("municipio", filterMunicipio);
    if (filterStage) params.set("stage", filterStage);
    if (filterScoreMin) params.set("scoreMin", filterScoreMin);
    if (filterScian) params.set("scian", filterScian);
    if (filterPartnerId) params.set("partnerId", filterPartnerId);
    if (filterEnrichment) params.set("enrichment", filterEnrichment);
    if (filterEfos) params.set("efos", filterEfos);
    if (scope) params.set("scope", scope);
    params.set("sortField", sortField);
    params.set("sortDir", sortDir);
    return params.toString();
  };

  const { data: prospectos, isLoading, isFetching } = useQuery<{
    data: DenueProspecto[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ["/api/denue/prospectos", page, search, filterZona, filterEstado, filterMunicipio, filterStage, filterScoreMin, filterScian, filterPartnerId, filterEnrichment, filterEfos, scope, sortField, sortDir],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch(`/api/denue/prospectos?${buildQueryParams()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar prospectos");
      return res.json();
    },
  });

  const statsParams = new URLSearchParams();
  if (filterZona) statsParams.set("zona", filterZona);
  if (filterEstado) statsParams.set("estado", filterEstado);
  if (filterMunicipio) statsParams.set("municipio", filterMunicipio);
  if (filterStage) statsParams.set("stage", filterStage);
  if (filterScoreMin) statsParams.set("scoreMin", filterScoreMin);
  if (filterScian) statsParams.set("scian", filterScian);
  if (filterPartnerId) statsParams.set("partnerId", filterPartnerId);
  if (filterEnrichment) statsParams.set("enrichment", filterEnrichment);
  if (filterEfos) statsParams.set("efos", filterEfos);
  if (search) statsParams.set("search", search);
  if (scope) statsParams.set("scope", scope);
  const statsQs = statsParams.toString();

  const { data: stats, isLoading: statsLoading } = useQuery<DenueStats>({
    queryKey: ["/api/denue/prospectos/stats", filterZona, filterEstado, filterMunicipio, filterStage, filterScoreMin, filterScian, filterPartnerId, filterEnrichment, filterEfos, search, scope],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch(`/api/denue/prospectos/stats${statsQs ? `?${statsQs}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar stats");
      return res.json();
    },
  });

  const { data: pipelineValue } = useQuery<PipelineValue>({
    queryKey: ["/api/denue/prospectos/pipeline-value"],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch("/api/denue/prospectos/pipeline-value", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar valor de cartera");
      return res.json();
    },
  });

  const { data: filters } = useQuery<DenueFilters>({
    queryKey: ["/api/denue/prospectos/filters", filterZona, filterEstado],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterZona) params.set("zona", filterZona);
      if (filterEstado) params.set("estado", filterEstado);
      const res = await fetch(`/api/denue/prospectos/filters?${params}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error("Error al cargar filtros");
      return res.json();
    },
  });

  const { data: partnersList = [] } = useQuery<{ id: string; fullName: string | null; email: string }[]>({
    queryKey: ["/api/denue/partners"],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch("/api/denue/partners", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: contactGroupsList = [] } = useQuery<ContactGroup[]>({
    queryKey: ["/api/denue/contact-groups"],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch("/api/denue/contact-groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: savedFiltersList = [] } = useQuery<SavedFilter[]>({
    queryKey: ["/api/denue/saved-filters"],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch("/api/denue/saved-filters", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: interactions = [] } = useQuery<{ id: string; tipo: string; notas: string | null; createdAt: string }[]>({
    queryKey: ["/api/denue/prospectos", selectedProspect?.id, "interacciones"],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch(`/api/denue/prospectos/${selectedProspect!.id}/interacciones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: !!selectedProspect,
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const token = getAuthToken();
      const res = await fetch("/api/denue/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al importar");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos/filters"] });
      toast({ title: "Importación completada", description: `${data.imported} importados, ${data.duplicates} duplicados, ${data.skipped} omitidos` });
    },
    onError: (err: Error) => {
      toast({ title: "Error al importar", description: err.message, variant: "destructive" });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      await apiRequest("PATCH", `/api/denue/prospectos/${id}/stage`, { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos/pipeline-value"] });
      toast({ title: "Etapa actualizada" });
    },
  });

  const enrichMutation = useMutation({
    mutationFn: async (batchSize: number = 10) => {
      const res = await apiRequest("POST", "/api/denue/enrich", { batchSize });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/denue/enrich/status"] });
      toast({ title: "Enriquecimiento completado", description: `${data.enriched} de ${data.total} prospectos enriquecidos con datos nuevos` });
    },
    onError: (err: Error) => {
      toast({ title: "Error al enriquecer", description: err.message, variant: "destructive" });
    },
  });

  const bulkEnrichMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = {};
      if (filterZona) body.zona = filterZona;
      if (filterMunicipio) body.municipio = filterMunicipio;
      if (filterEstado) body.estado = filterEstado;
      if (filterStage) body.stage = filterStage;
      if (filterScian) body.scian = filterScian;
      if (filterScoreMin) body.scoreMin = filterScoreMin;
      if (filterPartnerId) body.partnerId = filterPartnerId;
      if (filterEnrichment) body.enrichment = filterEnrichment;
      const res = await apiRequest("POST", "/api/denue/enrich/bulk", body);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Enriquecimiento iniciado", description: "Procesando prospectos en background..." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const stopBulkEnrichMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/denue/enrich/stop");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Detenido", description: "El proceso se detendrá en breve" });
    },
  });

  const enrichStatusQuery = useQuery<{ enrichedCount: number; bulk: { running: boolean; processed: number; total: number; enriched: number; errors: number; startedAt: string | null; lastUpdate: string | null; currentBatch: string; stopped: boolean } }>({
    queryKey: ["/api/denue/enrich/status"],
    enabled: !!stats?.total,
    refetchInterval: (query) => query.state.data?.bulk?.running ? 3000 : false,
  });

  const assignPartnerMutation = useMutation({
    mutationFn: async ({ id, partnerId }: { id: string; partnerId: string | null }) => {
      await apiRequest("PATCH", `/api/denue/prospectos/${id}/assign`, { partnerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos"] });
      toast({ title: "Socio asignado" });
    },
  });

  const invalidatePipeline = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos"] });
    queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos/pipeline-value"] });
  };

  const claimMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/denue/prospectos/${id}/claim`);
      return res.json();
    },
    onSuccess: (updated) => {
      invalidatePipeline();
      if (selectedProspect?.id === updated.id) setSelectedProspect(updated);
      toast({ title: "Prospecto reclamado", description: "Ahora está en tu cartera" });
    },
    onError: (err: Error) => toast({ title: "No se pudo reclamar", description: err.message, variant: "destructive" }),
  });

  const releaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/denue/prospectos/${id}/release`);
      return res.json();
    },
    onSuccess: (updated) => {
      invalidatePipeline();
      if (selectedProspect?.id === updated.id) setSelectedProspect(updated);
      toast({ title: "Prospecto liberado", description: "Regresó al pool disponible" });
    },
    onError: (err: Error) => toast({ title: "No se pudo liberar", description: err.message, variant: "destructive" }),
  });

  const bulkClaimMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => apiRequest("POST", `/api/denue/prospectos/${id}/claim`)));
    },
    onSuccess: (_, ids) => {
      invalidatePipeline();
      setSelectedIds(new Set());
      toast({ title: `${ids.length} prospectos reclamados` });
    },
    onError: (err: Error) => toast({ title: "Error al reclamar", description: err.message, variant: "destructive" }),
  });

  const createProspectMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiRequest("POST", "/api/denue/prospectos", data);
      return res.json();
    },
    onSuccess: () => {
      invalidatePipeline();
      setShowAddProspect(false);
      toast({ title: "Prospecto agregado", description: "Se agregó a tu cartera" });
    },
    onError: (err: Error) => toast({ title: "No se pudo agregar", description: err.message, variant: "destructive" }),
  });

  const scheduleMeetingMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; scheduledAt: string; durationMinutes: number; attendeeEmail: string; attendeeName?: string; note?: string; advanceStage?: boolean }) => {
      const res = await apiRequest("POST", `/api/denue/prospectos/${id}/meeting`, data);
      return res.json();
    },
    onSuccess: (data) => {
      invalidatePipeline();
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos", selectedProspect?.id, "interacciones"] });
      toast({ title: "Reunión agendada", description: `Invitación con Google Meet enviada a ${data.attendeeEmail}` });
    },
    onError: (err: Error) => toast({ title: "No se pudo agendar", description: err.message, variant: "destructive" }),
  });

  const addInteractionMutation = useMutation({
    mutationFn: async ({ id, tipo, notas }: { id: string; tipo: string; notas: string }) => {
      await apiRequest("POST", `/api/denue/prospectos/${id}/interaccion`, { tipo, notas });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos", selectedProspect?.id, "interacciones"] });
      setInteractionNote("");
      toast({ title: "Interacción registrada" });
    },
  });

  const bulkStageMutation = useMutation({
    mutationFn: async ({ ids, stage }: { ids: string[]; stage: string }) => {
      await apiRequest("POST", "/api/denue/prospectos/bulk-stage", { ids, stage });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos/stats"] });
      setSelectedIds(new Set());
      toast({ title: `${vars.ids.length} prospectos actualizados` });
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async ({ ids, partnerId }: { ids: string[]; partnerId: string | null }) => {
      await apiRequest("POST", "/api/denue/prospectos/bulk-assign", { ids, partnerId });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos"] });
      setSelectedIds(new Set());
      toast({ title: `${vars.ids.length} prospectos asignados` });
    },
  });

  const bulkGroupMutation = useMutation({
    mutationFn: async ({ ids, contactGroupId }: { ids: string[]; contactGroupId: string | null }) => {
      await apiRequest("POST", "/api/denue/prospectos/bulk-group", { ids, contactGroupId });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/denue/contact-groups"] });
      setSelectedIds(new Set());
      toast({ title: `${vars.ids.length} prospectos agrupados` });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await apiRequest("POST", "/api/denue/prospectos/bulk-delete", { ids });
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos/stats"] });
      setSelectedIds(new Set());
      toast({ title: `${ids.length} prospectos eliminados` });
    },
  });

  const updateProspectMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const res = await apiRequest("PATCH", `/api/denue/prospectos/${id}`, data);
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos"] });
      if (selectedProspect?.id === updated.id) setSelectedProspect(updated);
      toast({ title: "Prospecto actualizado" });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/denue/contact-groups", { name, description });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/denue/contact-groups"] });
      setNewGroupName("");
      setNewGroupDesc("");
      toast({ title: "Grupo creado" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/denue/contact-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/denue/contact-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/denue/prospectos"] });
      toast({ title: "Grupo eliminado" });
    },
  });

  const saveFilterMutation = useMutation({
    mutationFn: async ({ name, filterConfig }: { name: string; filterConfig: Record<string, string> }) => {
      const res = await apiRequest("POST", "/api/denue/saved-filters", { name, filterConfig });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/denue/saved-filters"] });
      setShowSaveFilterDialog(false);
      setSaveFilterName("");
      toast({ title: "Filtro guardado" });
    },
  });

  const deleteFilterMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/denue/saved-filters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/denue/saved-filters"] });
      toast({ title: "Filtro eliminado" });
    },
  });

  const handleExport = async () => {
    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      if (filterZona) params.set("zona", filterZona);
      if (filterEstado) params.set("estado", filterEstado);
      if (filterMunicipio) params.set("municipio", filterMunicipio);
      if (filterStage) params.set("stage", filterStage);
      if (filterScoreMin) params.set("scoreMin", filterScoreMin);
      if (filterScian) params.set("scian", filterScian);
      if (filterPartnerId) params.set("partnerId", filterPartnerId);
      if (scope) params.set("scope", scope);
      const res = await fetch(`/api/denue/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al exportar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prospectos-denue-${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exportación completada" });
    } catch {
      toast({ title: "Error al exportar", variant: "destructive" });
    }
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const rows = prospectos?.data || [];
    setSelectedIds(prev => {
      const allSelected = rows.every(r => prev.has(r.id));
      if (allSelected) return new Set();
      return new Set(rows.map(r => r.id));
    });
  }, [prospectos?.data]);

  const applyFilter = (config: Record<string, string>) => {
    setFilterZona(config.zona || "");
    setFilterEstado(config.estado || "");
    setFilterMunicipio(config.municipio || "");
    setFilterStage(config.stage || "");
    setFilterScoreMin(config.scoreMin || "");
    setFilterScian(config.scian || "");
    setFilterPartnerId(config.partnerId || "");
    setFilterEnrichment(config.enrichment || "");
    setSearch(config.search || "");
    setPage(1);
    setShowFilters(true);
  };

  const getCurrentFilterConfig = (): Record<string, string> => {
    const config: Record<string, string> = {};
    if (filterZona) config.zona = filterZona;
    if (filterEstado) config.estado = filterEstado;
    if (filterMunicipio) config.municipio = filterMunicipio;
    if (filterStage) config.stage = filterStage;
    if (filterScoreMin) config.scoreMin = filterScoreMin;
    if (filterScian) config.scian = filterScian;
    if (filterPartnerId) config.partnerId = filterPartnerId;
    if (filterEnrichment) config.enrichment = filterEnrichment;
    if (search) config.search = search;
    return config;
  };

  const hasActiveFilters = filterZona || filterEstado || filterMunicipio || filterStage || filterScoreMin || filterScian || filterPartnerId || filterEnrichment || filterEfos;

  const rows = prospectos?.data || [];
  const total = prospectos?.total || 0;
  const totalPages = prospectos?.totalPages || 1;
  const selArr = Array.from(selectedIds);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-2xl text-cedu-ink" data-testid="text-denue-title">Prospectos Identificados</h2>
          <p className="text-sm text-cedu-ink-muted">Pipeline de inteligencia comercial</p>
        </div>
        <div className="flex items-center gap-2">
          {enrichStatusQuery.data?.bulk?.running ? (
            <Button size="sm" className="rounded-xl gap-1 text-xs bg-red-500 hover:bg-red-600 text-white" onClick={() => stopBulkEnrichMutation.mutate()} data-testid="button-denue-enrich-stop">
              <Loader2 size={14} className="animate-spin" />
              Detener ({enrichStatusQuery.data.bulk.processed}/{enrichStatusQuery.data.bulk.total || "?"})
            </Button>
          ) : (
            <Button size="sm" className="rounded-xl gap-1 text-xs bg-[#7c3aed] hover:bg-[#6d28d9] text-white" onClick={() => bulkEnrichMutation.mutate()} disabled={bulkEnrichMutation.isPending} data-testid="button-denue-enrich">
              {bulkEnrichMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Enriquecer {filterZona || filterMunicipio || filterEstado || filterStage || filterScian || filterScoreMin ? "filtrados" : "todos"}
            </Button>
          )}
          <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs" onClick={() => setShowAddProspect(true)} data-testid="button-add-prospect">
            <UserPlus size={14} />
            Agregar
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs" onClick={() => setShowGroupManager(!showGroupManager)} data-testid="button-groups-toggle">
            <FolderOpen size={14} />
            Grupos
          </Button>
        </div>
      </div>

      <PipelineValueHero data={pipelineValue} isAdmin={isAdmin} />

      <div className="flex items-center gap-1.5 flex-wrap" data-testid="scope-toggle">
        <span className="text-[11px] text-cedu-ink-muted mr-1">Ver:</span>
        {([
          { key: "", label: isAdmin ? "Todos" : "Míos + disponibles" },
          { key: "mine", label: "Solo míos" },
          { key: "available", label: "Disponibles" },
        ] as const).map(opt => (
          <button
            key={opt.key || "all"}
            onClick={() => { setScope(opt.key); setPage(1); }}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${scope === opt.key ? "bg-cedu-violet text-white" : "bg-black/[0.04] text-cedu-ink-muted hover:bg-black/[0.08]"}`}
            data-testid={`scope-${opt.key || "all"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {(filterZona || filterEstado || filterMunicipio || filterStage || filterScoreMin || filterScian || filterPartnerId || filterEnrichment || search) && (
        <div className="flex items-center gap-2 text-xs text-cedu-blue">
          <Filter size={12} />
          <span>Estadísticas filtradas por tu búsqueda actual</span>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-black/[0.06]">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={14} className="text-cedu-blue" />
              <span className="text-[10px] text-cedu-ink-muted">Empresas identificadas</span>
            </div>
            {statsLoading ? <Skeleton className="h-7 w-20" /> : (
              <p className="text-xl font-bold text-cedu-ink" data-testid="text-denue-total">{(stats?.total || 0).toLocaleString("es-MX")}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-black/[0.06]">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-cedu-blue" />
              <span className="text-[10px] text-cedu-ink-muted">Prom. trabajadores</span>
            </div>
            {statsLoading ? <Skeleton className="h-7 w-12" /> : (
              <p className="text-xl font-bold text-cedu-ink" data-testid="text-denue-avg-empleados">{stats?.avgEmpleados || 0}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-black/[0.06]">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail size={14} className="text-amber-500" />
              <span className="text-[10px] text-cedu-ink-muted">Con correo</span>
            </div>
            {statsLoading ? <Skeleton className="h-7 w-16" /> : (
              <>
                <p className="text-xl font-bold text-cedu-ink" data-testid="text-denue-correo">{(stats?.conCorreo || 0).toLocaleString("es-MX")}</p>
                <p className="text-[9px] text-cedu-ink-muted">{stats?.conTelefono ? `${(stats.conTelefono).toLocaleString("es-MX")} con tel.` : ""}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-black/[0.06]">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-cedu-green" />
              <span className="text-[10px] text-cedu-ink-muted">Valor estimado mercado</span>
            </div>
            {statsLoading ? <Skeleton className="h-7 w-24" /> : (
              <>
                <p className="text-lg font-bold text-cedu-ink" data-testid="text-denue-valor">${(stats?.valorMercado || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}</p>
                <p className="text-[9px] text-cedu-ink-muted">Aportaciones mensuales</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-black/[0.06]">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className="text-cedu-violet" />
              <span className="text-[10px] text-cedu-ink-muted">Prospectos trabajados</span>
            </div>
            {statsLoading ? <Skeleton className="h-7 w-12" /> : (
              <>
                <p className="text-xl font-bold text-cedu-ink" data-testid="text-denue-trabajados">{(stats?.trabajados || 0).toLocaleString("es-MX")}</p>
                <p className="text-[9px] text-cedu-ink-muted">{stats?.stages?.cliente || 0} clientes</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-black/[0.06]">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Star size={14} className="text-amber-500" />
              <span className="text-[10px] text-cedu-ink-muted">Prioridad alta</span>
            </div>
            {statsLoading ? <Skeleton className="h-7 w-16" /> : (
              <>
                <p className="text-xl font-bold text-cedu-ink">{(stats?.prioridades?.alta || 0).toLocaleString("es-MX")}</p>
                <p className="text-[9px] text-cedu-ink-muted">Score prom: {stats?.avgScore || 0}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {(enrichStatusQuery.data || stats) && (
        <div className="p-3 rounded-xl bg-[#7c3aed]/[0.04] border border-[#7c3aed]/10">
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-[#7c3aed] flex-shrink-0" />
            <div className="flex-1 text-xs text-cedu-ink-soft">
              <span className="font-semibold text-cedu-ink">{(stats?.enriquecidas ?? enrichStatusQuery.data?.enrichedCount ?? 0).toLocaleString("es-MX")}</span> empresas enriquecidas de <span className="font-semibold text-cedu-ink">{(stats?.total ?? 0).toLocaleString("es-MX")}</span> identificadas
              {enrichStatusQuery.data?.bulk?.running && (
                <span className="ml-2 text-[#7c3aed] font-medium">
                  — Procesando: {enrichStatusQuery.data.bulk.currentBatch}
                </span>
              )}
            </div>
          </div>
          {enrichStatusQuery.data?.bulk?.running && enrichStatusQuery.data.bulk.total > 0 && (
            <div className="mt-2">
              <div className="w-full bg-black/5 rounded-full h-2">
                <div
                  className="bg-[#7c3aed] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (enrichStatusQuery.data.bulk.processed / enrichStatusQuery.data.bulk.total) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-cedu-ink-muted mt-1">
                <span>{enrichStatusQuery.data.bulk.processed} de {enrichStatusQuery.data.bulk.total} procesados</span>
                <span>{enrichStatusQuery.data.bulk.enriched} con datos nuevos · {enrichStatusQuery.data.bulk.errors} errores</span>
              </div>
            </div>
          )}
          {enrichStatusQuery.data?.bulk && !enrichStatusQuery.data.bulk.running && enrichStatusQuery.data.bulk.processed > 0 && (
            <div className="mt-1 text-[10px] text-cedu-ink-muted">
              Último proceso: {enrichStatusQuery.data.bulk.processed} procesados, {enrichStatusQuery.data.bulk.enriched} enriquecidos
            </div>
          )}
        </div>
      )}

      {showGroupManager && (
        <Card className="border-black/[0.06]">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-cedu-ink flex items-center gap-2"><FolderOpen size={16} /> Grupos de contacto</h3>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowGroupManager(false)}><X size={14} /></Button>
            </div>
            <div className="flex gap-2 mb-3">
              <Input placeholder="Nombre del grupo" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="h-8 text-xs bg-white flex-1" data-testid="input-group-name" />
              <Input placeholder="Descripción (opcional)" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} className="h-8 text-xs bg-white flex-1" data-testid="input-group-desc" />
              <Button size="sm" className="rounded-xl text-xs h-8 bg-cedu-blue" onClick={() => { if (newGroupName.trim()) createGroupMutation.mutate({ name: newGroupName.trim(), description: newGroupDesc.trim() || undefined }); }} disabled={!newGroupName.trim() || createGroupMutation.isPending} data-testid="button-create-group">
                <FolderPlus size={14} />
              </Button>
            </div>
            {contactGroupsList.length === 0 ? (
              <p className="text-xs text-cedu-ink-muted text-center py-3">No hay grupos creados.</p>
            ) : (
              <div className="space-y-1.5">
                {contactGroupsList.map(g => (
                  <div key={g.id} className="flex items-center justify-between bg-black/[0.02] rounded-lg px-3 py-2">
                    <div>
                      <span className="text-xs font-medium text-cedu-ink">{g.name}</span>
                      {g.description && <span className="text-[10px] text-cedu-ink-muted ml-2">{g.description}</span>}
                      <Badge variant="outline" className="ml-2 text-[9px]">{g.prospectCount} prospectos</Badge>
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:text-red-600" onClick={() => deleteGroupMutation.mutate(g.id)} data-testid={`button-delete-group-${g.id}`}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-cedu-blue/[0.06] border border-cedu-blue/20" data-testid="bulk-action-bar">
          <CheckSquare size={16} className="text-cedu-blue" />
          <span className="text-xs font-semibold text-cedu-ink">{selectedIds.size} seleccionados</span>
          <div className="flex-1" />
          <Select onValueChange={(stage) => bulkStageMutation.mutate({ ids: selArr, stage })}>
            <SelectTrigger className="h-7 text-xs w-36 bg-white" data-testid="bulk-stage-select">
              <SelectValue placeholder="Cambiar etapa" />
            </SelectTrigger>
            <SelectContent>
              {DENUE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl gap-1 text-cedu-violet border-cedu-violet/30 hover:bg-cedu-violet/5" onClick={() => bulkClaimMutation.mutate(selArr)} disabled={bulkClaimMutation.isPending} data-testid="bulk-claim-button">
            <UserPlus size={12} /> Reclamar
          </Button>
          {isAdmin && (
            <Select onValueChange={(partnerId) => bulkAssignMutation.mutate({ ids: selArr, partnerId: partnerId === "none" ? null : partnerId })}>
              <SelectTrigger className="h-7 text-xs w-36 bg-white" data-testid="bulk-assign-select">
                <SelectValue placeholder="Asignar socio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {partnersList.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName || p.email}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {contactGroupsList.length > 0 && (
            <Select onValueChange={(groupId) => bulkGroupMutation.mutate({ ids: selArr, contactGroupId: groupId === "none" ? null : groupId })}>
              <SelectTrigger className="h-7 text-xs w-36 bg-white" data-testid="bulk-group-select">
                <SelectValue placeholder="Asignar grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin grupo</SelectItem>
                {contactGroupsList.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (confirm(`¿Eliminar ${selectedIds.size} prospectos?`)) bulkDeleteMutation.mutate(selArr); }} disabled={bulkDeleteMutation.isPending} data-testid="bulk-delete-button">
            <Trash2 size={12} />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelectedIds(new Set())} data-testid="bulk-clear-button">
            <X size={14} />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cedu-ink-muted" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-8 text-xs bg-white rounded-xl"
            data-testid="input-denue-search"
          />
        </div>
        <Button
          size="sm"
          variant={showFilters ? "default" : "outline"}
          className={`rounded-xl gap-1 text-xs h-8 ${showFilters ? "bg-cedu-blue text-white" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
          data-testid="button-denue-filters"
        >
          <Filter size={14} />
          Filtros
          {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-current" />}
        </Button>
        {hasActiveFilters && (
          <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs h-8" onClick={() => setShowSaveFilterDialog(true)} data-testid="button-save-filter">
            <BookmarkPlus size={14} />
            Guardar filtro
          </Button>
        )}
        {savedFiltersList.length > 0 && (
          <Select onValueChange={(id) => {
            const sf = savedFiltersList.find(f => f.id === id);
            if (sf) applyFilter(sf.filterConfig as Record<string, string>);
          }}>
            <SelectTrigger className="h-8 text-xs w-44 bg-white rounded-xl" data-testid="select-saved-filter">
              <SelectValue placeholder="Filtros guardados" />
            </SelectTrigger>
            <SelectContent>
              {savedFiltersList.map(f => (
                <SelectItem key={f.id} value={f.id}>
                  <span className="flex items-center gap-2">
                    {f.name}
                    <button className="text-red-400 hover:text-red-600 ml-auto" onClick={(e) => { e.stopPropagation(); deleteFilterMutation.mutate(f.id); }}>
                      <X size={10} />
                    </button>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex border rounded-xl overflow-hidden h-8">
          <Button size="sm" variant={view === "table" ? "default" : "ghost"} className={`rounded-none h-8 px-2 ${view === "table" ? "bg-cedu-blue text-white" : ""}`} onClick={() => setView("table")} data-testid="button-denue-view-table">
            <Table size={14} />
          </Button>
          <Button size="sm" variant={view === "kanban" ? "default" : "ghost"} className={`rounded-none h-8 px-2 ${view === "kanban" ? "bg-cedu-blue text-white" : ""}`} onClick={() => setView("kanban")} data-testid="button-denue-view-kanban">
            <LayoutGrid size={14} />
          </Button>
          <Button size="sm" variant={view === "map" ? "default" : "ghost"} className={`rounded-none h-8 px-2 ${view === "map" ? "bg-cedu-blue text-white" : ""}`} onClick={() => setView("map")} data-testid="button-denue-view-map">
            <MapPin size={14} />
          </Button>
        </div>
      </div>

      {showSaveFilterDialog && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/60 border border-amber-200">
          <Save size={14} className="text-amber-600" />
          <Input placeholder="Nombre del filtro..." value={saveFilterName} onChange={(e) => setSaveFilterName(e.target.value)} className="h-7 text-xs bg-white flex-1" data-testid="input-save-filter-name" />
          <Button size="sm" className="h-7 text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white" onClick={() => { if (saveFilterName.trim()) saveFilterMutation.mutate({ name: saveFilterName.trim(), filterConfig: getCurrentFilterConfig() }); }} disabled={!saveFilterName.trim()} data-testid="button-confirm-save-filter">Guardar</Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setShowSaveFilterDialog(false); setSaveFilterName(""); }}><X size={14} /></Button>
        </div>
      )}

      {showFilters && (
        <Card className="border-black/[0.06]">
          <CardContent className="py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-cedu-ink-muted mb-1 block">Zona</label>
                <Select value={filterZona} onValueChange={(v) => { setFilterZona(v === "all" ? "" : v); setFilterEstado(""); setFilterMunicipio(""); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs bg-white" data-testid="select-denue-zona">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {ZONAS_COMERCIALES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-cedu-ink-muted mb-1 block">Estado</label>
                <Select value={filterEstado} onValueChange={(v) => { setFilterEstado(v === "all" ? "" : v); setFilterMunicipio(""); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs bg-white" data-testid="select-denue-estado">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {(filterZona ? (ZONA_ESTADOS[filterZona] || ESTADOS_MEXICO) : ESTADOS_MEXICO).map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-cedu-ink-muted mb-1 block">Municipio</label>
                <Select value={filterMunicipio} onValueChange={(v) => { setFilterMunicipio(v === "all" ? "" : v); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs bg-white" data-testid="select-denue-municipio">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {(filters?.municipios || []).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-cedu-ink-muted mb-1 block">Etapa</label>
                <Select value={filterStage} onValueChange={(v) => { setFilterStage(v === "all" ? "" : v); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs bg-white" data-testid="select-denue-stage">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {DENUE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-cedu-ink-muted mb-1 block">Score mínimo</label>
                <Input type="number" placeholder="0" value={filterScoreMin} onChange={(e) => { setFilterScoreMin(e.target.value); setPage(1); }} className="h-8 text-xs bg-white" data-testid="input-denue-score-min" />
              </div>
              <div>
                <label className="text-[10px] text-cedu-ink-muted mb-1 block">Sector (SCIAN)</label>
                <Select value={filterScian} onValueChange={(v) => { setFilterScian(v === "all" ? "" : v); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs bg-white" data-testid="select-denue-scian">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {(filters?.sectores || []).map(s => <SelectItem key={s.codigo} value={s.codigo}>{s.codigo} — {s.actividad}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-cedu-ink-muted mb-1 block">Enriquecimiento</label>
                <Select value={filterEnrichment} onValueChange={(v) => { setFilterEnrichment(v === "all" ? "" : v); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs bg-white" data-testid="select-denue-enrichment">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="enriched">Enriquecidas</SelectItem>
                    <SelectItem value="pending">Por enriquecer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isAdmin && (
                <div>
                  <label className="text-[10px] text-cedu-ink-muted mb-1 block">Socio asignado</label>
                  <Select value={filterPartnerId} onValueChange={(v) => { setFilterPartnerId(v === "all" ? "" : v); setPage(1); }}>
                    <SelectTrigger className="h-8 text-xs bg-white" data-testid="select-denue-partner">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {partnersList.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName || p.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-[10px] text-cedu-ink-muted mb-1 block">EFOS 69-B</label>
                <Select value={filterEfos} onValueChange={(v) => { setFilterEfos(v === "all" ? "" : v); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs bg-white" data-testid="select-denue-efos">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las empresas</SelectItem>
                    <SelectItem value="only">Solo EFOS (lista 69-B)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button size="sm" variant="ghost" className="h-8 text-xs text-red-500" onClick={() => { setFilterZona(""); setFilterEstado(""); setFilterMunicipio(""); setFilterStage(""); setFilterScoreMin(""); setFilterScian(""); setFilterPartnerId(""); setFilterEnrichment(""); setFilterEfos(""); setPage(1); }} data-testid="button-clear-filters">
                  <X size={12} className="mr-1" /> Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isFetching && !isLoading && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cedu-blue/10 border border-cedu-blue/20 text-cedu-blue text-sm mb-3 animate-in fade-in duration-300" data-testid="loading-filters-indicator">
          <Loader2 size={16} className="animate-spin" />
          <span>Cargando resultados…</span>
        </div>
      )}

      <div className="relative">
        {isFetching && !isLoading && (
          <div className="absolute inset-0 bg-white/60 z-10 rounded-xl pointer-events-none" />
        )}

        {view === "table" && (
          <TableView
            rows={rows}
            isLoading={isLoading}
            sortField={sortField}
            sortDir={sortDir}
            onSort={(field: SortField) => {
              if (field === sortField) setSortDir(prev => prev === "asc" ? "desc" : "asc");
              else { setSortField(field); setSortDir("desc"); }
              setPage(1);
            }}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onSelectProspect={setSelectedProspect}
            onUpdateStage={(id, stage) => updateStageMutation.mutate({ id, stage })}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            myId={myId}
            isAdmin={isAdmin}
            onClaim={(id) => claimMutation.mutate(id)}
          />
        )}

        {view === "kanban" && (
          <KanbanView rows={rows} isLoading={isLoading} onUpdateStage={(id, stage) => updateStageMutation.mutate({ id, stage })} onSelectProspect={setSelectedProspect} myId={myId} />
        )}

        {view === "map" && (
          <MapView
            filters={{ zona: filterZona, estado: filterEstado, municipio: filterMunicipio, stage: filterStage, scoreMin: filterScoreMin, scian: filterScian, partnerId: filterPartnerId, enrichment: filterEnrichment, search, efos: filterEfos, scope }}
            onSelectProspect={setSelectedProspect}
          />
        )}
      </div>

      {selectedProspect && (
        <SlideOutDetailPanel
          key={selectedProspect.id}
          prospect={selectedProspect}
          interactions={interactions}
          interactionNote={interactionNote}
          onInteractionNoteChange={setInteractionNote}
          onAddInteraction={(tipo) => addInteractionMutation.mutate({ id: selectedProspect.id, tipo, notas: interactionNote })}
          onUpdateStage={(stage) => {
            updateStageMutation.mutate({ id: selectedProspect.id, stage });
            setSelectedProspect({ ...selectedProspect, stage });
          }}
          onAssignPartner={(partnerId) => {
            assignPartnerMutation.mutate({ id: selectedProspect.id, partnerId });
            setSelectedProspect({ ...selectedProspect, partnerId });
          }}
          onUpdateNotes={(notas) => updateProspectMutation.mutate({ id: selectedProspect.id, notas })}
          onUpdateField={(field, value) => {
            updateProspectMutation.mutate({ id: selectedProspect.id, [field]: value });
            setSelectedProspect({ ...selectedProspect, [field]: value });
          }}
          partners={partnersList}
          contactGroups={contactGroupsList}
          onAssignGroup={(groupId) => updateProspectMutation.mutate({ id: selectedProspect.id, contactGroupId: groupId })}
          onClose={() => setSelectedProspect(null)}
          isAddingInteraction={addInteractionMutation.isPending}
          isAdmin={isAdmin}
          myId={myId}
          onClaim={() => claimMutation.mutate(selectedProspect.id)}
          onRelease={() => releaseMutation.mutate(selectedProspect.id)}
          onScheduleMeeting={(data) => scheduleMeetingMutation.mutate({ id: selectedProspect.id, ...data })}
          isSchedulingMeeting={scheduleMeetingMutation.isPending}
        />
      )}

      {showAddProspect && (
        <AddProspectDialog
          onClose={() => setShowAddProspect(false)}
          onSubmit={(data) => createProspectMutation.mutate(data)}
          isSubmitting={createProspectMutation.isPending}
        />
      )}
    </div>
  );
}

function SortHeader({ label, field, currentField, currentDir, onSort }: {
  label: string;
  field: SortField;
  currentField: string;
  currentDir: string;
  onSort: (f: SortField) => void;
}) {
  const isActive = field === currentField;
  return (
    <th className="text-left py-2.5 px-3 font-semibold text-cedu-ink-muted cursor-pointer hover:text-cedu-ink select-none" onClick={() => onSort(field)} data-testid={`sort-${field}`}>
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && <span className="text-[9px]">{currentDir === "asc" ? "↑" : "↓"}</span>}
      </span>
    </th>
  );
}

function TableView({
  rows, isLoading, sortField, sortDir, onSort, page, totalPages, total, onPageChange, onSelectProspect, onUpdateStage, selectedIds, onToggleSelect, onToggleSelectAll, myId, isAdmin, onClaim,
}: {
  rows: DenueProspecto[];
  isLoading: boolean;
  sortField: string;
  sortDir: string;
  onSort: (field: SortField) => void;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
  onSelectProspect: (p: DenueProspecto) => void;
  onUpdateStage: (id: string, stage: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  myId: string | null;
  isAdmin: boolean;
  onClaim: (id: string) => void;
}) {
  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;
  }

  const allSelected = rows.length > 0 && rows.every(r => selectedIds.has(r.id));

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-black/[0.06]">
        <table className="w-full text-xs" data-testid="table-denue-prospectos">
          <thead>
            <tr className="bg-black/[0.02] border-b border-black/[0.06]">
              <th className="py-2.5 px-2 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-gray-300 cursor-pointer"
                  data-testid="checkbox-select-all"
                />
              </th>
              <SortHeader label="Empresa" field="nombreComercial" currentField={sortField} currentDir={sortDir} onSort={onSort} />
              <SortHeader label="Sector" field="grupoSector" currentField={sortField} currentDir={sortDir} onSort={onSort} />
              <SortHeader label="Municipio" field="municipio" currentField={sortField} currentDir={sortDir} onSort={onSort} />
              <SortHeader label="Estado" field="estado" currentField={sortField} currentDir={sortDir} onSort={onSort} />
              <SortHeader label="Empleados" field="empleadosEstimados" currentField={sortField} currentDir={sortDir} onSort={onSort} />
              <SortHeader label="Potencial" field="potencialAportacionMensual" currentField={sortField} currentDir={sortDir} onSort={onSort} />
              <SortHeader label="Score" field="leadScore" currentField={sortField} currentDir={sortDir} onSort={onSort} />
              <SortHeader label="Etapa" field="stage" currentField={sortField} currentDir={sortDir} onSort={onSort} />
              <th className="text-left py-2.5 px-3 font-semibold text-cedu-ink-muted">Contacto</th>
              <th className="text-left py-2.5 px-3 font-semibold text-cedu-ink-muted">Cartera</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-10 text-center text-cedu-ink-muted">
                  No hay prospectos. Importa un CSV, agrega uno manualmente o cambia la vista a "Disponibles".
                </td>
              </tr>
            ) : rows.map(row => {
              const stageInfo = DENUE_STAGES.find(s => s.key === row.stage) || DENUE_STAGES[0];
              const isChecked = selectedIds.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={`border-b border-black/[0.04] hover:bg-black/[0.02] cursor-pointer transition-colors ${isChecked ? "bg-cedu-blue/[0.04]" : ""} ${!row.planRecomendado ? "opacity-60" : ""}`}
                  onClick={() => onSelectProspect(row)}
                  data-testid={`row-denue-${row.id}`}
                >
                  <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleSelect(row.id)}
                      className="rounded border-gray-300 cursor-pointer"
                      data-testid={`checkbox-row-${row.id}`}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-cedu-ink truncate max-w-[200px]">{row.nombreComercial}</p>
                      {row.efos69b && <Badge className="text-[8px] bg-violet-600 text-white border-violet-600 flex-shrink-0" variant="outline" data-testid={`badge-efos-table-${row.id}`}><AlertTriangle size={8} className="mr-0.5" />EFOS</Badge>}
                    </div>
                    {row.razonSocial && <p className="text-[10px] text-cedu-ink-muted truncate max-w-[200px]">{row.razonSocial}</p>}
                  </td>
                  <td className="py-2 px-3">
                    <p className="text-cedu-ink truncate max-w-[150px]">{row.grupoSector || row.actividadEconomica || "—"}</p>
                    <p className="text-[10px] text-cedu-ink-muted">{row.codigoScian || ""}</p>
                  </td>
                  <td className="py-2 px-3">
                    <p className="text-cedu-ink">{row.municipio || "—"}</p>
                    {row.zonaComercial && <p className="text-[10px] text-cedu-ink-muted">{row.zonaComercial}</p>}
                  </td>
                  <td className="py-2 px-3">
                    <p className="text-cedu-ink">{row.estado || "—"}</p>
                  </td>
                  <td className="py-2 px-3">
                    <p className="text-cedu-ink">{row.estratoPersonal || "—"}</p>
                    {row.empleadosEstimados && <p className="text-[10px] text-cedu-ink-muted">~{row.empleadosEstimados} personas</p>}
                  </td>
                  <td className="py-2 px-3">
                    {row.planRecomendado ? (
                      <>
                        <p className="text-cedu-ink font-medium">{formatMXN(row.potencialAportacionMensual)}</p>
                        {row.prioridad && <Badge className={`text-[9px] ${prioridadBadge(row.prioridad)}`} variant="outline">{row.prioridad}</Badge>}
                      </>
                    ) : (
                      <span className="text-cedu-ink-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {row.planRecomendado ? (
                      <Badge className={`text-[10px] ${scoreColor(row.leadScore)}`} variant="outline">{row.leadScore}</Badge>
                    ) : (
                      <span className="text-cedu-ink-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <Badge className={`text-[10px] ${stageInfo.color}`} variant="outline">{stageInfo.label}</Badge>
                      {row.planRecomendado ? (
                        <Badge className="text-[8px] bg-cedu-green/10 text-cedu-green border-cedu-green/20" variant="outline">Enriquecida</Badge>
                      ) : (
                        <Badge className="text-[8px] bg-gray-100 text-gray-500 border-gray-200" variant="outline">Por enriquecer</Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      {row.telefono && <Phone size={10} className="text-cedu-ink-muted" />}
                      {row.correoElectronico && <Mail size={10} className="text-cedu-ink-muted" />}
                      {inferWebsite(row.correoElectronico, row.sitioWeb) && <Globe size={10} className="text-cedu-ink-muted" />}
                      {googleMapsUrl(row) && (
                        <a href={googleMapsUrl(row)!} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} title="Ver en Google Maps" data-testid={`link-maps-${row.id}`}>
                          <MapPin size={10} className="text-cedu-blue hover:text-cedu-blue/70" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                    {myId && row.partnerId === myId ? (
                      <Badge className="text-[9px] bg-cedu-violet/10 text-cedu-violet border-cedu-violet/20" variant="outline" data-testid={`badge-mine-${row.id}`}>Mío</Badge>
                    ) : row.partnerId == null ? (
                      <Button size="sm" variant="outline" className="h-6 text-[10px] rounded-lg gap-1 px-2 text-cedu-violet border-cedu-violet/30 hover:bg-cedu-violet/5" onClick={() => onClaim(row.id)} data-testid={`button-claim-${row.id}`}>
                        <UserPlus size={10} /> Reclamar
                      </Button>
                    ) : isAdmin ? (
                      <Badge className="text-[9px] bg-amber-50 text-amber-700 border-amber-200" variant="outline">Asignado</Badge>
                    ) : (
                      <span className="text-cedu-ink-muted text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-cedu-ink-muted">{total} prospectos</span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl" disabled={page <= 1} onClick={() => onPageChange(page - 1)} data-testid="button-denue-prev">Anterior</Button>
          <span className="text-xs text-cedu-ink-muted px-2">{page} / {totalPages}</span>
          <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} data-testid="button-denue-next">Siguiente</Button>
        </div>
      </div>
    </div>
  );
}

function KanbanView({ rows, isLoading, onUpdateStage, onSelectProspect, myId }: {
  rows: DenueProspecto[];
  isLoading: boolean;
  onUpdateStage: (id: string, stage: string) => void;
  onSelectProspect: (p: DenueProspecto) => void;
  myId: string | null;
}) {
  if (isLoading) {
    return <div className="grid grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;
  }

  return (
    <div className="grid grid-cols-6 gap-3 overflow-x-auto" data-testid="kanban-denue">
      {DENUE_STAGES.map((stage, idx) => {
        const stageRows = rows.filter(r => r.stage === stage.key);
        const nextStage = DENUE_STAGES[idx + 1];
        return (
          <div key={stage.key} className="min-w-[170px]">
            <div className={`rounded-t-lg px-3 py-2 ${stage.color} flex items-center justify-between`}>
              <span className="text-xs font-bold">{stage.label}</span>
              <span className="text-[10px] font-semibold opacity-70">{stageRows.length}</span>
            </div>
            <div className="bg-black/[0.02] rounded-b-lg min-h-[200px] max-h-[500px] overflow-y-auto p-2 space-y-2">
              {stageRows.map(p => (
                <Card key={p.id} className="border-black/[0.08] shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSelectProspect(p)} data-testid={`kanban-card-${p.id}`}>
                  <CardContent className="p-2.5">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p className="text-xs font-semibold text-cedu-ink truncate">{p.nombreComercial}</p>
                      {myId && p.partnerId === myId && <Badge className="text-[8px] bg-cedu-violet/10 text-cedu-violet border-cedu-violet/20 flex-shrink-0" variant="outline">Mío</Badge>}
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-cedu-ink-muted truncate">{p.municipio || ""}</span>
                      <Badge className={`text-[9px] ${scoreColor(p.leadScore)}`} variant="outline">{p.leadScore}</Badge>
                    </div>
                    {p.estratoPersonal && (
                      <p className="text-[10px] text-cedu-ink-muted flex items-center gap-0.5"><Users size={9} />{p.estratoPersonal}</p>
                    )}
                    {p.potencialAportacionMensual && (
                      <p className="text-[10px] font-medium text-cedu-blue">{formatMXN(p.potencialAportacionMensual)}/mes</p>
                    )}
                    {p.planRecomendado && (
                      <Badge className="text-[8px] bg-violet-50 text-violet-700 mt-0.5" variant="outline">{p.planRecomendado}</Badge>
                    )}
                    {p.efos69b && (
                      <Badge className="text-[8px] bg-violet-600 text-white border-violet-600 mt-0.5" variant="outline" data-testid={`badge-efos-${p.id}`}><AlertTriangle size={8} className="mr-0.5" />EFOS</Badge>
                    )}
                    {nextStage && (
                      <Button size="sm" variant="ghost" className="h-5 text-[10px] text-cedu-blue gap-0.5 mt-1 w-full justify-start px-1" onClick={(e) => { e.stopPropagation(); onUpdateStage(p.id, nextStage.key); }} data-testid={`kanban-advance-${p.id}`}>
                        <ChevronRight size={10} /> {nextStage.label}
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
  );
}

type MapFilters = {
  zona: string; estado: string; municipio: string; stage: string; scoreMin: string;
  scian: string; partnerId: string; enrichment: string; search: string; efos: string; scope: string;
};

type MapPoint = {
  id: string; nombreComercial: string; razonSocial?: string | null; latitud: number | null; longitud: number | null;
  leadScore: number; stage: string; municipio: string | null; estado: string | null;
  actividadEconomica: string | null; empleadosEstimados: number | null;
  calle?: string | null; colonia?: string | null; direccionCompleta?: string | null;
  efos69b: { rfc: string; situacion: string; nombre: string } | null;
  isFallbackLocation?: boolean;
};

function MapView({ filters, onSelectProspect }: {
  filters: MapFilters;
  onSelectProspect: (p: any) => void;
}) {
  const mapRef = useRef<any>(null);
  const filterKey = JSON.stringify(filters);

  const { data: mapData, isLoading, isFetching: isMapFetching } = useQuery<{ data: MapPoint[]; total: number; hasMore?: boolean; efosCount?: number }>({
    queryKey: ["/api/denue/prospectos/map", filters.zona, filters.estado, filters.municipio, filters.stage, filters.scoreMin, filters.scian, filters.partnerId, filters.enrichment, filters.search, filters.efos, filters.scope],
    queryFn: async () => {
      const token = localStorage.getItem("cedu_token");
      const params = new URLSearchParams();
      if (filters.zona) params.set("zona", filters.zona);
      if (filters.estado) params.set("estado", filters.estado);
      if (filters.municipio) params.set("municipio", filters.municipio);
      if (filters.stage) params.set("stage", filters.stage);
      if (filters.scoreMin && filters.scoreMin !== "0") params.set("scoreMin", filters.scoreMin);
      if (filters.scian) params.set("scian", filters.scian);
      if (filters.partnerId) params.set("partnerId", filters.partnerId);
      if (filters.enrichment) params.set("enrichment", filters.enrichment);
      if (filters.search) params.set("search", filters.search);
      if (filters.efos) params.set("efos", filters.efos);
      if (filters.scope) params.set("scope", filters.scope);
      const res = await fetch(`/api/denue/prospectos/map?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar mapa");
      return res.json();
    },
  });

  const geoRows = (mapData?.data || []).filter(r => r.latitud && r.longitud);
  const totalMatching = mapData?.total || 0;


  useEffect(() => {
    if (isLoading || geoRows.length === 0 || !mapRef.current) return;

    import('leaflet').then(leaflet => {
      const L = leaflet.default;
      const container = mapRef.current;
      if (!container) return;

      const existingMap = (container as any)._leaflet_map;
      if (existingMap) existingMap.remove();

      const bounds = geoRows.map(r => [r.latitud!, r.longitud!] as [number, number]);
      const map = L.map(container, { scrollWheelZoom: true, zoomControl: true });
      (container as any)._leaflet_map = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      geoRows.forEach(p => {
        const isEfos = !!p.efos69b;
        const isFallback = !!p.isFallbackLocation;
        let color: string;
        let radius: number;
        let borderColor: string;
        let weight: number;
        let dashArray: string | undefined;

        if (isEfos) {
          const sit = p.efos69b!.situacion;
          color = sit === 'Definitivo' ? '#7c3aed' : sit === 'Presunto' ? '#a855f7' : sit === 'Desvirtuado' ? '#6366f1' : '#8b5cf6';
          radius = 9;
          borderColor = '#fbbf24';
          weight = 2.5;
          if (isFallback) {
            dashArray = '4 3';
            weight = 3;
            radius = 10;
          }
        } else {
          color = p.leadScore >= 60 ? '#22c55e' : p.leadScore >= 40 ? '#f59e0b' : '#ef4444';
          radius = p.leadScore >= 60 ? 7 : p.leadScore >= 40 ? 6 : 5;
          borderColor = '#fff';
          weight = 1.5;
        }

        const markerOpts: Record<string, unknown> = {
          radius,
          fillColor: color,
          color: borderColor,
          weight,
          fillOpacity: isEfos ? 0.95 : 0.8,
        };
        if (dashArray) markerOpts.dashArray = dashArray;
        const circle = L.circleMarker([p.latitud!, p.longitud!], markerOpts).addTo(map);

        const fallbackLabel = isFallback ? ' · 📍 Ubicación aprox. (oficina SAT)' : '';
        const efosLabel = isEfos
          ? ` · ⚠️ EFOS 69-B: ${p.efos69b!.situacion} (RFC: ${p.efos69b!.rfc})`
          : '';
        circle.bindTooltip(`${p.nombreComercial} (Score: ${p.leadScore})${p.municipio ? ` · ${p.municipio}` : ''}${efosLabel}${fallbackLabel}`);
        circle.on('click', async () => {
          try {
            const token = localStorage.getItem("cedu_token");
            const res = await fetch(`/api/denue/prospectos/${p.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const full = await res.json();
              onSelectProspect(full);
            } else {
              onSelectProspect(p);
            }
          } catch {
            onSelectProspect(p);
          }
        });
      });

      map.fitBounds(L.latLngBounds(bounds).pad(0.1));
    });

    return () => {
      const container = mapRef.current;
      if (container) {
        const existingMap = (container as any)._leaflet_map;
        if (existingMap) { existingMap.remove(); delete (container as any)._leaflet_map; }
      }
    };
  }, [isLoading, filterKey, geoRows.length]);

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;

  if (geoRows.length === 0) {
    return (
      <Card className="border-black/[0.06]">
        <CardContent className="py-16 text-center">
          <MapPin size={32} className="mx-auto text-cedu-ink-muted mb-3" />
          <p className="text-sm text-cedu-ink-muted">No hay prospectos con coordenadas para estos filtros.</p>
          <p className="text-xs text-cedu-ink-muted mt-1">Selecciona un estado o ajusta los filtros para ver resultados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-black/[0.06] relative">
      {isMapFetching && !isLoading && (
        <div className="absolute inset-0 bg-white/60 z-20 rounded-xl flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-md border border-cedu-blue/20 text-cedu-blue text-sm">
            <Loader2 size={16} className="animate-spin" />
            <span>Actualizando mapa…</span>
          </div>
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-cedu-ink-muted">
            {geoRows.length.toLocaleString()} prospectos en mapa
            {!filters.estado && !filters.municipio && !filters.zona && !filters.search && !filters.partnerId && !filters.stage && (!filters.scoreMin || filters.scoreMin === "0") && filters.efos !== "only" && (
              <span className="text-cedu-ink-muted/60"> (Score ≥40 por defecto)</span>
            )}
            {mapData?.efosCount && mapData.efosCount > 0 && (
              <span className="ml-2 text-violet-600 font-semibold" data-testid="text-efos-count">
                ({mapData.efosCount} en lista 69-B)
              </span>
            )}
            {mapData?.hasMore && <span className="text-cedu-ink-muted/60"> (mostrando máximo 5,000)</span>}
          </span>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Score 60+</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Score 40-59</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Score &lt;40</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-amber-400" style={{ backgroundColor: '#7c3aed' }} /> EFOS 69-B</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-dashed border-amber-400" style={{ backgroundColor: '#7c3aed' }} /> EFOS (ubic. aprox.)</span>
          </div>
        </div>
        <div
          ref={mapRef}
          className="rounded-xl overflow-hidden border border-black/[0.06] relative"
          style={{ height: 500, width: "100%", zIndex: 0, isolation: "isolate" }}
          data-testid="map-denue"
        />
      </CardContent>
    </Card>
  );
}

function SlideOutDetailPanel({
  prospect, interactions, interactionNote, onInteractionNoteChange, onAddInteraction, onUpdateStage, onAssignPartner, onUpdateNotes, onUpdateField, partners, contactGroups, onAssignGroup, onClose, isAddingInteraction, isAdmin, myId, onClaim, onRelease, onScheduleMeeting, isSchedulingMeeting,
}: {
  prospect: DenueProspecto;
  interactions: { id: string; tipo: string; notas: string | null; createdAt: string }[];
  interactionNote: string;
  onInteractionNoteChange: (v: string) => void;
  onAddInteraction: (tipo: string) => void;
  onUpdateStage: (stage: string) => void;
  onAssignPartner: (partnerId: string | null) => void;
  onUpdateNotes: (notas: string) => void;
  onUpdateField: (field: string, value: string) => void;
  partners: { id: string; fullName: string | null; email: string }[];
  contactGroups: ContactGroup[];
  onAssignGroup: (groupId: string | null) => void;
  onClose: () => void;
  isAddingInteraction: boolean;
  isAdmin: boolean;
  myId: string | null;
  onClaim: () => void;
  onRelease: () => void;
  onScheduleMeeting: (data: { scheduledAt: string; durationMinutes: number; attendeeEmail: string; attendeeName?: string; note?: string; advanceStage?: boolean }) => void;
  isSchedulingMeeting: boolean;
}) {
  const stageInfo = DENUE_STAGES.find(s => s.key === prospect.stage) || DENUE_STAGES[0];
  const currentIdx = DENUE_STAGES.findIndex(s => s.key === prospect.stage);
  const scoreBreakdown = prospect.scoreDesglose as Record<string, number> | null;
  const [editNotes, setEditNotes] = useState(prospect.notas || "");
  const [activeTab, setActiveTab] = useState<"info" | "activity" | "notes">("info");
  const [editContacto, setEditContacto] = useState(prospect.nombreContacto || "");
  const [editRfc, setEditRfc] = useState(prospect.rfc || "");
  const [editTelefono, setEditTelefono] = useState(prospect.telefono || "");
  const [editEmail, setEditEmail] = useState(prospect.correoElectronico || "");
  const [editWeb, setEditWeb] = useState(prospect.sitioWeb || "");

  return (
    <div className="fixed top-0 right-0 bottom-0 flex max-w-lg w-full" style={{ zIndex: 9999 }} onClick={(e) => e.stopPropagation()}>
      <div
        className="w-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-black/10"
        data-testid="panel-denue-detail"
      >
        <div className="sticky top-0 bg-white z-10 border-b border-black/[0.06]">
          <div className="p-5 pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg text-cedu-ink truncate" data-testid="text-prospect-name">{prospect.nombreComercial}</h3>
                <p className="text-[11px] text-cedu-ink-muted truncate mt-0.5" data-testid="text-razon-social">{prospect.razonSocial || prospect.nombreComercial}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0 flex-shrink-0" data-testid="button-close-detail">
                <X size={16} />
              </Button>
            </div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Badge className={`text-[10px] ${stageInfo.color}`} variant="outline">{stageInfo.label}</Badge>
              <Badge className={`text-[10px] ${scoreColor(prospect.leadScore)}`} variant="outline">Score: {prospect.leadScore}</Badge>
              {prospect.prioridad && <Badge className={`text-[10px] ${prioridadBadge(prospect.prioridad)}`} variant="outline">{prospect.prioridad}</Badge>}
              {prospect.nivelRiesgo && <Badge className={`text-[10px] ${riesgoBadge(prospect.nivelRiesgo)}`} variant="outline"><Shield size={9} className="mr-0.5" />Riesgo {prospect.nivelRiesgo}</Badge>}
              {prospect.planRecomendado && <Badge className="text-[10px] bg-violet-50 text-violet-700" variant="outline"><CreditCard size={9} className="mr-0.5" />{prospect.planRecomendado}</Badge>}
              {prospect.efos69b && <Badge className="text-[10px] bg-violet-600 text-white border-violet-600" variant="outline" data-testid="badge-efos"><AlertTriangle size={9} className="mr-0.5" />EFOS 69-B: {prospect.efos69b.situacion}</Badge>}
            </div>
          </div>
          <div className="flex border-t border-black/[0.06]">
            {(["info", "activity", "notes"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === tab ? "text-cedu-blue border-b-2 border-cedu-blue" : "text-cedu-ink-muted hover:text-cedu-ink"}`} data-testid={`tab-${tab}`}>
                {tab === "info" ? "Información" : tab === "activity" ? "Actividad" : "Notas"}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-5">
          {prospect.efos69b && (
            <div className="rounded-lg border-2 border-violet-300 bg-violet-50 p-3" data-testid="alert-efos-69b">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-violet-700" />
                <span className="text-xs font-bold text-violet-800">EFOS — Lista 69-B del SAT</span>
              </div>
              <div className="text-[11px] text-violet-700 space-y-0.5">
                <p><span className="font-semibold">Estatus:</span> {prospect.efos69b.situacion}</p>
                <p><span className="font-semibold">RFC en lista:</span> {prospect.efos69b.rfc}</p>
                <p><span className="font-semibold">Nombre registrado:</span> {prospect.efos69b.nombre}</p>
              </div>
              <p className="text-[10px] text-violet-600 mt-1.5">
                {prospect.efos69b.situacion === 'Definitivo'
                  ? 'Esta empresa ha sido confirmada como emisora de facturas por operaciones simuladas. Sus CFDI se consideran inexistentes.'
                  : prospect.efos69b.situacion === 'Presunto'
                  ? 'Esta empresa está bajo investigación del SAT por presuntas operaciones simuladas.'
                  : prospect.efos69b.situacion === 'Desvirtuado'
                  ? 'Esta empresa fue investigada pero logró desvirtuar la presunción ante el SAT.'
                  : 'Esta empresa obtuvo sentencia favorable en el proceso del Art. 69-B.'}
              </p>
            </div>
          )}

          {activeTab === "info" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[11px] font-semibold text-cedu-ink mb-2 flex items-center gap-1"><Building2 size={12} /> General</h4>
                  <div className="space-y-1.5 text-xs">
                    {prospect.actividadEconomica && <p className="text-cedu-ink-muted"><span className="text-cedu-ink font-medium">Actividad:</span> {prospect.actividadEconomica}</p>}
                    {prospect.codigoScian && <p className="text-cedu-ink-muted"><span className="text-cedu-ink font-medium">SCIAN:</span> {prospect.codigoScian}</p>}
                    {prospect.grupoSector && <p className="text-cedu-ink-muted"><span className="text-cedu-ink font-medium">Sector:</span> {prospect.grupoSector}</p>}
                    {prospect.estratoPersonal && <p className="text-cedu-ink-muted"><span className="text-cedu-ink font-medium">Personal:</span> {prospect.estratoPersonal}{prospect.empleadosEstimados ? ` (~${prospect.empleadosEstimados})` : ""}</p>}
                    {prospect.potencialAportacionMensual && <p className="text-cedu-ink-muted"><span className="text-cedu-ink font-medium">Potencial:</span> {formatMXN(prospect.potencialAportacionMensual)}/mes</p>}
                    {prospect.zonaComercial && <p className="text-cedu-ink-muted"><span className="text-cedu-ink font-medium">Zona:</span> {prospect.zonaComercial}</p>}
                    {prospect.nomsAplicables && prospect.nomsAplicables.length > 0 && <p className="text-cedu-ink-muted"><span className="text-cedu-ink font-medium">NOMs:</span> {prospect.nomsAplicables.join(", ")}</p>}
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold text-cedu-ink mb-2 flex items-center gap-1"><Phone size={12} /> Contacto</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <User size={10} className="text-cedu-ink-muted flex-shrink-0" />
                      <Input
                        value={editContacto}
                        onChange={(e) => setEditContacto(e.target.value)}
                        onBlur={() => { if (editContacto !== (prospect.nombreContacto || "")) onUpdateField("nombreContacto", editContacto); }}
                        placeholder="Nombre de contacto"
                        className="h-7 text-xs bg-white/50 border-black/[0.06]"
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText size={10} className="text-cedu-ink-muted flex-shrink-0" />
                      <Input
                        value={editRfc}
                        onChange={(e) => setEditRfc(e.target.value.toUpperCase())}
                        onBlur={() => { if (editRfc !== (prospect.rfc || "")) onUpdateField("rfc", editRfc); }}
                        placeholder="RFC"
                        maxLength={13}
                        className="h-7 text-xs bg-white/50 border-black/[0.06] uppercase"
                        data-testid="input-rfc"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={10} className="text-cedu-ink-muted flex-shrink-0" />
                      <Input
                        value={editTelefono}
                        onChange={(e) => setEditTelefono(e.target.value)}
                        onBlur={() => { if (editTelefono !== (prospect.telefono || "")) onUpdateField("telefono", editTelefono); }}
                        placeholder="Teléfono"
                        className="h-7 text-xs bg-white/50 border-black/[0.06]"
                        data-testid="input-phone"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={10} className="text-cedu-ink-muted flex-shrink-0" />
                      <Input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        onBlur={() => { if (editEmail !== (prospect.correoElectronico || "")) onUpdateField("correoElectronico", editEmail); }}
                        placeholder="Correo electrónico"
                        className="h-7 text-xs bg-white/50 border-black/[0.06]"
                        data-testid="input-email"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe size={10} className="text-cedu-ink-muted flex-shrink-0" />
                      <Input
                        value={editWeb}
                        onChange={(e) => setEditWeb(e.target.value)}
                        onBlur={() => { if (editWeb !== (prospect.sitioWeb || "")) onUpdateField("sitioWeb", editWeb); }}
                        placeholder="Sitio web"
                        className="h-7 text-xs bg-white/50 border-black/[0.06]"
                        data-testid="input-website"
                      />
                      {(() => {
                        const webUrl = inferWebsite(prospect.correoElectronico, prospect.sitioWeb) || (editWeb ? (editWeb.startsWith("http") ? editWeb : `https://${editWeb}`) : null);
                        return webUrl ? (
                          <a href={webUrl} target="_blank" rel="noopener" className="text-cedu-blue hover:text-cedu-blue/70 flex-shrink-0" title="Abrir sitio web">
                            <ExternalLink size={12} />
                          </a>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-cedu-ink mb-2 flex items-center gap-1"><MapPin size={12} /> Ubicación</h4>
                <p className="text-xs text-cedu-ink-muted">
                  {prospect.direccionCompleta || [prospect.calle, prospect.numExterior, prospect.colonia, prospect.codigoPostal, prospect.municipio, prospect.estado].filter(Boolean).join(", ") || "Sin dirección"}
                </p>
                {googleMapsUrl(prospect) && (
                  <a
                    href={googleMapsUrl(prospect)!}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-cedu-blue hover:underline"
                    data-testid="link-google-maps"
                  >
                    <MapPin size={12} /> Ver en Google Maps
                  </a>
                )}
              </div>

              {scoreBreakdown && (
                <div>
                  <h4 className="text-[11px] font-semibold text-cedu-ink mb-2">Desglose de score</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(scoreBreakdown).map(([key, val]) => (
                      <div key={key} className="bg-black/[0.02] rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-cedu-ink">{val}</p>
                        <p className="text-[10px] text-cedu-ink-muted capitalize">{key}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-[11px] font-semibold text-cedu-ink mb-2">Pipeline</h4>
                <div className="flex items-center gap-1">
                  {DENUE_STAGES.map((s, i) => {
                    const isActive = i <= currentIdx;
                    return (
                      <div key={s.key} className="flex items-center gap-1 flex-1">
                        <button onClick={() => onUpdateStage(s.key)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${isActive ? s.color : "bg-gray-100 text-gray-400"}`} data-testid={`stage-button-${s.key}`}>
                          {s.label}
                        </button>
                        {i < DENUE_STAGES.length - 1 && <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="text-[11px] font-semibold text-cedu-ink mb-1">Cartera</h4>
                  {isAdmin ? (
                    <Select value={prospect.partnerId || "none"} onValueChange={(v) => onAssignPartner(v === "none" ? null : v)}>
                      <SelectTrigger className="h-8 text-xs bg-white" data-testid="select-assign-partner">
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName || p.email}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : myId && prospect.partnerId === myId ? (
                    <div className="flex items-center gap-2">
                      <Badge className="text-[10px] bg-cedu-violet/10 text-cedu-violet border-cedu-violet/20" variant="outline">En tu cartera</Badge>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg text-cedu-ink-muted" onClick={onRelease} data-testid="button-release">Liberar</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg gap-1 w-full text-cedu-violet border-cedu-violet/30 hover:bg-cedu-violet/5" onClick={onClaim} data-testid="button-claim-detail">
                      <UserPlus size={12} /> Reclamar prospecto
                    </Button>
                  )}
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold text-cedu-ink mb-1">Grupo de contacto</h4>
                  <Select value={prospect.contactGroupId || "none"} onValueChange={(v) => onAssignGroup(v === "none" ? null : v)}>
                    <SelectTrigger className="h-8 text-xs bg-white" data-testid="select-assign-group">
                      <SelectValue placeholder="Sin grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin grupo</SelectItem>
                      {contactGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {activeTab === "activity" && (
            <>
              <MeetingScheduler
                prospect={prospect}
                onSchedule={onScheduleMeeting}
                isScheduling={isSchedulingMeeting}
              />

              <div>
                <h4 className="text-[11px] font-semibold text-cedu-ink mb-2">Registrar interacción</h4>
                <Textarea placeholder="Notas de la interacción..." value={interactionNote} onChange={(e) => onInteractionNoteChange(e.target.value)} className="text-xs min-h-[60px]" data-testid="textarea-interaction" />
                <div className="flex gap-2 flex-wrap mt-2">
                  {["llamada", "email", "reunión", "visita", "nota"].map(tipo => (
                    <Button key={tipo} size="sm" variant="outline" className="rounded-xl text-[10px] h-6 capitalize" onClick={() => onAddInteraction(tipo)} disabled={isAddingInteraction} data-testid={`button-interaction-${tipo}`}>
                      {tipo}
                    </Button>
                  ))}
                </div>
              </div>

              {interactions.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-cedu-ink mb-2 flex items-center gap-1"><Clock size={12} /> Historial ({interactions.length})</h4>
                  <div className="space-y-2">
                    {interactions.map((i) => (
                      <div key={i.id} className="bg-black/[0.02] rounded-lg p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-[9px] capitalize">{i.tipo}</Badge>
                          <span className="text-[10px] text-cedu-ink-muted">
                            {new Date(i.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        {i.notas && <p className="text-xs text-cedu-ink-muted">{i.notas}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {interactions.length === 0 && (
                <div className="text-center py-6">
                  <Clock size={24} className="mx-auto text-cedu-ink-muted mb-2" />
                  <p className="text-xs text-cedu-ink-muted">No hay interacciones registradas.</p>
                </div>
              )}
            </>
          )}

          {activeTab === "notes" && (
            <div>
              <h4 className="text-[11px] font-semibold text-cedu-ink mb-2 flex items-center gap-1"><StickyNote size={12} /> Notas del prospecto</h4>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Escribe notas sobre este prospecto..."
                className="text-xs min-h-[120px]"
                data-testid="textarea-prospect-notes"
              />
              <Button
                size="sm"
                className="mt-2 rounded-xl text-xs bg-cedu-blue hover:bg-cedu-blue/90"
                onClick={() => onUpdateNotes(editNotes)}
                data-testid="button-save-notes"
              >
                <Save size={12} className="mr-1" /> Guardar notas
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PipelineValueHero({ data, isAdmin }: { data?: PipelineValue; isAdmin: boolean }) {
  if (!data) return null;
  const t = data.totals;
  const title = isAdmin ? "Valor de la cartera" : "Valor de tu cartera";

  if (t.totalCount === 0) {
    return (
      <Card className="border-cedu-violet/20 bg-gradient-to-br from-cedu-violet/[0.04] to-transparent" data-testid="pipeline-value-empty">
        <CardContent className="py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cedu-violet/10 flex items-center justify-center flex-shrink-0">
            <DollarSign size={18} className="text-cedu-violet" />
          </div>
          <div>
            <p className="text-sm font-semibold text-cedu-ink">{title}</p>
            <p className="text-xs text-cedu-ink-muted">Aún no tienes prospectos en tu cartera. Reclama prospectos disponibles o agrega uno para proyectar tu valor si cierras.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    { label: "Pronóstico ponderado", monthly: t.weightedMonthly, annual: t.weightedAnnual, sub: "según probabilidad por etapa", color: "text-cedu-violet", bg: "bg-cedu-violet/[0.06]" },
    { label: "Pipeline abierto", monthly: t.openMonthly, annual: t.openAnnual, sub: `${t.openCount} prospecto${t.openCount === 1 ? "" : "s"} en proceso`, color: "text-cedu-blue", bg: "bg-cedu-blue/[0.06]" },
    { label: "Ya cliente", monthly: t.wonMonthly, annual: t.wonAnnual, sub: `${t.wonCount} cerrado${t.wonCount === 1 ? "" : "s"}`, color: "text-cedu-green", bg: "bg-cedu-green/[0.06]" },
  ];

  return (
    <Card className="border-black/[0.06] overflow-hidden" data-testid="pipeline-value-hero">
      <div className="h-1 bg-gradient-to-r from-cedu-violet via-cedu-blue to-cedu-green" />
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-cedu-ink flex items-center gap-1.5"><DollarSign size={15} className="text-cedu-violet" /> {title} — si cierras</h3>
          <span className="text-[10px] text-cedu-ink-muted">{t.totalCount} prospecto{t.totalCount === 1 ? "" : "s"} en cartera</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {metrics.map(m => (
            <div key={m.label} className={`rounded-xl p-3 ${m.bg}`} data-testid={`value-metric-${m.label}`}>
              <p className="text-[10px] text-cedu-ink-muted">{m.label}</p>
              <p className={`text-lg font-bold ${m.color}`}>{formatMXN(m.monthly)}<span className="text-[11px] font-medium text-cedu-ink-muted">/mes</span></p>
              <p className="text-[11px] text-cedu-ink">{formatMXN(m.annual)}<span className="text-[10px] text-cedu-ink-muted">/año</span></p>
              <p className="text-[10px] text-cedu-ink-muted mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>
        {t.openMonthly > 0 && (
          <p className="text-[11px] text-cedu-ink-muted mt-3">
            💡 Si cierras <span className="font-semibold text-cedu-ink">todo</span> tu pipeline abierto, sumarías <span className="font-semibold text-cedu-blue">{formatMXN(t.openAnnual)}/año</span> en ingresos recurrentes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AddProspectDialog({ onClose, onSubmit, isSubmitting }: {
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    nombreComercial: "", razonSocial: "", nombreContacto: "", telefono: "", correoElectronico: "",
    estado: "", municipio: "", empleadosEstimados: "", potencialAportacionMensual: "", planRecomendado: "", notas: "", stage: "nuevo",
  });
  const [isTest, setIsTest] = useState(false);
  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));
  const canSubmit = form.nombreComercial.trim().length > 0 && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload: Record<string, any> = {};
    for (const [k, v] of Object.entries(form)) {
      if (v === "" || v == null) continue;
      if (k === "empleadosEstimados" || k === "potencialAportacionMensual") payload[k] = Number(v);
      else payload[k] = v;
    }
    if (isTest) payload.test = true;
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/30" onClick={onClose} data-testid="dialog-add-prospect">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-black/[0.06] px-5 py-3 flex items-center justify-between">
          <h3 className="font-serif text-lg text-cedu-ink flex items-center gap-2"><UserPlus size={16} className="text-cedu-violet" /> Agregar prospecto</h3>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}><X size={16} /></Button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[11px] font-medium text-cedu-ink mb-1 block">Nombre comercial *</label>
            <Input value={form.nombreComercial} onChange={(e) => set("nombreComercial", e.target.value)} placeholder="Nombre de la empresa" className="h-8 text-xs bg-white" data-testid="add-input-nombre" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-cedu-ink mb-1 block">Razón social</label>
              <Input value={form.razonSocial} onChange={(e) => set("razonSocial", e.target.value)} className="h-8 text-xs bg-white" data-testid="add-input-razon" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-cedu-ink mb-1 block">Contacto</label>
              <Input value={form.nombreContacto} onChange={(e) => set("nombreContacto", e.target.value)} className="h-8 text-xs bg-white" data-testid="add-input-contacto" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-cedu-ink mb-1 block">Teléfono</label>
              <Input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} className="h-8 text-xs bg-white" data-testid="add-input-telefono" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-cedu-ink mb-1 block">Email</label>
              <Input value={form.correoElectronico} onChange={(e) => set("correoElectronico", e.target.value)} className="h-8 text-xs bg-white" data-testid="add-input-email" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-cedu-ink mb-1 block">Estado</label>
              <Select value={form.estado || "none"} onValueChange={(v) => set("estado", v === "none" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs bg-white" data-testid="add-select-estado"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {ESTADOS_MEXICO.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-cedu-ink mb-1 block">Municipio</label>
              <Input value={form.municipio} onChange={(e) => set("municipio", e.target.value)} className="h-8 text-xs bg-white" data-testid="add-input-municipio" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-cedu-ink mb-1 block"># Empleados (est.)</label>
              <Input type="number" value={form.empleadosEstimados} onChange={(e) => set("empleadosEstimados", e.target.value)} className="h-8 text-xs bg-white" data-testid="add-input-empleados" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-cedu-ink mb-1 block">Potencial mensual (MXN)</label>
              <Input type="number" value={form.potencialAportacionMensual} onChange={(e) => set("potencialAportacionMensual", e.target.value)} className="h-8 text-xs bg-white" data-testid="add-input-potencial" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-cedu-ink mb-1 block">Plan recomendado</label>
              <Input value={form.planRecomendado} onChange={(e) => set("planRecomendado", e.target.value)} className="h-8 text-xs bg-white" data-testid="add-input-plan" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-cedu-ink mb-1 block">Etapa</label>
              <Select value={form.stage} onValueChange={(v) => set("stage", v)}>
                <SelectTrigger className="h-8 text-xs bg-white" data-testid="add-select-stage"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DENUE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-cedu-ink mb-1 block">Notas</label>
            <Textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} className="text-xs min-h-[60px] bg-white" data-testid="add-input-notas" />
          </div>
          <label className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 cursor-pointer" data-testid="add-test-toggle">
            <input type="checkbox" checked={isTest} onChange={(e) => setIsTest(e.target.checked)} className="rounded border-amber-300" data-testid="add-input-test" />
            <span className="text-[11px] text-amber-800">🧪 Prospecto de prueba — se podrá borrar después con un solo comando</span>
          </label>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-black/[0.06] px-5 py-3 flex justify-end gap-2">
          <Button size="sm" variant="ghost" className="text-xs" onClick={onClose}>Cancelar</Button>
          <Button size="sm" className="text-xs bg-cedu-violet hover:bg-cedu-violet/90 text-white gap-1" onClick={handleSubmit} disabled={!canSubmit} data-testid="add-submit">
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Agregar a mi cartera
          </Button>
        </div>
      </div>
    </div>
  );
}

function MeetingScheduler({ prospect, onSchedule, isScheduling }: {
  prospect: DenueProspecto;
  onSchedule: (data: { scheduledAt: string; durationMinutes: number; attendeeEmail: string; attendeeName?: string; note?: string; advanceStage?: boolean }) => void;
  isScheduling: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");        // yyyy-mm-dd
  const [time, setTime] = useState("");        // HH:mm
  const [duration, setDuration] = useState("30");
  const [email, setEmail] = useState(prospect.correoElectronico || "");
  const [note, setNote] = useState("");
  const [advance, setAdvance] = useState(true);

  const canSubmit = !!date && !!time && email.includes("@") && !isScheduling;

  const submit = () => {
    if (!canSubmit) return;
    // Combine local date+time into an ISO timestamp.
    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    onSchedule({
      scheduledAt,
      durationMinutes: Number(duration) || 30,
      attendeeEmail: email.trim(),
      attendeeName: prospect.nombreContacto || prospect.nombreComercial,
      note: note.trim() || undefined,
      advanceStage: advance,
    });
    setOpen(false);
    setNote("");
  };

  if (!open) {
    return (
      <Button size="sm" className="w-full rounded-xl gap-2 bg-[#1a73e8] hover:bg-[#1765cc] text-white" onClick={() => setOpen(true)} data-testid="button-schedule-meeting">
        <Video size={14} /> Agendar reunión (Google Meet)
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-[#1a73e8]/20 bg-[#1a73e8]/[0.03] p-3 space-y-2" data-testid="meeting-scheduler">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold text-cedu-ink flex items-center gap-1"><CalendarClock size={13} className="text-[#1a73e8]" /> Agendar reunión Google Meet</h4>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setOpen(false)}><X size={14} /></Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-cedu-ink-muted mb-1 block">Fecha</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-xs bg-white" data-testid="meeting-date" />
        </div>
        <div>
          <label className="text-[10px] text-cedu-ink-muted mb-1 block">Hora</label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-8 text-xs bg-white" data-testid="meeting-time" />
        </div>
        <div>
          <label className="text-[10px] text-cedu-ink-muted mb-1 block">Duración (min)</label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="h-8 text-xs bg-white" data-testid="meeting-duration"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["15", "30", "45", "60"].map(d => <SelectItem key={d} value={d}>{d} min</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] text-cedu-ink-muted mb-1 block">Correo del prospecto</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@empresa.com" className="h-8 text-xs bg-white" data-testid="meeting-email" />
        </div>
      </div>
      <Textarea placeholder="Nota para la invitación (opcional)" value={note} onChange={(e) => setNote(e.target.value)} className="text-xs min-h-[44px] bg-white" data-testid="meeting-note" />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={advance} onChange={(e) => setAdvance(e.target.checked)} className="rounded border-gray-300" data-testid="meeting-advance" />
        <span className="text-[10px] text-cedu-ink-muted">Avanzar a etapa "Demo" al agendar</span>
      </label>
      <Button size="sm" className="w-full rounded-xl gap-2 bg-[#1a73e8] hover:bg-[#1765cc] text-white" onClick={submit} disabled={!canSubmit} data-testid="button-confirm-meeting">
        {isScheduling ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />} Crear Meet y enviar invitación
      </Button>
      <p className="text-[9px] text-cedu-ink-muted">Se creará un evento con enlace de Google Meet y Google enviará la invitación por correo al prospecto.</p>
    </div>
  );
}
