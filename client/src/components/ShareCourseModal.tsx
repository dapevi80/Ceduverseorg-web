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
    sublabel: "Aula Virtual \u2014 Capacitaci\u00f3n STPS",
    icon: Video,
    color: "cedu-blue",
    bgClass: "bg-cedu-blue-light/50 border-cedu-blue/10",
    shareIntro: "\u00a1Te comparto esta conferencia pregrabada con expertos en",
    shareBody: "Es parte del Aula Virtual de Ceduverse \u2014 conferencias profesionales con especialistas certificados en cumplimiento STPS y desarrollo laboral.",
  },
  "tutor-ia": {
    label: "Curso con Tutor de Inteligencia Artificial",
    sublabel: "Tutor IA \u2014 Aprendizaje personalizado",
    icon: Sparkles,
    color: "cedu-violet",
    bgClass: "bg-cedu-violet/[0.06] border-cedu-violet/10",
    shareIntro: "\u00a1Mira nada m\u00e1s! \ud83d\udc40 Encontr\u00e9 un curso con tutor de IA que te va a encantar, sobre",
    shareBody: "Tienes un tutor de inteligencia artificial de Ceduverse que responde tus dudas al instante, avanzas a tu propio ritmo desde el cel y terminas con una certificaci\u00f3n profesional. \u00a1Te lo dejo por si te late! \ud83d\ude80",
  },
  "academy": {
    label: "Curso profesional certificado",
    sublabel: "Ceducap Academy \u2014 Certificaci\u00f3n formal",
    icon: GraduationCap,
    color: "cedu-green",
    bgClass: "bg-cedu-green-light/50 border-cedu-green/10",
    shareIntro: "\u00a1Te comparto este curso certificado sobre",
    shareBody: "Es parte de Ceducap Academy de Ceduverse \u2014 formaci\u00f3n profesional con certificaci\u00f3n v\u00e1lida ante STPS para Latinoam\u00e9rica.",
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      toast({ title: "\u00a1Mensaje copiado!", description: "Incluye la descripci\u00f3n y el link de invitaci\u00f3n" });
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
      ? `Conferencia con expertos: ${courseTitle} \u2014 Ceduverse`
      : courseType === "tutor-ia"
        ? `Curso con Tutor IA: ${courseTitle} \u2014 Ceduverse`
        : `Curso certificado: ${courseTitle} \u2014 Ceduverse`;
    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(shareMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: courseType === "aula-virtual"
            ? `Conferencia: ${courseTitle} \u2014 Ceduverse`
            : `Curso: ${courseTitle} \u2014 Ceduverse`,
          text: shareMessage,
          url: shareUrl,
        });
      } catch {}
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Share2 className="h-5 w-5 text-cedu-blue" />
            Compartir {courseType === "aula-virtual" ? "conferencia" : "curso"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className={`border rounded-xl p-3 ${config.bgClass}`}>
            <div className="flex items-start gap-2.5">
              <div className={`flex-shrink-0 w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center`}>
                <TypeIcon className={`h-4.5 w-4.5 text-${config.color}`} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-cedu-ink line-clamp-2" data-testid="text-share-course-title">{courseTitle}</p>
                <p className="text-[11px] font-medium text-cedu-ink-muted mt-0.5">{config.label}</p>
                <p className="text-[10px] text-cedu-ink-muted/70 mt-0.5">{config.sublabel}</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/40 rounded-xl p-3">
            <p className="text-xs font-medium text-amber-900/80 leading-relaxed" data-testid="text-share-preview">
              {config.shareIntro} &ldquo;{courseTitle}&rdquo;
            </p>
            <p className="text-[11px] text-amber-800/60 mt-1 leading-relaxed">
              {config.shareBody}
            </p>
          </div>

          {referralData && (
            <div className="flex items-center gap-2 bg-cedu-green-light/50 border border-cedu-green/10 rounded-xl p-3">
              <Gift className="h-4 w-4 text-cedu-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-cedu-ink">Tu c\u00f3digo de referido</p>
                <p className="text-sm font-mono font-bold text-cedu-green" data-testid="text-referral-code">
                  {referralData.code}
                </p>
              </div>
              {referralData.usageCount > 0 && (
                <div className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-lg">
                  <Users className="h-3 w-3 text-cedu-ink-muted" />
                  <span className="text-xs font-semibold text-cedu-ink">{referralData.usageCount}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-cedu-ink-muted">Copiar mensaje completo</label>
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
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-cedu-ink-muted">Compartir por</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleWhatsApp}
                variant="outline"
                className="h-11 gap-2 text-sm font-semibold hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                data-testid="button-share-whatsapp"
              >
                <SiWhatsapp className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button
                onClick={handleEmail}
                variant="outline"
                className="h-11 gap-2 text-sm font-semibold hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                data-testid="button-share-email"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <Button
                onClick={handleNativeShare}
                variant="outline"
                className="w-full h-11 gap-2 text-sm font-semibold"
                data-testid="button-share-native"
              >
                <Share2 className="h-4 w-4" />
                M\u00e1s opciones
              </Button>
            )}
          </div>

          <p className="text-[11px] text-cedu-ink-muted text-center leading-relaxed">
            Cuando alguien se registre con tu link, quedar\u00e1 vinculado a tu red de referidos.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
