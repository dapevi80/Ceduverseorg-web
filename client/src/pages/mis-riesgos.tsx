import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { authUrlWithNext } from "@/lib/next-destination";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, ShieldAlert, ArrowLeft, Award } from "lucide-react";

// "Mis hallazgos" — vista del propio trabajador (Task 9 del plan
// docs/superpowers/plans/2026-07-18-detector-riesgos.md). Es la razón por la
// que un canal de reportes no muere en unas semanas: sin esto, el trabajador
// reporta y nunca vuelve a saber qué pasó con su reporte, ni siquiera con los
// anónimos (el spec deja claro que aquí sí puede ver su propio historial —
// GET /api/riesgos/mios está scoped a su propia sesión, nunca pasa por
// toCompanyView). Ver el spec
// docs/superpowers/specs/2026-07-18-detector-riesgos-design.md, en particular
// §3 (el límite honesto del anonimato) y §10 (historial "detectado -> corregido").
//
// El total de puntos que se pinta arriba viene YA agregado del servidor
// (server/routes/riesgos.ts, GET /api/riesgos/mios, que a su vez llama a
// totalPoints() en shared/playbook-points.ts) — esta pantalla nunca suma
// las tres fuentes por su cuenta, solo pinta lo que el servidor ya sumó.

type RiskStatus = "nuevo" | "en_revision" | "atendido" | "descartado";

interface MyFinding {
  id: string;
  anonymous: boolean;
  description: string;
  normRef: string | null;
  status: RiskStatus;
  courseSlug: string | null;
  createdAt: string; // timestamp ISO completo (esta es la vista PROPIA, no la de la empresa)
  photoRef: string;
  pointsAwarded: number;
  resolutionNote: string | null;
  resolvedAt: string | null;
  hasSolutionPhoto: boolean;
}

interface PointsBreakdown {
  findings: number;
  evidence: number;
  achievements: number;
}

interface MisRiesgosResponse {
  hallazgos: MyFinding[];
  points: {
    total: number;
    breakdown: PointsBreakdown;
  };
}

const STATUS_LABELS: Record<RiskStatus, string> = {
  nuevo: "Nuevo",
  en_revision: "En revisión",
  atendido: "Atendido",
  descartado: "Descartado",
};

const STATUS_BADGE_CLASS: Record<RiskStatus, string> = {
  nuevo: "bg-amber-100 text-amber-800 border-amber-200",
  en_revision: "bg-blue-100 text-blue-800 border-blue-200",
  atendido: "bg-green-100 text-green-800 border-green-200",
  descartado: "bg-gray-100 text-gray-700 border-gray-200",
};

// apiRequest (client/src/lib/queryClient.ts) lanza `Error(`${status}: ${bodyText}`)`
// en respuestas no-ok. Mismo patrón de recuperación de mensaje real que
// team-riesgos-tab.tsx: nunca mostrar el string crudo "403: {...}", y nunca
// dejar que una falla real caiga silenciosamente como "no tienes hallazgos".
function misRiesgosErrorMessage(error: unknown): string {
  const fallback = "No pudimos cargar tus hallazgos. Recarga la página o inténtalo en unos minutos.";
  if (!(error instanceof Error)) return fallback;
  const bodyText = error.message.replace(/^\d+:\s*/, "");
  try {
    const parsed = JSON.parse(bodyText);
    if (parsed && typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    // cuerpo no era JSON — se queda con el fallback genérico.
  }
  return fallback;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
}

function solutionPhotoUrl(id: string): string {
  return `/api/riesgos/${id}/foto-solucion`;
}

export default function MisRiesgosPage() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();

  // Mismo patrón de auth-gate settled que reportar-riesgo.tsx: solo redirige
  // a /auth una vez que el auth YA se resolvió (authLoading === false) —
  // `user` arranca en null mientras se resuelve /api/auth/me, así que
  // redirigir antes de eso rebotaría a un trabajador que sí tiene sesión.
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(authUrlWithNext(window.location.pathname + window.location.search));
    }
  }, [authLoading, user, navigate]);

  const query = useQuery<MisRiesgosResponse>({
    queryKey: ["/api/riesgos/mios"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/riesgos/mios");
      return res.json();
    },
    enabled: !!user,
  });

  // Un solo loader cubre dos estados: auth todavía resolviendo, y auth ya
  // resuelto sin usuario (el efecto de arriba está a punto de redirigir).
  // Nunca decidir con `if (!user)` a secas: `user` es null mientras carga.
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-cedu-cream flex items-center justify-center">
        <Loader2 className="animate-spin text-cedu-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cedu-cream" data-testid="page-mis-riesgos">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1 text-sm text-cedu-ink-muted hover:text-cedu-blue mb-6"
          data-testid="button-back"
        >
          <ArrowLeft size={16} /> Volver a mi panel
        </button>

        <p className="text-xs font-bold text-cedu-orange uppercase tracking-wide mb-1">
          Detector de riesgos
        </p>
        <h1 className="font-serif text-2xl text-cedu-ink mb-6" data-testid="text-page-title">
          Mis hallazgos
        </h1>

        {query.isLoading && (
          <div className="py-16 text-center text-cedu-ink-muted" data-testid="view-mis-riesgos-loading">
            <Loader2 className="animate-spin mx-auto mb-3" size={28} />
            Cargando tus hallazgos…
          </div>
        )}

        {/* Sin degradación silenciosa: un error real (401/500/red) nunca debe
            caer en la misma tarjeta que "sin hallazgos todavía". */}
        {query.isError && (
          <div className="py-16 text-center" data-testid="view-mis-riesgos-error">
            <AlertTriangle size={36} className="mx-auto text-red-500 mb-3" />
            <h3 className="font-serif text-lg text-cedu-ink mb-1">No se pudieron cargar tus hallazgos</h3>
            <p className="text-sm text-cedu-ink-muted">{misRiesgosErrorMessage(query.error)}</p>
          </div>
        )}

        {query.isSuccess && (
          <>
            {/* Total acumulado, prominente: risk_findings.points_awarded
                validados + playbook_evidence.points + achievements.value
                (incluye certificados/diplomas de curso) — un solo número, ya
                sumado por el servidor. */}
            <Card
              className="p-6 mb-8 bg-cedu-blue text-white flex items-center gap-4"
              data-testid="card-points-total"
            >
              <Award size={32} className="shrink-0" />
              <div>
                <p className="text-3xl font-serif font-bold" data-testid="text-points-total">
                  {query.data.points.total.toLocaleString("es-MX")} puntos
                </p>
                <p className="text-sm text-white/80">
                  Suman tus hallazgos validados, tus ejercicios del Playbook y tus certificados.
                </p>
              </div>
            </Card>

            {query.data.hallazgos.length === 0 ? (
              <div className="py-16 text-center" data-testid="view-mis-riesgos-empty">
                <ShieldAlert size={36} className="mx-auto text-cedu-ink-muted/30 mb-3" />
                <h3 className="font-serif text-lg text-cedu-ink mb-1">Todavía no has reportado hallazgos</h3>
                <p className="text-sm text-cedu-ink-muted">
                  Cuando reportes un riesgo real en tu trabajo, aquí verás su estado y, si tu
                  empresa lo corrige, la foto de la corrección.
                </p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="view-mis-riesgos-list">
                {query.data.hallazgos.map((h, i) => (
                  <FindingRow key={h.id} finding={h} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FindingRow({ finding, index }: { finding: MyFinding; index: number }) {
  const isClosed = finding.status === "atendido" || finding.status === "descartado";

  return (
    <Card className="p-4" data-testid={`card-mi-riesgo-${index}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge className={`border ${STATUS_BADGE_CLASS[finding.status]}`} data-testid={`badge-status-${index}`}>
          {STATUS_LABELS[finding.status]}
        </Badge>
        <span className="text-xs text-cedu-ink-muted">{formatDate(finding.createdAt)}</span>
      </div>

      <p className="text-sm text-cedu-ink mb-1" data-testid={`text-description-${index}`}>
        {finding.description}
      </p>

      <p className="text-xs text-cedu-ink-muted mb-1" data-testid={`text-norm-${index}`}>
        {finding.normRef ? (
          <>
            Norma citada: <span className="font-medium text-cedu-ink">{finding.normRef}</span>
          </>
        ) : (
          "Sin norma citada"
        )}
      </p>

      <p className="text-xs text-cedu-ink-muted mb-2" data-testid={`text-anonymous-${index}`}>
        {finding.anonymous ? "Enviado como anónimo" : "Enviado con tu nombre"}
      </p>

      {finding.pointsAwarded > 0 && (
        <p className="text-xs font-medium text-cedu-green mb-2" data-testid={`text-points-${index}`}>
          +{finding.pointsAwarded} puntos acreditados
        </p>
      )}

      {isClosed && (
        <div className="bg-cedu-ink/[0.03] rounded-lg p-3 space-y-2" data-testid={`view-resolution-${index}`}>
          {finding.resolvedAt && (
            <p className="text-xs text-cedu-ink-muted">Cerrado el {formatDate(finding.resolvedAt)}</p>
          )}
          {finding.resolutionNote && (
            <p className="text-xs text-cedu-ink-soft">{finding.resolutionNote}</p>
          )}
          {/* La foto de solución solo existe cuando la empresa cerró el
              hallazgo como "atendido" — el proxy autenticado
              (/api/riesgos/:id/foto-solucion) es el único camino, nunca una
              URL pública de R2. */}
          {finding.status === "atendido" && finding.hasSolutionPhoto && (
            <a
              href={solutionPhotoUrl(finding.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={solutionPhotoUrl(finding.id)}
                alt="Foto de la corrección hecha por tu empresa"
                className="w-full aspect-video object-cover rounded-lg border border-black/[0.06]"
                data-testid={`img-solution-photo-${index}`}
              />
            </a>
          )}
        </div>
      )}
    </Card>
  );
}
