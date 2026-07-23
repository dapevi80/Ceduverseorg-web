import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, XCircle, Plus } from "lucide-react";

type CertificateRequest = {
  id: string;
  userId: string;
  studioCourseSlug: string;
  certType: string;
  status: string;
  rejectReason: string | null;
  pdfUrl: string | null;
  createdAt: string;
  courseName?: string;
  courseTitle?: string;
  courseSlug?: string;
};

// Un curso del Tutor IA (studio_courses) con el que el socio se ha relacionado
// (inscrito, intentó el quiz, o ya tiene una solicitud), y la elegibilidad real
// de cada certificado de pago para ese curso. Viene de GET /api/me/cert-elegibles
// (server/lib/cert-status.ts::computeCertEligibleCourses).
type CertStatusEntry = {
  certType: "dc3" | "sep";
  state: string;
  message: string;
  eligible: boolean;
  priceMxn: number;
  request: { id: string; status: string; pdfUrl: string | null; rejectReason: string | null } | null;
};

type CertEligibleCourse = {
  slug: string;
  title: string;
  icon: string | null;
  certs: { dc3: CertStatusEntry; sep: CertStatusEntry };
};

// --- Rareza por tipo de certificado (spec 2026-07-20) -----------------------
const RARITY: Record<"dc3" | "sep", { frame: string; rarezaLabel: string; typeName: string; short: string }> = {
  dc3: { frame: "a-gold", rarezaLabel: "Oro", typeName: "Constancia DC-3 STPS", short: "DC-3" },
  sep: { frame: "a-steel", rarezaLabel: "Acero", typeName: "Certificado SEP", short: "SEP" },
};

type PlacaCta = "claim" | "pay" | "mint" | "pdf" | "unlock" | "none";
type FilterBucket = "ready" | "locked" | "process" | "owned" | "other";

// Estado del backend -> presentación de la placa. Todo real: viene de `state`.
const STATE_UI: Record<string, { pill: string; pillClass: string; locked?: boolean; owned?: boolean; cta: PlacaCta; bucket: FilterBucket }> = {
  elegible: { pill: "✨ Lista para acuñar", pillClass: "st-ready", cta: "claim", bucket: "ready" },
  sin_intento_aprobado: { pill: "🔒 Falta aprobar el quiz", pillClass: "st-locked", locked: true, cta: "unlock", bucket: "locked" },
  pago_pendiente: { pill: "⚠ Pago pendiente", pillClass: "st-pay", cta: "pay", bucket: "process" },
  ya_solicitado: { pill: "⏳ Emitiéndose…", pillClass: "st-mint", cta: "mint", bucket: "process" },
  emitido: { pill: "🏅 En tu colección", pillClass: "st-owned", owned: true, cta: "pdf", bucket: "owned" },
  curso_no_encontrado: { pill: "✕ Curso no encontrado", pillClass: "st-locked", locked: true, cta: "none", bucket: "other" },
};

type Placa = {
  key: string;
  slug: string;
  title: string;
  icon: string;
  certType: "dc3" | "sep";
  state: string;
  priceMxn: number;
  pdfUrl: string | null;
  createdAt: string | null;
  rejected: boolean;
  rejectReason: string | null;
  tookInAula: boolean; // el socio ya completó el curso gemelo en Conferencias Ceduverse (match confiable)
};

const FMT = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

// Conferencias Ceduverse (tabla `courses`) y Tutor IA (studio_courses) son catálogos
// distintos con títulos parecidos pero NO idénticos. Solo afirmamos "ya lo
// llevaste en el Aula" con un match CONFIABLE (regla no-claims-falsos): título
// idéntico normalizado, o el mismo código NOM. Si es difuso, no se afirma nada.
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const nomCode = (s: string) => {
  const m = norm(s).match(/nom\s?0?(\d{3})/);
  return m ? `nom${m[1]}` : null;
};
function matchesAula(placaTitle: string, aulaTitles: string[]): boolean {
  const np = norm(placaTitle);
  const cp = nomCode(placaTitle);
  return aulaTitles.some((a) => {
    const na = norm(a);
    if (na && na === np) return true;
    const ca = nomCode(a);
    if (ca && cp && ca === cp) return true;
    return false;
  });
}

export function CertificatesTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [stateFilter, setStateFilter] = useState<"all" | FilterBucket>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "dc3" | "sep">("all");

  const { data: certificates = [], isLoading } = useQuery<CertificateRequest[]>({
    queryKey: ["/api/me/certificates"],
  });

  const {
    data: coursesData,
    isLoading: isCoursesLoading,
    isError: isCoursesError,
  } = useQuery<{ courses: CertEligibleCourse[] }>({
    queryKey: ["/api/me/cert-elegibles"],
  });
  const courses = coursesData?.courses ?? [];

  // Conferencias Ceduverse: inscripciones + catálogo (ya en caché, los pide el dashboard).
  // Sirven para el PUENTE: explicar por qué un curso completado en el Aula no
  // aparece como certificado, y marcar las placas cuyo gemelo del Aula ya llevó.
  const { data: aulaEnrollments = [] } = useQuery<{ id: number; courseId: string; courseSlug: string; completed: number }[]>({
    queryKey: ["/api/me/courses"],
  });
  const { data: aulaCatalog = [] } = useQuery<{ id: string; slug: string; title: string }[]>({
    queryKey: ["/api/courses"],
  });
  const aulaLookup = new Map(aulaCatalog.map((c) => [c.id, c]));
  const completedAulaTitles = aulaEnrollments
    .filter((e) => e.completed >= 100)
    .map((e) => aulaLookup.get(e.courseId)?.title)
    .filter((t): t is string => Boolean(t));

  // Cursos elegibles para AL MENOS un certificado de pago: para el selector del diálogo.
  const eligibleCourses = courses.filter((c) => c.certs.dc3.eligible || c.certs.sep.eligible);

  const requestMutation = useMutation({
    mutationFn: async (vars: { courseSlug: string; certType: string }) => {
      const res = await apiRequest("POST", "/api/me/certificates", {
        courseSlug: vars.courseSlug,
        certType: vars.certType,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data?.checkout_url) {
        window.location.href = data.checkout_url; // certificado de pago -> Stripe
        return;
      }
      toast({ title: "Solicitud enviada", description: "Tu certificado ha sido solicitado exitosamente." });
      queryClient.invalidateQueries({ queryKey: ["/api/me/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/cert-elegibles"] });
      setDialogOpen(false);
      setSelectedCourse("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "No se pudo solicitar el certificado", variant: "destructive" });
    },
  });

  // --- Construir las placas (1 por curso × certType con cert de pago) --------
  const placas: Placa[] = courses.flatMap((course) =>
    (["dc3", "sep"] as const)
      .map((ct) => ({ ct, cert: course.certs[ct] }))
      .filter(({ cert }) => cert.state !== "curso_sin_certificado")
      .map(({ ct, cert }) => {
        const req = certificates.find(
          (c) => (c.courseSlug || c.studioCourseSlug) === course.slug && c.certType === ct,
        );
        return {
          key: `${course.slug}-${ct}`,
          slug: course.slug,
          title: course.title,
          icon: course.icon || "🎓",
          certType: ct,
          state: cert.state,
          priceMxn: cert.priceMxn,
          pdfUrl: cert.request?.pdfUrl ?? req?.pdfUrl ?? null,
          createdAt: req?.createdAt ?? null,
          rejected: req?.status === "rechazado",
          rejectReason: cert.request?.rejectReason ?? req?.rejectReason ?? null,
          tookInAula: matchesAula(course.title, completedAulaTitles),
        };
      }),
  );

  // Contadores reales para la tira de progreso.
  const total = placas.length;
  const readyCount = placas.filter((p) => STATE_UI[p.state]?.bucket === "ready").length;
  const processCount = placas.filter((p) => STATE_UI[p.state]?.bucket === "process").length;
  const ownedCount = placas.filter((p) => STATE_UI[p.state]?.bucket === "owned").length;
  const dc3Count = placas.filter((p) => p.certType === "dc3").length;
  const pct = total > 0 ? Math.round((ownedCount / total) * 100) : 0;

  const rejected = certificates.filter((c) => c.status === "rechazado");

  const FILTERS: { key: "all" | FilterBucket; label: string; count: number }[] = [
    { key: "all", label: "Todas", count: total },
    { key: "ready", label: "✨ Listas", count: readyCount },
    { key: "locked", label: "🔒 Bloqueadas", count: placas.filter((p) => STATE_UI[p.state]?.bucket === "locked").length },
    { key: "process", label: "⏳ En proceso", count: processCount },
    { key: "owned", label: "🏅 Emitidas", count: ownedCount },
  ];

  const visiblePlacas = placas.filter((p) => {
    if (typeFilter !== "all" && p.certType !== typeFilter) return false;
    if (stateFilter !== "all" && STATE_UI[p.state]?.bucket !== stateFilter) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cedu-blue" />
        <span className="ml-3 text-muted-foreground">Cargando certificados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 placas-scope" data-testid="certificates-tab">
      <style>{PLACA_CSS}</style>

      {/* Header (se conserva el diálogo Solicitar certificado) */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-serif font-bold text-cedu-ink">Colección de Certificados</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cada curso que apruebas desbloquea una placa. Acúñala y tu constancia oficial DC-3 STPS o SEP entra a tu colección.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cedu-blue hover:bg-cedu-blue/90 text-white" data-testid="button-request-certificate">
              <Plus className="h-4 w-4 mr-1" />
              Solicitar certificado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Solicitar Certificado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-cedu-ink mb-1.5 block">Curso completado</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger data-testid="select-certificate-course">
                    <SelectValue placeholder="Seleccionar curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {isCoursesLoading ? (
                      <SelectItem value="none" disabled>Cargando cursos…</SelectItem>
                    ) : isCoursesError ? (
                      <SelectItem value="none" disabled>No se pudieron cargar tus cursos</SelectItem>
                    ) : eligibleCourses.length === 0 ? (
                      <SelectItem value="none" disabled>No hay cursos del Tutor IA listos para certificado</SelectItem>
                    ) : (
                      eligibleCourses.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>{c.title}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Las constancias DC-3 STPS y SEP se obtienen al tomar el curso en el <strong>Tutor IA</strong> y aprobar su evaluación. Ahí mismo solicitas y pagas tu certificado.
              </p>
              {selectedCourse && selectedCourse !== "none" && (
                <Link href={`/tutor-ia/${selectedCourse}`}>
                  <Button className="w-full bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white" data-testid="button-go-tutor-ia-cert">
                    Ir al Tutor IA de este curso para obtener tu DC-3
                  </Button>
                </Link>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tira de progreso de la colección */}
      <div className="flex items-center gap-5 flex-wrap bg-white border border-black/[0.06] rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex-1 min-w-[220px]">
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-serif text-lg text-cedu-ink">{ownedCount} de {total} en tu colección</span>
            <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-cedu-cream border border-black/[0.05] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-cedu-blue to-cedu-violet transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { n: readyCount, l: "Listas", c: "#00b87a" },
            { n: processCount, l: "En proceso", c: "#1b5adf" },
            { n: ownedCount, l: "Emitidas", c: "#00b87a" },
            { n: dc3Count, l: "DC-3", c: "#b8860b" },
          ].map((s) => (
            <div key={s.l} className="flex flex-col bg-cedu-cream border border-black/[0.05] rounded-xl px-3 py-2 min-w-[76px]">
              <b className="font-serif text-lg leading-none text-cedu-ink">{s.n}</b>
              <span className="text-[10.5px] text-muted-foreground mt-1 flex items-center gap-1">
                <i className="w-1.5 h-1.5 rounded-full" style={{ background: s.c }} />{s.l}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cómo consigo un certificado */}
      <div>
        <h3 className="text-sm font-semibold text-cedu-ink-soft mb-3 flex items-center gap-2">🧭 ¿Cómo consigo un certificado?</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            { n: 1, t: "Toma el curso", d: "Estudia en el Tutor IA a tu ritmo." },
            { n: 2, t: "Aprueba el quiz", d: "La placa se desbloquea." },
            { n: 3, t: "Acúñala", d: "Paga y solicita tu constancia." },
            { n: 4, t: "Descarga", d: "Baja tu PDF oficial validado." },
          ].map((s) => (
            <div key={s.n} className="bg-white border border-black/[0.06] rounded-xl p-3.5 flex gap-2.5 items-start shadow-sm">
              <div className="flex-none w-6 h-6 rounded-lg bg-cedu-blue-light text-cedu-blue font-extrabold text-xs grid place-items-center">{s.n}</div>
              <div>
                <h4 className="text-[12.5px] font-semibold text-cedu-ink mb-0.5">{s.t}</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Puente Conferencias Ceduverse → Tutor IA: explica por qué "completado" ≠ "certificado" */}
      {completedAulaTitles.length > 0 && (
        <div className="flex items-start gap-3 bg-cedu-blue-light/60 border border-cedu-blue/20 rounded-2xl px-5 py-4" data-testid="cert-aula-bridge">
          <span className="text-xl leading-none mt-0.5">💡</span>
          <div className="text-sm text-cedu-ink-soft">
            <p className="font-semibold text-cedu-ink">
              Completaste {completedAulaTitles.length} {completedAulaTitles.length === 1 ? "curso" : "cursos"} en Conferencias Ceduverse — pero esas clases no emiten constancia por sí solas.
            </p>
            <p className="mt-1 leading-relaxed">
              Las constancias <strong>DC-3 STPS</strong> y <strong>SEP</strong> se obtienen tomando <strong>el mismo curso en el Tutor IA</strong> y aprobando su quiz. Cada placa de abajo te lleva a su curso en el Tutor IA para desbloquearla.
            </p>
            <Link href="/tutor-ia">
              <span className="inline-block mt-2 text-cedu-blue font-semibold hover:underline cursor-pointer" data-testid="cert-aula-bridge-cta">
                Ver mis cursos en el Tutor IA →
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Estados de carga / error / vacío de la colección */}
      {isCoursesLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando tu colección…
        </div>
      ) : isCoursesError ? (
        <div className="border border-red-200 rounded-2xl bg-red-50/50 py-6 px-5 flex items-center gap-3" data-testid="cert-courses-error">
          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            No pudimos cargar tu colección. Esto NO significa que no tengas certificados — intenta de nuevo en unos minutos.
          </p>
        </div>
      ) : placas.length === 0 ? (
        <div className="border border-dashed border-black/10 rounded-2xl py-14 text-center" data-testid="cert-courses-empty">
          <div className="text-4xl mb-3">🪙</div>
          <h3 className="text-lg font-serif font-bold text-cedu-ink">Tu colección está vacía… por ahora</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Toma un curso en el <strong>Tutor IA</strong> y aprueba su evaluación para desbloquear tu primera placa DC-3 STPS o SEP.
          </p>
          <Link href="/tutor-ia">
            <Button className="mt-5 bg-cedu-blue hover:bg-cedu-blue/90 text-white">Ir al Tutor IA</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap items-center">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStateFilter(f.key)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
                  stateFilter === f.key ? "bg-cedu-ink text-white border-cedu-ink" : "bg-white text-cedu-ink-soft border-black/[0.08] hover:border-black/20"
                }`}
                data-testid={`filter-${f.key}`}
              >
                {f.label} <span className="opacity-60">{f.count}</span>
              </button>
            ))}
            <span className="flex-1" />
            {(["dc3", "sep"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
                  typeFilter === t ? "bg-cedu-ink text-white border-cedu-ink" : "bg-white text-cedu-ink-soft border-black/[0.08] hover:border-black/20"
                }`}
                data-testid={`filter-type-${t}`}
              >
                {RARITY[t].short}
              </button>
            ))}
          </div>

          {/* Grid de placas */}
          <div className="placa-grid">
            {visiblePlacas.map((p) => (
              <PlacaCard key={p.key} placa={p} requestMutation={requestMutation} />
            ))}
            {visiblePlacas.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 col-span-full">No hay placas en este filtro.</p>
            )}
          </div>

          {/* Rechazadas */}
          {rejected.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-cedu-ink flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" /> Rechazadas ({rejected.length})
              </h3>
              {rejected.map((c) => (
                <div key={c.id} className="bg-white border border-red-200 rounded-xl px-4 py-3" data-testid={`cert-rejected-${c.id}`}>
                  <p className="text-sm font-semibold text-cedu-ink">
                    {c.courseName || c.courseTitle || c.studioCourseSlug} · {RARITY[c.certType as "dc3" | "sep"]?.short ?? c.certType}
                  </p>
                  {c.rejectReason && <p className="text-xs text-red-600 mt-0.5">Motivo: {c.rejectReason}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- Una placa ---------------------------------------------------------------
function PlacaCard({ placa, requestMutation }: { placa: Placa; requestMutation: ReturnType<typeof useMutation<any, any, { courseSlug: string; certType: string }>> }) {
  const rarity = RARITY[placa.certType];
  const ui = STATE_UI[placa.state] ?? STATE_UI.sin_intento_aprobado;
  const pending = requestMutation.isPending;

  return (
    <div className={`placa ${rarity.frame} ${ui.locked ? "is-locked" : ""}`} data-testid={`placa-${placa.key}`}>
      <div className="placa-inner">
        {ui.owned && <span className="stamp">VÁLIDO</span>}
        <div className="a-top">
          <span>{rarity.rarezaLabel === "Oro" ? "DC-3 · Oro" : "SEP · Acero"}</span>
          <span className="a-folio">{rarity.short}</span>
        </div>
        <div className="seal"><span className="em">{placa.icon}</span></div>
        <div className="ribbon"><i /><i /></div>
        <div className="a-type">{rarity.typeName}</div>
        <div className="a-title">{placa.title}</div>
        {ui.owned && placa.createdAt && <div className="a-inst">Emitida · {FMT(placa.createdAt)}</div>}
        {ui.locked && placa.tookInAula && <div className="a-inst a-aula">✓ Ya lo llevaste en el Aula — apruébalo en el Tutor IA</div>}
        <div className="a-spacer" />
        <div className="a-foot">
          <span className={`a-status ${ui.pillClass}`}>
            {ui.cta === "mint" ? (
              <><span className="mini-spin" /> Emitiéndose…</>
            ) : (
              ui.pill
            )}
          </span>

          {ui.cta === "claim" && (
            <>
              <span className="price">${placa.priceMxn.toLocaleString("es-MX")} <small>MXN</small></span>
              <button
                className="pcta cc-claim"
                disabled={pending}
                onClick={() => requestMutation.mutate({ courseSlug: placa.slug, certType: placa.certType })}
                data-testid={`btn-request-${placa.slug}-${placa.certType}`}
              >
                Acuñar mi placa →
              </button>
            </>
          )}

          {ui.cta === "pay" && (
            <>
              <span className="price">${placa.priceMxn.toLocaleString("es-MX")} <small>MXN</small></span>
              <button
                className="pcta cc-pay"
                disabled={pending}
                onClick={() => requestMutation.mutate({ courseSlug: placa.slug, certType: placa.certType })}
                data-testid={`btn-complete-payment-${placa.slug}-${placa.certType}`}
              >
                Completar pago →
              </button>
            </>
          )}

          {ui.cta === "mint" && (
            <button className="pcta cc-mint" disabled>En proceso</button>
          )}

          {ui.cta === "pdf" && placa.pdfUrl && (
            <a href={placa.pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full">
              <button className="pcta cc-pdf" data-testid={`button-download-cert-${placa.slug}-${placa.certType}`}>⬇ Descargar PDF</button>
            </a>
          )}
          {ui.cta === "pdf" && !placa.pdfUrl && (
            <button className="pcta cc-mint" disabled>PDF en preparación</button>
          )}

          {ui.cta === "unlock" && (
            <>
              <span className="price price-muted">${placa.priceMxn.toLocaleString("es-MX")} <small>MXN</small></span>
              <Link href={`/tutor-ia/${placa.slug}`} className="w-full">
                <button className="pcta cc-unlock" data-testid={`btn-go-tutor-${placa.slug}-${placa.certType}`}>▶ Ir al Tutor IA</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Estilos de la placa (Placa Acuñada, spec 2026-07-20) --------------------
// Aislados bajo .placas-scope. Paleta Ceduverse; oro/acero literales (no hay
// token cedu para metales). Movimiento sutil; respeta prefers-reduced-motion.
const PLACA_CSS = `
.placas-scope .placa-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:20px;}
.placas-scope .placa{position:relative;border-radius:14px;padding:5px;box-shadow:0 2px 4px rgba(26,26,46,.05),0 14px 30px -16px rgba(26,26,46,.28);transition:transform .2s,box-shadow .2s;background:var(--metal);}
.placas-scope .placa:hover{transform:translateY(-5px);box-shadow:0 20px 44px -18px rgba(26,26,46,.42);}
.placas-scope .a-gold{--metal:linear-gradient(145deg,#f6d97a,#b8860b 40%,#8a6508 60%,#f6d97a);--seal:radial-gradient(circle at 38% 32%,#f6d97a,#c9971a 55%,#8a6508);--ink-accent:#8a6508;}
.placas-scope .a-steel{--metal:linear-gradient(145deg,#cfe0f5,#3a5a8c 45%,#26436b 62%,#cfe0f5);--seal:radial-gradient(circle at 38% 32%,#cfe0f5,#4f74a8 55%,#26436b);--ink-accent:#26436b;}
.placas-scope .placa.is-locked{--metal:linear-gradient(145deg,#dcdce6,#9a9ab0 50%,#7a7a92);--seal:radial-gradient(circle at 38% 32%,#e4e4ec,#a8a8bd 55%,#84849c);--ink-accent:#7a7a92;}
.placas-scope .placa-inner{position:relative;border-radius:10px;overflow:hidden;padding:16px 15px 15px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;min-height:300px;background:
  radial-gradient(circle, color-mix(in srgb,var(--ink-accent) 13%, transparent) 1px, transparent 1.7px) 0 0 / 11px 11px,
  linear-gradient(180deg,#ffffff,#f4f1ea);}
.placas-scope .placa-inner::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:5;background:linear-gradient(115deg,transparent 42%,rgba(255,255,255,.26) 50%,rgba(255,255,255,.06) 56%,transparent 64%);background-size:260% 100%;animation:placaSweep 6.5s linear infinite;mix-blend-mode:screen;}
.placas-scope .a-top{position:relative;z-index:2;display:flex;justify-content:space-between;width:100%;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-accent);}
.placas-scope .a-top .a-folio{color:#7a7a99;font-weight:700;letter-spacing:.06em;}
.placas-scope .seal{position:relative;z-index:2;width:88px;height:88px;border-radius:50%;overflow:hidden;background:var(--seal);display:grid;place-items:center;box-shadow:inset 0 2px 6px rgba(255,255,255,.5),inset 0 -6px 12px rgba(0,0,0,.28),0 6px 14px -6px rgba(0,0,0,.4);margin-top:4px;}
.placas-scope .seal::before{content:"";position:absolute;inset:7px;border-radius:50%;border:1.5px dashed rgba(255,255,255,.55);z-index:1;}
.placas-scope .seal::after{content:"";position:absolute;inset:0;z-index:2;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.6) 50%,transparent 60%);background-size:260% 100%;animation:placaSweep 3.8s linear infinite;mix-blend-mode:screen;}
.placas-scope .seal .em{position:relative;z-index:1;font-size:34px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3));}
.placas-scope .placa.is-locked .seal .em{filter:grayscale(1) opacity(.5);}
.placas-scope .ribbon{position:relative;z-index:2;display:flex;gap:5px;margin-top:-4px;}
.placas-scope .ribbon i{width:11px;height:20px;background:var(--metal);clip-path:polygon(0 0,100% 0,100% 100%,50% 78%,0 100%);opacity:.9;}
.placas-scope .a-type{position:relative;z-index:2;font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-accent);}
.placas-scope .a-title{position:relative;z-index:2;font-family:'DM Serif Display',Georgia,serif;font-weight:400;font-size:16px;line-height:1.15;color:#1a1a2e;text-wrap:balance;}
.placas-scope .a-inst{position:relative;z-index:2;font-size:10.5px;color:#7a7a99;margin-top:-3px;}
.placas-scope .a-aula{color:#00875c;font-weight:700;line-height:1.25;padding:0 4px;}
.placas-scope .a-spacer{flex:1;}
.placas-scope .a-foot{position:relative;z-index:2;width:100%;display:flex;flex-direction:column;gap:8px;}
.placas-scope .a-status{font-size:10.5px;font-weight:700;padding:4px 8px;border-radius:6px;align-self:center;display:inline-flex;align-items:center;gap:5px;}
.placas-scope .st-ready{color:#00875c;background:#e6fff5;}
.placas-scope .st-locked{color:#7a7a99;background:#f4f1ea;}
.placas-scope .st-pay{color:#c25e12;background:#fff3e6;}
.placas-scope .st-mint{color:#1b5adf;background:#e8f0ff;}
.placas-scope .st-owned{color:#00875c;background:#e6fff5;}
.placas-scope .price{font-family:'DM Serif Display',Georgia,serif;font-size:15px;color:#1a1a2e;}
.placas-scope .price small{font-family:inherit;font-size:10px;color:#7a7a99;font-weight:600;}
.placas-scope .price-muted{color:#7a7a99;}
.placas-scope .stamp{position:absolute;top:20px;right:8px;z-index:6;transform:rotate(12deg);border:2px solid #00b87a;color:#00875c;font-weight:800;font-size:10px;letter-spacing:.08em;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,.7);animation:placaPulse 2.4s ease-in-out infinite;}
.placas-scope .pcta{position:relative;z-index:2;border:none;cursor:pointer;font-weight:700;font-size:12px;padding:9px 12px;border-radius:9px;width:100%;display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:filter .15s;}
.placas-scope .pcta:hover{filter:brightness(1.05);}
.placas-scope .pcta:disabled{opacity:.6;cursor:not-allowed;}
.placas-scope .cc-claim{background:linear-gradient(135deg,#f6d97a,#c9971a);color:#3a2600;background-size:200% 100%;animation:placaShine 4s linear infinite;}
.placas-scope .cc-unlock{background:#f4f1ea;border:1px solid rgba(26,26,46,.1);color:#1a1a2e;}
.placas-scope .cc-pay{background:#f28023;color:#fff;}
.placas-scope .cc-mint{background:#e8f0ff;color:#1b5adf;cursor:default;}
.placas-scope .cc-pdf{background:#00b87a;color:#fff;}
.placas-scope .mini-spin{width:11px;height:11px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;display:inline-block;animation:placaSpin .8s linear infinite;}
@keyframes placaSweep{0%{background-position:180% 0;}100%{background-position:-80% 0;}}
@keyframes placaShine{0%{background-position:180% 0;}100%{background-position:-80% 0;}}
@keyframes placaPulse{0%,100%{opacity:.75;}50%{opacity:1;}}
@keyframes placaSpin{to{transform:rotate(360deg);}}
@media (prefers-reduced-motion:reduce){
  .placas-scope .placa-inner::after,.placas-scope .seal::after,.placas-scope .stamp,.placas-scope .cc-claim,.placas-scope .mini-spin{animation:none!important;}
}
`;
