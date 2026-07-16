import { useQuery } from "@tanstack/react-query";
import { Eye, ArrowLeftCircle } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useViewAs } from "@/hooks/use-view-as";
import { VIEWABLE_ROLES, type ViewableRole } from "@/lib/view-as";
import { getRoleLabel } from "@/components/RoleBadge";

const SELF_VALUE = "__self__";

/**
 * Barra "Ver como ROL", montada globalmente (ver App.tsx) para que sea
 * visible en TODAS las páginas, no solo el dashboard.
 *
 * CRÍTICO: esta barra (dropdown + estado "Viendo como...") se gatea sobre el
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

  return (
    <div
      className="sticky top-0 z-[9997] flex flex-wrap items-center justify-center gap-3 bg-cedu-ink px-4 py-2 text-sm text-white shadow-md"
      data-testid="bar-view-as"
    >
      <Eye size={14} className="shrink-0" />
      <span className="font-semibold" data-testid="text-view-as-status">
        {viewAsRole ? `Viendo como: ${getRoleLabel(viewAsRole)}` : "Modo Superadmin"}
      </span>

      <Select
        value={viewAsRole ?? SELF_VALUE}
        onValueChange={(value) =>
          setViewAsRole(value === SELF_VALUE ? null : (value as ViewableRole))
        }
      >
        <SelectTrigger
          className="h-8 w-56 border-white/20 bg-white/10 text-xs text-white"
          data-testid="select-view-as-role"
        >
          <SelectValue placeholder="Ver como..." />
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

      {viewAsRole && (
        <Button
          size="sm"
          variant="secondary"
          className="h-8 text-xs"
          onClick={() => setViewAsRole(null)}
          data-testid="button-back-to-superadmin"
        >
          <ArrowLeftCircle size={14} className="mr-1" />
          Volver a Superadmin
        </Button>
      )}
    </div>
  );
}
