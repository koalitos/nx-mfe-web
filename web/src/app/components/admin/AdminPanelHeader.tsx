type AdminPanelHeaderProps = {
  isLoading: boolean;
  onRefresh: () => void;
};

export const AdminPanelHeader = ({ isLoading, onRefresh }: AdminPanelHeaderProps) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-sm uppercase tracking-wide text-amber-300">Controle de acesso</p>
      <h2 className="text-2xl font-semibold">Perfis, grupos e paginas protegidas</h2>
      <p className="text-sm text-slate-300">
        Atualize perfis sincronizados, organize grupos e defina quais rotas estao liberadas no frontend.
      </p>
    </div>
    <button
      type="button"
      onClick={onRefresh}
      disabled={isLoading}
      className="inline-flex items-center justify-center rounded-md border border-amber-400/60 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-300 hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
    >
      {isLoading ? "Carregando..." : "Recarregar dados"}
    </button>
  </div>
);
