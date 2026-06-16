import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
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
import PendingTermsModal from "@/components/PendingTermsModal";
import LiveTutor from "@/pages/live-tutor";
import PrivateSessionsPage from "@/pages/private-sessions";
import TiendaPage, { TiendaSuccess, TiendaFailure, TiendaPending } from "@/pages/tienda";
import CeduversePrivatePage from "@/pages/ceduverse-private";

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
      <Route path="/instructor" component={InstructorDashboard} />
      <Route path="/partner" component={PartnerDashboard} />
      <Route path="/kit-cooperativo" component={KitCooperativo} />
      <Route path="/academy" component={AcademyPage} />
      <Route path="/academy/:id" component={AcademyCourse} />
      <Route path="/aula-virtual" component={AulaVirtual} />
      <Route path="/aula-virtual/:slug" component={CursoVirtual} />
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
            <TooltipProvider>
              <Toaster />
              <PendingTermsModal />
              <ErrorBoundary>
                <Router />
              </ErrorBoundary>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
