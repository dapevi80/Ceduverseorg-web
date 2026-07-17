import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CERT_PRICES_MXN } from "@shared/cert-pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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

type CourseEnrollment = {
  id: number;
  userId: string;
  courseId: string;
  courseSlug: string;
  completed: number;
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

  const { data: enrollments = [] } = useQuery<CourseEnrollment[]>({
    queryKey: ["/api/me/courses"],
  });

  const completedCourses = enrollments.filter((e) => e.completed >= 100);

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
                    {completedCourses.length === 0 ? (
                      <SelectItem value="none" disabled>No hay cursos completados</SelectItem>
                    ) : (
                      completedCourses.map((e) => (
                        <SelectItem key={e.courseSlug} value={e.courseSlug}>
                          {e.courseSlug?.replace(/-/g, " ") || e.courseSlug}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Las constancias DC-3 STPS y SEP se solicitan desde el curso en el Tutor IA, al aprobar su quiz.
              </p>
            </div>
          </DialogContent>
        </Dialog>
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
