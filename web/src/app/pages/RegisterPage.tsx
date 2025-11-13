import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HttpError } from '../services/httpClient';
import { NavigationMenu } from '../components/NavigationMenu';

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
    <div className="min-h-screen bg-gradient-to-br from-[#090019] via-[#14042c] to-[#090019] p-6">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="breathing-border w-full max-w-md space-y-6 rounded-2xl border border-[#4d1d88]/40 bg-[#1a0f2b]/90 p-8 shadow-[0_25px_120px_-15px_rgba(113,35,173,0.8)]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#d3a6ff]">
                Registro
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                Criar conta
              </h1>
              <p className="mt-1 text-sm text-[#c5b5e9]">
                Vamos chamar <code>/auth/register</code> na API de auth.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm">
                <span className="font-medium text-[#d7c7ff]">Nome exibido</span>
                <input
                  required
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-[#4b1d7a] bg-[#140225]/80 p-3 text-white focus:border-[#a855f7] focus:outline-none focus:ring-2 focus:ring-[#a855f7]/40"
                />
              </label>

              <label className="block text-sm">
                <span className="font-medium text-[#d7c7ff]">Email</span>
                <input
                  required
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-[#4b1d7a] bg-[#140225]/80 p-3 text-white focus:border-[#a855f7] focus:outline-none focus:ring-2 focus:ring-[#a855f7]/40"
                />
              </label>

              <label className="block text-sm">
                <span className="font-medium text-[#d7c7ff]">Senha</span>
                <input
                  required
                  type="password"
                  minLength={6}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-[#4b1d7a] bg-[#140225]/80 p-3 text-white focus:border-[#a855f7] focus:outline-none focus:ring-2 focus:ring-[#a855f7]/40"
                />
              </label>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full rounded-lg bg-gradient-to-r from-[#a855f7] via-[#9333ea] to-[#7e22ce] py-2.5 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? 'Enviando...' : 'Cadastrar'}
              </button>
            </form>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"
              >
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                {success}
              </p>
            )}

            <p className="text-center text-sm text-[#c5b5e9]">
              Ja possui conta?{' '}
              <Link to="/login" className="text-[#d8b4fe] hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
