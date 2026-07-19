/**
 * Prueba de arranque del bundle de produccion.
 *
 * POR QUE EXISTE: el 2026-07-19 un deploy fallo con
 *   "The argument 'filename' must be a file URL object... Received undefined"
 * El codigo compilaba (`tsc` limpio), las pruebas pasaban (360) y `npm run build`
 * terminaba sin errores — pero el proceso MORIA al cargar los modulos, porque
 * `createRequire(import.meta.url)` no funciona una vez empaquetado a CommonJS.
 *
 * Ninguna de nuestras verificaciones podia verlo: todas se detenian en "compila".
 * Esta prueba llega hasta "arranca y escucha", que es donde vive toda una familia
 * de fallas: resolucion de modulos, dependencias nativas, orden de carga.
 *
 * Uso:  npm run build && npm run smoke:boot
 * Sale 0 si el servidor llega a escuchar; 1 si muere o se pasa del tiempo.
 *
 * NOTA: usa credenciales falsas a proposito. No toca la base de datos real; solo
 * verifica que el proceso cargue y abra el puerto.
 */

import { spawn } from "node:child_process";
import net from "node:net";

const PORT = 3987; // improbable que este ocupado
const TIMEOUT_MS = 45_000;
const BUNDLE = "dist/index.cjs";

function esperaPuerto(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const intenta = () => {
      const s = net.connect({ port, host: "127.0.0.1" }, () => {
        s.destroy();
        resolve();
      });
      s.on("error", () => {
        s.destroy();
        setTimeout(intenta, 300);
      });
    };
    intenta();
    setTimeout(() => reject(new Error("timeout esperando el puerto")), TIMEOUT_MS);
  });
}

async function main() {
  console.log(`[smoke] arrancando ${BUNDLE} en el puerto ${PORT}...`);

  const proc = spawn(process.execPath, [BUNDLE], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(PORT),
      // Credenciales falsas: no se toca ninguna base real.
      DB_URL: "postgresql://smoke:smoke@127.0.0.1:5432/smoke",
      SESSION_SECRET: "smoke-test-secret",
      // Sin semillas: aqui solo importa que el proceso cargue y escuche.
      SKIP_SEEDS: "true",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let salida = "";
  proc.stdout.on("data", (d) => { salida += d.toString(); process.stdout.write(`  ${d}`); });
  proc.stderr.on("data", (d) => { salida += d.toString(); process.stderr.write(`  ${d}`); });

  const murio = new Promise<never>((_, reject) => {
    proc.on("exit", (code) => {
      reject(new Error(`el proceso murio antes de escuchar (codigo ${code})`));
    });
  });

  try {
    await Promise.race([esperaPuerto(PORT), murio]);
    console.log(`\n[smoke] ✅ el servidor arranco y escucha en ${PORT}`);
    proc.kill("SIGTERM");
    process.exit(0);
  } catch (err: any) {
    console.error(`\n[smoke] ❌ ${err.message}`);
    if (/FATAL|Uncaught|Error/.test(salida)) {
      console.error("[smoke] el proceso reporto un error arriba — ese es el fallo real.");
    }
    proc.kill("SIGKILL");
    process.exit(1);
  }
}

main();
