import { Switch, Route, Redirect, useSearch, useParams } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { captureReferralFromUrl } from "@/lib/referral-capture";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ViewAsProvider } from "@/hooks/use-view-as";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import ViewAsSwitcher from "@/components/ViewAsSwitcher";
import ScrollToTop from "@/components/scroll-to-top";
import { AudioPlayerProvider } from "@/components/audio/audio-player-context";
import FloatingAudioPlayer from "@/components/audio/floating-audio-player";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Empresas from "@/pages/empresas";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import KitCooperativo from "@/pages/kit-cooperativo";
import AcademyPage from "@/pages/academy";
import AulaVirtual from "@/pages/aula-virtual";
import CursoVirtual from "@/pages/curso-virtual";
import Onboarding from "@/pages/onboarding";
import PartnerDashboard from "@/pages/partner-dashboard";
import AcademyCourse from "@/pages/academy-course";
import StudioPage from "@/pages/studio";
import StudioCoursePage from "@/pages/studio-course";
import TutorIaOnboarding from "@/pages/tutor-ia-onboarding";
import { ThreadListView, ThreadDetailView } from "@/pages/support-chat";
import SociosLanding from "@/pages/socios-landing";
import PropuestaPage from "@/pages/propuesta";
import CrmDashboard from "@/pages/crm-dashboard";
import InstructorDashboard from "@/pages/instructor-dashboard";
import InstructorAcreditacion from "@/pages/instructor-acreditacion";
import InstructorCursoEditor from "@/pages/instructor-curso-editor";
import AdminPanel from "@/pages/admin-panel";
import VCardPage from "@/pages/vcard";
import BlogPage from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";

import AdminFinanciero from "@/pages/admin-financiero";
import AdminGoogleMeet from "@/pages/admin-google-meet";
import SegurosPage from "@/pages/seguros";
import TerminosPage from "@/pages/terminos";
import PrivacidadPage from "@/pages/privacidad";
import CookiesPage from "@/pages/cookies";
import VerifySocioPage from "@/pages/verify-socio";
import ReportarRiesgoPage from "@/pages/reportar-riesgo";
import MisRiesgosPage from "@/pages/mis-riesgos";
import PendingTermsModal from "@/components/PendingTermsModal";
import LiveTutor from "@/pages/live-tutor";
import PrivateSessionsPage from "@/pages/private-sessions";
import TiendaPage, { TiendaSuccess, TiendaFailure, TiendaPending } from "@/pages/tienda";
import CeduversePrivatePage from "@/pages/ceduverse-private";

// Captura app-wide de ?ref= en cualquier ruta (no solo /auth), para que links como
// /empresas?ref=P-XXXX (los que genera el panel de socio) no pierdan la atribución.
// useSearch() de wouter reacciona a cambios de query string en navegación client-side,
// así que también funciona si el ref llega vía un link interno, no solo en el primer mount.
function ReferralCapture() {
  const search = useSearch();
  useEffect(() => {
    captureReferralFromUrl(search);
  }, [search]);
  return null;
}

// El detector de riesgos reemplaza la actividad de campo del playbook (ver
// docs/superpowers/specs/2026-07-18-detector-riesgos-design.md), pero un QR
// ya impreso en un cuaderno físico puede seguir apuntando a la ruta vieja
// /playbook/:slug/ejercicio/:n — esta redirección la mantiene funcionando en
// vez de mostrarle un 404 a quien lo escanea. El índice de ejercicio (:n) no
// tiene equivalente en el nuevo flujo (ya no es "sube evidencia de la tarea
// N"), así que solo se conserva el curso de origen.
function PlaybookExerciseRedirect() {
  const params = useParams<{ slug: string }>();
  return <Redirect to={`/riesgos/reportar/${params.slug}`} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/empresas" component={Empresas} />
      <Route path="/socios" component={SociosLanding} />
      <Route path="/propuesta" component={PropuestaPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin/crm" component={CrmDashboard} />
      <Route path="/admin/financiero" component={AdminFinanciero} />
      <Route path="/admin/google-meet" component={AdminGoogleMeet} />
      <Route path="/admin" component={AdminPanel} />

      <Route path="/instructor/acreditacion" component={InstructorAcreditacion} />
      <Route path="/instructor/curso/:id" component={InstructorCursoEditor} />
      <Route path="/instructor" component={InstructorDashboard} />
      <Route path="/partner" component={PartnerDashboard} />
      <Route path="/kit-cooperativo" component={KitCooperativo} />
      <Route path="/academy" component={AcademyPage} />
      <Route path="/academy/:id" component={AcademyCourse} />
      <Route path="/conferencias" component={AulaVirtual} />
      <Route path="/conferencias/:slug" component={CursoVirtual} />
      {/* Rutas viejas: redirect para no romper enlaces/bookmarks previos al rename. */}
      <Route path="/aula-virtual"><Redirect to="/conferencias" /></Route>
      <Route path="/aula-virtual/:slug">
        {(params) => <Redirect to={`/conferencias/${params.slug}`} />}
      </Route>
      <Route path="/tutor-ia" component={StudioPage} />
      <Route path="/tutor-ia/:slug/onboarding" component={TutorIaOnboarding} />
      <Route path="/tutor-ia/:slug" component={StudioCoursePage} />
      <Route path="/studio" component={StudioPage} />
      <Route path="/studio/:slug" component={StudioCoursePage} />
      <Route path="/mensajes/:threadId" component={ThreadDetailView} />
      <Route path="/mensajes" component={ThreadListView} />
      <Route path="/welcome" component={Onboarding} />
      <Route path="/seguros" component={SegurosPage} />
      <Route path="/blog/categoria/:category" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/contacto/:slug" component={VCardPage} />
      <Route path="/terminos" component={TerminosPage} />
      <Route path="/privacidad" component={PrivacidadPage} />
      <Route path="/cookies" component={CookiesPage} />
      <Route path="/verify/socio/:numero" component={VerifySocioPage} />
      <Route path="/riesgos/reportar/:slug" component={ReportarRiesgoPage} />
      <Route path="/riesgos/reportar" component={ReportarRiesgoPage} />
      <Route path="/riesgos/mios" component={MisRiesgosPage} />
      <Route path="/playbook/:slug/ejercicio/:n" component={PlaybookExerciseRedirect} />
      <Route path="/tutor-ia-vivo" component={LiveTutor as any} />
      <Route path="/sesiones-privadas" component={PrivateSessionsPage} />
      <Route path="/tienda/success" component={TiendaSuccess} />
      <Route path="/tienda/failure" component={TiendaFailure} />
      <Route path="/tienda/pending" component={TiendaPending} />
      <Route path="/tienda" component={TiendaPage} />
      <Route path="/ceduverse" component={CeduversePrivatePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ViewAsProvider>
              <TooltipProvider>
                <Toaster />
                <PendingTermsModal />
                <ViewAsSwitcher />
                <ReferralCapture />
                <ScrollToTop />
                <AudioPlayerProvider>
                  <ErrorBoundary>
                    <Router />
                  </ErrorBoundary>
                  <FloatingAudioPlayer />
                </AudioPlayerProvider>
              </TooltipProvider>
            </ViewAsProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
