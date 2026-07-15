import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useForceLightMode } from "@/components/ThemeProvider";
import { writeCeduCart } from "@/lib/cedu-cart-handoff";
import {
  Lock, ArrowRight, ShieldCheck, CreditCard, Wallet, ChevronDown, ChevronRight,
  Minus, Plus, Package, Check, AlertTriangle, HelpCircle, Sparkles, Link2, Award,
  Eye, EyeOff, Smartphone, Fingerprint, KeyRound, Shield, Layers, Boxes, Coins,
  BadgeCheck, Scale, Truck, Tag, Menu, X, CircleDollarSign, Globe, Cpu, Hexagon,
  Sun, Diamond, Triangle, Circle, Database, Gem, Landmark, Zap, Binary,
} from "lucide-react";

const ACCESS_CODE = "ceduverse2026";
const PRICES = { vault: 2999, tangem2: 1375, tangem3: 1750 };
const fmt = (n: number) => "$" + n.toLocaleString("es-MX");
const UMA_2026 = 113.14;

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
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

function FloatingShape({ className, delay = 0 }: { className?: string; delay?: number }) {
  return <div className={`absolute pointer-events-none ${className}`} style={{ animationDelay: `${delay}s` }} aria-hidden="true" />;
}

function HexShape({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[3px] text-cedu-orange mb-3">
      {children}
    </div>
  );
}

function StatCard({ number, label, sub, color = "blue" }: { number: string; label: string; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = { blue: "text-cedu-blue", orange: "text-cedu-orange", green: "text-cedu-green", violet: "text-cedu-violet" };
  return (
    <div className="flex-1 basis-[130px] text-center py-5 px-3 bg-white rounded-2xl border border-black/[0.06]">
      <div className={`text-[28px] font-extrabold leading-none ${colorMap[color] || "text-cedu-blue"}`}>{number}</div>
      <div className="text-xs font-bold text-cedu-ink mt-1.5">{label}</div>
      {sub && <div className="text-[10px] text-cedu-ink-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function HoverCard({ children, highlight, className }: { children: React.ReactNode; highlight?: boolean; className?: string }) {
  return (
    <div className={`rounded-[20px] p-7 relative overflow-hidden transition-all duration-300 group
      hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] hover:border-transparent
      ${highlight ? "bg-cedu-blue-light/60 border border-cedu-blue/30" : "bg-white border border-black/[0.06]"}
      ${className || ""}`}>
      {children}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cedu-blue to-cedu-orange scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  );
}

function InlineBadge({ children, color = "blue" }: { children: React.ReactNode; color?: string }) {
  const m: Record<string, string> = {
    blue: "bg-cedu-blue-light text-cedu-blue",
    orange: "bg-cedu-orange-light text-cedu-orange",
    green: "bg-cedu-green-light text-cedu-green",
    violet: "bg-cedu-violet-light text-cedu-violet",
    ink: "bg-cedu-ink text-white",
    coral: "bg-red-100 text-cedu-coral",
  };
  return <span className={`inline-flex items-center gap-1.5 px-3.5 py-[5px] rounded-full text-xs font-bold ${m[color] || m.blue}`}>{children}</span>;
}

function VaultCardVisual({ side = "front" }: { side?: "front" | "back" }) {
  return (
    <div className="w-[220px] h-[138px] rounded-[14px] relative overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.1)] border border-amber-600/15 card-shine-sweep"
      style={{ background: side === "front" ? "linear-gradient(145deg, #1a1a2e, #2a2a4e 40%, #1a1510)" : "linear-gradient(145deg, #1a1a2e, #2a2a4e)" }}>
      <svg viewBox="0 0 220 138" width="220" height="138" className="absolute opacity-[0.06]">
        <line x1="16" y1="25" x2="70" y2="25" stroke="#c49a1a" /><line x1="70" y1="25" x2="70" y2="50" stroke="#c49a1a" />
      </svg>
      {side === "front" ? (
        <>
          <svg viewBox="0 0 50 44" width="32" height="28" className="absolute top-[18px] left-[18px]">
            <polygon points="25,2 47,13 47,33 25,42 3,33 3,13" fill="none" stroke="#c49a1a" strokeWidth="1.5" opacity="0.5" />
            <text x="25" y="30" textAnchor="middle" fill="#c49a1a" fontSize="14" fontWeight="bold" opacity="0.6">V</text>
          </svg>
          <div className="absolute top-[22px] right-[14px] text-[6px] text-amber-600/40 font-mono text-right tracking-widest leading-[1.3]">ACERO{"\n"}INOXIDABLE</div>
          <div className="absolute bottom-[36px] left-[18px] text-[13px] font-extrabold text-amber-600 font-serif">Ceduverse</div>
          <div className="absolute bottom-[22px] left-[18px] text-[7px] text-amber-600/50 font-mono tracking-[2px]">VAULT · BLACK EDITION</div>
          <div className="absolute bottom-[8px] right-[14px] text-[6px] text-amber-600/35 font-mono">COLD STORAGE ONLY</div>
        </>
      ) : (
        <>
          <div className="absolute top-[10px] left-[16px] text-[8px] font-extrabold text-amber-600 font-serif">Ceduverse</div>
          <div className="absolute top-[7px] right-[12px] w-8 h-8 border border-amber-600/20 rounded flex items-center justify-center">
            <span className="text-[5px] text-amber-600/40 font-mono text-center">QR{"\n"}NFT</span>
          </div>
          <div className="absolute top-[42px] left-[16px] right-[16px]">
            <div className="text-[5px] text-amber-600/40 font-mono mb-0.5">Este certificado pertenece a:</div>
            <div className="border-b border-amber-600/15 h-[12px]" />
          </div>
          <div className="absolute top-[62px] left-[16px] right-[16px]">
            <div className="text-[4.5px] text-amber-600/40 font-mono text-center mb-[2px]">Frase semilla secreta de recuperación</div>
            <div className="grid grid-cols-4 gap-[1.5px]">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-[10px] border border-amber-600/[0.18] rounded-sm text-[4.5px] text-amber-600/25 font-mono flex items-center justify-center">{i + 1}</div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-[5px] left-[16px] text-[4.5px] text-amber-600/30 font-mono">Nunca compartas tu frase secreta</div>
          <div className="absolute bottom-[5px] right-[14px] text-[4.5px] text-amber-600/30 font-mono">ceduverse.org</div>
        </>
      )}
    </div>
  );
}

function TangemCardVisual({ side = "front", label = "CARD 1" }: { side?: "front" | "back"; label?: string }) {
  return (
    <div className="w-[220px] h-[138px] rounded-[14px] relative overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.1)] border border-white/[0.08]"
      style={{ background: side === "front" ? "linear-gradient(145deg, #0a0a0f, #16162a 60%, #0f0f1a)" : "linear-gradient(145deg, #0a0a0f, #12121f)" }}>
      {side === "front" ? (
        <>
          <div className="absolute top-[18px] left-[18px]">
            <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full border border-white/15 flex items-center justify-center">
                <div className="text-[5px] text-white/40 font-mono">NFC</div>
              </div>
            </div>
          </div>
          <div className="absolute top-[20px] right-[16px] text-[6px] text-white/25 font-mono tracking-widest">{label}</div>
          <div className="absolute bottom-[36px] left-[18px] text-[15px] font-extrabold text-white/80 tracking-[3px]">TANGEM</div>
          <div className="absolute bottom-[20px] left-[18px] text-[6px] text-white/30 font-mono tracking-[1.5px]">HARDWARE WALLET · EAL6+</div>
          <div className="absolute bottom-[8px] right-[14px] text-[5.5px] text-white/20 font-mono">Samsung S3D350A</div>
        </>
      ) : (
        <>
          <div className="absolute top-[14px] left-[16px] text-[7px] text-white/50 font-mono tracking-[2px]">TANGEM</div>
          <div className="absolute top-[14px] right-[14px] text-[6px] text-white/25 font-mono">{label}</div>
          <div className="absolute top-[34px] left-[16px] right-[16px]">
            <div className="w-full h-[32px] rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
              <div className="text-center">
                <div className="text-[5px] text-white/30 font-mono mb-0.5">NFC SECURE ELEMENT</div>
                <div className="text-[4.5px] text-white/20 font-mono">CHIP EAL6+ CERTIFIED</div>
              </div>
            </div>
          </div>
          <div className="absolute top-[74px] left-[16px] right-[16px]">
            <div className="flex gap-1.5 mb-1">
              {["IP68", "25 YR", "NO BATTERY", "SEEDLESS"].map((t, i) => (
                <div key={i} className="px-1.5 py-0.5 border border-white/[0.06] rounded text-[4px] text-white/25 font-mono">{t}</div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-[20px] left-[16px] text-[4.5px] text-white/20 font-mono">81+ blockchains · 6,000+ activos</div>
          <div className="absolute bottom-[8px] left-[16px] text-[4.5px] text-white/15 font-mono">Firmware inmutable · Audited by Kudelski & Riscure</div>
        </>
      )}
    </div>
  );
}

function Qty({ value, onInc, onDec }: { value: number; onInc: () => void; onDec: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onDec} data-testid="btn-qty-dec"
        className="w-7 h-7 rounded-md border border-black/[0.06] bg-cedu-cream cursor-pointer text-sm text-cedu-ink-muted font-bold flex items-center justify-center">−</button>
      <span className="text-[13px] font-bold text-cedu-ink font-mono min-w-[20px] text-center">{value}</span>
      <button onClick={onInc} data-testid="btn-qty-inc"
        className="w-7 h-7 rounded-md border border-black/[0.06] bg-cedu-cream cursor-pointer text-sm text-cedu-blue font-bold flex items-center justify-center">+</button>
    </div>
  );
}

function ModeloSection() {
  return (
    <AnimatedSection>
      <div className="text-center pt-[72px] pb-9">
        <SectionLabel>🏛️ 01 · Ecosistema</SectionLabel>
        <motion.h1 className="font-serif text-[clamp(2rem,5vw,3.2rem)] leading-[1.08] tracking-tight text-cedu-ink mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          El Ecosistema <em className="text-cedu-blue italic">Ceduverse</em>
        </motion.h1>
        <motion.p className="text-[15px] text-cedu-ink-muted max-w-[640px] mx-auto leading-[1.7]" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          Plataforma cooperativa de educación, capacitación y certificación. Las empresas afiliadas inscriben a su Comisión Mixta de Capacitación, permitiendo que sus integrantes participen como <strong className="text-cedu-ink">socios cooperativistas</strong> y accedan a los beneficios de la cooperativa.
        </motion.p>
      </div>

      <div className="flex gap-3 flex-wrap mb-7">
        <StatCard number="1,066" label="Cursos Totales" sub="29 STPS + 49 IA + 988 Academy" color="orange" />
        <StatCard number="4" label="Certificaciones" sub="DC-3 · DC-5 · Diploma · NFT" color="green" />
        <StatCard number="3" label="Planes UMA" sub="Impulsa · Transforma · Lidera" color="violet" />
      </div>

      <HoverCard className="mb-5">
        <h3 className="text-lg font-serif text-cedu-ink mb-4">Comunidad Ceduverse</h3>
        <div className="flex gap-3.5 flex-wrap">
          {[
            { icon: "🏢", title: "Empresas Afiliadas", desc: "Cumplen STPS, inscriben comisiones mixtas, invierten en capacitación.", color: "cedu-orange", count: "Comisiones Mixtas STPS" },
            { icon: "🤝", title: "Socios Cooperativistas", desc: "Integrantes de comisiones mixtas asociados a la cooperativa. Reciben anticipos, rendimientos y excedentes.", color: "cedu-blue", count: "Comisiones Mixtas" },
            { icon: "🧑‍🎓", title: "Estudiantes", desc: "Personas individuales que acceden a cursos, diplomados y certificaciones en la plataforma.", color: "cedu-green", count: "Aula Virtual + Academy" },
            { icon: "🧑‍🏫", title: "Instructores", desc: "Facilitadores certificados DC-5 que imparten cursos dentro del ecosistema cooperativo.", color: "cedu-violet", count: "Con aptitud STPS" },
          ].map((p, i) => (
            <div key={i} className={`flex-1 min-w-[240px] p-[18px] rounded-[14px] border
              ${p.color === "cedu-orange" ? "bg-cedu-orange/[0.03] border-cedu-orange/[0.09]" : ""}
              ${p.color === "cedu-blue" ? "bg-cedu-blue/[0.03] border-cedu-blue/[0.09]" : ""}
              ${p.color === "cedu-green" ? "bg-cedu-green/[0.03] border-cedu-green/[0.09]" : ""}
              ${p.color === "cedu-violet" ? "bg-cedu-violet/[0.03] border-cedu-violet/[0.09]" : ""}`}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[22px]
                  ${p.color === "cedu-orange" ? "bg-cedu-orange/[0.08]" : ""}
                  ${p.color === "cedu-blue" ? "bg-cedu-blue/[0.08]" : ""}
                  ${p.color === "cedu-green" ? "bg-cedu-green/[0.08]" : ""}
                  ${p.color === "cedu-violet" ? "bg-cedu-violet/[0.08]" : ""}`}>{p.icon}</div>
                <div>
                  <div className={`text-sm font-bold ${p.color === "cedu-orange" ? "text-cedu-orange" : p.color === "cedu-blue" ? "text-cedu-blue" : p.color === "cedu-green" ? "text-cedu-green" : "text-cedu-violet"}`}>{p.title}</div>
                  <div className="text-[10px] text-cedu-ink-muted">{p.count}</div>
                </div>
              </div>
              <p className="text-xs text-cedu-ink-soft leading-relaxed m-0">{p.desc}</p>
            </div>
          ))}
        </div>
      </HoverCard>

      <HoverCard className="mb-5">
        <h3 className="text-lg font-serif text-cedu-ink mb-4">Plataforma E-Learning</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {[
            { icon: "📋", name: "Aula Virtual", sub: "29 cursos STPS", desc: "Conferencias de temas STPS con diploma digital y DC-3 disponible.", color: "text-cedu-blue" },
            { icon: "🤖", name: "Tutor IA", sub: "49 cursos con IA", desc: "Cursos personalizados por instructores y la IA, listos para escuchar.", color: "text-cedu-violet" },
            { icon: "📚", name: "Academy", sub: "988 cursos", desc: "Biblioteca completa. Diplomados, talleres, especializaciones.", color: "text-cedu-orange" },
            { icon: "🔗", name: "Certificados Blockchain", sub: "NFTs en Polygon", desc: "DC-3, DC-5, diplomas como tokens verificables e inmutables.", color: "text-cedu-green" },
          ].map((m, i) => (
            <div key={i} className="p-4 bg-cedu-cream rounded-xl border border-black/[0.06]">
              <div className="text-[22px] mb-1.5">{m.icon}</div>
              <div className={`text-[13px] font-bold ${m.color}`}>{m.name}</div>
              <div className="text-[10px] text-cedu-ink-muted mb-1.5">{m.sub}</div>
              <p className="text-[11px] text-cedu-ink-soft leading-snug m-0">{m.desc}</p>
            </div>
          ))}
        </div>
      </HoverCard>

      <HoverCard className="mb-5">
        <h3 className="text-lg font-serif text-cedu-ink mb-4">Tipos de Certificación</h3>
        <div className="flex gap-3 flex-wrap">
          {[
            { code: "DC-3", name: "Constancia de Competencias", desc: "Acredita capacitación ante STPS.", color: "cedu-blue", icon: "📄" },
            { code: "DC-5", name: "Constancia de Aptitud", desc: "Certifica al instructor ante STPS.", color: "cedu-orange", icon: "🏅" },
            { code: "Diploma", name: "Diploma Cooperativo", desc: "Reconocimiento por cursos completados.", color: "cedu-violet", icon: "🎓" },
            { code: "NFT", name: "Certificado Blockchain", desc: "Token en Polygon verificable, inmutable, portable.", color: "cedu-green", icon: "🔗" },
          ].map((c, i) => (
            <div key={i} className={`flex-1 min-w-[220px] px-[18px] py-4 rounded-xl border flex gap-3 items-start
              ${c.color === "cedu-blue" ? "bg-cedu-blue/[0.03] border-cedu-blue/[0.09]" : ""}
              ${c.color === "cedu-orange" ? "bg-cedu-orange/[0.03] border-cedu-orange/[0.09]" : ""}
              ${c.color === "cedu-violet" ? "bg-cedu-violet/[0.03] border-cedu-violet/[0.09]" : ""}
              ${c.color === "cedu-green" ? "bg-cedu-green/[0.03] border-cedu-green/[0.09]" : ""}`}>
              <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0
                ${c.color === "cedu-blue" ? "bg-cedu-blue/[0.08]" : ""}
                ${c.color === "cedu-orange" ? "bg-cedu-orange/[0.08]" : ""}
                ${c.color === "cedu-violet" ? "bg-cedu-violet/[0.08]" : ""}
                ${c.color === "cedu-green" ? "bg-cedu-green/[0.08]" : ""}`}>{c.icon}</div>
              <div>
                <div className={`text-[13px] font-bold ${c.color === "cedu-blue" ? "text-cedu-blue" : c.color === "cedu-orange" ? "text-cedu-orange" : c.color === "cedu-violet" ? "text-cedu-violet" : "text-cedu-green"}`}>{c.code}</div>
                <div className="text-[11px] font-semibold text-cedu-ink mb-0.5">{c.name}</div>
                <div className="text-[10px] text-cedu-ink-soft leading-snug">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </HoverCard>

      <HoverCard className="mb-5">
        <h3 className="text-lg font-serif text-cedu-ink mb-4">Estructura</h3>
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px] p-5 bg-cedu-blue-light rounded-[14px] text-center">
            <div className="text-[28px] mb-1.5">🏛️</div>
            <div className="text-sm font-extrabold text-cedu-blue">Ceduverse S.C. de C. de RL de CV</div>
            <div className="text-[11px] text-cedu-ink-soft mt-1">Cooperativa operadora de la plataforma</div>
            <div className="text-[10px] text-cedu-ink-muted mt-0.5">ceduverse.org · Propietaria de IP y operaciones</div>
          </div>
          <div className="flex-1 min-w-[260px] p-5 bg-cedu-violet-light rounded-[14px] text-center">
            <div className="flex justify-center gap-1 mb-1.5">
              <span className="text-[22px]">🤝</span><span className="text-[22px]">🧑‍🎓</span><span className="text-[22px]">🧑‍🏫</span>
            </div>
            <div className="text-sm font-extrabold text-cedu-violet">Socios + Estudiantes + Instructores</div>
            <div className="text-[11px] text-cedu-ink-soft mt-1">Participantes del ecosistema educativo</div>
            <div className="text-[10px] text-cedu-ink-muted mt-0.5">Cooperativistas, personas individuales, facilitadores</div>
          </div>
        </div>
      </HoverCard>

      <HoverCard className="mb-7">
        <h3 className="text-lg font-serif text-cedu-ink mb-4">Economía Circular Cooperativa</h3>
        <p className="text-[13px] text-cedu-ink-soft leading-[1.7] mb-4">Ciclo virtuoso donde la inversión en capacitación genera valor que retorna a los participantes.</p>
        <div className="flex gap-4 flex-wrap">
          {[
            { icon: "📖", title: "Empresa invierte en educación", desc: "Cumple STPS, fortalece capital humano.", color: "cedu-orange" },
            { icon: "🤝", title: "Socios colaboran", desc: "Comisión mixta se asocia a la cooperativa.", color: "cedu-blue" },
            { icon: "🎓", title: "Conocimiento se multiplica", desc: "1,066 cursos, certificaciones, IA, blockchain.", color: "cedu-green" },
            { icon: "💰", title: "Valor retorna al participante", desc: "Anticipos, rendimientos, excedentes, becas.", color: "cedu-violet" },
          ].map((c, i) => (
            <div key={i} className="flex-1 min-w-[240px] flex gap-3 items-start">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                ${c.color === "cedu-orange" ? "bg-cedu-orange/[0.07]" : ""}
                ${c.color === "cedu-blue" ? "bg-cedu-blue/[0.07]" : ""}
                ${c.color === "cedu-green" ? "bg-cedu-green/[0.07]" : ""}
                ${c.color === "cedu-violet" ? "bg-cedu-violet/[0.07]" : ""}`}>{c.icon}</div>
              <div>
                <div className={`text-[13px] font-bold mb-0.5 ${c.color === "cedu-orange" ? "text-cedu-orange" : c.color === "cedu-blue" ? "text-cedu-blue" : c.color === "cedu-green" ? "text-cedu-green" : "text-cedu-violet"}`}>{c.title}</div>
                <div className="text-[11px] text-cedu-ink-soft leading-relaxed">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 p-3 px-4 bg-cedu-coral/[0.04] rounded-[10px] border border-cedu-coral/[0.07]">
          <p className="text-[11px] text-cedu-ink-soft leading-[1.7] m-0"><strong className="text-cedu-coral">Aviso:</strong> El modelo cooperativo es una forma de organización social reconocida por la LGSC. No es una estrategia fiscal. Consulte con su asesor profesional.</p>
        </div>
      </HoverCard>
    </AnimatedSection>
  );
}

function FlujoSection() {
  return (
    <AnimatedSection>
      <div className="text-center pt-[72px] pb-9">
        <SectionLabel>💰 02 · Flujo Financiero</SectionLabel>
        <motion.h1 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.08] text-cedu-ink mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          Ciclo <em className="text-cedu-blue italic">Cooperativo</em>
        </motion.h1>
        <motion.p className="text-[15px] text-cedu-ink-muted max-w-[640px] mx-auto leading-[1.7]" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          Cómo las empresas participan en el ecosistema y sus integrantes reciben beneficios derivados de su asociación a la cooperativa.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-[18px]">
        {[
          { step: 1, icon: "🏢", title: "Crea tu Cuenta Empresarial", desc: "Registra tu empresa en ceduverse.org y configura tu perfil empresarial con los datos de tu organización." },
          { step: 2, icon: "🔗", title: "Invita a tu Red de Capacitación", desc: "Usa tu código de referido empresarial para invitar a colegas a unirse a tu red de capacitación y construir tu equipo." },
          { step: 3, icon: "💳", title: "Sube tu Pago de Nivel", desc: "Sube tu comprobante de pago para desbloquear todos los beneficios — cursos, certificaciones y membresía cooperativa." },
          { step: 4, icon: "📦", title: "Descarga el Material de Cumplimiento", desc: "Descarga el .zip con toda la documentación y compártelo con tu oficial de cumplimiento para requisitos STPS y regulatorios." },
        ].map((s) => (
          <HoverCard key={s.step} className="!p-5">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 bg-cedu-blue rounded-[10px] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {s.step}
              </div>
              <div>
                <div className="text-[10px] font-bold text-cedu-blue uppercase tracking-[2px] mb-1">Paso {s.step}</div>
                <h3 className="text-[15px] font-serif text-cedu-ink mb-1.5">{s.title}</h3>
                <p className="text-[12px] text-cedu-ink-soft leading-[1.6] m-0">{s.desc}</p>
              </div>
            </div>
          </HoverCard>
        ))}
      </div>


      <HoverCard className="mb-[18px] !p-4">
        <h3 className="text-[17px] font-serif text-cedu-ink mb-3.5 text-center">Flujo de dispersión</h3>
        <svg viewBox="0 0 680 360" width="100%" className="block">
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>
          <rect x="20" y="15" width="155" height="70" rx="12" fill="#fff3e6" stroke="#f28023" strokeWidth="1" />
          <text x="97" y="38" textAnchor="middle" fontFamily="serif" fontSize="12" fill="#1a1a2e">Empresa Afiliada</text>
          <text x="97" y="54" textAnchor="middle" fontSize="9" fill="#7a7a99">Comisión Mixta</text>
          <text x="97" y="66" textAnchor="middle" fontSize="9" fill="#7a7a99">de Capacitación</text>
          <path d="M175 35 L225 35" stroke="#f28023" strokeWidth="1" markerEnd="url(#arr)" />
          <text x="200" y="28" textAnchor="middle" fontSize="8" fill="#f28023" fontWeight="700">+IVA</text>
          <path d="M175 65 L225 65" stroke="#1b5adf" strokeWidth="1" markerEnd="url(#arr)" />
          <text x="200" y="80" textAnchor="middle" fontSize="8" fill="#1b5adf" fontWeight="700">Exenta</text>
          <rect x="225" y="8" width="200" height="82" rx="14" fill="#e8f0ff" stroke="#1b5adf" strokeWidth="1.5" />
          <rect x="225" y="8" width="200" height="24" rx="14" fill="#1b5adf" />
          <text x="325" y="25" textAnchor="middle" fontFamily="serif" fontSize="11" fill="#fff">Ceduverse Cooperativa</text>
          <text x="325" y="46" textAnchor="middle" fontSize="9" fill="#3d3d5c">Recibe pagos · Administra fondo</text>
          <text x="325" y="60" textAnchor="middle" fontSize="9" fill="#3d3d5c">Retiene fee cooperativista</text>
          <text x="325" y="76" textAnchor="middle" fontSize="9" fill="#1b5adf" fontWeight="700">Dispersa a socios</text>
          <path d="M325 90 L325 130" stroke="#1b5adf" strokeWidth="1" markerEnd="url(#arr)" />
          <text x="340" y="115" fontSize="8" fill="#1b5adf" fontWeight="700">Fee retenido</text>
          <rect x="180" y="130" width="290" height="70" rx="12" fill="#f3edff" stroke="#7c3aed" strokeWidth="1" />
          <text x="325" y="153" textAnchor="middle" fontFamily="serif" fontSize="11" fill="#1a1a2e">Fondo Cooperativo</text>
          <text x="325" y="170" textAnchor="middle" fontSize="9" fill="#3d3d5c">Anticipos · Rendimientos · Excedentes</text>
          <text x="325" y="184" textAnchor="middle" fontSize="9" fill="#7c3aed" fontWeight="700">Becas · Incentivos · Reservas</text>
          <path d="M200 200 L100 240" stroke="#00b87a" strokeWidth="1" markerEnd="url(#arr)" />
          <path d="M325 200 L325 240" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#arr)" />
          <path d="M450 200 L550 240" stroke="#f28023" strokeWidth="1" markerEnd="url(#arr)" />
          <rect x="20" y="240" width="160" height="55" rx="10" fill="#e6fff5" stroke="#00b87a" strokeWidth="1" />
          <text x="100" y="262" textAnchor="middle" fontSize="10" fill="#00b87a" fontWeight="700">💳 Black Premium</text>
          <text x="100" y="278" textAnchor="middle" fontSize="8" fill="#7a7a99">Visa innominada · 2.5%</text>
          <rect x="250" y="240" width="150" height="55" rx="10" fill="#f3edff" stroke="#7c3aed" strokeWidth="1" />
          <text x="325" y="262" textAnchor="middle" fontSize="10" fill="#7c3aed" fontWeight="700">🔐 Cripto</text>
          <text x="325" y="278" textAnchor="middle" fontSize="8" fill="#7a7a99">Autocustodia · 5%</text>
          <rect x="470" y="240" width="170" height="55" rx="10" fill="#fff3e6" stroke="#f28023" strokeWidth="1" />
          <text x="555" y="262" textAnchor="middle" fontSize="10" fill="#f28023" fontWeight="700">📖 Servicios</text>
          <text x="555" y="278" textAnchor="middle" fontSize="8" fill="#7a7a99">Becas · Certificados</text>
          <path d="M100 295 L100 330" stroke="#00b87a" strokeWidth="1" strokeDasharray="4" />
          <text x="100" y="345" textAnchor="middle" fontSize="8" fill="#7a7a99">Gasto diario</text>
          <path d="M325 295 L325 330" stroke="#7c3aed" strokeWidth="1" strokeDasharray="4" />
          <text x="325" y="345" textAnchor="middle" fontSize="8" fill="#7a7a99">Autocustodia</text>
          <path d="M555 295 L555 330" stroke="#f28023" strokeWidth="1" strokeDasharray="4" />
          <text x="555" y="345" textAnchor="middle" fontSize="8" fill="#7a7a99">Crecimiento</text>
        </svg>
      </HoverCard>

      <HoverCard className="mb-[18px]">
        <h3 className="text-base font-serif text-cedu-ink mb-3">Marco legal — exención IVA</h3>
        <div className="flex gap-3 flex-wrap">
          {[
            { law: "LIVA Art. 15, XII, e)", desc: "Exención para servicios a miembros por cuotas en asociaciones con fines educativos." },
            { law: "LGSC Art. 2 y 6", desc: "Cooperativas: organización social basada en solidaridad y ayuda mutua." },
            { law: "LGSC Art. 53-57", desc: "Excedentes se distribuyen entre socios conforme a bases constitutivas." },
          ].map((l, i) => (
            <div key={i} className="flex-1 min-w-[200px] p-3 px-3.5 bg-cedu-cream rounded-[10px] border border-black/[0.06]">
              <div className="text-[11px] font-bold text-cedu-blue mb-0.5">{l.law}</div>
              <div className="text-[10px] text-cedu-ink-soft leading-snug">{l.desc}</div>
            </div>
          ))}
        </div>
      </HoverCard>

      <div className="p-3 px-4 bg-cedu-coral/[0.03] rounded-xl border border-cedu-coral/[0.07] mb-7">
        <p className="text-[11px] text-cedu-ink-soft leading-relaxed m-0"><strong className="text-cedu-coral">Aviso:</strong> Ceduverse es plataforma educativa cooperativa. No constituye asesoría fiscal, financiera ni legal.</p>
      </div>
    </AnimatedSection>
  );
}

function PlanesSection() {
  const planes = [
    { name: "Impulsa", umas: 6, fee: 20, color: "green", range: "1–10 colaboradores", desc: "Entrada accesible para PyMEs.", certDiscount: 5, feats: ["Aula Virtual + Tutor IA + Academy", "DC-3 con 5% desc.", "Soporte básico", "5% desc. en todas las certificaciones"] },
    { name: "Transforma", umas: 10, fee: 13, color: "blue", range: "11–99 colaboradores", desc: "Mayor volumen, menor comisión.", certDiscount: 10, feats: ["Aula Virtual + Tutor IA + Academy", "DC-3 + DC-5 con 10% desc.", "Consultor dedicado", "Reportes STPS", "10% desc. en todas las certificaciones"] },
    { name: "Lidera", umas: 20, fee: 10, color: "violet", range: "100–500 colaboradores", desc: "Máximo beneficio para corporativos.", certDiscount: 15, feats: ["Aula Virtual + Tutor IA + Academy", "DC-3 + DC-5 con 15% desc.", "Director de cuenta", "API empresarial", "Certificados NFT", "Prioridad en soporte", "15% desc. en todas las certificaciones"] },
  ];
  const colorMap: Record<string, { text: string; badge: string }> = {
    green: { text: "text-cedu-green", badge: "green" },
    blue: { text: "text-cedu-blue", badge: "blue" },
    violet: { text: "text-cedu-violet", badge: "violet" },
  };

  return (
    <AnimatedSection>
      <div className="text-center pt-[72px] pb-9">
        <SectionLabel>📊 03 · Planes y Servicios</SectionLabel>
        <motion.h1 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.08] text-cedu-ink mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          Planes basados en <em className="text-cedu-blue italic">UMAs</em>
        </motion.h1>
        <motion.p className="text-[15px] text-cedu-ink-muted max-w-[560px] mx-auto leading-[1.7]" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          UMA 2026 = <strong className="text-cedu-ink">${UMA_2026.toFixed(2)} MXN</strong>
        </motion.p>
      </div>

      <div className="flex gap-[18px] flex-wrap justify-center mb-5">
        {planes.map((p, i) => (
          <HoverCard key={i} highlight={p.name === "Transforma"} className="flex-1 min-w-[270px] max-w-[340px]">
            {p.name === "Transforma" && <div className="absolute top-3 right-4"><InlineBadge color="blue">Más popular</InlineBadge></div>}
            <div className="text-center mb-3.5">
              <InlineBadge color={colorMap[p.color]?.badge || "blue"}>{p.name}</InlineBadge>
              <div className={`text-[34px] font-extrabold mt-2.5 mb-0.5 ${colorMap[p.color]?.text || "text-cedu-blue"}`}>
                {p.umas} <span className="text-sm text-cedu-ink-muted">UMAs</span>
              </div>
              <div className="text-sm font-bold text-cedu-ink">{fmt(Math.round(p.umas * UMA_2026))} <span className="text-[11px] text-cedu-ink-muted font-normal">MXN / colaborador / mes</span></div>
              <div className="text-[10px] text-cedu-ink-muted mt-1">{p.range}</div>
              <div className="text-[22px] font-extrabold text-cedu-orange mt-1.5 mb-1.5">Fee: {p.fee}%</div>
              <div className="inline-block px-3 py-1 bg-cedu-green-light rounded-lg text-[11px] font-bold text-cedu-green">{p.certDiscount}% desc. en certificaciones</div>
            </div>
            <p className="text-xs text-cedu-ink-muted text-center mb-3.5">{p.desc}</p>
            {p.feats.map((f, j) => (
              <div key={j} className="flex gap-2 text-xs text-cedu-ink-soft py-0.5">
                <span className={colorMap[p.color]?.text || "text-cedu-blue"}>◆</span>{f}
              </div>
            ))}
          </HoverCard>
        ))}
      </div>

      <HoverCard className="mb-[18px] !bg-cedu-green-light !border-cedu-green/[0.12]">
        <h3 className="text-base font-serif text-cedu-green mb-3">🎓 Descuentos en Certificaciones</h3>
        <p className="text-[13px] text-cedu-ink-soft leading-[1.7] mb-3.5">Los socios cooperativistas acceden a descuentos exclusivos en <strong className="text-cedu-ink">todas las certificaciones</strong> (DC-3, DC-5, SEP/RVOE, diplomas y más):</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5 mb-3.5">
          {[
            { name: "DC-3 STPS", icon: "📋" },
            { name: "DC-5 STPS", icon: "📄" },
            { name: "Bachillerato Abierto", icon: "📖" },
            { name: "Licenciaturas", icon: "🎓" },
            { name: "Diplomados", icon: "📜" },
            { name: "Maestrías", icon: "🏅" },
            { name: "Cursos con validez SEP", icon: "✅" },
          ].map((c, i) => (
            <div key={i} className="py-2.5 px-3.5 bg-white rounded-[10px] border border-black/[0.06] flex gap-2 items-center text-xs font-semibold text-cedu-ink">
              <span className="text-base">{c.icon}</span>{c.name}
            </div>
          ))}
        </div>
        <div className="flex gap-2.5 flex-wrap mb-3">
          <div className="p-2 px-3.5 bg-white rounded-lg border border-black/[0.06]"><div className="text-[11px] text-cedu-green font-bold">Impulsa: 5% desc.</div></div>
          <div className="p-2 px-3.5 bg-white rounded-lg border border-black/[0.06]"><div className="text-[11px] text-cedu-blue font-bold">Transforma: 10% desc.</div></div>
          <div className="p-2 px-3.5 bg-white rounded-lg border border-black/[0.06]"><div className="text-[11px] text-cedu-violet font-bold">Lidera: 15% desc.</div></div>
        </div>
        <p className="text-[10px] text-cedu-ink-muted leading-snug m-0">* Descuento aplicable a todas las certificaciones del plan. Calculado al contrato de la primera aportación. Si después de 3 meses no se mantiene la consistencia en aportaciones, los descuentos se limitan hasta regularizar.</p>
      </HoverCard>

      <HoverCard className="mb-[18px] !bg-cedu-blue-light !border-cedu-blue/[0.09]">
        <h3 className="text-base font-serif text-cedu-blue mb-3">🆓 Primer año gratuito para estudiantes</h3>
        <p className="text-[13px] text-cedu-ink-soft leading-[1.7] m-0">
          Todos los usuarios estudiantes tienen <strong className="text-cedu-ink">acceso gratuito</strong> al uso de las herramientas de capacitación de la plataforma durante el <strong className="text-cedu-blue">primer año</strong>. Incluye Aula Virtual, Tutor IA, Academy y certificados digitales básicos (DC-3).
        </p>
      </HoverCard>

      <HoverCard className="mb-[18px]">
        <h3 className="text-base font-serif text-cedu-ink mb-3">🧑‍🏫 Tutorías Personalizadas y Cursos In Situ</h3>
        <p className="text-[13px] text-cedu-ink-soft leading-[1.7] mb-3">Además de la plataforma digital, Ceduverse ofrece:</p>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[260px] p-4 bg-cedu-orange-light rounded-xl border border-cedu-orange/[0.09]">
            <div className="text-[13px] font-bold text-cedu-orange mb-1">📋 Cursos In Situ</div>
            <p className="text-[11px] text-cedu-ink-soft leading-snug m-0">Capacitación presencial en las instalaciones de la empresa. Instructor certificado DC-5 de Ceduverse. Se cotiza por evento según número de participantes y duración.</p>
          </div>
          <div className="flex-1 min-w-[260px] p-4 bg-cedu-violet-light rounded-xl border border-cedu-violet/[0.09]">
            <div className="text-[13px] font-bold text-cedu-violet mb-1">🎯 Tutorías Personalizadas</div>
            <p className="text-[11px] text-cedu-ink-soft leading-snug m-0">Sesiones 1-a-1 o grupos pequeños con instructor de Ceduverse. Enfoque en necesidades específicas de la empresa. Cotización directa con el consultor asignado.</p>
          </div>
        </div>
      </HoverCard>

      <HoverCard className="mb-7 !bg-cedu-warm">
        <h3 className="text-[17px] font-serif text-cedu-ink mb-3.5 text-center">Valor para la Empresa</h3>
        <div className="flex gap-3.5 flex-wrap justify-center">
          {[
            { icon: "📋", t: "Cumplimiento STPS", d: "DC-3 validado.", c: "text-cedu-blue" },
            { icon: "🤝", t: "Capital humano", d: "1,066 cursos + Tutor IA.", c: "text-cedu-green" },
            { icon: "🏅", t: "Certificados verificables", d: "NFTs en Polygon.", c: "text-cedu-violet" },
            { icon: "💡", t: "Participación cooperativa", d: "Becas, incentivos, excedentes.", c: "text-cedu-orange" },
            { icon: "🎓", t: "Programas SEP/RVOE", d: "Bachillerato a Maestría.", c: "text-cedu-green" },
            { icon: "🧑‍🏫", t: "Cursos presenciales", d: "In situ + tutorías.", c: "text-cedu-violet" },
          ].map((v, i) => (
            <div key={i} className="flex-1 min-w-[160px] text-center p-3.5 bg-white rounded-xl border border-black/[0.06]">
              <div className="text-[22px] mb-1">{v.icon}</div>
              <div className={`text-[11px] font-bold ${v.c} mb-0.5`}>{v.t}</div>
              <div className="text-[10px] text-cedu-ink-soft leading-[1.4]">{v.d}</div>
            </div>
          ))}
        </div>
      </HoverCard>
    </AnimatedSection>
  );
}

function DispersionSection() {
  const [cart, setCart] = useState({ vault: 0, tangem2: 0, tangem3: 0 });
  const sub = cart.vault * PRICES.vault + cart.tangem2 * PRICES.tangem2 + cart.tangem3 * PRICES.tangem3;

  return (
    <AnimatedSection>
      <div className="text-center pt-[72px] pb-9">
        <SectionLabel>💳 04 · Medios de Dispersión</SectionLabel>
        <motion.h1 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.08] text-cedu-ink mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          Elige cómo <em className="text-cedu-blue italic">recibir</em> tus beneficios
        </motion.h1>
        <motion.p className="text-[15px] text-cedu-ink-muted max-w-[600px] mx-auto leading-[1.7]" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          Cada socio decide el medio para sus anticipos, rendimientos y excedentes.
        </motion.p>
      </div>

      <div className="flex gap-4 flex-wrap mb-5">
        <HoverCard className="flex-1 min-w-[260px] !opacity-[0.45] !grayscale-[0.5]">
          <InlineBadge color="coral">AGOTADA</InlineBadge>
          <h3 className="text-base font-serif text-cedu-ink mt-2 mb-1">Mastercard TOKAPAY</h3>
          <div className="text-2xl font-extrabold text-cedu-ink-muted">+0%</div>
          <div className="text-[11px] text-cedu-ink-muted mt-1">KYC requerido · SPEI $300K/día</div>
        </HoverCard>

        <HoverCard className="flex-1 min-w-[260px]">
          <InlineBadge color="violet">Innominada · Visa</InlineBadge>
          <h3 className="text-base font-serif text-cedu-ink mt-2 mb-1">Black PREMIUM</h3>
          <div className="text-2xl font-extrabold text-cedu-violet my-1 mb-3">+2.5%</div>
          <p className="text-xs text-cedu-ink-soft leading-relaxed mb-3">Tarjeta bancaria <strong className="text-cedu-ink">Visa</strong> innominada (sin nombre impreso). Funciona como cualquier tarjeta de débito:</p>
          <div className="grid grid-cols-2 gap-1.5">
            {["🛒 Compras en línea", "🏪 Compras en POS/TPV", "💵 Retiros en cajero", "📱 Consulta de saldo gratis", "🔐 NIP de seguridad", "🌐 Portal privado web"].map((f, i) => (
              <div key={i} className="py-1.5 px-2 bg-cedu-violet-light rounded-md text-[10px] text-cedu-violet font-semibold">{f}</div>
            ))}
          </div>
          <div className="mt-2.5 text-[11px] text-cedu-ink-soft">KYC no obligatorio · Retiros $9K/día · Gasto $135K/día · 15 tx diarias</div>
        </HoverCard>
      </div>

      <HoverCard highlight className="mb-5 !border-2 !border-cedu-blue/40">
        <div className="flex gap-6 flex-wrap items-start">
          <div className="flex-1 min-w-[240px]">
            <InlineBadge color="orange">Producto Especial</InlineBadge>
            <h2 className="text-2xl font-serif text-cedu-ink mt-2.5 mb-1.5">Dispersión <em className="text-cedu-blue italic">Cripto</em></h2>
            <div className="text-[28px] font-extrabold text-cedu-orange mb-2">+5% <span className="text-xs text-cedu-ink-muted font-normal">comisión de dispersión</span></div>
            <p className="text-[13px] text-cedu-ink-soft leading-[1.7] mb-3">
              Recibe anticipos y excedentes en criptoactivos. Autocustodia total, sin intermediarios bancarios. <strong className="text-cedu-blue">También puedes recibir directamente en tu wallet de autocustodia preferida</strong> (MetaMask, Trust Wallet, Phantom, Ledger, etc.).
            </p>
            <div className="flex gap-2 flex-wrap mb-3.5">
              {"BTC ETH USDT USDC SOL MATIC".split(" ").map(c => (
                <div key={c} className="px-3 py-1 bg-cedu-blue-light rounded-lg text-xs font-bold text-cedu-blue">{c}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-5">
          <h3 className="text-base font-serif text-cedu-ink mb-3">🔐 Ceduverse Vault Card — Respaldo Físico</h3>
          <p className="text-[12px] text-cedu-ink-soft leading-[1.7] mb-3">
            Tarjeta de <strong className="text-cedu-ink">acero inoxidable</strong> con tu frase semilla de recuperación grabada. No es una wallet electrónica: es un <strong className="text-cedu-ink">respaldo físico indestructible</strong> de tus 12 palabras. Guárdala en un lugar seguro y nunca la compartas. Si pierdes acceso a tu wallet digital, esta tarjeta te permite recuperar tus activos.
          </p>
          <div className="flex gap-4 flex-wrap items-center mb-3">
            <div className="text-center">
              <VaultCardVisual side="front" />
              <div className="text-[10px] text-cedu-ink-muted mt-1.5 font-semibold">Frente</div>
            </div>
            <div className="text-center">
              <VaultCardVisual side="back" />
              <div className="text-[10px] text-cedu-ink-muted mt-1.5 font-semibold">Reverso — 12 palabras</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mb-1">
            {["Acero inoxidable", "Frase semilla grabada", "QR con NFT certificado", "Resistente a fuego/agua", "Cold storage pasivo"].map((f, i) => (
              <div key={i} className="px-2.5 py-1 bg-amber-600/[0.06] rounded-lg text-[10px] font-semibold text-amber-700">◆ {f}</div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <h3 className="text-base font-serif text-cedu-ink mb-3">💳 Tangem — Wallet de Hardware NFC</h3>
          <p className="text-[12px] text-cedu-ink-soft leading-[1.7] mb-3">
            Tangem es una <strong className="text-cedu-ink">wallet de hardware</strong> con forma de tarjeta de crédito que usa <strong className="text-cedu-ink">NFC</strong> (el mismo sistema de pagos contactless) para comunicarse con tu celular. Tu llave privada se genera y almacena dentro de un <strong className="text-cedu-ink">chip Samsung EAL6+</strong> certificado — nunca sale del chip, nunca se expone. No tiene batería (se alimenta del NFC de tu teléfono), no tiene puertos, y su firmware es <strong className="text-cedu-ink">inmutable</strong> (no se puede actualizar, auditado por Kudelski y Riscure).
          </p>
          <div className="flex gap-4 flex-wrap items-center mb-3">
            <div className="text-center">
              <TangemCardVisual side="front" label="CARD 1" />
              <div className="text-[10px] text-cedu-ink-muted mt-1.5 font-semibold">Frente — Principal</div>
            </div>
            <div className="text-center">
              <TangemCardVisual side="back" label="CARD 1" />
              <div className="text-[10px] text-cedu-ink-muted mt-1.5 font-semibold">Reverso — Specs</div>
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-cedu-blue/[0.03] border border-cedu-blue/[0.08] mb-3">
            <div className="text-[11px] font-bold text-cedu-blue mb-1.5">¿Cómo funciona?</div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2">
              {[
                { step: "1", t: "Instala la app Tangem", d: "Disponible en iOS y Android gratis." },
                { step: "2", t: "Toca tu tarjeta al celular", d: "El chip NFC se activa sin batería." },
                { step: "3", t: "Se genera tu llave privada", d: "Dentro del chip Samsung EAL6+. Nunca sale." },
                { step: "4", t: "Firma transacciones", d: "Solo toca la tarjeta para autorizar. 1-2 segundos." },
              ].map((s, i) => (
                <div key={i} className="p-2 bg-white rounded-lg border border-black/[0.04]">
                  <div className="text-[10px] font-bold text-cedu-blue mb-0.5">Paso {s.step}</div>
                  <div className="text-[10px] font-semibold text-cedu-ink">{s.t}</div>
                  <div className="text-[9px] text-cedu-ink-muted leading-[1.4]">{s.d}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-cedu-blue/[0.03] border border-cedu-blue/[0.08] mb-3">
            <div className="text-[11px] font-bold text-cedu-blue mb-2">Respaldo Seedless: Sin frase semilla</div>
            <p className="text-[11px] text-cedu-ink-soft leading-[1.6] mb-2">
              Por default, Tangem usa respaldo <strong className="text-cedu-ink">seedless</strong>: tu llave privada se clona de forma encriptada entre las tarjetas del pack (usando Diffie-Hellman). Cada tarjeta es un acceso completo. Si pierdes una, las demás siguen funcionando sin pasos de recuperación.
            </p>
            <p className="text-[10px] text-cedu-ink-muted leading-[1.5] m-0">
              ⚠️ Si pierdes <em>todas</em> las tarjetas, no hay forma de recuperar la wallet (no hay frase semilla). Por eso recomendamos el <strong className="text-cedu-ink">3-Pack</strong> y guardar las tarjetas en ubicaciones separadas. Opcionalmente puedes activar modo BIP-39 con frase de 12/24 palabras.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap mb-1">
            {["NFC · Sin batería", "Chip EAL6+ Samsung", "IP68 agua/polvo", "81+ blockchains", "6,000+ activos", "25 años de vida útil", "Firmware inmutable", "Seedless o frase semilla"].map((f, i) => (
              <div key={i} className="px-2.5 py-1 bg-cedu-blue/[0.06] rounded-lg text-[10px] font-semibold text-cedu-blue">◆ {f}</div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <h3 className="text-sm font-serif text-cedu-ink mb-2.5">⚖️ Vault Card vs. Tangem — ¿Cuál necesitas?</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-cedu-cream">
                  <th className="text-left py-2 px-3 text-cedu-ink-muted font-semibold border-b border-black/[0.06]">Característica</th>
                  <th className="text-center py-2 px-3 text-amber-700 font-bold border-b border-black/[0.06]">Vault Card</th>
                  <th className="text-center py-2 px-3 text-cedu-blue font-bold border-b border-black/[0.06]">Tangem</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["¿Qué es?", "Respaldo físico en acero", "Wallet de hardware activa"],
                  ["Material", "Acero inoxidable", "PVC + chip NFC Samsung"],
                  ["Función principal", "Guardar frase semilla", "Firmar transacciones"],
                  ["Conectividad", "Ninguna (pasiva)", "NFC con celular"],
                  ["Firma transacciones", "No", "Sí — tap para autorizar"],
                  ["Frase semilla", "Grabada en la tarjeta", "Seedless (default) o BIP-39"],
                  ["Blockchains soportadas", "N/A (solo respaldo)", "81+ blockchains, 6,000+ activos"],
                  ["Batería", "No necesita", "No necesita (NFC-powered)"],
                  ["Resistencia", "Fuego, agua, corrosión", "IP68, -25°C a +50°C"],
                  ["Vida útil", "Ilimitada", "25+ años"],
                  ["Uso recomendado", "Guardar en caja fuerte", "Uso diario / operar cripto"],
                ].map(([feat, vault, tangem], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-cedu-cream/50"}>
                    <td className="py-1.5 px-3 text-cedu-ink font-semibold border-b border-black/[0.03]">{feat}</td>
                    <td className="py-1.5 px-3 text-center text-cedu-ink-soft border-b border-black/[0.03]">{vault}</td>
                    <td className="py-1.5 px-3 text-center text-cedu-ink-soft border-b border-black/[0.03]">{tangem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-3">
          <h3 className="text-sm font-serif text-cedu-ink mb-2.5">🛒 Adquiere tu kit de autocustodia</h3>
          <div className="flex gap-2 flex-wrap mb-3">
            {[
              { t: "Vault Card", d: "Acero inoxidable. Frase semilla grabada.", p: PRICES.vault, k: "vault" as const },
              { t: "Tangem 2-Pack", d: "1 principal + 1 backup. NFC EAL6+.", p: PRICES.tangem2, k: "tangem2" as const },
              { t: "Tangem 3-Pack", d: "1 principal + 2 backup. Máxima seguridad.", p: PRICES.tangem3, k: "tangem3" as const },
            ].map((p, i) => (
              <div key={i} className="flex-1 min-w-[150px] p-2.5 px-3 bg-white rounded-[10px] border border-black/[0.06]">
                <div className="text-xs font-bold text-cedu-ink">{p.t}</div>
                <div className="text-[10px] text-cedu-ink-muted leading-[1.3] mt-0.5 mb-1.5">{p.d}</div>
                <div className="text-sm font-extrabold text-cedu-orange mb-1.5">{fmt(p.p)} <span className="text-[9px] text-cedu-ink-muted font-normal">MXN</span></div>
                <Qty value={cart[p.k]} onInc={() => setCart(c => ({ ...c, [p.k]: c[p.k] + 1 }))} onDec={() => setCart(c => ({ ...c, [p.k]: Math.max(0, c[p.k] - 1) }))} />
              </div>
            ))}
          </div>

          {sub > 0 && (
            <div className="p-3 px-4 bg-cedu-blue-light rounded-[10px] border border-cedu-blue/[0.12] flex justify-between items-center flex-wrap gap-2">
              <div className="text-xs text-cedu-ink-soft">
                {cart.vault > 0 && cart.vault + "x Vault "}
                {cart.tangem2 > 0 && cart.tangem2 + "x Tangem 2 "}
                {cart.tangem3 > 0 && cart.tangem3 + "x Tangem 3"}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-lg font-extrabold text-cedu-blue" data-testid="text-subtotal">{fmt(sub)} MXN</div>
                <button onClick={() => {
                  writeCeduCart({ vault: cart.vault, tangem2: cart.tangem2, tangem3: cart.tangem3 });
                  window.location.href = "/tienda";
                }} data-testid="btn-pay"
                  className="px-5 py-2.5 bg-cedu-blue border-none rounded-[10px] text-white text-xs font-bold cursor-pointer shadow-[0_4px_16px_rgba(27,90,223,0.25)] hover:bg-cedu-blue-dark transition-colors">
                  Pagar con tarjeta →
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          {"Crypto $2M/día,Sin KYC obligatorio,NFT Certificado Polygon,Inembargable,Autocustodia total,Wallet preferida compatible".split(",").map((f, i) => (
            <div key={i} className="px-3 py-1.5 bg-cedu-blue/[0.06] rounded-lg text-[10px] font-semibold text-cedu-blue">◆ {f}</div>
          ))}
        </div>
      </HoverCard>

      <HoverCard className="mb-7 !bg-cedu-orange-light !border-cedu-orange/[0.15]">
        <h4 className="text-[15px] font-bold text-cedu-orange mb-2">🔑 Regla #1: Separar pago de custodia</h4>
        <p className="text-[13px] text-cedu-ink-soft leading-[1.7] m-0">
          <strong className="text-cedu-ink">Black Premium</strong> → gastar (TPV, retiros, compras). <strong className="text-cedu-ink">Vault Card</strong> → respaldar (frase semilla en acero, nunca sale del estuche). <strong className="text-cedu-ink">Tangem</strong> → operar cripto (firmar transacciones con un tap NFC). Nunca uses una sola tarjeta para todo.
        </p>
      </HoverCard>
    </AnimatedSection>
  );
}

function CriptoSection() {
  const coins = [
    { s: "BTC", n: "Bitcoin", c: "#F7931A", net: "Bitcoin Network" },
    { s: "ETH", n: "Ethereum", c: "#627EEA", net: "Ethereum / L2s" },
    { s: "USDT", n: "Tether", c: "#26A17B", net: "Multi-chain" },
    { s: "USDC", n: "USD Coin", c: "#2775CA", net: "Ethereum / Polygon" },
    { s: "MATIC", n: "Polygon", c: "#8247E5", net: "Polygon PoS" },
    { s: "SOL", n: "Solana", c: "#9945FF", net: "Solana" },
    { s: "BNB", n: "BNB", c: "#F0B90B", net: "BSC" },
    { s: "DAI", n: "Dai", c: "#F5AC37", net: "Ethereum" },
    { s: "AVAX", n: "Avalanche", c: "#E84142", net: "C-Chain" },
    { s: "ARB", n: "Arbitrum", c: "#28A0F0", net: "Arbitrum One" },
  ];
  const wallets = [
    { name: "Tangem", type: "Hardware NFC", seeds: "Seedless/12/24", diff: "Fácil", c: "#1a1a2e" },
    { name: "Trust Wallet", type: "iOS/Android", seeds: "12 palabras", diff: "Fácil", c: "#0500FF" },
    { name: "MetaMask", type: "Navegador+Móvil", seeds: "12 palabras", diff: "Intermedio", c: "#F6851B" },
    { name: "Phantom", type: "Multi-chain", seeds: "12 palabras", diff: "Fácil", c: "#AB9FF2" },
    { name: "Ledger", type: "Hardware USB", seeds: "24 palabras", diff: "Intermedio", c: "#000" },
    { name: "Trezor", type: "Hardware USB", seeds: "12/24 palabras", diff: "Intermedio", c: "#00854D" },
  ];

  return (
    <AnimatedSection>
      <div className="text-center pt-[72px] pb-9">
        <SectionLabel>🔐 05 · Blockchain</SectionLabel>
        <motion.h1 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.08] text-cedu-ink mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          Aportaciones <em className="text-cedu-blue italic">Cripto</em>
        </motion.h1>
      </div>

      <HoverCard className="mb-5 !p-4">
        <div className="flex items-center justify-center gap-0 overflow-x-auto flex-wrap">
          {"Aportación,Tokenización,Distribución,Verificación".split(",").map((b, i) => (
            <div key={i} className="flex items-center">
              <div className="min-w-[110px] py-3 px-2.5 bg-cedu-blue-light border border-cedu-blue/[0.12] rounded-xl text-center">
                <div className="text-[8px] text-cedu-blue font-extrabold tracking-wider">BLOCK #{i + 1}</div>
                <div className="text-xs text-cedu-ink font-bold font-serif mt-0.5">{b}</div>
              </div>
              {i < 3 && <div className="w-5 h-0.5 bg-cedu-blue/40 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </HoverCard>

      <HoverCard className="mb-5">
        <h3 className="text-base font-serif text-cedu-ink mb-3.5 text-center">Criptoactivos aceptados</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
          {coins.map((c, i) => (
            <div key={i} className="py-2.5 px-3 rounded-[10px] flex items-center gap-2 border" style={{ background: c.c + "08", borderColor: c.c + "18" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0" style={{ background: c.c + "18", color: c.c }}>{c.s.charAt(0)}</div>
              <div className="min-w-0">
                <div className="text-[13px] font-extrabold" style={{ color: c.c }}>{c.s}</div>
                <div className="text-[9px] text-cedu-ink-muted whitespace-nowrap overflow-hidden text-ellipsis">{c.net}</div>
              </div>
            </div>
          ))}
        </div>
      </HoverCard>

      <HoverCard className="mb-5">
        <h3 className="text-base font-serif text-cedu-ink mb-3.5 text-center">Wallets Recomendadas</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
          {wallets.map((w, i) => (
            <div key={i} className="p-3.5 bg-cedu-cream rounded-xl border border-black/[0.06] text-center">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center mx-auto mb-2 text-[11px] font-extrabold" style={{ background: w.c + "12", color: w.c }}>{w.name.charAt(0)}</div>
              <div className="text-[13px] font-bold text-cedu-ink">{w.name}</div>
              <div className="text-[10px] text-cedu-ink-muted mb-1">{w.type}</div>
              <InlineBadge color="blue">{w.seeds}</InlineBadge>
              <div className={`text-[10px] font-bold mt-1 ${w.diff === "Fácil" ? "text-cedu-green" : "text-cedu-orange"}`}>{w.diff}</div>
            </div>
          ))}
        </div>
      </HoverCard>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 mb-7">
        {[
          { i: "🔗", t: "On-Chain", d: "Hash único e inmutable." },
          { i: "🎓", t: "Certificados NFT", d: "DC-3, DC-5 en Polygon." },
          { i: "💎", t: "Smart Contracts", d: "Distribución automática." },
          { i: "🛡️", t: "Privacidad ZK", d: "Solo el socio verifica." },
          { i: "🏦", t: "Inembargable", d: "Fuera de embargo." },
          { i: "📜", t: "Auditoría", d: "Pública pero privada." },
        ].map((x, idx) => (
          <HoverCard key={idx} className="text-center !p-4">
            <div className="w-10 h-10 rounded-[10px] bg-cedu-blue-light flex items-center justify-center mx-auto mb-2 text-lg">{x.i}</div>
            <h4 className="text-xs font-bold text-cedu-ink font-serif mb-0.5">{x.t}</h4>
            <p className="text-[10px] text-cedu-ink-muted m-0">{x.d}</p>
          </HoverCard>
        ))}
      </div>
    </AnimatedSection>
  );
}

function ComplianceSection() {
  return (
    <AnimatedSection>
      <div className="text-center pt-[72px] pb-9">
        <SectionLabel>⚖️ 06 · Legal</SectionLabel>
        <motion.h1 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.08] text-cedu-ink mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          Cumplimiento <em className="text-cedu-blue italic">Regulatorio</em>
        </motion.h1>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5 mb-5">
        {[
          { title: "LGSC", desc: "Ley General de Sociedades Cooperativas.", color: "text-cedu-blue" },
          { title: "PLD/FT", desc: "Prevención de Lavado de Dinero.", color: "text-cedu-coral" },
          { title: "LFPIORPI", desc: "Actividades Vulnerables.", color: "text-cedu-orange" },
          { title: "LIVA Art. 15", desc: "Exención IVA para asociaciones educativas.", color: "text-cedu-green" },
        ].map((c, i) => (
          <HoverCard key={i}>
            <div className={`text-xl font-extrabold mb-1 ${c.color}`}>{c.title}</div>
            <p className="text-[11px] text-cedu-ink-soft leading-snug m-0">{c.desc}</p>
          </HoverCard>
        ))}
      </div>

      <HoverCard className="mb-7">
        <div className="text-[13px] font-bold text-cedu-ink-soft mb-2.5">📋 Avisos Legales</div>
        <div className="text-[11px] text-cedu-ink-muted leading-[1.8] space-y-1">
          <p><strong className="text-cedu-ink-soft">1.</strong> Ceduverse es plataforma educativa cooperativa. NO es institución financiera.</p>
          <p><strong className="text-cedu-ink-soft">2.</strong> Criptoactivos son volátiles. Sin garantía de rendimientos.</p>
          <p><strong className="text-cedu-ink-soft">3.</strong> Autocustodia: el socio es único responsable de sus claves.</p>
          <p><strong className="text-cedu-ink-soft">4.</strong> PLD/FT: Ceduverse cumple LGSC, LFPIORPI.</p>
          <p><strong className="text-cedu-ink-soft">5.</strong> Nada aquí es asesoría financiera, fiscal o legal.</p>
          <p><strong className="text-cedu-ink-soft">6.</strong> Jurisdicción: México. Tribunales de Monterrey, NL.</p>
          <p className="text-[10px] text-cedu-ink-muted/60 mt-2">Abril 2026 · v4.1</p>
        </div>
      </HoverCard>
    </AnimatedSection>
  );
}

function CeduverseDashboard() {
  const [sec, setSec] = useState("modelo");
  const [fade, setFade] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const go = (s: string) => { setFade(false); setMobileNav(false); setTimeout(() => { setSec(s); setFade(true); window.scrollTo({ top: 0, behavior: "smooth" }); }, 200); };
  const nav = [
    { k: "modelo", l: "01 Modelo" },
    { k: "flujo", l: "02 Flujo" },
    { k: "planes", l: "03 Planes" },
    { k: "dispersion", l: "04 Dispersión" },
    { k: "cripto", l: "05 Blockchain" },
    { k: "legal", l: "06 Legal" },
  ];

  return (
    <div className="min-h-screen bg-cedu-cream">
      <div className="fixed inset-0 dot-grid-bg opacity-40 z-0 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute w-[420px] h-[420px] -top-[120px] -right-[120px] bg-gradient-to-br from-cedu-blue-light to-cedu-orange-light animate-blob opacity-25" />
        <div className="absolute w-[320px] h-[320px] -bottom-20 -left-20 bg-gradient-to-br from-cedu-green-light to-cedu-violet-light animate-blob-slow opacity-20" />
      </div>

      <FloatingShape className="w-3 h-3 rounded-full bg-cedu-blue/20 top-[20%] left-[8%] animate-float-y hidden lg:block" delay={0} />
      <FloatingShape className="w-2 h-2 rounded-full bg-cedu-orange/25 top-[35%] left-[15%] animate-float-y-slow hidden lg:block" delay={1} />
      <FloatingShape className="w-4 h-4 rounded bg-cedu-violet/10 rotate-45 top-[15%] right-[12%] animate-float-y hidden lg:block" delay={0.5} />
      <HexShape size={32} className="absolute top-[25%] right-[5%] text-cedu-blue animate-float-y-slow hidden lg:block" />

      <nav className="sticky top-0 z-50 bg-cedu-cream/90 backdrop-blur-xl border-b border-black/[0.06] px-4">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-cedu-blue rounded-[10px] flex items-center justify-center text-white font-serif text-xl">C</div>
            <span className="font-serif text-2xl text-cedu-ink tracking-tight">Cedu<em className="text-cedu-blue not-italic italic">verse</em></span>
            <InlineBadge color="ink">Ejecutivo</InlineBadge>
          </div>
          <div className="hidden md:flex gap-0.5 overflow-x-auto">
            {nav.map((s) => (
              <button key={s.k} onClick={() => go(s.k)} data-testid={`nav-${s.k}`}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border-none whitespace-nowrap transition-all ${sec === s.k ? "bg-cedu-ink text-white" : "bg-transparent text-cedu-ink-muted hover:text-cedu-ink hover:bg-black/[0.04]"}`}>{s.l}</button>
            ))}
          </div>
          <button className="md:hidden p-2 text-cedu-ink bg-transparent border-none cursor-pointer" onClick={() => setMobileNav(!mobileNav)} aria-label="Menú" data-testid="btn-mobile-nav">
            {mobileNav ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileNav && (
          <div className="md:hidden bg-cedu-cream/95 backdrop-blur-xl border-t border-black/[0.06] px-4 pb-4 pt-2">
            {nav.map((s) => (
              <button key={s.k} onClick={() => go(s.k)} data-testid={`nav-mobile-${s.k}`}
                className={`block w-full text-left py-3 text-sm font-semibold border-none bg-transparent cursor-pointer ${sec === s.k ? "text-cedu-blue" : "text-cedu-ink-soft"}`}>{s.l}</button>
            ))}
          </div>
        )}
      </nav>

      <div className={`relative z-10 max-w-[1160px] mx-auto px-5 transition-all duration-300 ${fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
        {sec === "modelo" && <ModeloSection />}
        {sec === "flujo" && <FlujoSection />}
        {sec === "planes" && <PlanesSection />}
        {sec === "dispersion" && <DispersionSection />}
        {sec === "cripto" && <CriptoSection />}
        {sec === "legal" && <ComplianceSection />}
      </div>

      <footer className="relative z-10 text-center py-10 px-5">
        <p className="text-[10px] text-cedu-ink-muted/50 font-mono">Ceduverse — ceduverse.org</p>
        <p className="text-[10px] text-cedu-ink-muted/40 font-mono">Documento confidencial · Socios cooperativistas</p>
      </footer>
    </div>
  );
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const go = () => { if (code === ACCESS_CODE) onUnlock(); else { setErr(true); setTimeout(() => setErr(false), 2000); } };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cedu-cream relative overflow-hidden">
      <div className="fixed inset-0 dot-grid-bg opacity-40 z-0 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute w-[400px] h-[400px] -top-20 -right-20 bg-gradient-to-br from-cedu-blue-light to-cedu-violet-light animate-blob opacity-50" />
        <div className="absolute w-[350px] h-[350px] -bottom-20 -left-20 bg-gradient-to-br from-cedu-orange-light to-cedu-green-light animate-blob-slow opacity-40" />
      </div>
      <FloatingShape className="w-3 h-3 rounded-full bg-cedu-blue/20 top-[20%] left-[15%] animate-float-y" delay={0} />
      <FloatingShape className="w-2 h-2 rounded-full bg-cedu-orange/25 top-[40%] right-[20%] animate-float-y-slow" delay={1} />
      <HexShape size={28} className="absolute top-[30%] right-[10%] text-cedu-blue animate-float-y-slow" />

      <motion.div className="z-10 text-center max-w-[420px] px-6" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
        <div className="w-14 h-14 bg-cedu-blue rounded-[14px] flex items-center justify-center text-white font-serif text-[28px] mx-auto mb-4 shadow-[0_4px_20px_rgba(27,90,223,0.25)]">C</div>
        <h1 className="font-serif text-[28px] text-cedu-ink mb-1 tracking-tight">Cedu<em className="text-cedu-blue italic">verse</em></h1>
        <p className="text-[11px] text-cedu-orange font-extrabold tracking-[3px] uppercase mb-1.5">Presentación Ejecutiva</p>
        <p className="text-[13px] text-cedu-ink-muted mb-1.5">Flujo Financiero Cooperativo</p>
        <div className="inline-block mb-5">
          <InlineBadge color="violet">Documento Confidencial</InlineBadge>
        </div>
        <div className="w-11 h-11 rounded-full border-2 border-black/[0.06] flex items-center justify-center mx-auto mb-4 bg-white">
          <Lock size={18} className="text-cedu-blue" />
        </div>
        <p className="text-sm text-cedu-ink-muted mb-4">Acceso exclusivo para socios cooperativistas</p>
        <div className="flex gap-2 relative">
          <div className="relative flex-1">
            <input type={showCode ? "text" : "password"} placeholder="Código de acceso" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} data-testid="input-access-code"
              className={`w-full px-4 py-3.5 bg-white border rounded-xl text-cedu-ink text-sm outline-none pr-10 ${err ? "border-red-400" : "border-black/[0.06] focus:border-cedu-blue/50 focus:ring-2 focus:ring-cedu-blue/10"}`} />
            <button onClick={() => setShowCode(!showCode)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-cedu-ink-muted p-0" aria-label={showCode ? "Ocultar" : "Mostrar"} data-testid="btn-toggle-code">
              {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button onClick={go} data-testid="btn-enter"
            className="px-5 py-3.5 bg-cedu-blue text-white rounded-xl text-sm font-bold cursor-pointer border-none shadow-[0_4px_20px_rgba(27,90,223,0.25)] hover:bg-cedu-blue-dark transition-colors flex items-center gap-1">
            Entrar <ArrowRight size={16} />
          </button>
        </div>
        {err && <p data-testid="text-error" className="text-red-500 text-xs mt-2 font-mono">Código incorrecto</p>}
      </motion.div>
    </div>
  );
}

export default function CeduversePrivatePage() {
  useForceLightMode();
  const [unlocked, setUnlocked] = useState(false);
  return unlocked ? <CeduverseDashboard /> : <LockScreen onUnlock={() => setUnlocked(true)} />;
}
