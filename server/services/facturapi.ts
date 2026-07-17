const FACTURAPI_BASE = "https://www.facturapi.io/v2";

export function isSandboxMode(): boolean {
  const key = process.env.FACTURAPI_API_KEY || "";
  return key.startsWith("sk_test_") || process.env.NODE_ENV !== "production";
}

function getApiKey(): string {
  const key = process.env.FACTURAPI_API_KEY;
  if (!key) throw new Error("FACTURAPI_API_KEY no configurada");
  return key;
}

function headers() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

export interface FacturapiCustomer {
  id: string;
  legal_name: string;
  tax_id: string;
  tax_system: string;
  address: { zip: string };
}

export interface FacturapiInvoice {
  id: string;
  uuid: string;
  series: string;
  folio_number: number;
  status: string;
  total: number;
  subtotal: number;
  taxes: { total: number }[];
  created_at: string;
}

export async function createCustomer(data: {
  legalName: string;
  taxId: string;
  taxSystem: string;
  zip: string;
  email?: string;
}): Promise<FacturapiCustomer> {
  const body: Record<string, unknown> = {
    legal_name: data.legalName,
    tax_id: data.taxId,
    tax_system: data.taxSystem,
    address: { zip: data.zip },
  };
  if (data.email) body.email = data.email;

  const res = await fetch(`${FACTURAPI_BASE}/customers`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facturapi createCustomer failed: ${res.status} ${err}`);
  }
  return res.json();
}

export async function updateCustomer(
  customerId: string,
  data: { legalName?: string; taxId?: string; taxSystem?: string; zip?: string; email?: string }
): Promise<FacturapiCustomer> {
  const body: Record<string, unknown> = {};
  if (data.legalName) body.legal_name = data.legalName;
  if (data.taxId) body.tax_id = data.taxId;
  if (data.taxSystem) body.tax_system = data.taxSystem;
  if (data.zip) body.address = { zip: data.zip };
  if (data.email) body.email = data.email;

  const res = await fetch(`${FACTURAPI_BASE}/customers/${customerId}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facturapi updateCustomer failed: ${res.status} ${err}`);
  }
  return res.json();
}

export async function createInvoice(data: {
  customerId: string;
  items: {
    description: string;
    quantity: number;
    price: number;
    product_key: string;
    /**
     * Impuestos del renglón. Omitir (undefined) deja el default de FacturAPI
     * (IVA 16% traslado) — usado para certificaciones/productos gravados.
     * Pasar [] fuerza el renglón a SIN IVA — usado para aportaciones de
     * empresa (exentas / no objeto de impuesto por decisión del dueño).
     */
    taxes?: unknown[];
  }[];
  paymentForm: string;
  paymentMethod?: string;
  use?: string;
}): Promise<FacturapiInvoice> {
  const body = {
    customer: data.customerId,
    items: data.items.map(item => ({
      quantity: item.quantity,
      product: {
        description: item.description,
        product_key: item.product_key,
        price: item.price,
        ...(item.taxes !== undefined ? { taxes: item.taxes } : {}),
      },
    })),
    payment_form: data.paymentForm,
    payment_method: data.paymentMethod || "PUE",
    use: data.use || "G03",
  };

  const res = await fetch(`${FACTURAPI_BASE}/invoices`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facturapi createInvoice failed: ${res.status} ${err}`);
  }
  return res.json();
}

export async function cancelInvoice(invoiceId: string, motive?: string): Promise<void> {
  const body: Record<string, unknown> = {};
  if (motive) body.motive = motive;

  const res = await fetch(`${FACTURAPI_BASE}/invoices/${invoiceId}`, {
    method: "DELETE",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facturapi cancelInvoice failed: ${res.status} ${err}`);
  }
}

export async function downloadInvoice(invoiceId: string, format: "pdf" | "xml"): Promise<Buffer> {
  const res = await fetch(`${FACTURAPI_BASE}/invoices/${invoiceId}/${format}`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facturapi download ${format} failed: ${res.status} ${err}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function getInvoice(invoiceId: string): Promise<FacturapiInvoice> {
  const res = await fetch(`${FACTURAPI_BASE}/invoices/${invoiceId}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facturapi getInvoice failed: ${res.status} ${err}`);
  }
  return res.json();
}

export function isConfigured(): boolean {
  return !!process.env.FACTURAPI_API_KEY;
}
