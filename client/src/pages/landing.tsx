import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForceLightMode } from "@/components/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import type { Course } from "@shared/schema";
import {
  Bot,
  Link2,
  BarChart3,
  Gamepad2,
  Users,
  Wallet,
  ArrowRight,
  Check,
  Play,
  Lock,
  Menu,
  Star,
  Trophy,
  BookOpen,
  Clock,
  ClipboardEdit,
  Search,
  Rocket,
  Award,
  X,
  ShieldCheck,
  ExternalLink,
  GraduationCap,
  BadgeCheck,
  Heart,
  HardHat,
  Briefcase,
  Filter,
  Sparkles,
  Zap,
  Diamond,
  Medal,
  Quote,
  Target,
  ChevronRight,
  FileCheck,
  Shield,
  Tag,
  Package,
  Cpu,
} from "lucide-react";

function FloatingShape({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden="true"
    />
  );
}

function DecorativeDots({ className }: { className?: string }) {
  return (
    <svg className={`absolute pointer-events-none ${className}`} width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
      {[0, 20, 40, 60].map(x =>
        [0, 20, 40, 60].map(y => (
          <circle key={`${x}-${y}`} cx={x + 10} cy={y + 10} r="2" fill="currentColor" opacity="0.15" />
        ))
      )}
    </svg>
  );
}

function HexShape({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

function ConnectorArrow({ className }: { className?: string }) {
  return (
    <svg className={`absolute pointer-events-none ${className}`} width="60" height="100" viewBox="0 0 60 100" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M30 0 C30 30, 50 40, 30 70 L30 90"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 4"
        opacity="0.2"
        strokeLinecap="round"
      />
      <path
        d="M22 82 L30 95 L38 82"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  }),
};

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className={className}>
      {isInView ? children : <div style={{ opacity: 0 }}>{children}</div>}
    </div>
  );
}

function Navbar() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-cedu-cream/85 backdrop-blur-xl border-b border-black/[0.06] shadow-sm"
          : "bg-transparent"
      }`}
      data-testid="navbar"
    >
      <div className="max-w-[1160px] mx-auto px-6 flex items-center justify-between h-16">
        <a href="#" className="flex items-center gap-2.5 no-underline" data-testid="link-logo">
          <div className="w-9 h-9 bg-cedu-blue rounded-[10px] flex items-center justify-center text-white font-serif text-xl">
            C
          </div>
          <div className="font-serif text-2xl text-cedu-ink tracking-tight">
            Cedu<em className="text-cedu-blue not-italic italic">verse</em>
          </div>
        </a>

        <ul className="hidden lg:flex items-center gap-0.5 list-none">
          <li>
            <a
              href="#features"
              className="text-cedu-ink-muted font-semibold text-[13px] px-3 py-2 rounded-[10px] hover:text-cedu-ink hover:bg-black/[0.04] transition-all no-underline"
              data-testid="link-features"
            >
              Características
            </a>
          </li>
          <li>
            <a
              href="#courses"
              className="text-cedu-ink-muted font-semibold text-[13px] px-3 py-2 rounded-[10px] hover:text-cedu-ink hover:bg-black/[0.04] transition-all no-underline"
              data-testid="link-courses"
            >
              Cursos
            </a>
          </li>
          <li>
            <a
              href="#how"
              className="text-cedu-ink-muted font-semibold text-[13px] px-3 py-2 rounded-[10px] hover:text-cedu-ink hover:bg-black/[0.04] transition-all no-underline"
              data-testid="link-process"
            >
              Proceso
            </a>
          </li>
          <li>
            <a
              href="#certificaciones"
              className="text-cedu-ink-muted font-semibold text-[13px] px-3 py-2 rounded-[10px] hover:text-cedu-ink hover:bg-black/[0.04] transition-all no-underline"
              data-testid="link-certifications"
            >
              Certificaciones
            </a>
          </li>
          <li>
            <Link
              href="/empresas"
              className="text-cedu-ink-muted font-semibold text-[13px] px-3 py-2 rounded-[10px] hover:text-cedu-ink hover:bg-black/[0.04] transition-all no-underline"
              data-testid="link-empresas"
            >
              Empresas
            </Link>
          </li>
          <li>
            <Link
              href="/tienda"
              className="text-cedu-ink-muted font-semibold text-[13px] px-3 py-2 rounded-[10px] hover:text-cedu-ink hover:bg-black/[0.04] transition-all no-underline"
              data-testid="link-tienda"
            >
              Tienda
            </Link>
          </li>
          <li>
            <Link
              href={user ? "/dashboard" : "/auth"}
              className="bg-cedu-ink text-white font-semibold text-[13px] px-5 py-2.5 rounded-xl hover:bg-cedu-blue transition-all no-underline ml-2 whitespace-nowrap"
              data-testid="link-cta-nav"
            >
              {user ? "Dashboard" : "Comenzar"} &rarr;
            </Link>
          </li>
        </ul>

        <button
          className="lg:hidden p-2 text-cedu-ink"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          data-testid="button-mobile-menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-nav" role="navigation" aria-label="Menú principal" className="lg:hidden bg-cedu-cream/95 backdrop-blur-xl border-t border-black/[0.06] px-6 pb-6 pt-2">
          <a href="#features" className="block py-3 text-cedu-ink-soft font-semibold text-sm no-underline" onClick={() => setMobileOpen(false)}>Características</a>
          <a href="#courses" className="block py-3 text-cedu-ink-soft font-semibold text-sm no-underline" onClick={() => setMobileOpen(false)}>Cursos</a>
          <a href="#how" className="block py-3 text-cedu-ink-soft font-semibold text-sm no-underline" onClick={() => setMobileOpen(false)}>Proceso</a>
          <a href="#certificaciones" className="block py-3 text-cedu-ink-soft font-semibold text-sm no-underline" onClick={() => setMobileOpen(false)}>Certificaciones</a>
          <Link href="/empresas" className="block py-3 text-cedu-ink-soft font-semibold text-sm no-underline" onClick={() => setMobileOpen(false)}>Empresas</Link>
          <Link href="/tienda" className="block py-3 text-cedu-ink-soft font-semibold text-sm no-underline" data-testid="link-tienda-mobile" onClick={() => setMobileOpen(false)}>Tienda</Link>
          <Link href={user ? "/dashboard" : "/auth"} className="block mt-2 bg-cedu-ink text-white font-semibold text-sm px-6 py-3 rounded-xl text-center no-underline" onClick={() => setMobileOpen(false)}>{user ? "Dashboard" : "Comenzar"} &rarr;</Link>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  const { user } = useAuth();
  return (
    <section className="pt-36 pb-20 relative overflow-hidden" data-testid="section-hero">
      <div className="absolute inset-0 dot-grid-bg opacity-40 z-0" />
      <div className="absolute -top-16 -right-20 w-[500px] h-[500px] bg-gradient-to-br from-cedu-blue-light to-cedu-orange-light animate-blob opacity-50 z-0" />
      <div className="absolute -bottom-32 -left-24 w-[400px] h-[400px] bg-gradient-to-br from-cedu-green-light to-cedu-violet-light animate-blob-slow opacity-40 z-0" />

      <FloatingShape className="w-3 h-3 rounded-full bg-cedu-blue/20 top-[20%] left-[8%] animate-float-y" delay={0} />
      <FloatingShape className="w-2 h-2 rounded-full bg-cedu-orange/25 top-[35%] left-[15%] animate-float-y-slow" delay={1} />
      <FloatingShape className="w-4 h-4 rounded bg-cedu-violet/10 rotate-45 top-[15%] right-[12%] animate-float-y" delay={0.5} />
      <FloatingShape className="w-2.5 h-2.5 rounded-full bg-cedu-green/20 top-[60%] left-[5%] animate-float-x" delay={2} />
      <HexShape size={32} className="absolute top-[25%] right-[5%] text-cedu-blue animate-float-y-slow hidden lg:block" />
      <HexShape size={20} className="absolute top-[70%] left-[10%] text-cedu-orange animate-float-y hidden lg:block" />

      <div className="absolute top-[18%] left-[22%] w-6 h-6 animate-spin-slow pointer-events-none hidden lg:block">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#1b5adf" strokeWidth="1.5" strokeLinecap="round" opacity="0.15" /></svg>
      </div>

      <div className="max-w-[1160px] mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
        <div>
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-cedu-blue-light rounded-full text-[13px] font-bold text-cedu-blue mb-6"
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
          >
            <Sparkles size={14} className="text-cedu-orange" />
            Plataforma #1 en EdTech + IA
          </motion.div>

          <motion.h1
            className="font-serif text-[clamp(2.8rem,5.5vw,4.5rem)] leading-[1.08] tracking-tight text-cedu-ink mb-6"
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
          >
            Tu carrera merece<br />una educación{" "}
            <em className="relative italic text-cedu-blue underline decoration-cedu-orange underline-offset-[6px] decoration-[3px]">
              inteligente.
              <Zap size={20} className="absolute -top-3 -right-6 text-cedu-orange animate-pulse-dot" />
            </em>
          </motion.h1>

          <motion.p
            className="text-lg leading-relaxed text-cedu-ink-muted max-w-[480px] mb-9"
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
          >
            Cursos diseñados por expertos, potenciados por inteligencia artificial y con diplomas verificables en blockchain. Todo en un solo lugar.
          </motion.p>

          <motion.div
            className="flex gap-3 flex-wrap mb-12 relative"
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
          >
            <Link
              href={user ? "/dashboard" : "/auth"}
              className="inline-flex items-center gap-2 px-8 py-4 bg-cedu-blue text-white font-bold text-[15px] rounded-[14px] shadow-[0_4px_20px_rgba(27,90,223,0.25)] hover:bg-cedu-blue-dark hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(27,90,223,0.35)] transition-all no-underline"
              data-testid="button-start-free"
            >
              {user ? "Ir al Dashboard" : "Empezar Gratis"} <ArrowRight size={18} />
            </Link>
            <a
              href="#courses"
              className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-cedu-ink font-bold text-[15px] border-2 border-black/[0.12] rounded-[14px] hover:border-cedu-ink hover:bg-black/[0.02] transition-all no-underline"
              data-testid="button-explore-courses"
            >
              Explorar Cursos
            </a>
            <ConnectorArrow className="hidden lg:block -bottom-[90px] left-[40px] text-cedu-blue" />
          </motion.div>

          <motion.div
            className="flex items-center gap-4"
            variants={fadeUp} initial="hidden" animate="visible" custom={4}
          >
            <div className="flex">
              {[
                "from-cedu-blue to-[#4f9fff]",
                "from-cedu-orange to-[#ffa655]",
                "from-cedu-green to-[#00e5a0]",
                "from-cedu-violet to-[#a78bfa]",
              ].map((gradient, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full border-[3px] border-cedu-cream bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-extrabold text-white ${
                    i > 0 ? "-ml-3" : ""
                  }`}
                >
                  {["M", "R", "A", "J"][i]}
                </div>
              ))}
            </div>
            <div className="text-sm text-cedu-ink-muted leading-snug">
              <strong className="text-cedu-ink block">+12,000 estudiantes</strong>
              ya confían en Ceduverse
            </div>
          </motion.div>
        </div>

        <div className="hidden lg:flex relative justify-center items-center min-h-[420px]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[320px] h-[320px] rounded-full border-2 border-dashed border-cedu-blue/10 animate-spin-slow" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[380px] h-[380px] rounded-full border border-dashed border-cedu-orange/8" style={{ animationDirection: "reverse", animation: "spin-slow 30s linear infinite reverse" }} />
          </div>

          <div className="absolute top-[10%] left-[5%] w-2 h-2 rounded-full bg-cedu-blue animate-pulse-dot" />
          <div className="absolute top-[50%] right-[2%] w-2 h-2 rounded-full bg-cedu-orange animate-pulse-dot" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-[15%] left-[15%] w-1.5 h-1.5 rounded-full bg-cedu-green animate-pulse-dot" style={{ animationDelay: "2s" }} />
          <div className="absolute top-[5%] right-[25%] w-1.5 h-1.5 rounded-full bg-cedu-violet animate-pulse-dot" style={{ animationDelay: "0.5s" }} />

          <DecorativeDots className="top-0 right-0 text-cedu-blue" />
          <DecorativeDots className="bottom-0 left-0 text-cedu-orange" />

          <motion.div
            className="relative bg-white rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-6 border border-black/[0.06] w-[300px] z-20 flex flex-col gap-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[14px] bg-cedu-blue-light flex items-center justify-center">
                <Bot size={24} className="text-cedu-blue" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-[15px] text-cedu-ink">IA para Negocios</div>
                <div className="text-xs text-cedu-ink-muted">65% completado</div>
              </div>
              <div className="px-2 py-0.5 bg-cedu-green-light rounded-md text-[10px] font-extrabold text-cedu-green tracking-wider">
                +50 XP
              </div>
            </div>
            <div className="h-2 rounded bg-cedu-blue-light overflow-hidden">
              <div className="h-full rounded bg-gradient-to-r from-cedu-blue to-cedu-blue-dark w-[65%]" />
            </div>
            <div className="flex flex-col gap-2 mt-1">
              {[
                { label: "Introducción a la IA", status: "done" },
                { label: "Machine Learning Básico", status: "done" },
                { label: "Procesamiento de Lenguaje", status: "done" },
                { label: "IA en Estrategia Empresarial", status: "next" },
                { label: "Proyecto Final", status: "lock" },
              ].map((lesson, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-cedu-cream text-[13px] font-semibold text-cedu-ink-soft"
                >
                  <div
                    className={`w-[22px] h-[22px] rounded-[7px] flex items-center justify-center text-xs flex-shrink-0 ${
                      lesson.status === "done"
                        ? "bg-cedu-green text-white"
                        : lesson.status === "next"
                        ? "bg-cedu-blue-light text-cedu-blue"
                        : "bg-black/[0.06] text-cedu-ink-muted"
                    }`}
                  >
                    {lesson.status === "done" ? (
                      <Check size={12} />
                    ) : lesson.status === "next" ? (
                      <Play size={10} />
                    ) : (
                      <Lock size={10} />
                    )}
                  </div>
                  {lesson.label}
                  {lesson.status === "done" && (
                    <Check size={12} className="text-cedu-green ml-auto" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="absolute -top-5 -right-8 z-30 bg-white rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-6 border border-black/[0.06] w-[180px] animate-float-y-slow"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-serif text-[32px] text-cedu-green">4.9</div>
            <div className="flex gap-0.5 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="text-cedu-orange fill-cedu-orange" />
              ))}
            </div>
            <div className="text-xs text-cedu-ink-muted">Calificación promedio</div>
          </motion.div>

          <motion.div
            className="absolute bottom-5 -left-12 z-30 bg-white rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-5 border border-black/[0.06] w-[210px] animate-float-y"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-cedu-orange-light flex items-center justify-center relative">
                <Trophy size={20} className="text-cedu-orange" />
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cedu-green rounded-full flex items-center justify-center">
                  <Check size={8} className="text-white" />
                </div>
              </div>
              <div>
                <div className="text-[13px] font-bold text-cedu-ink flex items-center gap-1">
                  Logro desbloqueado! <Sparkles size={12} className="text-cedu-orange" />
                </div>
                <div className="text-[11px] text-cedu-ink-muted">Estudiante Constante</div>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1 rounded bg-cedu-orange-light overflow-hidden">
                <div className="h-full rounded bg-cedu-orange w-[75%]" />
              </div>
              <span className="text-[9px] font-extrabold text-cedu-orange">750 XP</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function MarqueeStrip() {
  const items = [
    "Inteligencia Artificial",
    "Blockchain & Web3",
    "Marketing Digital",
    "Liderazgo Empresarial",
    "Finanzas Personales",
    "Desarrollo de Software",
    "Diseño UX/UI",
    "Comercio Electrónico",
  ];

  return (
    <div className="py-10 border-t border-b border-black/[0.06] overflow-hidden bg-white" data-testid="section-marquee">
      <div className="flex gap-12 animate-marquee w-max">
        {[...items, ...items].map((item, i) => (
          <div key={i} className="font-serif text-xl text-cedu-ink-muted opacity-40 whitespace-nowrap flex items-center gap-3">
            {item}
            <div className="w-1.5 h-1.5 rounded-full bg-cedu-orange opacity-60" />
          </div>
        ))}
      </div>
    </div>
  );
}

const features = [
  {
    icon: Bot,
    title: "Tutor con IA",
    desc: "Asistente inteligente que se adapta a tu ritmo y estilo de aprendizaje con retroalimentación instantánea.",
    bg: "bg-cedu-blue-light",
    color: "text-cedu-blue",
  },
  {
    icon: Link2,
    title: "Diplomas Digitales Web3",
    desc: "Diplomas digitales de participación verificables en blockchain + Certificados SEP opcionales. Tus credenciales, inmutables y tuyas para siempre.",
    bg: "bg-cedu-green-light",
    color: "text-cedu-green",
  },
  {
    icon: BarChart3,
    title: "Analítica Inteligente",
    desc: "Métricas de progreso, predicción de desempeño y recomendaciones personalizadas basadas en datos.",
    bg: "bg-cedu-orange-light",
    color: "text-cedu-orange",
  },
  {
    icon: Gamepad2,
    title: "Gamificación",
    desc: "Logros, rachas de estudio y rankings que convierten el aprendizaje en una experiencia gratificante.",
    bg: "bg-cedu-violet-light",
    color: "text-cedu-violet",
  },
  {
    icon: Users,
    title: "Para Equipos",
    desc: "Gestión de organizaciones con asignación de cursos, seguimiento grupal y reportes ejecutivos.",
    bg: "bg-cedu-coral/10",
    color: "text-cedu-coral",
  },
  {
    icon: Wallet,
    title: "Billetera Digital",
    desc: "Crea o conecta tu billetera Ethereum para recompensas tokenizadas y experiencias exclusivas.",
    bg: "bg-teal-100",
    color: "text-teal-600",
  },
];

function FeaturesSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden" id="features" data-testid="section-features">
      <div className="absolute top-12 right-8 text-cedu-blue hidden lg:block">
        <HexShape size={40} className="animate-float-y-slow" />
      </div>
      <div className="absolute bottom-16 left-6 text-cedu-orange hidden lg:block">
        <HexShape size={28} className="animate-float-y" />
      </div>
      <DecorativeDots className="top-20 left-12 text-cedu-blue hidden lg:block" />

      <div className="max-w-[1160px] mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[3px] text-cedu-orange mb-3">
              <Target size={14} /> Características
            </div>
            <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight text-cedu-ink mb-4">
              Herramientas que transforman<br />tu forma de aprender
            </h2>
            <p className="text-[17px] text-cedu-ink-muted max-w-[520px] mx-auto leading-relaxed">
              Cada función está diseñada para maximizar tu potencial y hacer del aprendizaje algo memorable.
            </p>
          </motion.div>
        </AnimatedSection>

        <div className="relative">
          <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block" preserveAspectRatio="none">
            <line x1="33%" y1="50%" x2="66%" y2="50%" stroke="#1b5adf" strokeWidth="1" strokeDasharray="6 4" opacity="0.1" />
            <circle cx="33%" cy="50%" r="3" fill="#1b5adf" opacity="0.15" className="animate-pulse-dot" />
            <circle cx="66%" cy="50%" r="3" fill="#1b5adf" opacity="0.15" className="animate-pulse-dot" style={{ animationDelay: "1s" }} />
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                className="group p-9 rounded-[20px] border border-black/[0.06] bg-cedu-cream transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] hover:border-transparent relative card-shine-sweep"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                data-testid={`card-feature-${i}`}
              >
                <div className="absolute top-4 right-5 font-serif text-[48px] leading-none text-cedu-ink/[0.04] font-bold select-none">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cedu-blue to-cedu-orange scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-[20px]" />
                <div className={`w-[52px] h-[52px] rounded-[14px] ${feat.bg} flex items-center justify-center mb-5 group-hover:animate-bounce-subtle transition-transform`}>
                  <feat.icon size={26} className={feat.color} />
                </div>
                <h3 className="font-serif text-xl text-cedu-ink mb-2.5">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-cedu-ink-muted">{feat.desc}</p>
                {i < features.length - 1 && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center z-10">
                    {(i + 1) % 3 !== 0 && (
                      <ChevronRight size={16} className="text-cedu-blue/20" />
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const AREA_FILTERS = [
  { label: "Todos", value: "all" },
  { label: "Desarrollo Humano", value: "Desarrollo Humano" },
  { label: "Seguridad Industrial", value: "Higiene y Seguridad en el Trabajo" },
  { label: "Dirección y Gestión", value: "Dirección y Gestión" },
  { label: "Seguridad", value: "Seguridad" },
  { label: "Otros", value: "other" },
];

const AREA_STYLES: Record<string, { gradient: string; icon: typeof Bot }> = {
  "Desarrollo Humano": { gradient: "from-cedu-violet-light to-[#ddd0ff]", icon: Heart },
  "Normatividad Laboral": { gradient: "from-cedu-blue-light to-[#c7d9ff]", icon: ShieldCheck },
  "Dirección y Gestión": { gradient: "from-cedu-orange/20 to-[#ffe0c0]", icon: Briefcase },
  "Higiene y Seguridad en el Trabajo": { gradient: "from-cedu-green-light to-[#b8f5dc]", icon: HardHat },
  "Seguridad": { gradient: "from-yellow-100 to-yellow-200", icon: ShieldCheck },
  "Formación y Actualización de Instructores": { gradient: "from-cedu-blue-light to-[#c7d9ff]", icon: GraduationCap },
  "Limpieza Industrial y Doméstica": { gradient: "from-cedu-green-light to-[#b8f5dc]", icon: HardHat },
  "Operación de Máquinas Herramienta": { gradient: "from-yellow-100 to-yellow-200", icon: HardHat },
};

function getAreaStyle(area: string | null) {
  return AREA_STYLES[area || ""] || { gradient: "from-cedu-blue-light to-[#c7d9ff]", icon: BookOpen };
}

function CoursesSection() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const { data: allCourses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const filtered = allCourses.filter((c) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "other") {
      const mainAreas = AREA_FILTERS.slice(1, -1).map((f) => f.value);
      return !mainAreas.includes(c.areaTematica || "");
    }
    return c.areaTematica === activeFilter;
  });

  const displayed = showAll ? filtered : filtered.slice(0, 6);

  return (
    <section className="py-24 bg-cedu-cream relative overflow-hidden" id="courses" data-testid="section-courses">
      <FloatingShape className="w-3 h-3 rounded-full bg-cedu-orange/15 top-[10%] right-[8%] animate-float-y" delay={0} />
      <FloatingShape className="w-2 h-2 rounded-full bg-cedu-blue/15 top-[30%] left-[4%] animate-float-y-slow" delay={1.5} />

      <div className="max-w-[1160px] mx-auto px-6">
        <AnimatedSection className="text-center mb-10">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[3px] text-cedu-orange mb-3">
              <Diamond size={13} className="text-cedu-orange" /> Catálogo STPS <Diamond size={13} className="text-cedu-orange" />
            </div>
            <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight text-cedu-ink mb-4">
              29 cursos registrados ante la STPS
            </h2>
            <p className="text-[17px] text-cedu-ink-muted max-w-[580px] mx-auto leading-relaxed">
              Todos los cursos son gratuitos y al aprobar obtienes un diploma digital de participación gratuito, verificable en blockchain.
            </p>
          </motion.div>
        </AnimatedSection>

        <motion.div
          className="max-w-md mx-auto mb-8 flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-black/[0.06]"
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
        >
          <Trophy size={18} className="text-cedu-orange flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-[12px] font-bold text-cedu-ink mb-1">
              <span>Colección de cursos</span>
              <span className="text-cedu-blue">{allCourses.length || 29} disponibles</span>
            </div>
            <div className="h-2 rounded-full bg-cedu-cream overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-cedu-blue/20 to-cedu-violet/20 w-full" />
            </div>
          </div>
          <Link href="/auth" className="text-[11px] font-bold text-cedu-blue no-underline hover:underline whitespace-nowrap">
            Desbloquear →
          </Link>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-10" data-testid="filter-area">
          {AREA_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setActiveFilter(f.value); setShowAll(false); }}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold border transition-all cursor-pointer ${
                activeFilter === f.value
                  ? "bg-cedu-blue text-white border-cedu-blue"
                  : "bg-white text-cedu-ink-muted border-black/[0.08] hover:border-cedu-blue/30"
              }`}
              data-testid={`button-filter-${f.value}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-[20px] border border-black/[0.06] h-[340px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayed.map((course, i) => {
              const style = getAreaStyle(course.areaTematica);
              const IconComponent = style.icon;
              return (
                <motion.div
                  key={course.id}
                  className="group bg-white rounded-[20px] border border-black/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] overflow-visible flex flex-col card-shine-sweep"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i % 3}
                  data-testid={`card-course-${course.slug}`}
                >
                  <div className={`h-[160px] bg-gradient-to-br ${style.gradient} flex items-center justify-center relative rounded-t-[20px]`}>
                    <IconComponent size={56} className="text-cedu-ink/15" />
                    {course.dc3Disponible && (
                      <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-white bg-cedu-green flex items-center gap-1">
                        <BadgeCheck size={12} /> DC3
                      </span>
                    )}
                    <span className="absolute top-3.5 right-3.5 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-white bg-cedu-blue">
                      {course.nivel}
                    </span>
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-cedu-green bg-white/90 backdrop-blur-sm flex items-center gap-1 shadow-sm">
                      <Zap size={10} /> +{((i + 1) * 50)} XP
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-[10px] font-extrabold uppercase tracking-[2px] text-cedu-blue mb-1">{course.areaTematica}</div>
                    <h3 className="font-serif text-[17px] text-cedu-ink mb-2 leading-snug line-clamp-2">{course.title}</h3>
                    <p className="text-[12px] text-cedu-ink-muted leading-relaxed mb-3 line-clamp-2 flex-1">{course.description}</p>
                    <div className="flex flex-wrap gap-3 text-[12px] text-cedu-ink-muted">
                      <span className="flex items-center gap-1"><Clock size={13} /> {course.durationVirtualHrs || course.durationHrs}h</span>
                      <span className="flex items-center gap-1"><BookOpen size={13} /> {course.temas?.length || 0} temas</span>
                      <span className="flex items-center gap-1 truncate"><GraduationCap size={13} /> {course.instructor?.split(' ').slice(0, 2).join(' ')}</span>
                    </div>
                  </div>
                  <div className="px-5 py-3.5 border-t border-black/[0.06] flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="font-serif text-[20px] text-cedu-green">Diploma Gratis</div>
                      <div className="text-[10px] text-cedu-ink-muted">+$499 DC-3 · +$1,999 SEP (opcionales)</div>
                    </div>
                    <Link
                      href="/auth"
                      className="px-4 py-2 bg-cedu-ink text-white font-bold text-[12px] rounded-[10px] hover:bg-cedu-blue transition-all cursor-pointer no-underline"
                      data-testid={`button-view-course-${course.slug}`}
                    >
                      Inscribirme &rarr;
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {filtered.length > 6 && !showAll && (
          <div className="text-center mt-10">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-cedu-ink font-bold text-[15px] border-2 border-black/[0.12] rounded-[14px] hover:border-cedu-ink hover:bg-black/[0.02] transition-all cursor-pointer"
              data-testid="button-show-all-courses"
            >
              Ver los {filtered.length} cursos &rarr;
            </button>
          </div>
        )}

        <div className="text-center mt-4 text-[13px] text-cedu-ink-muted">
          {allCourses.length} cursos disponibles &bull; Diploma gratis + certificaciones opcionales DC-3 y SEP
        </div>
      </div>
    </section>
  );
}

function InstructorsSection() {
  const instructors = [
    {
      name: "Psic. Yuridia Iturriaga",
      title: "Capacitadora Externa Certificada",
      cedula: "7476024",
      universidad: "Universidad del Valle de México",
      specialty: "Psicología organizacional, desarrollo humano, NOM-035",
      courses: 10,
      gradient: "from-cedu-violet to-[#a855f7]",
      initials: "YI",
    },
    {
      name: "Lic. Jorge Armando Medina Castillo",
      title: "Agente Capacitador Verificado STPS",
      specialty: "Seguridad industrial, higiene laboral, normatividad técnica",
      courses: 19,
      gradient: "from-cedu-blue to-[#4f9fff]",
      initials: "MC",
    },
  ];

  return (
    <section className="py-24 bg-white" id="instructors" data-testid="section-instructors">
      <div className="max-w-[1160px] mx-auto px-6">
        <AnimatedSection className="text-center mb-14">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
            <div className="text-xs font-extrabold uppercase tracking-[3px] text-cedu-green mb-3">Verificados</div>
            <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight text-cedu-ink mb-4">
              Capacitadores verificados ante la STPS
            </h2>
            <p className="text-[17px] text-cedu-ink-muted max-w-[600px] mx-auto leading-relaxed">
              Nuestros instructores están registrados como agentes capacitadores externos ante la Secretaría del Trabajo y Previsión Social.
            </p>
          </motion.div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[900px] mx-auto mb-12">
          {instructors.map((inst, i) => (
            <motion.div
              key={i}
              className="bg-cedu-cream rounded-[20px] border border-black/[0.06] p-8 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              data-testid={`card-instructor-${i}`}
            >
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-[56px] h-[56px] rounded-2xl bg-gradient-to-br ${inst.gradient} flex items-center justify-center font-extrabold text-lg text-white shrink-0`}>
                  {inst.initials}
                </div>
                <div>
                  <h3 className="font-serif text-xl text-cedu-ink mb-1">{inst.name}</h3>
                  <p className="text-[13px] text-cedu-blue font-bold">{inst.title}</p>
                </div>
              </div>
              <p className="text-sm text-cedu-ink-muted leading-relaxed mb-4">{inst.specialty}</p>
              {"cedula" in inst && (
                <div className="text-[12px] text-cedu-ink-muted mb-2">
                  Cédula Profesional: <span className="font-bold text-cedu-ink">{inst.cedula}</span> &bull; {inst.universidad}
                </div>
              )}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-black/[0.06]">
                <div className="flex items-center gap-1.5 text-sm font-bold text-cedu-ink">
                  <BookOpen size={16} className="text-cedu-blue" />
                  {inst.courses} cursos registrados
                </div>
                <div className="flex items-center gap-1.5 text-sm text-cedu-green font-bold">
                  <ShieldCheck size={16} />
                  Verificado
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="max-w-[700px] mx-auto p-6 bg-cedu-cream rounded-2xl border border-black/[0.06] text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <ShieldCheck size={20} className="text-cedu-green" />
            <span className="font-bold text-sm text-cedu-ink">Validez Oficial</span>
          </div>
          <p className="text-[13px] text-cedu-ink-muted leading-relaxed mb-4">
            Los certificados DC3 emitidos por nuestros capacitadores tienen validez oficial ante la STPS y cumplen con el Art. 153 de la Ley Federal del Trabajo. No causan IVA al facturarse como Aportación a la Asociación (cooperativa).
          </p>
          <a
            href="https://agentes.stps.gob.mx/Buscador/BuscadorAgente.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-cedu-blue font-bold text-sm no-underline hover:underline"
            data-testid="link-stps-verify"
          >
            Verifica en agentes.stps.gob.mx <ExternalLink size={14} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

const steps = [
  { icon: ClipboardEdit, title: "Crea tu cuenta", desc: "Regístrate gratis como estudiante o empresa con tu correo." },
  { icon: Search, title: "Explora cursos", desc: "Navega el catálogo con recomendaciones de IA personalizadas." },
  { icon: Rocket, title: "Aprende a tu ritmo", desc: "Accede al contenido cuando quieras con tu tutor IA." },
  { icon: Award, title: "Obtén tu diploma", desc: "Recibe tu diploma digital gratuito verificable en blockchain. Opcionalmente agrega tu constancia DC-3 o Certificado SEP." },
];

function HowSection() {
  const stepColors = ["bg-cedu-blue", "bg-cedu-orange", "bg-cedu-violet", "bg-cedu-green"];
  const stepColorText = ["text-cedu-blue", "text-cedu-orange", "text-cedu-violet", "text-cedu-green"];
  const stepBgLight = ["bg-cedu-blue-light", "bg-cedu-orange-light", "bg-cedu-violet-light", "bg-cedu-green-light"];

  return (
    <section className="py-24 bg-white relative overflow-hidden" id="how" data-testid="section-how">
      <DecorativeDots className="top-16 right-16 text-cedu-orange hidden lg:block" />

      <div className="max-w-[1160px] mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[3px] text-cedu-orange mb-3">
              <Rocket size={14} /> Proceso
            </div>
            <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight text-cedu-ink mb-4">
              Tu aventura en 4 pasos
            </h2>
            <p className="text-[17px] text-cedu-ink-muted max-w-[520px] mx-auto leading-relaxed">
              De cero a diploma en un proceso simple y guiado.
            </p>
          </motion.div>
        </AnimatedSection>

        <div className="relative">
          <svg className="absolute top-[52px] left-0 w-full h-[4px] pointer-events-none hidden lg:block" preserveAspectRatio="none">
            <line x1="12%" y1="2" x2="88%" y2="2" stroke="#1b5adf" strokeWidth="2" strokeDasharray="8 6" opacity="0.12" />
            <circle cx="12%" cy="2" r="4" fill="#1b5adf" opacity="0.2" className="animate-pulse-dot" />
            <circle cx="37%" cy="2" r="4" fill="#f28023" opacity="0.2" className="animate-pulse-dot" style={{ animationDelay: "0.6s" }} />
            <circle cx="62%" cy="2" r="4" fill="#7c3aed" opacity="0.2" className="animate-pulse-dot" style={{ animationDelay: "1.2s" }} />
            <circle cx="88%" cy="2" r="4" fill="#00b87a" opacity="0.2" className="animate-pulse-dot" style={{ animationDelay: "1.8s" }} />
          </svg>

          <div className="hidden lg:block">
            <div className="grid grid-cols-4 gap-4">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="text-center relative"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  data-testid={`card-step-${i}`}
                >
                  <div className={`w-[52px] h-[52px] rounded-full ${stepColors[i]} mx-auto mb-6 flex items-center justify-center text-white font-extrabold text-lg shadow-lg relative z-10`}>
                    {i + 1}
                  </div>

                  <svg className="absolute top-[26px] left-[calc(50%+30px)] w-[calc(100%-60px)] h-[4px] pointer-events-none" style={{ display: i < 3 ? "block" : "none" }}>
                    <line x1="0" y1="2" x2="100%" y2="2" stroke={["#1b5adf", "#f28023", "#7c3aed"][i]} strokeWidth="2" strokeDasharray="6 4" opacity="0.15" />
                    <circle cx="50%" cy="2" r="3" fill={["#1b5adf", "#f28023", "#7c3aed"][i]} opacity="0.25" className="animate-pulse-dot" style={{ animationDelay: `${i * 0.5}s` }} />
                  </svg>

                  <div className="p-6 rounded-[20px] border border-black/[0.06] bg-cedu-cream relative">
                    <div className={`w-11 h-11 rounded-[12px] ${stepBgLight[i]} flex items-center justify-center mx-auto mb-3`}>
                      <step.icon size={24} className={stepColorText[i]} />
                    </div>
                    <h3 className="font-serif text-lg text-cedu-ink mb-2">{step.title}</h3>
                    <p className="text-[13px] text-cedu-ink-muted leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:hidden relative">
            <div className="absolute left-[26px] top-0 bottom-0 w-[2px] border-l-2 border-dashed border-cedu-blue/15" />
            <div className="flex flex-col gap-6">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-5 relative"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  data-testid={`card-step-mobile-${i}`}
                >
                  <div className={`w-[52px] h-[52px] rounded-full ${stepColors[i]} flex-shrink-0 flex items-center justify-center text-white font-extrabold text-lg shadow-lg relative z-10`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 p-5 rounded-[16px] border border-black/[0.06] bg-cedu-cream">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-9 h-9 rounded-[10px] ${stepBgLight[i]} flex items-center justify-center`}>
                        <step.icon size={20} className={stepColorText[i]} />
                      </div>
                      <h3 className="font-serif text-lg text-cedu-ink">{step.title}</h3>
                    </div>
                    <p className="text-[13px] text-cedu-ink-muted leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CertificationSection() {
  const tiers = [
    {
      icon: Award,
      title: "Diploma Digital de Participación",
      price: "Gratis",
      priceNote: "Siempre incluido",
      color: "bg-cedu-green",
      colorLight: "bg-emerald-100",
      colorText: "text-cedu-green",
      borderColor: "border-cedu-green/20",
      features: [
        "Verificable con tecnología blockchain",
        "Se emite automáticamente al aprobar",
        "Coleccionable como badge NFT 3D",
        "Visible en tu Wallet Ceduverse",
      ],
    },
    {
      icon: FileCheck,
      title: "Constancia DC-3 STPS",
      price: "$499",
      priceNote: "MXN · Opcional",
      color: "bg-cedu-orange",
      colorLight: "bg-orange-100",
      colorText: "text-cedu-orange",
      borderColor: "border-cedu-orange/20",
      features: [
        "Constancia de Competencias Laborales",
        "Validez oficial ante la STPS",
        "Emitida por agente capacitador registrado",
        "Requisito para auditorías laborales",
      ],
    },
    {
      icon: BadgeCheck,
      title: "Certificado SEP",
      price: "$1,999",
      priceNote: "MXN · Opcional",
      color: "bg-cedu-blue",
      colorLight: "bg-blue-100",
      colorText: "text-cedu-blue",
      borderColor: "border-cedu-blue/20",
      features: [
        "Validez oficial ante la SEP",
        "Respaldo académico institucional",
        "Reconocimiento a nivel nacional",
        "Ideal para crecimiento profesional",
      ],
    },
  ];

  return (
    <section id="certificaciones" className="py-24 bg-white relative overflow-hidden" data-testid="section-certifications">
      <div className="absolute -top-[150px] right-[10%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(0,184,122,0.06),transparent_60%)]" />
      <div className="absolute bottom-[10%] left-[5%] w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(27,90,223,0.05),transparent_60%)]" />

      <div className="max-w-[1160px] mx-auto px-6 relative z-10">
        <AnimatedSection className="text-center mb-16">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[3px] text-cedu-green mb-3">
              <Award size={13} className="fill-cedu-green" /> Certificaciones
            </div>
            <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight text-cedu-ink mb-4">
              Siempre hay una opción gratuita
            </h2>
            <p className="text-[17px] text-cedu-ink-muted max-w-[580px] mx-auto leading-relaxed">
              Todos nuestros cursos STPS incluyen un diploma digital gratuito al aprobar.
              Si necesitas documentos con validez oficial, puedes agregar certificaciones opcionales.
            </p>
          </motion.div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier, i) => (
            <motion.div
              key={i}
              className={`relative rounded-[20px] border ${tier.borderColor} bg-cedu-cream p-7 flex flex-col ${i === 0 ? "ring-2 ring-cedu-green/30" : ""}`}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              data-testid={`card-cert-tier-${i}`}
            >
              {i === 0 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cedu-green text-white text-[11px] font-bold px-4 py-1 rounded-full">
                  Incluido siempre
                </div>
              )}

              <div className={`w-14 h-14 ${tier.color} rounded-2xl flex items-center justify-center mb-5`}>
                <tier.icon size={28} className="text-white" />
              </div>

              <h3 className="font-serif text-xl text-cedu-ink mb-2">{tier.title}</h3>

              <div className="flex items-baseline gap-2 mb-5">
                <span className={`text-3xl font-extrabold ${tier.colorText}`}>{tier.price}</span>
                <span className="text-sm text-cedu-ink-muted">{tier.priceNote}</span>
              </div>

              <ul className="space-y-3 flex-1">
                {tier.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-cedu-ink-soft">
                    <Check size={16} className={`${tier.colorText} mt-0.5 shrink-0`} />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <AnimatedSection className="text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
            <div className="inline-flex items-center gap-3 bg-cedu-cream border border-black/[0.06] rounded-2xl px-6 py-4">
              <ShieldCheck size={20} className="text-cedu-green shrink-0" />
              <p className="text-sm text-cedu-ink-soft text-left">
                <strong className="text-cedu-ink">Sin sorpresas.</strong> Aprueba tu evaluación y recibe tu diploma digital automáticamente.
                Los certificados DC-3 y SEP son add-ons opcionales que puedes solicitar después.
              </p>
            </div>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}

const testimonials = [
  {
    text: "El tutor IA me ayudó a entender conceptos complejos de forma sencilla. La mejor inversión en mi carrera profesional.",
    name: "María Castillo",
    role: "Directora de Marketing, CDMX",
    initials: "MC",
    gradient: "from-cedu-blue to-[#4f9fff]",
  },
  {
    text: "Los diplomas blockchain dieron credibilidad real a mis logros. Mis empleadores lo valoraron inmediatamente.",
    name: "Roberto Luna",
    role: "Ingeniero, Monterrey",
    initials: "RL",
    gradient: "from-cedu-green to-[#00e5a0]",
  },
  {
    text: "Inscribimos a todo el equipo de ventas. El dashboard de gestión nos muestra el progreso en tiempo real.",
    name: "Andrea Pérez",
    role: "CEO, TechStart MX",
    initials: "AP",
    gradient: "from-cedu-orange to-[#ffa655]",
  },
];

function TestimonialsSection() {
  return (
    <section className="py-24 bg-cedu-ink text-white relative overflow-hidden" data-testid="section-testimonials">
      <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(27,90,223,0.15),transparent_60%)]" />
      <div className="absolute bottom-[10%] left-[5%] w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(242,128,35,0.08),transparent_60%)]" />

      <div className="absolute top-[15%] left-[8%] text-white/[0.04] hidden lg:block">
        <Quote size={120} />
      </div>
      <div className="absolute bottom-[10%] right-[5%] text-white/[0.04] hidden lg:block" style={{ transform: "rotate(180deg)" }}>
        <Quote size={80} />
      </div>

      <FloatingShape className="w-2 h-2 rounded-full bg-cedu-blue/30 top-[20%] right-[15%] animate-float-y" delay={0} />
      <FloatingShape className="w-1.5 h-1.5 rounded-full bg-cedu-orange/30 bottom-[25%] left-[20%] animate-float-y-slow" delay={1} />

      <div className="max-w-[1160px] mx-auto px-6 relative z-10">
        <AnimatedSection className="text-center mb-16">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[3px] text-cedu-orange mb-3">
              <Star size={13} className="fill-cedu-orange" /> Testimonios
            </div>
            <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight text-white mb-4">
              Lo que dicen nuestros estudiantes
            </h2>
            <p className="text-[17px] text-white/50 max-w-[520px] mx-auto leading-relaxed">
              Miles de profesionales ya transformaron su carrera.
            </p>
          </motion.div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="p-8 rounded-[20px] bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] transition-all relative group"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              data-testid={`card-testimonial-${i}`}
            >
              <Quote size={24} className="absolute top-4 right-5 text-white/[0.06] group-hover:text-white/[0.1] transition-colors" />
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={15} className="text-cedu-orange fill-cedu-orange" />
                ))}
              </div>
              <p className="text-[15px] leading-relaxed text-white/70 mb-5 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-[42px] h-[42px] rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center font-extrabold text-[15px] text-white`}>
                  {t.initials}
                </div>
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-xs text-white/40">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingVaultCard({ side }: { side: string }) {
  return (
    <div className="w-[260px] h-[164px] rounded-2xl relative overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.12)] border border-cedu-orange/20 card-shine-sweep"
      style={{ background: side === "front" ? "linear-gradient(145deg, #1a1a2e, #2a2a4e 40%, #1a1510)" : "linear-gradient(145deg, #1a1a2e, #2a2a4e)" }}>
      <svg viewBox="0 0 260 164" width="260" height="164" className="absolute opacity-[0.06]">
        <line x1="20" y1="30" x2="80" y2="30" stroke="#c49a1a" /><line x1="80" y1="30" x2="80" y2="60" stroke="#c49a1a" />
        <line x1="80" y1="60" x2="140" y2="60" stroke="#c49a1a" /><line x1="180" y1="40" x2="240" y2="40" stroke="#c49a1a" />
      </svg>
      {side === "front" ? (
        <>
          <svg viewBox="0 0 50 44" width="38" height="33" className="absolute top-[22px] left-[22px]">
            <polygon points="25,2 47,13 47,33 25,42 3,33 3,13" fill="none" stroke="#c49a1a" strokeWidth="1.5" opacity="0.5" />
            <text x="25" y="30" textAnchor="middle" fill="#c49a1a" fontSize="14" fontWeight="bold" opacity="0.6">V</text>
          </svg>
          <div className="absolute top-[26px] right-[18px] text-[7px] text-amber-600/40 font-mono text-right tracking-widest">ACERO{"\n"}INOXIDABLE</div>
          <div className="absolute bottom-[44px] left-[24px] text-[15px] font-extrabold text-amber-600 font-serif">Ceduverse</div>
          <div className="absolute bottom-[28px] left-[24px] text-[8px] text-amber-600/50 font-mono tracking-[2px]">VAULT · BLACK EDITION</div>
          <div className="absolute bottom-[12px] right-[18px] text-[7px] text-amber-600/35 font-mono">COLD STORAGE ONLY</div>
        </>
      ) : (
        <>
          <div className="absolute top-[12px] left-[18px] text-[9px] font-extrabold text-amber-600 font-serif">Ceduverse</div>
          <div className="absolute top-[8px] right-[14px] w-9 h-9 border border-amber-600/20 rounded flex items-center justify-center">
            <span className="text-[6px] text-amber-600/40 font-mono text-center">QR{"\n"}NFT</span>
          </div>
          <div className="absolute top-[50px] left-[18px] right-[18px]">
            <div className="text-[6px] text-amber-600/40 font-mono mb-1">Este certificado pertenece a:</div>
            <div className="border-b border-amber-600/15 h-[14px]" />
          </div>
          <div className="absolute top-[76px] left-[18px] right-[18px]">
            <div className="text-[5px] text-amber-600/40 font-mono text-center mb-[3px]">Frase semilla secreta de recuperación</div>
            <div className="grid grid-cols-4 gap-[2px]">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-[11px] border border-amber-600/[0.18] rounded-sm text-[5px] text-amber-600/25 font-mono flex items-center justify-center">{i + 1}</div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-[6px] left-[18px] text-[5px] text-amber-600/30 font-mono">Nunca compartas tu frase secreta</div>
          <div className="absolute bottom-[6px] right-[18px] text-[5px] text-amber-600/30 font-mono">ceduverse.org</div>
        </>
      )}
    </div>
  );
}

function CedustoreSection() {
  const [side, setSide] = useState("front");
  const fmt = (n: number) => "$" + n.toLocaleString("es-MX");

  return (
    <section className="py-24 bg-white relative overflow-hidden" id="cedustore" data-testid="section-cedustore">
      <FloatingShape className="w-40 h-40 rounded-full bg-cedu-orange/[0.03] top-20 -right-10 animate-float-y-slow" delay={0.5} />
      <FloatingShape className="w-32 h-32 rounded-full bg-cedu-blue/[0.04] bottom-24 -left-8 animate-float-x" delay={1} />

      <div className="max-w-[1160px] mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-cedu-orange-light rounded-full text-[13px] font-bold text-cedu-orange mb-6"
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
          >
            <Tag size={14} /> Cedustore
          </motion.div>
          <motion.h2
            className="font-serif text-[clamp(2rem,4.5vw,3rem)] leading-tight tracking-tight text-cedu-ink mb-4"
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
          >
            Tu kit de <em className="text-cedu-orange not-italic italic">autocustodia</em>
          </motion.h2>
          <motion.p
            className="text-[17px] text-cedu-ink-muted max-w-lg mx-auto leading-relaxed"
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}
          >
            Protege tus activos digitales con hardware de grado profesional. Envío a toda la república.
          </motion.p>
        </AnimatedSection>

        <div className="flex gap-6 flex-wrap justify-center">
          <motion.div
            className="flex-1 min-w-[320px] max-w-[540px] bg-white border border-cedu-orange/10 rounded-2xl p-6 card-shine-sweep"
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3}
            data-testid="card-vault-kit"
          >
            <div className="flex gap-6 flex-wrap items-center">
              <div className="flex-shrink-0 flex flex-col items-center gap-2.5">
                <LandingVaultCard side={side} />
                <div className="flex gap-1.5">
                  {(["front", "back"] as const).map((s) => (
                    <button key={s} onClick={() => setSide(s)} data-testid={`btn-vault-${s}`}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono cursor-pointer border ${side === s ? "bg-cedu-orange-light border-cedu-orange/30 text-cedu-orange" : "bg-transparent border-black/[0.06] text-cedu-ink-muted"}`}>
                      {s === "front" ? "Frente" : "Reverso"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <h3 className="text-xl font-extrabold text-cedu-ink mb-1">
                  Ceduverse Vault Kit <span className="text-[10px] bg-cedu-orange-light text-cedu-orange px-2 py-0.5 rounded-lg font-mono ml-1">Black Edition</span>
                </h3>
                <p className="text-2xl font-extrabold text-cedu-orange font-mono mb-2">{fmt(2999)} <span className="text-xs font-normal text-cedu-ink-muted">MXN</span></p>
                <p className="text-xs text-cedu-ink-muted leading-relaxed mb-3">
                  Tarjeta metálica acero inoxidable <strong className="text-cedu-orange">sin chip bancario</strong> — cold storage exclusivo. Grid grabable para frase semilla, QR a NFT en Polygon, scriber de tungsteno y estuche personalizado.
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { icon: Shield, label: "Acero inoxidable" },
                    { icon: Lock, label: "Cold storage" },
                    { icon: Wallet, label: "12/18/24 palabras" },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cedu-orange-light/50 border border-cedu-orange/10 rounded-lg text-[10px] text-cedu-orange font-bold">
                      <f.icon size={11} /> {f.label}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-cedu-ink-muted font-mono flex items-center gap-1"><Package size={10} /> 30–45 días (edición especial)</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex-1 min-w-[320px] max-w-[540px] bg-cedu-blue-light/20 border border-cedu-blue/10 rounded-2xl p-6"
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={4}
            data-testid="card-tangem"
          >
            <h3 className="text-xl font-extrabold text-cedu-ink mb-2">Tangem Wallet</h3>
            <p className="text-xs text-cedu-ink-muted leading-relaxed mb-5">
              Hardware NFC, chip EAL6+ IP68, sin batería. Seedless o frase semilla. 85+ blockchains. Garantía 25 años.
            </p>
            <div className="flex flex-col gap-3 mb-5">
              {[
                { label: "2 tarjetas", sub: "1 principal + 1 backup", price: 1375 },
                { label: "3 tarjetas", sub: "1 principal + 2 backup", price: 1750 },
              ].map((t, i) => (
                <div key={i} className="p-4 bg-white border border-cedu-blue/10 rounded-xl" data-testid={`card-tangem-${i}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-bold text-cedu-ink">{t.label}</div>
                      <div className="text-[9px] text-cedu-ink-muted font-mono">{t.sub}</div>
                    </div>
                    <div className="text-lg font-extrabold text-cedu-blue font-mono">{fmt(t.price)} <span className="text-xs font-normal text-cedu-ink-muted">MXN</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: Cpu, label: "Chip EAL6+" },
                { icon: Shield, label: "IP68" },
                { icon: Wallet, label: "85+ blockchains" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cedu-blue-light/50 border border-cedu-blue/10 rounded-lg text-[10px] text-cedu-blue font-bold">
                  <f.icon size={11} /> {f.label}
                </div>
              ))}
            </div>
            <div className="text-[10px] text-cedu-ink-muted font-mono flex items-center gap-1 mt-3"><Package size={10} /> 30–60 días (producto importado)</div>
          </motion.div>
        </div>

        <AnimatedSection className="text-center mt-10">
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-cedu-orange text-white font-extrabold text-sm rounded-[14px] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(242,128,35,0.3)] transition-all no-underline group"
            data-testid="button-cedustore-cta"
          >
            Ir a la Tienda <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </AnimatedSection>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 bg-cedu-cream relative" data-testid="section-cta">
      <div className="max-w-[1160px] mx-auto px-6">
        <motion.div
          className="max-w-[700px] mx-auto py-16 px-12 bg-gradient-to-br from-cedu-blue to-cedu-blue-dark rounded-[32px] text-center relative overflow-hidden"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
        >
          <div className="absolute -top-1/2 -right-[30%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="absolute top-[10%] left-[8%] bg-[radial-gradient(circle,rgba(242,128,35,0.1),transparent_60%)] w-[200px] h-[200px]" />

          <div className="absolute top-6 left-8 animate-float-y-slow hidden sm:block">
            <Trophy size={28} className="text-white/10" />
          </div>
          <div className="absolute top-10 right-10 animate-float-y hidden sm:block" style={{ animationDelay: "1s" }}>
            <Star size={22} className="text-cedu-orange/20 fill-cedu-orange/20" />
          </div>
          <div className="absolute bottom-10 left-12 animate-float-x hidden sm:block" style={{ animationDelay: "0.5s" }}>
            <Medal size={24} className="text-white/10" />
          </div>
          <div className="absolute bottom-8 right-16 animate-float-y-slow hidden sm:block" style={{ animationDelay: "2s" }}>
            <Sparkles size={20} className="text-cedu-orange/15" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-[12px] font-bold text-white/80 mb-5 relative">
            <Zap size={13} className="text-cedu-orange" />
            Nivel 1 → ∞
          </div>

          <h2 className="font-serif text-[clamp(2rem,4vw,2.8rem)] text-white leading-tight mb-4 relative">
            Empieza a aprender<br />sin costo.
          </h2>
          <p className="text-[17px] text-white/75 mb-8 relative max-w-[440px] mx-auto leading-relaxed">
            Accede a cursos gratuitos, crea tu billetera digital y construye el futuro que mereces.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-9 py-4 bg-white text-cedu-blue-dark font-extrabold text-base rounded-[14px] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all no-underline relative group"
            data-testid="button-cta-create-account"
          >
            <Rocket size={18} className="group-hover:animate-bounce-subtle" />
            Crear Cuenta Gratis &rarr;
          </Link>
          <div className="text-[13px] text-white/50 mt-4 relative">Sin tarjeta de crédito &bull; Cancela cuando quieras</div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="pt-16 pb-8 bg-white border-t border-black/[0.06]" data-testid="section-footer">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2.5 no-underline mb-3">
              <div className="w-9 h-9 bg-cedu-blue rounded-[10px] flex items-center justify-center text-white font-serif text-xl">C</div>
              <div className="font-serif text-2xl text-cedu-ink tracking-tight" translate="no">Cedu<em className="text-cedu-blue not-italic italic">verse</em></div>
            </a>
            <p className="text-sm text-cedu-ink-muted leading-relaxed max-w-[280px]">
              Educación potenciada por IA y respaldada por blockchain. Transformando el aprendizaje en Latinoamérica.
            </p>
          </div>

          {[
            {
              heading: "Plataforma",
              links: [
                { label: "Catálogo", href: "/conferencias" },
                { label: "Para Empresas", href: "/empresas" },
                { label: "Instructores", href: "/socios" },
                { label: "Diplomas", href: "/auth", authHref: "/dashboard?tab=certificados" },
              ],
            },
            {
              heading: "Recursos",
              links: [
                { label: "Ayuda", href: "/mensajes" },
                { label: "Comunidad", href: "#", soon: true },
                { label: "API", href: "#", soon: true },
              ],
            },
            {
              heading: "Legal",
              links: [
                { label: "Términos", href: "/terminos" },
                { label: "Privacidad", href: "/privacidad" },
                { label: "Cookies", href: "/cookies" },
                { label: "Contacto", href: "mailto:contacto@ceduverse.org" },
              ],
            },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="text-xs font-extrabold uppercase tracking-[2px] text-cedu-ink-muted mb-4">{col.heading}</h4>
              <ul className="list-none space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"soon" in link && link.soon ? (
                      <span
                        className="text-cedu-ink-muted/50 text-sm cursor-default"
                        title="Próximamente"
                        data-testid={`link-footer-${link.label.toLowerCase()}`}
                      >
                        {link.label}
                      </span>
                    ) : (
                      <a
                        href={link.href}
                        className="text-cedu-ink-soft text-sm no-underline hover:text-cedu-blue transition-colors"
                        data-testid={`link-footer-${link.label.toLowerCase()}`}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-black/[0.06] text-[13px] text-cedu-ink-muted gap-4">
          <div>&copy; 2026 Ceduverse. Todos los derechos reservados.</div>
          <div className="flex gap-2">
            {["X", "in", "YT", "FB"].map((social) => (
              <span
                key={social}
                title="Próximamente"
                className="w-[34px] h-[34px] rounded-[10px] border border-black/[0.08] flex items-center justify-center text-cedu-ink-muted/50 text-sm cursor-default"
                data-testid={`link-social-${social.toLowerCase()}`}
              >
                {social}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  useForceLightMode();
  return (
    <div className="min-h-screen bg-cedu-cream overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <MarqueeStrip />
        <FeaturesSection />
        <CoursesSection />
        <InstructorsSection />
        <HowSection />
        <CertificationSection />
        <TestimonialsSection />
        <CedustoreSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
