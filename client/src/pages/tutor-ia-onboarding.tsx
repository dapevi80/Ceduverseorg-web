import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useForceLightMode } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  BookOpen,
  Target,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Sparkles,
  User,
  Building2,
  BarChart3,
  Loader2,
} from "lucide-react";
import { authUrlWithNext } from "@/lib/next-destination";
import { motion, AnimatePresence } from "framer-motion";

const INDUSTRIES = [
  "Hotelería y Restaurantes",
  "Manufactura e Industria",
  "Construcción",
  "Comercio y Retail",
  "Servicios Profesionales",
  "Salud",
  "Educación",
  "Tecnología",
  "Gobierno",
  "Agricultura y Campo",
  "Transporte y Logística",
];

const COMPANY_SIZES = [
  { label: "1-10", value: "1-10" },
  { label: "11-50", value: "11-50" },
  { label: "51-100", value: "51-100" },
  { label: "101-300", value: "101-300" },
  { label: "300+", value: "300+" },
];

const EXPERIENCE_LEVELS = [
  { label: "Estoy empezando", value: "principiante" },
  { label: "Algo de experiencia", value: "intermedio" },
  { label: "Mucha experiencia", value: "avanzado" },
  { label: "Soy líder/director", value: "lider" },
];

interface StudentProfile {
  id?: string;
  jobTitle?: string | null;
  industry?: string | null;
  companySize?: string | null;
  experienceLevel?: string | null;
  learningGoals?: string[] | null;
}

interface CourseInfo {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  category: string;
}

export default function TutorIaOnboarding() {
  useForceLightMode();
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [learningGoal, setLearningGoal] = useState("");

  const { data: profile } = useQuery<StudentProfile | null>({
    queryKey: ["/api/me/student-profile"],
  });

  const { data: courseData } = useQuery<{ course: CourseInfo }>({
    queryKey: ["/api/studio/courses", slug],
    queryFn: async () => {
      const res = await fetch(`/api/studio/courses/${slug}`);
      if (!res.ok) throw new Error("Course not found");
      return res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (profile) {
      if (profile.jobTitle) setJobTitle(profile.jobTitle);
      if (profile.industry) {
        if (INDUSTRIES.includes(profile.industry)) {
          setIndustry(profile.industry);
        } else {
          setIndustry("Otro");
          setCustomIndustry(profile.industry);
        }
      }
      if (profile.companySize) setCompanySize(profile.companySize);
      if (profile.experienceLevel) setExperienceLevel(profile.experienceLevel);
      if (profile.learningGoals?.length) setLearningGoal(profile.learningGoals[0]);
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      // Lleva a dónde iba (incluido el ?ref= del link compartido) para volver
      // aquí después de iniciar sesión o crear la cuenta.
      navigate(authUrlWithNext(window.location.pathname + window.location.search));
    }
  }, [authLoading, user, navigate]);

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const finalIndustry = industry === "Otro" ? customIndustry : industry;
      await apiRequest("PUT", "/api/me/student-profile", {
        jobTitle: jobTitle || undefined,
        industry: finalIndustry || undefined,
        companySize: companySize || undefined,
        experienceLevel: experienceLevel || undefined,
        learningGoals: learningGoal ? [learningGoal] : [],
      });
      await apiRequest("POST", "/api/studio/enroll", { courseSlug: slug });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/student-profile"] });
      navigate(`/tutor-ia/${slug}`);
    },
  });

  // Sólo se rebota al login una vez que la sesión está RESUELTA. Antes esto era
  // `if (!user) navigate("/auth")` en pleno render: como `user` arranca en null
  // hasta que responde /api/auth/me, a un usuario CON sesión que abría un link
  // compartido lo mandaba al login (y de ahí al dashboard), sin llegar nunca al
  // curso. Además el rebote ahora lleva el destino, para volver aquí al entrar.
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-cedu-cream flex items-center justify-center">
        <Loader2 className="animate-spin text-cedu-blue" size={32} />
      </div>
    );
  }

  const course = courseData?.course;
  const finalIndustry = industry === "Otro" ? customIndustry : industry;
  const expLabel = EXPERIENCE_LEVELS.find(e => e.value === experienceLevel)?.label || experienceLevel;

  return (
    <div className="min-h-screen bg-cedu-cream">
      <header className="bg-white border-b border-black/[0.06]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/tutor-ia")}
            className="text-cedu-ink-muted hover:text-cedu-ink transition-colors"
            data-testid="button-back-catalog-onboarding"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-cedu-blue to-cedu-violet rounded-lg flex items-center justify-center">
              <Brain size={14} className="text-white" />
            </div>
            <span className="font-semibold text-cedu-ink text-sm">Tutor IA</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step >= s
                    ? "bg-cedu-blue text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 ${step > s ? "bg-cedu-blue" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-8">
                <h2 className="font-serif text-2xl text-cedu-ink mb-2" data-testid="text-onboarding-title">
                  Cómo funciona tu Tutor IA
                </h2>
                <p className="text-cedu-ink-muted text-sm">
                  Antes de comenzar, te explicamos qué hace especial este curso.
                </p>
              </div>

              <div className="space-y-4">
                <Card className="border-black/[0.06]">
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-12 h-12 bg-cedu-blue-light rounded-xl flex items-center justify-center shrink-0">
                      <Brain size={24} className="text-cedu-blue" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-cedu-ink mb-1">Tu curso se genera en tiempo real</h3>
                      <p className="text-sm text-cedu-ink-muted leading-relaxed">
                        Este no es un curso genérico — se adapta a tu puesto, tu industria y tus objetivos. Cada persona recibe un curso diferente.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-black/[0.06]">
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                      <BookOpen size={24} className="text-cedu-orange" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-cedu-ink mb-1">Contenido completo y personalizado</h3>
                      <p className="text-sm text-cedu-ink-muted leading-relaxed">
                        Lecturas extensas, mapas mentales, evaluaciones y un chat con IA — todo diseñado para TI.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-black/[0.06]">
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                      <Target size={24} className="text-cedu-green" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-cedu-ink mb-1">Cuéntanos sobre ti</h3>
                      <p className="text-sm text-cedu-ink-muted leading-relaxed">
                        En el siguiente paso te haremos unas preguntas rápidas para que tu Tutor IA pueda personalizar tu experiencia.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  className="bg-cedu-blue hover:bg-cedu-blue/90 text-white px-8"
                  data-testid="button-onboarding-next-1"
                >
                  Siguiente <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-8">
                <h2 className="font-serif text-2xl text-cedu-ink mb-2" data-testid="text-onboarding-personalize">
                  Personaliza tu curso
                </h2>
                <p className="text-cedu-ink-muted text-sm">
                  {profile ? "Puedes ajustar tu perfil para este curso." : "Responde estas preguntas rápidas para personalizar tu experiencia."}
                </p>
              </div>

              <Card className="border-black/[0.06]">
                <CardContent className="p-6 space-y-5">
                  <div>
                    <label className="text-sm font-medium text-cedu-ink mb-1.5 block">
                      ¿Cuál es tu puesto de trabajo?
                    </label>
                    <Input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Ej: Mesero, Supervisor, Analista de RH..."
                      className="bg-white"
                      data-testid="input-job-title"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-cedu-ink mb-1.5 block">
                      ¿En qué industria trabajas?
                    </label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger className="bg-white" data-testid="select-industry">
                        <SelectValue placeholder="Selecciona tu industria" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((ind) => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    {industry === "Otro" && (
                      <Input
                        value={customIndustry}
                        onChange={(e) => setCustomIndustry(e.target.value)}
                        placeholder="Escribe tu industria..."
                        className="bg-white mt-2"
                        data-testid="input-custom-industry"
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-cedu-ink mb-1.5 block">
                      ¿Cuántas personas hay en tu organización?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COMPANY_SIZES.map((size) => (
                        <button
                          key={size.value}
                          type="button"
                          onClick={() => setCompanySize(size.value)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            companySize === size.value
                              ? "bg-cedu-blue text-white"
                              : "bg-white border border-black/[0.06] text-cedu-ink-soft hover:border-cedu-blue/30"
                          }`}
                          data-testid={`chip-company-size-${size.value}`}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-cedu-ink mb-1.5 block">
                      ¿Cuál es tu nivel de experiencia?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {EXPERIENCE_LEVELS.map((lvl) => (
                        <button
                          key={lvl.value}
                          type="button"
                          onClick={() => setExperienceLevel(lvl.value)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            experienceLevel === lvl.value
                              ? "bg-cedu-blue text-white"
                              : "bg-white border border-black/[0.06] text-cedu-ink-soft hover:border-cedu-blue/30"
                          }`}
                          data-testid={`chip-experience-${lvl.value}`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-cedu-ink mb-1.5 block">
                      ¿Qué quieres lograr con este curso? <span className="text-cedu-ink-muted font-normal">(opcional)</span>
                    </label>
                    <Textarea
                      value={learningGoal}
                      onChange={(e) => setLearningGoal(e.target.value)}
                      placeholder="Ej: Mejorar mi atención al cliente, cumplir la NOM-035, prepararme para ser supervisor..."
                      className="bg-white resize-none"
                      rows={3}
                      data-testid="input-learning-goal"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  data-testid="button-onboarding-back-2"
                >
                  <ArrowLeft size={16} className="mr-2" /> Atrás
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="bg-cedu-blue hover:bg-cedu-blue/90 text-white px-8"
                  data-testid="button-onboarding-next-2"
                >
                  Siguiente <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-8">
                <h2 className="font-serif text-2xl text-cedu-ink mb-2" data-testid="text-onboarding-ready">
                  Todo listo
                </h2>
                <p className="text-cedu-ink-muted text-sm">
                  Tu Tutor IA va a crear un curso personalizado para ti.
                </p>
              </div>

              <Card className="border-black/[0.06]">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <span className="text-4xl">{course?.icon || "📘"}</span>
                    <h3 className="font-serif text-lg text-cedu-ink mt-3" data-testid="text-confirm-course-title">
                      {course?.title || "Cargando..."}
                    </h3>
                  </div>

                  <div className="bg-cedu-cream rounded-xl p-5 space-y-3">
                    <p className="text-xs font-semibold text-cedu-ink-muted uppercase tracking-wide mb-3">
                      Personalizado para:
                    </p>
                    {jobTitle && (
                      <div className="flex items-center gap-3 text-sm">
                        <User size={16} className="text-cedu-blue shrink-0" />
                        <span className="text-cedu-ink">{jobTitle} en {finalIndustry || "tu industria"}</span>
                      </div>
                    )}
                    {companySize && (
                      <div className="flex items-center gap-3 text-sm">
                        <Building2 size={16} className="text-cedu-orange shrink-0" />
                        <span className="text-cedu-ink">Organización de {companySize} personas</span>
                      </div>
                    )}
                    {experienceLevel && (
                      <div className="flex items-center gap-3 text-sm">
                        <BarChart3 size={16} className="text-cedu-green shrink-0" />
                        <span className="text-cedu-ink">Nivel: {expLabel}</span>
                      </div>
                    )}
                    {learningGoal && (
                      <div className="flex items-center gap-3 text-sm">
                        <Target size={16} className="text-cedu-violet shrink-0" />
                        <span className="text-cedu-ink">{learningGoal}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-cedu-ink-muted text-center mt-5">
                    El contenido se genera en tiempo real y puede tomar unos segundos.
                  </p>
                </CardContent>
              </Card>

              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  data-testid="button-onboarding-back-3"
                >
                  <ArrowLeft size={16} className="mr-2" /> Atrás
                </Button>
                <Button
                  onClick={() => saveProfileMutation.mutate()}
                  disabled={saveProfileMutation.isPending}
                  className="bg-cedu-blue hover:bg-cedu-blue/90 text-white px-8"
                  data-testid="button-start-course"
                >
                  {saveProfileMutation.isPending ? (
                    <>
                      <Sparkles size={16} className="mr-2 animate-spin" /> Preparando...
                    </>
                  ) : (
                    <>
                      <Rocket size={16} className="mr-2" /> Empezar mi curso personalizado
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
