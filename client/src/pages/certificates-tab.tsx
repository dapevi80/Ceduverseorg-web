import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CERT_PRICES_MXN } from "@shared/cert-pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Award, Clock, Loader2, CheckCircle2, XCircle, Download, Plus, FileText,
} from "lucide-react";

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
// (server/lib/cert-status.ts::computeCertEligibleCourses), que reemplaza al
// antiguo /api/me/courses del Aula Virtual — ver el comentario en esa función
// para el porqué (bug 2026-07-19).
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

const CERT_STATE_UI: Record<string, { label: string; color: string; icon: any }> = {
  elegible: { label: "Puedes solicitarlo", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  sin_intento_aprobado: { label: "Falta aprobar el quiz", color: "bg-amber-100 text-amber-800", icon: Clock },
  pago_pendiente: { label: "Pago pendiente", color: "bg-amber-100 text-amber-800", icon: Clock },
  ya_solicitado: { label: "En proceso", color: "bg-blue-100 text-blue-800", icon: Loader2 },
  emitido: { label: "Emitido", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  curso_no_encontrado: { label: "Curso no encontrado", color: "bg-red-100 text-red-800", icon: XCircle },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  solicitado: { label: "Solicitado", color: "bg-amber-100 text-amber-800", icon: Clock },
  pending_payment: { label: "Pago pendiente", color: "bg-amber-100 text-amber-800", icon: Clock },
  en_proceso: { label: "En proceso", color: "bg-blue-100 text-blue-800", icon: Loader2 },
  emitido: { label: "Emitido", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  rechazado: { label: "Rechazado", color: "bg-red-100 text-red-800", icon: XCircle },
};

const TYPE_CONFIG: Record<string, { label: string; badge: string; price: string }> = {
  diploma: { label: "Diploma NFT", badge: "bg-cedu-green/10 text-cedu-green", price: "Gratis" },
  dc3: { label: "DC-3 STPS", badge: "bg-amber-100 text-amber-800", price: `$${CERT_PRICES_MXN.dc3.toLocaleString()} MXN` },
  sep: { label: "Certificado SEP", badge: "bg-cedu-blue/10 text-cedu-blue", price: `$${CERT_PRICES_MXN.sep.toLocaleString()} MXN` },
};

export function CertificatesTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedType, setSelectedType] = useState("");

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

  // Elegible para AL MENOS un certificado de pago (dc3 o sep): son los cursos
  // que tiene sentido ofrecer en el selector de "Solicitar certificado".
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
      setDialogOpen(false);
      setSelectedCourse("");
      setSelectedType("");
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "No se pudo solicitar el certificado",
        variant: "destructive",
      });
    },
  });

  const solicited = certificates.filter((c) => c.status === "solicitado");
  const pendingPayment = certificates.filter((c) => c.status === "pending_payment");
  const inProcess = certificates.filter((c) => c.status === "en_proceso");
  const emitted = certificates.filter((c) => c.status === "emitido");
  const rejected = certificates.filter((c) => c.status === "rechazado");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cedu-blue" />
        <span className="ml-3 text-muted-foreground">Cargando certificados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="certificates-tab">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-cedu-ink">Mis Certificados</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Solicita y gestiona tus certificaciones oficiales DC-3 STPS y SEP.
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
                        <SelectItem key={c.slug} value={c.slug}>
                          {c.title}
                        </SelectItem>
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

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-cedu-ink">Tus cursos del Tutor IA</h3>
        {isCoursesLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando tus cursos del Tutor IA...
          </div>
        ) : isCoursesError ? (
          <Card className="border-red-200" data-testid="cert-courses-error">
            <CardContent className="py-6 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">
                No pudimos cargar tus cursos del Tutor IA. Esto NO significa que no tengas cursos — intenta de nuevo en unos minutos.
              </p>
            </CardContent>
          </Card>
        ) : courses.length === 0 ? (
          <Card className="border-dashed" data-testid="cert-courses-empty">
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Aún no te has inscrito ni tomado ninguna evaluación en el <strong>Tutor IA</strong>. Ahí es donde se obtienen las constancias DC-3 STPS y SEP.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {courses.map((course) => {
              const rows = (["dc3", "sep"] as const)
                .map((certType) => ({ certType, cert: course.certs[certType] }))
                .filter(({ cert }) => cert.state !== "curso_sin_certificado");
              return (
                <Card key={course.slug} data-testid={`cert-course-${course.slug}`}>
                  <CardContent className="py-4 px-5 space-y-3">
                    <p className="font-semibold text-sm text-cedu-ink">{course.title}</p>
                    {rows.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Este curso no ofrece certificados de pago (DC-3 / SEP).</p>
                    ) : (
                      rows.map(({ certType, cert }) => {
                        const ui = CERT_STATE_UI[cert.state] || CERT_STATE_UI.sin_intento_aprobado;
                        const StateIcon = ui.icon;
                        return (
                          <div key={certType} className="flex items-center justify-between gap-3 flex-wrap" data-testid={`cert-course-${course.slug}-${certType}`}>
                            <div className="flex items-center gap-2">
                              <Badge className={`${TYPE_CONFIG[certType].badge} border-0 text-xs`}>
                                {TYPE_CONFIG[certType].label}
                              </Badge>
                              <Badge variant="outline" className={`${ui.color} border-0 text-xs gap-1`}>
                                <StateIcon className={`h-3 w-3 ${cert.state === "ya_solicitado" ? "animate-spin" : ""}`} />
                                {ui.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{cert.message}</span>
                            </div>
                            {cert.state === "elegible" && (
                              <Button
                                size="sm"
                                className="bg-cedu-blue hover:bg-cedu-blue/90 text-white"
                                disabled={requestMutation.isPending}
                                onClick={() => requestMutation.mutate({ courseSlug: course.slug, certType })}
                                data-testid={`btn-request-${course.slug}-${certType}`}
                              >
                                Solicitar (${cert.priceMxn.toLocaleString()} MXN)
                              </Button>
                            )}
                            {cert.state === "pago_pendiente" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={requestMutation.isPending}
                                onClick={() => requestMutation.mutate({ courseSlug: course.slug, certType })}
                                data-testid={`btn-complete-payment-${course.slug}-${certType}`}
                              >
                                Completar pago
                              </Button>
                            )}
                            {cert.state === "emitido" && cert.request?.pdfUrl && (
                              <a href={cert.request.pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" className="gap-1">
                                  <Download className="h-3.5 w-3.5" />
                                  PDF
                                </Button>
                              </a>
                            )}
                            {cert.state === "sin_intento_aprobado" && (
                              <Link href={`/tutor-ia/${course.slug}`}>
                                <Button size="sm" variant="outline">Ir al Tutor IA</Button>
                              </Link>
                            )}
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="stat-cert-total">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-cedu-blue/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-cedu-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold font-serif">{certificates.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold font-serif">{solicited.length + pendingPayment.length + inProcess.length}</p>
                <p className="text-xs text-muted-foreground">En proceso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold font-serif">{emitted.length}</p>
                <p className="text-xs text-muted-foreground">Emitidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-cedu-violet/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-cedu-violet" />
              </div>
              <div>
                <p className="text-2xl font-bold font-serif">{certificates.filter(c => c.certType === "dc3").length}</p>
                <p className="text-xs text-muted-foreground">DC-3 STPS</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {certificates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Award className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-serif font-bold text-cedu-ink">Sin certificados aún</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Completa cursos y aprueba las evaluaciones para solicitar tu constancia DC-3 STPS o certificado SEP.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[
            { title: "Pendientes", items: [...solicited, ...pendingPayment, ...inProcess], icon: Clock, color: "text-amber-500" },
            { title: "Emitidos", items: emitted, icon: CheckCircle2, color: "text-green-600" },
            { title: "Rechazados", items: rejected, icon: XCircle, color: "text-red-500" },
          ]
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <div key={group.title} className="space-y-2">
                <h3 className="text-sm font-semibold text-cedu-ink flex items-center gap-2">
                  <group.icon className={`h-4 w-4 ${group.color}`} />
                  {group.title} ({group.items.length})
                </h3>
                {group.items.map((cert) => {
                  const statusCfg = STATUS_CONFIG[cert.status] || STATUS_CONFIG.solicitado;
                  const typeCfg = TYPE_CONFIG[cert.certType] || TYPE_CONFIG.diploma;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <Card key={cert.id} className="hover:shadow-sm transition-shadow" data-testid={`cert-card-${cert.id}`}>
                      <CardContent className="py-4 px-5">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-xl bg-cedu-blue/10 flex items-center justify-center flex-shrink-0">
                            <Award className="h-5 w-5 text-cedu-blue" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-cedu-ink truncate">
                              {cert.courseName || cert.courseTitle || cert.studioCourseSlug}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Solicitado el {new Date(cert.createdAt).toLocaleDateString("es-MX")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={`${typeCfg.badge} border-0 text-xs`}>
                              {typeCfg.label}
                            </Badge>
                            <Badge variant="outline" className={`${statusCfg.color} border-0 text-xs gap-1`}>
                              <StatusIcon className={`h-3 w-3 ${cert.status === "en_proceso" ? "animate-spin" : ""}`} />
                              {statusCfg.label}
                            </Badge>
                          </div>
                          {cert.status === "emitido" && cert.pdfUrl && (
                            <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="gap-1" data-testid={`button-download-cert-${cert.id}`}>
                                <Download className="h-3.5 w-3.5" />
                                PDF
                              </Button>
                            </a>
                          )}
                        </div>
                        {cert.status === "rechazado" && cert.rejectReason && (
                          <div className="mt-3 pt-3 border-t border-black/[0.04]">
                            <p className="text-xs text-red-600">
                              Motivo: {cert.rejectReason}
                            </p>
                          </div>
                        )}
                        {cert.status === "pending_payment" && (
                          <div className="mt-2 text-xs text-amber-700">
                            Pago pendiente.
                            <button
                              className="ml-2 underline disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={requestMutation.isPending}
                              onClick={() => requestMutation.mutate({ courseSlug: cert.courseSlug || cert.studioCourseSlug, certType: cert.certType })}
                              data-testid={`btn-complete-payment-${cert.id}`}
                            >Completar pago</button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
