import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useForceLightMode } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/use-auth";
import { getAuthToken } from "@/lib/auth-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Award,
  BookOpen,
  Brain,
  Filter,
  User,
} from "lucide-react";

interface StudioCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  durationMinutes: number | null;
  level: string | null;
  tags: string[] | null;
  dc3Available: boolean | null;
  icon: string | null;
  color: string | null;
  source: string | null;
  /** Quien imparte el curso. Va impreso en el cuaderno y, cuando el curso
   *  otorga DC-3, es quien responde por la constancia — por eso se muestra. */
  instructor: string | null;
}

interface StudioResponse {
  courses: StudioCourse[];
  total: number;
}

const CATEGORIES = [
  { label: "Todos", value: "" },
  { label: "Aprende Ceduverse", value: "Onboarding" },
  { label: "Desarrollo Humano", value: "Desarrollo Humano" },
  { label: "Seguridad Industrial", value: "Seguridad Industrial" },
  { label: "Normatividad", value: "Normatividad" },
  { label: "Formación Empresarial", value: "Formación Empresarial" },
  { label: "Productividad", value: "Productividad" },
  { label: "IA y Tecnología", value: "IA y Tecnología" },
];

const LEVEL_LABELS: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

const LEVEL_COLORS: Record<string, string> = {
  basico: "bg-green-100 text-green-700",
  intermedio: "bg-amber-100 text-amber-700",
  avanzado: "bg-red-100 text-red-700",
};

function CourseCard({ course, profileComplete }: { course: StudioCourse; profileComplete: boolean }) {
  // The one-time profile questionnaire (job title + industry) only needs to
  // run once, globally — not on every course. Once it's set, go straight to
  // the course (which has its own "Comenzar curso" enroll gate); only route
  // through /onboarding while the profile is still missing.
  const href = profileComplete ? `/tutor-ia/${course.slug}` : `/tutor-ia/${course.slug}/onboarding`;
  return (
    <Link href={href} className="no-underline">
      <div
        className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden shadow-sm hover:shadow-md hover:border-cedu-blue/20 transition-all cursor-pointer h-full flex flex-col"
        data-testid={`card-studio-course-${course.slug}`}
      >
        <div
          className="w-full h-32 flex items-center justify-center relative"
          style={{ background: `linear-gradient(135deg, ${course.color || '#1b5adf'}15, ${course.color || '#1b5adf'}08)` }}
        >
          <span className="text-5xl">{course.icon || "📘"}</span>
          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
            <span className="bg-cedu-blue-light text-cedu-blue text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Award size={10} /> Certificado SEP
            </span>
            {course.dc3Available ? (
              <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <FileCheck size={10} /> DC3 STPS Disponible
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 opacity-60">
                <FileCheck size={10} /> DC3 Próximamente
              </span>
            )}
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            {course.level && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[course.level] || 'bg-gray-100 text-gray-600'}`}>
                {LEVEL_LABELS[course.level] || course.level}
              </span>
            )}
            {course.subcategory && (
              <span className="text-[10px] text-cedu-ink-muted truncate">
                {course.subcategory}
              </span>
            )}
          </div>
          <h3
            className="font-semibold text-cedu-ink text-sm leading-snug mb-1.5 line-clamp-2"
            data-testid={`text-studio-title-${course.slug}`}
          >
            {course.title}
          </h3>
          <p className="text-xs text-cedu-ink-muted line-clamp-2 mb-3 flex-1">
            {course.description}
          </p>
          {course.instructor && (
            <div className="flex items-center gap-1.5 text-cedu-ink-muted mb-2">
              <User size={12} className="shrink-0" />
              <span className="text-[11px] truncate" data-testid={`text-studio-instructor-${course.slug}`}>
                {course.instructor}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-cedu-ink-muted">
              <Clock size={12} />
              <span className="text-[11px]">{course.durationMinutes || 60} min</span>
            </div>
            <div className="flex items-center gap-1 text-cedu-blue text-xs font-medium">
              Comenzar <ArrowRight size={12} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function OnboardingCard({ course, profileComplete }: { course: StudioCourse; profileComplete: boolean }) {
  const href = profileComplete ? `/tutor-ia/${course.slug}` : `/tutor-ia/${course.slug}/onboarding`;
  return (
    <Link href={href} className="no-underline">
      <div
        className="bg-white rounded-2xl border border-cedu-blue/15 overflow-hidden shadow-sm hover:shadow-md hover:border-cedu-blue/30 transition-all cursor-pointer h-full flex flex-col"
        data-testid={`card-onboarding-${course.slug}`}
      >
        <div
          className="w-full h-24 flex items-center justify-center relative"
          style={{ background: `linear-gradient(135deg, ${course.color || '#1b5adf'}20, ${course.color || '#1b5adf'}08)` }}
        >
          <span className="text-4xl">{course.icon || "🚀"}</span>
          <span className="absolute top-2 right-2 bg-cedu-blue text-white text-[9px] font-bold px-2 py-0.5 rounded-full" data-testid={`badge-onboarding-${course.slug}`}>
            Onboarding
          </span>
        </div>
        <div className="p-3 flex-1 flex flex-col">
          {course.subcategory && (
            <span className="text-[9px] font-semibold text-cedu-violet mb-1">{course.subcategory}</span>
          )}
          <h3
            className="font-semibold text-cedu-ink text-xs leading-snug mb-1 line-clamp-2"
            data-testid={`text-onboarding-title-${course.slug}`}
          >
            {course.title}
          </h3>
          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="flex items-center gap-1 text-cedu-ink-muted">
              <Clock size={10} />
              <span className="text-[10px]">{course.durationMinutes || 30} min</span>
            </div>
            <span className="text-[10px] font-semibold text-green-600">Gratis</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden">
      <Skeleton className="w-full h-32" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export default function StudioPage() {
  useForceLightMode();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  // Global personalization profile (job title + industry). Set once, reused
  // by every course — course cards route to /onboarding only while this is
  // still missing, so a returning student never gets the questionnaire again.
  const { data: studentProfile } = useQuery<{ jobTitle?: string; industry?: string } | null>({
    queryKey: ["/api/me/student-profile"],
    enabled: !!user,
  });
  const profileComplete = !!studentProfile?.jobTitle;

  const { data, isLoading } = useQuery<StudioResponse>({
    queryKey: ["/api/studio/courses", { category, search, page, limit: LIMIT }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(LIMIT));
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/studio/courses?${params.toString()}`, { headers });
      if (!res.ok) throw new Error("Error loading courses");
      return res.json();
    },
  });

  const { data: onboardingData } = useQuery<StudioResponse>({
    queryKey: ["/api/studio/courses", { category: "Onboarding", onboarding: true }],
    queryFn: async () => {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/studio/courses?category=Onboarding&limit=10", { headers });
      if (!res.ok) throw new Error("Error loading onboarding");
      return res.json();
    },
    enabled: !category && !search,
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-cedu-cream">
      <header className="bg-white border-b border-black/[0.06] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-cedu-ink-muted hover:text-cedu-ink transition-colors"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cedu-blue to-cedu-violet rounded-lg flex items-center justify-center">
                <Brain size={16} className="text-white" />
              </div>
              <div>
                <h1 className="font-serif text-lg text-cedu-ink leading-none" data-testid="text-studio-header">
                  Tutor IA
                </h1>
                <p className="text-[10px] text-cedu-ink-muted">Cursos personalizados con IA</p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-cedu-violet border-cedu-violet/30 gap-1">
            <Sparkles size={12} /> {data?.total || 0} cursos
          </Badge>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl text-cedu-ink mb-2" data-testid="text-studio-title">
            Explora el catálogo Tutor IA
          </h2>
          <p className="text-cedu-ink-muted text-sm max-w-2xl">
            {data?.total || 49} cursos con contenido personalizado por inteligencia artificial.
            Cada curso se adapta a tu perfil, puesto e industria.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cedu-ink-muted" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar cursos..."
                className="pl-9 h-10 bg-white"
                data-testid="input-studio-search"
              />
            </div>
            <Button type="submit" variant="outline" className="h-10" data-testid="button-studio-search">
              Buscar
            </Button>
          </form>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === cat.value
                  ? "bg-cedu-blue text-white"
                  : "bg-white text-cedu-ink-soft border border-black/[0.06] hover:bg-cedu-blue-light hover:text-cedu-blue"
              }`}
              data-testid={`button-category-${cat.value || 'all'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {!category && !search && onboardingData && onboardingData.courses.length > 0 && (
          <div className="mb-10" data-testid="section-onboarding">
            <div className="rounded-2xl border border-cedu-blue/20 bg-gradient-to-r from-cedu-blue/5 via-cedu-violet/5 to-cedu-blue/5 p-6 mb-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-gradient-to-br from-cedu-blue to-cedu-violet rounded-xl flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-cedu-ink" data-testid="text-onboarding-title">Aprende Ceduverse</h3>
                  <p className="text-xs text-cedu-ink-muted">Comienza aquí para aprovechar la plataforma al máximo</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {onboardingData.courses.map((course) => (
                <OnboardingCard key={course.id} course={course} profileComplete={profileComplete} />
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : data?.courses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={48} className="mx-auto text-cedu-ink-muted/30 mb-4" />
            <h3 className="font-serif text-lg text-cedu-ink mb-2">Sin resultados</h3>
            <p className="text-sm text-cedu-ink-muted">No se encontraron cursos con los filtros actuales.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => { setCategory(""); setSearch(""); setSearchInput(""); setPage(1); }}
              data-testid="button-clear-filters"
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data?.courses.map((course) => (
                <CourseCard key={course.id} course={course} profileComplete={profileComplete} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8" data-testid="pagination-studio">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="gap-2 px-4 py-2 text-sm font-medium"
                  data-testid="button-prev-page"
                >
                  <ChevronLeft size={18} /> Anterior
                </Button>
                <span className="text-sm text-cedu-ink dark:text-gray-300 font-medium px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-black/[0.06] dark:border-white/[0.08]">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="gap-2 px-4 py-2 text-sm font-medium"
                  data-testid="button-next-page"
                >
                  Siguiente <ChevronRight size={18} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
