import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HttpError } from '../services/httpClient';

export const RegisterPage = () => {
  const { register, isProcessing } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await register(form);
      setSuccess('Cadastro realizado! Voce ja pode fazer login.');
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(
          (err.payload as { message?: string })?.message ??
            'Erro ao criar usuario.'
        );
        return;
      }
      setError('Erro inesperado. Tente novamente.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/40">
        <h1 className="text-2xl font-semibold text-white">
          Criar conta
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Vamos chamar <code>/auth/register</code> na API de auth.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="font-medium text-slate-200">Nome exibido</span>
            <input
              required
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </label>

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
              minLength={6}
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
            {isProcessing ? 'Enviando...' : 'Cadastrar'}
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

        {success && (
          <p className="mt-4 rounded border border-emerald-500/30 bg-emerald-500/10 p-2 text-sm text-emerald-200">
            {success}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-300">
          Ja possui conta?{' '}
          <Link to="/login" className="text-emerald-300 hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
};
