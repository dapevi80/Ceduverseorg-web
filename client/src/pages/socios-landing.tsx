import { useState, useEffect, useRef } from "react";
import { useForceLightMode } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ZONA_POR_ESTADO, ZONAS, ESTADOS_POR_ZONA, nombreCortoEstado } from "@shared/zonas";
import { CERT_PRICES_MXN } from "@shared/cert-pricing";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Repeat,
  LayoutDashboard,
  Brain,
  ShieldCheck,
  UserPlus,
  Link2,
  Building2,
  Wallet,
  BookOpen,
  Library,
  ArrowRight,
  Menu,
  X,
  MapPin,
  Info,
  GraduationCap,
  Megaphone,
  FileCheck2,
  LifeBuoy,
} from "lucide-react";

const UMA_VALUE = 113.14;

// Etiqueta de honestidad que acompaña a todo parámetro de bonos en esta página.
// Debe decir lo mismo que los cursos de onboarding: el Reglamento Interno sigue
// en borrador y sin efectos jurídicos, así que esto es política PROPUESTA.
const NOTA_ASAMBLEA =
  "Política propuesta, sujeta a ratificación o ajuste por la Asamblea General. El Reglamento Interno está en borrador y no tiene efectos jurídicos: estos parámetros no son una regla vigente ni un compromiso en firme.";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let frame: number;
    const duration = 1500;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isInView, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString("es-MX")}{suffix}</span>;
}

function NavBar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]" data-testid="nav-socios">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline" data-testid="link-socios-logo">
          <div className="w-8 h-8 bg-[#1b5adf] rounded-[10px] flex items-center justify-center text-white font-serif text-lg">C</div>
          <span className="font-serif text-xl text-gray-900 tracking-tight" translate="no">Cedu<em className="text-[#1b5adf] not-italic">verse</em></span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <a href="#como-funciona" className="text-sm text-gray-600 hover:text-gray-900 no-underline" data-testid="link-como-funciona">Cómo funciona</a>
          <a href="#zonas" className="text-sm text-gray-600 hover:text-gray-900 no-underline" data-testid="link-zonas">Zonas</a>
          <a href="#bonos" className="text-sm text-gray-600 hover:text-gray-900 no-underline" data-testid="link-bonos">Bonos</a>
          <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 no-underline" data-testid="link-faq">FAQ</a>
          <a href="#registro">
            <Button className="bg-[#1b5adf] hover:bg-blue-700 text-white rounded-lg px-5" data-testid="button-nav-registro">
              Ser Socio
            </Button>
          </a>
        </div>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} data-testid="button-mobile-menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-black/[0.06] bg-white px-4 py-3 space-y-2">
          <a href="#como-funciona" className="block py-2 text-sm text-gray-700 no-underline" onClick={() => setOpen(false)}>Cómo funciona</a>
          <a href="#zonas" className="block py-2 text-sm text-gray-700 no-underline" onClick={() => setOpen(false)}>Zonas</a>
          <a href="#bonos" className="block py-2 text-sm text-gray-700 no-underline" onClick={() => setOpen(false)}>Bonos</a>
          <a href="#faq" className="block py-2 text-sm text-gray-700 no-underline" onClick={() => setOpen(false)}>FAQ</a>
          <a href="#registro" onClick={() => setOpen(false)}>
            <Button className="w-full bg-[#1b5adf] hover:bg-blue-700 text-white">Ser Socio</Button>
          </a>
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1b5adf] via-[#7c3aed] to-[#f28023]" data-testid="section-hero">
      <div className="absolute top-10 right-10 w-64 h-64 bg-[#7c3aed]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#f28023]/10 rounded-full blur-3xl" />
      <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp}>
            <Badge className="bg-white/20 text-white border-white/30 mb-6 text-sm px-4 py-1.5">Programa de Socios Comerciales</Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-6">
            Haz de la capacitación laboral tu actividad como socio
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed">
            Súmate como socio comercial a la cooperativa Ceduverse. Recibes un anticipo de rendimientos por las empresas que tú mismo llevas a la plataforma de capacitación con IA — en proporción a tu propia operación, como manda una cooperativa de consumo.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#registro">
              <Button size="lg" className="bg-white text-[#1b5adf] hover:bg-gray-100 font-bold rounded-lg px-8 py-6 text-base" data-testid="button-hero-registro">
                Quiero ser Socio <ArrowRight size={18} className="ml-2" />
              </Button>
            </a>
            <a href="#bonos" className="text-white/80 hover:text-white text-sm underline underline-offset-4 no-underline" data-testid="link-hero-bonos">
              Ver el esquema de bonos ↓
            </a>
          </motion.div>
        </motion.div>
      </div>
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "1,066", label: "cursos disponibles" },
            { value: "3", label: "certificaciones oficiales" },
            { value: "4", label: "zonas comerciales" },
          ].map((stat, i) => (
            <div key={i} className="text-center bg-white/10 backdrop-blur rounded-xl py-4 px-3">
              <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/70 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PropuestaValor() {
  const cards = [
    { icon: Repeat, color: "bg-[#1b5adf]", title: "Anticipo de rendimientos recurrente", desc: "Mientras la empresa que tú llevaste siga activa, tu operación sigue generando anticipo mes con mes. No es una venta única. Los parámetros los ratifica la Asamblea." },
    { icon: LayoutDashboard, color: "bg-[#7c3aed]", title: "Panel de socio", desc: "Panel propio con estadísticas de referidos, anticipos acumulados, organizaciones creadas y progreso de equipos." },
    { icon: Brain, color: "bg-[#f28023]", title: "Producto que se vende solo", desc: "Tutor IA que personaliza cada curso al puesto del trabajador en 15 segundos. Tus prospectos lo ven y se convencen." },
    { icon: ShieldCheck, color: "bg-[#00b87a]", title: "Certificación con validez real", desc: "DC-3 STPS oficial + certificado SEP vía INEC + diploma NFT blockchain. No es un diploma de Canva." },
  ];

  return (
    <section className="py-20 bg-[#faf8f4]" data-testid="section-propuesta">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">¿Por qué ser socio de Ceduverse?</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 max-w-lg mx-auto">Cuatro razones por las que nuestros socios crecen cada mes</motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {cards.map((c, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full" data-testid={`card-propuesta-${i}`}>
                <CardContent className="pt-6 pb-5">
                  <div className={`w-12 h-12 ${c.color} rounded-xl flex items-center justify-center mb-4`}>
                    <c.icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-serif text-lg text-gray-900 mb-2">{c.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{c.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ComoFunciona() {
  const steps = [
    { icon: UserPlus, title: "Regístrate como socio", desc: "Llena el formulario y recibe tu cuenta de socio con acceso al panel y a las herramientas de difusión." },
    { icon: Link2, title: "Obtén tu código de referido", desc: "Código único que rastrea automáticamente cada empresa que refieras." },
    { icon: Building2, title: "Refiere empresas", desc: "Comparte tu código con empresas que necesiten capacitar. Haz demos del Tutor IA." },
    { icon: Wallet, title: "Recibe tu anticipo", desc: "Anticipo de rendimientos mensual por tu propia operación, mientras la empresa esté activa en la plataforma." },
  ];

  return (
    <section id="como-funciona" className="py-20 bg-white" data-testid="section-como-funciona">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">Cómo empiezas, en 4 pasos</motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="space-y-0">
          {steps.map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="flex gap-5 items-start relative">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-12 h-12 bg-[#1b5adf] rounded-full flex items-center justify-center text-white font-bold text-lg z-10">{i + 1}</div>
                {i < steps.length - 1 && <div className="w-0.5 h-16 bg-[#1b5adf]/20" />}
              </div>
              <div className="pb-10">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon size={18} className="text-[#1b5adf]" />
                  <h3 className="font-serif text-lg text-gray-900">{s.title}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

interface MercadoEstado {
  estado: string;
  empresas: number;
  con_plan: number;
  empleados: number;
}
interface MercadoData {
  estados: MercadoEstado[];
}

const ZONA_COLORS: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  Norte: { dot: "bg-[#1b5adf]", text: "text-[#1b5adf]", bg: "bg-[#1b5adf]/5", border: "border-[#1b5adf]/20" },
  "Bajío": { dot: "bg-[#f28023]", text: "text-[#f28023]", bg: "bg-[#f28023]/5", border: "border-[#f28023]/20" },
  Centro: { dot: "bg-[#7c3aed]", text: "text-[#7c3aed]", bg: "bg-[#7c3aed]/5", border: "border-[#7c3aed]/20" },
  "Sur-Sureste": { dot: "bg-[#00b87a]", text: "text-[#00b87a]", bg: "bg-[#00b87a]/5", border: "border-[#00b87a]/20" },
};

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + "K";
  return n.toLocaleString("es-MX");
}

function ZonasSection() {
  // Datos reales del DENUE (INEGI) ya cargados en la base de prospección.
  // Endpoint público, el mismo que consume /propuesta. Si falla, NO inventamos
  // cifras: se muestran las zonas y sus estados sin números.
  const { data, isError } = useQuery<MercadoData>({
    queryKey: ["/api/propuesta/mercado"],
    staleTime: 30 * 60 * 1000,
  });

  // Agregamos por zona usando ZONA_POR_ESTADO (@shared/zonas), la misma fuente
  // que usa el CRM, en vez del campo `zona` que devuelve el endpoint: así la
  // zona que ve un prospecto aquí es exactamente la que opera el coordinador.
  const porZona = new Map<string, { empresas: number; empleados: number }>();
  let huboDatos = false;
  if (data?.estados?.length) {
    for (const e of data.estados) {
      const zona = ZONA_POR_ESTADO[e.estado];
      if (!zona) continue;
      const acc = porZona.get(zona) ?? { empresas: 0, empleados: 0 };
      acc.empresas += e.empresas ?? 0;
      acc.empleados += e.empleados ?? 0;
      porZona.set(zona, acc);
      huboDatos = true;
    }
  }

  return (
    <section id="zonas" className="py-20 bg-white" data-testid="section-zonas">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-12">
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">Las 4 zonas comerciales</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
            La República se organiza en cuatro zonas que cubren los 32 estados. Es la misma división con la que opera el CRM de la cooperativa.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {ZONAS.map(zona => {
            const c = ZONA_COLORS[zona];
            const agg = porZona.get(zona);
            const estados = ESTADOS_POR_ZONA[zona] ?? [];
            return (
              <motion.div key={zona} variants={fadeUp}>
                <Card className={`rounded-xl border ${c.border} ${c.bg} h-full`} data-testid={`card-zona-${zona}`}>
                  <CardContent className="pt-6 pb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-3 h-3 rounded-full ${c.dot} flex-shrink-0`} />
                      <h3 className="font-serif text-lg text-gray-900">{zona}</h3>
                      <span className="text-xs text-gray-400 ml-auto">{estados.length} estados</span>
                    </div>

                    {agg ? (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <p className={`text-2xl font-bold ${c.text}`} data-testid={`zona-empresas-${zona}`}>{fmtCompact(agg.empresas)}</p>
                          <p className="text-[11px] text-gray-500 leading-tight">empresas en la base DENUE</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-700">{fmtCompact(agg.empleados)}</p>
                          <p className="text-[11px] text-gray-500 leading-tight">personas empleadas (est. INEGI)</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 mb-4" data-testid={`zona-sin-datos-${zona}`}>
                        {isError ? "No pudimos cargar las cifras del DENUE en este momento." : "Cargando cifras del DENUE…"}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {estados.map(e => (
                        <span key={e} className="inline-block px-2 py-0.5 rounded bg-white/70 border border-gray-200 text-[10px] font-medium text-gray-600">
                          {nombreCortoEstado(e)}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {huboDatos && (
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-[11px] text-gray-400 mt-5 text-center max-w-2xl mx-auto leading-relaxed"
            data-testid="text-denue-fuente"
          >
            Fuente: Directorio Estadístico Nacional de Unidades Económicas (DENUE) del INEGI, tal como está cargado hoy en la base de prospección de la cooperativa.
            Son empresas <strong>susceptibles de ser contactadas</strong> — no son clientes de Ceduverse ni ventas asignadas a nadie.
          </motion.p>
        )}
      </div>
    </section>
  );
}

function CoordinadorRegional() {
  const funciones = [
    { icon: GraduationCap, title: "Capacita", desc: "Forma a los socios de su zona en el uso de la plataforma y en el modelo cooperativo." },
    { icon: LifeBuoy, title: "Da soporte", desc: "Es el primer punto de contacto de los socios y las empresas de su zona." },
    { icon: MapPin, title: "Abre plaza", desc: "Desarrolla la presencia de la cooperativa en los estados de su zona." },
    { icon: Megaphone, title: "Promueve el cooperativismo", desc: "Difunde el cooperativismo y la economía solidaria — objeto propio de la LGSC — y da conferencias." },
    { icon: Building2, title: "Acompaña el onboarding", desc: "Ayuda a las empresas de su zona a incorporarse a la plataforma." },
    { icon: FileCheck2, title: "Acompaña ante la STPS", desc: "Acompaña a las comisiones mixtas de capacitación a registrar sus actas ante la STPS." },
  ];

  return (
    <section className="py-20 bg-[#faf8f4]" data-testid="section-coordinador">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-12">
          <motion.div variants={fadeUp}>
            <Badge className="bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/20 mb-4">Un puesto, no un nivel</Badge>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">Coordinador Regional</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
            Hay <strong>un Coordinador Regional por zona — máximo cuatro en todo el país</strong>. Es un puesto que <strong>asigna la cooperativa</strong> y que es <strong>revocable</strong>: no se gana reclutando gente ni se hereda. Se ocupa mientras se cumplan las funciones.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {funciones.map((f, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card className="bg-white rounded-xl border border-gray-200 shadow-sm h-full" data-testid={`card-funcion-${i}`}>
                <CardContent className="pt-5 pb-4">
                  <f.icon size={20} className="text-[#7c3aed] mb-2" />
                  <h3 className="font-semibold text-sm text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm" data-testid="card-bono-regional">
            <CardContent className="pt-6 pb-5">
              <h3 className="font-serif text-lg text-gray-900 mb-3">Bono por Crecimiento Regional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    El coordinador recibe un <strong>bono por crecimiento regional</strong> con dos componentes:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2">
                      <span className="text-[#7c3aed] font-bold flex-shrink-0">1.</span>
                      <span><strong>Cuota fija</strong> por desempeñar la función.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#7c3aed] font-bold flex-shrink-0">2.</span>
                      <span><strong>Variable</strong> por metas de zona.</span>
                    </li>
                  </ul>
                  <p className="text-xs text-gray-500 leading-relaxed mt-3">
                    Es el pago por un <strong>servicio efectivamente prestado</strong> a la cooperativa — no es una tajada de las operaciones de otros socios. <strong>No hay cascada ni niveles debajo</strong>: el bono se paga por la función, y ahí termina.
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">Montos por definir por la Asamblea</p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      La cuota fija y las metas de zona <strong>todavía no están definidas</strong>. Los determinará la Asamblea General.
                      No publicamos cifras estimadas de este bono porque hoy no existen, y por eso <strong>tampoco entra en la calculadora</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function SimuladorRendimientos() {
  const [cols, setCols] = useState(30);
  const [plan, setPlan] = useState<"impulsa" | "transforma" | "lidera">("transforma");
  const [tipoSocio, setTipoSocio] = useState<"trabajador" | "instructor" | "agente" | "consultor">("consultor");
  const [empresas, setEmpresas] = useState(3);
  const [dc3Pct, setDc3Pct] = useState(40);

  const plans = {
    impulsa: { umas: 6, fee: 0.20, label: "Impulsa", range: "1–10 colaboradores", desc: "6 UMAs/colaborador/mes. Ideal para negocios pequeños. Incluye Conferencias Ceduverse, Tutor IA, Academy y 5% desc. en certificaciones." },
    transforma: { umas: 10, fee: 0.13, label: "Transforma", range: "11–99 colaboradores", desc: "10 UMAs/colaborador/mes. Para PyMEs en crecimiento. Incluye Conferencias Ceduverse, Tutor IA, Academy y 10% desc. en certificaciones." },
    lidera: { umas: 20, fee: 0.10, label: "Lidera", range: "100–500 colaboradores", desc: "20 UMAs/colaborador/mes. Para empresas grandes. Incluye Conferencias Ceduverse, Tutor IA, Academy y 15% desc. en certificaciones." },
  };

  // Precios desde la fuente ÚNICA de verdad (@shared/cert-pricing), la misma que
  // el servidor usa para cobrar. Antes estaban hardcodeados aquí en 399 mientras
  // el checkout cobraba 499: la página pública anunciaba un precio y el cobro
  // real era otro. No volver a escribir el número a mano.
  const DC3_PRICE = CERT_PRICES_MXN.dc3;
  const SEP_PRICE = CERT_PRICES_MXN.sep;

  // Solo se modela la operación PROPIA del socio. La vigencia de Agente y
  // Consultor no está definida: el residual perpetuo que se anunciaba antes se
  // eliminó por incompatible con una cooperativa de consumo. No se sustituye
  // por un plazo inventado — lo fija la Asamblea.
  const tiposSocio = {
    trabajador: { label: "Trabajador", pct: 0.10, dc3Pct: 0.20, sepPct: 0.05, referral: 300, duracion: "12 meses" },
    instructor: { label: "Instructor", pct: 0.10, dc3Pct: 0.40, sepPct: 0.10, referral: 500, duracion: "24 meses" },
    agente: { label: "Agente", pct: 0.15, dc3Pct: 0.40, sepPct: 0.10, referral: 500, duracion: "Por definir por la Asamblea" },
    consultor: { label: "Consultor", pct: 0.25, dc3Pct: 0.40, sepPct: 0.10, referral: 500, duracion: "Por definir por la Asamblea" },
  };

  const p = plans[plan];
  const ts = tiposSocio[tipoSocio];

  const baseFeePerCompany = cols * p.umas * UMA_VALUE * p.fee;

  let basePct = ts.pct;
  if (tipoSocio === "consultor") {
    if (empresas >= 8) basePct = 0.35;
    else if (empresas >= 4) basePct = 0.30;
    else basePct = 0.25;
  }

  // Anticipo por la cartera propia del socio: no se suma nada derivado de las
  // operaciones de otros socios (un solo nivel, sin cascada).
  const anticipoMensual = baseFeePerCompany * basePct * empresas;

  const dc3PorCol = DC3_PRICE * ts.dc3Pct;
  const sepPorCol = SEP_PRICE * ts.sepPct;
  const SEP_SOBRE_DC3 = 0.1; // supuesto: 1 de cada 10 que tramita DC-3 también tramita SEP
  const certAnual = empresas * cols * (dc3Pct / 100) * dc3PorCol;
  const sepAnual = empresas * cols * (dc3Pct / 100) * sepPorCol * SEP_SOBRE_DC3;
  const referralAnual = empresas * ts.referral;
  const totalAnual = anticipoMensual * 12 + certAnual + sepAnual + referralAnual;

  const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");
  const pctLabel = `${Math.round(basePct * 100)}%`;

  return (
    <section id="bonos" className="py-20 bg-white" data-testid="section-bonos">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-8">
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">Simula tu propia operación</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
            Mueve los controles con <strong>tus propios supuestos</strong> y mira qué resultaría. El anticipo de rendimientos sale del fee de administración de Ceduverse, no de la aportación de la empresa.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 max-w-3xl mx-auto" data-testid="aviso-simulacion">
            <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed space-y-1.5">
              <p>
                <strong>Esto es una simulación, no una promesa de ingresos.</strong> Los resultados salen únicamente de los supuestos que tú eliges arriba
                (cuántas empresas, de qué tamaño, cuántas personas certifican). Nadie garantiza que refieras una sola empresa, ni que las que refieras permanezcan activas.
              </p>
              <p>{NOTA_ASAMBLEA}</p>
              <p>
                Solo se modela <strong>tu propia operación</strong>. El Bono por Crecimiento Regional del Coordinador no se simula: sus montos aún no existen.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm" data-testid="card-simulador">
            <CardContent className="pt-6 pb-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Tipo de socio</label>
                    <div className="flex gap-2 flex-wrap">
                      {(Object.keys(tiposSocio) as Array<keyof typeof tiposSocio>).map(k => (
                        <button
                          key={k}
                          onClick={() => setTipoSocio(k)}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tipoSocio === k ? "bg-[#7c3aed] text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                          data-testid={`button-tipo-${k}`}
                        >
                          {tiposSocio[k].label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed" data-testid="text-tipo-desc">
                      {tipoSocio === "trabajador" && "Refieres desde tu propia empresa. 10% del fee + 20% del DC-3 + 5% del SEP + bono de referido de $300, durante 12 meses."}
                      {tipoSocio === "instructor" && "Capacitas e impartes cursos. 10% del fee + 40% del DC-3 + 10% del SEP + bono de referido de $500, durante 24 meses."}
                      {tipoSocio === "agente" && "Capacitas e impartes cursos. 15% del fee + 40% del DC-3 + 10% del SEP + bono de referido de $500. La vigencia la define la Asamblea."}
                      {tipoSocio === "consultor" && "Asesoras empresas. 25% del fee (30% con 4+ empresas, 35% con 8+) + 40% del DC-3 + 10% del SEP + bono de referido de $500. La vigencia la define la Asamblea."}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Plan</label>
                    <div className="flex gap-2">
                      {(Object.keys(plans) as Array<keyof typeof plans>).map(k => (
                        <button
                          key={k}
                          onClick={() => setPlan(k)}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${plan === k ? "bg-[#1b5adf] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                          data-testid={`button-plan-${k}`}
                        >
                          {plans[k].label}
                          <span className="block text-[10px] opacity-70 mt-0.5">{plans[k].range}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed" data-testid="text-plan-desc">{p.desc}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex justify-between items-center">
                      <span>Colaboradores por empresa</span>
                      <input
                        type="number"
                        min={1}
                        max={5000}
                        value={cols}
                        onChange={e => {
                          const v = parseInt(e.target.value, 10);
                          if (!isNaN(v) && v >= 1 && v <= 5000) setCols(v);
                        }}
                        className="w-20 text-right text-[#1b5adf] font-semibold bg-white border border-black/[0.08] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1b5adf]/30"
                        data-testid="input-cols"
                      />
                    </label>
                    <input type="range" min={1} max={5000} step={1} value={cols} onChange={e => setCols(+e.target.value)} className="w-full accent-[#1b5adf]" data-testid="slider-cols" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex justify-between">
                      <span>Empresas en tu cartera</span>
                      <span className="text-[#1b5adf]">{empresas}</span>
                    </label>
                    <input type="range" min={1} max={15} value={empresas} onChange={e => setEmpresas(+e.target.value)} className="w-full accent-[#1b5adf]" data-testid="slider-empresas" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex justify-between">
                      <span>% que compran DC-3</span>
                      <span className="text-[#1b5adf]">{dc3Pct}%</span>
                    </label>
                    <input type="range" min={0} max={100} value={dc3Pct} onChange={e => setDc3Pct(+e.target.value)} className="w-full accent-[#1b5adf]" data-testid="slider-dc3" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-[#1b5adf] to-[#7c3aed] rounded-xl p-5 text-white" data-testid="result-anticipo">
                    <p className="text-sm opacity-80 mb-1">Anticipo de rendimientos mensual</p>
                    <p className="text-3xl font-bold">{fmt(anticipoMensual)}</p>
                    <p className="text-xs opacity-60 mt-1">MXN / mes · {pctLabel} del fee · solo por tu cartera ({empresas} {empresas === 1 ? "empresa" : "empresas"})</p>
                  </div>
                  <div className="bg-[#f28023]/10 border border-[#f28023]/20 rounded-xl p-5" data-testid="result-certs">
                    <p className="text-sm text-gray-600 mb-1">Certificaciones y bonos de referido / año</p>
                    <p className="text-3xl font-bold text-[#f28023]">{fmt(certAnual + sepAnual + referralAnual)}</p>
                    <p className="text-xs text-gray-400 mt-1">DC-3: {fmt(certAnual)} · SEP: {fmt(sepAnual)} · Bono de referido: {fmt(referralAnual)}</p>
                  </div>
                  <div className="bg-[#00b87a]/10 border border-[#00b87a]/20 rounded-xl p-5" data-testid="result-anual">
                    <p className="text-sm text-gray-600 mb-1">Total anual del escenario que elegiste</p>
                    <p className="text-3xl font-bold text-[#00b87a]">{fmt(totalAnual)}</p>
                    <p className="text-xs text-gray-400 mt-1">MXN · resultado de tus supuestos, no un ingreso prometido</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" data-testid="text-calc-meta">
                    <p className="text-xs text-gray-500 text-center mb-2">
                      Calculado para: <span className="font-semibold text-gray-700">{ts.label}</span> · Vigencia: <span className="font-semibold text-gray-700">{ts.duracion}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      Supuestos del cálculo: UMA de ${UMA_VALUE} diarios; DC-3 a ${DC3_PRICE} y certificado SEP a ${SEP_PRICE};
                      que 1 de cada 10 personas que tramita su DC-3 tramita también el SEP; y que las {empresas} {empresas === 1 ? "empresa permanece activa" : "empresas permanecen activas"} los 12 meses.
                      Cambia cualquiera de estos supuestos y el resultado cambia.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-10">
          <h3 className="font-serif text-xl text-gray-900 mb-5 text-center">Perfiles de socio referidor</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-perfiles">
              <thead>
                <tr className="bg-[#1b5adf] text-white">
                  <th className="text-left py-3 px-4 rounded-tl-lg">Perfil</th>
                  <th className="text-left py-3 px-4">Anticipo mensual</th>
                  <th className="text-left py-3 px-4">DC-3</th>
                  <th className="text-left py-3 px-4">SEP</th>
                  <th className="text-left py-3 px-4">Bono de referido</th>
                  <th className="text-left py-3 px-4 rounded-tr-lg">Vigencia</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {[
                  ["Trabajador", "10% del fee", "20%", "5%", "$300", "12 meses", true],
                  ["Instructor", "10% del fee", "40%", "10%", "$500", "24 meses", true],
                  ["Agente", "15% del fee", "40%", "10%", "$500", "Por definir", false],
                  ["Consultor", "25-35% del fee", "40%", "10%", "$500", "Por definir", false],
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-gray-100 last:border-0 transition-colors ${String(row[0]).toLowerCase() === tipoSocio ? "bg-[#1b5adf]/5" : ""}`}>
                    <td className="py-3 px-4 font-semibold text-gray-900">{row[0]}</td>
                    <td className="py-3 px-4 text-gray-600">{row[1]}</td>
                    <td className="py-3 px-4 text-gray-600">{row[2]}</td>
                    <td className="py-3 px-4 text-gray-600">{row[3]}</td>
                    <td className="py-3 px-4 text-gray-600">{row[4]}</td>
                    <td className="py-3 px-4">
                      <Badge className={row[6]
                        ? "bg-[#00b87a]/10 text-[#00b87a] border-[#00b87a]/20"
                        : "bg-amber-50 text-amber-700 border-amber-200"}>
                        {row[5]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-400 mt-4 text-center max-w-2xl mx-auto leading-relaxed" data-testid="text-tabla-nota">
            Todos estos porcentajes se calculan sobre la <strong>operación propia</strong> de cada socio. Ningún perfil recibe un porcentaje de lo que operan otros socios.
            {" "}{NOTA_ASAMBLEA}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function CatalogoSection() {
  const catalogs = [
    { icon: BookOpen, title: "Conferencias Ceduverse", count: 29, desc: "Instructores reales, contenido multimedia, certificación DC-3 oficial", gradient: "from-[#1b5adf]/5 to-[#1b5adf]/10", textColor: "text-[#1b5adf]" },
    { icon: Brain, title: "Tutor IA", count: 49, desc: "Contenido personalizado por IA al puesto e industria del trabajador", gradient: "from-[#7c3aed]/5 to-[#7c3aed]/10", textColor: "text-[#7c3aed]" },
    { icon: Library, title: "Academy", count: 988, desc: "Catálogo completo de ceducap.academy sincronizado", gradient: "from-[#f28023]/5 to-[#f28023]/10", textColor: "text-[#f28023]" },
  ];

  return (
    <section className="py-20 bg-white" data-testid="section-catalogo">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">Más de 1,000 cursos en el catálogo</motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {catalogs.map((c, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card className={`bg-gradient-to-br ${c.gradient} border border-gray-200 rounded-xl h-full`} data-testid={`card-catalogo-${i}`}>
                <CardContent className="pt-6 pb-5 text-center">
                  <c.icon size={36} className={`mx-auto mb-3 ${c.textColor}`} />
                  <h3 className="font-serif text-lg text-gray-900 mb-1">{c.title}</h3>
                  <p className={`text-4xl font-bold ${c.textColor} mb-2`}>
                    <AnimatedCounter target={c.count} />
                  </p>
                  <p className="text-xs text-gray-500">{c.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <section className="py-20 bg-[#faf8f4]" data-testid="section-dashboard-mockup">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-12">
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">Tu panel de socio</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 text-sm">Monitorea tu actividad en tiempo real</motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <div className="bg-[#0A0E1A] rounded-2xl shadow-2xl overflow-hidden border border-white/10" data-testid="mockup-dashboard">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-white/40 ml-2">www.ceduverse.org/partner</span>
            </div>
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#1b5adf] rounded-xl flex items-center justify-center text-white font-serif text-lg">S</div>
                <div>
                  <p className="text-white font-semibold text-sm">Panel de Socio</p>
                  <p className="text-white/40 text-xs">Roberto Martínez — Consultor</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Empresas activas", value: "12", color: "text-[#1b5adf]" },
                  { label: "Anticipo este mes", value: "$18,400", color: "text-[#00b87a]" },
                  { label: "Colaboradores", value: "340", color: "text-[#f28023]" },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-white/50 mb-1">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-white/50 mb-3">Anticipos mensuales (últimos 6 meses)</p>
                <div className="flex items-end gap-3 h-24">
                  {[40, 55, 48, 65, 78, 92].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-gradient-to-t from-[#1b5adf] to-[#7c3aed] rounded-t" style={{ height: `${h}%` }} />
                      <span className="text-[10px] text-white/30">{["Oct", "Nov", "Dic", "Ene", "Feb", "Mar"][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-[11px] text-gray-400 mt-4 text-center max-w-xl mx-auto leading-relaxed"
          data-testid="text-mockup-nota"
        >
          Imagen ilustrativa de la interfaz. El socio, las cifras y la gráfica son datos de muestra para enseñar cómo se ve el panel:
          no corresponden a un socio real ni representan ingresos típicos, esperados ni proyectados.
        </motion.p>
      </div>
    </section>
  );
}

// NOTA: aquí vivía una sección "Lo que dicen nuestros socios" con tres
// testimonios (Roberto M., Lic. Sandra V., Ing. Marco A.) que afirmaban cosas
// como "mis residuales ya cubren mi renta" y "cobro comisión cada mes sin hacer
// nada más". Se retiró: no hay forma de acreditar que sean socios reales y son
// declaraciones de ingreso en la página que ve un prospecto ANTES de asociarse.
// Para reponerla hacen falta testimonios verificables y con consentimiento, sin
// cifras ni promesas de ingreso.

function FAQSection() {
  const faqs = [
    { q: "¿Cuánto puedo ganar como socio?", a: "No podemos decírtelo, y desconfía de quien te dé una cifra. Tu anticipo de rendimientos depende de cuántas empresas lleves tú, de su tamaño y de cuántas personas certifiquen — y nada garantiza que consigas alguna. Usa la calculadora de esta página con tus propios supuestos: lo que te devuelve es la aritmética de lo que tú capturaste, no un ingreso que la cooperativa te prometa." },
    { q: "¿Es multinivel?", a: "No. Un socio recibe anticipo por su propia operación y por nada más: no existe un porcentaje sobre lo que operan los socios que él haya invitado, ni cascadas de niveles. El Coordinador Regional no es un nivel por encima de nadie — es un puesto que la cooperativa asigna a una zona, con funciones concretas, y su bono se paga por esa función, no por las ventas de terceros. Además, en una cooperativa 1 socio = 1 voto, sin importar cuánto opere o cuántos certificados tenga." },
    { q: "¿Cómo se llega a Coordinador Regional?", a: "No se llega reclutando. Es un puesto que asigna la cooperativa a una de las 4 zonas, hay máximo uno por zona, y es revocable. Se ocupa mientras se cumplan las funciones: capacitar, dar soporte, abrir plaza, promover el cooperativismo, apoyar el onboarding de empresas y acompañar a las comisiones mixtas de capacitación a registrar sus actas ante la STPS." },
    { q: "¿Cuánto paga el Bono por Crecimiento Regional?", a: "Todavía no está definido. El bono tiene una cuota fija por la función más un variable por metas de zona, pero los montos los fijará la Asamblea General. Preferimos decirte que no existen a inventarte una cifra: por eso no aparece en la calculadora." },
    { q: "¿Estos porcentajes ya son definitivos?", a: "No. Son política propuesta. Viven en el Reglamento Interno, que hoy es un borrador no aprobado por la Asamblea General y sin efectos jurídicos, y el propio borrador los declara parámetros ajustables por la Asamblea. Son las cifras con las que el proyecto está diseñado — no una regla vigente ni un compromiso en firme." },
    { q: "¿Necesito experiencia en ventas?", a: "No es obligatorio, pero ayuda. Ofrecemos capacitación comercial de 4 semanas con argumentario, manejo de objeciones y práctica en campo. Si ya asesoras a empresas, la curva es más rápida." },
    { q: "¿Cómo recibo mi anticipo?", a: "Vía transferencia bancaria, y puedes seguir tu actividad en tiempo real desde el panel de socio. El calendario de dispersión y el procedimiento forman parte del Reglamento Interno que la Asamblea aún debe aprobar." },
    { q: "¿Qué herramientas me dan?", a: "Panel de socio, código de referido con tracking, Kit Cooperativo PDF automático, 30 assets de marketing para redes sociales, presentación ejecutiva, acceso demo completo, y email corporativo." },
    { q: "¿Cuánto cuesta ser socio?", a: "No hay cuota de entrada. Te registras, recibes tus herramientas y empiezas a referir. El anticipo se activa cuando la empresa hace su primer pago. Ten presente que ser socio de la cooperativa implica un certificado de aportación de $150: es capital de riesgo de una sociedad real, no un pago de inscripción ni una inversión con rendimiento garantizado." },
  ];

  return (
    <section id="faq" className="py-20 bg-[#faf8f4]" data-testid="section-faq">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-12">
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">Preguntas frecuentes</motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-white rounded-xl border border-gray-200 px-5 shadow-sm" data-testid={`faq-item-${i}`}>
                <AccordionTrigger className="text-sm font-semibold text-gray-900 py-4 hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-gray-500 leading-relaxed pb-4">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

function RegistroForm() {
  const { toast } = useToast();
  const [form, setForm] = useState({ fullName: "", email: "", company: "", phone: "" });

  const submitLead = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/leads", {
        fullName: form.fullName,
        email: form.email,
        company: form.company,
        phone: form.phone,
        source: "socios-landing",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "¡Gracias!", description: "Te contactaremos en 24 horas." });
      setForm({ fullName: "", email: "", company: "", phone: "" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email) return;
    submitLead.mutate();
  };

  return (
    <section id="registro" className="py-20 bg-gradient-to-br from-[#1b5adf] to-[#7c3aed]" data-testid="section-registro">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-white mb-3">¿Listo para empezar?</motion.h2>
          <motion.p variants={fadeUp} className="text-white/80 mb-10 text-sm">Regístrate como socio comercial de la cooperativa y empieza a construir tu propia cartera de empresas.</motion.p>
          <motion.form variants={fadeUp} onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                placeholder="Nombre completo"
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-lg"
                required
                data-testid="input-socio-name"
              />
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-lg"
                required
                data-testid="input-socio-email"
              />
              <Input
                value={form.company}
                onChange={e => setForm({ ...form, company: e.target.value })}
                placeholder="Empresa / Organización"
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-lg"
                data-testid="input-socio-company"
              />
              <Input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="Teléfono"
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-lg"
                data-testid="input-socio-phone"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={submitLead.isPending}
              className="w-full sm:w-auto bg-white text-[#1b5adf] hover:bg-gray-100 font-bold rounded-lg px-10 py-6 text-base"
              data-testid="button-submit-socio"
            >
              {submitLead.isPending ? "Enviando..." : "Registrarme como Socio →"}
            </Button>
            <p className="text-xs text-white/50 mt-4 max-w-lg mx-auto leading-relaxed">
              Al registrarte aceptas los términos de la asociación cooperativa. Registrarte no te asocia todavía ni te garantiza ingreso alguno:
              te contactamos para explicarte el modelo y los pasos.
            </p>
          </motion.form>
        </motion.div>
      </div>
    </section>
  );
}

export default function SociosLanding() {
  useForceLightMode();

  return (
    <div className="min-h-screen bg-[#faf8f4]" data-testid="page-socios">
      <NavBar />
      <HeroSection />
      <PropuestaValor />
      <ComoFunciona />
      <ZonasSection />
      <CoordinadorRegional />
      <SimuladorRendimientos />
      <CatalogoSection />
      <DashboardMockup />
      <FAQSection />
      <RegistroForm />
      <footer className="bg-[#0A0E1A] py-10 text-center px-4">
        <Link href="/" className="no-underline">
          <span className="font-serif text-xl text-white/60 tracking-tight" translate="no">Cedu<em className="text-[#1b5adf] not-italic">verse</em></span>
        </Link>
        <p className="text-[11px] text-white/30 mt-4 max-w-2xl mx-auto leading-relaxed">
          Ceduverse es una sociedad cooperativa de consumo. Ser socio no es una inversión: no se ofrecen valores, ni rendimientos garantizados, ni ingresos asegurados.
          Los anticipos de rendimientos se generan en proporción a la operación de cada socio. Los parámetros descritos en esta página son política propuesta,
          sujeta a ratificación o ajuste por la Asamblea General.
        </p>
        <p className="text-xs text-white/30 mt-3">© 2026 Ceduverse. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
