import { Outlet } from 'react-router-dom';
import { NavigationMenu } from '../components/NavigationMenu';
import { useAuth } from '../hooks/useAuth';

export const DashboardPage = () => {
  const { user, profile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#06000f] p-6 text-white">
      <NavigationMenu className="mx-auto mb-8 w-full max-w-6xl" />
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-2xl border border-[#3c1464]/60 bg-[#140022]/80 p-6 shadow-[0_25px_120px_-30px_rgba(100,38,180,0.9)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#d3a6ff]">
            Portal autenticado
          </p>
          <h1 className="text-3xl font-bold">Console do workspace</h1>
          <p className="mt-1 text-sm text-[#ceb7f1]">
            Tokens JWT são adicionados automaticamente ao header{' '}
            <code>Authorization</code> nas páginas protegidas.
          </p>
        </div>
        <div className="space-y-2 rounded-2xl border border-[#5c1f93]/40 bg-[#1a0b2e]/80 p-4 text-sm">
          <div>
            <p className="font-semibold">
              {profile?.displayName ?? user?.email ?? 'Usuário autenticado'}
            </p>
            <p className="text-[#ceb7f1]">{user?.email}</p>
          </div>
          {profile?.userType?.name && (
            <div className="flex flex-wrap gap-2 text-xs text-[#f5e9ff]">
              <span className="rounded-full border border-[#a855f7]/40 px-3 py-0.5">
                Tipo: {profile.userType.name}
              </span>
              {profile.userType.userGroup && (
                <span className="rounded-full border border-[#a855f7]/40 px-3 py-0.5">
                  Grupo: {profile.userType.userGroup.name}
                </span>
              )}
            </div>
          )}
          <button
            onClick={logout}
            className="w-full rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 transition hover:border-red-400 hover:bg-red-500/20"
          >
            Encerrar sessão
          </button>
        </div>
      </header>

      <main className="mx-auto mt-10 w-full max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
};



