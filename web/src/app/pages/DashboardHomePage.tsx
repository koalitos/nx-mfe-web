import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

type DashboardLink = {
  id: string;
  title: string;
  description: string;
  badge: string;
  to: string;
  pageKey: string;
};

const DASHBOARD_LINKS: DashboardLink[] = [
  {
    id: 'access',
    title: 'Gerenciar perfis, grupos e paginas',
    description:
      'Crie grupos, tipos de usuario e roles por pagina para controlar o acesso ao front.',
    badge: 'Administracao',
    to: '/admin/access',
    pageKey: 'dashboard.access',
  },
  {
    id: 'chat',
    title: 'Chat colaborativo seguro',
    description:
      'Troque mensagens criptografadas em tempo real com squads especificos.',
    badge: 'Chat',
    to: '/chat',
    pageKey: 'dashboard.chat',
  },
];

export const DashboardHomePage = () => {
  const { user, profile, canAccessPage } = useAuth();

  const availableLinks = DASHBOARD_LINKS.filter(({ pageKey }) =>
    canAccessPage(pageKey)
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#3c1464]/60 bg-gradient-to-r from-[#180028] via-[#1f0337] to-[#280047] p-6 shadow-[0_20px_120px_-30px_rgba(120,34,200,0.9)]">
        <p className="text-xs uppercase tracking-[0.4em] text-[#d3a6ff]">
          Area autenticada
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">
          Bem-vindo(a), {profile?.displayName ?? user?.email ?? 'usuario'}!
        </h1>
        <p className="mt-3 text-sm text-[#c8b3ec]">
          Utilize o menu para navegar entre as ferramentas. Cada secao respeita
          as permissoes configuradas via Supabase (tipos de usuario, grupos e
          roles por pagina).
        </p>
        {profile?.userType && (
          <div className="mt-4 inline-flex flex-wrap items-center gap-3 text-xs text-[#f5e9ff]">
            <span className="rounded-full border border-[#a855f7]/40 px-3 py-1">
              Tipo: {profile.userType.name}
            </span>
            {profile.userType.userGroup && (
              <span className="rounded-full border border-[#a855f7]/40 px-3 py-1">
                Grupo: {profile.userType.userGroup.name}
              </span>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Atalhos rapidos</h2>
        {availableLinks.length === 0 ? (
          <p className="rounded-lg border border-[#a855f7]/30 bg-[#34004e]/60 p-4 text-sm text-[#f1d9ff]">
            Nenhuma pagina disponivel para o seu perfil. Solicite ao
            administrador uma role em "Gerenciar perfis".
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {availableLinks.map((link) => (
              <Link
                key={link.id}
                to={link.to}
                className="group rounded-xl border border-[#4b1d7a]/60 bg-[#130226]/80 p-4 transition hover:border-[#a855f7]/60 hover:bg-[#1f0637]"
              >
                <span className="inline-flex items-center rounded-full border border-[#a855f7]/40 px-3 py-0.5 text-xs font-medium text-[#f5e9ff]">
                  {link.badge}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {link.title}
                </h3>
                <p className="mt-2 text-sm text-[#c8b3ec]">{link.description}</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-[#d3a6ff]">
                  Acessar
                  <svg
                    className="ml-2 h-4 w-4 transition group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                    <path d="m13 5 7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
