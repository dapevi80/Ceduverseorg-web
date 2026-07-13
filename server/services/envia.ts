// Cotización de envío vía Envia.com (reutiliza la misma API que el store).
// Devuelve la tarifa más barata en MXN, o null si Envia no está configurado o no
// hay tarifas — nunca un precio inventado.

const ENVIA_API_KEY = process.env.ENVIA_API_KEY || "";
const ENVIA_URL = "https://api.envia.com";

// Origen del envío (almacén). Configurable por env; por defecto Monterrey.
// NOTA: revisa ENVIA_ORIGIN_STREET en producción — el default es placeholder.
const ORIGIN = {
  name: process.env.ENVIA_ORIGIN_NAME || "Ceduverse Store",
  company: process.env.ENVIA_ORIGIN_COMPANY || "Ceducap Educación y Capacitación S.C. de C. de RL de CV",
  email: process.env.ENVIA_ORIGIN_EMAIL || "hola@ceduverse.org",
  phone: process.env.ENVIA_ORIGIN_PHONE || "8111848109",
  street: process.env.ENVIA_ORIGIN_STREET || "TU_CALLE_ALMACEN",
  number: process.env.ENVIA_ORIGIN_NUMBER || "S/N",
  district: process.env.ENVIA_ORIGIN_DISTRICT || "Centro",
  city: process.env.ENVIA_ORIGIN_CITY || "Monterrey",
  state: process.env.ENVIA_ORIGIN_STATE || "NL",
  country: process.env.ENVIA_ORIGIN_COUNTRY || "MX",
  postalCode: process.env.ENVIA_ORIGIN_POSTALCODE || "64000",
};

export type EnviaDestination = {
  name?: string; email?: string; phone?: string;
  street?: string; number?: string; colony?: string;
  city?: string; state?: string; country?: string; zip?: string;
};

export type EnviaPackage = {
  content: string; amount: number; type?: string;
  weight: number; insurance?: number; declaredValue?: number;
  weightUnit?: string; lengthUnit?: string;
  dimensions: { length: number; width: number; height: number };
};

export type EnviaRate = { price: number; carrier: string; service: string; days: string };

export function isEnviaConfigured(): boolean {
  return !!ENVIA_API_KEY;
}

/**
 * Tarifa de envío más barata para un destino y paquetes dados.
 * null si Envia no está configurado o no devolvió tarifas (el llamador decide
 * el fallback — nunca se inventa un precio aquí).
 */
export async function getCheapestRate(destination: EnviaDestination, packages: EnviaPackage[]): Promise<EnviaRate | null> {
  if (!ENVIA_API_KEY) return null;
  const response = await fetch(`${ENVIA_URL}/ship/rate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ENVIA_API_KEY}` },
    body: JSON.stringify({
      origin: ORIGIN,
      destination: {
        name: destination.name, email: destination.email, phone: destination.phone,
        street: destination.street, number: destination.number || "S/N",
        district: destination.colony || "", city: destination.city,
        state: destination.state, country: destination.country || "MX", postalCode: destination.zip,
      },
      packages: packages.map((p) => ({
        content: p.content, amount: p.amount, type: p.type || "box",
        weight: p.weight, insurance: p.insurance ?? 0, declaredValue: p.declaredValue ?? 0,
        weightUnit: p.weightUnit || "KG", lengthUnit: p.lengthUnit || "CM",
        dimensions: p.dimensions,
      })),
      shipment: { carrier: "all", type: 1 },
    }),
  });
  const data = await response.json();
  const rates = (data.data || [])
    .filter((q: any) => q.totalPrice > 0)
    .sort((a: any, b: any) => a.totalPrice - b.totalPrice);
  if (rates.length === 0) return null;
  const best = rates[0];
  return {
    price: Math.ceil(best.totalPrice),
    carrier: best.carrier,
    service: best.service,
    days: best.deliveryEstimate || best.days || "3–7 días",
  };
}
