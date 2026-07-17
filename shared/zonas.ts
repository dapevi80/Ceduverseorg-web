// Zonas comerciales de Ceduverse: mapeo estado -> zona.
//
// FUENTE ÚNICA DE VERDAD. Vivía en `server/routes/crm.ts`; se movió aquí para
// que el cliente (landing pública de socios) y el servidor (CRM/DENUE) usen
// exactamente la misma agrupación y no puedan desincronizarse.
// `server/routes/crm.ts` lo reexporta para no romper a sus consumidores.
//
// Cubre los 32 estados. Los nombres de estado están escritos tal como llegan
// en los datos del DENUE (p. ej. "Coahuila de Zaragoza", no "Coahuila"), porque
// se comparan directo contra la columna `estado` de `empresas_prospectos`.
export const ZONA_POR_ESTADO: Record<string, string> = {
  "Ciudad de México": "Centro", "México": "Centro", "Puebla": "Centro",
  "Tlaxcala": "Centro", "Morelos": "Centro", "Hidalgo": "Centro", "Querétaro": "Centro",
  "Nuevo León": "Norte", "Chihuahua": "Norte", "Coahuila de Zaragoza": "Norte",
  "Tamaulipas": "Norte", "Sonora": "Norte", "Baja California": "Norte",
  "Baja California Sur": "Norte", "Sinaloa": "Norte", "Durango": "Norte",
  "San Luis Potosí": "Norte", "Zacatecas": "Norte", "Nayarit": "Norte",
  "Jalisco": "Bajío", "Guanajuato": "Bajío", "Aguascalientes": "Bajío",
  "Colima": "Bajío", "Michoacán de Ocampo": "Bajío",
  "Veracruz de Ignacio de la Llave": "Sur-Sureste", "Oaxaca": "Sur-Sureste",
  "Chiapas": "Sur-Sureste", "Guerrero": "Sur-Sureste", "Tabasco": "Sur-Sureste",
  "Campeche": "Sur-Sureste", "Yucatán": "Sur-Sureste", "Quintana Roo": "Sur-Sureste",
};

// Orden de presentación de las 4 zonas. Hay un solo Coordinador Regional por zona.
export const ZONAS = ["Norte", "Bajío", "Centro", "Sur-Sureste"] as const;

export type Zona = (typeof ZONAS)[number];

// Estados que conforman cada zona, derivados de ZONA_POR_ESTADO (no duplicados a mano).
export const ESTADOS_POR_ZONA: Record<string, string[]> = ZONAS.reduce((acc, zona) => {
  acc[zona] = Object.entries(ZONA_POR_ESTADO)
    .filter(([, z]) => z === zona)
    .map(([estado]) => estado)
    .sort((a, b) => a.localeCompare(b, "es-MX"));
  return acc;
}, {} as Record<string, string[]>);

// Nombres cortos para UI. Solo abrevia los nombres oficiales largos del DENUE;
// los demás estados se muestran tal cual.
const NOMBRE_CORTO: Record<string, string> = {
  "Coahuila de Zaragoza": "Coahuila",
  "Michoacán de Ocampo": "Michoacán",
  "Veracruz de Ignacio de la Llave": "Veracruz",
  "Ciudad de México": "CDMX",
  "México": "Edo. de México",
};

export function nombreCortoEstado(estado: string): string {
  return NOMBRE_CORTO[estado] ?? estado;
}
