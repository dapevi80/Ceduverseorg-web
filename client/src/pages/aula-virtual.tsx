import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useForceLightMode } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  GraduationCap,
  Clock,
  FileCheck,
  Users,
  ArrowLeft,
  BookOpen,
  Shield,
  Award,
  BadgeCheck,
  Star,
  Info,
  ExternalLink,
} from "lucide-react";

type CourseInfo = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  instructor: string | null;
  instructorId: string | null;
  durationHrs: number | null;
  durationVirtualHrs: number | null;
  areaTematica: string | null;
  categoria: string[] | null;
  nivel: string | null;
  dc3Disponible: boolean | null;
  temas: string[] | null;
  objetivo: string | null;
  publico: string[] | null;
  precioCurso: number | null;
};

function CourseSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-56 rounded-md" />
      ))}
    </div>
  );
}

function InstructorCard({
  name,
  count,
  initials,
  specialties,
  badgeType,
  contactSlug,
}: {
  name: string;
  count: number;
  initials: string;
  specialties: string[];
  badgeType?: "interno" | "acreditado_dc5";
  contactSlug?: string;
}) {
  return (
    <Card className="border-black/[0.06]" data-testid={`card-instructor-${initials}`}>
      <CardContent className="py-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-cedu-blue rounded-2xl flex items-center justify-center text-white font-serif text-xl shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-base text-cedu-ink" data-testid={`text-instructor-name-${initials}`}>
              {name}
            </h3>
            <p className="text-sm text-cedu-ink-muted mt-0.5">
              {count} cursos STPS
            </p>
            {badgeType && (
              <Badge className={`${badgeType === "acreditado_dc5" ? "bg-[#1b5adf]/10 text-[#1b5adf]" : "bg-green-100 text-green-700"} border-0 text-[10px] mt-1`} data-testid={`text-badge-type-${initials}`}>
                {badgeType === "acreditado_dc5" ? "Acreditado STPS (DC-5)" : "Instructor Interno"}
              </Badge>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {specialties.map((s) => (
                <Badge key={s} variant="secondary" className="text-[10px]">
                  {s}
                </Badge>
              ))}
            </div>
            {contactSlug && (
              <Link href={`/contacto/${contactSlug}`}>
                <span className="inline-flex items-center gap-1 text-xs text-cedu-blue hover:underline mt-2 cursor-pointer" data-testid={`link-instructor-contact-${initials}`}>
                  <ExternalLink size={12} />
                  Ver tarjeta de contacto
                </span>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseCard({ course }: { course: CourseInfo }) {
  const nomTags = (course.categoria || []).filter(
    (c) => c.startsWith("NOM-") || c.startsWith("Normatividad")
  );

  return (
    <Link href={`/aula-virtual/${course.slug}`}>
      <Card
        className="border-black/[0.06] hover-elevate active-elevate-2 cursor-pointer h-full"
        data-testid={`card-course-${course.slug}`}
      >
        <CardContent className="py-5 flex flex-col h-full">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="w-10 h-10 bg-cedu-blue-light rounded-xl flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-cedu-blue" />
            </div>
            {course.dc3Disponible && (
              <Badge variant="secondary" className="text-[10px] shrink-0">
                <FileCheck size={10} className="mr-0.5" />
                DC-3
              </Badge>
            )}
          </div>

          <h4
            className="font-semibold text-cedu-ink text-sm leading-snug mb-1.5 line-clamp-2"
            data-testid={`text-course-title-${course.slug}`}
          >
            {course.title}
          </h4>

          <p className="text-xs text-cedu-ink-muted mb-3 line-clamp-2 flex-1">
            {course.description}
          </p>

          <div className="flex flex-wrap gap-1 mb-3">
            {nomTags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
            {course.nivel && (
              <Badge variant="secondary" className="text-[10px]">
                {course.nivel}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1 mb-3">
            <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 no-default-hover-elevate no-default-active-elevate">
              <Award size={10} className="mr-0.5" />
              Diploma Gratis
            </Badge>
            {course.dc3Disponible && (
              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 no-default-hover-elevate no-default-active-elevate">
                <FileCheck size={10} className="mr-0.5" />
                +$499 DC-3
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 no-default-hover-elevate no-default-active-elevate">
              <BadgeCheck size={10} className="mr-0.5" />
              +$1,999 SEP
            </Badge>
          </div>

          <div className="flex items-center justify-between text-[11px] text-cedu-ink-muted pt-2 border-t border-black/[0.04]">
            <span className="flex items-center gap-1 truncate">
              <GraduationCap size={12} />
              <span className="truncate">{course.instructor}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock size={12} />
              {course.durationVirtualHrs || course.durationHrs}h
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AulaVirtual() {
  useForceLightMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: allCourses = [], isLoading } = useQuery<CourseInfo[]>({
    queryKey: ["/api/courses"],
  });

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    allCourses.forEach((c) => {
      (c.categoria || []).forEach((cat) => cats.add(cat));
    });
    return Array.from(cats).sort();
  }, [allCourses]);

  const instructors = useMemo(() => {
    const map = new Map<string, { name: string; count: number; id: string }>();
    allCourses.forEach((c) => {
      if (c.instructor && c.instructorId) {
        const existing = map.get(c.instructorId);
        if (existing) {
          existing.count++;
        } else {
          map.set(c.instructorId, {
            name: c.instructor,
            count: 1,
            id: c.instructorId,
          });
        }
      }
    });
    return Array.from(map.values());
  }, [allCourses]);

  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) => {
      if (
        searchQuery &&
        !course.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(course.description || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(course.categoria || []).some((c) =>
          c.toLowerCase().includes(searchQuery.toLowerCase())
        )
      ) {
        return false;
      }
      if (
        instructorFilter !== "all" &&
        course.instructorId !== instructorFilter
      ) {
        return false;
      }
      if (
        categoryFilter !== "all" &&
        !(course.categoria || []).includes(categoryFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [allCourses, searchQuery, instructorFilter, categoryFilter]);

  return (
    <div className="min-h-screen bg-cedu-cream" data-testid="page-aula-virtual">
      <header className="sticky top-0 z-30 bg-cedu-cream/85 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
              <ArrowLeft size={16} className="mr-1" />
              Dashboard
            </Button>
          </Link>
          <Link href="/">
            <span className="font-serif text-lg text-cedu-ink tracking-tight" data-testid="link-logo">
              Cedu<em className="text-cedu-blue not-italic italic">verse</em>
            </span>
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-cedu-blue py-12 sm:py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-cedu-blue via-cedu-blue-dark to-cedu-blue opacity-90" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
            <Shield size={14} className="text-white/80" />
            <span className="text-white/90 text-xs font-semibold">Capacitación STPS Certificada</span>
          </div>
          <h1
            className="font-serif text-3xl sm:text-4xl text-white mb-3"
            data-testid="text-hero-title"
          >
            Aula de Capacitación Virtual STPS
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Cursos alineados a las Normas Oficiales Mexicanas para el cumplimiento
            normativo de tu centro de trabajo. Diploma digital gratis al aprobar.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-white/90 text-sm">
            <span className="flex items-center gap-1.5" data-testid="stat-courses">
              <BookOpen size={16} />
              {allCourses.length} cursos
            </span>
            <span className="flex items-center gap-1.5" data-testid="stat-instructors">
              <Users size={16} />
              {instructors.length} instructores STPS
            </span>
            <span className="flex items-center gap-1.5" data-testid="stat-dc3">
              <Award size={16} />
              Constancias DC-3
            </span>
          </div>
        </div>
      </section>

      <section className="border-b border-black/[0.06] bg-cedu-cream" data-testid="section-certification-tiers">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-cedu-blue shrink-0" />
            <h2 className="font-serif text-base text-cedu-ink">3 Niveles de Certificación</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-3 p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/20" data-testid="tier-free">
              <Award size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-cedu-ink">Diploma Digital — Gratis</p>
                <p className="text-xs text-cedu-ink-muted mt-0.5">Al aprobar la evaluación obtienes un diploma digital de participación verificable en blockchain. Siempre incluido, sin costo.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950/20" data-testid="tier-dc3">
              <FileCheck size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-cedu-ink">Constancia DC-3 — $499 MXN</p>
                <p className="text-xs text-cedu-ink-muted mt-0.5">Constancia de Competencias Laborales con validez ante la STPS. Emitida por agente capacitador registrado. Opcional.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-md bg-blue-50 dark:bg-blue-950/20" data-testid="tier-sep">
              <BadgeCheck size={18} className="text-cedu-blue shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-cedu-ink">Certificado SEP — $1,999 MXN</p>
                <p className="text-xs text-cedu-ink-muted mt-0.5">Certificado con validez oficial ante la SEP. Respaldo académico institucional. Opcional.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <InstructorCard
            name="Psic. Yuridia Iturriaga"
            count={instructors.find((i) => i.id === "YI")?.count || 10}
            initials="YI"
            specialties={["Desarrollo Humano", "NOM-035", "Salud Mental"]}
            badgeType="interno"
            contactSlug="yuridiaiturriaga"
          />
          <InstructorCard
            name="Lic. Jorge Armando Medina Castillo"
            count={instructors.find((i) => i.id === "MC")?.count || 19}
            initials="MC"
            specialties={["Seguridad Industrial", "NOMs", "Operaciones"]}
            badgeType="interno"
            contactSlug="jorgemedina"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-cedu-ink-muted"
            />
            <Input
              type="search"
              placeholder="Buscar curso, NOM o tema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-courses"
            />
          </div>

          <Select
            value={instructorFilter}
            onValueChange={setInstructorFilter}
          >
            <SelectTrigger className="w-full sm:w-48" data-testid="select-instructor-filter">
              <SelectValue placeholder="Instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los instructores</SelectItem>
              {instructors.map((inst) => (
                <SelectItem key={inst.id} value={inst.id}>
                  {inst.name.split(" ").slice(0, 2).join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-category-filter">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {allCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-cedu-ink-muted" data-testid="text-results-count">
            {filteredCourses.length} curso{filteredCourses.length !== 1 ? "s" : ""} encontrado{filteredCourses.length !== 1 ? "s" : ""}
          </p>
          {(searchQuery || instructorFilter !== "all" || categoryFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setInstructorFilter("all");
                setCategoryFilter("all");
              }}
              data-testid="button-clear-filters"
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {isLoading ? (
          <CourseSkeleton />
        ) : filteredCourses.length === 0 ? (
          <Card className="border-black/[0.06]" data-testid="card-no-results">
            <CardContent className="py-16 text-center">
              <Search size={48} className="mx-auto text-cedu-ink-muted/40 mb-4" />
              <h3 className="font-serif text-lg text-cedu-ink mb-2">
                No se encontraron cursos
              </h3>
              <p className="text-sm text-cedu-ink-muted">
                Intenta con otros términos de búsqueda o ajusta los filtros.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
