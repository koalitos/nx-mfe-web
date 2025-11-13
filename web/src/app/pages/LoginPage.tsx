import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HttpError } from '../services/httpClient';
import { NavigationMenu } from '../components/NavigationMenu';

const REMEMBER_EMAIL_KEY = 'web.rememberedEmail';

export const LoginPage = () => {
  const { login, loginWithGoogle, isProcessing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await login(form);
      if (typeof window !== 'undefined') {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, form.email);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      }
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

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch {
      setError('Nao foi possivel iniciar o login com o Google.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090019] via-[#14042c] to-[#090019] p-6">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="breathing-border w-full max-w-md space-y-6 rounded-2xl border border-[#4d1d88]/40 bg-[#1a0f2b]/90 p-8 shadow-[0_20px_120px_-20px_rgba(88,28,135,0.8)]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#d3a6ff]">
                Portal seguro
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                Entrar
              </h1>
              <p className="mt-1 text-sm text-[#c5b5e9]">
                Use sua conta criada via microservico em{' '}
                <code>/auth/login</code>.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm">
                <span className="font-medium text-[#d7c7ff]">Email</span>
                <input
                  required
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-[#4b1d7a] bg-[#140225]/80 p-3 text-white shadow-inner shadow-black/20 focus:border-[#a855f7] focus:outline-none focus:ring-2 focus:ring-[#a855f7]/40"
                />
              </label>

              <label className="block text-sm">
                <span className="font-medium text-[#d7c7ff]">Senha</span>
                <input
                  required
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-[#4b1d7a] bg-[#140225]/80 p-3 text-white shadow-inner shadow-black/20 focus:border-[#a855f7] focus:outline-none focus:ring-2 focus:ring-[#a855f7]/40"
                />
              </label>

              <label className="flex items-center gap-2 text-xs text-[#c5b5e9]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setRememberMe(checked);
                    if (!checked && typeof window !== 'undefined') {
                      localStorage.removeItem(REMEMBER_EMAIL_KEY);
                    }
                  }}
                  className="h-4 w-4 rounded border-[#4b1d7a] bg-[#12001f] text-[#a855f7] focus:ring-[#a855f7]"
                />
                Lembrar este email
              </label>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full rounded-lg bg-gradient-to-r from-[#a855f7] via-[#9333ea] to-[#7e22ce] py-2.5 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? 'Autenticando...' : 'Entrar'}
              </button>
            </form>

            <div className="relative py-3 text-center text-xs uppercase tracking-[0.2em] text-[#8c6fbf]">
              <span className="relative z-10 bg-[#1a0f2b] px-3">ou</span>
              <span className="absolute inset-x-0 top-1/2 block h-px bg-[#412064]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#5b1f8f]/60 bg-[#12001f] py-2.5 text-sm font-medium text-[#f4e9ff] transition hover:border-[#a855f7]"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg">
                G
              </span>
              Entrar com Google
            </button>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"
              >
                {error}
              </p>
            )}

            <p className="text-center text-sm text-[#c5b5e9]">
              Ainda nao possui conta?{' '}
              <Link to="/register" className="text-[#d8b4fe] hover:underline">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
