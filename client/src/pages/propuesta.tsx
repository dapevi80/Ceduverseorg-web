import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useForceLightMode } from "@/components/ThemeProvider";
import MexicoMap from "@/components/mexico-map";
import { CERT_PRICES_MXN } from "@shared/cert-pricing";
import {
  TrendingUp,
  Users,
  Building2,
  MapPin,
  Target,
  Award,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  ChevronUp,
  Bot,
  Briefcase,
  DollarSign,
  Calendar,
  Star,
  Zap,
  Globe,
  BookOpen,
  Info,
  Menu,
  X,
} from "lucide-react";

const UMA = 113.14;

// Misma etiqueta de honestidad que /socios (constante NOTA_ASAMBLEA de
// socios-landing.tsx). Acompaña a todo parámetro de bonos de esta página: el
// Reglamento Interno sigue en borrador y sin efectos jurídicos.
const NOTA_ASAMBLEA =
  "Política propuesta, sujeta a ratificación o ajuste por la Asamblea General. El Reglamento Interno está en borrador y no tiene efectos jurídicos: estos parámetros no son una regla vigente ni un compromiso en firme.";

const PLANS: Record<string, { umas: number; feePct: number; label: string; range: string; color: string; certDiscount: number }> = {
  Impulsa: { umas: 6, feePct: 0.20, label: "Impulsa", range: "1–10 colaboradores", color: "#00b87a", certDiscount: 5 },
  Transforma: { umas: 10, feePct: 0.13, label: "Transforma", range: "11–99 colaboradores", color: "#1b5adf", certDiscount: 10 },
  Lidera: { umas: 20, feePct: 0.10, label: "Lidera", range: "100–500 colaboradores", color: "#7c3aed", certDiscount: 15 },
};

// Participaciones del socio Consultor, tomadas de /socios (socios-landing.tsx)
// para que las dos páginas públicas cuenten lo mismo.
// Los PRECIOS vienen de la fuente ÚNICA de verdad (@shared/cert-pricing), la
// misma que el servidor usa para cobrar. Antes estaban hardcodeados en 399
// mientras el checkout cobraba 499. No volver a escribir el número a mano.
const DC3_PRICE = CERT_PRICES_MXN.dc3;
const SEP_PRICE = CERT_PRICES_MXN.sep;
const DC3_SHARE = 0.40;
const SEP_SHARE = 0.10;
const SEP_SOBRE_DC3 = 0.1; // supuesto: 1 de cada 10 que tramita DC-3 también tramita SEP
const BONO_REFERIDO = 500; // Consultor, según /socios

// Participación del socio sobre el fee de administración, por su PROPIA cartera.
function getAnticipoPct(n: number) {
  if (n <= 3) return 0.25;
  if (n <= 7) return 0.30;
  return 0.35;
}

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("es-MX");
}

function fmtK(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString("es-MX");
}

interface EstadoData {
  estado: string;
  zona: string;
  empresas: number;
  con_plan: number;
  empleados: number;
}

interface MercadoData {
  totals: {
    total: number;
    estados: number;
    municipios: number;
    sectores: number;
    conPlan: number;
    altaProbabilidad: number;
  };
  zonas: Array<{ zona: string; empresas: number; con_plan: number; empleados: number }>;
  sectores: Array<{ sector: string; empresas: number; empleados: number }>;
  planes: Array<{ plan: string; empresas: number }>;
  estados?: EstadoData[];
}

function useIntersectionObserver() {
  const [activeIdx, setActiveIdx] = useState(0);
  const observers = useRef<IntersectionObserver[]>([]);

  useEffect(() => {
    const sections = document.querySelectorAll("[data-slide]");
    observers.current.forEach(o => o.disconnect());
    observers.current = [];

    sections.forEach((section, i) => {
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveIdx(i); },
        { threshold: 0.4 }
      );
      obs.observe(section);
      observers.current.push(obs);
    });

    return () => observers.current.forEach(o => o.disconnect());
  }, []);

  return { activeIdx, total: document.querySelectorAll("[data-slide]").length };
}

function NavDots({ activeIdx, labels }: { activeIdx: number; labels: string[] }) {
  return (
    <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-2" data-testid="nav-dots">
      {labels.map((label, i) => (
        <button
          key={i}
          onClick={() => {
            const el = document.querySelectorAll("[data-slide]")[i];
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          className="group flex items-center gap-2"
          title={label}
          data-testid={`dot-${i}`}
        >
          <span className={`hidden group-hover:block text-[11px] font-semibold whitespace-nowrap px-2 py-0.5 rounded bg-gray-900 text-white`}>
            {label}
          </span>
          <span className={`block w-2.5 h-2.5 rounded-full transition-all ${
            activeIdx === i ? "bg-[#1b5adf] scale-125" : "bg-gray-300 hover:bg-gray-400"
          }`} />
        </button>
      ))}
    </nav>
  );
}

function SlideWrapper({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      data-slide
      id={id}
      className={`min-h-screen flex items-center justify-center py-20 px-4 ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {children}
    </section>
  );
}

function PropNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-white/90 backdrop-blur-xl border-b border-black/[0.06] shadow-sm" : "bg-transparent"
    }`} data-testid="nav-propuesta">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 bg-[#1b5adf] rounded-[10px] flex items-center justify-center text-white font-serif text-lg">C</div>
          <span className="font-serif text-xl text-gray-900 tracking-tight" translate="no">Cedu<em className="text-[#1b5adf] not-italic">verse</em></span>
        </Link>
        <div className="hidden md:flex items-center gap-4">
          <a href="#mercado" className="text-xs font-semibold text-gray-500 hover:text-gray-900 no-underline">Mercado</a>
          <a href="#modelo" className="text-xs font-semibold text-gray-500 hover:text-gray-900 no-underline">Modelo</a>
          <a href="#plan" className="text-xs font-semibold text-gray-500 hover:text-gray-900 no-underline">Plan 2026</a>
          <a href="#proyeccion" className="text-xs font-semibold text-gray-500 hover:text-gray-900 no-underline">Simulador</a>
          <Link href="/socios" className="bg-[#1b5adf] text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-blue-700 no-underline transition-colors" data-testid="link-ser-socio">
            Ser Socio
          </Link>
        </div>
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-mobile-menu-prop">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-black/[0.06] px-6 py-3 space-y-2">
          <a href="#mercado" className="block py-2 text-sm text-gray-700 no-underline" onClick={() => setMobileOpen(false)}>Mercado</a>
          <a href="#modelo" className="block py-2 text-sm text-gray-700 no-underline" onClick={() => setMobileOpen(false)}>Modelo</a>
          <a href="#plan" className="block py-2 text-sm text-gray-700 no-underline" onClick={() => setMobileOpen(false)}>Plan 2026</a>
          <a href="#proyeccion" className="block py-2 text-sm text-gray-700 no-underline" onClick={() => setMobileOpen(false)}>Simulador</a>
          <Link href="/socios" className="block mt-2 bg-[#1b5adf] text-white text-center text-sm font-bold px-5 py-3 rounded-lg no-underline" onClick={() => setMobileOpen(false)}>Ser Socio</Link>
        </div>
      )}
    </nav>
  );
}

function SlidePortada() {
  return (
    <SlideWrapper className="bg-gradient-to-br from-[#1b5adf] via-[#4f3aed] to-[#7c3aed] relative overflow-hidden">
      <div className="absolute top-20 right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-60 h-60 bg-[#f28023]/10 rounded-full blur-3xl" />
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm font-bold text-white/90 mb-8">
          <Zap size={14} className="text-[#f28023]" />
          Propuesta Ejecutiva 2026
        </div>
        <h1 className="font-serif text-5xl md:text-7xl text-white leading-[1.1] mb-6" data-testid="heading-portada" translate="no">
          Ceduverse
        </h1>
        <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-4 leading-relaxed">
          La plataforma EdTech + IA líder en capacitación laboral para América Latina
        </p>
        <p className="text-base text-white/60 max-w-xl mx-auto mb-12">
          Cooperativa de consumo con un modelo de aportaciones mensuales, respaldado por inteligencia de mercado real del DENUE (INEGI).
        </p>
        <a href="#problema" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors">
          <ChevronUp size={18} className="rotate-180 animate-bounce" />
          Desliza para explorar
        </a>
      </div>
    </SlideWrapper>
  );
}

function SlideProblema() {
  const stats = [
    { icon: Building2, value: "83%", label: "de empresas no cumplen NOM-035-STPS", color: "#ef4444" },
    { icon: Users, value: "56M", label: "trabajadores requieren capacitación", color: "#f28023" },
    { icon: ShieldCheck, value: "$500K+", label: "multas por incumplimiento", color: "#7c3aed" },
  ];

  return (
    <SlideWrapper className="bg-[#faf8f4]" id="problema">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-bold text-[#ef4444] uppercase tracking-widest">El problema</span>
          <h2 className="font-serif text-4xl md:text-5xl text-gray-900 mt-3 mb-4">
            México tiene un rezago masivo en capacitación laboral
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            La NOM-035-STPS exige a todas las empresas con más de 15 trabajadores implementar programas de capacitación. El incumplimiento genera multas de hasta 422,450 UMAs.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center" data-testid={`stat-problema-${i}`}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: s.color + "15" }}>
                <s.icon size={26} style={{ color: s.color }} />
              </div>
              <p className="text-4xl font-bold mb-2" style={{ color: s.color }}>{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

function SlideSolucion() {
  const features = [
    { icon: Bot, title: "Tutor con IA", desc: "Personaliza cada curso al puesto del trabajador en 15 segundos", color: "#1b5adf" },
    { icon: BookOpen, title: "+1,000 cursos STPS", desc: "Catálogo completo alineado a normas oficiales mexicanas", color: "#f28023" },
    { icon: Award, title: "Triple certificación", desc: "DC-3 STPS + Certificado SEP + Diploma NFT blockchain", color: "#7c3aed" },
    { icon: Globe, title: "100% en línea", desc: "Acceso desde cualquier dispositivo, 24/7, con seguimiento automático", color: "#00b87a" },
  ];

  return (
    <SlideWrapper className="bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-bold text-[#1b5adf] uppercase tracking-widest">La solución</span>
          <h2 className="font-serif text-4xl md:text-5xl text-gray-900 mt-3 mb-4">
            Ceduverse resuelve la capacitación a escala
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Plataforma EdTech que combina inteligencia artificial, contenido certificado y tecnología blockchain para transformar la capacitación laboral.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div key={i} className="flex gap-4 p-6 rounded-2xl border border-gray-100 bg-gray-50/50" data-testid={`feature-${i}`}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: f.color + "15" }}>
                <f.icon size={22} style={{ color: f.color }} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

function SlideMercado({ data, isLoading, isError }: { data: MercadoData | undefined; isLoading: boolean; isError: boolean }) {
  const zonas = data?.zonas?.filter(z => z.zona !== "Otra") || [];
  const sectores = data?.sectores || [];
  const maxEmpresas = Math.max(...zonas.map(z => z.empresas), 1);
  const maxSectorEmpresas = Math.max(...sectores.map(s => s.empresas), 1);
  const totalEmpresas = data?.totals?.total || 0;

  const zoneColors: Record<string, string> = {
    Norte: "#1b5adf",
    Centro: "#7c3aed",
    Bajío: "#f28023",
    "Sur-Sureste": "#00b87a",
  };

  return (
    <SlideWrapper className="bg-[#faf8f4]" id="mercado">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-[#00b87a] uppercase tracking-widest">Inteligencia comercial</span>
          <h2 className="font-serif text-4xl md:text-5xl text-gray-900 mt-3 mb-4">
            Mercado identificado con datos reales
          </h2>
          {data ? (
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Base de datos propietaria con {fmtK(totalEmpresas)} empresas en {data.totals.estados} estados, {fmtK(data.totals.municipios)} municipios y {data.totals.sectores} sectores económicos.
            </p>
          ) : isLoading ? (
            <p className="text-lg text-gray-400 max-w-2xl mx-auto animate-pulse">Cargando datos de inteligencia comercial...</p>
          ) : isError ? (
            <p className="text-lg text-red-400 max-w-2xl mx-auto">Error al cargar datos de mercado. Intenta recargar la página.</p>
          ) : null}
        </div>

        {isLoading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#1b5adf] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {data && <><div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <MapPin size={16} className="text-[#1b5adf]" />
              Empresas por zona
            </h3>
            <p className="text-xs text-gray-400 mb-5">Datos de inteligencia comercial Ceduverse</p>
            <div className="space-y-4" data-testid="chart-zonas">
              {zonas.map((z) => (
                <div key={z.zona}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700">{z.zona}</span>
                    <span className="text-sm font-bold" style={{ color: zoneColors[z.zona] || "#666" }}>{fmtK(z.empresas)}</span>
                  </div>
                  <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max((z.empresas / maxEmpresas) * 100, 5)}%`,
                        backgroundColor: zoneColors[z.zona] || "#999",
                      }}
                    >
                      <span className="text-[10px] font-bold text-white">{z.con_plan > 0 ? `${fmtK(z.con_plan)} perfiladas` : ""}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <BarChart3 size={16} className="text-[#f28023]" />
              Top sectores
            </h3>
            <p className="text-xs text-gray-400 mb-5">Empresas con mayor presencia</p>
            <div className="space-y-3" data-testid="chart-sectores">
              {sectores.map((s) => (
                <div key={s.sector} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-32 truncate flex-shrink-0">{s.sector}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full rounded bg-gradient-to-r from-[#f28023] to-[#ffa655] transition-all duration-700"
                      style={{ width: `${Math.max((s.empresas / maxSectorEmpresas) * 100, 3)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 w-12 text-right">{fmtK(s.empresas)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {data?.planes && data.planes.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-8" data-testid="chart-planes">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-[#7c3aed]" />
              Distribución por plan recomendado
            </h3>
            <div className="flex items-end gap-6 justify-center">
              {data.planes.map((p) => {
                const maxPlan = Math.max(...data.planes.map(pp => pp.empresas), 1);
                const planColor = PLANS[p.plan]?.color || "#999";
                return (
                  <div key={p.plan} className="flex flex-col items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: planColor }}>{fmtK(p.empresas)}</span>
                    <div
                      className="w-16 md:w-24 rounded-t-lg transition-all duration-700"
                      style={{ height: `${Math.max((p.empresas / maxPlan) * 120, 8)}px`, backgroundColor: planColor }}
                    />
                    <span className="text-xs font-semibold text-gray-600">{p.plan}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: "Empresas identificadas", value: fmtK(totalEmpresas), color: "#1b5adf" },
            { label: "Con plan asignado", value: fmtK(data?.totals?.conPlan || 0), color: "#7c3aed" },
            { label: "Alta probabilidad", value: fmtK(data?.totals?.altaProbabilidad || 0), color: "#00b87a" },
            { label: "Estados cubiertos", value: String(data?.totals?.estados || 0), color: "#f28023" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 text-center" data-testid={`stat-mercado-${i}`}>
              <p className="text-2xl md:text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        </>}
      </div>
    </SlideWrapper>
  );
}

function SlideModelo() {
  return (
    <SlideWrapper className="bg-white" id="modelo">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-bold text-[#7c3aed] uppercase tracking-widest">Modelo de negocio</span>
          <h2 className="font-serif text-4xl md:text-5xl text-gray-900 mt-3 mb-4">
            Tres planes, un modelo escalable
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Cada empresa aporta mensualmente según su tamaño. Ceduverse cobra un fee de administración, y de ese fee salen los anticipos de rendimientos y los bonos de los socios.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(PLANS).map(([key, p]) => {
            const avgEmp = key === "Impulsa" ? 5 : key === "Transforma" ? 30 : 200;
            const aport = avgEmp * p.umas * UMA;
            const fee = aport * p.feePct;
            return (
              <div key={key} className="rounded-2xl border-2 p-6 text-center relative overflow-hidden" style={{ borderColor: p.color + "40" }} data-testid={`card-plan-${key}`}>
                {key === "Transforma" && (
                  <div className="absolute top-3 right-3 bg-[#1b5adf] text-white text-[10px] font-bold px-3 py-1 rounded-full">MÁS POPULAR</div>
                )}
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: p.color + "15" }}>
                  <Briefcase size={24} style={{ color: p.color }} />
                </div>
                <h3 className="font-serif text-2xl mb-1" style={{ color: p.color }}>{p.label}</h3>
                <p className="text-xs text-gray-400 mb-6">{p.range}</p>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">UMAs/col/mes</span>
                    <span className="font-bold text-gray-900">{p.umas}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Fee Ceduverse</span>
                    <span className="font-bold text-gray-900">{(p.feePct * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Aportación/emp ({avgEmp} cols)</span>
                    <span className="font-bold text-gray-900">{fmt(aport)}/mes</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
                    <span className="text-gray-500">Fee mensual</span>
                    <span className="font-bold" style={{ color: p.color }}>{fmt(fee)}/mes</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Desc. certificaciones</span>
                    <span className="font-bold text-gray-900">{p.certDiscount}%</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 text-left space-y-1">
                  <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Incluye</p>
                  <p className="text-xs text-gray-600">Aula Virtual + Tutor IA + Academy</p>
                  <p className="text-xs text-gray-600">{p.certDiscount}% desc. en todas las certificaciones</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">UMA 2026 = ${UMA} MXN. Aportación = colaboradores × UMAs × valor UMA.</p>
        <p className="text-center text-[11px] text-gray-400 mt-2 max-w-2xl mx-auto leading-relaxed" data-testid="nota-modelo-asamblea">{NOTA_ASAMBLEA}</p>
      </div>
    </SlideWrapper>
  );
}

function SlidePlanComercial() {
  const timeline = [
    { q: "Q1 2026", title: "Lanzamiento", items: ["Zona Norte: 1 Coordinador Regional + 2 Consultores", "Zona Bajío: 1 Coordinador Regional", "Meta: 12 clientes"] },
    { q: "Q2 2026", title: "Expansión", items: ["Norte: +1 Consultor (3 total)", "Bajío: +2 Consultores", "Centro: 1 Coordinador Regional", "Meta: 24 clientes acumulados"] },
    { q: "Q3 2026", title: "Consolidación", items: ["Centro: +3 Consultores", "Sur-Sureste: 1 Coordinador Regional + 1 Consultor", "Meta: 48 clientes acumulados"] },
    { q: "Q4 2026", title: "Escala completa", items: ["Sur-Sureste: +2 Consultores", "Todas las zonas activas", "Meta: 72 clientes activos"] },
  ];

  return (
    <SlideWrapper className="bg-[#faf8f4]" id="plan">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-bold text-[#f28023] uppercase tracking-widest">Plan de crecimiento 2026</span>
          <h2 className="font-serif text-4xl md:text-5xl text-gray-900 mt-3 mb-4">
            4 zonas × 4 socios = 16 socios activos
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Meta de la cooperativa: 1 Coordinador Regional + 3 Consultores por zona. El plan supone que cada consultor incorpora 6 empresas al año para llegar a 72 clientes activos al cierre de 2026.
          </p>
          <p className="text-xs text-gray-400 max-w-2xl mx-auto mt-4 leading-relaxed" data-testid="nota-plan-meta">
            Son <strong>metas de plan, no resultados ni compromisos</strong>. Hay <strong>un Coordinador Regional por zona, máximo cuatro en el país</strong>: es un puesto que <strong>asigna la cooperativa</strong> y es <strong>revocable</strong> — no se gana reclutando gente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={16} className="text-[#1b5adf]" />
              Estructura por zona
            </h3>
            <div className="space-y-3" data-testid="estructura-zonas">
              {["Norte", "Bajío", "Centro", "Sur-Sureste"].map((zona) => (
                <div key={zona} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <MapPin size={16} className="text-[#1b5adf] flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900">{zona}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="text-[10px] bg-[#7c3aed] text-white px-2 py-0.5 rounded-full font-bold">1 Coord</span>
                    <span className="text-[10px] bg-[#1b5adf] text-white px-2 py-0.5 rounded-full font-bold">3 Cons</span>
                  </div>
                  <span className="text-xs text-gray-400">= 18 clientes</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#7c3aed]">4 Coordinadores</span>
                  <span className="text-sm font-bold text-[#1b5adf]">12 Consultores</span>
                  <span className="text-sm font-bold text-[#00b87a]">72 clientes</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-[#f28023]" />
              Timeline de incorporación
            </h3>
            <div className="space-y-0" data-testid="timeline">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1b5adf] to-[#7c3aed] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 z-10">{t.q.slice(0, 2)}</div>
                    {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-[#1b5adf]/15 my-1" />}
                  </div>
                  <div className="pb-5">
                    <p className="text-sm font-bold text-gray-900">{t.q} — {t.title}</p>
                    <ul className="mt-1 space-y-0.5">
                      {t.items.map((item, j) => (
                        <li key={j} className="text-xs text-gray-500 flex items-start gap-1.5">
                          <span className="text-[#1b5adf] mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}

function SlideBonos() {
  return (
    <SlideWrapper className="bg-white" id="bonos">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-[#00b87a] uppercase tracking-widest">Esquema de bonos</span>
          <h2 className="font-serif text-4xl md:text-5xl text-gray-900 mt-3 mb-4">
            Anticipos y bonos por tu propia operación
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Cada socio recibe en proporción a las empresas que él mismo lleva. Ningún socio recibe un porcentaje de lo que operan otros socios, y en la cooperativa 1 socio = 1 voto.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { title: "Anticipo de rendimientos", desc: "Anticipo mensual del fee de administración por cada empresa activa de tu propia cartera", items: ["1-3 empresas: 25% del fee", "4-7 empresas: 30% del fee", "8+ empresas: 35% del fee"], color: "#1b5adf", icon: DollarSign },
            { title: "Bono de referido", desc: "Pago único cuando una empresa que referiste se activa", items: [`$${BONO_REFERIDO} por empresa referida (Consultor)`, "Se paga al primer pago de la empresa"], color: "#f28023", icon: Star },
            { title: "Certificaciones", desc: "Participación por cada DC-3 y certificado SEP tramitado", items: [`${DC3_SHARE * 100}% del DC-3 ($${DC3_PRICE})`, `${SEP_SHARE * 100}% del certificado SEP ($${SEP_PRICE})`], color: "#7c3aed", icon: Award },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl border p-5 bg-gray-50/50" style={{ borderColor: c.color + "30" }} data-testid={`card-bono-${i}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: c.color + "15" }}>
                <c.icon size={20} style={{ color: c.color }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">{c.title}</h3>
              <p className="text-xs text-gray-400 mb-3">{c.desc}</p>
              <ul className="space-y-1.5">
                {c.items.map((item, j) => (
                  <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span style={{ color: c.color }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#00b87a]/30 bg-gray-50/50 p-6 mt-5" data-testid="card-bono-regional">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#00b87a15" }}>
              <MapPin size={20} style={{ color: "#00b87a" }} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Bono por Crecimiento Regional — Coordinador Regional</h3>
              <p className="text-xs text-gray-400">Un puesto que asigna la cooperativa, no un nivel por encima de nadie</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-gray-600 leading-relaxed mb-2">
                Hay <strong>un Coordinador Regional por zona (máximo cuatro)</strong>. El puesto lo <strong>asigna la cooperativa</strong> y es <strong>revocable</strong>: no se gana reclutando gente. Sus funciones son capacitar, dar soporte, abrir plaza por zona, promover el cooperativismo y la economía solidaria, dar conferencias, ayudar en el onboarding de empresas y acompañar a las comisiones mixtas de capacitación a registrar sus actas ante la STPS.
              </p>
              <ul className="space-y-1.5">
                <li className="text-xs text-gray-600 flex items-start gap-1.5"><span style={{ color: "#00b87a" }}>✓</span> <span><strong>Cuota fija</strong> por desempeñar la función</span></li>
                <li className="text-xs text-gray-600 flex items-start gap-1.5"><span style={{ color: "#00b87a" }}>✓</span> <span><strong>Variable</strong> por metas de zona</span></li>
                <li className="text-xs text-gray-600 flex items-start gap-1.5"><span style={{ color: "#00b87a" }}>✓</span> <span>Se paga por el <strong>servicio prestado</strong>, no por las operaciones de otros socios. <strong>No hay cascada ni niveles debajo.</strong></span></li>
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">Montos por definir por la Asamblea</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  La cuota fija y las metas de zona <strong>todavía no están definidas</strong>. Los determinará la Asamblea General.
                  No publicamos cifras estimadas de este bono porque hoy no existen, y por eso <strong>tampoco entra en el simulador</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mt-5 text-center max-w-3xl mx-auto leading-relaxed" data-testid="nota-bonos-asamblea">
          Todos estos porcentajes se calculan sobre la <strong>operación propia</strong> de cada socio. {NOTA_ASAMBLEA}
        </p>
      </div>
    </SlideWrapper>
  );
}

function SlideProyeccion({ data, isLoading }: { data: MercadoData | undefined; isLoading?: boolean }) {
  const [numEmpresas, setNumEmpresas] = useState(6);
  const [avgEmpleados, setAvgEmpleados] = useState(30);
  const [plan, setPlan] = useState<string>("Transforma");
  const [consultoresPorZona, setConsultoresPorZona] = useState(3);
  const [dc3Pct, setDc3Pct] = useState(40);

  const cfg = PLANS[plan] || PLANS.Transforma;
  const feePorEmpresa = avgEmpleados * cfg.umas * UMA * cfg.feePct;
  const anticipoPct = getAnticipoPct(numEmpresas);

  const ZONE_NAMES = ["Norte", "Bajío", "Centro", "Sur-Sureste"];
  const zoneColors: Record<string, string> = {
    Norte: "#1b5adf", Bajío: "#f28023", Centro: "#7c3aed", "Sur-Sureste": "#00b87a",
  };

  // Los anticipos de una zona son la SUMA de la operación propia de cada socio
  // de esa zona, y nada más. Aquí se sumaba además un 5% del fee de toda la
  // zona para la figura que encabezaba el nivel superior: ese mecanismo
  // multinivel se eliminó por incompatible con una cooperativa de consumo
  // (nadie cobra por la producción de otro socio).
  const zoneData = ZONE_NAMES.map(zona => {
    const dbZone = data?.zonas?.find(z => z.zona === zona);
    const clientesZona = consultoresPorZona * numEmpresas;
    const feeMensualZona = feePorEmpresa * clientesZona;
    const anticiposMensualesZona = feePorEmpresa * anticipoPct * numEmpresas * consultoresPorZona;
    return {
      zona,
      empresasDB: dbZone?.empresas || 0,
      perfiladas: dbZone?.con_plan || 0,
      clientes: clientesZona,
      feeMensual: feeMensualZona,
      anticiposMensuales: anticiposMensualesZona,
    };
  });

  const totalSocios = ZONE_NAMES.length * (1 + consultoresPorZona);
  const totalClientes = zoneData.reduce((s, z) => s + z.clientes, 0);
  const totalFeeMensual = zoneData.reduce((s, z) => s + z.feeMensual, 0);
  const totalAnticiposMensuales = zoneData.reduce((s, z) => s + z.anticiposMensuales, 0);

  // Solo se modela la operación PROPIA del socio, con los mismos parámetros que
  // /socios. El Bono por Crecimiento Regional del Coordinador no se simula:
  // sus montos aún no existen y no se inventan.
  const anticipoConsultor = feePorEmpresa * anticipoPct * numEmpresas;
  const referidoConsultor = BONO_REFERIDO * numEmpresas;
  const empsConsultor = avgEmpleados * numEmpresas;
  const dc3Consultor = Math.floor(empsConsultor * dc3Pct / 100) * (DC3_PRICE * DC3_SHARE);
  const sepConsultor = Math.floor(empsConsultor * (dc3Pct / 100) * SEP_SOBRE_DC3) * (SEP_PRICE * SEP_SHARE);
  const anualConsultor = (anticipoConsultor * 12) + referidoConsultor + dc3Consultor + sepConsultor;

  const proyeccion = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const clientesMes = Math.min(Math.round((totalClientes / 12) * mes), totalClientes);
    const feeMes = feePorEmpresa * clientesMes;
    const acumulado = Array.from({ length: mes }, (_, j) => {
      const cj = Math.min(Math.round((totalClientes / 12) * (j + 1)), totalClientes);
      return feePorEmpresa * cj;
    }).reduce((a, b) => a + b, 0);
    return { mes, clientes: clientesMes, fee: feeMes, acumulado };
  });
  const maxAcum = Math.max(...proyeccion.map(p => p.acumulado), 1);

  return (
    <SlideWrapper className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" id="proyeccion">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-[#00b87a] uppercase tracking-widest">Simulador</span>
          <h2 className="font-serif text-4xl md:text-5xl text-white mt-3 mb-4">
            Simula la operación por zona
          </h2>
          <p className="text-base text-gray-400 max-w-2xl mx-auto">
            Mueve los controles con tus propios supuestos y mira qué resultaría para la red de socios. Las cifras de mercado por zona sí son reales (DENUE); los escenarios son tuyos.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 flex gap-3 max-w-3xl mx-auto mb-8" data-testid="aviso-simulacion">
          <Info size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-100/90 leading-relaxed space-y-1.5">
            <p>
              <strong>Esto es una simulación, no una promesa de ingresos.</strong> Los resultados salen únicamente de los supuestos que tú eliges
              (cuántas empresas, de qué tamaño, cuántas personas certifican). Nadie garantiza que un socio refiera una sola empresa, ni que las que refiera permanezcan activas.
            </p>
            <p>{NOTA_ASAMBLEA}</p>
            <p>
              Solo se modela la <strong>operación propia</strong> de cada socio. El Bono por Crecimiento Regional del Coordinador no se simula: sus montos aún no existen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 space-y-5" data-testid="proyeccion-controls">
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 block">Plan</label>
              <div className="flex gap-2">
                {Object.entries(PLANS).map(([k, p]) => (
                  <button
                    key={k}
                    onClick={() => setPlan(k)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${plan === k ? "text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                    style={plan === k ? { backgroundColor: p.color } : {}}
                    data-testid={`btn-plan-${k}`}
                  >
                    {p.label}
                    <span className="block text-[9px] opacity-60 mt-0.5">{p.range}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 flex justify-between">
                <span>Empleados promedio/empresa</span>
                <span className="text-[#1b5adf]">{avgEmpleados}</span>
              </label>
              <input type="range" min={5} max={300} step={5} value={avgEmpleados} onChange={e => setAvgEmpleados(+e.target.value)} className="w-full accent-[#1b5adf]" data-testid="slider-empleados" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 flex justify-between">
                <span>Empresas por consultor/año</span>
                <span className="text-[#1b5adf]">{numEmpresas}</span>
              </label>
              <input type="range" min={1} max={15} value={numEmpresas} onChange={e => setNumEmpresas(+e.target.value)} className="w-full accent-[#1b5adf]" data-testid="slider-empresas" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 flex justify-between">
                <span>Consultores por zona</span>
                <span className="text-[#1b5adf]">{consultoresPorZona}</span>
              </label>
              <input type="range" min={1} max={5} value={consultoresPorZona} onChange={e => setConsultoresPorZona(+e.target.value)} className="w-full accent-[#1b5adf]" data-testid="slider-consultores" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 flex justify-between">
                <span>% que compra DC-3</span>
                <span className="text-[#1b5adf]">{dc3Pct}%</span>
              </label>
              <input type="range" min={0} max={100} value={dc3Pct} onChange={e => setDc3Pct(+e.target.value)} className="w-full accent-[#1b5adf]" data-testid="slider-dc3" />
            </div>

            <div className="text-[10px] text-gray-600 border-t border-white/10 pt-3">
              <p>UMA 2026 = ${UMA} · Fee {cfg.label}: {(cfg.feePct * 100)}% · {cfg.umas} UMAs/col</p>
              <p>Anticipo: {(anticipoPct * 100)}% del fee ({numEmpresas <= 3 ? "1-3 emp" : numEmpresas <= 7 ? "4-7 emp" : "8+ emp"})</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Socios activos", value: String(totalSocios), sub: `${ZONE_NAMES.length} zonas × (1 Coord + ${consultoresPorZona} Cons)`, color: "#7c3aed" },
                { label: "Clientes del escenario", value: String(totalClientes), sub: `${ZONE_NAMES.length} × ${consultoresPorZona} × ${numEmpresas} emp`, color: "#1b5adf" },
                { label: "Fee mensual total", value: fmt(totalFeeMensual), sub: "Toda la red", color: "#00b87a" },
                { label: "Anticipos mensuales", value: fmt(totalAnticiposMensuales), sub: "Suma de la operación propia de cada socio", color: "#f28023" },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10 text-center" data-testid={`proj-stat-${i}`}>
                  <p className="text-2xl md:text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  <p className="text-[9px] text-gray-600 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 pt-4 pb-2">
                <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <MapPin size={14} className="text-[#1b5adf]" />
                  Desglose por zona — datos reales de mercado
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" data-testid="table-zonas-proyeccion">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500">
                      <th className="text-left py-2.5 px-5 font-semibold">Zona</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Empresas identificadas</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Perfiladas</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Clientes del escenario</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Fee mensual</th>
                      <th className="text-right py-2.5 px-5 font-semibold">Anticipos/mes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zoneData.map((z) => (
                      <tr key={z.zona} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        <td className="py-3 px-5 font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: zoneColors[z.zona] }} />
                          <span className="text-white">{z.zona}</span>
                        </td>
                        <td className="py-3 px-3 text-right text-gray-400">{isLoading ? <span className="inline-block w-10 h-3 bg-white/10 rounded animate-pulse" /> : fmtK(z.empresasDB)}</td>
                        <td className="py-3 px-3 text-right text-gray-400">{isLoading ? <span className="inline-block w-10 h-3 bg-white/10 rounded animate-pulse" /> : fmtK(z.perfiladas)}</td>
                        <td className="py-3 px-3 text-right font-bold" style={{ color: zoneColors[z.zona] }}>{z.clientes}</td>
                        <td className="py-3 px-3 text-right text-gray-300">{fmt(z.feeMensual)}</td>
                        <td className="py-3 px-5 text-right font-bold text-[#00b87a]">{fmt(z.anticiposMensuales)}</td>
                      </tr>
                    ))}
                    <tr className="bg-white/[0.04]">
                      <td className="py-3 px-5 font-bold text-white">Total red</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-300">{isLoading ? <span className="inline-block w-10 h-3 bg-white/10 rounded animate-pulse" /> : fmtK(zoneData.reduce((s, z) => s + z.empresasDB, 0))}</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-300">{isLoading ? <span className="inline-block w-10 h-3 bg-white/10 rounded animate-pulse" /> : fmtK(zoneData.reduce((s, z) => s + z.perfiladas, 0))}</td>
                      <td className="py-3 px-3 text-right font-bold text-white">{totalClientes}</td>
                      <td className="py-3 px-3 text-right font-bold text-white">{fmt(totalFeeMensual)}</td>
                      <td className="py-3 px-5 text-right font-bold text-[#00b87a]">{fmt(totalAnticiposMensuales)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {data && zoneData[0].empresasDB > 0 && (
                <p className="text-[10px] text-gray-600 px-5 py-2">
                  Penetración proyectada: {totalClientes} clientes de {fmtK(zoneData.reduce((s, z) => s + z.empresasDB, 0))} empresas identificadas = {((totalClientes / zoneData.reduce((s, z) => s + z.empresasDB, 0)) * 100).toFixed(4)}%
                </p>
              )}
            </div>

            {data?.estados && data.estados.length > 0 && (
              <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
                <h4 className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-2">
                  <MapPin size={14} className="text-[#1b5adf]" />
                  Mapa de la República — Cobertura por zona
                </h4>
                <p className="text-xs text-gray-500 mb-4">Haz clic en una zona para ver qué estados la conforman. Pasa el cursor sobre un estado para ver sus datos.</p>
                <MexicoMap estados={data.estados} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10" data-testid="desglose-consultor">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1b5adf]/20 flex items-center justify-center">
                    <Briefcase size={16} className="text-[#1b5adf]" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Consultor</h4>
                  <span className="text-[10px] text-gray-500 ml-auto">{numEmpresas} empresas propias</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-400">Anticipo de rendimientos mensual</span><span className="text-[#00b87a] font-bold">{fmt(anticipoConsultor)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Bono de referido (anual)</span><span className="text-[#f28023] font-bold">{fmt(referidoConsultor)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">DC-3 ({dc3Pct}%)</span><span className="text-[#7c3aed] font-bold">{fmt(dc3Consultor)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">SEP</span><span className="text-[#7c3aed] font-bold">{fmt(sepConsultor)}</span></div>
                  <div className="flex justify-between border-t border-white/10 pt-2">
                    <span className="text-white font-bold">Total anual del escenario</span>
                    <span className="text-white font-bold text-base">{fmt(anualConsultor)}</span>
                  </div>
                  <p className="text-[9px] text-gray-500 leading-relaxed pt-1">
                    Resultado de tus supuestos, no un ingreso prometido. Supone que las {numEmpresas} {numEmpresas === 1 ? "empresa permanece activa" : "empresas permanecen activas"} los 12 meses
                    y que 1 de cada 10 personas que tramita su DC-3 tramita también el SEP.
                  </p>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10" data-testid="desglose-coordinador">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center">
                    <MapPin size={16} className="text-[#7c3aed]" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Coordinador Regional</h4>
                  <span className="text-[10px] text-gray-500 ml-auto">1 por zona · asignado</span>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="text-gray-400 leading-relaxed">
                    Puesto <strong className="text-gray-300">asignado por la cooperativa</strong> y revocable — no se gana reclutando.
                    Además de su propia cartera (que se calcula igual que la de un Consultor), recibe un <strong className="text-gray-300">Bono por Crecimiento Regional</strong>: cuota fija por la función + variable por metas de zona.
                  </p>
                  <div className="flex justify-between border-t border-white/10 pt-2">
                    <span className="text-gray-400">Cuota fija por la función</span>
                    <span className="text-amber-300 font-bold">Por definir</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Variable por metas de zona</span>
                    <span className="text-amber-300 font-bold">Por definir</span>
                  </div>
                  <p className="text-[9px] text-gray-500 leading-relaxed pt-1">
                    Los montos los fijará la Asamblea General. No los estimamos aquí porque hoy no existen, y por eso este bono no entra en el simulador.
                    No es una tajada de las operaciones de otros socios: no hay cascada ni niveles debajo.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <h4 className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#1b5adf]" />
                Proyección fee mensual acumulado — 12 meses
              </h4>
              <p className="text-xs text-gray-500 mb-4">{totalClientes} clientes totales ({ZONE_NAMES.length} zonas × {consultoresPorZona} consultores × {numEmpresas} empresas)</p>
              <div className="flex items-end gap-1 h-44" data-testid="chart-proyeccion">
                {proyeccion.map((p) => (
                  <div key={p.mes} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-gray-500 font-semibold">{fmtK(p.acumulado)}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-[#1b5adf] to-[#7c3aed] transition-all duration-500"
                      style={{ height: `${Math.max((p.acumulado / maxAcum) * 140, 4)}px` }}
                    />
                    <span className="text-[9px] text-gray-500">M{p.mes}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}

function SlideCTA() {
  return (
    <SlideWrapper className="bg-gradient-to-br from-[#1b5adf] to-[#7c3aed] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-30" />
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur mx-auto mb-8 flex items-center justify-center">
          <Zap size={36} className="text-white" />
        </div>
        <h2 className="font-serif text-4xl md:text-6xl text-white mb-6" data-testid="heading-cta">
          ¿Listo para construir tu negocio?
        </h2>
        <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
          Súmate como socio comercial a la cooperativa Ceduverse y empieza a construir tu propia cartera de empresas.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/socios"
            className="inline-flex items-center gap-2 bg-white text-[#1b5adf] font-bold px-8 py-4 rounded-xl text-lg hover:bg-gray-100 transition-colors no-underline shadow-lg"
            data-testid="button-cta-socios"
          >
            Quiero ser Socio <ArrowRight size={20} />
          </Link>
          <a
            href="mailto:socios@ceduverse.org"
            className="text-white/80 hover:text-white text-sm underline underline-offset-4 transition-colors"
            data-testid="link-cta-email"
          >
            O escríbenos a socios@ceduverse.org
          </a>
        </div>
      </div>
    </SlideWrapper>
  );
}

export default function PropuestaPage() {
  useForceLightMode();

  const { data, isLoading, isError } = useQuery<MercadoData>({
    queryKey: ["/api/propuesta/mercado"],
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const { activeIdx } = useIntersectionObserver();
  const labels = ["Portada", "Problema", "Solución", "Mercado", "Modelo", "Plan 2026", "Bonos", "Simulador", "Contacto"];

  return (
    <div className="bg-[#faf8f4]">
      <PropNav />
      <NavDots activeIdx={activeIdx} labels={labels} />
      <SlidePortada />
      <SlideProblema />
      <SlideSolucion />
      <SlideMercado data={data} isLoading={isLoading} isError={isError} />
      <SlideModelo />
      <SlidePlanComercial />
      <SlideBonos />
      <SlideProyeccion data={data} isLoading={isLoading} />
      <SlideCTA />
    </div>
  );
}
