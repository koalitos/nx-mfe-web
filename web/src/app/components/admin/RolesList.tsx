import type { AccessPageRole } from "../../services/accessControlApi";

type RolesListProps = {
  roles: AccessPageRole[];
  isBusy: (key: string) => boolean;
  onRemove: (role: AccessPageRole) => void;
};

export const RolesList = ({ roles, isBusy, onRemove }: RolesListProps) => {
  if (roles.length === 0) {
    return <p className="mt-3 text-sm text-slate-300">Nenhuma role definida.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {roles.map((role) => {
        const busy = isBusy(`delete-role-${role.id}`);
        return (
          <div
            key={role.id}
            className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold text-white">{role.userType?.name ?? "Tipo removido"}</p>
              <p className="text-xs text-slate-400">
                Pagina: {role.page?.name ?? "Indefinida"} ({role.page?.key ?? "sem chave"})
              </p>
              <p className="text-xs text-slate-400">Role: {role.role || "N/A"}</p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(role)}
              disabled={busy}
              className="rounded-md border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-200 transition hover:border-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed"
            >
              {busy ? "Removendo..." : "Remover"}
            </button>
          </div>
        );
      })}
    </div>
  );
};
