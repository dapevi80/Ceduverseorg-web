import { useQuery } from "@tanstack/react-query";
import { Eye, ArrowLeftCircle } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useViewAs } from "@/hooks/use-view-as";
import { VIEWABLE_ROLES, type ViewableRole } from "@/lib/view-as";
import { getRoleLabel } from "@/components/RoleBadge";

const SELF_VALUE = "__self__";

/**
 * Pestaña compacta "Ver como ROL", montada globalmente (ver App.tsx) para que
 * sea visible en TODAS las páginas, no solo el dashboard. Va `fixed` colgando
 * del borde superior (fuera de flujo, para no empujar ni tapar el header) y se
 * pinta de ámbar mientras se previsualiza, como señal de que no eres tú.
 *
 * CRÍTICO: esta pestaña (dropdown + estado "Viendo como...") se gatea sobre el
 * rol REAL (`account.userRole === "superadmin"`, vía `/api/me/account`, que
 * siempre refleja el rol real de la cuenta sin importar el header
 * `X-View-As`). Esto es intencional: mientras se previsualiza cualquier rol
 * -incluyendo roles sin ningún privilegio- el switcher y el camino de
 * regreso ("Volver a Superadmin") deben seguir visibles. Si esto se gateara
 * sobre el rol EFECTIVO, previsualizar `socio_estudiante` escondería la
 * única forma de volver a superadmin.
 */
export default function ViewAsSwitcher() {
  const { user } = useAuth();
  const { data: account } = useQuery<{ userRole: string }>({
    queryKey: ["/api/me/account"],
    enabled: !!user,
  });
  const { viewAsRole, setViewAsRole } = useViewAs();

  if (account?.userRole !== "superadmin") return null;

  const previewing = !!viewAsRole;

  return (
    <div
      className={`fixed left-1/2 top-0 z-[9997] flex -translate-x-1/2 items-center gap-1 rounded-b-lg px-2 py-0.5 text-[11px] shadow-md backdrop-blur-sm ${
        previewing ? "bg-amber-500 text-black" : "bg-cedu-ink/90 text-white"
      }`}
      data-testid="bar-view-as"
    >
      <Eye size={12} className="shrink-0 opacity-80" />

      <Select
        value={viewAsRole ?? SELF_VALUE}
        onValueChange={(value) =>
          setViewAsRole(value === SELF_VALUE ? null : (value as ViewableRole))
        }
      >
        <SelectTrigger
          className="h-6 w-auto gap-1 border-0 bg-transparent px-1 text-[11px] font-medium shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:h-3 [&>svg]:w-3"
          data-testid="select-view-as-role"
        >
          <span data-testid="text-view-as-status">
            {previewing ? `Viendo como: ${getRoleLabel(viewAsRole!)}` : "Ver como"}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SELF_VALUE} data-testid="option-view-as-self">
            Superadmin (yo)
          </SelectItem>
          {VIEWABLE_ROLES.map((role) => (
            <SelectItem key={role} value={role} data-testid={`option-view-as-${role}`}>
              {getRoleLabel(role)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {previewing && (
        <button
          type="button"
          onClick={() => setViewAsRole(null)}
          className="ml-0.5 flex shrink-0 items-center rounded p-0.5 hover:bg-black/10"
          title="Volver a Superadmin"
          aria-label="Volver a Superadmin"
          data-testid="button-back-to-superadmin"
        >
          <ArrowLeftCircle size={13} />
        </button>
      )}
    </div>
  );
}
