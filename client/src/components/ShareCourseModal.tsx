import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Check, Share2, Mail, Gift, Users, Video, Sparkles, GraduationCap } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

interface ShareCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  courseSlug: string;
  courseType: "tutor-ia" | "aula-virtual" | "academy";
  courseId?: string | number;
}

const courseTypeConfig = {
  "aula-virtual": {
    label: "Conferencia pregrabada con expertos",
    sublabel: "Aula Virtual — Capacitación STPS",
    icon: Video,
    color: "cedu-blue",
    bgClass: "bg-cedu-blue-light/50 border-cedu-blue/10",
    shareIntro: "¡Te comparto esta conferencia pregrabada con expertos en",
    shareBody: "Es parte del Aula Virtual de Ceduverse — conferencias profesionales con especialistas certificados en cumplimiento STPS y desarrollo laboral.",
  },
  "tutor-ia": {
    label: "Curso con Tutor de Inteligencia Artificial",
    sublabel: "Tutor IA — Aprendizaje personalizado",
    icon: Sparkles,
    color: "cedu-violet",
    bgClass: "bg-cedu-violet/[0.06] border-cedu-violet/10",
    shareIntro: "¡Mira nada más! 👀 Encontré un curso con tutor de IA que te va a encantar, sobre",
    shareBody: "Tienes un tutor de inteligencia artificial de Ceduverse que responde tus dudas al instante, avanzas a tu propio ritmo desde el cel y terminas con una certificación profesional. ¡Te lo dejo por si te late! 🚀",
  },
  "academy": {
    label: "Curso profesional certificado",
    sublabel: "Ceducap Academy — Certificación formal",
    icon: GraduationCap,
    color: "cedu-green",
    bgClass: "bg-cedu-green-light/50 border-cedu-green/10",
    shareIntro: "¡Te comparto este curso certificado sobre",
    shareBody: "Es parte de Ceducap Academy de Ceduverse — formación profesional con certificación válida ante STPS para Latinoamérica.",
  },
};

export default function ShareCourseModal({
  open,
  onOpenChange,
  courseTitle,
  courseSlug,
  courseType,
  courseId,
}: ShareCourseModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const config = courseTypeConfig[courseType];
  const TypeIcon = config.icon;

  const { data: referralData } = useQuery<{ code: string; usageCount: number }>({
    queryKey: ["/api/me/referral"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/me/referral");
      return res.json();
    },
    enabled: !!user && open,
  });

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const getCoursePath = () => {
    switch (courseType) {
      case "tutor-ia":
        return `/tutor-ia/${courseSlug}/onboarding`;
      case "aula-virtual":
        return `/aula-virtual/${courseSlug}`;
      case "academy":
        return `/academy/${courseId || courseSlug}`;
      default:
        return `/`;
    }
  };

  const shareUrl = referralData
    ? `${baseUrl}${getCoursePath()}?ref=${referralData.code}`
    : `${baseUrl}${getCoursePath()}`;

  const shareMessage = `${config.shareIntro} "${courseTitle}"!\n\n${config.shareBody}\n\n${shareUrl}`;
  // Same intro/body as shareMessage but WITHOUT the trailing url — used for
  // navigator.share(), which already gets the link via its own `url` field.
  // Passing the url in both `text` and `url` made WhatsApp (and others)
  // render the link twice.
  const shareMessageNoUrl = `${config.shareIntro} "${courseTitle}"!\n\n${config.shareBody}`;

  const hasNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      toast({ title: "¡Mensaje copiado!", description: "Incluye la descripción y el link de invitación" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Error al copiar", variant: "destructive" });
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank");
  };

  const handleEmail = () => {
    const subjectText = courseType === "aula-virtual"
      ? `Conferencia con expertos: ${courseTitle} — Ceduverse`
      : courseType === "tutor-ia"
        ? `Curso con Tutor IA: ${courseTitle} — Ceduverse`
        : `Curso certificado: ${courseTitle} — Ceduverse`;
    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(shareMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: courseType === "aula-virtual"
            ? `Conferencia: ${courseTitle} — Ceduverse`
            : `Curso: ${courseTitle} — Ceduverse`,
          text: shareMessageNoUrl,
          url: shareUrl,
        });
      } catch {}
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-base">
            <Share2 className="h-4 w-4 text-cedu-blue" />
            Compartir {courseType === "aula-virtual" ? "conferencia" : "curso"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          <div className={`border rounded-xl p-2.5 ${config.bgClass}`}>
            <div className="flex items-center gap-2.5">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center">
                <TypeIcon className={`h-4 w-4 text-${config.color}`} />
              </div>
              <p className="text-sm font-semibold text-cedu-ink line-clamp-1 flex-1 min-w-0" data-testid="text-share-course-title">
                {courseTitle}
              </p>
            </div>
          </div>

          {referralData && (
            <div className="flex items-center gap-2 bg-cedu-green-light/50 border border-cedu-green/10 rounded-xl px-3 py-2">
              <Gift className="h-4 w-4 text-cedu-green flex-shrink-0" />
              <span className="text-xs font-semibold text-cedu-ink whitespace-nowrap">Tu código:</span>
              <span className="text-sm font-mono font-bold text-cedu-green truncate" data-testid="text-referral-code">
                {referralData.code}
              </span>
              {referralData.usageCount > 0 && (
                <div className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-lg ml-auto flex-shrink-0">
                  <Users className="h-3 w-3 text-cedu-ink-muted" />
                  <span className="text-xs font-semibold text-cedu-ink">{referralData.usageCount}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="text-xs bg-gray-50 font-mono"
              data-testid="input-share-url"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              size="icon"
              className="flex-shrink-0"
              data-testid="button-copy-link"
            >
              {copied ? (
                <Check className="h-4 w-4 text-cedu-green" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className={`grid gap-2 ${hasNativeShare ? "grid-cols-3" : "grid-cols-2"}`}>
            <Button
              onClick={handleWhatsApp}
              variant="outline"
              className="h-10 gap-1.5 text-xs font-semibold px-1.5 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
              data-testid="button-share-whatsapp"
            >
              <SiWhatsapp className="h-4 w-4 flex-shrink-0" />
              WhatsApp
            </Button>
            <Button
              onClick={handleEmail}
              variant="outline"
              className="h-10 gap-1.5 text-xs font-semibold px-1.5 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
              data-testid="button-share-email"
            >
              <Mail className="h-4 w-4 flex-shrink-0" />
              Email
            </Button>
            {hasNativeShare && (
              <Button
                onClick={handleNativeShare}
                variant="outline"
                className="h-10 gap-1.5 text-xs font-semibold px-1.5"
                data-testid="button-share-native"
              >
                <Share2 className="h-4 w-4 flex-shrink-0" />
                Más opciones
              </Button>
            )}
          </div>

          <p className="text-[11px] text-cedu-ink-muted text-center">
            Al registrarse con tu link, quedará vinculado a tu red de referidos.
          </p>

          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full h-9 text-sm text-cedu-ink-muted"
            data-testid="button-close-share"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
