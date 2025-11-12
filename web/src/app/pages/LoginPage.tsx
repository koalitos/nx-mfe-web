import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HttpError } from '../services/httpClient';
import { NavigationMenu } from '../components/NavigationMenu';

export const LoginPage = () => {
  const { login, isProcessing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await login(form);
      const redirectTo = location.state?.from ?? '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof HttpError) {
        setError(
          (err.payload as { message?: string })?.message ??
            'Credenciais invalidas.'
        );
        return;
      }
      setError('Nao foi possivel fazer login. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
        <NavigationMenu className="mb-6" />
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/40">
        <h1 className="text-2xl font-semibold text-white">Entrar</h1>
        <p className="mt-1 text-sm text-slate-300">
          Use sua conta criada via microservico em <code>/auth/login</code>.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="font-medium text-slate-200">Email</span>
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-200">Senha</span>
            <input
              required
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </label>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full rounded-md bg-emerald-500 py-2 font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-800 disabled:text-emerald-200"
          >
            {isProcessing ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-300">
          Ainda nao possui conta?{' '}
          <Link to="/register" className="text-emerald-300 hover:underline">
            Cadastre-se
          </Link>
        </p>
          </div>
        </div>
      </div>
    </div>
  );
};
