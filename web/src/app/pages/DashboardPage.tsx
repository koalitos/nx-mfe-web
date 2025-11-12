import { MathForm } from '../components/MathForm';
import { RealtimeFeed } from '../components/RealtimeFeed';
import { useAuth } from '../hooks/useAuth';

export const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <header className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/40 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-300">
            Area autenticada
          </p>
          <h1 className="text-3xl font-bold">Calculadora distribuida</h1>
          <p className="mt-1 text-sm text-slate-300">
            Tokens JWT sao enviados automaticamente via <code>Authorization</code>.
          </p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-3 text-sm">
          <p className="font-semibold">{user?.displayName ?? user?.email}</p>
          <p className="text-slate-300">{user?.email}</p>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1 text-sm font-medium text-red-200 transition hover:border-red-400 hover:bg-red-500/20"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto mt-8 grid w-full max-w-5xl gap-6 md:grid-cols-2">
        <MathForm />
        <RealtimeFeed />
      </main>
    </div>
  );
};
