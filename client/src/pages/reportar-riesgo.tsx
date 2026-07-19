import { useParams, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { authUrlWithNext } from "@/lib/next-destination";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/auth-token";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Camera, CheckCircle2, Loader2, ArrowLeft, AlertTriangle, Sparkles } from "lucide-react";

// Pantalla de reporte del trabajador (Task 7 del plan
// docs/superpowers/plans/2026-07-18-detector-riesgos.md). Reemplaza la
// actividad de campo del playbook: el trabajador ya no "sube evidencia de un
// ejercicio", detecta y reporta un incumplimiento real. Ver el spec
// docs/superpowers/specs/2026-07-18-detector-riesgos-design.md, en particular
// §3 (el límite honesto del anonimato, la copia de abajo lo respeta al pie
// de la letra) y §7 (la norma nunca se inventa: solo se elige entre las
// referencias reales del curso que devuelve el servidor).

interface Empresa {
  id: string;
  name: string;
}

interface MisEmpresasResponse {
  empresas: Empresa[];
}

interface SugerirNormaResponse {
  normRef: string | null;
  opciones: string[];
}

interface CompanyFinding {
  id: string;
  anonymous: boolean;
  description: string;
  normRef: string | null;
  status: string;
  createdAt: string;
  reporter: { name: string } | null;
  photoRef: string;
}

interface CrearHallazgoResponse {
  finding: CompanyFinding;
  normRefRejected?: boolean;
}

// Sentinel para "ninguna de las referencias aplica" en el RadioGroup — un
// RadioGroupItem con value="" se presta a confusión con "todavía no elegido
// nada" (el propio RadioGroup usa "" así). El valor real que se manda al
// servidor cuando el trabajador elige esta opción es "" (sin norma).
const SIN_NORMA = "__sin_norma__";

async function authedFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers, credentials: "include" });
}

export default function ReportarRiesgoPage() {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug || "";
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [suggestion, setSuggestion] = useState<SugerirNormaResponse | null>(null);
  const [normSelection, setNormSelection] = useState<string>(SIN_NORMA);
  const [result, setResult] = useState<CrearHallazgoResponse | null>(null);

  // Igual que el guard que reemplaza (playbook-exercise.tsx): esta pantalla
  // se abre casi siempre escaneando el QR del cuaderno desde el celular, con
  // frecuencia sin sesión iniciada. Solo redirige a /auth una vez que el auth
  // ya está SETTLED (authLoading === false) — `user` arranca en null mientras
  // se resuelve /api/auth/me, así que redirigir antes de eso rebotaría a un
  // trabajador que sí tiene sesión.
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(authUrlWithNext(window.location.pathname + window.location.search));
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  // Requisito 1 (varias empresas): el trabajador puede pertenecer a más de
  // un equipo — típicamente porque cambió de empleador y la membresía vieja
  // nunca se borró. El servidor ya rechaza un envío ambiguo a propósito
  // (server/lib/team-selection.ts); aquí se le pregunta ANTES de enviar para
  // que nunca reporte, sin darse cuenta, a un empleador que ya no es el suyo.
  const empresasQuery = useQuery<MisEmpresasResponse>({
    queryKey: ["/api/riesgos/mis-empresas"],
    queryFn: async () => {
      const res = await authedFetch("/api/riesgos/mis-empresas");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "No se pudieron cargar tus empresas");
      }
      return res.json();
    },
    enabled: !!user,
  });

  const empresas = empresasQuery.data?.empresas ?? [];
  const needsCompanyChoice = empresas.length > 1;

  // Una sola empresa: se usa esa en silencio (no hay ambigüedad posible).
  useEffect(() => {
    if (empresas.length === 1 && !selectedTeamId) {
      setSelectedTeamId(empresas[0].id);
    }
  }, [empresas, selectedTeamId]);

  const suggestMutation = useMutation({
    mutationFn: async () => {
      const res = await authedFetch("/api/riesgos/sugerir-norma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), courseSlug: slug || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "No se pudo sugerir una norma");
      }
      return res.json() as Promise<SugerirNormaResponse>;
    },
    onSuccess: (data) => {
      setSuggestion(data);
      setNormSelection(data.normRef ?? SIN_NORMA);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!photo) throw new Error("Toma o selecciona una foto del riesgo");
      const trimmedDescription = description.trim();
      if (!trimmedDescription) throw new Error("Describe el hallazgo con tus palabras");
      if (needsCompanyChoice && !selectedTeamId) {
        throw new Error("Elige a qué empresa se reporta este hallazgo");
      }

      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("description", trimmedDescription);
      formData.append("anonymous", String(anonymous));
      if (slug) formData.append("courseSlug", slug);
      if (normSelection !== SIN_NORMA) formData.append("normRef", normSelection);
      if (selectedTeamId) formData.append("teamId", selectedTeamId);

      const res = await authedFetch("/api/riesgos", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "No se pudo enviar el reporte");
      }
      return res.json() as Promise<CrearHallazgoResponse>;
    },
    onSuccess: (data) => {
      setResult(data);
      // Requisito 2: si el servidor descartó la norma (no coincidió con
      // ninguna referencia real), decirlo con todas sus letras. El silencio
      // aquí escondería que la UI y lo que quedó guardado ya no coinciden.
      if (data.normRefRejected) {
        toast({
          title: "Se guardó sin norma",
          description:
            "La norma que elegiste no coincidió con las referencias del curso, así que el hallazgo se guardó sin ninguna norma asociada.",
        });
      } else {
        toast({ title: "Hallazgo enviado" });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function handlePhotoChange(file: File | null) {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  function resetForm() {
    handlePhotoChange(null);
    setDescription("");
    setAnonymous(false);
    setSuggestion(null);
    setNormSelection(SIN_NORMA);
    setResult(null);
  }

  const backTarget = slug ? `/tutor-ia/${slug}` : "/dashboard";
  const backLabel = slug ? "Volver al curso" : "Volver a mi panel";

  // Un solo loader cubre dos estados: auth todavía resolviendo (no sabemos si
  // hay sesión) y auth ya resuelto sin usuario (el efecto de arriba está a
  // punto de redirigir a /auth). Nunca decidir con `if (!user)` a secas:
  // `user` es null mientras carga, y eso rebotaría a un trabajador con sesión.
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-cedu-cream flex items-center justify-center">
        <Loader2 className="animate-spin text-cedu-blue" size={32} />
      </div>
    );
  }

  const canAskNorm = description.trim().length > 0 && !suggestMutation.isPending;
  const canSubmit =
    !!photo &&
    description.trim().length > 0 &&
    (!needsCompanyChoice || !!selectedTeamId) &&
    !submitMutation.isPending;

  return (
    <div className="min-h-screen bg-cedu-cream" data-testid="page-reportar-riesgo">
      <div className="max-w-lg mx-auto px-6 py-10">
        <button
          onClick={() => navigate(backTarget)}
          className="flex items-center gap-1 text-sm text-cedu-ink-muted hover:text-cedu-blue mb-6"
          data-testid="button-back"
        >
          <ArrowLeft size={16} /> {backLabel}
        </button>

        <Card className="p-6">
          <p className="text-xs font-bold text-cedu-orange uppercase tracking-wide mb-1">
            Detector de riesgos
          </p>
          <h1 className="font-serif text-xl text-cedu-ink mb-3" data-testid="text-page-title">
            Reporta un riesgo real
          </h1>

          {result ? (
            <div className="py-4" data-testid="view-report-confirmed">
              <div className="text-center mb-4">
                <CheckCircle2 size={48} className="mx-auto text-cedu-green mb-3" />
                <p className="font-semibold text-cedu-ink">¡Hallazgo enviado!</p>
                <p className="text-sm text-cedu-ink-soft mt-1">
                  {result.finding.anonymous
                    ? "Se envió sin tu nombre."
                    : "Se envió con tu nombre."}{" "}
                  Ganarás puntos cuando la empresa valide que el riesgo se corrigió.
                </p>
              </div>

              {result.normRefRejected && (
                <div
                  className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4"
                  data-testid="banner-norm-rejected"
                >
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    La norma que elegiste no coincidió con las referencias del curso: el
                    hallazgo se guardó <strong>sin norma asociada</strong>.
                  </p>
                </div>
              )}

              {!result.normRefRejected && result.finding.normRef && (
                <p className="text-sm text-cedu-ink-soft mb-4" data-testid="text-confirmed-norm">
                  Norma citada: <span className="font-medium text-cedu-ink">{result.finding.normRef}</span>
                </p>
              )}

              <div className="flex gap-2">
                <Button onClick={resetForm} className="flex-1" data-testid="button-report-another">
                  Reportar otro riesgo
                </Button>
                <Button variant="outline" onClick={() => navigate(backTarget)} className="flex-1">
                  {backLabel}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Foto */}
              <div>
                {/* Allowlist explícito, no "image/*": debe reflejar exactamente
                    ALLOWED_EVIDENCE_MIMETYPES en server/lib/playbook-upload.ts. Un
                    wildcard le ofrecería al picker SVG/GIF/BMP que el servidor
                    rechaza (SVG en particular, por riesgo de stored-XSS). */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                  data-testid="input-riesgo-photo"
                />
                {photoPreview ? (
                  <div className="space-y-2">
                    <img
                      src={photoPreview}
                      alt="Foto del riesgo"
                      className="w-full rounded-lg border border-cedu-ink/10 max-h-64 object-cover"
                      data-testid="img-photo-preview"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-change-photo"
                    >
                      <Camera size={16} className="mr-2" /> Cambiar foto
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-12 bg-cedu-blue hover:bg-cedu-blue/90 text-white rounded-xl gap-2"
                    data-testid="button-take-photo"
                  >
                    <Camera size={18} />
                    Tomar foto del riesgo
                  </Button>
                )}
              </div>

              {/* Descripción */}
              <div>
                <Label htmlFor="riesgo-description" className="text-cedu-ink mb-2 block">
                  Describe lo que ves
                </Label>
                <Textarea
                  id="riesgo-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Con tus palabras: qué es, dónde está, por qué es un riesgo..."
                  rows={4}
                  data-testid="input-riesgo-description"
                />
              </div>

              {/* Sugerencia de norma */}
              <div>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!canAskNorm}
                  onClick={() => suggestMutation.mutate()}
                  data-testid="button-ask-norm"
                >
                  {suggestMutation.isPending ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Sparkles size={16} className="mr-2" />
                  )}
                  ¿Qué norma aplica?
                </Button>

                {suggestion && (
                  <div className="mt-3" data-testid="view-norm-suggestion">
                    {suggestion.opciones.length === 0 ? (
                      <p className="text-sm text-cedu-ink-soft">
                        No hay referencias registradas para este curso, así que el hallazgo se
                        guardará sin norma.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-cedu-ink-soft mb-2">
                          {suggestion.normRef ? (
                            <>
                              La IA sugiere: <span className="font-medium text-cedu-ink">{suggestion.normRef}</span>.
                              Puedes corregirla eligiendo otra de la lista.
                            </>
                          ) : (
                            "La IA no encontró una referencia clara. Elige una de la lista si aplica, o deja \"Ninguna aplica\"."
                          )}
                        </p>
                        <RadioGroup value={normSelection} onValueChange={setNormSelection}>
                          {suggestion.opciones.map((op) => (
                            <div key={op} className="flex items-center gap-2">
                              <RadioGroupItem value={op} id={`norm-${op}`} data-testid={`radio-norm-${op}`} />
                              <Label htmlFor={`norm-${op}`} className="font-normal text-sm">
                                {op}
                              </Label>
                            </div>
                          ))}
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value={SIN_NORMA} id="norm-ninguna" data-testid="radio-norm-ninguna" />
                            <Label htmlFor="norm-ninguna" className="font-normal text-sm">
                              Ninguna aplica
                            </Label>
                          </div>
                        </RadioGroup>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Empresa, solo si hay más de una */}
              {empresasQuery.isLoading && (
                <p className="text-sm text-cedu-ink-soft">Cargando tus empresas...</p>
              )}
              {empresasQuery.isError && (
                <p className="text-sm text-red-600" data-testid="text-empresas-error">
                  {empresasQuery.error instanceof Error
                    ? empresasQuery.error.message
                    : "No se pudieron cargar tus empresas"}
                </p>
              )}
              {needsCompanyChoice && (
                <div data-testid="view-company-choice">
                  <Label className="text-cedu-ink mb-2 block">¿A qué empresa reportas este hallazgo?</Label>
                  {/* Perteneces a más de una empresa (a veces por un empleo
                      anterior cuya membresía nunca se borró). Se pregunta antes
                      de enviar para que nunca reportes, sin darte cuenta, a un
                      empleador que ya no es el tuyo — el servidor rechaza el
                      envío si esto queda ambiguo. */}
                  <RadioGroup value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    {empresas.map((empresa) => (
                      <div key={empresa.id} className="flex items-center gap-2">
                        <RadioGroupItem value={empresa.id} id={`empresa-${empresa.id}`} data-testid={`radio-empresa-${empresa.id}`} />
                        <Label htmlFor={`empresa-${empresa.id}`} className="font-normal text-sm">
                          {empresa.name}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Anonimato: la copia respeta al pie de la letra el límite honesto
                  del spec §3 — no promete más de lo que el sistema puede cumplir. */}
              <div className="flex items-start gap-3 bg-cedu-ink/5 rounded-lg p-3">
                <Switch
                  checked={anonymous}
                  onCheckedChange={setAnonymous}
                  id="anonymous-toggle"
                  data-testid="switch-anonymous"
                />
                <div>
                  <Label htmlFor="anonymous-toggle" className="text-cedu-ink font-medium">
                    Enviar como anónimo
                  </Label>
                  <p className="text-xs text-cedu-ink-soft mt-1" data-testid="text-anonymous-disclaimer">
                    La empresa no sabrá quién reportó este hallazgo. Aun así, el anonimato tiene
                    un límite físico: en un taller pequeño, la foto de una máquina específica
                    puede delatar quién la tomó, así que no podemos garantizarte que nadie lo
                    sepa. Tú conoces tu lugar de trabajo mejor que nosotros — decide si este
                    hallazgo te expone.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => submitMutation.mutate()}
                disabled={!canSubmit}
                className="w-full h-12 bg-cedu-orange hover:bg-cedu-orange/90 text-white rounded-xl gap-2"
                data-testid="button-submit-report"
              >
                {submitMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Enviar reporte
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
