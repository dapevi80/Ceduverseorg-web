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
