import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Video, CheckCircle2, XCircle, RefreshCw, Send, Save, Trash2, ExternalLink, Loader2, ShieldAlert, Clock,
} from "lucide-react";

type Status = {
  hasAppCredentials: boolean;
  hasRefreshToken: boolean;
  refreshTokenSource: "database" | "env" | "none";
  connected: boolean;
  account: string | null;
  error: string | null;
  settings: { timeZone: string; durationMinutes: number; calendarId: string };
};

type MeetEvent = {
  id: string;
  summary: string;
  start: string | null;
  end: string | null;
  timeZone: string | null;
  meetUrl: string | null;
  htmlLink: string;
  attendees: { email: string; responseStatus?: string }[];
  status: string;
};

const FALLBACK_TZS = [
  "America/Mexico_City", "America/Cancun", "America/Monterrey", "America/Tijuana",
  "America/Bogota", "America/New_York", "America/Chicago", "America/Los_Angeles",
  "America/Argentina/Buenos_Aires", "America/Santiago", "Europe/Madrid", "UTC",
];
function allTimeZones(): string[] {
  try {
    // @ts-ignore - supportedValuesOf is widely available
    const all = Intl.supportedValuesOf?.("timeZone") as string[] | undefined;
    if (all?.length) return all;
  } catch { /* noop */ }
  return FALLBACK_TZS;
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await apiRequest("GET", url);
  return res.json();
}

function fmtWhen(iso: string | null, tz: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: tz || undefined }) + (tz ? ` (${tz})` : "");
}

export default function AdminGoogleMeet() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Handle the OAuth callback redirect (?connected=1 / ?error=...).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("connected")) {
      toast({ title: "Cuenta de Google reconectada", description: "El refresh token se actualizó correctamente." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/google-meet/status"] });
      window.history.replaceState({}, "", "/admin/google-meet");
    } else if (sp.get("error")) {
      toast({ title: "Error al reconectar", description: sp.get("error") || "", variant: "destructive" });
      window.history.replaceState({}, "", "/admin/google-meet");
    }
  }, [toast]);

  const isExecutive = !!user?.isExecutive;

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<Status>({
    queryKey: ["/api/admin/google-meet/status"],
    queryFn: () => getJSON<Status>("/api/admin/google-meet/status"),
    enabled: isExecutive,
  });

  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useQuery<MeetEvent[]>({
    queryKey: ["/api/admin/google-meet/events"],
    queryFn: () => getJSON<MeetEvent[]>("/api/admin/google-meet/events"),
    enabled: isExecutive,
  });

  // Editable defaults (seeded from status once loaded).
  const [tz, setTz] = useState("");
  const [duration, setDuration] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [testEmail, setTestEmail] = useState("");
  useEffect(() => {
    if (status?.settings) {
      setTz((p) => p || status.settings.timeZone);
      setDuration((p) => p || String(status.settings.durationMinutes));
      setCalendarId((p) => p || status.settings.calendarId);
      setTestEmail((p) => p || user?.email || "");
    }
  }, [status, user?.email]);

  const saveSettings = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/admin/google-meet/settings", {
      timeZone: tz, durationMinutes: Number(duration), calendarId,
    }).then((r) => r.json()),
    onSuccess: () => {
      toast({ title: "Configuración guardada" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/google-meet/status"] });
    },
    onError: (e: Error) => toast({ title: "No se pudo guardar", description: e.message, variant: "destructive" }),
  });

  const sendTest = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/google-meet/test", { email: testEmail.trim() }).then((r) => r.json()),
    onSuccess: (d: { meetUrl?: string }) => {
      toast({ title: "Invitación de prueba enviada", description: d.meetUrl ? `Meet: ${d.meetUrl}` : `Enviada a ${testEmail}` });
      refetchEvents();
    },
    onError: (e: Error) => toast({ title: "Falló la prueba", description: e.message, variant: "destructive" }),
  });

  const cancelEvent = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/google-meet/events/${encodeURIComponent(id)}`),
    onSuccess: () => { toast({ title: "Reunión cancelada" }); refetchEvents(); },
    onError: (e: Error) => toast({ title: "No se pudo cancelar", description: e.message, variant: "destructive" }),
  });

  const reconnect = useMutation({
    mutationFn: () => getJSON<{ url: string }>("/api/admin/google-meet/oauth/start"),
    onSuccess: (d) => { if (d.url) window.location.href = d.url; },
    onError: (e: Error) => toast({ title: "No se pudo iniciar la reconexión", description: e.message, variant: "destructive" }),
  });

  if (authLoading) {
    return <div className="min-h-screen grid place-items-center text-cedu-ink-muted"><Loader2 className="animate-spin" /></div>;
  }
  if (!isExecutive) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#faf8f4] px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <ShieldAlert className="mx-auto mb-3 text-red-500" size={32} />
            <h1 className="font-serif text-xl text-cedu-ink mb-2">Área ejecutiva</h1>
            <p className="text-sm text-cedu-ink-muted mb-6">Esta página está restringida a las cuentas ejecutivas autorizadas.</p>
            <Button variant="outline" onClick={() => setLocation("/admin")}>Volver al panel</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f4] py-8 px-4" data-testid="page-admin-google-meet">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1a73e8] grid place-items-center text-white"><Video size={20} /></div>
          <div>
            <h1 className="font-serif text-2xl text-cedu-ink">Proceso de Google Meet</h1>
            <p className="text-xs text-cedu-ink-muted">Conexión, configuración y reuniones agendadas — acceso ejecutivo.</p>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto gap-2" onClick={() => { refetchStatus(); refetchEvents(); }}>
            <RefreshCw size={14} /> Actualizar
          </Button>
        </div>

        {/* Connection status */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-cedu-ink mb-1 flex items-center gap-2">Estado de conexión</h2>
                {statusLoading ? (
                  <p className="text-sm text-cedu-ink-muted flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Comprobando…</p>
                ) : status?.connected ? (
                  <div className="space-y-1">
                    <Badge className="bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle2 size={12} /> Conectado</Badge>
                    <p className="text-xs text-cedu-ink-muted">Cuenta: <span className="font-medium text-cedu-ink">{status.account || "—"}</span></p>
                    <p className="text-[11px] text-cedu-ink-muted">Token: {status.refreshTokenSource === "database" ? "almacenado en base de datos" : status.refreshTokenSource === "env" ? "variable de entorno" : "ninguno"}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Badge className="bg-red-100 text-red-700 border-red-200 gap-1"><XCircle size={12} /> Sin conexión</Badge>
                    {status?.error && <p className="text-xs text-red-600 max-w-md">{status.error}</p>}
                    {!status?.hasAppCredentials && <p className="text-[11px] text-cedu-ink-muted">Faltan credenciales de la app (GOOGLE_OAUTH_CLIENT_ID / SECRET en variables de entorno).</p>}
                  </div>
                )}
              </div>
              <Button onClick={() => reconnect.mutate()} disabled={reconnect.isPending || !status?.hasAppCredentials} className="gap-2 bg-[#1a73e8] hover:bg-[#1765cc] text-white shrink-0" data-testid="button-reconnect">
                {reconnect.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Reconectar Google
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test invite */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <h2 className="font-semibold text-cedu-ink mb-1">Enviar invitación de prueba</h2>
            <p className="text-xs text-cedu-ink-muted mb-3">Crea un evento de prueba (~30 min) con enlace de Meet a este correo. Puedes cancelarlo abajo.</p>
            <div className="flex gap-2">
              <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="correo@dominio.com" className="bg-white" data-testid="input-test-email" />
              <Button onClick={() => sendTest.mutate()} disabled={sendTest.isPending || !testEmail.includes("@") || !status?.connected} className="gap-2 shrink-0" data-testid="button-send-test">
                {sendTest.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Enviar prueba
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Editable defaults */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <h2 className="font-semibold text-cedu-ink mb-3">Configuración por defecto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-cedu-ink-muted mb-1 block">Zona horaria</label>
                <Select value={tz} onValueChange={setTz}>
                  <SelectTrigger className="bg-white" data-testid="select-default-tz"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {allTimeZones().map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] text-cedu-ink-muted mb-1 block">Duración (min)</label>
                <Input type="number" min={5} max={480} value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-white" data-testid="input-default-duration" />
              </div>
              <div>
                <label className="text-[11px] text-cedu-ink-muted mb-1 block">ID de calendario</label>
                <Input value={calendarId} onChange={(e) => setCalendarId(e.target.value)} placeholder="primary" className="bg-white" data-testid="input-calendar-id" />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending} className="gap-2" data-testid="button-save-settings">
                {saveSettings.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming meetings */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <h2 className="font-semibold text-cedu-ink mb-3 flex items-center gap-2"><Clock size={16} /> Próximas reuniones</h2>
            {eventsLoading ? (
              <p className="text-sm text-cedu-ink-muted flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Cargando…</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-cedu-ink-muted">No hay reuniones próximas.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {events.map((ev) => (
                  <li key={ev.id} className="py-3 flex items-start gap-3" data-testid={`event-${ev.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cedu-ink truncate">{ev.summary}</p>
                      <p className="text-xs text-cedu-ink-muted">{fmtWhen(ev.start, ev.timeZone)}</p>
                      {ev.attendees.length > 0 && (
                        <p className="text-[11px] text-cedu-ink-muted truncate">{ev.attendees.map((a) => a.email).join(", ")}</p>
                      )}
                    </div>
                    {ev.meetUrl && (
                      <a href={ev.meetUrl} target="_blank" rel="noreferrer" className="text-[#1a73e8] hover:underline text-xs flex items-center gap-1 shrink-0 mt-0.5">
                        <ExternalLink size={12} /> Meet
                      </a>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0" onClick={() => cancelEvent.mutate(ev.id)} disabled={cancelEvent.isPending} data-testid={`button-cancel-${ev.id}`}>
                      <Trash2 size={14} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
