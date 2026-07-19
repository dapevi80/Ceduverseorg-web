import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Loader2, Camera, AlertTriangle } from "lucide-react";

interface TeamEvidenceRow {
  userId: string;
  courseSlug: string;
  exerciseIndex: number;
  photoUrl: string;
  points: number;
  createdAt: string;
  fullName: string | null;
  email: string;
}

interface TeamEvidenceResponse {
  team: { id: string; name: string };
  evidence: TeamEvidenceRow[];
}

// apiRequest (client/src/lib/queryClient.ts) lanza `Error(`${status}: ${bodyText}`)`
// en respuestas no-ok, donde bodyText es el JSON crudo del servidor (p.ej.
// `{"message":"No tienes una organización"}`). Recupera ese mensaje real en
// vez de mostrar el string crudo "403: {...}"; si el cuerpo no es JSON
// parseable cae a un mensaje honesto genérico.
function teamEvidenceErrorMessage(error: unknown): string {
  const fallback = "No pudimos cargar las evidencias del equipo. Recarga la página o inténtalo en unos minutos.";
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

// C2: el servidor resuelve el equipo desde la sesión (getEmpresaTeam, en
// server/routes/empresa.ts) — este componente NUNCA manda un teamId derivado
// del cliente (sería un vector de lectura cross-tenant). Por eso ya no recibe
// `teamId` como prop ni condiciona la query a él: el dashboard antes pasaba
// `userTeams.filter(t => t.role === "admin")[0]?.team.id`, que es `undefined`
// para admins con rol `empresa_rh` (getEmpresaTeam sí los reconoce) —
// dejándolos con la query deshabilitada para siempre, indistinguible de "sin
// evidencias todavía". Se llama siempre que el tab está montado (solo se
// monta para isOrgAdmin en dashboard.tsx — el gateo de "quién ve el tab" no
// cambia aquí).
export function TeamPlaybookEvidenceTab() {
  const { data, isLoading, isError, error } = useQuery<TeamEvidenceResponse>({
    queryKey: ["/api/empresa/playbook-evidencias"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/empresa/playbook-evidencias");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="py-12 text-center text-cedu-ink-muted" data-testid="view-team-evidence-loading">
        <Loader2 className="animate-spin mx-auto mb-3" size={28} />
        Cargando evidencias del equipo…
      </div>
    );
  }

  // Sin degradación silenciosa: un 403 (sin organización), 500 (error real
  // del servidor) o una falla de red NUNCA deben caer en la misma tarjeta
  // que "sin evidencias todavía" — ese estado es SOLO para una organización
  // real que de verdad no tiene fotos subidas aún.
  if (isError) {
    return (
      <div className="py-12 text-center" data-testid="view-team-evidence-error">
        <AlertTriangle size={36} className="mx-auto text-red-500 mb-3" />
        <h3 className="font-serif text-lg text-cedu-ink mb-1">No se pudieron cargar las evidencias</h3>
        <p className="text-sm text-cedu-ink-muted">{teamEvidenceErrorMessage(error)}</p>
      </div>
    );
  }

  const evidence = data?.evidence || [];

  if (evidence.length === 0) {
    return (
      <div className="py-12 text-center" data-testid="view-team-evidence-empty">
        <Camera size={36} className="mx-auto text-cedu-ink-muted/30 mb-3" />
        <h3 className="font-serif text-lg text-cedu-ink mb-1">Sin evidencias todavía</h3>
        <p className="text-sm text-cedu-ink-muted">
          Aquí verás las fotos que tu equipo suba al aplicar los ejercicios de campo del Playbook.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="view-team-evidence">
      <h3 className="font-serif text-lg text-cedu-ink mb-1">Evidencias del equipo</h3>
      <p className="text-sm text-cedu-ink-muted mb-6">
        {evidence.length} evidencia{evidence.length !== 1 ? "s" : ""} de {data?.team.name}
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {evidence.map((row, i) => (
          <Card key={i} className="p-3" data-testid={`card-team-evidence-${i}`}>
            <a href={row.photoUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={row.photoUrl}
                alt={`Evidencia de ${row.fullName || row.email}`}
                className="w-full aspect-video object-cover rounded-lg mb-2 border border-black/[0.06]"
              />
            </a>
            <p className="text-sm font-semibold text-cedu-ink">{row.fullName || row.email}</p>
            <p className="text-xs text-cedu-ink-muted">
              {row.courseSlug} · Ejercicio {row.exerciseIndex + 1} · {new Date(row.createdAt).toLocaleDateString("es-MX")}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
