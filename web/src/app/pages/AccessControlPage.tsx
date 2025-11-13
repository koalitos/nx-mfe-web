import { AdminPanel } from '../components/AdminPanel';
import { useAuth } from '../hooks/useAuth';

const NoPermission = () => (
  <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
    Apenas Usuários com a role <strong>dashboard.access</strong> podem visualizar
    esta área administrativa.
  </p>
);

export const AccessControlPage = () => {
  const { canAccessPage } = useAuth();
  const allowed = canAccessPage('dashboard.access');

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-[#d3a6ff]">
          Administração
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Controle avançado de acesso
        </h1>
        <p className="mt-2 text-sm text-[#c5b5e9]">
          Gerencie perfis sincronizados com o Supabase, organize grupos e tipos
          de Usuários e defina as roles por página que liberam o menu do front.
        </p>
      </header>

      {allowed ? <AdminPanel /> : <NoPermission />}
    </div>
  );
};



