import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { extractServerMessage } from "@/lib/server-message";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Save, AlertTriangle } from "lucide-react";
import { ModulosEditor } from "@/components/instructor/modulos-editor";
import { BibliografiaEditor } from "@/components/instructor/bibliografia-editor";
import { VistaPrevia } from "@/components/instructor/vista-previa";

export type EditorModule = {
  id: string;
  order: number;
  title: string;
  description: string | null;
  durationMin: number | null;
  contentHtml: string | null;
  youtubeIds: string[];
};

export type EditorReference = {
  id: string;
  authors: string;
  year: number | null;
  title: string;
  source: string | null;
  url: string | null;
  verifiedByInstructor: boolean;
};

type CursoConRelaciones = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
  durationHours: number | null;
  status: string;
  modules: EditorModule[];
  references: EditorReference[];
};

const ESTADOS: Record<string, string> = {
  draft: "Borrador",
  review: "En revisión",
  published: "Publicado",
  archived: "Archivado",
};

export default function InstructorCursoEditor() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const cursoId = params.id;

  const { data: curso, isLoading, isError, error } = useQuery<CursoConRelaciones>({
    queryKey: [`/api/instructor/my-courses/${cursoId}`],
  });

  // Ficha del curso: se edita en local y se guarda con el botón, no en cada tecla.
  const [ficha, setFicha] = useState({ title: "", description: "", durationHours: "" });
  const [sucio, setSucio] = useState(false);

  useEffect(() => {
    if (curso && !sucio) {
      setFicha({
        title: curso.title ?? "",
        description: curso.description ?? "",
        durationHours: curso.durationHours != null ? String(curso.durationHours) : "",
      });
    }
  }, [curso, sucio]);

  // Salir con cambios sin guardar pierde trabajo del instructor: se avisa.
  useEffect(() => {
    if (!sucio) return;
    const aviso = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [sucio]);

  const guardarFicha = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/instructor/my-courses/${cursoId}`, {
        title: ficha.title,
        description: ficha.description,
        durationHours: ficha.durationHours === "" ? null : ficha.durationHours,
      });
      return res.json();
    },
    onSuccess: () => {
      setSucio(false);
      queryClient.invalidateQueries({ queryKey: [`/api/instructor/my-courses/${cursoId}`] });
      toast({ title: "Curso guardado" });
    },
    onError: (err) => {
      toast({ title: "No se pudo guardar", description: extractServerMessage(err), variant: "destructive" });
    },
  });

  const publicar = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/instructor/my-courses/${cursoId}`, { status: "published" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/instructor/my-courses/${cursoId}`] });
      toast({ title: "Curso publicado" });
    },
    onError: (err) => {
      // El 409 nombra las referencias sin verificar: se muestra tal cual llega.
      toast({ title: "No se pudo publicar", description: extractServerMessage(err), variant: "destructive" });
    },
  });

  const salir = () => {
    if (sucio && !window.confirm("Tienes cambios sin guardar. ¿Salir de todas formas?")) return;
    navigate("/instructor");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24" data-testid="editor-cargando">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // isError NO es "sin datos": si la carga falló hay que decirlo, no pintar un editor vacío.
  if (isError || !curso) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center" data-testid="editor-error">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" />
        <p className="mb-4 text-sm text-muted-foreground">{extractServerMessage(error)}</p>
        <Button variant="outline" onClick={() => navigate("/instructor")}>Volver a mis cursos</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={salir} data-testid="button-volver-cursos">
            <ArrowLeft className="mr-1 h-4 w-4" /> Mis cursos
          </Button>
          <h1 className="text-xl font-semibold">{curso.title}</h1>
          <Badge variant="secondary">{ESTADOS[curso.status] ?? curso.status}</Badge>
          {sucio && <Badge variant="outline" data-testid="badge-sin-guardar">Sin guardar</Badge>}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => guardarFicha.mutate()}
            disabled={!sucio || guardarFicha.isPending}
            data-testid="button-guardar-ficha"
          >
            {guardarFicha.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar
          </Button>
          <Button
            variant="secondary"
            onClick={() => publicar.mutate()}
            disabled={publicar.isPending || curso.status === "published"}
            data-testid="button-publicar-curso"
          >
            Publicar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ficha">
        <TabsList>
          <TabsTrigger value="ficha" data-testid="tab-ficha">Ficha</TabsTrigger>
          <TabsTrigger value="modulos" data-testid="tab-modulos">Módulos</TabsTrigger>
          <TabsTrigger value="bibliografia" data-testid="tab-bibliografia">Bibliografía</TabsTrigger>
          <TabsTrigger value="preview" data-testid="tab-preview">Vista previa</TabsTrigger>
        </TabsList>

        <TabsContent value="ficha" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Datos del curso</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="curso-title">Título</Label>
                <Input
                  id="curso-title"
                  value={ficha.title}
                  onChange={(e) => { setFicha({ ...ficha, title: e.target.value }); setSucio(true); }}
                  data-testid="input-curso-title"
                />
              </div>
              <div>
                <Label htmlFor="curso-desc">Descripción</Label>
                <Textarea
                  id="curso-desc"
                  rows={4}
                  value={ficha.description}
                  onChange={(e) => { setFicha({ ...ficha, description: e.target.value }); setSucio(true); }}
                  data-testid="input-curso-descripcion"
                />
              </div>
              <div>
                <Label htmlFor="curso-horas">Duración (horas)</Label>
                <Input
                  id="curso-horas"
                  type="number"
                  min={0}
                  value={ficha.durationHours}
                  onChange={(e) => { setFicha({ ...ficha, durationHours: e.target.value }); setSucio(true); }}
                  data-testid="input-curso-horas"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modulos" className="mt-4">
          <ModulosEditor cursoId={curso.id} modules={curso.modules} />
        </TabsContent>

        <TabsContent value="bibliografia" className="mt-4">
          <BibliografiaEditor cursoId={curso.id} references={curso.references} />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <VistaPrevia modules={curso.modules} references={curso.references} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
