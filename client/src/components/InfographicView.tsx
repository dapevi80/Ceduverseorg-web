import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Users,
  Scale,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  FileText,
  Target,
} from "lucide-react";

type InfographicSection = {
  title: string;
  icon: string;
  keyPoints: string[];
  details: string;
};

const ICON_MAP: Record<string, typeof Shield> = {
  shield: Shield,
  book: BookOpen,
  alert: AlertTriangle,
  check: CheckCircle2,
  chart: BarChart3,
  users: Users,
  law: Scale,
  lightbulb: Lightbulb,
  file: FileText,
  target: Target,
};

const ICON_COLORS = [
  "text-[#1b5adf] bg-[#1b5adf]/10",
  "text-[#f28023] bg-[#f28023]/10",
  "text-[#7c3aed] bg-[#7c3aed]/10",
  "text-[#00b87a] bg-[#00b87a]/10",
  "text-rose-500 bg-rose-50",
  "text-cyan-600 bg-cyan-50",
];

function pickIcon(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("legal") || lower.includes("normativ") || lower.includes("lft") || lower.includes("artículo")) return "law";
  if (lower.includes("seguridad") || lower.includes("protección") || lower.includes("prevención") || lower.includes("riesgo")) return "shield";
  if (lower.includes("aplicación") || lower.includes("práctic") || lower.includes("implementa") || lower.includes("inmediata")) return "target";
  if (lower.includes("resultado") || lower.includes("dato") || lower.includes("estadística") || lower.includes("cifra")) return "chart";
  if (lower.includes("equipo") || lower.includes("colabor") || lower.includes("trabajo") || lower.includes("organiza")) return "users";
  if (lower.includes("introducción") || lower.includes("contexto") || lower.includes("qué es")) return "lightbulb";
  return "book";
}

function parseHtmlToSections(html: string): InfographicSection[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const sections: InfographicSection[] = [];
  let currentSection: InfographicSection | null = null;
  let currentDetails = "";

  const hasH2 = doc.querySelector("h2") !== null;
  const headingTag = hasH2 ? "h2" : "h3";

  const flushSection = () => {
    if (currentSection) {
      currentSection.details = currentDetails.trim();
      if (currentSection.title || currentSection.keyPoints.length > 0) {
        sections.push(currentSection);
      }
    }
  };

  const allNodes = doc.querySelectorAll("h2, h3, p, ul, ol, blockquote");

  const preambleParas: string[] = [];
  let seenHeading = false;

  for (let i = 0; i < allNodes.length; i++) {
    const el = allNodes[i];
    const tag = el.tagName.toLowerCase();

    if (tag === headingTag) {
      if (!seenHeading && preambleParas.length > 0) {
        const introTitle = "Introducción";
        const introSection: InfographicSection = {
          title: introTitle,
          icon: pickIcon(introTitle),
          keyPoints: [],
          details: preambleParas.join(" ").trim(),
        };
        for (const pt of preambleParas) {
          if (introSection.keyPoints.length >= 3) break;
          const sentences = pt.match(/[^.!?]+[.!?]+/g);
          if (sentences) {
            const first = sentences[0].trim();
            if (first.length > 20 && first.length < 130) {
              introSection.keyPoints.push(first);
            }
          }
        }
        if (introSection.keyPoints.length > 0 || introSection.details.length > 50) {
          sections.push(introSection);
        }
      }
      seenHeading = true;

      flushSection();
      const title = el.textContent?.trim() || "";
      currentSection = {
        title,
        icon: pickIcon(title),
        keyPoints: [],
        details: "",
      };
      currentDetails = "";
    } else if (!seenHeading && tag === "p") {
      const text = el.textContent?.trim() || "";
      if (text) preambleParas.push(text);
    } else if (currentSection) {
      if (tag === "ul" || tag === "ol") {
        const items = el.querySelectorAll("li");
        items.forEach((li) => {
          const text = li.textContent?.trim() || "";
          if (text && currentSection!.keyPoints.length < 6) {
            currentSection!.keyPoints.push(text.length > 120 ? text.slice(0, 117) + "…" : text);
          }
        });
      } else if ((tag === "h3" && hasH2) || (tag === "h2" && !hasH2)) {
        const subTitle = el.textContent?.trim() || "";
        if (subTitle) {
          currentDetails += `<strong>${subTitle}</strong> `;
        }
      } else if (tag === "blockquote") {
        const text = el.textContent?.trim() || "";
        if (text && currentSection.keyPoints.length < 6) {
          currentSection.keyPoints.push(text.length > 120 ? text.slice(0, 117) + "…" : text);
        }
      } else if (tag === "p") {
        const text = el.textContent?.trim() || "";
        currentDetails += text + " ";
        if (currentSection.keyPoints.length < 5) {
          const strong = el.querySelector("strong, b");
          if (strong) {
            const st = strong.textContent?.trim() || "";
            if (st.length > 15 && st.length < 130) {
              currentSection.keyPoints.push(st);
            }
          } else if (text.length > 30 && text.length < 130 && currentSection.keyPoints.length < 3) {
            const sentences = text.match(/[^.!?]+[.!?]+/g);
            if (sentences && sentences.length >= 1) {
              const first = sentences[0].trim();
              if (first.length > 20 && first.length < 130) {
                currentSection.keyPoints.push(first);
              }
            }
          }
        }
      }
    }
  }
  flushSection();

  if (sections.length < 2) {
    const allP = doc.querySelectorAll("p");
    if (allP.length >= 4) {
      const paras: string[] = [];
      allP.forEach(p => {
        const t = p.textContent?.trim() || "";
        if (t) paras.push(t);
      });

      const chunkSize = Math.max(3, Math.ceil(paras.length / 5));
      const chunks: string[][] = [];
      for (let i = 0; i < paras.length; i += chunkSize) {
        chunks.push(paras.slice(i, i + chunkSize));
      }

      const autoTitles = ["Introducción", "Desarrollo", "Conceptos clave", "Aplicación práctica", "Cierre"];
      sections.length = 0;
      chunks.forEach((chunk, idx) => {
        const title = autoTitles[idx] || `Sección ${idx + 1}`;
        const sec: InfographicSection = {
          title,
          icon: pickIcon(title),
          keyPoints: [],
          details: chunk.join(" ").trim(),
        };
        for (const para of chunk) {
          if (sec.keyPoints.length >= 3) break;
          const sentences = para.match(/[^.!?]+[.!?]+/g);
          if (sentences) {
            const first = sentences[0].trim();
            if (first.length > 20 && first.length < 130) {
              sec.keyPoints.push(first);
            }
          }
        }
        sections.push(sec);
      });
    }
  }

  return sections;
}

function extractSummary(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const firstP = doc.querySelector("h2 + p") || doc.querySelector("p");
  if (!firstP) return "";
  const text = firstP.textContent?.trim() || "";
  return text.length > 200 ? text.slice(0, 197) + "…" : text;
}

export default function InfographicView({
  contentHtml,
  moduleTitle,
}: {
  contentHtml: string;
  moduleTitle: string;
}) {
  const sections = useMemo(() => parseHtmlToSections(contentHtml), [contentHtml]);
  const summary = useMemo(() => extractSummary(contentHtml), [contentHtml]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (sections.length < 2) {
    return <div data-testid="infographic-empty" />;
  }

  return (
    <div className="space-y-3" data-testid="infographic-view">
      {summary && (
        <div className="rounded-xl bg-[#1b5adf]/[0.04] border border-[#1b5adf]/10 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1b5adf]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb size={16} className="text-[#1b5adf]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1b5adf] mb-1">Resumen del módulo</p>
              <p className="text-sm text-cedu-ink-soft leading-relaxed">{summary}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {sections.map((section, idx) => {
          const iconKey = section.icon;
          const IconComp = ICON_MAP[iconKey] || BookOpen;
          const colorClass = ICON_COLORS[idx % ICON_COLORS.length];
          const isExpanded = expandedIdx === idx;
          const hasDetails = section.details.length > 50;

          return (
            <Card
              key={idx}
              className="border-black/[0.06] overflow-hidden hover:shadow-sm transition-shadow"
              data-testid={`infographic-section-${idx}`}
            >
              <CardContent className="p-4">
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <IconComp size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-cedu-ink">{section.title}</h4>
                      {hasDetails && (
                        <span className="text-cedu-ink-muted ml-2 flex-shrink-0">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>

                    {section.keyPoints.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {section.keyPoints.map((point, pi) => (
                          <div key={pi} className="flex items-start gap-2">
                            <CheckCircle2 size={13} className="text-[#00b87a] mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-cedu-ink-soft leading-relaxed">{point}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && hasDetails && (
                  <div className="mt-3 pl-12 border-t border-black/[0.04] pt-3">
                    <p className="text-xs text-cedu-ink-soft leading-relaxed">
                      {section.details.length > 500 ? section.details.slice(0, 497) + "…" : section.details}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Badge variant="outline" className="text-[10px] text-cedu-ink-muted border-black/10">
          <FileText size={10} className="mr-1" />
          {sections.length} secciones
        </Badge>
        <Badge variant="outline" className="text-[10px] text-cedu-ink-muted border-black/10">
          <Target size={10} className="mr-1" />
          {sections.reduce((acc, s) => acc + s.keyPoints.length, 0)} puntos clave
        </Badge>
      </div>
    </div>
  );
}
