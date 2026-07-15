import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, useInView } from "framer-motion";
import { useForceLightMode } from "@/components/ThemeProvider";
import { readCeduCart } from "@/lib/cedu-cart-handoff";
import {
  Package,
  CreditCard,
  ArrowRight,
  Check,
  X,
  Truck,
  Shield,
  Tag,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  Lock,
  Award,
  Coins,
  HelpCircle,
  ChevronDown,
  Scale,
  KeyRound,
  Hexagon,
  Sun,
  Diamond,
  CircleDollarSign,
  Triangle,
  Circle,
  Landmark,
  Zap,
  ShieldCheck,
  BadgeCheck,
  Link2,
  Layers,
  Menu,
} from "lucide-react";

interface StoreProduct {
  slug: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  deliveryDays: string | null;
  isActive: boolean;
  isSoldOut: boolean;
  seedPhraseOptions: number[] | null;
  stock: number | null;
  reserved: number | null;
  available: number;
}

interface CartItem {
  product: StoreProduct;
  quantity: number;
  seedPhraseWords?: number;
}

interface ShippingQuote {
  carrier: string;
  service: string;
  price: number;
  days: string;
}

interface ShippingForm {
  name: string;
  email: string;
  phone: string;
  street: string;
  number: string;
  colony: string;
  city: string;
  state: string;
  zip: string;
}

const MEXICAN_STATES = [
  "AGS","BC","BCS","CAMP","CHIS","CHIH","COAH","COL","CDMX","DGO",
  "GTO","GRO","HGO","JAL","MEX","MICH","MOR","NAY","NL","OAX",
  "PUE","QRO","QROO","SLP","SIN","SON","TAB","TAMPS","TLAX","VER","YUC","ZAC",
];

const PRICES = { vault: 2999, tangem2: 1375, tangem3: 1750 };
const fmt = (n: number) => "$" + n.toLocaleString("es-MX");

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

function VaultCard({ side }: { side: string }) {
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

function Qty({ value, onInc, onDec, color = "cedu-orange" }: { value: number; onInc: () => void; onDec: () => void; color?: string }) {
  const colorMap: Record<string, string> = {
    "cedu-orange": "text-cedu-orange border-cedu-orange/30 bg-cedu-orange/5",
    "cedu-blue": "text-cedu-blue border-cedu-blue/30 bg-cedu-blue/5",
  };
  const cls = colorMap[color] || colorMap["cedu-orange"];
  return (
    <div className={`flex items-center border rounded-lg overflow-hidden ${cls.split(" ").filter(c => c.startsWith("border")).join(" ")}`}>
      <button onClick={onDec} className={`w-8 h-8 flex items-center justify-center ${cls.split(" ").filter(c => c.startsWith("bg") || c.startsWith("text")).join(" ")} border-none cursor-pointer text-base font-bold`} data-testid="btn-qty-dec"><Minus size={14} /></button>
      <span className="w-9 text-center text-sm font-bold text-cedu-ink font-mono">{value}</span>
      <button onClick={onInc} className={`w-8 h-8 flex items-center justify-center ${cls.split(" ").filter(c => c.startsWith("bg") || c.startsWith("text")).join(" ")} border-none cursor-pointer text-base font-bold`} data-testid="btn-qty-inc"><Plus size={14} /></button>
    </div>
  );
}

function ShipField({ label, field, ph, type = "text", value, onChange }: { label: string; field: string; ph: string; type?: string; value: string; onChange: (field: string, val: string) => void }) {
  return (
    <div className="flex-1 min-w-[200px]">
      <label className="text-[10px] text-cedu-ink-muted font-mono block mb-1">{label} *</label>
      <input type={type} value={value} onChange={(e) => onChange(field, e.target.value)} placeholder={ph} data-testid={`input-ship-${field}`}
        className="w-full px-3 py-2.5 bg-cedu-cream border border-black/[0.08] rounded-xl text-cedu-ink text-sm outline-none focus:border-cedu-blue/40 focus:ring-2 focus:ring-cedu-blue/10 transition-all" />
    </div>
  );
}

function Disclosures() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/60 border border-black/[0.06] rounded-2xl p-5 mb-8">
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center bg-transparent border-none cursor-pointer p-0" data-testid="btn-disclosures">
        <span className="text-sm font-bold text-cedu-ink-muted flex items-center gap-2"><Scale size={14} /> Avisos Legales, Riesgos y Disclaimers</span>
        <ChevronDown size={16} className={`text-cedu-ink-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-4 text-xs text-cedu-ink-muted leading-relaxed space-y-2" data-testid="disclosures-content">
          <p><strong className="text-cedu-ink">1.</strong> Ceduverse es plataforma educativa. NO es institución financiera, exchange, IFPE ni entidad regulada por CNBV.</p>
          <p><strong className="text-cedu-ink">2.</strong> Criptoactivos son volátiles. Valor puede llegar a cero. Sin garantía de rendimientos.</p>
          <p><strong className="text-cedu-ink">3.</strong> Autocustodia: el usuario es único responsable de sus claves. Ceduverse NO puede recuperar frases semilla.</p>
          <p><strong className="text-cedu-ink">4. PLD/FT:</strong> Ceduverse cumple LGSC, LFPIORPI y disposiciones PLD/FT. Rechazamos lavado de dinero, financiamiento al terrorismo, evasión fiscal y toda actividad ilícita.</p>
          <p><strong className="text-cedu-ink">5.</strong> El usuario declara fondos de fuentes lícitas. Incumplimiento = cancelación inmediata + reporte a autoridades.</p>
          <p><strong className="text-cedu-ink">6.</strong> Nada aquí es asesoría financiera, fiscal o legal.</p>
          <p><strong className="text-cedu-ink">7.</strong> Tokapay, Tangem, Stripe, Envia.com, OpenSea, Polygon, Visa, Mastercard son marcas de sus titulares.</p>
          <p><strong className="text-cedu-ink">8.</strong> Ceduverse no es responsable por pérdida de fondos, fallas blockchain, hackeos o cambios regulatorios.</p>
          <p><strong className="text-cedu-ink">9.</strong> Pagos procesados por pasarela de pago segura. Ceduverse no almacena datos de tarjetas. Envíos vía servicio de paquetería.</p>
          <p><strong className="text-cedu-ink">10.</strong> Tangem: producto importado, entrega 30–60 días, garantía del fabricante (25 años).</p>
          <p><strong className="text-cedu-ink">11.</strong> Jurisdicción: Leyes de México. Tribunales de Monterrey, NL.</p>
          <p className="text-[10px] text-cedu-ink-muted/50 font-mono mt-3">Abril 2026 · v3.0</p>
        </div>
      )}
    </div>
  );
}

function StoreNavbar({ sec, onNav }: { sec: string; onNav: (s: string) => void }) {
  const [mobileNav, setMobileNav] = useState(false);
  const nav = [
    { k: "tienda", l: "Tienda" },
    { k: "seguridad", l: "Seguridad" },
    { k: "blockchain", l: "Bóveda" },
    { k: "faqs", l: "FAQs" },
  ];
  const go = (s: string) => { setMobileNav(false); onNav(s); };

  return (
    <nav className="sticky top-0 z-50 bg-cedu-cream/85 backdrop-blur-xl border-b border-black/[0.06] px-5" data-testid="store-navbar">
      <div className="max-w-[1100px] mx-auto flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2.5 no-underline" data-testid="link-store-logo">
          <div className="w-9 h-9 bg-cedu-blue rounded-[10px] flex items-center justify-center text-white font-serif text-xl">C</div>
          <div className="font-serif text-xl text-cedu-ink tracking-tight">Cedu<em className="text-cedu-blue not-italic italic">verse</em></div>
        </Link>
        <div className="hidden md:flex items-center gap-0.5">
          {nav.map((s) => (
            <button key={s.k} onClick={() => go(s.k)} data-testid={`nav-${s.k}`}
              className={`px-3 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer border-none transition-all ${sec === s.k ? "bg-cedu-blue-light text-cedu-blue" : "bg-transparent text-cedu-ink-muted hover:text-cedu-ink hover:bg-black/[0.04]"}`}>{s.l}</button>
          ))}
          <Link href="/auth" className="ml-2 bg-cedu-blue text-white font-bold text-[13px] px-5 py-2.5 rounded-xl hover:bg-cedu-blue-dark transition-all no-underline" data-testid="link-store-login">
            Mi Cuenta
          </Link>
        </div>
        <button className="md:hidden p-2 text-cedu-ink" onClick={() => setMobileNav(!mobileNav)} aria-label="Menú" data-testid="btn-mobile-nav">
          {mobileNav ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {mobileNav && (
        <div className="md:hidden bg-cedu-cream/95 backdrop-blur-xl border-t border-black/[0.06] px-4 pb-4 pt-2">
          {nav.map((s) => (
            <button key={s.k} onClick={() => go(s.k)} data-testid={`nav-mobile-${s.k}`} className={`block w-full text-left py-3 text-sm font-semibold border-none bg-transparent cursor-pointer ${sec === s.k ? "text-cedu-blue" : "text-cedu-ink-soft"}`}>{s.l}</button>
          ))}
          <Link href="/auth" className="block w-full text-left py-3 text-sm font-semibold text-cedu-blue no-underline" onClick={() => setMobileNav(false)}>Mi Cuenta</Link>
        </div>
      )}
    </nav>
  );
}

function TiendaContent() {
  const [side, setSide] = useState("front");
  const [cart, setCart] = useState({ vault: 0, tangem2: 0, tangem3: 0 });
  const [step, setStep] = useState("browse");
  const [ship, setShip] = useState<ShippingForm>({ name: "", email: "", phone: "", street: "", number: "", colony: "", city: "", state: "", zip: "" });

  useEffect(() => {
    const handed = readCeduCart();
    if (handed && (handed.vault || handed.tangem2 || handed.tangem3)) {
      setCart(handed);
    }
  }, []);

  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [referral, setReferral] = useState("");
  const [referralApplied, setReferralApplied] = useState(false);
  const [referralDiscount, setReferralDiscount] = useState(15);
  const [referralMsg, setReferralMsg] = useState("");
  const [referralError, setReferralError] = useState("");
  const [seedWords, setSeedWords] = useState(12);

  const { data: products } = useQuery<StoreProduct[]>({
    queryKey: ["/api/store/products"],
  });

  const productMap: Record<string, StoreProduct | undefined> = {
    vault: products?.find((p) => p.slug === "vault_kit" || p.slug === "vault-kit"),
    tangem2: products?.find((p) => p.slug === "tangem_2pack" || p.slug === "tangem-2pack"),
    tangem3: products?.find((p) => p.slug === "tangem_3pack" || p.slug === "tangem-3pack"),
  };

  const getPrice = (k: string) => productMap[k]?.price || PRICES[k as keyof typeof PRICES] || 0;
  const isSoldOut = (k: string) => productMap[k]?.isSoldOut === true || productMap[k]?.available === 0;

  const validateMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/store/validate-referral", { code });
      return res.json();
    },
    onSuccess: (data: { valid: boolean; discount?: number; message?: string; error?: string }) => {
      if (data.valid) {
        setReferralApplied(true);
        setReferralDiscount(data.discount || 15);
        setReferralMsg(data.message || "Descuento aplicado");
        setReferralError("");
      } else {
        setReferralApplied(false);
        setReferralError(data.error || "Código no válido");
        setReferralMsg("");
      }
    },
    onError: () => {
      setReferralError("Error al validar código");
      setReferralMsg("");
    },
  });

  const quoteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/store/shipping-quote", {
        destination: ship,
        items: [
          ...(cart.vault > 0 ? [{ product_id: "vault_kit", quantity: cart.vault }] : []),
          ...(cart.tangem2 > 0 ? [{ product_id: "tangem_2pack", quantity: cart.tangem2 }] : []),
          ...(cart.tangem3 > 0 ? [{ product_id: "tangem_3pack", quantity: cart.tangem3 }] : []),
        ],
      });
      return res.json();
    },
    onSuccess: (data: { quotes: ShippingQuote[] }) => {
      if (data.quotes?.length > 0) setQuote(data.quotes[0]);
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const items = [
        ...(cart.vault > 0 ? [{ product_id: "vault_kit", quantity: cart.vault }] : []),
        ...(cart.tangem2 > 0 ? [{ product_id: "tangem_2pack", quantity: cart.tangem2 }] : []),
        ...(cart.tangem3 > 0 ? [{ product_id: "tangem_3pack", quantity: cart.tangem3 }] : []),
      ];
      const res = await apiRequest("POST", "/api/store/create-order", {
        items,
        payer: { name: ship.name, email: ship.email, phone: ship.phone },
        shipping: ship,
        shippingQuote: quote,
        referralCode: referralApplied ? referral : undefined,
        seedPhraseWords: cart.vault > 0 ? seedWords : undefined,
      });
      return res.json();
    },
    onSuccess: (data: { checkout_url: string }) => {
      if (data.checkout_url) window.location.href = data.checkout_url;
    },
  });

  const discount = referralApplied ? referralDiscount / 100 : 0;
  const subBefore = cart.vault * getPrice("vault") + cart.tangem2 * getPrice("tangem2") + cart.tangem3 * getPrice("tangem3");
  const sub = Math.round(subBefore * (1 - discount));
  const total = sub + (quote?.price || 0);
  const inc = (k: keyof typeof cart) => setCart((c) => ({ ...c, [k]: c[k] + 1 }));
  const dec = (k: keyof typeof cart) => setCart((c) => ({ ...c, [k]: Math.max(0, c[k] - 1) }));
  const canShip = ship.name && ship.email && ship.phone && ship.street && ship.city && ship.state && ship.zip;
  const updateShip = (field: string, val: string) => setShip((s: any) => ({ ...s, [field]: val }));

  return (
    <AnimatedSection>
      <div className="text-center pt-16 pb-6">
        <motion.div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cedu-orange-light rounded-full text-[13px] font-bold text-cedu-orange mb-6" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <Tag size={14} /> Tienda · Pago con tarjeta · Envío nacional
        </motion.div>
        <motion.h1 className="font-serif text-[clamp(1.8rem,5vw,3rem)] leading-tight tracking-tight text-cedu-ink mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          Ceduverse <em className="text-cedu-orange not-italic italic">Store</em>
        </motion.h1>
        <motion.p className="text-base leading-relaxed text-cedu-ink-muted max-w-lg mx-auto" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
          Adquiere tu kit de autocustodia. Paga con tu tarjeta de crédito o débito, envío a toda la república.
        </motion.p>
      </div>

      <div className="bg-gradient-to-r from-cedu-blue-light/40 to-cedu-orange-light/40 border border-cedu-blue/15 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <h4 className="text-sm font-bold text-cedu-blue flex items-center gap-1.5 mb-1"><Tag size={14} /> ¿Tienes código de referido?</h4>
            <p className="text-xs text-cedu-ink-muted">Coloca tu código de referido socio Ceduverse y obtén un <strong className="text-cedu-orange">descuento</strong> en tu compra.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input type="text" placeholder="Código de referido" value={referral} onChange={(e) => { setReferral(e.target.value.toUpperCase()); setReferralError(""); }} disabled={referralApplied} data-testid="input-referral"
                className={`px-3 py-2.5 bg-white border rounded-xl text-sm font-mono outline-none w-40 uppercase ${referralApplied ? "border-cedu-blue/40 text-cedu-blue" : referralError ? "border-red-300" : "border-black/[0.08] text-cedu-ink"}`} />
              {!referralApplied ? (
                <button onClick={() => { if (referral.length >= 4) validateMutation.mutate(referral); }} data-testid="btn-apply-referral"
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border-none ${referral.length >= 4 ? "bg-cedu-blue text-white cursor-pointer" : "bg-black/[0.04] text-cedu-ink-muted cursor-not-allowed opacity-40"}`}>
                  {validateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "Aplicar"}
                </button>
              ) : (
                <div className="px-4 py-2.5 bg-cedu-green-light border border-cedu-green/30 rounded-xl text-cedu-green text-xs font-bold font-mono flex items-center gap-1" data-testid="referral-success"><Check size={14} /> −{referralDiscount}%</div>
              )}
            </div>
            {referralError && <p className="text-xs text-red-500 flex items-center gap-1" data-testid="referral-error"><XCircle size={12} /> {referralError}</p>}
            {referralMsg && !referralError && <p className="text-xs text-cedu-green flex items-center gap-1" data-testid="referral-message"><CheckCircle2 size={12} /> {referralMsg}</p>}
          </div>
        </div>
      </div>

      <div className="bg-cedu-blue-light/30 border border-cedu-blue/10 rounded-2xl p-5 mb-8">
        <h4 className="text-sm font-bold text-cedu-blue flex items-center gap-1.5 mb-3"><Layers size={14} /> Usa DOS wallets separadas</h4>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[230px] p-4 bg-cedu-orange-light/50 border border-cedu-orange/10 rounded-xl">
            <div className="text-xs font-bold text-cedu-orange mb-1 flex items-center gap-1"><Award size={12} /> Wallet de Certificados</div>
            <p className="text-[11px] text-cedu-ink-muted leading-relaxed">Se crea automáticamente al registrarte en <strong className="text-cedu-orange">ceduverse.org</strong>. Solo para NFTs educativos: DC-3, DC-5, diplomas, constancias. Sin fondos de valor.</p>
          </div>
          <div className="flex-1 min-w-[230px] p-4 bg-cedu-blue-light/50 border border-cedu-blue/10 rounded-xl">
            <div className="text-xs font-bold text-cedu-blue mb-1 flex items-center gap-1"><Coins size={12} /> Wallet de Criptoactivos</div>
            <p className="text-[11px] text-cedu-ink-muted leading-relaxed">Para BTC, ETH, USDT usa una wallet independiente en <strong className="text-cedu-blue">Tangem</strong> o MetaMask/Trust Wallet. Si comprometen una, la otra está a salvo.</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-cedu-orange/10 rounded-2xl p-6 mb-5">
        <div className="flex gap-6 flex-wrap items-center">
          <div className="flex-shrink-0 flex flex-col items-center gap-2.5">
            <VaultCard side={side} />
            <div className="flex gap-1.5">
              {(["front", "back"] as const).map((s) => (
                <button key={s} onClick={() => setSide(s)} data-testid={`btn-card-${s}`}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono cursor-pointer border ${side === s ? "bg-cedu-orange-light border-cedu-orange/30 text-cedu-orange" : "bg-transparent border-black/[0.06] text-cedu-ink-muted"}`}>
                  {s === "front" ? "Frente" : "Reverso"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-[240px]">
            <h3 className="text-xl font-extrabold text-cedu-ink mb-1">Ceduverse Vault Kit <span className="text-[10px] bg-cedu-orange-light text-cedu-orange px-2 py-0.5 rounded-lg font-mono ml-1">Black Edition</span>
              {isSoldOut("vault") && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-lg font-mono ml-1">AGOTADO</span>}
            </h3>
            <p className="text-2xl font-extrabold text-cedu-orange font-mono mb-2">{fmt(getPrice("vault"))} <span className="text-xs font-normal text-cedu-ink-muted">MXN</span></p>
            <p className="text-xs text-cedu-ink-muted leading-relaxed mb-2">Tarjeta metálica acero inoxidable <strong className="text-cedu-orange">sin chip bancario</strong> — cold storage exclusivo. Grid grabable, QR→NFT, Scriber, estuche tarjetero personalizado.</p>
            <div className="bg-red-50 border border-red-200/60 rounded-lg p-2 mb-3">
              <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertTriangle size={11} /> Sin chip. Separar pago y custodia evita que expongas tus contraseñas al pagar.</p>
            </div>
            <div className="mb-3">
              <label className="text-[10px] text-cedu-ink-muted font-mono block mb-1.5">PALABRAS EN FRASE SEMILLA</label>
              <div className="flex gap-1.5">
                {[12, 18, 24].map((n) => (
                  <button key={n} onClick={() => setSeedWords(n)} data-testid={`btn-seed-${n}`}
                    className={`px-4 py-2 rounded-lg text-sm font-bold font-mono cursor-pointer border ${seedWords === n ? "bg-cedu-orange-light border-cedu-orange/30 text-cedu-orange" : "bg-cedu-cream border-black/[0.06] text-cedu-ink-muted"}`}>{n}</button>
                ))}
              </div>
              <p className="text-[9px] text-cedu-ink-muted/60 font-mono mt-1">{seedWords === 12 ? "Estándar — compatible con la mayoría de wallets" : seedWords === 18 ? "Intermedio — mayor seguridad" : "Máxima seguridad — Ledger, Trezor"}</p>
            </div>
            <div className="flex items-center gap-3 mb-2">
              {isSoldOut("vault") ? (
                <span className="text-sm font-bold text-red-500 font-mono">Agotado</span>
              ) : (
                <>
                  <Qty value={cart.vault} onInc={() => inc("vault")} onDec={() => dec("vault")} />
                  {cart.vault > 0 && <span className="text-sm font-bold text-cedu-orange font-mono">{fmt(cart.vault * getPrice("vault"))}</span>}
                </>
              )}
            </div>
            <div className="text-[9px] text-cedu-ink-muted font-mono mt-1 flex items-center gap-1"><Package size={10} /> 30–45 días (edición especial)</div>
          </div>
        </div>
      </div>

      <div className="bg-cedu-blue-light/20 border border-cedu-blue/10 rounded-2xl p-6 mb-5">
        <h3 className="text-xl font-extrabold text-cedu-ink mb-2">Tangem Wallet</h3>
        <p className="text-xs text-cedu-ink-muted leading-relaxed mb-4">Hardware NFC, chip EAL6+ IP68, sin batería. Seedless o frase semilla. 85+ blockchains. Garantía 25 años.</p>
        <div className="flex gap-3 flex-wrap mb-3">
          {[{ k: "tangem2" as const, label: "2 tarjetas", sub: "1 principal + 1 backup" }, { k: "tangem3" as const, label: "3 tarjetas", sub: "1 principal + 2 backup" }].map((t) => (
            <div key={t.k} className={`flex-1 min-w-[200px] p-4 bg-white border border-cedu-blue/10 rounded-xl ${isSoldOut(t.k) ? "opacity-50 grayscale" : ""}`}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="text-sm font-bold text-cedu-ink">{t.label}</div>
                  <div className="text-[9px] text-cedu-ink-muted font-mono">{t.sub}</div>
                </div>
                <div className="text-lg font-extrabold text-cedu-blue font-mono">{fmt(getPrice(t.k))}</div>
              </div>
              {isSoldOut(t.k) ? (
                <span className="text-xs font-bold text-red-500 font-mono">Agotado</span>
              ) : (
                <div className="flex items-center gap-2">
                  <Qty value={cart[t.k]} onInc={() => inc(t.k)} onDec={() => dec(t.k)} color="cedu-blue" />
                  {cart[t.k] > 0 && <span className="text-xs font-bold text-cedu-blue font-mono">{fmt(cart[t.k] * getPrice(t.k))}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
        {(cart.tangem2 > 0 || cart.tangem3 > 0) && (
          <div className="bg-amber-50 border border-amber-200/60 rounded-lg p-2">
            <p className="text-[10px] text-amber-600 flex items-center gap-1"><Truck size={11} /> Entrega estimada: <strong>30–60 días</strong>. Producto importado. Se procesa al confirmar pago.</p>
          </div>
        )}
      </div>

      {sub > 0 && (
        <div className="bg-gradient-to-r from-cedu-blue-light/30 to-cedu-orange-light/30 border border-cedu-blue/15 rounded-2xl p-6 mb-8">
          {step === "browse" && (
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <div className="text-[10px] text-cedu-ink-muted font-mono mb-1">TU ORDEN</div>
                <div className="text-sm text-cedu-ink font-semibold">
                  {cart.vault > 0 && <span>{cart.vault}x Vault Kit </span>}
                  {cart.tangem2 > 0 && <span>{cart.tangem2}x Tangem 2-pack </span>}
                  {cart.tangem3 > 0 && <span>{cart.tangem3}x Tangem 3-pack </span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-cedu-ink-muted font-mono">SUBTOTAL{referralApplied ? ` (−${referralDiscount}%)` : ""}</div>
                  {referralApplied && <div className="text-xs text-cedu-ink-muted/50 font-mono line-through">{fmt(subBefore)}</div>}
                  <div data-testid="text-subtotal" className={`text-xl font-extrabold font-mono ${referralApplied ? "text-cedu-green" : "text-cedu-ink"}`}>{fmt(sub)}</div>
                </div>
                <button onClick={() => setStep("shipping")} data-testid="btn-continue"
                  className="px-5 py-3 bg-cedu-blue text-white rounded-xl text-sm font-bold cursor-pointer border-none hover:bg-cedu-blue-dark transition-colors flex items-center gap-1">Continuar <ArrowRight size={16} /></button>
              </div>
            </div>
          )}
          {step === "shipping" && (
            <>
              <div className="flex justify-between mb-4"><h3 className="text-base font-bold text-cedu-ink flex items-center gap-1.5"><Package size={16} /> Datos de Envío</h3><button onClick={() => setStep("browse")} className="bg-transparent border-none text-cedu-ink-muted cursor-pointer text-xs font-mono">← Volver</button></div>
              <div className="flex flex-wrap gap-2.5 mb-4">
                <ShipField label="NOMBRE" field="name" ph="Juan Pérez" value={ship.name} onChange={updateShip} />
                <ShipField label="EMAIL" field="email" ph="juan@email.com" type="email" value={ship.email} onChange={updateShip} />
                <ShipField label="TELÉFONO" field="phone" ph="8112345678" type="tel" value={ship.phone} onChange={updateShip} />
                <ShipField label="CALLE Y NÚMERO" field="street" ph="Av. Constitución 1000" value={ship.street} onChange={updateShip} />
                <ShipField label="COLONIA" field="colony" ph="Centro" value={ship.colony} onChange={updateShip} />
                <ShipField label="CIUDAD" field="city" ph="Monterrey" value={ship.city} onChange={updateShip} />
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] text-cedu-ink-muted font-mono block mb-1">ESTADO *</label>
                  <select value={ship.state} onChange={(e) => updateShip("state", e.target.value)} data-testid="input-ship-state"
                    className="w-full px-3 py-2.5 bg-cedu-cream border border-black/[0.08] rounded-xl text-cedu-ink text-sm outline-none focus:border-cedu-blue/40 focus:ring-2 focus:ring-cedu-blue/10 transition-all">
                    <option value="">Seleccionar estado</option>
                    {MEXICAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <ShipField label="C.P." field="zip" ph="64000" value={ship.zip} onChange={updateShip} />
              </div>
              <div className="flex justify-end gap-3">
                {quote && <div className="flex-1 p-3 bg-cedu-blue-light/40 border border-cedu-blue/10 rounded-xl"><div className="text-[10px] text-cedu-ink-muted font-mono">{quote.carrier} · {quote.days}</div><div className="text-base font-extrabold text-cedu-blue font-mono">{fmt(quote.price)}</div></div>}
                <button onClick={quote ? () => setStep("confirm") : () => quoteMutation.mutate()} disabled={!canShip || quoteMutation.isPending} data-testid="btn-quote-or-review"
                  className={`px-5 py-3 rounded-xl text-sm font-bold border-none flex items-center gap-2 ${canShip ? "bg-cedu-blue text-white cursor-pointer" : "bg-black/[0.06] text-cedu-ink-muted cursor-not-allowed opacity-50"}`}>
                  {quoteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  {quote ? "Revisar orden →" : "Cotizar envío"}
                </button>
              </div>
              {quoteMutation.isError && (
                <div className="mt-3 bg-red-50 border border-red-200/60 rounded-lg p-2 text-red-500 text-xs flex items-center gap-1" data-testid="shipping-error">
                  <AlertCircle size={12} /> Error al obtener cotización de envío. Verifica tus datos.
                </div>
              )}
            </>
          )}
          {step === "confirm" && (
            <>
              <div className="flex justify-between mb-4"><h3 className="text-base font-bold text-cedu-ink flex items-center gap-1.5"><CreditCard size={16} /> Confirmar Orden</h3><button onClick={() => setStep("shipping")} className="bg-transparent border-none text-cedu-ink-muted cursor-pointer text-xs font-mono">← Volver</button></div>
              <div className="mb-3 space-y-1">
                {cart.vault > 0 && <div className="flex justify-between py-1 text-xs text-cedu-ink-soft"><span>{cart.vault}x Vault Kit ({seedWords} palabras)</span><span className="font-mono font-bold">{fmt(cart.vault * getPrice("vault"))}</span></div>}
                {cart.tangem2 > 0 && <div className="flex justify-between py-1 text-xs text-cedu-ink-soft"><span>{cart.tangem2}x Tangem 2-pack</span><span className="font-mono font-bold">{fmt(cart.tangem2 * getPrice("tangem2"))}</span></div>}
                {cart.tangem3 > 0 && <div className="flex justify-between py-1 text-xs text-cedu-ink-soft"><span>{cart.tangem3}x Tangem 3-pack</span><span className="font-mono font-bold">{fmt(cart.tangem3 * getPrice("tangem3"))}</span></div>}
                {referralApplied && <div className="flex justify-between py-1 text-xs text-cedu-green"><span>Descuento referido (−{referralDiscount}%)</span><span className="font-mono font-bold">−{fmt(subBefore - sub)}</span></div>}
                <div className="flex justify-between py-1 text-xs text-cedu-ink-soft"><span>Envío ({quote?.carrier})</span><span className="font-mono font-bold">{fmt(quote?.price || 0)}</span></div>
                <div className="border-t border-cedu-blue/15 pt-2 flex justify-between text-base"><span className="font-bold text-cedu-ink">Total</span><span className="font-extrabold text-cedu-blue font-mono" data-testid="text-total">{fmt(total)} MXN</span></div>
              </div>
              <div className="bg-cedu-cream border border-black/[0.06] rounded-xl p-3 mb-4 text-xs text-cedu-ink-muted">
                <p className="font-bold text-cedu-ink text-[10px] font-mono mb-1">ENVIAR A:</p>
                <p>{ship.name} · {ship.email} · {ship.phone}</p>
                <p>{ship.street}, {ship.colony}, {ship.city}, {ship.state} C.P. {ship.zip}</p>
              </div>
              <button onClick={() => createOrderMutation.mutate()} disabled={createOrderMutation.isPending} data-testid="btn-pay"
                className="w-full px-5 py-3.5 bg-cedu-blue text-white rounded-xl text-sm font-bold cursor-pointer border-none hover:bg-cedu-blue-dark transition-colors flex items-center justify-center gap-2">
                {createOrderMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                Pagar con tarjeta
              </button>
              {createOrderMutation.isError && (
                <div className="mt-3 bg-red-50 border border-red-200/60 rounded-lg p-2 text-red-500 text-xs flex items-center gap-1">
                  <AlertCircle size={12} /> Error al crear la orden. Intenta de nuevo.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </AnimatedSection>
  );
}

function SeguridadSection() {
  return (
    <AnimatedSection>
      <div className="text-center pt-16 pb-10">
        <motion.h1 className="font-serif text-[clamp(1.8rem,5vw,3rem)] leading-tight tracking-tight text-cedu-ink mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          Seguridad y <em className="text-cedu-blue not-italic italic">Autocustodia</em>
        </motion.h1>
      </div>

      <div className="flex gap-3.5 flex-wrap mb-8">
        {[
          { icon: <Shield size={16} />, title: "NO dejes cripto en exchanges", desc: 'Si quiebran o congelan retiros (Mt. Gox, FTX, Celsius), pierdes todo. "Not your keys, not your coins."', color: "red" },
          { icon: <CreditCard size={16} />, title: "NO confíes todo a una fintech", desc: "Pueden congelar cuentas o ser intervenidas. Ideales para gasto diario, no como refugio de valor.", color: "amber" },
          { icon: <KeyRound size={16} />, title: "Diversifica entre capas", desc: "Fintech para liquidez + cold storage para soberanía. Separa el pago de la custodia.", color: "blue" },
        ].map((c, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" animate="visible" custom={i + 1}
            className={`flex-1 min-w-[260px] rounded-2xl p-5 border ${c.color === "red" ? "bg-red-50 border-red-200/50" : c.color === "amber" ? "bg-amber-50 border-amber-200/50" : "bg-cedu-blue-light/40 border-cedu-blue/15"}`}>
            <h4 className={`text-sm font-bold mb-2 flex items-center gap-1.5 ${c.color === "red" ? "text-red-500" : c.color === "amber" ? "text-amber-600" : "text-cedu-blue"}`}>{c.icon} {c.title}</h4>
            <p className="text-[11px] text-cedu-ink-muted leading-relaxed">{c.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-cedu-orange-light/40 border border-cedu-orange/10 rounded-2xl p-5 mb-8">
        <h4 className="text-sm font-bold text-cedu-orange mb-2 flex items-center gap-1.5"><KeyRound size={14} /> ¿Por qué la Vault Card NO tiene chip?</h4>
        <p className="text-xs text-cedu-ink-muted leading-relaxed">
          Una tarjeta con chip se entrega a cajeros y meseros. Si tiene tu frase semilla, pueden copiarla. La Vault Card es <strong className="text-cedu-orange">solo cold storage</strong> — nunca sale de tu estuche. <strong className="text-cedu-blue">Separar pago y custodia es la regla #1.</strong>
        </p>
      </div>

      <div className="bg-white border border-black/[0.06] rounded-2xl p-6 mb-8">
        <h3 className="text-base font-bold text-cedu-ink text-center mb-4 font-serif">Wallets Descentralizadas Recomendadas</h3>
        <div className="flex gap-3 flex-wrap justify-center mb-6">
          {[
            { name: "Tangem", type: "Hardware NFC", seeds: "Seedless o 12/24", diff: "Fácil", icon: <CreditCard size={20} className="text-cedu-blue" /> },
            { name: "Trust Wallet", type: "Móvil (iOS/Android)", seeds: "12 palabras", diff: "Fácil", icon: <Shield size={20} className="text-cedu-green" /> },
            { name: "MetaMask", type: "Navegador + Móvil", seeds: "12 palabras", diff: "Intermedio", icon: <Hexagon size={20} className="text-cedu-orange" /> },
            { name: "Phantom", type: "Solana + Multi-chain", seeds: "12 palabras", diff: "Fácil", icon: <Zap size={20} className="text-cedu-violet" /> },
            { name: "Ledger", type: "Hardware USB", seeds: "24 palabras", diff: "Intermedio", icon: <KeyRound size={20} className="text-cedu-blue" /> },
            { name: "Trezor", type: "Hardware USB", seeds: "12/24 palabras", diff: "Intermedio", icon: <Lock size={20} className="text-cedu-ink" /> },
          ].map((w, i) => (
            <div key={i} className="flex-1 min-w-[140px] max-w-[170px] bg-cedu-cream border border-black/[0.06] rounded-xl p-4 text-center card-shine-sweep">
              <div className="mb-2 flex items-center justify-center">{w.icon}</div>
              <div className="text-sm font-bold text-cedu-ink mb-0.5">{w.name}</div>
              <div className="text-[9px] text-cedu-ink-muted font-mono mb-1">{w.type}</div>
              <div className="text-[10px] text-cedu-blue font-mono mb-0.5">{w.seeds}</div>
              <div className={`text-[9px] font-mono ${w.diff === "Fácil" ? "text-cedu-green" : "text-amber-500"}`}>{w.diff}</div>
            </div>
          ))}
        </div>
        <h3 className="text-base font-bold text-cedu-ink text-center mb-4 font-serif">Criptomonedas Recomendadas</h3>
        <div className="flex gap-2 flex-wrap justify-center">
          {[
            { symbol: "BTC", name: "Bitcoin", color: "#F7931A", icon: <Coins size={16} /> },
            { symbol: "ETH", name: "Ethereum", color: "#627EEA", icon: <Diamond size={16} /> },
            { symbol: "USDT", name: "Tether", color: "#26A17B", icon: <CircleDollarSign size={16} /> },
            { symbol: "USDC", name: "USD Coin", color: "#2775CA", icon: <CircleDollarSign size={16} /> },
            { symbol: "MATIC", name: "Polygon", color: "#8247E5", icon: <Hexagon size={16} /> },
            { symbol: "SOL", name: "Solana", color: "#9945FF", icon: <Sun size={16} /> },
            { symbol: "BNB", name: "BNB Chain", color: "#F0B90B", icon: <Diamond size={16} /> },
            { symbol: "DAI", name: "Dai", color: "#F5AC37", icon: <Landmark size={16} /> },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-cedu-cream border border-black/[0.06] rounded-lg">
              <span style={{ color: c.color }}>{c.icon}</span>
              <div>
                <div className="text-xs font-bold font-mono" style={{ color: c.color }}>{c.symbol}</div>
                <div className="text-[9px] text-cedu-ink-muted">{c.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-black/[0.06] rounded-2xl p-5 mb-8 overflow-x-auto">
        <h3 className="text-base font-bold text-cedu-ink text-center mb-4 font-serif">Matriz de Seguridad</h3>
        <table className="w-full border-collapse text-[11px] min-w-[520px]">
          <thead>
            <tr>
              {["", "Vault Card", "Tangem"].map((h, i) => (
                <th key={i} className={`py-2 px-1 font-bold border-b border-cedu-blue/15 font-mono text-[9px] ${i === 0 ? "text-left text-cedu-ink-muted" : "text-center text-cedu-blue"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Custodia", "Tú (acero)", "Tú (NFC)"],
              ["KYC", "No", "No"],
              ["Embargo", "Nulo", "Nulo"],
              ["Chip", "NO — acero", "EAL6+"],
              ["Recuperación", "Frase semilla", "Backup card"],
              ["Volatilidad", "Alta (cripto)", "Alta (cripto)"],
              ["Garantía", "Inoxidable", "25 años"],
            ].map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-cedu-cream/50" : ""}>
                {row.map((cell, j) => (
                  <td key={j} className={`py-[7px] px-1 border-b border-black/[0.03] ${j === 0 ? "text-left font-semibold text-cedu-ink" : "text-center"} ${cell.includes("Nulo") || cell.includes("NO") ? "text-cedu-ink font-semibold" : "text-cedu-ink-muted"}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Disclosures />
    </AnimatedSection>
  );
}

function BlockchainSection() {
  const blocks = ["Certificado", "Verificación", "Almacenamiento", "Recuperación"];
  return (
    <AnimatedSection>
      <div className="text-center pt-16 pb-10">
        <motion.h1 className="font-serif text-[clamp(1.8rem,5vw,3rem)] leading-tight tracking-tight text-cedu-ink mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          Bóveda <em className="text-cedu-blue not-italic italic">Blockchain</em>
        </motion.h1>
      </div>
      <div className="flex items-center justify-center gap-0 overflow-x-auto pb-8 flex-wrap">
        {blocks.map((b, i) => (
          <div key={i} className="flex items-center">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={i + 1}
              className="w-[110px] p-3 bg-cedu-blue-light/40 border border-cedu-blue/20 rounded-lg text-center">
              <div className="text-[7px] text-cedu-blue font-mono mb-1 opacity-60">BLOCK #{i + 1}</div>
              <div className="text-[11px] text-cedu-ink font-semibold">{b}</div>
            </motion.div>
            {i < blocks.length - 1 && <div className="w-6 h-0.5 bg-gradient-to-r from-cedu-blue/40 to-cedu-blue/10" />}
          </div>
        ))}
      </div>

      <div className="bg-white border border-black/[0.06] rounded-2xl p-5 mb-8">
        <h3 className="text-sm font-bold text-cedu-ink text-center mb-1 font-serif">Redes blockchain compatibles</h3>
        <p className="text-[11px] text-cedu-ink-muted text-center mb-4">Tu Vault Card y Tangem son compatibles con estas redes y monedas.</p>
        <div className="flex gap-2.5 flex-wrap justify-center">
          {[
            { symbol: "BTC", name: "Bitcoin", color: "#F7931A", icon: <Coins size={18} />, net: "Bitcoin Network" },
            { symbol: "ETH", name: "Ethereum", color: "#627EEA", icon: <Diamond size={18} />, net: "Ethereum / L2s" },
            { symbol: "USDT", name: "Tether", color: "#26A17B", icon: <CircleDollarSign size={18} />, net: "Multi-chain" },
            { symbol: "USDC", name: "USD Coin", color: "#2775CA", icon: <CircleDollarSign size={18} />, net: "Ethereum / Polygon" },
            { symbol: "MATIC", name: "Polygon", color: "#8247E5", icon: <Hexagon size={18} />, net: "Polygon PoS" },
            { symbol: "SOL", name: "Solana", color: "#9945FF", icon: <Sun size={18} />, net: "Solana Network" },
            { symbol: "BNB", name: "BNB", color: "#F0B90B", icon: <Diamond size={18} />, net: "BNB Smart Chain" },
            { symbol: "DAI", name: "Dai", color: "#F5AC37", icon: <Landmark size={18} />, net: "Ethereum / Polygon" },
            { symbol: "AVAX", name: "Avalanche", color: "#E84142", icon: <Triangle size={18} />, net: "C-Chain" },
            { symbol: "ARB", name: "Arbitrum", color: "#28A0F0", icon: <Circle size={18} />, net: "Arbitrum One" },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-cedu-blue-light/30 border border-cedu-blue/10 rounded-xl">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${c.color}22`, color: c.color }}>{c.icon}</div>
              <div>
                <div className="text-sm font-bold font-mono" style={{ color: c.color }}>{c.symbol}</div>
                <div className="text-[8px] text-cedu-ink-muted font-mono">{c.net}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3.5 flex-wrap justify-center mb-8">
        {[
          { i: <Link2 size={18} />, t: "Certificados On-Chain", d: "Hash único e inmutable en Polygon." },
          { i: <Award size={18} />, t: "NFTs Educativos", d: "DC-3, DC-5, diplomas verificables." },
          { i: <Sparkles size={18} />, t: "Verificación Instantánea", d: "QR→NFT sin intermediarios." },
          { i: <ShieldCheck size={18} />, t: "Privacidad Garantizada", d: "Solo tú verificas tu historial." },
          { i: <Lock size={18} />, t: "Inembargable", d: "Fuera del alcance de embargos." },
          { i: <BadgeCheck size={18} />, t: "Auditoría Inmutable", d: "Blockchain público y transparente." },
        ].map((x, idx) => (
          <motion.div key={idx} variants={fadeUp} initial="hidden" animate="visible" custom={idx}
            className="flex-1 min-w-[180px] max-w-[220px] bg-cedu-blue-light/30 border border-cedu-blue/10 rounded-2xl p-5 text-center card-shine-sweep">
            <div className="w-12 h-12 rounded-full bg-cedu-blue-light flex items-center justify-center mx-auto mb-3 text-cedu-blue">{x.i}</div>
            <h4 className="text-sm font-bold text-cedu-ink mb-1">{x.t}</h4>
            <p className="text-[11px] text-cedu-ink-muted">{x.d}</p>
          </motion.div>
        ))}
      </div>
      <Disclosures />
    </AnimatedSection>
  );
}

function FaqsSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const faqs = [
    { q: "¿Qué es una criptomoneda?", a: "Es dinero digital que funciona en una red descentralizada llamada blockchain. No depende de bancos ni gobiernos. Ejemplos: Bitcoin (BTC), Ethereum (ETH), USDT (dólar digital). Puedes enviar y recibir valor a cualquier parte del mundo, las 24 horas, sin intermediarios." },
    { q: "¿Qué es una wallet (billetera)?", a: "Es una app o dispositivo que guarda tus criptomonedas. Tiene una dirección pública (como un número de cuenta para recibir) y una clave privada (como tu contraseña secreta). Hay wallets en tu celular (Trust Wallet, MetaMask) y wallets físicas (Tangem, Ledger). Ceduverse también te crea una wallet automática para tus certificados educativos." },
    { q: "¿Qué es una frase semilla (seed phrase)?", a: "Son 12, 18 o 24 palabras en orden que te permiten recuperar tu wallet si pierdes tu celular o dispositivo. Es como la llave maestra de tu bóveda. NUNCA la compartas con nadie, ni con Ceduverse. Si alguien tiene tu frase semilla, puede tomar todos tus fondos. La Vault Card está diseñada para que la grabes en acero inoxidable y la guardes en tu estuche." },
    { q: "¿Qué es cold storage (almacenamiento frío)?", a: "Es guardar tus criptomonedas sin conexión a internet. Tu frase semilla grabada en la Vault Card de acero es cold storage: no tiene chip, no tiene Bluetooth, no se puede hackear remotamente. Es la forma más segura de proteger grandes cantidades." },
    { q: "¿Por qué la Vault Card NO tiene chip?", a: "Porque una tarjeta con chip se usa para pagar — se la entregas a cajeros, meseros, etc. Si tu frase semilla estuviera en una tarjeta con chip, cualquiera podría copiarla. La Vault Card es SOLO para guardar tu frase semilla en acero. Separar el pago de la custodia es la regla #1 de seguridad en cripto." },
    { q: "¿Qué diferencia hay entre la Vault Card y Tangem?", a: "La Vault Card es una tarjeta de acero inoxidable SIN electrónica — solo graba tu frase semilla físicamente. Tangem es una wallet con chip NFC que firma transacciones desde tu celular. Son complementarias: Tangem para operar día a día, Vault Card para respaldar tu frase semilla a largo plazo." },
    { q: "¿Qué es un NFT?", a: "NFT significa Token No Fungible. Es un certificado digital único registrado en blockchain que prueba que algo te pertenece. En Ceduverse, tus diplomas, DC-3, DC-5 y constancias se emiten como NFTs en la red Polygon — son verificables, inmutables y nadie te los puede quitar." },
    { q: "¿Necesito saber de cripto para usar Ceduverse?", a: "No. Tu wallet de certificados se crea automáticamente al registrarte. No necesitas comprar criptomonedas para recibir tus diplomas y constancias. Si quieres ir más allá (invertir, diversificar), ahí sí te recomendamos configurar una wallet separada como Tangem." },
    { q: "¿Ceduverse puede acceder a mis fondos o mi frase semilla?", a: "NO. Ceduverse es una plataforma educativa. Nunca almacenamos ni tenemos acceso a tus claves privadas ni a tu frase semilla. Si pierdes tu frase semilla, nadie puede recuperar tus fondos — ni Ceduverse, ni nadie. Por eso la Vault Card existe: para que la guardes tú en acero." },
    { q: "¿Qué es autocustodia?", a: "Es cuando TÚ controlas tus llaves privadas y tu frase semilla, sin depender de un banco, exchange o fintech. Si una empresa centralizada quiebra (como FTX), tus fondos en autocustodia están a salvo. 'Not your keys, not your coins' — si no tienes las llaves, no son tus monedas." },
    { q: "¿Cómo funciona el código de referido?", a: "Si un socio Ceduverse te comparte su código, ingrésalo en la tienda antes de pagar y obtendrás un 15% de descuento en tu compra. El código debe tener al menos 4 caracteres. El socio que te refirió también recibe beneficios." },
    { q: "¿Cuánto tarda el envío?", a: "La Vault Card es edición especial limitada con entrega de 30 a 45 días. Los Tangem son producto importado con entrega de 30 a 60 días. Ambos se procesan al confirmar el pago y se envían a tu domicilio vía paquetería." },
    { q: "¿Puedo pagar con tarjeta de crédito o débito?", a: "Sí. La tienda acepta tarjetas de crédito y débito a través de Stripe. Ceduverse nunca almacena los datos de tu tarjeta. El pago se procesa de forma cifrada y segura." },
    { q: "¿Es legal tener criptomonedas en México?", a: "Sí. La Ley Fintech de 2018 regula activos virtuales en México. CNBV y Banxico supervisan a las instituciones que operan con cripto. Tener criptomonedas como persona física es completamente legal. Lo que SÍ debes hacer es declararlas ante el SAT si superas ciertos montos." },
  ];

  return (
    <AnimatedSection>
      <div className="text-center pt-16 pb-10">
        <motion.div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cedu-violet-light rounded-full text-[13px] font-bold text-cedu-violet mb-6" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <HelpCircle size={14} /> Preguntas Frecuentes
        </motion.div>
        <motion.h1 className="font-serif text-[clamp(1.8rem,5vw,3rem)] leading-tight tracking-tight text-cedu-ink mb-4" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          Todo lo que necesitas <em className="text-cedu-violet not-italic italic">saber</em>
        </motion.h1>
        <motion.p className="text-base leading-relaxed text-cedu-ink-muted max-w-lg mx-auto" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
          Respuestas claras a las dudas más comunes sobre wallets, criptomonedas y seguridad digital.
        </motion.p>
      </div>
      <div className="space-y-2 mb-8">
        {faqs.map((faq, idx) => (
          <motion.div key={idx} variants={fadeUp} initial="hidden" animate="visible" custom={Math.min(idx, 5)}
            className="bg-white border border-black/[0.06] rounded-xl overflow-hidden">
            <button onClick={() => setOpenIdx(openIdx === idx ? null : idx)} data-testid={`faq-${idx}`}
              className="w-full flex justify-between items-center px-4 py-3.5 bg-transparent border-none cursor-pointer text-left">
              <span className="text-sm font-semibold text-cedu-ink leading-snug">{faq.q}</span>
              <ChevronDown size={16} className={`text-cedu-ink-muted flex-shrink-0 ml-2 transition-transform duration-300 ${openIdx === idx ? "rotate-180" : ""}`} />
            </button>
            {openIdx === idx && (
              <div className="px-4 pb-4 -mt-1">
                <p className="text-xs text-cedu-ink-muted leading-relaxed">{faq.a}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
      <Disclosures />
    </AnimatedSection>
  );
}

export default function TiendaPage() {
  useForceLightMode();
  const [sec, setSec] = useState("tienda");
  const [fade, setFade] = useState(true);
  const go = (s: string) => { setFade(false); setTimeout(() => { setSec(s); setFade(true); window.scrollTo({ top: 0, behavior: "smooth" }); }, 200); };

  return (
    <div className="min-h-screen bg-cedu-cream overflow-x-hidden">
      <StoreNavbar sec={sec} onNav={go} />
      <div className={`max-w-[1100px] mx-auto px-5 transition-all duration-400 ${fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
        {sec === "tienda" && <TiendaContent />}
        {sec === "seguridad" && <SeguridadSection />}
        {sec === "blockchain" && <BlockchainSection />}
        {sec === "faqs" && <FaqsSection />}
      </div>
      <footer className="text-center py-10 px-5 border-t border-black/[0.06]" data-testid="store-footer">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-[13px] text-cedu-ink-muted">
          <span>&copy; 2026 Ceduverse. Todos los derechos reservados.</span>
          <div className="flex items-center gap-4">
            <Link href="/terminos" className="hover:text-cedu-blue transition-colors no-underline text-cedu-ink-muted" data-testid="link-footer-terminos">Términos</Link>
            <Link href="/privacidad" className="hover:text-cedu-blue transition-colors no-underline text-cedu-ink-muted" data-testid="link-footer-privacidad">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function TiendaSuccess() {
  useForceLightMode();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get("order") || params.get("external_reference") || "";

  return (
    <div className="min-h-screen bg-cedu-cream flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white border border-cedu-green/20 rounded-2xl p-8 text-center shadow-lg"
        data-testid="success-page"
      >
        <div className="w-16 h-16 rounded-full bg-cedu-green-light flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} className="text-cedu-green" />
        </div>
        <h1 className="font-serif text-2xl text-cedu-ink mb-2">¡Pago Confirmado!</h1>
        {orderNumber && (
          <p className="text-cedu-blue font-bold text-sm mb-4" data-testid="text-order-number">Orden: {orderNumber}</p>
        )}
        <p className="text-cedu-ink-muted text-sm mb-6">Tu orden está siendo preparada. Recibirás un correo con la confirmación y datos de envío.</p>
        <div className="flex flex-col gap-3">
          <Link href="/tienda" className="bg-cedu-blue text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-cedu-blue-dark transition-all no-underline text-center" data-testid="link-back-store">Volver a la Tienda</Link>
          <Link href="/" className="bg-cedu-cream border border-black/[0.08] text-cedu-ink px-6 py-3 rounded-xl font-bold text-sm hover:bg-cedu-blue-light transition-all no-underline text-center" data-testid="link-back-home">Ir al Inicio</Link>
        </div>
      </motion.div>
    </div>
  );
}

export function TiendaFailure() {
  useForceLightMode();
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get("order") || params.get("external_reference") || "";

  return (
    <div className="min-h-screen bg-cedu-cream flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white border border-red-200/60 rounded-2xl p-8 text-center shadow-lg"
        data-testid="failure-page"
      >
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <XCircle size={32} className="text-red-500" />
        </div>
        <h1 className="font-serif text-2xl text-cedu-ink mb-2">Pago No Procesado</h1>
        {orderNumber && (
          <p className="text-cedu-ink-muted font-bold text-sm mb-4" data-testid="text-order-number">Orden: {orderNumber}</p>
        )}
        <p className="text-cedu-ink-muted text-sm mb-6">El pago no se pudo procesar. Puedes intentar de nuevo o contactarnos para ayuda.</p>
        <div className="flex flex-col gap-3">
          <Link href="/tienda" className="bg-cedu-blue text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-cedu-blue-dark transition-all no-underline text-center" data-testid="link-retry">Intentar de Nuevo</Link>
          <a href="mailto:hola@ceduverse.org" className="bg-cedu-cream border border-black/[0.08] text-cedu-ink px-6 py-3 rounded-xl font-bold text-sm hover:bg-cedu-blue-light transition-all no-underline text-center" data-testid="link-contact">Contactar Soporte</a>
        </div>
      </motion.div>
    </div>
  );
}

export function TiendaPending() {
  useForceLightMode();
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get("order") || params.get("external_reference") || "";

  return (
    <div className="min-h-screen bg-cedu-cream flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white border border-cedu-orange/20 rounded-2xl p-8 text-center shadow-lg"
        data-testid="pending-page"
      >
        <div className="w-16 h-16 rounded-full bg-cedu-orange-light flex items-center justify-center mx-auto mb-6">
          <Clock size={32} className="text-cedu-orange" />
        </div>
        <h1 className="font-serif text-2xl text-cedu-ink mb-2">Pago Pendiente</h1>
        {orderNumber && (
          <p className="text-cedu-orange font-bold text-sm mb-4" data-testid="text-order-number">Orden: {orderNumber}</p>
        )}
        <p className="text-cedu-ink-muted text-sm mb-6">Tu pago está pendiente de confirmación. Te notificaremos por correo cuando se confirme.</p>
        <div className="flex flex-col gap-3">
          <Link href="/tienda" className="bg-cedu-blue text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-cedu-blue-dark transition-all no-underline text-center" data-testid="link-back-store">Volver a la Tienda</Link>
          <Link href="/" className="bg-cedu-cream border border-black/[0.08] text-cedu-ink px-6 py-3 rounded-xl font-bold text-sm hover:bg-cedu-blue-light transition-all no-underline text-center" data-testid="link-back-home">Ir al Inicio</Link>
        </div>
      </motion.div>
    </div>
  );
}
