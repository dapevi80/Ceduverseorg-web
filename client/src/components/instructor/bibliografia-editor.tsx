import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { extractServerMessage } from "@/lib/server-message";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Copy } from "lucide-react";
import type { EditorReference } from "@/pages/instructor-curso-editor";

type Props = { cursoId: string; references: EditorReference[] };

export function BibliografiaEditor({ cursoId, references }: Props) {
  const { toast } = useToast();
  const [nueva, setNueva] = useState({ authors: "", year: "", title: "", source: "", url: "" });
  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: [`/api/instructor/my-courses/${cursoId}`] });

  const agregar = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/instructor/my-courses/${cursoId}/references`, {
        authors: nueva.authors,
        year: nueva.year === "" ? null : Number(nueva.year),
        title: nueva.title,
        source: nueva.source || null,
        url: nueva.url || null,
        // Nace SIN verificar a propósito: verificar es un acto del instructor.
        verifiedByInstructor: false,
      });
      return res.json();
    },
    onSuccess: () => {
      setNueva({ authors: "", year: "", title: "", source: "", url: "" });
      invalidar();
    },
    onError: (err) => toast({ title: "No se pudo agregar", description: extractServerMessage(err), variant: "destructive" }),
  });

  const verificar = useMutation({
    mutationFn: async ({ id, valor }: { id: string; valor: boolean }) => {
      const res = await apiRequest("PATCH", `/api/instructor/my-courses/${cursoId}/references/${id}`, {
        verifiedByInstructor: valor,
      });
      return res.json();
    },
    onSuccess: () => invalidar(),
    onError: (err) => toast({ title: "No se pudo actualizar", description: extractServerMessage(err), variant: "destructive" }),
  });

  const borrar = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/instructor/my-courses/${cursoId}/references/${id}`);
      return res.json();
    },
    onSuccess: () => invalidar(),
    onError: (err) => {
      // El 409 trae la lista de módulos que la citan: el mensaje del servidor ya
      // lo explica, y se muestra tal cual en vez de un "error al borrar".
      toast({ title: "No se puede borrar", description: extractServerMessage(err), variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Ninguna referencia se agrega sola. Marca <strong>Verificada</strong> sólo si comprobaste la
            fuente: un curso con referencias sin verificar no se puede publicar.
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Autores</TableHead>
                  <TableHead className="w-20">Año</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead className="w-28">Verificada</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {references.map((r) => (
                  <TableRow key={r.id} data-testid={`referencia-${r.id}`}>
                    <TableCell>{r.authors}</TableCell>
                    <TableCell>{r.year ?? "—"}</TableCell>
                    <TableCell>{r.title}</TableCell>
                    <TableCell className="text-muted-foreground">{r.source ?? "—"}</TableCell>
                    <TableCell>
                      <Checkbox
                        checked={r.verifiedByInstructor}
                        onCheckedChange={(v) => verificar.mutate({ id: r.id, valor: v === true })}
                        data-testid={`check-verificada-${r.id}`}
                      />
                    </TableCell>
                    <TableCell className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Copiar la marca de cita"
                        onClick={() => {
                          navigator.clipboard.writeText(`[[ref:${r.id}]]`);
                          toast({ title: "Marca de cita copiada" });
                        }}
                        data-testid={`button-copiar-cita-${r.id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => borrar.mutate(r.id)} data-testid={`button-borrar-ref-${r.id}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {references.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                      Sin bibliografía. Un curso puede publicarse sin ella.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-5">
          <Input placeholder="Autores *" value={nueva.authors}
            onChange={(e) => setNueva({ ...nueva, authors: e.target.value })} data-testid="input-ref-autores" />
          <Input placeholder="Año" type="number" value={nueva.year}
            onChange={(e) => setNueva({ ...nueva, year: e.target.value })} data-testid="input-ref-anio" />
          <Input placeholder="Título *" value={nueva.title}
            onChange={(e) => setNueva({ ...nueva, title: e.target.value })} data-testid="input-ref-titulo" />
          <Input placeholder="Fuente" value={nueva.source}
            onChange={(e) => setNueva({ ...nueva, source: e.target.value })} data-testid="input-ref-fuente" />
          <Input placeholder="URL" value={nueva.url}
            onChange={(e) => setNueva({ ...nueva, url: e.target.value })} data-testid="input-ref-url" />
          <Button
            className="md:col-span-5"
            onClick={() => agregar.mutate()}
            disabled={agregar.isPending || !nueva.authors || !nueva.title}
            data-testid="button-agregar-referencia"
          >
            <Plus className="mr-1 h-4 w-4" /> Agregar referencia
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
