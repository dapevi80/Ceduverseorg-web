import { useState, useEffect, useMemo } from "react";
import DOMPurify from "dompurify";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForceLightMode } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  ChevronRight,
  Mail,
  Loader2,
  Share2,
  Copy,
  ExternalLink,
  Newspaper,
  Sparkles,
  GraduationCap,
  Target,
  BookOpen,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { SiLinkedin, SiX, SiWhatsapp } from "react-icons/si";

const CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  stps: { label: "STPS y NOMs", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  fiscal: { label: "Beneficios Fiscales", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  ia: { label: "IA y Capacitación", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  cursos: { label: "Cursos Gratuitos", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  casos: { label: "Casos de Éxito", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
};

const CATEGORY_CTA: Record<string, { title: string; desc: string; href: string; btn: string }> = {
  stps: { title: "Cumple con la STPS sin multas", desc: "Nuestros cursos cubren todas las NOMs principales. Capacita a tu equipo hoy.", href: "/conferencias", btn: "Ver cursos STPS" },
  fiscal: { title: "Deduce el 100% de capacitación", desc: "Todos nuestros servicios son deducibles con factura CFDI.", href: "/empresas", btn: "Conoce los beneficios" },
  ia: { title: "Prueba Tutor IA gratis", desc: "49 cursos generados por IA, personalizados para tu industria.", href: "/tutor-ia", btn: "Explorar Tutor IA" },
  cursos: { title: "Catálogo de cursos gratuitos", desc: "Conferencias STPS con diploma digital y constancia DC-3.", href: "/conferencias", btn: "Explorar catálogo" },
  casos: { title: "Agenda una demo personalizada", desc: "Conoce cómo Ceduverse puede transformar la capacitación de tu empresa.", href: "/empresas", btn: "Solicitar demo" },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

function readingTime(text: string | null) {
  if (!text) return "3 min";
  const words = text.split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

function NewsletterSideBox() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      return data;
    },
    onSuccess: (data) => { toast({ title: data.message }); setEmail(""); },
    onError: (err: any) => { toast({ title: err.message, variant: "destructive" }); },
  });

  return (
    <Card className="border-cedu-blue/20 bg-gradient-to-br from-cedu-blue/5 to-cedu-blue/10">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Mail size={16} className="text-cedu-blue" />
          <h4 className="font-serif text-sm text-cedu-ink">Newsletter</h4>
        </div>
        <p className="text-[11px] text-cedu-ink-muted mb-3">Recibe artículos semanales sobre capacitación STPS y beneficios fiscales.</p>
        <div className="flex gap-1.5">
          <Input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 text-xs rounded-xl flex-1" data-testid="input-sidebar-newsletter" />
          <Button size="sm" onClick={() => subscribeMutation.mutate()} disabled={!email || subscribeMutation.isPending} className="h-8 rounded-xl bg-cedu-blue text-white text-xs px-3" data-testid="button-sidebar-subscribe">
            {subscribeMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : "OK"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BlogPostPage() {
  useForceLightMode();
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const { data: post, isLoading } = useQuery<any>({
    queryKey: ["/api/blog/posts", slug],
    queryFn: async () => {
      const res = await fetch(`/api/blog/posts/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: related } = useQuery<any[]>({
    queryKey: ["/api/blog/related", slug],
    queryFn: async () => {
      const res = await fetch(`/api/blog/related/${slug}`);
      return res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} | Blog Ceduverse`;
    const setMeta = (name: string, content: string, prop?: string) => {
      let el = document.querySelector(prop ? `meta[property="${prop}"]` : `meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", prop) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", post.excerpt || "");
    setMeta("", post.title, "og:title");
    setMeta("", post.excerpt || "", "og:description");
    setMeta("", "article", "og:type");
    setMeta("", `https://ceduverse.org/blog/${post.slug}`, "og:url");
    if (post.featuredImageUrl) setMeta("", post.featuredImageUrl, "og:image");
    setMeta("twitter:card", "summary_large_image");

    let ldScript = document.querySelector('script[type="application/ld+json"][data-blog]');
    if (!ldScript) { ldScript = document.createElement("script"); ldScript.setAttribute("type", "application/ld+json"); ldScript.setAttribute("data-blog", "true"); document.head.appendChild(ldScript); }
    ldScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt,
      author: { "@type": "Organization", name: "Ceduverse" },
      publisher: { "@type": "Organization", name: "Ceduverse" },
    });

    return () => { document.title = "Ceduverse"; };
  }, [post]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copiado" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/[0.06] h-14" />
        <div className="pt-20 max-w-[900px] mx-auto px-6">
          <Skeleton className="h-8 w-96 mb-4" />
          <Skeleton className="h-6 w-64 mb-8" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={48} className="mx-auto text-cedu-ink-muted/40 mb-4" />
          <h2 className="font-serif text-xl text-cedu-ink mb-2">Artículo no encontrado</h2>
          <Link href="/blog"><Button variant="outline" className="rounded-xl" data-testid="button-back-blog">Volver al blog</Button></Link>
        </div>
      </div>
    );
  }

  const cat = CATEGORIES[post.category] || CATEGORIES.stps;
  const cta = CATEGORY_CTA[post.category] || CATEGORY_CTA.stps;
  const sectors = Array.isArray(post.targetSectors) ? post.targetSectors : [];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/[0.06]" data-testid="blog-post-navbar">
        <div className="max-w-[1160px] mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 bg-cedu-blue rounded-[10px] flex items-center justify-center text-white font-serif text-lg">C</div>
            <div className="font-serif text-xl text-cedu-ink tracking-tight">
              Cedu<em className="text-cedu-blue not-italic italic">verse</em>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/blog" className="text-sm font-semibold text-cedu-blue no-underline">Blog</Link>
            <Link href="/auth"><Button size="sm" className="rounded-xl bg-cedu-blue hover:bg-cedu-blue/90 text-white text-xs h-8 px-4">Iniciar sesión</Button></Link>
          </div>
        </div>
      </nav>

      <div className="pt-20 max-w-[1060px] mx-auto px-6 pb-16">
        <div className="flex items-center gap-2 text-xs text-cedu-ink-muted mb-6" data-testid="blog-breadcrumb">
          <Link href="/blog" className="hover:text-cedu-blue no-underline">Blog</Link>
          <ChevronRight size={12} />
          <Link href={`/blog/categoria/${post.category}`} className="hover:text-cedu-blue no-underline">{cat.label}</Link>
          <ChevronRight size={12} />
          <span className="text-cedu-ink truncate max-w-[200px]">{post.title}</span>
        </div>

        <div className="flex gap-10">
          <article className="flex-1 min-w-0">
            <Badge variant="outline" className={`text-xs ${cat.color} ${cat.bg} border mb-3`}>{cat.label}</Badge>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-[36px] text-[#0f172a] leading-tight mb-4" data-testid="blog-post-title">{post.title}</h1>

            <div className="flex items-center gap-4 text-xs text-[#334155] mb-4 flex-wrap">
              <span className="flex items-center gap-1"><Calendar size={13} /> {formatDate(post.publishedAt)}</span>
              <span className="flex items-center gap-1"><User size={13} /> {post.authorName || "Ceduverse"}</span>
              <span className="flex items-center gap-1"><Clock size={13} /> {readingTime(post.contentText)} lectura</span>
            </div>

            {sectors.length > 0 && (
              <div className="flex items-center gap-1.5 mb-6 flex-wrap">
                <Target size={13} className="text-cedu-ink-muted" />
                {sectors.map((s: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[10px] h-5">{s}</Badge>
                ))}
              </div>
            )}

            {post.featuredImageUrl && (
              <div className="rounded-xl overflow-hidden mb-8 border border-black/[0.06]">
                <img src={post.featuredImageUrl} alt={post.title} className="w-full aspect-[2/1] object-cover" />
              </div>
            )}

            <div
              className="blog-content prose prose-slate max-w-[720px]"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.contentHtml) }}
              data-testid="blog-post-content"
            />

            <div className="border-t border-black/[0.06] mt-10 pt-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-semibold text-cedu-ink flex items-center gap-1"><Share2 size={14} /> Compartir:</span>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#0077b5]/10 flex items-center justify-center hover:bg-[#0077b5]/20 transition-colors"
                  data-testid="share-linkedin"
                >
                  <SiLinkedin size={14} className="text-[#0077b5]" />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                  data-testid="share-twitter"
                >
                  <SiX size={14} />
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(post.title + " " + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#25d366]/10 flex items-center justify-center hover:bg-[#25d366]/20 transition-colors"
                  data-testid="share-whatsapp"
                >
                  <SiWhatsapp size={14} className="text-[#25d366]" />
                </a>
                <button
                  onClick={copyLink}
                  className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer border-none"
                  data-testid="share-copy"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {related && related.length > 0 && (
              <div className="mt-10">
                <h3 className="font-serif text-xl text-cedu-ink mb-4">Artículos relacionados</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {related.map((r: any) => {
                    const rc = CATEGORIES[r.category] || CATEGORIES.stps;
                    return (
                      <Link key={r.id} href={`/blog/${r.slug}`} className="no-underline group" data-testid={`related-${r.slug}`}>
                        <Card className="border-black/[0.06] hover:shadow-md transition-shadow h-full">
                          <CardContent className="p-4">
                            <Badge variant="outline" className={`text-[10px] ${rc.color} ${rc.bg} border mb-2`}>{rc.label}</Badge>
                            <h4 className="text-sm font-semibold text-cedu-ink line-clamp-2 group-hover:text-cedu-blue transition-colors">{r.title}</h4>
                            <p className="text-[11px] text-cedu-ink-muted mt-1">{formatDate(r.publishedAt)}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </article>

          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-5 sticky top-20 self-start">
            <Card className="border-black/[0.06] bg-gradient-to-br from-cedu-orange/5 to-cedu-orange/10">
              <CardContent className="p-5">
                <Sparkles size={18} className="text-cedu-orange mb-2" />
                <h4 className="font-serif text-sm text-cedu-ink mb-1">{cta.title}</h4>
                <p className="text-[11px] text-cedu-ink-muted mb-3">{cta.desc}</p>
                <Link href={cta.href}>
                  <Button size="sm" className="w-full rounded-xl bg-cedu-orange hover:bg-cedu-orange/90 text-white text-xs h-8" data-testid="blog-post-cta">
                    {cta.btn} <ExternalLink size={12} className="ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <NewsletterSideBox />
          </aside>
        </div>
      </div>

      <footer className="border-t border-black/[0.06] bg-white/80 py-8">
        <div className="max-w-[1160px] mx-auto px-6 text-center">
          <p className="text-xs text-cedu-ink-muted">&copy; {new Date().getFullYear()} Ceduverse. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
