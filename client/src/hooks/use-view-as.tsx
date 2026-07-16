import { createContext, useCallback, useContext, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { getStoredViewAsRole, setStoredViewAsRole, type ViewableRole } from "@/lib/view-as";

type ViewAsContextType = {
  /** Rol previsualizado activo, o null si no hay ninguno (rol real). */
  viewAsRole: ViewableRole | null;
  /**
   * Cambia el rol previsualizado (o lo limpia con null). Persiste en
   * sessionStorage e invalida TODAS las queries para que la app se
   * re-renderice con el header `X-View-As` actualizado.
   *
   * No valida aquí si el usuario es superadmin real: eso lo decide el
   * backend (que ignora el header para cualquiera que no lo sea) y la UI
   * (el switcher solo se renderiza para superadmin real). Llamar esto sin
   * ser superadmin no tiene efecto — el header simplemente es ignorado.
   */
  setViewAsRole: (role: ViewableRole | null) => void;
};

const ViewAsContext = createContext<ViewAsContextType | null>(null);

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const [viewAsRole, setViewAsRoleState] = useState<ViewableRole | null>(() => getStoredViewAsRole());

  const setViewAsRole = useCallback((role: ViewableRole | null) => {
    setStoredViewAsRole(role);
    setViewAsRoleState(role);
    queryClient.invalidateQueries();
  }, []);

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
