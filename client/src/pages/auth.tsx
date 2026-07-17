import { useState, useRef, useEffect, Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForceLightMode } from "@/components/ThemeProvider";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail, ShieldCheck, Award, ChevronDown, ChevronUp, AlertCircle, Lock } from "lucide-react";
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
  const [showCoopDetails, setShowCoopDetails] = useState(false);
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

  function redirectByRole() {
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
        .finally(() => setLocation("/dashboard"));
    } else {
      setLocation("/dashboard");
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
        ...(joinCoop ? { joinCoop, phone: phone || undefined } : {}),
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
      await sendCode(email, fullName || undefined, joinCoop ? { joinCoop, phone: phone || undefined } : undefined);
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
                      <label className="flex items-center gap-3 p-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={joinCoop}
                          onChange={(e) => {
                            setJoinCoop(e.target.checked);
                            if (e.target.checked) setShowCoopDetails(true);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-cedu-blue focus:ring-cedu-blue"
                          data-testid="checkbox-join-coop"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <Award size={16} className="text-cedu-blue" />
                          <span className="text-sm font-semibold text-cedu-ink">Adhesión Cooperativa</span>
                        </div>
                        {joinCoop && (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setShowCoopDetails(!showCoopDetails); }}
                            className="text-cedu-ink-muted hover:text-cedu-blue transition-colors"
                          >
                            {showCoopDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}
                      </label>

                      {joinCoop && showCoopDetails && (
                        <div className="px-3 pb-3 space-y-3 border-t border-cedu-blue/10 pt-3">
                          <p className="text-xs text-cedu-ink-muted leading-relaxed">
                            Al marcar esta casilla, solicito mi adhesión como socio cooperativista de{" "}
                            <strong>Ceduverse S. C de C de Rl de CV</strong>, acepto sus estatutos sociales
                            y me comprometo a cumplir con las obligaciones cooperativas.
                          </p>
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
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || sendCooldown > 0 || (!isReturning && !acceptedTerms)}
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
