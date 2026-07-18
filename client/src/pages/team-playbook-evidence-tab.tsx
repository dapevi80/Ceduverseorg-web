import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Loader2, Camera } from "lucide-react";

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

export function TeamPlaybookEvidenceTab({ teamId }: { teamId: string | undefined }) {
  const { data, isLoading } = useQuery<TeamEvidenceResponse>({
    queryKey: ["/api/empresa/playbook-evidencias"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/empresa/playbook-evidencias");
      return res.json();
    },
    enabled: !!teamId,
  });

  if (isLoading) {
    return (
      <div className="py-12 text-center text-cedu-ink-muted" data-testid="view-team-evidence-loading">
        <Loader2 className="animate-spin mx-auto mb-3" size={28} />
        Cargando evidencias del equipo…
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
