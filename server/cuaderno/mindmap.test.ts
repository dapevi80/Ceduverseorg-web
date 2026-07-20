import PDFDocument from "pdfkit";
import { describe, expect, it } from "vitest";
import { mindMapLayout, drawMindMap, layoutMindMapBoxes, hasBoxOverlap, type MindMap } from "./mindmap";
import { MODULE_COLORS } from "./visuals";
import { registerCuadernoFonts } from "./fonts";

function branch(label: string, opts: { color?: string; children?: { label: string; detail?: string }[] } = {}) {
  return {
    label,
    color: opts.color,
    children: opts.children ?? [{ label: `${label} — hijo 1` }, { label: `${label} — hijo 2` }],
  };
}

describe("mindMapLayout — geometría pura", () => {
  it("el nodo central queda centrado en el área dada", () => {
    const m: MindMap = { central: "Curso", branches: [branch("Rama 1"), branch("Rama 2")] };
    const layout = mindMapLayout(m, 500, 300);
    expect(layout.central).toEqual({ x: 250, y: 150, label: "Curso" });
  });

  it("las ramas se reparten sin solaparse", () => {
    const m: MindMap = {
      central: "Curso",
      branches: [branch("Uno"), branch("Dos"), branch("Tres"), branch("Cuatro"), branch("Cinco")],
    };
    const layout = mindMapLayout(m, 520, 320);
    const branchNodes = layout.nodes.filter((n) => n.parent === -1);
    expect(branchNodes).toHaveLength(5);

    for (let i = 0; i < branchNodes.length; i++) {
      for (let j = i + 1; j < branchNodes.length; j++) {
        const dist = Math.hypot(branchNodes[i].x - branchNodes[j].x, branchNodes[i].y - branchNodes[j].y);
        expect(dist).toBeGreaterThan(20);
      }
      // ninguna rama debe caer exactamente sobre el centro
      const distToCentral = Math.hypot(branchNodes[i].x - layout.central.x, branchNodes[i].y - layout.central.y);
      expect(distToCentral).toBeGreaterThan(10);
    }
  });

  it("color ausente cae a MODULE_COLORS por índice de rama (con módulo, no por posición absoluta en nodes)", () => {
    const m: MindMap = {
      central: "Curso",
      branches: [
        branch("Con color", { color: "#123456" }),
        branch("Sin color 1"),
        branch("Sin color 2"),
        branch("Sin color 3"),
        branch("Sin color 4"), // índice 4 -> MODULE_COLORS[4 % 4] = MODULE_COLORS[0]
      ],
    };
    const layout = mindMapLayout(m, 500, 300);
    const branchNodes = layout.nodes.filter((n) => n.parent === -1);

    expect(branchNodes[0].color).toBe("#123456");
    expect(branchNodes[1].color).toBe(MODULE_COLORS[1 % MODULE_COLORS.length]);
    expect(branchNodes[2].color).toBe(MODULE_COLORS[2 % MODULE_COLORS.length]);
    expect(branchNodes[3].color).toBe(MODULE_COLORS[3 % MODULE_COLORS.length]);
    expect(branchNodes[4].color).toBe(MODULE_COLORS[0]);

    // los hijos heredan el color ya resuelto de su rama (no el fallback de MODULE_COLORS directamente)
    const branch1Index = layout.nodes.indexOf(branchNodes[1]);
    const childrenOfBranch1 = layout.nodes.filter((n) => n.parent === branch1Index);
    expect(childrenOfBranch1.length).toBeGreaterThan(0);
    for (const child of childrenOfBranch1) {
      expect(child.color).toBe(branchNodes[1].color);
    }
  });

  it("detail ausente no rompe: el nodo simplemente no trae la propiedad", () => {
    const m: MindMap = {
      central: "Curso",
      branches: [branch("Rama", { children: [{ label: "Hijo sin detalle" }] })],
    };
    expect(() => mindMapLayout(m, 400, 240)).not.toThrow();
    const layout = mindMapLayout(m, 400, 240);
    const child = layout.nodes.find((n) => n.parent !== -1)!;
    expect(child).toBeDefined();
    expect(child.detail).toBeUndefined();
  });

  it("0 ramas -> layout vacío (sólo el central)", () => {
    const m: MindMap = { central: "Curso sin ramas", branches: [] };
    const layout = mindMapLayout(m, 500, 300);
    expect(layout.nodes).toEqual([]);
    expect(layout.central.label).toBe("Curso sin ramas");
  });

  it("mapa grande (6 ramas x 4 hijos) produce coordenadas dentro de los límites w,h", () => {
    const m: MindMap = {
      central: "Curso completo",
      branches: Array.from({ length: 6 }, (_, i) =>
        branch(`Rama ${i + 1}`, {
          children: Array.from({ length: 4 }, (_, j) => ({
            label: `Rama ${i + 1} — hijo ${j + 1}`,
            detail: j % 2 === 0 ? `Detalle ${j + 1}` : undefined,
          })),
        })
      ),
    };
    const w = 520;
    const h = 640;
    const layout = mindMapLayout(m, w, h);

    expect(layout.nodes).toHaveLength(6 * (1 + 4));
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(w);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(h);
    }
    expect(layout.central.x).toBeGreaterThanOrEqual(0);
    expect(layout.central.x).toBeLessThanOrEqual(w);
    expect(layout.central.y).toBeGreaterThanOrEqual(0);
    expect(layout.central.y).toBeLessThanOrEqual(h);
  });
});

describe("drawMindMap — dibujo", () => {
  it("0 ramas -> devuelve false y no dibuja nada", () => {
    const doc = new PDFDocument({ bufferPages: true });
    doc.on("data", () => {});
    const m: MindMap = { central: "Curso sin ramas", branches: [] };

    const ok = drawMindMap(doc, m, 54, 100, 388, 300);

    expect(ok).toBe(false);
    doc.end();
  });

  it("mindMap ausente/inválido -> devuelve false sin lanzar", () => {
    const doc = new PDFDocument({ bufferPages: true });
    doc.on("data", () => {});

    expect(drawMindMap(doc, null as unknown as MindMap, 54, 100, 388, 300)).toBe(false);
    expect(drawMindMap(doc, {} as MindMap, 54, 100, 388, 300)).toBe(false);
    doc.end();
  });

  it("un mapa real con ramas devuelve true y no lanza al cerrar el documento", () => {
    const doc = new PDFDocument({ bufferPages: true });
    doc.on("data", () => {});
    const m: MindMap = {
      central: "Marco legal y normativo aplicable",
      branches: [
        branch("Obligaciones patronales", {
          children: [
            { label: "Registro ante el IMSS", detail: "Alta de trabajadores en los primeros 5 días" },
            { label: "Contrato individual de trabajo" },
          ],
        }),
        branch("Sin color explícito"),
      ],
    };

    let ok = false;
    expect(() => {
      ok = drawMindMap(doc, m, 54, 100, 388, 300);
    }).not.toThrow();
    expect(ok).toBe(true);

    expect(() => doc.end()).not.toThrow();
  });

  it("pase de diseño 2026-07-19: un mapa real de 6 ramas con etiquetas largas no traslapa ninguna caja", () => {
    // Datos representativos de lo que sí produce el Tutor IA: ramas y
    // etiquetas largas, con acentos — exactamente el caso que el dueño
    // reportó "saturado". Se verifica sobre medidas reales de pdfkit (no
    // aproximadas), como pide la verificación del pase de diseño.
    const doc = new PDFDocument({ bufferPages: true });
    doc.on("data", () => {});
    const fonts = registerCuadernoFonts(doc);

    const m: MindMap = {
      central: "Marco legal y normativo aplicable a las relaciones laborales",
      branches: [
        branch("Obligaciones patronales ante el IMSS", {
          children: [
            { label: "Registro ante el IMSS", detail: "Alta de trabajadores en los primeros 5 días" },
            { label: "Contrato individual de trabajo escrito" },
            { label: "Reparto de utilidades (PTU)" },
          ],
        }),
        branch("Derechos y prestaciones del trabajador", {
          children: [
            { label: "Vacaciones y prima vacacional" },
            { label: "Aguinaldo anual proporcional" },
            { label: "Días de descanso obligatorio" },
          ],
        }),
        branch("Seguridad e higiene en el centro de trabajo", {
          children: [
            { label: "Comisión mixta de seguridad e higiene" },
            { label: "Equipo de protección personal (EPP)" },
          ],
        }),
        branch("Terminación de la relación laboral", {
          children: [
            { label: "Rescisión con responsabilidad para el patrón" },
            { label: "Finiquito y liquidación" },
            { label: "Indemnización constitucional" },
          ],
        }),
        branch("Normatividad oficial mexicana (NOM) aplicable", {
          children: [
            { label: "NOM-035-STPS-2018, factores de riesgo psicosocial" },
            { label: "NOM-030-STPS-2009, servicios preventivos de seguridad" },
          ],
        }),
        branch("Autoridades y organismos laborales", {
          children: [
            { label: "Secretaría del Trabajo y Previsión Social" },
            { label: "Tribunales laborales locales" },
            { label: "Procuraduría Federal de la Defensa del Trabajo" },
          ],
        }),
      ],
    };

    // Mismas dimensiones que usa `render.ts` en producción (CW=520, areaH=480).
    const w = 520;
    const h = 480;
    const layout = mindMapLayout(m, w, h);
    const boxLayout = layoutMindMapBoxes(doc, layout, 54, 100, w, h, fonts);

    expect(hasBoxOverlap(boxLayout)).toBe(false);

    let ok = false;
    expect(() => {
      ok = drawMindMap(doc, m, 54, 100, w, h);
    }).not.toThrow();
    expect(ok).toBe(true);
    expect(() => doc.end()).not.toThrow();
  });
});
