import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsurancePlan } from "@shared/schema";
import {
  Shield, Building2, Truck, Flame, Check, X, ArrowLeft,
  Heart, Phone, Smartphone, Gift, Download, ChevronDown, ChevronUp,
  Loader2, AlertCircle, BadgeCheck, FileText,
} from "lucide-react";

const PROFILES = [
  {
    key: "administrativo" as const,
    label: "Administrativo",
    icon: Building2,
    desc: "Oficina, administración, ventas, atención al cliente",
    color: "cedu-blue",
    bgClass: "bg-blue-50 border-blue-200",
    iconClass: "text-blue-600",
    btnClass: "bg-[#1b5adf] hover:bg-[#1548b8]",
  },
  {
    key: "logistica" as const,
    label: "Operativo Moderado",
    icon: Truck,
    desc: "Operarios, almacén, transporte, logística",
    color: "cedu-orange",
    bgClass: "bg-orange-50 border-orange-200",
    iconClass: "text-orange-600",
    btnClass: "bg-[#f28023] hover:bg-[#d96e15]",
  },
  {
    key: "pirotecnia" as const,
    label: "Operativo Alto",
    icon: Flame,
    desc: "Alto riesgo, químicos, pirotecnia, construcción pesada",
    color: "cedu-violet",
    bgClass: "bg-violet-50 border-violet-200",
    iconClass: "text-violet-600",
    btnClass: "bg-[#7c3aed] hover:bg-[#6b21d9]",
  },
];

const TIER_LABELS: Record<string, string> = { basico: "Básico", medio: "Medio", premium: "Premium" };

const FLEXIBLE_BENEFITS = [
  "Seguro de mascota",
  "Asistencia en viajes",
  "Descuento en farmacias",
  "Apoyo psicológico",
  "Nutrición en línea",
  "Descuento en gimnasios",
];

const FAQS = [
  { q: "¿Quién puede contratar?", a: "Todos los socios activos de la cooperativa Ceduverse y sus colaboradores dados de alta en el sistema." },
  { q: "¿Cómo se paga el seguro?", a: "Se descuenta automáticamente de tu aportación mensual cooperativa, o puedes elegir pago directo con tarjeta." },
  { q: "¿Cuándo se activa la cobertura?", a: "La cobertura se activa dentro de las 48 horas hábiles después de completar el proceso de contratación." },
  { q: "¿Puedo cancelar en cualquier momento?", a: "Sí, puedes cancelar tu plan desde tu dashboard. La cancelación se hace efectiva al final del periodo mensual vigente." },
  { q: "¿Cubre a mi familia?", a: "Los planes incluyen telemedicina para el titular. Para cobertura familiar extendida, consulta las opciones premium o contacta a tu asesor." },
];

function fmt(val: string | null | undefined): string {
  if (!val) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return "$" + n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
}

function EnrollmentModal({
  plan,
  onClose,
  onSuccess,
}: {
  plan: InsurancePlan;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nombre: "",
    curp: "",
    fechaNacimiento: "",
    direccion: "",
    flex1: "",
    flex2: "",
    paymentMethod: "aportacion",
    acceptTerms: false,
  });
  const { toast } = useToast();

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/insurance/enroll", {
        planId: plan.id,
        monthlyAmount: plan.pricePerEmployee,
        flexibleBenefit1: form.flex1,
        flexibleBenefit2: form.flex2,
        personalData: {
          nombre: form.nombre,
          curp: form.curp,
          fechaNacimiento: form.fechaNacimiento,
          direccion: form.direccion,
          paymentMethod: form.paymentMethod,
        },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/my-enrollment"] });
      onSuccess();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "No se pudo procesar la solicitud", variant: "destructive" });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="enrollment-modal">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl text-cedu-ink">Contratar {plan.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl" data-testid="modal-close">&times;</button>
        </div>

        <div className="flex gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-[#1b5adf]" : "bg-gray-200"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-cedu-ink-muted mb-2">Confirma tus datos personales</p>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nombre completo" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} data-testid="input-nombre" />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="CURP" value={form.curp} maxLength={18}
              onChange={(e) => setForm({ ...form, curp: e.target.value.toUpperCase() })} data-testid="input-curp" />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" type="date" placeholder="Fecha de nacimiento" value={form.fechaNacimiento}
              onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })} data-testid="input-fecha" />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Dirección" value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })} data-testid="input-direccion" />
            <button className="w-full bg-[#1b5adf] text-white rounded-lg py-2.5 font-medium text-sm mt-2"
              onClick={() => setStep(2)} disabled={!form.nombre || !form.curp} data-testid="btn-step-1">Continuar</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-cedu-ink-muted mb-2">Selecciona 2 beneficios flexibles</p>
            <div className="grid grid-cols-2 gap-2">
              {FLEXIBLE_BENEFITS.map((b) => {
                const selected = form.flex1 === b || form.flex2 === b;
                return (
                  <button key={b} data-testid={`benefit-${b.replace(/\s+/g, "-").toLowerCase()}`}
                    className={`border rounded-lg px-3 py-2 text-xs text-left transition-all ${selected ? "border-[#1b5adf] bg-blue-50 text-[#1b5adf]" : "border-gray-200 hover:border-gray-300"}`}
                    onClick={() => {
                      if (selected) {
                        setForm({ ...form, flex1: form.flex1 === b ? "" : form.flex1, flex2: form.flex2 === b ? "" : form.flex2 });
                      } else if (!form.flex1) {
                        setForm({ ...form, flex1: b });
                      } else if (!form.flex2) {
                        setForm({ ...form, flex2: b });
                      }
                    }}
                  >
                    <Gift size={12} className="inline mr-1" />{b}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2">
              <button className="flex-1 border border-gray-300 rounded-lg py-2 text-sm" onClick={() => setStep(1)}>Atrás</button>
              <button className="flex-1 bg-[#1b5adf] text-white rounded-lg py-2 text-sm font-medium"
                onClick={() => setStep(3)} disabled={!form.flex1 || !form.flex2} data-testid="btn-step-2">Continuar</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-cedu-ink-muted mb-2">Método de pago</p>
            {[{ val: "aportacion", label: "Descuento de aportación cooperativa" }, { val: "directo", label: "Pago directo (tarjeta)" }].map((opt) => (
              <label key={opt.val} className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer ${form.paymentMethod === opt.val ? "border-[#1b5adf] bg-blue-50" : "border-gray-200"}`}>
                <input type="radio" name="payment" value={opt.val} checked={form.paymentMethod === opt.val}
                  onChange={() => setForm({ ...form, paymentMethod: opt.val })} data-testid={`radio-${opt.val}`} />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
            <div className="flex gap-2 mt-2">
              <button className="flex-1 border border-gray-300 rounded-lg py-2 text-sm" onClick={() => setStep(2)}>Atrás</button>
              <button className="flex-1 bg-[#1b5adf] text-white rounded-lg py-2 text-sm font-medium"
                onClick={() => setStep(4)} data-testid="btn-step-3">Continuar</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-cedu-ink-muted mb-2">Acepta los términos del servicio</p>
            <div className="bg-gray-50 border rounded-lg p-3 text-xs text-cedu-ink-muted max-h-32 overflow-y-auto">
              Al contratar este plan de seguros a través de Ceduverse, acepto los términos y condiciones del proveedor Betterfly
              y sus aliados (MetLife, Odontoprev, Chubb). Entiendo que la cobertura se activa en un plazo de 48 horas hábiles
              y que el cobro mensual de {fmt(plan.pricePerEmployee)} por colaborador se realizará según el método de pago seleccionado.
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.acceptTerms} onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })} data-testid="checkbox-terms" />
              <span className="text-sm">Acepto los términos y condiciones</span>
            </label>
            <div className="flex gap-2 mt-2">
              <button className="flex-1 border border-gray-300 rounded-lg py-2 text-sm" onClick={() => setStep(3)}>Atrás</button>
              <button className="flex-1 bg-[#1b5adf] text-white rounded-lg py-2 text-sm font-medium"
                onClick={() => { enrollMutation.mutate(); setStep(5); }}
                disabled={!form.acceptTerms || enrollMutation.isPending} data-testid="btn-step-4">
                {enrollMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirmar contratación"}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center py-6 space-y-3">
            {enrollMutation.isPending ? (
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#1b5adf]" />
            ) : enrollMutation.isError ? (
              <>
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <p className="text-sm text-red-600">Hubo un error al procesar tu solicitud. Intenta de nuevo.</p>
                <button className="text-sm text-[#1b5adf] underline" onClick={() => setStep(4)}>Regresar</button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <BadgeCheck className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-serif text-lg text-cedu-ink">¡Solicitud enviada!</h4>
                <p className="text-sm text-cedu-ink-muted">Te contactaremos en un plazo de 48 horas para activar tu cobertura.</p>
                <button className="bg-[#1b5adf] text-white rounded-lg px-6 py-2 text-sm font-medium mt-2"
                  onClick={onClose} data-testid="btn-finish">Cerrar</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveEnrollmentView({ data }: { data: { enrollment: any; plan: InsurancePlan } }) {
  const { toast } = useToast();
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/insurance/enrollment/${data.enrollment.id}/cancel`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/my-enrollment"] });
      toast({ title: "Plan cancelado", description: "Tu seguro ha sido cancelado exitosamente." });
    },
  });

  const plan = data.plan;
  const profile = PROFILES.find((p) => p.key === plan.profile);

  return (
    <div className="max-w-2xl mx-auto" data-testid="active-enrollment">
      <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile?.bgClass || "bg-gray-50"}`}>
            <Shield className={`w-5 h-5 ${profile?.iconClass || "text-gray-600"}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg text-cedu-ink">{plan.name}</h3>
            <p className="text-xs text-cedu-ink-muted">{plan.profileLabel} · {TIER_LABELS[plan.tier]}</p>
          </div>
          <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
            <BadgeCheck size={12} /> Activo
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {plan.coberturaDental && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-cedu-ink-muted uppercase tracking-wide">Dental</p>
              <p className="text-sm font-semibold text-cedu-ink">{fmt(plan.coberturaDental)}</p>
            </div>
          )}
          {plan.coberturaVidaMin && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-cedu-ink-muted uppercase tracking-wide">Vida MetLife</p>
              <p className="text-sm font-semibold text-cedu-ink">{fmt(plan.coberturaVidaMin)} – {fmt(plan.coberturaVidaMax)}</p>
            </div>
          )}
          {plan.coberturaAccidentes && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-cedu-ink-muted uppercase tracking-wide">Accidentes</p>
              <p className="text-sm font-semibold text-cedu-ink">{fmt(plan.coberturaAccidentes)}</p>
            </div>
          )}
          {plan.coberturaGmm && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-cedu-ink-muted uppercase tracking-wide">GMM MetLife</p>
              <p className="text-sm font-semibold text-cedu-ink">{fmt(plan.coberturaGmm)}</p>
              <p className="text-[10px] text-cedu-ink-muted">Deducible {fmt(plan.gmmDeducible)} · {plan.gmmCoaseguro}% coaseg.</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {plan.hasApp && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Smartphone size={10} /> App Betterfly
            </span>
          )}
          {plan.hasTelemedicine && (
            <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Phone size={10} /> Telemedicina
            </span>
          )}
          {data.enrollment.flexibleBenefit1 && (
            <span className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Gift size={10} /> {data.enrollment.flexibleBenefit1}
            </span>
          )}
          {data.enrollment.flexibleBenefit2 && (
            <span className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Gift size={10} /> {data.enrollment.flexibleBenefit2}
            </span>
          )}
        </div>

        {data.enrollment.policyNumber && (
          <p className="text-xs text-cedu-ink-muted mb-3">Póliza: <span className="font-mono">{data.enrollment.policyNumber}</span></p>
        )}

        <div className="flex gap-2">
          {data.enrollment.certificateUrl && (
            <a href={data.enrollment.certificateUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#1b5adf] text-white text-sm px-4 py-2 rounded-lg font-medium" data-testid="btn-download-cert">
              <Download size={14} /> Descargar certificado
            </a>
          )}
          <button className="flex items-center gap-1.5 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg hover:bg-red-50"
            onClick={() => { if (confirm("¿Estás seguro de cancelar tu plan?")) cancelMutation.mutate(); }}
            disabled={cancelMutation.isPending} data-testid="btn-cancel-plan">
            {cancelMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Cancelar plan
          </button>
        </div>
      </div>

      <p className="text-xs text-center text-cedu-ink-muted mt-4">
        Monto mensual: <span className="font-semibold">{fmt(plan.pricePerEmployee)}</span> por colaborador · Proveedor: {plan.provider}
      </p>
    </div>
  );
}

export default function SegurosPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [enrollingPlan, setEnrollingPlan] = useState<InsurancePlan | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data: plans, isLoading: plansLoading } = useQuery<InsurancePlan[]>({
    queryKey: ["/api/insurance/plans"],
  });

  const { data: myEnrollment, isLoading: enrollLoading } = useQuery<{ enrollment?: any; plan?: any }>({
    queryKey: ["/api/insurance/my-enrollment"],
    enabled: !!user,
  });

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-cedu-cream"><Loader2 className="w-8 h-8 animate-spin text-[#1b5adf]" /></div>;
  if (!user) { setLocation("/auth"); return null; }

  const hasActive = myEnrollment && myEnrollment.enrollment;
  const filteredPlans = plans?.filter((p) => p.profile === selectedProfile) || [];
  const tiers: ("basico" | "medio" | "premium")[] = ["basico", "medio", "premium"];

  return (
    <div className="min-h-screen bg-cedu-cream" data-testid="page-seguros">
      <header className="bg-white border-b border-black/[0.06] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/dashboard">
            <button className="text-cedu-ink-muted hover:text-cedu-ink" data-testid="btn-back-dashboard">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <Shield className="text-[#1b5adf]" size={22} />
          <h1 className="font-serif text-xl text-cedu-ink">Seguros y Beneficios</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {(plansLoading || enrollLoading) ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1b5adf]" /></div>
        ) : hasActive ? (
          <ActiveEnrollmentView data={myEnrollment as any} />
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl md:text-3xl text-cedu-ink mb-2">
                Protege tu bienestar
              </h2>
              <p className="text-cedu-ink-muted text-sm md:text-base max-w-xl mx-auto">
                Seguros exclusivos para socios Ceduverse. Coberturas de vida, dental, accidentes y gastos médicos mayores con los mejores proveedores.
              </p>
              <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
                {["Betterfly", "MetLife", "Odontoprev", "Chubb"].map((brand) => (
                  <span key={brand} className="bg-white border border-black/[0.06] text-xs font-medium text-cedu-ink px-3 py-1.5 rounded-full shadow-sm">
                    {brand}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {PROFILES.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedProfile === p.key;
                return (
                  <button key={p.key} data-testid={`profile-${p.key}`}
                    className={`border-2 rounded-2xl p-5 text-left transition-all ${isSelected ? `${p.bgClass} border-current shadow-md scale-[1.02]` : "bg-white border-black/[0.06] hover:border-black/[0.12] hover:shadow-sm"}`}
                    onClick={() => setSelectedProfile(isSelected ? null : p.key)}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isSelected ? p.bgClass : "bg-gray-50"}`}>
                      <Icon className={`w-6 h-6 ${isSelected ? p.iconClass : "text-gray-500"}`} />
                    </div>
                    <h3 className="font-serif text-base text-cedu-ink">{p.label}</h3>
                    <p className="text-xs text-cedu-ink-muted mt-1">{p.desc}</p>
                  </button>
                );
              })}
            </div>

            {selectedProfile && (
              <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden shadow-sm mb-8" data-testid="comparison-table">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-black/[0.06]">
                        <th className="text-left px-5 py-4 text-sm font-medium text-cedu-ink-muted">Cobertura</th>
                        {tiers.map((t) => {
                          const tierPlan = filteredPlans.find((p) => p.tier === t);
                          return (
                            <th key={t} className="text-center px-5 py-4">
                              <span className="text-sm font-semibold text-cedu-ink block">{TIER_LABELS[t]}</span>
                              {tierPlan && <span className="text-lg font-bold text-[#1b5adf] block mt-0.5">{fmt(tierPlan.pricePerEmployee)}</span>}
                              <span className="text-[10px] text-cedu-ink-muted">/colaborador/mes</span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04]">
                      {[
                        { label: "Dental (Odontoprev)", key: "coberturaDental" },
                        { label: "Vida MetLife", key: "coberturaVida" },
                        { label: "Accidentes", key: "coberturaAccidentes" },
                        { label: "GMM MetLife", key: "coberturaGmm" },
                        { label: "App Betterfly", key: "hasApp" },
                        { label: "Telemedicina", key: "hasTelemedicine" },
                        { label: "Beneficios flexibles", key: "flex" },
                      ].map((row) => (
                        <tr key={row.key} className="hover:bg-gray-50/50">
                          <td className="px-5 py-3 text-sm text-cedu-ink">{row.label}</td>
                          {tiers.map((t) => {
                            const p = filteredPlans.find((pl) => pl.tier === t);
                            let content;
                            if (!p) { content = "—"; }
                            else if (row.key === "coberturaDental") content = p.coberturaDental ? <span className="text-green-600 font-medium">{fmt(p.coberturaDental)}</span> : <X size={16} className="text-red-400 mx-auto" />;
                            else if (row.key === "coberturaVida") content = p.coberturaVidaMin ? <span className="text-green-600 font-medium text-xs">{fmt(p.coberturaVidaMin)}–{fmt(p.coberturaVidaMax)}</span> : <X size={16} className="text-red-400 mx-auto" />;
                            else if (row.key === "coberturaAccidentes") content = p.coberturaAccidentes ? <span className="text-green-600 font-medium">{fmt(p.coberturaAccidentes)}</span> : <X size={16} className="text-red-400 mx-auto" />;
                            else if (row.key === "coberturaGmm") content = p.coberturaGmm ? (
                              <div className="text-center">
                                <span className="text-green-600 font-medium text-xs">{fmt(p.coberturaGmm)}</span>
                                <span className="block text-[10px] text-cedu-ink-muted">Ded. {fmt(p.gmmDeducible)} · {p.gmmCoaseguro}%</span>
                              </div>
                            ) : <X size={16} className="text-red-400 mx-auto" />;
                            else if (row.key === "hasApp") content = p.hasApp ? <Check size={16} className="text-green-600 mx-auto" /> : <X size={16} className="text-red-400 mx-auto" />;
                            else if (row.key === "hasTelemedicine") content = p.hasTelemedicine ? <Check size={16} className="text-green-600 mx-auto" /> : <X size={16} className="text-red-400 mx-auto" />;
                            else if (row.key === "flex") content = <span className="text-green-600"><Check size={16} className="mx-auto" /></span>;
                            else content = "—";
                            return <td key={t} className="px-5 py-3 text-center text-sm">{content}</td>;
                          })}
                        </tr>
                      ))}
                      <tr>
                        <td className="px-5 py-4"></td>
                        {tiers.map((t) => {
                          const p = filteredPlans.find((pl) => pl.tier === t);
                          const prof = PROFILES.find((pr) => pr.key === selectedProfile);
                          return (
                            <td key={t} className="px-5 py-4 text-center">
                              {p && (
                                <button className={`${prof?.btnClass || "bg-[#1b5adf]"} text-white text-sm font-medium px-5 py-2 rounded-lg transition-all hover:shadow-md`}
                                  onClick={() => setEnrollingPlan(p)} data-testid={`btn-contratar-${t}`}>
                                  Contratar
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="max-w-2xl mx-auto" data-testid="faq-section">
              <h3 className="font-serif text-lg text-cedu-ink mb-4 text-center">Preguntas frecuentes</h3>
              <div className="space-y-2">
                {FAQS.map((faq, i) => (
                  <div key={i} className="bg-white border border-black/[0.06] rounded-xl overflow-hidden">
                    <button className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-cedu-ink"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)} data-testid={`faq-${i}`}>
                      {faq.q}
                      {openFaq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {openFaq === i && <div className="px-4 pb-3 text-sm text-cedu-ink-muted">{faq.a}</div>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {enrollingPlan && (
        <EnrollmentModal plan={enrollingPlan} onClose={() => setEnrollingPlan(null)}
          onSuccess={() => setEnrollingPlan(null)} />
      )}
    </div>
  );
}
