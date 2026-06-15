import { useState, useEffect, useRef } from "react";
import { useForceLightMode } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Star,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

const UMA_VALUE = 113.14;

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
          <a href="#comisiones" className="text-sm text-gray-600 hover:text-gray-900 no-underline" data-testid="link-comisiones">Comisiones</a>
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
          <a href="#comisiones" className="block py-2 text-sm text-gray-700 no-underline" onClick={() => setOpen(false)}>Comisiones</a>
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
            Convierte la capacitación laboral en tu negocio
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed">
            Únete a la red de socios comerciales de Ceduverse. Gana comisiones residuales mensuales por cada empresa que refieras a la plataforma de capacitación con IA más avanzada de México.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#registro">
              <Button size="lg" className="bg-white text-[#1b5adf] hover:bg-gray-100 font-bold rounded-lg px-8 py-6 text-base" data-testid="button-hero-registro">
                Quiero ser Socio <ArrowRight size={18} className="ml-2" />
              </Button>
            </a>
            <a href="#comisiones" className="text-white/80 hover:text-white text-sm underline underline-offset-4 no-underline" data-testid="link-hero-comisiones">
              Ver modelo de comisiones ↓
            </a>
          </motion.div>
        </motion.div>
      </div>
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "1,066", label: "cursos disponibles" },
            { value: "3", label: "certificaciones oficiales" },
            { value: "7", label: "zonas exclusivas" },
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
    { icon: Repeat, color: "bg-[#1b5adf]", title: "Ingresos residuales mensuales", desc: "Cobra cada mes mientras tu cliente esté activo. No es una venta única — es un ingreso recurrente que se acumula." },
    { icon: LayoutDashboard, color: "bg-[#7c3aed]", title: "Dashboard de socio", desc: "Panel propio con estadísticas de referidos, comisiones ganadas, organizaciones creadas y progreso de equipos." },
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
    { icon: UserPlus, title: "Regístrate como socio", desc: "Llena el formulario y recibe tu cuenta partner con acceso al dashboard y herramientas de venta." },
    { icon: Link2, title: "Obtén tu código de referido", desc: "Código único que rastrea automáticamente cada empresa que refieras." },
    { icon: Building2, title: "Refiere empresas", desc: "Comparte tu código con empresas que necesiten capacitar. Haz demos del Tutor IA." },
    { icon: Wallet, title: "Cobra cada mes", desc: "Comisión residual mensual automática mientras la empresa esté activa en la plataforma." },
  ];

  return (
    <section id="como-funciona" className="py-20 bg-white" data-testid="section-como-funciona">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">Empieza a ganar en 4 pasos</motion.h2>
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

function SimuladorComisiones() {
  const [cols, setCols] = useState(30);
  const [plan, setPlan] = useState<"impulsa" | "transforma" | "lidera">("transforma");
  const [tipoSocio, setTipoSocio] = useState<"trabajador" | "instructor" | "agente" | "consultor" | "director">("consultor");
  const [empresas, setEmpresas] = useState(3);
  const [dc3Pct, setDc3Pct] = useState(40);

  const plans = {
    impulsa: { umas: 6, fee: 0.20, label: "Impulsa", range: "1–10 colaboradores", desc: "6 UMAs/colaborador/mes. Ideal para negocios pequeños. Incluye Aula Virtual, Tutor IA, Academy y 5% desc. en certificaciones." },
    transforma: { umas: 10, fee: 0.13, label: "Transforma", range: "11–99 colaboradores", desc: "10 UMAs/colaborador/mes. Para PyMEs en crecimiento. Incluye Aula Virtual, Tutor IA, Academy y 10% desc. en certificaciones." },
    lidera: { umas: 20, fee: 0.10, label: "Lidera", range: "100–500 colaboradores", desc: "20 UMAs/colaborador/mes. Para empresas grandes. Incluye Aula Virtual, Tutor IA, Academy y 15% desc. en certificaciones." },
  };

  const DC3_PRICE = 399;
  const SEP_PRICE = 1999;
  const tiposSocio = {
    trabajador: { label: "Trabajador", pct: 0.10, dc3Pct: 0.20, sepPct: 0.05, referral: 300, duracion: "12 meses" },
    instructor: { label: "Instructor", pct: 0.10, dc3Pct: 0.40, sepPct: 0.10, referral: 500, duracion: "24 meses" },
    agente: { label: "Agente", pct: 0.15, dc3Pct: 0.40, sepPct: 0.10, referral: 500, duracion: "Vitalicio" },
    consultor: { label: "Consultor", pct: 0.25, dc3Pct: 0.40, sepPct: 0.10, referral: 500, duracion: "Vitalicio" },
    director: { label: "Director", pct: 0.25, dc3Pct: 0.40, sepPct: 0.10, referral: 500, duracion: "Vitalicio", overridePct: 0.05, overrideDc3Pct: 0.10, overrideSepPct: 0.05, overrideReferral: 200 },
  };

  const p = plans[plan];
  const ts = tiposSocio[tipoSocio];

  const baseFeePerCompany = cols * p.umas * UMA_VALUE * p.fee;

  let comisionPct = ts.pct;
  if (tipoSocio === "consultor") {
    if (empresas >= 8) comisionPct = 0.35;
    else if (empresas >= 4) comisionPct = 0.30;
    else comisionPct = 0.25;
  }
  if (tipoSocio === "director") {
    if (empresas >= 8) comisionPct = 0.35;
    else if (empresas >= 4) comisionPct = 0.30;
    else comisionPct = 0.25;
  }

  const propioMensual = baseFeePerCompany * comisionPct * empresas;
  const numConsultores = 3;
  const overrideMensual = tipoSocio === "director"
    ? baseFeePerCompany * (tiposSocio.director.overridePct) * empresas * numConsultores
    : 0;
  const residualMensual = propioMensual + overrideMensual;

  const dc3ComPerCol = DC3_PRICE * (ts.dc3Pct + (tipoSocio === "director" ? tiposSocio.director.overrideDc3Pct : 0));
  const sepComPerCol = SEP_PRICE * (ts.sepPct + (tipoSocio === "director" ? tiposSocio.director.overrideSepPct : 0));
  const certAnual = empresas * cols * (dc3Pct / 100) * dc3ComPerCol;
  const sepAnual = empresas * cols * (dc3Pct / 100) * sepComPerCol * 0.1;
  const referralAnual = empresas * (ts.referral + (tipoSocio === "director" ? tiposSocio.director.overrideReferral : 0));
  const ingresoAnual = residualMensual * 12 + certAnual + sepAnual + referralAnual;

  const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");
  const pctLabel = tipoSocio === "consultor" || tipoSocio === "director"
    ? `${Math.round(comisionPct * 100)}%`
    : `${Math.round(ts.pct * 100)}%`;

  return (
    <section id="comisiones" className="py-20 bg-[#faf8f4]" data-testid="section-comisiones">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-12">
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">Cuánto puedes ganar</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 max-w-lg mx-auto text-sm">Las comisiones se pagan del fee de administración de Ceduverse, no de la aportación de la empresa.</motion.p>
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
                      {tipoSocio === "trabajador" && "Refiere desde tu empresa. Ganas 10% del fee + $30/DC-3 + $100/SEP por 12 meses."}
                      {tipoSocio === "instructor" && "Capacita e imparte cursos. Ganas 10% del fee + 40% DC-3 + 10% SEP + $500/referido por 24 meses."}
                      {tipoSocio === "agente" && "Capacita e imparte cursos. Ganas 15% del fee + 40% DC-3 + 10% SEP + $500/referido. Vitalicio."}
                      {tipoSocio === "consultor" && "Vende y asesora empresas. Ganas 25% (30% si 4+, 35% si 8+ empresas) + $60/DC-3 + $200/SEP. Vitalicio."}
                      {tipoSocio === "director" && "Lidera consultores. Ganas 25-35% propio + 5% override de 3 consultores + DC-3 y SEP con bono. Vitalicio."}
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
                  <div className="bg-gradient-to-br from-[#1b5adf] to-[#7c3aed] rounded-xl p-5 text-white" data-testid="result-residual">
                    <p className="text-sm opacity-80 mb-1">Residual mensual</p>
                    {tipoSocio === "director" ? (
                      <>
                        <p className="text-lg font-semibold">Propio: {fmt(propioMensual)}</p>
                        <p className="text-lg font-semibold">Override ({numConsultores} consultores): {fmt(overrideMensual)}</p>
                        <div className="border-t border-white/20 mt-2 pt-2">
                          <p className="text-3xl font-bold">= {fmt(residualMensual)}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-3xl font-bold">{fmt(residualMensual)}</p>
                    )}
                    <p className="text-xs opacity-60 mt-1">MXN / mes · Comisión: {pctLabel} del fee</p>
                  </div>
                  <div className="bg-[#f28023]/10 border border-[#f28023]/20 rounded-xl p-5" data-testid="result-certs">
                    <p className="text-sm text-gray-600 mb-1">Certificaciones / año</p>
                    <p className="text-3xl font-bold text-[#f28023]">{fmt(certAnual + sepAnual + referralAnual)}</p>
                    <p className="text-xs text-gray-400 mt-1">DC-3: {fmt(certAnual)} · SEP: {fmt(sepAnual)} · Referidos: {fmt(referralAnual)}</p>
                  </div>
                  <div className="bg-[#00b87a]/10 border border-[#00b87a]/20 rounded-xl p-5" data-testid="result-anual">
                    <p className="text-sm text-gray-600 mb-1">Ingreso anual estimado</p>
                    <p className="text-3xl font-bold text-[#00b87a]">{fmt(ingresoAnual)}</p>
                    <p className="text-xs text-gray-400 mt-1">MXN total</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center" data-testid="text-calc-meta">
                    <p className="text-xs text-gray-500">
                      Calculado para: <span className="font-semibold text-gray-700">{ts.label}</span> · Duración: <span className="font-semibold text-gray-700">{ts.duracion}</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-10">
          <h3 className="font-serif text-xl text-gray-900 mb-5 text-center">Perfiles de referidor</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-perfiles">
              <thead>
                <tr className="bg-[#1b5adf] text-white">
                  <th className="text-left py-3 px-4 rounded-tl-lg">Perfil</th>
                  <th className="text-left py-3 px-4">Residual</th>
                  <th className="text-left py-3 px-4">DC-3</th>
                  <th className="text-left py-3 px-4">SEP</th>
                  <th className="text-left py-3 px-4">Referidos</th>
                  <th className="text-left py-3 px-4 rounded-tr-lg">Duración</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {[
                  ["Trabajador", "10% del fee", "20%", "5%", "$300", "12 meses"],
                  ["Instructor", "10% del fee", "40%", "10%", "$500", "24 meses"],
                  ["Agente", "15% del fee", "40%", "10%", "$500", "Vitalicio"],
                  ["Consultor", "25-35% del fee", "40%", "10%", "$500", "Vitalicio"],
                  ["Director", "25-35% + 5% override", "40%+10%", "10%+5%", "$500+$200", "Vitalicio"],
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-gray-100 last:border-0 transition-colors ${row[0].toLowerCase() === tipoSocio ? "bg-[#1b5adf]/5" : ""}`}>
                    <td className="py-3 px-4 font-semibold text-gray-900">{row[0]}</td>
                    <td className="py-3 px-4 text-gray-600">{row[1]}</td>
                    <td className="py-3 px-4 text-gray-600">{row[2]}</td>
                    <td className="py-3 px-4 text-gray-600">{row[3]}</td>
                    <td className="py-3 px-4 text-gray-600">{row[4]}</td>
                    <td className="py-3 px-4"><Badge className="bg-[#00b87a]/10 text-[#00b87a] border-[#00b87a]/20">{row[5]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CatalogoSection() {
  const catalogs = [
    { icon: BookOpen, title: "Aula Virtual STPS", count: 29, desc: "Instructores reales, contenido multimedia, certificación DC-3 oficial", gradient: "from-[#1b5adf]/5 to-[#1b5adf]/10", textColor: "text-[#1b5adf]" },
    { icon: Brain, title: "Tutor IA", count: 49, desc: "Contenido personalizado por IA al puesto e industria del trabajador", gradient: "from-[#7c3aed]/5 to-[#7c3aed]/10", textColor: "text-[#7c3aed]" },
    { icon: Library, title: "Academy", count: 988, desc: "Catálogo completo de ceducap.academy sincronizado", gradient: "from-[#f28023]/5 to-[#f28023]/10", textColor: "text-[#f28023]" },
  ];

  return (
    <section className="py-20 bg-white" data-testid="section-catalogo">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">Más de 1,000 cursos para vender</motion.h2>
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
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">Tu dashboard de socio</motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 text-sm">Monitorea tu negocio en tiempo real</motion.p>
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
                  { label: "Comisiones este mes", value: "$18,400", color: "text-[#00b87a]" },
                  { label: "Colaboradores", value: "340", color: "text-[#f28023]" },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-white/50 mb-1">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-white/50 mb-3">Comisiones mensuales (últimos 6 meses)</p>
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
      </div>
    </section>
  );
}

function Testimonios() {
  const testimonials = [
    { name: "Roberto M.", role: "Consultor RRHH, Querétaro", initials: "RM", color: "bg-[#1b5adf]", quote: "En 4 meses ya tengo 6 empresas activas. El Tutor IA se vende solo — cuando los gerentes de RH lo ven en acción, firman. Mis residuales ya cubren mi renta." },
    { name: "Lic. Sandra V.", role: "Despacho Contable, CDMX", initials: "SV", color: "bg-[#7c3aed]", quote: "Mis clientes contables necesitaban cumplir NOM-035 y no sabían cómo. Les recomendé Ceduverse y ahora cobro comisión cada mes sin hacer nada más." },
    { name: "Ing. Marco A.", role: "Instructor STPS, Monterrey", initials: "MA", color: "bg-[#f28023]", quote: "Ya daba cursos presenciales pero el alcance era limitado. Con Ceduverse complemento con la plataforma digital y gano por los DC-3 que mis alumnos tramitan." },
  ];

  return (
    <section className="py-20 bg-white" data-testid="section-testimonios">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">Lo que dicen nuestros socios</motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card className="bg-white rounded-xl border border-gray-200 shadow-sm h-full" data-testid={`card-testimonial-${i}`}>
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-11 h-11 ${t.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}>{t.initials}</div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 italic leading-relaxed mb-4">"{t.quote}"</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    { q: "¿Cuánto puedo ganar como socio?", a: "Depende de cuántas empresas refieras y su tamaño. Un consultor con 3 empresas Transforma de 30 colaboradores gana ~$2,500/mes de residual + certificaciones adicionales. Al acumular 6 empresas al año, el residual llega a ~$5,800/mes." },
    { q: "¿Necesito experiencia en ventas?", a: "No es obligatorio, pero ayuda. Ofrecemos capacitación comercial de 4 semanas con argumentario, manejo de objeciones y práctica en campo. Si ya vendes servicios a empresas, la curva es muy rápida." },
    { q: "¿Cómo cobro mis comisiones?", a: "Las comisiones se dispersan vía transferencia bancaria los días 20 de cada mes. Puedes ver tus comisiones en tiempo real en el dashboard de socio." },
    { q: "¿Qué herramientas me dan?", a: "Dashboard de partner, código de referido con tracking, Kit Cooperativo PDF automático, 30 assets de marketing para redes sociales, presentación ejecutiva, acceso demo completo, y email corporativo." },
    { q: "¿Es multinivel?", a: "No. Solo hay 2 niveles: Director Regional y Consultor Comercial. El ingreso viene de vender a empresas, no de reclutar socios. Los referidos pasivos (trabajadores/instructores) tienen tope de 12-24 meses." },
    { q: "¿Cuánto cuesta ser socio?", a: "Nada. No hay cuota de entrada. Te registras, recibes tus herramientas y empiezas a referir. Las comisiones se activan cuando la empresa hace su primer pago." },
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
          <motion.p variants={fadeUp} className="text-white/80 mb-10 text-sm">Regístrate como socio comercial y comienza a ganar comisiones residuales mensuales.</motion.p>
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
            <p className="text-xs text-white/50 mt-4">Al registrarte aceptas los términos de la asociación cooperativa</p>
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
      <SimuladorComisiones />
      <CatalogoSection />
      <DashboardMockup />
      <Testimonios />
      <FAQSection />
      <RegistroForm />
      <footer className="bg-[#0A0E1A] py-10 text-center">
        <Link href="/" className="no-underline">
          <span className="font-serif text-xl text-white/60 tracking-tight" translate="no">Cedu<em className="text-[#1b5adf] not-italic">verse</em></span>
        </Link>
        <p className="text-xs text-white/30 mt-3">© 2026 Ceduverse. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
