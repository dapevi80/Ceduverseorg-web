import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { extractServerMessage } from "@/lib/server-message";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronUp, ChevronDown, Plus, Trash2, Loader2 } from "lucide-react";
import type { EditorModule } from "@/pages/instructor-curso-editor";

type Props = { cursoId: string; modules: EditorModule[] };

export function ModulosEditor({ cursoId, modules }: Props) {
  const { toast } = useToast();
  const [abierto, setAbierto] = useState<string | null>(null);
  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: [`/api/instructor/my-courses/${cursoId}`] });

  const fallo = (titulo: string) => (err: unknown) =>
    toast({ title: titulo, description: extractServerMessage(err), variant: "destructive" });

  const crear = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/instructor/my-courses/${cursoId}/modules`, {
        title: `Módulo ${modules.length + 1}`,
      });
      return res.json();
    },
    onSuccess: (m: EditorModule) => { invalidar(); setAbierto(m.id); },
    onError: fallo("No se pudo crear el módulo"),
  });

  const guardar = useMutation({
    mutationFn: async (m: EditorModule) => {
      // youtubeUrls: el servidor normaliza cada enlace a su ID y rechaza lo que no
      // sea YouTube. Se mandan los IDs que ya tenemos, que también son entrada válida.
      const res = await apiRequest("PATCH", `/api/instructor/my-courses/${cursoId}/modules/${m.id}`, {
        title: m.title,
        description: m.description,
        durationMin: m.durationMin,
        contentHtml: m.contentHtml ?? "",
        youtubeUrls: m.youtubeIds,
      });
      return res.json();
    },
    onSuccess: () => { invalidar(); toast({ title: "Módulo guardado" }); },
    onError: fallo("No se pudo guardar el módulo"),
  });

  const borrar = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/instructor/my-courses/${cursoId}/modules/${id}`);
      return res.json();
    },
    onSuccess: () => { invalidar(); toast({ title: "Módulo eliminado" }); },
    onError: fallo("No se pudo eliminar el módulo"),
  });

  const reordenar = useMutation({
    mutationFn: async (moduleIds: string[]) => {
      const res = await apiRequest("PATCH", `/api/instructor/my-courses/${cursoId}/modules/reorder`, { moduleIds });
      return res.json();
    },
    onSuccess: () => invalidar(),
    onError: fallo("No se pudo reordenar"),
  });

  const mover = (i: number, delta: number) => {
    const destino = i + delta;
    if (destino < 0 || destino >= modules.length) return;
    const ids = modules.map((m) => m.id);
    [ids[i], ids[destino]] = [ids[destino], ids[i]];
    reordenar.mutate(ids);
  };

  if (modules.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">Este curso todavía no tiene módulos.</p>
          <Button onClick={() => crear.mutate()} disabled={crear.isPending} data-testid="button-agregar-modulo">
            <Plus className="mr-1 h-4 w-4" /> Agregar módulo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map((m, i) => (
        <ModuloFila
          key={m.id}
          modulo={m}
          abierto={abierto === m.id}
          onAbrir={() => setAbierto(abierto === m.id ? null : m.id)}
          onSubir={() => mover(i, -1)}
          onBajar={() => mover(i, 1)}
          primero={i === 0}
          ultimo={i === modules.length - 1}
          onGuardar={(cambiado) => guardar.mutate(cambiado)}
          onBorrar={() => borrar.mutate(m.id)}
          guardando={guardar.isPending}
        />
      ))}
      <Button variant="outline" onClick={() => crear.mutate()} disabled={crear.isPending} data-testid="button-agregar-modulo">
        <Plus className="mr-1 h-4 w-4" /> Agregar módulo
      </Button>
    </div>
  );
}

function ModuloFila({
  modulo, abierto, onAbrir, onSubir, onBajar, primero, ultimo, onGuardar, onBorrar, guardando,
}: {
  modulo: EditorModule; abierto: boolean; onAbrir: () => void;
  onSubir: () => void; onBajar: () => void; primero: boolean; ultimo: boolean;
  onGuardar: (m: EditorModule) => void; onBorrar: () => void; guardando: boolean;
}) {
  // key={modulo.id} en el padre remonta esta fila cuando cambia el módulo, así que
  // el borrador arranca siempre del dato recién traído del servidor.
  const [borrador, setBorrador] = useState<EditorModule>(modulo);
  const [videos, setVideos] = useState<string>(modulo.youtubeIds.join("\n"));

  return (
    <Card data-testid={`modulo-${modulo.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <span className="w-6 text-sm text-muted-foreground">{modulo.order}</span>
          <button className="flex-1 text-left font-medium" onClick={onAbrir} data-testid={`button-abrir-modulo-${modulo.id}`}>
            {borrador.title || "(sin título)"}
          </button>
          <Button variant="ghost" size="icon" onClick={onSubir} disabled={primero} data-testid={`button-subir-${modulo.id}`}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onBajar} disabled={ultimo} data-testid={`button-bajar-${modulo.id}`}>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onBorrar} data-testid={`button-borrar-modulo-${modulo.id}`}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        {abierto && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <div>
              <Label htmlFor={`t-${modulo.id}`}>Título</Label>
              <Input
                id={`t-${modulo.id}`}
                value={borrador.title}
                onChange={(e) => setBorrador({ ...borrador, title: e.target.value })}
                data-testid={`input-titulo-${modulo.id}`}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor={`d-${modulo.id}`}>Descripción</Label>
                <Input
                  id={`d-${modulo.id}`}
                  value={borrador.description ?? ""}
                  onChange={(e) => setBorrador({ ...borrador, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`m-${modulo.id}`}>Duración (min)</Label>
                <Input
                  id={`m-${modulo.id}`}
                  type="number"
                  min={0}
                  value={borrador.durationMin ?? ""}
                  onChange={(e) => setBorrador({
                    ...borrador,
                    durationMin: e.target.value === "" ? null : Number(e.target.value),
                  })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`c-${modulo.id}`}>Texto del módulo</Label>
              <Textarea
                id={`c-${modulo.id}`}
                rows={10}
                value={borrador.contentHtml ?? ""}
                onChange={(e) => setBorrador({ ...borrador, contentHtml: e.target.value })}
                data-testid={`input-contenido-${modulo.id}`}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Para citar una fuente escribe <code>[[ref:id-de-la-referencia]]</code>. El id se copia
                desde la pestaña Bibliografía.
              </p>
            </div>
            <div>
              <Label htmlFor={`v-${modulo.id}`}>Videos de YouTube (uno por línea)</Label>
              <Textarea
                id={`v-${modulo.id}`}
                rows={3}
                value={videos}
                onChange={(e) => setVideos(e.target.value)}
                placeholder="https://youtu.be/..."
                data-testid={`input-videos-${modulo.id}`}
              />
            </div>
            <Button
              onClick={() => onGuardar({
                ...borrador,
                youtubeIds: videos.split("\n").map((v) => v.trim()).filter(Boolean),
              })}
              disabled={guardando}
              data-testid={`button-guardar-modulo-${modulo.id}`}
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar módulo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
