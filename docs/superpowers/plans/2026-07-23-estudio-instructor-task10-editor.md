# Task 10 desglosada — Editor del curso (cliente)

Addendum del plan `2026-07-22-estudio-instructor-edicion.md`. David pidió partir la Task 10 en tres
tareas con JSX real antes de ejecutarla, porque "crear el editor completo" era una sola caja negra.

Las tres se ejecutan en orden: **10a** deja la página navegable y guardando la ficha, **10b** los
módulos, **10c** la bibliografía y la vista previa. Cada una compila y se puede probar sola.

**Hecho medido antes de escribir esto:** `extractServerMessage` existe hoy **sólo** como función
local dentro de `client/src/pages/dashboard.tsx:1507`, sin exportar. La 10a la saca a un archivo
propio y deja `dashboard.tsx` importándola, para no tener dos copias divergentes.

Componentes disponibles (verificado en `client/src/components/ui/`): button, card, input, label,
textarea, checkbox, table, tabs, badge, separator, alert-dialog, dialog, select, switch, skeleton.

---

## Task 10a: Andamio del editor — ruta, botón "Editar", ficha del curso

**Files:**
- Create: `client/src/lib/server-message.ts`
- Modify: `client/src/pages/dashboard.tsx` (quitar la copia local, importar la compartida)
- Create: `client/src/pages/instructor-curso-editor.tsx`
- Modify: `client/src/App.tsx`
- Modify: `client/src/pages/instructor-dashboard.tsx` (botón "Editar" en `MyCreatedCoursesTab`)

**Interfaces:**
- Consumes: `GET /api/instructor/my-courses/:id` (ahora devuelve `{...course, modules, references}`)
- Produces: la página `/instructor/curso/:id` con la ficha del curso editable

- [ ] **Step 1: Sacar `extractServerMessage` a un archivo compartido**

Crear `client/src/lib/server-message.ts`:

```ts
// El servidor responde { message } en sus errores; apiRequest lo envuelve como
// "<status>: <body>". Sin esto el usuario ve "400" en vez de la razón real, que
// es justo lo que los endpoints del estudio se esfuerzan en explicar.
export function extractServerMessage(err: unknown): string {
  if (err instanceof Error) {
    const raw = err.message;
    const idx = raw.indexOf(": ");
    const body = idx >= 0 ? raw.slice(idx + 2) : raw;
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed.message === "string") return parsed.message;
    } catch {
      // body no era JSON — usamos el mensaje crudo abajo
    }
    return raw;
  }
  return "Ocurrió un error inesperado";
}
```

En `client/src/pages/dashboard.tsx`: borrar la función local (líneas 1507-1521) y agregar arriba
`import { extractServerMessage } from "@/lib/server-message";`.

- [ ] **Step 2: La página del editor con la ficha del curso**

Crear `client/src/pages/instructor-curso-editor.tsx`:

```tsx
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
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

        {/* Task 10b llena "modulos"; Task 10c llena "bibliografia" y "preview". */}
        <TabsContent value="modulos" className="mt-4" />
        <TabsContent value="bibliografia" className="mt-4" />
        <TabsContent value="preview" className="mt-4" />
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 3: Registrar la ruta**

En `client/src/App.tsx`, con su import arriba
(`import InstructorCursoEditor from "@/pages/instructor-curso-editor";`), agregar **antes** de
`<Route path="/instructor" component={InstructorDashboard} />` (línea 93 — wouter toma la primera
coincidencia; `/instructor/acreditacion` de la línea 92 ya sigue esa regla):

```tsx
<Route path="/instructor/curso/:id" component={InstructorCursoEditor} />
```

- [ ] **Step 4: Botón "Editar" en el listado**

En `MyCreatedCoursesTab` (`client/src/pages/instructor-dashboard.tsx`, la tarjeta de cada curso),
con `const [, navigate] = useLocation();` en el componente:

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => navigate(`/instructor/curso/${curso.id}`)}
  data-testid={`button-editar-curso-${curso.id}`}
>
  <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
</Button>
```

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add client/src/lib/server-message.ts client/src/pages/dashboard.tsx client/src/pages/instructor-curso-editor.tsx client/src/App.tsx client/src/pages/instructor-dashboard.tsx
git commit -m "feat(estudio): editor del curso con ficha, ruta y boton editar"
```

---

## Task 10b: Zona de módulos — alta, edición, orden, videos y frases

**Files:**
- Create: `client/src/components/instructor/modulos-editor.tsx`
- Modify: `client/src/pages/instructor-curso-editor.tsx` (montarlo en la pestaña "modulos")

**Interfaces:**
- Consumes: `GET/POST /modules`, `PATCH/DELETE /modules/:moduleId`, `PATCH /modules/reorder`,
  y las rutas de `/quotes`
- Produces: `<ModulosEditor cursoId modules />`

- [ ] **Step 1: El componente**

Crear `client/src/components/instructor/modulos-editor.tsx`:

```tsx
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
    onSuccess: invalidar,
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
            <div className="grid grid-cols-2 gap-3">
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
```

- [ ] **Step 2: Montarlo en la pestaña**

En `instructor-curso-editor.tsx`, importar `ModulosEditor` y reemplazar la pestaña vacía:

```tsx
<TabsContent value="modulos" className="mt-4">
  <ModulosEditor cursoId={curso.id} modules={curso.modules} />
</TabsContent>
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 4: Commit**

```bash
git add client/src/components/instructor/modulos-editor.tsx client/src/pages/instructor-curso-editor.tsx
git commit -m "feat(estudio): zona de modulos del editor con orden y videos"
```

---

## Task 10c: Bibliografía y vista previa

**Files:**
- Create: `client/src/components/instructor/bibliografia-editor.tsx`
- Create: `client/src/components/instructor/vista-previa.tsx`
- Modify: `client/src/pages/instructor-curso-editor.tsx`

- [ ] **Step 1: Bibliografía**

Crear `client/src/components/instructor/bibliografia-editor.tsx`:

```tsx
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
    onSuccess: invalidar,
    onError: (err) => toast({ title: "No se pudo actualizar", description: extractServerMessage(err), variant: "destructive" }),
  });

  const borrar = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/instructor/my-courses/${cursoId}/references/${id}`);
      return res.json();
    },
    onSuccess: invalidar,
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
```

- [ ] **Step 2: Vista previa**

Crear `client/src/components/instructor/vista-previa.tsx`:

```tsx
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
```

- [ ] **Step 3: Montarlas**

```tsx
<TabsContent value="bibliografia" className="mt-4">
  <BibliografiaEditor cursoId={curso.id} references={curso.references} />
</TabsContent>
<TabsContent value="preview" className="mt-4">
  <VistaPrevia modules={curso.modules} references={curso.references} />
</TabsContent>
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 5: Commit**

```bash
git add client/src/components/instructor/bibliografia-editor.tsx client/src/components/instructor/vista-previa.tsx client/src/pages/instructor-curso-editor.tsx
git commit -m "feat(estudio): bibliografia verificable y vista previa con citas"
```

---

## Decisión que queda para David

La marca de cita se copia con un botón (`[[ref:uuid]]`) y se pega a mano en el texto. Es lo más
simple que funciona y no depende de un editor enriquecido. La alternativa —un botón "insertar cita"
que la meta en la posición del cursor— pide un editor real (TipTap o similar), que hoy no está en
`package.json` y sería una decisión de alcance aparte.
