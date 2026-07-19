import { useState, useRef, useEffect, Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { safeNextDestination, rememberNextDestination, consumeNextDestination } from "@/lib/next-destination";
import { useForceLightMode } from "@/components/ThemeProvider";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail, ShieldCheck, Award, AlertCircle, Lock } from "lucide-react";
import { Link } from "wouter";
import { captureReferralFromUrl } from "@/lib/referral-capture";

class AuthErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message || "Error desconocido" };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[auth] Render error:", error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cedu-cream flex items-center justify-center px-4">
          <div className="w-full max-w-[420px]">
            <Card className="border-black/[0.06] shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="font-serif text-2xl text-cedu-ink flex items-center gap-2">
                  <AlertCircle size={24} className="text-red-500" />
                  Error de carga
                </CardTitle>
                <CardDescription className="text-cedu-ink-muted">
                  Ocurrió un error al cargar la página de autenticación.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-cedu-ink-muted mb-4">{this.state.error}</p>
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: "" });
                    window.location.reload();
                  }}
                  className="w-full h-12 bg-cedu-blue hover:bg-cedu-blue-dark text-white font-bold rounded-[12px]"
                >
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type Step = "email" | "code" | "admin";

export default function AuthPage() {
  return (
    <AuthErrorBoundary>
      <AuthPageContent />
    </AuthErrorBoundary>
  );
}

function AuthPageContent() {
  useForceLightMode();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const { sendCode, verifyCode, adminLogin, user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sendCooldown, setSendCooldown] = useState(0);
  const [isReturning, setIsReturning] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [joinCoop, setJoinCoop] = useState(false);
  const [phone, setPhone] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteCompany, setInviteCompany] = useState<string | null>(null);
  const inviteAcceptedRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    // BUG 3 (fix): la captura de ?ref= ahora vive app-wide en App.tsx (ReferralCapture),
    // así también funciona en links que no apuntan a /auth (ej. /empresas?ref=).
    // Esta llamada queda como red de seguridad redundante pero inofensiva.
    captureReferralFromUrl(window.location.search);
    // Una cuenta NUEVA no va del login al destino: la desvian al alta
    // (/welcome) y para cuando termina, la URL con ?next= ya quedo atras.
    // Guardarlo aqui deja que el final del alta la lleve a donde iba.
    rememberNextDestination(safeNextDestination(window.location.search));
    if (invite) {
      setInviteToken(invite);
      fetch(`/api/invitations/validate/${invite}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setEmail(data.email);
            setFullName(`${data.nombre} ${data.apellido || ""}`.trim());
            setInviteCompany(data.teamName);
            setAcceptedTerms(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("cedu_otp_cooldown");
    if (stored) {
      const remaining = Math.ceil((parseInt(stored) - Date.now()) / 1000);
      if (remaining > 0) {
        setSendCooldown(remaining);
        setResendCooldown(remaining);
      } else {
        localStorage.removeItem("cedu_otp_cooldown");
      }
    }
  }, []);

  const startCooldown = (seconds: number) => {
    setSendCooldown(seconds);
    setResendCooldown(seconds);
    localStorage.setItem("cedu_otp_cooldown", String(Date.now() + seconds * 1000));
  };

  /**
   * ¿La cuenta termino su alta? (accountSetup >= 4)
   *
   * Ante CUALQUIER falla devuelve `false` — o sea, manda al alta. Fallar
   * "cerrado" es seguro: una cuenta YA completa que aterrice en /welcome
   * rebota sola (ese efecto la reenvia a su destino), mientras que fallar
   * "abierto" deja entrar a una cuenta sin perfil, sin terminos aceptados y
   * sin atribucion de referido — que es justo el bug que esto corrige.
   */
  async function cuentaCompleta(): Promise<boolean> {
    try {
      const r = await fetch("/api/me/account", { credentials: "include" });
      if (!r.ok) return false;
      const acc = await r.json();
      return Number(acc?.accountSetup ?? 0) >= 4;
    } catch {
      return false;
    }
  }

  async function redirectByRole() {
    // El alta de cuenta se exige AQUI, no en el dashboard.
    //
    // Antes el unico guardia vivia en dashboard.tsx (accountSetup < 4 ->
    // /welcome). Cuando esta pantalla dejo de mandar a todos al dashboard —para
    // que un invitado aterrizara en el curso compartido— ese guardia dejo de
    // ejecutarse: un correo nuevo entraba directo al curso SIN alta, sin perfil
    // y sin aceptar terminos. La puerta va donde pasan todos, no en cada pagina.
    //
    // El destino sigue guardado (rememberNextDestination al montar), asi que el
    // final del alta lo consume y el invitado igual termina en su curso.
    if (!(await cuentaCompleta())) {
      setLocation("/welcome");
      return;
    }

    // A dónde volver: si el usuario llegó aquí rebotado desde un link
    // compartido (/auth?next=/tutor-ia/<curso>/onboarding?ref=...), regresa ahí.
    // safeNextDestination sólo acepta rutas internas (ver next-destination.ts).
    const destino = safeNextDestination(window.location.search) || consumeNextDestination() || "/dashboard";
    if (user && inviteToken && !inviteAcceptedRef.current) {
      inviteAcceptedRef.current = true;
      fetch(`/api/invitations/accept/${inviteToken}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
        .then(r => {
          if (!r.ok) {
            return r.json().then(data => {
              toast({ title: "Error con la invitación", description: data.message || "No se pudo aceptar la invitación", variant: "destructive" });
            });
          }
        })
        .catch(() => {
          toast({ title: "Error", description: "No se pudo procesar la invitación", variant: "destructive" });
        })
        .finally(() => setLocation(destino));
    } else {
      setLocation(destino);
    }
  }

  useEffect(() => {
    if (user) {
      redirectByRole();
    }
  }, [user]);

  useEffect(() => {
    if (resendCooldown <= 0 && sendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
      setSendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown, sendCooldown]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cedu-cream flex items-center justify-center px-4">
        <Loader2 className="animate-spin text-cedu-blue" size={32} />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-cedu-cream flex items-center justify-center px-4 flex-col gap-4">
        <Loader2 className="animate-spin text-cedu-blue" size={32} />
        <p className="text-sm text-cedu-ink-muted">Redirigiendo...</p>
      </div>
    );
  }

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    pasted.split("").forEach((d, i) => {
      if (i < 6) newCode[i] = d;
    });
    setCode(newCode);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendCooldown > 0) return;
    setLoading(true);
    try {
      const mode = isReturning ? "login" : "register";
      const result = await sendCode(email, fullName || undefined, {
        mode,
        ...(mode === "register" ? { acceptedTerms, joinCoop, phone: phone || undefined } : {}),
      });
      if (result.autoLogin) {
        redirectByRole();
        return;
      }
      setStep("code");
      startCooldown(60);
      toast({
        title: "Código enviado",
        description: `Revisa tu correo ${email}`,
      });
    } catch (err: any) {
      if (err.code === "USER_EXISTS") {
        setIsReturning(true);
        toast({
          title: "Ya tienes una cuenta",
          description: "Cambiamos a inicio de sesión. Presiona el botón otra vez para enviar tu código.",
        });
        return;
      }
      // Espejo del anterior: el correo NO tiene cuenta. Antes se le enviaba un
      // codigo igual y la cuenta nacia sin nombre y sin pasar por el alta; peor
      // aun, quien llegaba por un link compartido no veia el boton de
      // registrarse (texto chico hasta abajo) y se quedaba esperando un codigo.
      // Se conserva el correo tecleado: no se le pide de nuevo.
      if (err.code === "USER_NOT_FOUND") {
        setIsReturning(false);
        toast({
          title: "Vamos a crear tu cuenta",
          description: "Ese correo aún no está registrado. Completa tus datos para continuar.",
        });
        return;
      }
      const msg = err.message?.toLowerCase() || "";
      const isRateLimit = msg.includes("rate limit") || msg.includes("too many") || msg.includes("email rate") || msg.includes("espera") || msg.includes("429");
      if (isRateLimit) {
        setStep("code");
        startCooldown(60);
        toast({
          title: "Ya se envió un código",
          description: "Revisa tu correo, ya tienes un código activo.",
        });
      } else {
        toast({
          title: "Error al enviar código",
          description: err.message || "Intenta de nuevo",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast({
        title: "Código incompleto",
        description: "Ingresa los 6 dígitos del código",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await verifyCode(email, fullCode);
      redirectByRole();
    } catch (err: any) {
      toast({
        title: "Código inválido",
        description: "El código es incorrecto o ha expirado. Intenta de nuevo.",
        variant: "destructive",
      });
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !adminPassword) return;
    setLoading(true);
    try {
      await adminLogin(email, adminPassword);
      redirectByRole();
    } catch (err: any) {
      toast({
        title: "Error de autenticación",
        description: err.message || "Credenciales inválidas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const mode = isReturning ? "login" : "register";
      await sendCode(email, fullName || undefined, {
        mode,
        ...(mode === "register" ? { acceptedTerms, joinCoop, phone: phone || undefined } : {}),
      });
      startCooldown(60);
      toast({
        title: "Código reenviado",
        description: `Revisa tu correo ${email}`,
      });
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg = err.message?.toLowerCase() || "";
      const isRateLimit = msg.includes("rate limit") || msg.includes("too many") || msg.includes("email rate");
      if (isRateLimit) {
        startCooldown(120);
      }
      toast({
        title: isRateLimit ? "Demasiados intentos" : "Error al reenviar",
        description: isRateLimit
          ? "Espera 2 minutos antes de solicitar otro código."
          : err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cedu-cream flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-cedu-ink-muted hover:text-cedu-ink mb-8 no-underline transition-colors"
          data-testid="link-back-home"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-cedu-blue rounded-[12px] flex items-center justify-center text-white font-serif text-2xl">
            C
          </div>
          <div className="font-serif text-3xl text-cedu-ink tracking-tight">
            Cedu<em className="text-cedu-blue not-italic italic">verse</em>
          </div>
        </div>

        {inviteCompany && (
          <div className="mb-4 p-4 rounded-xl bg-cedu-blue/5 border border-cedu-blue/10" data-testid="banner-invite">
            <div className="flex items-center gap-2 mb-1">
              <Award size={16} className="text-cedu-blue" />
              <span className="text-sm font-semibold text-cedu-ink">Invitación de {inviteCompany}</span>
            </div>
            <p className="text-xs text-cedu-ink-muted">
              Te han invitado a unirte al programa de capacitación. Completa tu registro para comenzar.
            </p>
          </div>
        )}

        <Card className="border-black/[0.06] shadow-sm" data-testid="card-auth">
          {step === "email" ? (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="font-serif text-2xl text-cedu-ink" data-testid="text-auth-title">
                  {inviteCompany ? "Completa tu registro" : (isReturning ? "Iniciar sesión" : "Crear cuenta")}
                </CardTitle>
                <CardDescription className="text-cedu-ink-muted">
                  {inviteCompany
                    ? `Regístrate para unirte a ${inviteCompany} en Ceduverse.`
                    : (isReturning
                      ? "Ingresa tu correo y te enviaremos un código de acceso."
                      : "Regístrate gratis. Te enviaremos un código de acceso a tu correo.")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* La eleccion va ARRIBA, antes del correo. Antes solo existia
                    como texto chico al pie ("¿No tienes cuenta? Registrate"),
                    asi que alguien nuevo —sobre todo quien llega por un link
                    compartido— tecleaba su correo creyendo que iba bien y se
                    quedaba esperando un codigo. En una invitacion de empresa no
                    se muestra: ese flujo ya es un registro. */}
                {!inviteCompany && (
                  <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl" data-testid="switch-auth-mode">
                    <button
                      type="button"
                      onClick={() => setIsReturning(true)}
                      className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        isReturning
                          ? "bg-white dark:bg-gray-900 text-cedu-blue shadow-sm"
                          : "text-cedu-ink-muted dark:text-gray-400 hover:text-cedu-ink dark:hover:text-gray-200"
                      }`}
                      data-testid="button-mode-login"
                    >
                      Ya tengo cuenta
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReturning(false)}
                      className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        !isReturning
                          ? "bg-white dark:bg-gray-900 text-cedu-blue shadow-sm"
                          : "text-cedu-ink-muted dark:text-gray-400 hover:text-cedu-ink dark:hover:text-gray-200"
                      }`}
                      data-testid="button-mode-register"
                    >
                      Soy nuevo
                    </button>
                  </div>
                )}
                <form onSubmit={handleSendCode} className="space-y-4">
                  {!isReturning && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-cedu-ink-soft text-sm font-semibold">
                        Nombre completo
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Tu nombre completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-11"
                        data-testid="input-fullname"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-cedu-ink-soft text-sm font-semibold">
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                      data-testid="input-email"
                    />
                  </div>

                  {!isReturning && (
                    <label className="flex items-start gap-3 cursor-pointer" data-testid="label-accept-terms">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-cedu-blue focus:ring-cedu-blue"
                        data-testid="checkbox-accept-terms"
                      />
                      <span className="text-xs text-cedu-ink-muted leading-relaxed">
                        Acepto los{" "}
                        <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-cedu-blue underline">Términos y Condiciones</a>
                        {" "}y el{" "}
                        <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="text-cedu-blue underline">Aviso de Privacidad</a>
                      </span>
                    </label>
                  )}

                  {!isReturning && (
                    <div className="rounded-xl border border-cedu-blue/10 bg-cedu-blue/[0.03] overflow-hidden" data-testid="section-coop-adhesion">
                      <label className="flex items-start gap-3 p-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={joinCoop}
                          onChange={(e) => setJoinCoop(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-cedu-blue focus:ring-cedu-blue"
                          data-testid="checkbox-join-coop"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Award size={16} className="text-cedu-blue" />
                            <span className="text-sm font-semibold text-cedu-ink">Adhesión Cooperativa (obligatoria)</span>
                          </div>
                          {/* Toda cuenta de Ceduverse es una membresia de la cooperativa
                              (decision del dueño del producto, 2026-07-19): la adhesion
                              deja de ser opcional. El texto se queda siempre visible —no
                              detras de un chevron— para que se entienda que se acepta,
                              no solo para marcar mas rapido. */}
                          <p className="text-xs text-cedu-ink-muted leading-relaxed">
                            Toda cuenta en Ceduverse es una membresía de la cooperativa. Al marcar esta
                            casilla, solicito mi adhesión como socio cooperativista de{" "}
                            <strong>Ceduverse S. C de C de Rl de CV</strong>, acepto sus estatutos sociales
                            y me comprometo a cumplir con las obligaciones cooperativas.
                          </p>
                        </div>
                      </label>

                      <div className="px-3 pb-3 space-y-3 border-t border-cedu-blue/10 pt-3">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-cedu-ink-soft text-xs font-semibold">
                            Teléfono (opcional)
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+52 55 1234 5678"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="h-10 text-sm"
                            data-testid="input-phone"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-cedu-green">
                          <Award size={12} />
                          <span>Recibirás tu certificado digital de membresía al registrarte</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || sendCooldown > 0 || (!isReturning && (!acceptedTerms || !joinCoop))}
                    className="w-full h-12 bg-cedu-blue hover:bg-cedu-blue-dark text-white font-bold text-[15px] rounded-[12px] transition-all"
                    data-testid="button-send-code"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : sendCooldown > 0 ? (
                      <>Espera {sendCooldown}s para enviar</>
                    ) : (
                      <>
                        <Mail size={18} className="mr-2" />
                        {isReturning ? "Enviar Código de Acceso" : "Crear Cuenta"}
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() => setIsReturning(!isReturning)}
                    className="text-sm text-cedu-ink-muted hover:text-cedu-blue transition-colors cursor-pointer"
                    data-testid="button-toggle-mode"
                  >
                    {isReturning ? (
                      <>¿No tienes cuenta? <span className="font-semibold text-cedu-blue">Regístrate gratis</span></>
                    ) : (
                      <>¿Ya tienes cuenta? <span className="font-semibold text-cedu-blue">Iniciar sesión</span></>
                    )}
                  </button>
                </div>

                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("admin");
                      setAdminPassword("");
                    }}
                    className="text-xs text-cedu-ink-muted hover:text-cedu-blue transition-colors cursor-pointer"
                    data-testid="button-admin-login"
                  >
                    <Lock size={12} className="inline mr-1" />
                    Admin Login
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2 justify-center text-xs text-cedu-ink-muted">
                  <ShieldCheck size={14} />
                  <span>Acceso seguro sin contraseña</span>
                </div>
              </CardContent>
            </>
          ) : step === "code" ? (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="font-serif text-2xl text-cedu-ink" data-testid="text-code-title">
                  Ingresa tu código
                </CardTitle>
                <CardDescription className="text-cedu-ink-muted">
                  Enviamos un código de 6 dígitos a{" "}
                  <span className="font-semibold text-cedu-ink">{email}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyCode} className="space-y-6">
                  <div className="flex gap-2 justify-center" data-testid="input-code-group">
                    {code.map((digit, i) => (
                      <Input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(i, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                        onPaste={handlePaste}
                        className="w-12 h-14 text-center text-2xl font-bold tracking-wider"
                        data-testid={`input-code-${i}`}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || code.join("").length !== 6}
                    className="w-full h-12 bg-cedu-blue hover:bg-cedu-blue-dark text-white font-bold text-[15px] rounded-[12px] transition-all"
                    data-testid="button-verify-code"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      "Verificar y Entrar"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-3">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading || resendCooldown > 0}
                    className="text-sm text-cedu-ink-muted hover:text-cedu-blue transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-resend-code"
                  >
                    {resendCooldown > 0 ? (
                      <>Reenviar código en {resendCooldown}s</>
                    ) : (
                      <>
                        ¿No recibiste el código?{" "}
                        <span className="font-semibold text-cedu-blue">Reenviar</span>
                      </>
                    )}
                  </button>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setCode(["", "", "", "", "", ""]);
                      }}
                      className="text-sm text-cedu-ink-muted hover:text-cedu-blue transition-colors cursor-pointer"
                      data-testid="button-change-email"
                    >
                      Cambiar correo electrónico
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 justify-center text-xs text-cedu-ink-muted">
                  <Mail size={14} />
                  <span>Revisa también tu carpeta de spam</span>
                </div>
              </CardContent>
            </>
          ) : step === "admin" ? (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="font-serif text-2xl text-cedu-ink" data-testid="text-admin-title">
                  Admin Login
                </CardTitle>
                <CardDescription className="text-cedu-ink-muted">
                  Acceso con contraseña para cuentas de administrador.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="text-cedu-ink-soft text-sm font-semibold">
                      Correo electrónico
                    </Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@ceduverse.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                      data-testid="input-admin-email"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="text-cedu-ink-soft text-sm font-semibold">
                      Contraseña
                    </Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Tu contraseña"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      className="h-11"
                      data-testid="input-admin-password"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !email || !adminPassword}
                    className="w-full h-12 bg-cedu-blue hover:bg-cedu-blue-dark text-white font-bold text-[15px] rounded-[12px] transition-all"
                    data-testid="button-admin-submit"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <Lock size={18} className="mr-2" />
                        Iniciar sesión
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setAdminPassword("");
                    }}
                    className="text-sm text-cedu-ink-muted hover:text-cedu-blue transition-colors cursor-pointer"
                    data-testid="button-back-otp"
                  >
                    <ArrowLeft size={14} className="inline mr-1" />
                    Volver al acceso con código
                  </button>
                </div>
              </CardContent>
            </>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
