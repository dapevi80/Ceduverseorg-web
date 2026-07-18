import { useParams, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { authUrlWithNext } from "@/lib/next-destination";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/auth-token";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { PLAYBOOK_COMPLETION_BONUS } from "@shared/playbook-points";

interface PlaybookExerciseInfo {
  index: number;
  title: string;
  instruction: string;
}

interface PlaybookApiResponse {
  course: { slug: string; title: string; icon: string | null };
  playbook: { exercises: PlaybookExerciseInfo[] };
}

interface EvidenceUploadResponse {
  evidence: { exerciseIndex: number; photoUrl: string; points: number; createdAt: string };
  pointsAwarded: number;
  completed: boolean;
  bonusAwarded: boolean;
}

export default function PlaybookExercisePage() {
  const params = useParams<{ slug: string; n: string }>();
  const slug = params.slug || "";
  const exerciseIndex = Number(params.n || "0");
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<EvidenceUploadResponse | null>(null);

  // Esta página se abre casi siempre escaneando un QR desde el celular — muchas
  // veces sin sesión iniciada. Solo redirigir a /auth una vez que el auth está
  // SETTLED (authLoading === false): `user` arranca en null mientras se resuelve
  // /api/auth/me, así que redirigir antes de eso rebotaría a un alumno YA logueado.
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(authUrlWithNext(window.location.pathname + window.location.search));
    }
  }, [authLoading, user, navigate]);

  const { data, isLoading } = useQuery<PlaybookApiResponse>({
    queryKey: ["/api/playbook", slug],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch(`/api/playbook/${slug}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Playbook no encontrado");
      }
      return res.json();
    },
    enabled: !!slug && !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const token = getAuthToken();
      const res = await fetch(`/api/playbook/${slug}/ejercicio/${exerciseIndex}/evidencia`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error al subir la evidencia");
      }
      return res.json() as Promise<EvidenceUploadResponse>;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: `¡Evidencia registrada! +${data.pointsAwarded} puntos`,
        description: data.bonusAwarded ? "¡Completaste el Playbook! Ganaste la medalla especial." : undefined,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Un solo loader cubre dos estados: el auth todavía resolviendo (no sabemos si
  // hay sesión, no renderizar contenido todavía) y auth ya resuelto sin usuario
  // (el efecto de arriba está a punto de redirigir a /auth — no mostrar nada
  // mientras tanto). Nunca decidir con un `if (!user)` a secas: user es null
  // mientras carga, y eso rebotaría a alumnos ya logueados.
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-cedu-cream flex items-center justify-center">
        <Loader2 className="animate-spin text-cedu-blue" size={32} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cedu-cream flex items-center justify-center">
        <Loader2 className="animate-spin text-cedu-blue" size={32} />
      </div>
    );
  }

  const exercise = data?.playbook.exercises.find((e) => e.index === exerciseIndex);

  if (!exercise) {
    return (
      <div className="min-h-screen bg-cedu-cream flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-sm">
          <h2 className="font-serif text-xl text-cedu-ink mb-2">Ejercicio no encontrado</h2>
          <Button onClick={() => navigate(`/tutor-ia/${slug}`)} className="mt-4">Volver al curso</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cedu-cream" data-testid="page-playbook-exercise">
      <div className="max-w-lg mx-auto px-6 py-10">
        <button
          onClick={() => navigate(`/tutor-ia/${slug}`)}
          className="flex items-center gap-1 text-sm text-cedu-ink-muted hover:text-cedu-blue mb-6"
          data-testid="button-back-course"
        >
          <ArrowLeft size={16} /> Volver al curso
        </button>

        <Card className="p-6">
          <p className="text-xs font-bold text-cedu-orange uppercase tracking-wide mb-1" data-testid="text-exercise-number">
            Ejercicio {exercise.index + 1} — {data?.course.title}
          </p>
          <h1 className="font-serif text-xl text-cedu-ink mb-3" data-testid="text-exercise-title">{exercise.title}</h1>
          <p className="text-sm text-cedu-ink-soft mb-6" data-testid="text-exercise-instruction">{exercise.instruction}</p>

          {result ? (
            <div className="text-center py-6" data-testid="view-evidence-confirmed">
              <CheckCircle2 size={48} className="mx-auto text-cedu-green mb-3" />
              <p className="font-semibold text-cedu-ink">¡Evidencia registrada!</p>
              <p className="text-cedu-blue font-bold text-lg">+{result.pointsAwarded} puntos</p>
              {result.bonusAwarded && (
                <p className="text-sm text-cedu-orange font-semibold mt-2">
                  🏅 ¡Completaste el Playbook! +{PLAYBOOK_COMPLETION_BONUS} puntos extra
                </p>
              )}
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadMutation.mutate(file);
                }}
                data-testid="input-evidence-photo"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                className="w-full h-12 bg-cedu-blue hover:bg-cedu-blue/90 text-white rounded-xl gap-2"
                data-testid="button-upload-evidence"
              >
                {uploadMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                Subir foto de evidencia
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
