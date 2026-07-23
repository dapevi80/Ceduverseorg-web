import { Card, CardContent } from "@/components/ui/card";
import type { EditorModule, EditorReference } from "@/pages/instructor-curso-editor";

const MARCA = /\[\[ref:([0-9a-fA-F-]{36})\]\]/g;

// Sustituye cada marca por la cita corta (Autores, año). Una marca que apunte a
// una referencia inexistente se deja visible como [[ref:…]]: mostrarla vacía
// escondería el error justo cuando el instructor puede corregirlo.
function renderConCitas(html: string, refs: EditorReference[]): string {
  const porId = new Map(refs.map((r) => [r.id, r]));
  return html.replace(MARCA, (marca, id: string) => {
    const r = porId.get(id);
    if (!r) return marca;
    return `(${r.authors}${r.year ? `, ${r.year}` : ""})`;
  });
}

export function VistaPrevia({ modules, references }: { modules: EditorModule[]; references: EditorReference[] }) {
  if (modules.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Sin módulos que mostrar.</p>;
  }
  return (
    <div className="space-y-4">
      {modules.map((m) => (
        <Card key={m.id} data-testid={`preview-modulo-${m.id}`}>
          <CardContent className="p-5">
            <h3 className="mb-1 text-lg font-semibold">{m.order}. {m.title}</h3>
            {m.description && <p className="mb-3 text-sm text-muted-foreground">{m.description}</p>}
            {/* El HTML ya viene sanitizado por el servidor (server/lib/course-html.ts). */}
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: renderConCitas(m.contentHtml ?? "", references) }}
            />
            {m.youtubeIds.map((id) => (
              <iframe
                key={id}
                className="mt-4 aspect-video w-full rounded-md"
                src={`https://www.youtube-nocookie.com/embed/${id}`}
                title={`Video ${id}`}
                allowFullScreen
              />
            ))}
          </CardContent>
        </Card>
      ))}
      {references.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-2 font-semibold">Bibliografía</h3>
            <ul className="space-y-1 text-sm">
              {references.map((r) => (
                <li key={r.id}>
                  {r.authors}{r.year ? ` (${r.year})` : ""}. <em>{r.title}</em>{r.source ? `. ${r.source}` : ""}
                  {!r.verifiedByInstructor && (
                    <span className="ml-2 text-xs text-amber-600">sin verificar</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
