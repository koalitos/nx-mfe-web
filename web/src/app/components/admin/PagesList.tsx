import type { AccessPage } from "../../services/accessControlApi";

type PagesListProps = {
  pages: AccessPage[];
};

export const PagesList = ({ pages }: PagesListProps) => {
  if (pages.length === 0) {
    return <p className="mt-3 text-sm text-slate-300">Nenhuma pagina registrada.</p>;
  }

  return (
    <div className="mt-4 space-y-3 text-sm">
      {pages.map((page) => (
        <div key={page.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <p className="font-semibold text-white">
            {page.name}{" "}
            <span className="text-xs text-slate-400">({page.key})</span>
          </p>
          <p className="text-xs text-slate-400">Path: {page.path ?? "Nao definido"}</p>
          <p className="text-xs text-slate-400">{page.isActive ? "Ativa" : "Inativa"}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {page.roles.length === 0 ? (
              <span className="text-xs text-slate-500">Sem roles vinculadas.</span>
            ) : (
              page.roles.map((role) => (
                <span key={role.id} className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200">
                  {role.userType?.name ?? "Tipo removido"} - {role.role}
                </span>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
