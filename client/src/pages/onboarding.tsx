import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForceLightMode } from "@/components/ThemeProvider";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  User,
  Wallet,
  Sparkles,
  Rocket,
  Shield,
  Heart,
  Users,
  Scale,
  Briefcase,
  Brain,
  Flame,
  BookOpen,
  Building2,
  UserCircle,
} from "lucide-react";
import { CreateWalletModal } from "@/components/wallet/create-wallet-modal";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";

type Profile = {
  id: string;
  fullName: string | null;
  country: string | null;
  city: string | null;
  phoneNumber: string | null;
  walletAddress: string | null;
  interest: any;
  genre: string | null;
};

type Account = {
  id: string;
  accountType: string;
  accountSetup: number;
};

const INTEREST_OPTIONS = [
  { id: "seguridad-industrial", label: "Seguridad Industrial", icon: Shield },
  { id: "recursos-humanos", label: "Recursos Humanos", icon: Users },
  { id: "cumplimiento-normativo", label: "Cumplimiento Normativo", icon: Scale },
  { id: "liderazgo", label: "Liderazgo", icon: Flame },
  { id: "desarrollo-humano", label: "Desarrollo Humano", icon: Heart },
  { id: "capacitacion-empresarial", label: "Capacitación Empresarial", icon: Briefcase },
  { id: "salud-ocupacional", label: "Salud Ocupacional", icon: Brain },
  { id: "educacion-continua", label: "Educación Continua", icon: BookOpen },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 0, label: "Bienvenida" },
    { num: 1, label: "Perfil" },
    { num: 2, label: "Wallet" },
    { num: 3, label: "Intereses" },
    { num: 4, label: "Listo" },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8" data-testid="step-indicator">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step.num < currentStep
                ? "bg-cedu-green text-white"
                : step.num === currentStep
                ? "bg-cedu-blue text-white"
                : "bg-black/[0.06] text-cedu-ink-muted"
            }`}
            data-testid={`step-${step.num}`}
          >
            {step.num < currentStep ? <CheckCircle2 size={14} /> : step.num + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 rounded ${step.num < currentStep ? "bg-cedu-green" : "bg-black/[0.06]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function WelcomeStep({ onNext, userType, setUserType }: { onNext: () => void; userType: "individual" | "organization"; setUserType: (t: "individual" | "organization") => void }) {
  return (
    <div className="text-center py-8 animate-rise" data-testid="step-welcome">
      <div className="w-20 h-20 bg-cedu-blue rounded-3xl flex items-center justify-center text-white font-serif text-4xl mx-auto mb-6">
        C
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl text-cedu-ink mb-3" data-testid="text-welcome-title">
        ¡Bienvenido a Ceduverse!
      </h1>
      <p className="text-cedu-ink-muted text-base max-w-md mx-auto mb-8">
        Tu plataforma de capacitación, certificación y logros coleccionables.
        Configuremos tu cuenta en unos sencillos pasos.
      </p>

      <p className="text-sm font-semibold text-cedu-ink mb-4">¿Cómo deseas usar Ceduverse?</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-8">
        <button
          onClick={() => { setUserType("individual"); sessionStorage.removeItem("cedu_registro_empresa"); sessionStorage.removeItem("cedu_plan"); sessionStorage.removeItem("cedu_collaborators"); }}
          className={`p-5 rounded-xl border text-center transition-all cursor-pointer ${
            userType === "individual"
              ? "border-cedu-blue bg-cedu-blue-light"
              : "border-black/[0.06] hover:border-cedu-blue/30"
          }`}
          data-testid="button-user-type-individual"
        >
          <UserCircle size={32} className={`mx-auto mb-2 ${userType === "individual" ? "text-cedu-blue" : "text-cedu-ink-muted"}`} />
          <p className={`text-sm font-bold ${userType === "individual" ? "text-cedu-blue" : "text-cedu-ink"}`}>Soy persona</p>
          <p className="text-xs text-cedu-ink-muted mt-1">Capacitación individual</p>
        </button>
        <button
          onClick={() => setUserType("organization")}
          className={`p-5 rounded-xl border text-center transition-all cursor-pointer ${
            userType === "organization"
              ? "border-cedu-blue bg-cedu-blue-light"
              : "border-black/[0.06] hover:border-cedu-blue/30"
          }`}
          data-testid="button-user-type-organization"
        >
          <Building2 size={32} className={`mx-auto mb-2 ${userType === "organization" ? "text-cedu-blue" : "text-cedu-ink-muted"}`} />
          <p className={`text-sm font-bold ${userType === "organization" ? "text-cedu-blue" : "text-cedu-ink"}`}>Represento una organización</p>
          <p className="text-xs text-cedu-ink-muted mt-1">Capacitación empresarial</p>
        </button>
      </div>

      <Button
        onClick={onNext}
        className="bg-cedu-blue hover:bg-cedu-blue-dark text-white font-bold rounded-xl h-12 px-10 text-base"
        data-testid="button-start-onboarding"
      >
        Comenzar <ChevronRight size={18} className="ml-2" />
      </Button>
    </div>
  );
}

function ProfileStep({
  profile,
  onNext,
  onBack,
  userType,
}: {
  profile: Profile | null;
  onNext: () => void;
  onBack: () => void;
  userType: "individual" | "organization";
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    fullName: profile?.fullName || "",
    country: profile?.country || "México",
    city: profile?.city || "",
    phoneNumber: profile?.phoneNumber || "",
  });
  const savedCollabs = sessionStorage.getItem("cedu_collaborators") || "";
  const [orgForm, setOrgForm] = useState({
    companyName: "",
    industry: "",
    collaborators: savedCollabs,
    rfc: "",
    razonSocial: "",
    regimenFiscal: "",
    codigoPostalFiscal: "",
  });
  const savedPlan = sessionStorage.getItem("cedu_plan") || "";
  // BUG 3: pre-llenar con el código de referido capturado de la URL (?ref=) en auth.tsx.
  const [referralCode, setReferralCode] = useState(() => {
    try { return localStorage.getItem("cedu_ref") || ""; } catch { return ""; }
  });
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralOwner, setReferralOwner] = useState("");

  const checkReferral = async (code: string) => {
    if (!code.trim()) { setReferralValid(null); return; }
    try {
      const res = await fetch(`/api/referral/${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setReferralValid(true);
        setReferralOwner(data.ownerName || "Socio Ceduverse");
      } else {
        setReferralValid(false);
        setReferralOwner("");
      }
    } catch {
      setReferralValid(false);
      setReferralOwner("");
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (referralCode.trim() && referralValid === null) {
        await checkReferral(referralCode);
      }
      const profilePayload: Record<string, any> = { ...form };
      if (userType === "organization") {
        profilePayload.interest = [
          ...(Array.isArray(profile?.interest) ? profile.interest : []),
          "__org_user__",
        ];
      }
      await apiRequest("PATCH", "/api/me/profile", profilePayload);
      if (userType === "organization" && orgForm.companyName.trim()) {
        const teamPayload: Record<string, string> = {
          name: orgForm.companyName.trim(),
          industry: orgForm.industry.trim(),
          collaborators: orgForm.collaborators.trim(),
        };
        if (orgForm.rfc.trim()) teamPayload.rfc = orgForm.rfc.trim().toUpperCase();
        if (orgForm.razonSocial.trim()) teamPayload.razonSocial = orgForm.razonSocial.trim();
        if (orgForm.regimenFiscal.trim()) teamPayload.regimenFiscal = orgForm.regimenFiscal.trim();
        if (orgForm.codigoPostalFiscal.trim()) teamPayload.codigoPostalFiscal = orgForm.codigoPostalFiscal.trim();
        await apiRequest("POST", "/api/me/team", teamPayload);
      }
      const accountUpdate: Record<string, any> = { accountSetup: 1 };
      if (referralCode.trim()) {
        accountUpdate.referredBy = referralCode.trim();
      }
      await apiRequest("PATCH", "/api/me/account", accountUpdate);
      // BUG 3: ya usado el código capturado, se limpia para no re-aplicarlo.
      try { localStorage.removeItem("cedu_ref"); } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/teams"] });
      onNext();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const isOrgValid = userType === "individual" || orgForm.companyName.trim().length > 0;

  return (
    <div className="animate-rise" data-testid="step-profile">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-cedu-blue-light rounded-2xl flex items-center justify-center mx-auto mb-3">
          <User size={24} className="text-cedu-blue" />
        </div>
        <h2 className="font-serif text-2xl text-cedu-ink">Tu Perfil</h2>
        <p className="text-sm text-cedu-ink-muted mt-1">Cuéntanos un poco sobre ti</p>
      </div>

      <Card className="border-black/[0.06] max-w-md mx-auto">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-cedu-ink-soft text-sm font-semibold">Nombre completo *</Label>
            <Input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Tu nombre completo"
              className="h-11"
              data-testid="input-onboarding-name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-cedu-ink-soft text-sm font-semibold">País</Label>
              <Input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="México"
                className="h-11"
                data-testid="input-onboarding-country"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-cedu-ink-soft text-sm font-semibold">Ciudad</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Tu ciudad"
                className="h-11"
                data-testid="input-onboarding-city"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-cedu-ink-soft text-sm font-semibold">Teléfono</Label>
            <Input
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="+52 55 1234 5678"
              className="h-11"
              data-testid="input-onboarding-phone"
            />
          </div>
        </CardContent>
      </Card>

      <Card className={`max-w-md mx-auto mt-4 ${userType === "organization" ? "border-cedu-blue/30 bg-cedu-blue-light/20" : "border-black/[0.06]"}`}>
        <CardContent className="pt-5 pb-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${userType === "organization" ? "bg-cedu-blue/10" : "bg-black/[0.04]"}`}>
              <Briefcase size={16} className={userType === "organization" ? "text-cedu-blue" : "text-cedu-ink-muted"} />
            </div>
            <div>
              <span className="text-sm font-bold text-cedu-ink">
                {userType === "organization" ? "¿Tienes un código de Socio Comercial?" : "¿Tienes código de referido?"}
              </span>
              <p className="text-[11px] text-cedu-ink-muted">
                {userType === "organization" ? "Ingresa el código que te proporcionó tu asesor comercial" : "Si alguien te refirió, ingresa su código aquí"}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Input
              value={referralCode}
              onChange={(e) => { setReferralCode(e.target.value); setReferralValid(null); }}
              onBlur={() => checkReferral(referralCode)}
              placeholder="Ej: P-M1ABC-XY4Z"
              className={`h-11 flex-1 ${referralValid === true ? "border-cedu-green" : referralValid === false ? "border-red-400" : ""}`}
              data-testid="input-onboarding-referral"
            />
            {referralValid === true && (
              <div className="flex items-center text-cedu-green text-xs gap-1 whitespace-nowrap">
                <CheckCircle2 size={14} /> {referralOwner}
              </div>
            )}
            {referralValid === false && (
              <div className="flex items-center text-red-500 text-xs whitespace-nowrap">
                Código no válido
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {userType === "organization" && (
        <Card className="border-black/[0.06] max-w-md mx-auto mt-4">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={18} className="text-cedu-blue" />
              <span className="text-sm font-bold text-cedu-ink">Datos de tu Organización</span>
              {savedPlan && (
                <Badge variant="secondary" className="bg-cedu-blue/10 text-cedu-blue text-[10px] uppercase tracking-wider ml-auto">
                  Plan {savedPlan}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-cedu-ink-soft text-sm font-semibold">Nombre de la empresa *</Label>
              <Input
                value={orgForm.companyName}
                onChange={(e) => setOrgForm({ ...orgForm, companyName: e.target.value })}
                placeholder="Nombre de la empresa u organización"
                className="h-11"
                data-testid="input-onboarding-company"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-cedu-ink-soft text-sm font-semibold">Industria / Sector</Label>
                <Input
                  value={orgForm.industry}
                  onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })}
                  placeholder="Ej: Manufactura"
                  className="h-11"
                  data-testid="input-onboarding-industry"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-cedu-ink-soft text-sm font-semibold">No. de colaboradores</Label>
                <Input
                  value={orgForm.collaborators}
                  onChange={(e) => setOrgForm({ ...orgForm, collaborators: e.target.value })}
                  placeholder="Ej: 50"
                  className="h-11"
                  data-testid="input-onboarding-collaborators"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-black/[0.06]">
              <p className="text-xs text-cedu-ink-muted mb-3">Datos fiscales (opcional — podrás completarlos después)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-cedu-ink-soft text-sm font-semibold">RFC</Label>
                  <Input
                    value={orgForm.rfc}
                    onChange={(e) => setOrgForm({ ...orgForm, rfc: e.target.value.toUpperCase() })}
                    placeholder="XAXX010101000"
                    maxLength={13}
                    className="h-11"
                    data-testid="input-onboarding-rfc"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-cedu-ink-soft text-sm font-semibold">C.P. Fiscal</Label>
                  <Input
                    value={orgForm.codigoPostalFiscal}
                    onChange={(e) => setOrgForm({ ...orgForm, codigoPostalFiscal: e.target.value })}
                    placeholder="06600"
                    maxLength={5}
                    className="h-11"
                    data-testid="input-onboarding-cp-fiscal"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-3">
                <Label className="text-cedu-ink-soft text-sm font-semibold">Razón Social</Label>
                <Input
                  value={orgForm.razonSocial}
                  onChange={(e) => setOrgForm({ ...orgForm, razonSocial: e.target.value })}
                  placeholder="Empresa S.A. de C.V."
                  className="h-11"
                  data-testid="input-onboarding-razon-social"
                />
              </div>
              <div className="space-y-2 mt-3">
                <Label className="text-cedu-ink-soft text-sm font-semibold">Régimen Fiscal</Label>
                <Select value={orgForm.regimenFiscal} onValueChange={v => setOrgForm({ ...orgForm, regimenFiscal: v })}>
                  <SelectTrigger className="h-11" data-testid="select-onboarding-regimen">
                    <SelectValue placeholder="Seleccionar régimen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="601">601 — General de Ley PM</SelectItem>
                    <SelectItem value="603">603 — Personas Morales Sin Fines de Lucro</SelectItem>
                    <SelectItem value="612">612 — Personas Físicas con Actividad Empresarial</SelectItem>
                    <SelectItem value="620">620 — Sociedades Cooperativas de Producción</SelectItem>
                    <SelectItem value="621">621 — Incorporación Fiscal</SelectItem>
                    <SelectItem value="625">625 — Régimen Simplificado de Confianza</SelectItem>
                    <SelectItem value="626">626 — RESICO Persona Moral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between max-w-md mx-auto mt-6">
        <Button variant="outline" onClick={onBack} data-testid="button-onboarding-back">
          <ChevronLeft size={16} className="mr-1" /> Atrás
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!form.fullName.trim() || !isOrgValid || saveMutation.isPending}
          className="bg-cedu-blue hover:bg-cedu-blue-dark"
          data-testid="button-onboarding-next-profile"
        >
          {saveMutation.isPending ? "Guardando..." : "Siguiente"} <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}

function WalletStep({
  profile,
  onNext,
  onBack,
}: {
  profile: Profile | null;
  onNext: () => void;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [manualAddress, setManualAddress] = useState("");

  const skipMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/me/account", { accountSetup: 2 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/account"] });
      onNext();
    },
  });

  const saveManualMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/me/profile", { walletAddress: manualAddress });
      await apiRequest("PATCH", "/api/me/account", { accountSetup: 2 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/account"] });
      onNext();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const hasWallet = !!profile?.walletAddress;

  return (
    <div className="animate-rise" data-testid="step-wallet">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-cedu-violet-light rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Wallet size={24} className="text-cedu-violet" />
        </div>
        <h2 className="font-serif text-2xl text-cedu-ink">Tu Billetera Web3</h2>
        <p className="text-sm text-cedu-ink-muted mt-1">Vincula una billetera para recibir logros verificables en blockchain</p>
      </div>

      {hasWallet ? (
        <Card className="border-black/[0.06] max-w-md mx-auto">
          <CardContent className="py-6 text-center">
            <CheckCircle2 size={48} className="mx-auto text-cedu-green mb-3" />
            <h3 className="font-serif text-lg text-cedu-ink mb-1">Billetera vinculada</h3>
            <p className="text-sm text-cedu-ink-muted font-mono">
              {profile.walletAddress!.slice(0, 6)}...{profile.walletAddress!.slice(-4)}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-md mx-auto space-y-4">
          <Card className="border-black/[0.06]">
            <CardContent className="py-5">
              <h4 className="font-semibold text-cedu-ink text-sm mb-3">Opción 1: Crear billetera nueva</h4>
              <CreateWalletModal onWalletCreated={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/me/profile"] });
              }} />
            </CardContent>
          </Card>

          <Card className="border-black/[0.06]">
            <CardContent className="py-5">
              <h4 className="font-semibold text-cedu-ink text-sm mb-3">Opción 2: Conectar MetaMask</h4>
              <ConnectWalletButton onConnected={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/me/profile"] });
              }} />
            </CardContent>
          </Card>

          <Card className="border-black/[0.06]">
            <CardContent className="py-5">
              <h4 className="font-semibold text-cedu-ink text-sm mb-3">Opción 3: Pegar dirección manualmente</h4>
              <div className="flex gap-2">
                <Input
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="0x..."
                  className="h-10 font-mono text-sm"
                  data-testid="input-manual-wallet"
                />
                <Button
                  onClick={() => saveManualMutation.mutate()}
                  disabled={!manualAddress.startsWith("0x") || manualAddress.length < 42 || saveManualMutation.isPending}
                  className="bg-cedu-blue hover:bg-cedu-blue-dark"
                  data-testid="button-save-manual-wallet"
                >
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-between max-w-md mx-auto mt-6">
        <Button variant="outline" onClick={onBack} data-testid="button-onboarding-back-wallet">
          <ChevronLeft size={16} className="mr-1" /> Atrás
        </Button>
        <Button
          onClick={() => {
            if (hasWallet) {
              skipMutation.mutate();
            } else {
              skipMutation.mutate();
            }
          }}
          className={hasWallet ? "bg-cedu-blue hover:bg-cedu-blue-dark" : ""}
          variant={hasWallet ? "default" : "outline"}
          data-testid="button-onboarding-next-wallet"
        >
          {hasWallet ? "Siguiente" : "Omitir por ahora"} <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}

function InterestsStep({ profile, onNext, onBack }: { profile: Profile | null; onNext: () => void; onBack: () => void }) {
  const { toast } = useToast();
  const existingInterests = Array.isArray(profile?.interest) ? profile.interest : [];
  const [selected, setSelected] = useState<string[]>(existingInterests);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/me/profile", { interest: selected });
      await apiRequest("PATCH", "/api/me/account", { accountSetup: 3 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/account"] });
      onNext();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="animate-rise" data-testid="step-interests">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-cedu-orange-light rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Sparkles size={24} className="text-cedu-orange" />
        </div>
        <h2 className="font-serif text-2xl text-cedu-ink">Tus Intereses</h2>
        <p className="text-sm text-cedu-ink-muted mt-1">Selecciona los temas que más te interesan</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
        {INTEREST_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? "border-cedu-blue bg-cedu-blue-light"
                  : "border-black/[0.06] hover:border-cedu-blue/30 hover:bg-black/[0.01]"
              }`}
              data-testid={`button-interest-${opt.id}`}
            >
              <opt.icon size={24} className={`mx-auto mb-2 ${isSelected ? "text-cedu-blue" : "text-cedu-ink-muted"}`} />
              <p className={`text-xs font-semibold ${isSelected ? "text-cedu-blue" : "text-cedu-ink"}`}>{opt.label}</p>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between max-w-md mx-auto mt-6">
        <Button variant="outline" onClick={onBack} data-testid="button-onboarding-back-interests">
          <ChevronLeft size={16} className="mr-1" /> Atrás
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="bg-cedu-blue hover:bg-cedu-blue-dark"
          data-testid="button-onboarding-next-interests"
        >
          {saveMutation.isPending ? "Guardando..." : "Siguiente"} <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}

function CompletionStep({ onFinish }: { onFinish: () => void }) {
  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/me/account", { accountSetup: 4 });
    },
    onSuccess: () => {
      sessionStorage.removeItem("cedu_registro_empresa");
      sessionStorage.removeItem("cedu_plan");
      sessionStorage.removeItem("cedu_collaborators");
      queryClient.invalidateQueries({ queryKey: ["/api/me/account"] });
      onFinish();
    },
  });

  return (
    <div className="text-center py-8 animate-rise" data-testid="step-completion">
      <div className="w-20 h-20 bg-cedu-green-light rounded-3xl flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={40} className="text-cedu-green" />
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl text-cedu-ink mb-3" data-testid="text-completion-title">
        ¡Ya estás listo!
      </h1>
      <p className="text-cedu-ink-muted text-base max-w-md mx-auto mb-8">
        Tu cuenta está configurada. Explora el Aula Virtual, toma cursos STPS y colecciona logros certificados en blockchain.
      </p>
      <Button
        onClick={() => completeMutation.mutate()}
        disabled={completeMutation.isPending}
        className="bg-cedu-blue hover:bg-cedu-blue-dark text-white font-bold rounded-xl h-12 px-10 text-base"
        data-testid="button-go-dashboard"
      >
        <Rocket size={18} className="mr-2" />
        {completeMutation.isPending ? "Finalizando..." : "Ir al Dashboard"}
      </Button>
    </div>
  );
}

export default function Onboarding() {
  useForceLightMode();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: account } = useQuery<Account>({
    queryKey: ["/api/me/account"],
    enabled: !!user,
  });

  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/me/profile"],
    enabled: !!user,
  });

  const initialStep = account?.accountSetup ?? 0;
  const [step, setStep] = useState(initialStep);
  const isEmpresaRegistro = sessionStorage.getItem("cedu_registro_empresa") === "1";
  const [userType, setUserType] = useState<"individual" | "organization">(isEmpresaRegistro ? "organization" : "individual");

  useEffect(() => {
    if (account) {
      if (account.accountSetup >= 4) {
        sessionStorage.removeItem("cedu_registro_empresa");
        sessionStorage.removeItem("cedu_plan");
        sessionStorage.removeItem("cedu_collaborators");
        setLocation("/dashboard");
        return;
      }
      if (step < account.accountSetup) {
        setStep(account.accountSetup);
      }
    }
  }, [account?.accountSetup]);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/auth");
  }, [authLoading, user]);

  if (!authLoading && !user) return null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cedu-cream flex items-center justify-center">
        <div className="w-12 h-12 bg-cedu-blue rounded-2xl flex items-center justify-center text-white font-serif text-2xl animate-pulse">
          C
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cedu-cream flex flex-col items-center justify-center p-6" data-testid="page-onboarding">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-cedu-blue rounded-[10px] flex items-center justify-center text-white font-serif text-xl">
              C
            </div>
            <div className="font-serif text-2xl text-cedu-ink tracking-tight">
              Cedu<em className="text-cedu-blue not-italic italic">verse</em>
            </div>
          </div>
        </div>

        <StepIndicator currentStep={step} />

        {step === 0 && <WelcomeStep onNext={() => setStep(1)} userType={userType} setUserType={setUserType} />}
        {step === 1 && <ProfileStep profile={profile || null} onNext={() => setStep(2)} onBack={() => setStep(0)} userType={userType} />}
        {step === 2 && <WalletStep profile={profile || null} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <InterestsStep profile={profile || null} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <CompletionStep onFinish={() => setLocation("/dashboard")} />}
      </div>
    </div>
  );
}
