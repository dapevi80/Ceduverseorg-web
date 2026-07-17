import { useState } from "react";
import { ESTADOS_POR_ZONA } from "@shared/zonas";

interface EstadoInfo {
  estado: string;
  zona: string;
  empresas: number;
  con_plan: number;
  empleados: number;
}

interface MexicoMapProps {
  estados: EstadoInfo[];
}

const ZONE_COLORS: Record<string, string> = {
  Norte: "#1b5adf",
  Bajío: "#f28023",
  Centro: "#7c3aed",
  "Sur-Sureste": "#00b87a",
  Otra: "#94a3b8",
};

const ZONE_COLORS_LIGHT: Record<string, string> = {
  Norte: "#dbeafe",
  Bajío: "#ffedd5",
  Centro: "#ede9fe",
  "Sur-Sureste": "#d1fae5",
  Otra: "#e2e8f0",
};

// Agrupación estado -> zona tomada de @shared/zonas, la única definición del
// sistema. Aquí vivía una tercera copia escrita a mano (con Querétaro en Bajío,
// San Luis Potosí/Zacatecas/Nayarit en Bajío y Michoacán en Sur-Sureste) que
// contradecía tanto al CRM como a /socios. Solo agrupa: la geometría del mapa
// vive en STATE_PATHS y no se toca.
const ZONE_STATES: Record<string, string[]> = ESTADOS_POR_ZONA;

const STATE_ABBREV: Record<string, string> = {
  "Aguascalientes": "AGS",
  "Baja California": "BC",
  "Baja California Sur": "BCS",
  "Campeche": "CAM",
  "Chiapas": "CHIS",
  "Chihuahua": "CHIH",
  "Ciudad de México": "CDMX",
  "Coahuila de Zaragoza": "COAH",
  "Colima": "COL",
  "Durango": "DGO",
  "Guanajuato": "GTO",
  "Guerrero": "GRO",
  "Hidalgo": "HGO",
  "Jalisco": "JAL",
  "México": "EDOMEX",
  "Michoacán de Ocampo": "MICH",
  "Morelos": "MOR",
  "Nayarit": "NAY",
  "Nuevo León": "NL",
  "Oaxaca": "OAX",
  "Puebla": "PUE",
  "Querétaro": "QRO",
  "Quintana Roo": "QROO",
  "San Luis Potosí": "SLP",
  "Sinaloa": "SIN",
  "Sonora": "SON",
  "Tabasco": "TAB",
  "Tamaulipas": "TAMS",
  "Tlaxcala": "TLAX",
  "Veracruz de Ignacio de la Llave": "VER",
  "Yucatán": "YUC",
  "Zacatecas": "ZAC",
};

const STATE_PATHS: Record<string, { d: string; labelX: number; labelY: number }> = {
  "Baja California": {
    d: "M30,18 L55,15 L60,25 L58,55 L50,80 L42,105 L35,100 L25,75 L20,50 L25,30 Z",
    labelX: 40, labelY: 55,
  },
  "Baja California Sur": {
    d: "M35,100 L42,105 L50,120 L55,150 L50,175 L40,185 L30,175 L28,155 L30,130 Z",
    labelX: 40, labelY: 145,
  },
  "Sonora": {
    d: "M60,25 L120,20 L125,45 L130,80 L115,100 L90,105 L70,100 L58,55 Z",
    labelX: 95, labelY: 60,
  },
  "Chihuahua": {
    d: "M120,20 L180,18 L185,50 L190,90 L175,110 L155,115 L130,110 L125,80 L125,45 Z",
    labelX: 155, labelY: 65,
  },
  "Sinaloa": {
    d: "M70,100 L90,105 L115,100 L120,130 L115,155 L100,170 L85,165 L75,145 L65,120 Z",
    labelX: 92, labelY: 135,
  },
  "Durango": {
    d: "M115,100 L130,110 L155,115 L165,130 L165,165 L150,175 L130,170 L115,155 L120,130 Z",
    labelX: 140, labelY: 140,
  },
  "Coahuila de Zaragoza": {
    d: "M180,18 L240,15 L250,50 L255,80 L240,100 L220,110 L200,115 L190,100 L185,50 Z",
    labelX: 220, labelY: 65,
  },
  "Nuevo León": {
    d: "M240,15 L280,20 L290,55 L285,90 L265,105 L250,100 L240,100 L255,80 L250,50 Z",
    labelX: 265, labelY: 60,
  },
  "Tamaulipas": {
    d: "M280,20 L310,30 L320,60 L315,95 L305,120 L290,135 L275,130 L265,115 L265,105 L285,90 L290,55 Z",
    labelX: 295, labelY: 80,
  },
  "Nayarit": {
    d: "M85,165 L100,170 L105,185 L100,200 L88,200 L78,190 L75,175 Z",
    labelX: 90, labelY: 185,
  },
  "Zacatecas": {
    d: "M150,175 L165,165 L190,160 L210,155 L220,170 L215,195 L200,205 L180,200 L160,195 Z",
    labelX: 185, labelY: 180,
  },
  "San Luis Potosí": {
    d: "M220,110 L240,100 L265,115 L275,130 L270,155 L255,170 L240,175 L225,170 L220,155 L210,155 L220,140 Z",
    labelX: 245, labelY: 140,
  },
  "Aguascalientes": {
    d: "M175,195 L185,190 L195,195 L195,205 L185,210 L175,205 Z",
    labelX: 185, labelY: 200,
  },
  "Jalisco": {
    d: "M88,200 L100,200 L105,185 L115,180 L130,185 L150,195 L160,195 L175,205 L185,210 L180,230 L165,240 L145,235 L125,225 L105,220 L95,210 Z",
    labelX: 135, labelY: 215,
  },
  "Colima": {
    d: "M105,220 L115,225 L118,235 L110,240 L100,235 Z",
    labelX: 110, labelY: 230,
  },
  "Guanajuato": {
    d: "M185,210 L195,205 L210,205 L225,200 L230,215 L225,230 L210,230 L195,225 L185,220 Z",
    labelX: 208, labelY: 218,
  },
  "Querétaro": {
    d: "M225,200 L240,195 L250,200 L250,215 L240,220 L230,215 Z",
    labelX: 238, labelY: 210,
  },
  "Hidalgo": {
    d: "M250,200 L265,195 L275,200 L275,215 L265,220 L255,218 L250,215 Z",
    labelX: 262, labelY: 208,
  },
  "México": {
    d: "M210,230 L225,230 L240,225 L250,230 L255,240 L245,250 L230,250 L215,245 Z",
    labelX: 232, labelY: 240,
  },
  "Ciudad de México": {
    d: "M240,240 L250,238 L255,245 L250,252 L242,250 Z",
    labelX: 247, labelY: 245,
  },
  "Tlaxcala": {
    d: "M260,228 L270,225 L275,232 L270,238 L262,235 Z",
    labelX: 267, labelY: 232,
  },
  "Puebla": {
    d: "M255,240 L270,238 L285,235 L295,245 L290,265 L275,275 L260,270 L255,255 Z",
    labelX: 275, labelY: 255,
  },
  "Morelos": {
    d: "M240,252 L250,252 L255,260 L248,268 L240,262 Z",
    labelX: 247, labelY: 260,
  },
  "Michoacán de Ocampo": {
    d: "M125,225 L145,235 L165,240 L180,240 L195,235 L210,240 L215,255 L200,270 L175,275 L150,265 L130,250 L118,240 Z",
    labelX: 165, labelY: 255,
  },
  "Guerrero": {
    d: "M150,265 L175,275 L200,270 L215,275 L225,290 L215,310 L195,320 L170,315 L150,300 L140,280 Z",
    labelX: 182, labelY: 295,
  },
  "Oaxaca": {
    d: "M215,275 L240,270 L260,270 L280,275 L295,285 L300,305 L285,320 L265,325 L240,320 L225,310 L215,310 Z",
    labelX: 258, labelY: 300,
  },
  "Veracruz de Ignacio de la Llave": {
    d: "M275,130 L290,135 L305,150 L310,170 L305,195 L295,220 L290,240 L295,260 L295,285 L280,275 L270,260 L275,240 L270,225 L265,220 L275,215 L275,200 L265,195 L255,170 L270,155 Z",
    labelX: 292, labelY: 200,
  },
  "Tabasco": {
    d: "M295,260 L310,255 L330,258 L340,270 L330,280 L315,278 L300,275 Z",
    labelX: 318, labelY: 268,
  },
  "Chiapas": {
    d: "M300,275 L315,278 L330,280 L345,285 L350,305 L340,325 L320,340 L300,335 L290,320 L300,305 L295,285 Z",
    labelX: 322, labelY: 310,
  },
  "Campeche": {
    d: "M330,258 L350,250 L365,240 L375,250 L370,270 L360,285 L345,285 L330,280 L340,270 Z",
    labelX: 352, labelY: 265,
  },
  "Yucatán": {
    d: "M350,220 L375,215 L400,218 L405,235 L395,245 L375,250 L365,240 L350,240 Z",
    labelX: 378, labelY: 232,
  },
  "Quintana Roo": {
    d: "M395,245 L405,235 L415,240 L420,260 L418,285 L410,305 L395,310 L385,295 L375,280 L370,270 L375,250 Z",
    labelX: 400, labelY: 270,
  },
  "Durango_label": { d: "", labelX: 0, labelY: 0 },
};

function getZoneForState(stateName: string): string {
  for (const [zone, states] of Object.entries(ZONE_STATES)) {
    if (states.includes(stateName)) return zone;
  }
  return "Otra";
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + "K";
  return n.toLocaleString("es-MX");
}

export default function MexicoMap({ estados }: MexicoMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const estadoMap = new Map<string, EstadoInfo>();
  estados.forEach(e => estadoMap.set(e.estado, e));

  const hoveredData = hoveredState ? estadoMap.get(hoveredState) : null;
  const hoveredZone = hoveredState ? getZoneForState(hoveredState) : null;

  const zoneAgg = Object.entries(ZONE_STATES).map(([zona, stateList]) => {
    let empresas = 0, con_plan = 0, empleados = 0, count = 0;
    stateList.forEach(s => {
      const d = estadoMap.get(s);
      if (d) { empresas += d.empresas; con_plan += d.con_plan; empleados += d.empleados; count++; }
    });
    return { zona, estados: stateList.length, conDatos: count, empresas, con_plan, empleados };
  });

  return (
    <div className="w-full" data-testid="mexico-map-container">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="relative">
          <svg
            viewBox="0 0 440 360"
            className="w-full h-auto"
            style={{ maxHeight: "420px" }}
            data-testid="mexico-map-svg"
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {Object.entries(STATE_PATHS).filter(([k]) => !k.endsWith("_label")).map(([name, { d }]) => {
              const zone = getZoneForState(name);
              const isHighlighted = selectedZone ? zone === selectedZone : true;
              const isHovered = hoveredState === name;
              const baseColor = ZONE_COLORS[zone] || "#94a3b8";
              const lightColor = ZONE_COLORS_LIGHT[zone] || "#e2e8f0";

              return (
                <path
                  key={name}
                  d={d}
                  fill={isHovered ? baseColor : isHighlighted ? lightColor : "#f1f5f9"}
                  stroke={isHovered ? baseColor : isHighlighted ? baseColor : "#cbd5e1"}
                  strokeWidth={isHovered ? 2 : 1}
                  opacity={isHighlighted ? 1 : 0.3}
                  className="cursor-pointer transition-all duration-200"
                  filter={isHovered ? "url(#glow)" : undefined}
                  onMouseEnter={() => setHoveredState(name)}
                  onMouseLeave={() => setHoveredState(null)}
                  data-testid={`map-state-${STATE_ABBREV[name] || name}`}
                />
              );
            })}

            {Object.entries(STATE_PATHS).filter(([k]) => !k.endsWith("_label")).map(([name, { labelX, labelY }]) => {
              const zone = getZoneForState(name);
              const isHighlighted = selectedZone ? zone === selectedZone : true;
              const abbr = STATE_ABBREV[name] || "";
              if (!isHighlighted && !hoveredState) return null;
              const isHovered = hoveredState === name;
              return (
                <text
                  key={`label-${name}`}
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  fill={isHovered ? "white" : isHighlighted ? ZONE_COLORS[zone] : "#94a3b8"}
                  fontSize={isHovered ? 9 : 7}
                  fontWeight={isHovered ? 700 : 600}
                  opacity={isHighlighted ? 1 : 0.3}
                >
                  {abbr}
                </text>
              );
            })}
          </svg>

          {hoveredState && hoveredData && (
            <div
              className="absolute top-3 left-3 bg-gray-900/95 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-2xl pointer-events-none z-10 min-w-[220px]"
              data-testid="map-tooltip"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ZONE_COLORS[hoveredZone || ""] }} />
                <p className="font-bold text-white text-sm">{hoveredState}</p>
              </div>
              <p className="text-[10px] text-gray-400 mb-2">Zona: {hoveredZone}</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Empresas</span>
                  <span className="text-white font-bold">{fmtNum(hoveredData.empresas)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Perfiladas</span>
                  <span className="font-bold" style={{ color: ZONE_COLORS[hoveredZone || ""] }}>{fmtNum(hoveredData.con_plan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Empleados est.</span>
                  <span className="text-gray-300 font-bold">{fmtNum(hoveredData.empleados)}</span>
                </div>
              </div>
            </div>
          )}

          {hoveredState && !hoveredData && (
            <div className="absolute top-3 left-3 bg-gray-900/95 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-2xl pointer-events-none z-10">
              <p className="font-bold text-white text-sm">{hoveredState}</p>
              <p className="text-[10px] text-gray-400">Zona: {hoveredZone}</p>
              <p className="text-xs text-gray-500 mt-1">Sin datos disponibles</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white mb-3">Zonas comerciales</h4>
          {zoneAgg.map(z => {
            const isActive = selectedZone === z.zona;
            return (
              <button
                key={z.zona}
                onClick={() => setSelectedZone(isActive ? null : z.zona)}
                className={`w-full text-left rounded-xl p-3 border transition-all ${
                  isActive
                    ? "border-white/20 bg-white/10"
                    : "border-white/5 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
                data-testid={`zone-btn-${z.zona}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ZONE_COLORS[z.zona] }} />
                  <span className="text-white font-bold text-xs">{z.zona}</span>
                  <span className="text-gray-500 text-[10px] ml-auto">{z.estados} estados</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Empresas</span>
                    <span className="text-gray-300 font-semibold">{fmtNum(z.empresas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Perfiladas</span>
                    <span className="font-semibold" style={{ color: ZONE_COLORS[z.zona] }}>{fmtNum(z.con_plan)}</span>
                  </div>
                </div>
                {isActive && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-[10px] text-gray-500 mb-1">Estados que conforman esta zona:</p>
                    <div className="flex flex-wrap gap-1">
                      {ZONE_STATES[z.zona]?.map(s => {
                        const abbr = STATE_ABBREV[s] || s;
                        const sd = estadoMap.get(s);
                        return (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/5 text-gray-300"
                            title={`${s}: ${sd ? fmtNum(sd.empresas) + " empresas" : "sin datos"}`}
                          >
                            {abbr}
                            {sd && <span className="text-gray-500">{fmtNum(sd.empresas)}</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </button>
            );
          })}

          <div className="rounded-xl p-3 border border-white/10 bg-white/[0.03] mt-2">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1.5">Totales nacionales</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Empresas</span>
                <span className="text-white font-bold">{fmtNum(zoneAgg.reduce((s, z) => s + z.empresas, 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Perfiladas</span>
                <span className="text-[#1b5adf] font-bold">{fmtNum(zoneAgg.reduce((s, z) => s + z.con_plan, 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estados</span>
                <span className="text-gray-300 font-bold">{estados.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
