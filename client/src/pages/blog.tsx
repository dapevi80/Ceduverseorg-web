import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForceLightMode } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Loader2,
  Mail,
  Newspaper,
  TrendingUp,
  GraduationCap,
  X,
} from "lucide-react";

const CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  stps: { label: "STPS y NOMs", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  fiscal: { label: "Beneficios Fiscales", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  ia: { label: "IA y Capacitación", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  cursos: { label: "Cursos Gratuitos", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  casos: { label: "Casos de Éxito", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
};

const PLACEHOLDER_COLORS: Record<string, string> = {
  stps: "from-red-400 to-red-600",
  fiscal: "from-green-400 to-green-600",
  ia: "from-purple-400 to-purple-600",
  cursos: "from-blue-400 to-blue-600",
  casos: "from-amber-400 to-amber-600",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

function BlogNavbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-xl border-b border-black/[0.06] shadow-sm" : "bg-white/70 backdrop-blur-md"
      }`}
      data-testid="blog-navbar"
    >
      <div className="max-w-[1160px] mx-auto px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 no-underline" data-testid="blog-nav-logo">
          <div className="w-8 h-8 bg-cedu-blue rounded-[10px] flex items-center justify-center text-white font-serif text-lg">C</div>
          <div className="font-serif text-xl text-cedu-ink tracking-tight">
            Cedu<em className="text-cedu-blue not-italic italic">verse</em>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/blog" className="text-sm font-semibold text-cedu-blue no-underline" data-testid="blog-nav-blog">Blog</Link>
          <Link href="/conferencias" className="text-sm font-semibold text-cedu-ink-muted hover:text-cedu-ink no-underline hidden sm:block" data-testid="blog-nav-cursos">Cursos</Link>
          <Link href="/empresas" className="text-sm font-semibold text-cedu-ink-muted hover:text-cedu-ink no-underline hidden sm:block" data-testid="blog-nav-empresas">Empresas</Link>
          <Link href="/auth">
            <Button size="sm" className="rounded-xl bg-cedu-blue hover:bg-cedu-blue/90 text-white text-xs h-8 px-4" data-testid="blog-nav-login">
              Iniciar sesión
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function NewsletterBox() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("");

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company_name: company || undefined, sector: sector || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: data.message });
      setEmail("");
      setCompany("");
      setSector("");
    },
    onError: (err: any) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  return (
    <Card className="border-cedu-blue/20 bg-gradient-to-br from-cedu-blue/5 to-cedu-blue/10">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Mail size={18} className="text-cedu-blue" />
          <h3 className="font-serif text-base text-cedu-ink" data-testid="newsletter-title">Suscríbete al newsletter</h3>
        </div>
        <p className="text-xs text-cedu-ink-muted mb-3 leading-relaxed">
          Recibe 2 artículos por semana sobre capacitación STPS, beneficios fiscales y cursos gratuitos.
        </p>
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-9 text-sm rounded-xl"
            data-testid="input-newsletter-email"
          />
          {showExtra && (
            <>
              <Input placeholder="Empresa (opcional)" value={company} onChange={(e) => setCompany(e.target.value)} className="h-9 text-sm rounded-xl" data-testid="input-newsletter-company" />
              <Input placeholder="Sector (opcional)" value={sector} onChange={(e) => setSector(e.target.value)} className="h-9 text-sm rounded-xl" data-testid="input-newsletter-sector" />
            </>
          )}
          {!showExtra && (
            <button onClick={() => setShowExtra(true)} className="text-xs text-cedu-blue hover:underline cursor-pointer bg-transparent border-none" data-testid="button-newsletter-more">
              + Agregar empresa y sector
            </button>
          )}
          <Button
            onClick={() => subscribeMutation.mutate()}
            disabled={!email || subscribeMutation.isPending}
            className="w-full h-9 rounded-xl bg-cedu-blue hover:bg-cedu-blue/90 text-white text-sm"
            data-testid="button-newsletter-subscribe"
          >
            {subscribeMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            Suscribirme
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PostCard({ post }: { post: any }) {
  const cat = CATEGORIES[post.category] || CATEGORIES.stps;
  const placeholderGrad = PLACEHOLDER_COLORS[post.category] || "from-gray-400 to-gray-600";

  return (
    <Link href={`/blog/${post.slug}`} className="no-underline group" data-testid={`blog-card-${post.slug}`}>
      <Card className="border-black/[0.06] overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
        {post.featuredImageUrl ? (
          <div className="aspect-[16/9] overflow-hidden">
            <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        ) : (
          <div className={`aspect-[16/9] bg-gradient-to-br ${placeholderGrad} flex items-center justify-center`}>
            <Newspaper size={40} className="text-white/60" />
          </div>
        )}
        <CardContent className="p-4">
          <Badge variant="outline" className={`text-[10px] ${cat.color} ${cat.bg} border mb-2`}>{cat.label}</Badge>
          <h3 className="font-serif text-base text-cedu-ink leading-snug line-clamp-2 mb-1.5 group-hover:text-cedu-blue transition-colors">{post.title}</h3>
          {post.excerpt && <p className="text-xs text-cedu-ink-muted line-clamp-3 mb-3 leading-relaxed">{post.excerpt}</p>}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cedu-ink-muted">{formatDate(post.publishedAt)}</span>
            <span className="text-xs text-cedu-blue font-semibold group-hover:gap-2 flex items-center gap-1 transition-all">
              Leer <ChevronRight size={12} />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function BlogListPage() {
  useForceLightMode();
  const [, setLocation] = useLocation();
  const params = useParams();
  const categoryParam = params?.category || "";
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    setActiveCategory(categoryParam);
    setPage(1);
  }, [categoryParam]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("unsubscribed") === "true") {
      toast({ title: "Te has desuscrito del newsletter", description: "No recibirás más correos." });
      window.history.replaceState({}, "", "/blog");
    }
  }, []);

  const { data, isLoading } = useQuery<{ data: any[]; pagination: { page: number; total: number; totalPages: number } }>({
    queryKey: ["/api/blog/posts", page, activeCategory, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "9");
      if (activeCategory) params.set("category", activeCategory);
      if (search) params.set("search", search);
      const res = await fetch(`/api/blog/posts?${params}`);
      return res.json();
    },
  });

  const { data: categories } = useQuery<{ category: string; label: string; count: number }[]>({
    queryKey: ["/api/blog/categories"],
  });

  const posts = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <BlogNavbar />

      <div className="pt-20 pb-6 px-6 max-w-[1160px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0f172a] mb-2" data-testid="blog-heading">Blog Ceduverse</h1>
          <p className="text-sm text-[#334155]">Capacitación laboral inteligente — STPS, fiscal, IA y más</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6 justify-center">
          <Button
            size="sm"
            variant={!activeCategory ? "default" : "outline"}
            className={`rounded-full text-xs h-8 ${!activeCategory ? "bg-cedu-blue text-white" : ""}`}
            onClick={() => { setActiveCategory(""); setPage(1); setLocation("/blog"); }}
            data-testid="blog-filter-all"
          >
            Todos
          </Button>
          {Object.entries(CATEGORIES).map(([key, val]) => (
            <Button
              key={key}
              size="sm"
              variant={activeCategory === key ? "default" : "outline"}
              className={`rounded-full text-xs h-8 ${activeCategory === key ? "bg-cedu-blue text-white" : ""}`}
              onClick={() => { setActiveCategory(key); setPage(1); setLocation(`/blog/categoria/${key}`); }}
              data-testid={`blog-filter-${key}`}
            >
              {val.label}
            </Button>
          ))}
          <div className="relative ml-auto w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cedu-ink-muted" />
            <Input
              placeholder="Buscar artículos…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-8 text-xs rounded-full pl-9"
              data-testid="input-blog-search"
            />
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen size={40} className="mx-auto text-cedu-ink-muted/40 mb-3" />
                <p className="text-sm text-cedu-ink-muted">No se encontraron artículos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="blog-grid">
                {posts.map((post: any) => <PostCard key={post.id} post={post} />)}
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8" data-testid="blog-pagination">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  data-testid="blog-prev-page"
                >
                  <ArrowLeft size={14} className="mr-1" /> Anterior
                </Button>
                <span className="text-xs text-cedu-ink-muted">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  data-testid="blog-next-page"
                >
                  Siguiente <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            )}
          </div>

          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-5">
            <NewsletterBox />

            <Card className="border-black/[0.06]">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap size={18} className="text-cedu-orange" />
                  <h3 className="font-serif text-base text-cedu-ink">Cursos gratuitos</h3>
                </div>
                <div className="space-y-3">
                  <Link href="/conferencias/nom-035-stps-medina" className="block text-sm text-cedu-ink hover:text-cedu-blue no-underline" data-testid="blog-sidebar-course-1">
                    NOM-035 STPS <ChevronRight size={12} className="inline" />
                  </Link>
                  <Link href="/conferencias/formacion-instructores" className="block text-sm text-cedu-ink hover:text-cedu-blue no-underline" data-testid="blog-sidebar-course-2">
                    Formación de Instructores <ChevronRight size={12} className="inline" />
                  </Link>
                  <Link href="/tutor-ia" className="block text-sm text-cedu-ink hover:text-cedu-blue no-underline" data-testid="blog-sidebar-course-3">
                    49 cursos Tutor IA <ChevronRight size={12} className="inline" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {categories && categories.length > 0 && (
              <Card className="border-black/[0.06]">
                <CardContent className="p-5">
                  <h3 className="font-serif text-base text-cedu-ink mb-3">Categorías</h3>
                  <div className="space-y-2">
                    {categories.map((c) => (
                      <Link
                        key={c.category}
                        href={`/blog/categoria/${c.category}`}
                        className="flex items-center justify-between text-sm text-cedu-ink-muted hover:text-cedu-ink no-underline"
                        data-testid={`blog-sidebar-cat-${c.category}`}
                      >
                        <span>{c.label}</span>
                        <Badge variant="secondary" className="text-[10px] h-5">{c.count}</Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>

      <footer className="border-t border-black/[0.06] bg-white/80 py-8 mt-12">
        <div className="max-w-[1160px] mx-auto px-6 text-center">
          <p className="text-xs text-cedu-ink-muted">
            &copy; {new Date().getFullYear()} Ceduverse. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
