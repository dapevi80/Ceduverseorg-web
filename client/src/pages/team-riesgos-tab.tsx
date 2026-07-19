import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth-token";
import { getStoredViewAsRole, VIEW_AS_HEADER } from "@/lib/view-as";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, ShieldAlert, ImageOff, RotateCcw, FileDown } from "lucide-react";

// Tablero de la empresa del detector de riesgos (Task 8 del plan
// docs/superpowers/plans/2026-07-18-detector-riesgos.md). Reemplaza la
// pestaña de evidencias del playbook (team-playbook-evidence-tab.tsx): esta
// SÍ tiene valor para la empresa — es el historial "detectado -> corregido"
// que se le puede mostrar a un inspector de la STPS (spec §10). Ver el spec
// docs/superpowers/specs/2026-07-18-detector-riesgos-design.md, en particular
// §4 (flujo), §6 (anonimato como regla de servidor) y §10.
//
// Regla dura que este archivo NUNCA rompe: un hallazgo anónimo no trae
// identidad del reportante en la respuesta del servidor (toCompanyView ya lo
// garantiza del lado del servidor), y esta UI no agrega ningún atajo para
// pedirla — ni "¿quién reportó esto?", ni mailto, ni nada que insinúe que
// alguien más sí lo sabe. Si `finding.reporter` es null, la interfaz
// simplemente no tiene ese dato.

type RiskStatus = "nuevo" | "en_revision" | "atendido" | "descartado";

interface CompanyFinding {
  id: string;
  anonymous: boolean;
  description: string;
  normRef: string | null;
  status: RiskStatus;
  createdAt: string; // fecha truncada YYYY-MM-DD (spec §6)
  reporter: { name: string } | null;
  photoRef: string;
  // Campos de un fix de servidor EN CURSO (ver brief de Task 8): pueden no
  // venir todavía. Todo el código de abajo los trata como opcionales y
  // degrada sin tronar si faltan — nunca asume que están presentes.
  resolvedAt?: string | null;
  resolutionNote?: string | null;
  hasSolutionPhoto?: boolean;
}

interface RiesgosResponse {
  hallazgos: CompanyFinding[];
}

interface PatchFindingResponse {
  finding: CompanyFinding;
  pointsAwarded: number;
  achievementAwarded: string | null;
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

// Espejo puro, SOLO para decidir qué botones mostrar, de
// server/lib/risk-status.ts (canTransition). La validación real de verdad
// vive en el servidor — esto nunca reemplaza esa autoridad, solo evita
// ofrecer un botón que el servidor de todos modos rechazaría.
const NEXT_ACTIONS: Record<RiskStatus, RiskStatus[]> = {
  nuevo: ["en_revision"],
  en_revision: ["atendido", "descartado"],
  atendido: ["en_revision"],
  descartado: ["en_revision"],
};

// Mismo allowlist real que reportar-riesgo.tsx / server/lib/playbook-upload.ts
// — nunca "image/*", que le ofrecería al picker SVG/GIF/BMP que el servidor
// rechaza.
const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

// apiRequest (client/src/lib/queryClient.ts) lanza `Error(`${status}: ${bodyText}`)`
// en respuestas no-ok, donde bodyText es el JSON crudo del servidor. Recupera
// ese mensaje real en vez de mostrar el string crudo "403: {...}"; si el
// cuerpo no es JSON parseable cae a un mensaje honesto genérico. Mismo patrón
// que team-playbook-evidence-tab.tsx (el bug de "sin datos" en vez de error
// real ya se corrigió ahí una vez — no se repite aquí).
function riesgosErrorMessage(error: unknown): string {
  const fallback = "No pudimos cargar los hallazgos del equipo. Recarga la página o inténtalo en unos minutos.";
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

/** Fecha "YYYY-MM-DD" o un timestamp ISO completo (resolvedAt puede venir en
 * cualquiera de las dos formas del fix de servidor en curso) → texto legible
 * en es-MX. Parsear los componentes a mano para "YYYY-MM-DD": `new Date(...)`
 * interpretaría esa cadena como medianoche UTC, y un huso horario negativo
 * (como México) se comería un día. Si el valor no es una fecha válida,
 * degrada mostrando el valor crudo en vez de tronar o mostrar "Invalid Date". */
function formatFlexibleDate(value: string): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.exec(value);
  if (dateOnly) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    const day = Number(value.slice(8, 10));
    return new Date(year, month - 1, day).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
}

function hazardPhotoUrl(photoRef: string): string {
  return `/api/riesgos/${photoRef}/foto`;
}

function solutionPhotoUrl(findingId: string): string {
  return `/api/empresa/riesgos/${findingId}/foto-solucion`;
}

/** URL del historial de cumplimiento en PDF (Task 11, spec §10). `from`/`to`
 * son los mismos filtros de fecha que ya tiene el tablero — se reusan tal
 * cual para que "exportar" coincida con "lo que estoy viendo", sin agregar
 * un segundo par de controles de fecha. requireAuth del servidor se
 * satisface con la cookie de sesión (mismo origen), igual que el export del
 * playbook en studio-course.tsx — window.open no necesita el header
 * Authorization legacy para esto. */
function historialPdfUrl(dateFrom: string, dateTo: string): string {
  const params = new URLSearchParams();
  if (dateFrom) params.set("from", dateFrom);
  if (dateTo) params.set("to", dateTo);
  const qs = params.toString();
  return `/api/empresa/riesgos/historial.pdf${qs ? `?${qs}` : ""}`;
}

/** PATCH multipart — apiRequest (queryClient.ts) siempre hace JSON.stringify
 * del body, así que no sirve para subir la foto de solución. Mismo patrón de
 * headers (Bearer legacy + X-View-As) que authedFetch en reportar-riesgo.tsx,
 * y el mismo contrato de "el error visible es el del servidor, nunca un
 * genérico": si la respuesta no es ok, se propaga el `message` real del
 * cuerpo (400 de "falta la foto"/"falta el motivo" incluidos). */
async function patchFinding(id: string, formData: FormData): Promise<PatchFindingResponse> {
  const headers = new Headers();
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const viewAsRole = getStoredViewAsRole();
  if (viewAsRole) headers.set(VIEW_AS_HEADER, viewAsRole);

  const res = await fetch(`/api/empresa/riesgos/${id}`, {
    method: "PATCH",
    headers,
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    let message = "No se pudo actualizar el hallazgo. Inténtalo de nuevo.";
    try {
      const parsed = JSON.parse(bodyText);
      if (parsed && typeof parsed.message === "string" && parsed.message.trim()) {
        message = parsed.message;
      }
    } catch {
      // cuerpo no era JSON — se queda con el mensaje genérico de arriba.
    }
    throw new Error(message);
  }

  return res.json();
}

export function TeamRiesgosTab() {
  const { data, isLoading, isError, error } = useQuery<RiesgosResponse>({
    queryKey: ["/api/empresa/riesgos"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/empresa/riesgos");
      return res.json();
    },
  });

  const [statusFilter, setStatusFilter] = useState<"todos" | RiskStatus>("todos");
  const [onlyWithSolutionPhoto, setOnlyWithSolutionPhoto] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  if (isLoading) {
    return (
      <div className="py-12 text-center text-cedu-ink-muted" data-testid="view-team-riesgos-loading">
        <Loader2 className="animate-spin mx-auto mb-3" size={28} />
        Cargando hallazgos del equipo…
      </div>
    );
  }

  // Sin degradación silenciosa: un 403 (sin organización), 500 (error real
  // del servidor) o una falla de red NUNCA deben caer en la misma tarjeta que
  // "sin hallazgos todavía" — ese estado es SOLO para una organización real
  // que de verdad no tiene hallazgos reportados aún. Este es exactamente el
  // bug que ya se corrigió una vez en la pestaña anterior; no se repite aquí.
  if (isError) {
    return (
      <div className="py-12 text-center" data-testid="view-team-riesgos-error">
        <AlertTriangle size={36} className="mx-auto text-red-500 mb-3" />
        <h3 className="font-serif text-lg text-cedu-ink mb-1">No se pudieron cargar los hallazgos</h3>
        <p className="text-sm text-cedu-ink-muted">{riesgosErrorMessage(error)}</p>
      </div>
    );
  }

  const hallazgos = data?.hallazgos || [];

  if (hallazgos.length === 0) {
    return (
      <div className="py-12 text-center" data-testid="view-team-riesgos-empty">
        <ShieldAlert size={36} className="mx-auto text-cedu-ink-muted/30 mb-3" />
        <h3 className="font-serif text-lg text-cedu-ink mb-1">Sin hallazgos todavía</h3>
        <p className="text-sm text-cedu-ink-muted">
          Aquí verás los riesgos reales que tu equipo reporte después de sus capacitaciones.
        </p>
      </div>
    );
  }

  const filtered = hallazgos.filter((h) => {
    if (statusFilter !== "todos" && h.status !== statusFilter) return false;
    if (onlyWithSolutionPhoto) {
      const hasPhoto = h.hasSolutionPhoto ?? h.status === "atendido";
      if (!hasPhoto) return false;
    }
    if (dateFrom && h.createdAt < dateFrom) return false;
    if (dateTo && h.createdAt > dateTo) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = `${h.description} ${h.normRef ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div data-testid="view-team-riesgos">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-serif text-lg text-cedu-ink">Hallazgos del equipo</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(historialPdfUrl(dateFrom, dateTo), "_blank")}
          data-testid="button-riesgos-historial-pdf"
        >
          <FileDown size={14} className="mr-1" />
          Historial de cumplimiento (PDF)
        </Button>
      </div>
      <p className="text-sm text-cedu-ink-muted mb-6">
        {hallazgos.length} hallazgo{hallazgos.length !== 1 ? "s" : ""} reportado
        {hallazgos.length !== 1 ? "s" : ""} por tu equipo
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6" data-testid="view-riesgos-filters">
        <div>
          <Label htmlFor="riesgos-filter-status" className="text-xs text-cedu-ink-muted mb-1 block">
            Estado
          </Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "todos" | RiskStatus)}>
            <SelectTrigger id="riesgos-filter-status" data-testid="select-riesgos-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="nuevo">{STATUS_LABELS.nuevo}</SelectItem>
              <SelectItem value="en_revision">{STATUS_LABELS.en_revision}</SelectItem>
              <SelectItem value="atendido">{STATUS_LABELS.atendido}</SelectItem>
              <SelectItem value="descartado">{STATUS_LABELS.descartado}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="riesgos-filter-search" className="text-xs text-cedu-ink-muted mb-1 block">
            Buscar (descripción o norma)
          </Label>
          <Input
            id="riesgos-filter-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ej. calza, plataforma, NOM-006..."
            data-testid="input-riesgos-search"
          />
        </div>

        <div className="flex items-end gap-2 pb-1.5">
          <label className="flex items-center gap-2 text-sm text-cedu-ink-muted cursor-pointer">
            <input
              type="checkbox"
              checked={onlyWithSolutionPhoto}
              onChange={(e) => setOnlyWithSolutionPhoto(e.target.checked)}
              data-testid="checkbox-riesgos-only-photo"
            />
            Solo con foto de corrección
          </label>
        </div>

        <div>
          <Label htmlFor="riesgos-filter-from" className="text-xs text-cedu-ink-muted mb-1 block">
            Desde
          </Label>
          <Input
            id="riesgos-filter-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            data-testid="input-riesgos-date-from"
          />
        </div>
        <div>
          <Label htmlFor="riesgos-filter-to" className="text-xs text-cedu-ink-muted mb-1 block">
            Hasta
          </Label>
          <Input
            id="riesgos-filter-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            data-testid="input-riesgos-date-to"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center" data-testid="view-riesgos-filtered-empty">
          <ImageOff size={32} className="mx-auto text-cedu-ink-muted/30 mb-2" />
          <p className="text-sm text-cedu-ink-muted">Ningún hallazgo coincide con estos filtros.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((finding, i) => (
            <FindingCard key={finding.id} finding={finding} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function FindingCard({ finding, index }: { finding: CompanyFinding; index: number }) {
  const { toast } = useToast();
  const [dialogStatus, setDialogStatus] = useState<RiskStatus | null>(null);
  const [resolutionNote, setResolutionNote] = useState(finding.resolutionNote ?? "");
  const [resolutionPhoto, setResolutionPhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async (vars: { status: RiskStatus; note?: string; photo?: File | null }) => {
      const formData = new FormData();
      formData.append("status", vars.status);
      if (vars.note) formData.append("resolutionNote", vars.note);
      if (vars.photo) formData.append("resolutionPhoto", vars.photo);
      return patchFinding(finding.id, formData);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/empresa/riesgos"] });
      setDialogStatus(null);
      setResolutionPhoto(null);
      toast({
        title: "Hallazgo actualizado",
        description:
          result.pointsAwarded > 0
            ? `Se acreditaron ${result.pointsAwarded} puntos al trabajador que lo reportó.`
            : undefined,
      });
    },
    onError: (err: Error) => {
      // Nunca un "algo salió mal" genérico: patchFinding ya propaga el
      // message real del servidor (400 de foto/motivo faltante incluido).
      toast({ title: "No se pudo actualizar el hallazgo", description: err.message, variant: "destructive" });
    },
  });

  function openDialog(status: RiskStatus) {
    setResolutionNote(finding.resolutionNote ?? "");
    setResolutionPhoto(null);
    setDialogStatus(status);
  }

  function submitSimpleTransition(status: RiskStatus) {
    mutation.mutate({ status });
  }

  function submitDialog() {
    if (!dialogStatus) return;
    // Enforce en el cliente ANTES de mandar la request (mejor UX), pero el
    // servidor es quien de verdad decide (validateTransition en
    // server/lib/risk-status.ts) — si de todos modos rechaza, onError arriba
    // muestra el mensaje real, no uno inventado aquí.
    if (dialogStatus === "atendido" && !resolutionPhoto) {
      toast({
        title: "Falta la foto de la corrección",
        description: "Para marcar el hallazgo como atendido se necesita subir la foto del riesgo ya corregido.",
        variant: "destructive",
      });
      return;
    }
    if (dialogStatus === "descartado" && !resolutionNote.trim()) {
      toast({
        title: "Falta el motivo",
        description: "Para descartar el hallazgo se necesita explicar el motivo.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({
      status: dialogStatus,
      note: resolutionNote.trim() || undefined,
      photo: resolutionPhoto,
    });
  }

  // hasSolutionPhoto puede no venir todavía (fix de servidor en curso, ver
  // el brief de Task 8): si falta, se infiere de la regla de negocio ya
  // vigente ("atendido" SIEMPRE exige foto para llegar a ese estado) en vez
  // de asumir que no hay foto y esconder evidencia que sí existe.
  const hasSolutionPhoto = finding.hasSolutionPhoto ?? finding.status === "atendido";
  const isClosed = finding.status === "atendido" || finding.status === "descartado";

  return (
    <Card className="p-4" data-testid={`card-team-riesgo-${index}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge className={`border ${STATUS_BADGE_CLASS[finding.status]}`} data-testid={`badge-status-${index}`}>
          {STATUS_LABELS[finding.status]}
        </Badge>
        <span className="text-xs text-cedu-ink-muted">{formatFlexibleDate(finding.createdAt)}</span>
      </div>

      <a href={hazardPhotoUrl(finding.photoRef)} target="_blank" rel="noopener noreferrer">
        <img
          src={hazardPhotoUrl(finding.photoRef)}
          alt="Foto del riesgo reportado"
          className="w-full aspect-video object-cover rounded-lg mb-2 border border-black/[0.06]"
          data-testid={`img-riesgo-photo-${index}`}
        />
      </a>

      <p className="text-sm text-cedu-ink mb-1" data-testid={`text-riesgo-description-${index}`}>
        {finding.description}
      </p>
      <p className="text-xs text-cedu-ink-muted mb-1">
        {finding.normRef ? (
          <>
            Norma citada: <span className="font-medium text-cedu-ink">{finding.normRef}</span>
          </>
        ) : (
          "Sin norma citada"
        )}
      </p>

      {/* Identidad: si es anónimo, `finding.reporter` viene null desde el
          servidor y aquí NO hay ningún atajo para pedirla — ni botón, ni
          mailto. Un hallazgo anónimo simplemente no trae ese dato. */}
      <p className="text-xs text-cedu-ink-muted mb-3" data-testid={`text-riesgo-reporter-${index}`}>
        Reportado por: {finding.reporter ? finding.reporter.name : "Anónimo"}
      </p>

      {isClosed && (
        <div className="bg-cedu-ink/[0.03] rounded-lg p-3 mb-3 space-y-1" data-testid={`view-riesgo-resolution-${index}`}>
          {finding.resolvedAt && (
            <p className="text-xs text-cedu-ink-muted">Cerrado el {formatFlexibleDate(finding.resolvedAt)}</p>
          )}
          {finding.resolutionNote && (
            <p className="text-xs text-cedu-ink-soft">{finding.resolutionNote}</p>
          )}
          {finding.status === "atendido" && hasSolutionPhoto && (
            <a href={solutionPhotoUrl(finding.id)} target="_blank" rel="noopener noreferrer" className="inline-block mt-1">
              <img
                src={solutionPhotoUrl(finding.id)}
                alt="Foto de la corrección"
                className="w-full aspect-video object-cover rounded-lg border border-black/[0.06]"
                data-testid={`img-riesgo-solution-photo-${index}`}
              />
            </a>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {finding.status === "nuevo" && NEXT_ACTIONS.nuevo.includes("en_revision") && (
          <Button
            size="sm"
            onClick={() => submitSimpleTransition("en_revision")}
            disabled={mutation.isPending}
            data-testid={`button-riesgo-review-${index}`}
          >
            {mutation.isPending && <Loader2 size={14} className="mr-1 animate-spin" />}
            Pasar a revisión
          </Button>
        )}
        {finding.status === "en_revision" && (
          <>
            <Button
              size="sm"
              onClick={() => openDialog("atendido")}
              disabled={mutation.isPending}
              data-testid={`button-riesgo-atender-${index}`}
            >
              Marcar atendido
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openDialog("descartado")}
              disabled={mutation.isPending}
              data-testid={`button-riesgo-descartar-${index}`}
            >
              Descartar
            </Button>
          </>
        )}
        {isClosed && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => submitSimpleTransition("en_revision")}
            disabled={mutation.isPending}
            data-testid={`button-riesgo-reabrir-${index}`}
          >
            {mutation.isPending ? <Loader2 size={14} className="mr-1 animate-spin" /> : <RotateCcw size={14} className="mr-1" />}
            Reabrir
          </Button>
        )}
      </div>

      <Dialog open={dialogStatus !== null} onOpenChange={(open) => !open && setDialogStatus(null)}>
        <DialogContent data-testid={`dialog-riesgo-${index}`}>
          <DialogHeader>
            <DialogTitle>
              {dialogStatus === "atendido" ? "Marcar como atendido" : "Descartar hallazgo"}
            </DialogTitle>
          </DialogHeader>

          {dialogStatus === "atendido" && (
            <div className="space-y-3">
              <div>
                <Label className="mb-1 block">Foto de la corrección (obligatoria)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={PHOTO_ACCEPT}
                  onChange={(e) => setResolutionPhoto(e.target.files?.[0] ?? null)}
                  data-testid={`input-riesgo-solution-photo-${index}`}
                />
                {resolutionPhoto && (
                  <p className="text-xs text-cedu-ink-muted mt-1">{resolutionPhoto.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor={`riesgo-note-${index}`} className="mb-1 block">
                  Nota (opcional)
                </Label>
                <Textarea
                  id={`riesgo-note-${index}`}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={3}
                  data-testid={`textarea-riesgo-note-atendido-${index}`}
                />
              </div>
            </div>
          )}

          {dialogStatus === "descartado" && (
            <div>
              <Label htmlFor={`riesgo-motivo-${index}`} className="mb-1 block">
                Motivo (obligatorio)
              </Label>
              <Textarea
                id={`riesgo-motivo-${index}`}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={3}
                placeholder="Explica por qué se descarta este hallazgo..."
                data-testid={`textarea-riesgo-note-descartado-${index}`}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogStatus(null)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={submitDialog} disabled={mutation.isPending} data-testid={`button-riesgo-confirm-${index}`}>
              {mutation.isPending && <Loader2 size={14} className="mr-1 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
