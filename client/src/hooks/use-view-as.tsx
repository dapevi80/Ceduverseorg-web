import { createContext, useCallback, useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { getStoredViewAsRole, setStoredViewAsRole, type ViewableRole } from "@/lib/view-as";

type ViewAsContextType = {
  /** Rol previsualizado activo, o null si no hay ninguno (rol real). */
  viewAsRole: ViewableRole | null;
  /**
   * Cambia el rol previsualizado (o lo limpia con null). Persiste en
   * sessionStorage e invalida TODAS las queries para que la app se
   * re-renderice con el header `X-View-As` actualizado.
   *
   * El backend ya ignora el header `X-View-As` para cualquier cuenta que no
   * sea superadmin/admin real, y la UI (ViewAsSwitcher) solo se renderiza
   * para superadmin real — pero además, como defensa en profundidad, este
   * hook se niega a activar una previsualización a menos que el rol REAL
   * (vía `/api/me/account`) sea superadmin. Limpiar (llamar con `null`,
   * incl. "Volver a Superadmin") siempre está permitido, para cualquiera.
   */
  setViewAsRole: (role: ViewableRole | null) => void;
};

const ViewAsContext = createContext<ViewAsContextType | null>(null);

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [viewAsRole, setViewAsRoleState] = useState<ViewableRole | null>(() => getStoredViewAsRole());

  // Comparte la queryKey ["/api/me/account"] con el resto de la app
  // (dashboard.tsx, ViewAsSwitcher) — react-query cachea por key, así que
  // esto no dispara ningún fetch adicional más allá del ya existente.
  const { data: account } = useQuery<{ userRole: string }>({
    queryKey: ["/api/me/account"],
    enabled: !!user,
  });
  const realIsSuperadmin = account?.userRole === "superadmin";

  const setViewAsRole = useCallback((role: ViewableRole | null) => {
    if (role !== null && !realIsSuperadmin) {
      // No-op de cara al llamador, pero por si acaso hubiera algo persistido
      // (p.ej. sessionStorage manipulado a mano, o una sesión anterior que sí
      // era superadmin), lo limpiamos también aquí.
      setStoredViewAsRole(null);
      setViewAsRoleState(null);
      return;
    }
    setStoredViewAsRole(role);
    setViewAsRoleState(role);
    queryClient.invalidateQueries();
  }, [realIsSuperadmin]);

  return (
    <ViewAsContext.Provider value={{ viewAsRole, setViewAsRole }}>
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs(): ViewAsContextType {
  const ctx = useContext(ViewAsContext);
  if (!ctx) {
    throw new Error("useViewAs must be used within a ViewAsProvider");
  }
  return ctx;
}
