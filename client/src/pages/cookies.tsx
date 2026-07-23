import { useForceLightMode } from "@/components/ThemeProvider";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CookiesPage() {
  useForceLightMode();
  return (
    <div className="min-h-screen bg-cedu-cream" data-testid="page-cookies">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/">
          <button className="flex items-center gap-2 text-sm text-cedu-ink-muted hover:text-cedu-blue mb-8 transition-colors" data-testid="link-back-home">
            <ArrowLeft size={16} /> Volver al inicio
          </button>
        </Link>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-8 sm:p-12 shadow-sm">
          <h1 className="font-serif text-3xl text-cedu-ink mb-2" data-testid="text-cookies-title">Política de Cookies</h1>
          <p className="text-sm text-cedu-ink-muted mb-10">Última actualización: Marzo 2026</p>

          <div className="space-y-8 text-sm text-cedu-ink-soft leading-relaxed">
            <section>
              <h2 className="font-serif text-xl text-cedu-ink mb-3">¿Qué son las cookies?</h2>
              <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Se utilizan para recordar tus preferencias y mejorar tu experiencia de navegación.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-cedu-ink mb-3">Cookies que utilizamos</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" data-testid="table-cookies">
                  <thead>
                    <tr className="border-b border-black/[0.08]">
                      <th className="py-3 pr-4 font-semibold text-cedu-ink text-xs uppercase tracking-wider">Cookie</th>
                      <th className="py-3 pr-4 font-semibold text-cedu-ink text-xs uppercase tracking-wider">Tipo</th>
                      <th className="py-3 pr-4 font-semibold text-cedu-ink text-xs uppercase tracking-wider">Propósito</th>
                      <th className="py-3 font-semibold text-cedu-ink text-xs uppercase tracking-wider">Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black/[0.04]">
                      <td className="py-3 pr-4"><code className="bg-black/[0.04] px-1.5 py-0.5 rounded text-xs">cedu_token</code></td>
                      <td className="py-3 pr-4">Esencial</td>
                      <td className="py-3 pr-4">Token JWT de autenticación. Mantiene tu sesión activa.</td>
                      <td className="py-3">Sesión</td>
                    </tr>
                    <tr className="border-b border-black/[0.04]">
                      <td className="py-3 pr-4"><code className="bg-black/[0.04] px-1.5 py-0.5 rounded text-xs">cedu_otp_cooldown</code></td>
                      <td className="py-3 pr-4">Esencial</td>
                      <td className="py-3 pr-4">Controla el tiempo de espera entre envíos de código de acceso.</td>
                      <td className="py-3">60 segundos</td>
                    </tr>
                    <tr className="border-b border-black/[0.04]">
                      <td className="py-3 pr-4"><code className="bg-black/[0.04] px-1.5 py-0.5 rounded text-xs">aula_virtual_onboarding_seen</code></td>
                      <td className="py-3 pr-4">Funcional</td>
                      <td className="py-3 pr-4">Registra si ya viste la pantalla de bienvenida de Conferencias Ceduverse.</td>
                      <td className="py-3">Permanente</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4"><code className="bg-black/[0.04] px-1.5 py-0.5 rounded text-xs">cedu_theme</code></td>
                      <td className="py-3 pr-4">Funcional</td>
                      <td className="py-3 pr-4">Guarda tu preferencia de tema visual (claro/oscuro).</td>
                      <td className="py-3">Permanente</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-xl text-cedu-ink mb-3">Cookies de análisis</h2>
              <p>Si se implementa Google Analytics u otra herramienta de análisis, se utilizarán cookies adicionales para comprender el comportamiento de los usuarios en la plataforma. Estas cookies recopilan información de forma anónima y agregada.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-cedu-ink mb-3">¿Cómo desactivar las cookies?</h2>
              <p className="mb-3">Puedes configurar tu navegador para bloquear o eliminar cookies. Ten en cuenta que si desactivas las cookies esenciales (como <code className="bg-black/[0.04] px-1.5 py-0.5 rounded text-xs">cedu_token</code>), no podrás iniciar sesión ni usar la plataforma.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                <li><strong>Firefox:</strong> Configuración → Privacidad & Seguridad → Cookies y datos del sitio</li>
                <li><strong>Safari:</strong> Preferencias → Privacidad → Gestionar datos de sitios web</li>
                <li><strong>Edge:</strong> Configuración → Cookies y permisos del sitio</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-cedu-ink mb-3">Más información</h2>
              <p>Para cualquier duda sobre el uso de cookies, consulta nuestro <a href="/privacidad" className="text-cedu-blue underline">Aviso de Privacidad</a> o contacta a <strong>privacidad@ceduverse.org</strong>.</p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-black/[0.06] text-xs text-cedu-ink-muted">
            Última actualización: Marzo 2026
          </div>
        </div>
      </div>
    </div>
  );
}
