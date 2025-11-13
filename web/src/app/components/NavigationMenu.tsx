import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NotificationBell } from './NotificationBell';

type NavVisibility = 'all' | 'authenticated' | 'guests';

type NavItem = {
  id: string;
  label: string;
  path: string;
  visibility: NavVisibility;
  pageKey?: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Visao geral',
    path: '/',
    visibility: 'authenticated',
    pageKey: 'dashboard.home',
  },
  {
    id: 'chat',
    label: 'Chat colaborativo',
    path: '/chat',
    visibility: 'authenticated',
    pageKey: 'dashboard.chat',
  },
  {
    id: 'access',
    label: 'Grupos & acesso',
    path: '/admin/access',
    visibility: 'authenticated',
    pageKey: 'dashboard.access',
  },
  {
    id: 'login',
    label: 'Entrar',
    path: '/login',
    visibility: 'guests',
  },
  {
    id: 'register',
    label: 'Criar conta',
    path: '/register',
    visibility: 'guests',
  },
];

const shouldRender = (visibility: NavVisibility, isAuthenticated: boolean) => {
  if (visibility === 'all') {
    return true;
  }
  if (visibility === 'authenticated') {
    return isAuthenticated;
  }
  if (visibility === 'guests') {
    return !isAuthenticated;
  }
  return false;
};

export const NavigationMenu = ({ className = '' }: { className?: string }) => {
  const { isAuthenticated, canAccessPage } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const items = NAV_ITEMS.filter((item) => {
    const matchesVisibility = shouldRender(item.visibility, isAuthenticated);
    if (!matchesVisibility) {
      return false;
    }
    if (item.pageKey && isAuthenticated) {
      return canAccessPage(item.pageKey);
    }
    return true;
  });

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className={className} aria-label="Menu principal">
      <div className="rounded-2xl border border-[#4d1d88]/50 bg-[#140021]/80 p-5 text-white shadow-[0_15px_80px_-20px_rgba(122,35,220,0.8)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#d3a6ff]">
              ZU console
            </p>
            <p className="text-lg font-semibold">Painel de navegacao</p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && <NotificationBell />}
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#4b1d7a] bg-[#1d0b33] text-white transition hover:border-[#a855f7] hover:text-[#d8b4fe] md:hidden"
              aria-expanded={isOpen}
              aria-label="Alternar menu"
            >
              <span className="sr-only">Abrir menu</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            </button>
          </div>
        </div>

        <ul
          className={`mt-5 flex flex-col gap-3 text-sm md:mt-6 md:flex-row md:flex-wrap md:items-center md:gap-3 ${
            isOpen ? 'flex' : 'hidden md:flex'
          }`}
        >
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`inline-flex w-full items-center justify-between rounded-xl border px-4 py-2 transition md:w-auto ${
                    isActive
                      ? 'border-[#a855f7]/50 bg-[#2a0a49]/80 text-[#f5e9ff]'
                      : 'border-transparent bg-[#160228]/80 text-[#cbb5ef] hover:border-[#a855f7]/40 hover:bg-[#25053d]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                  <svg
                    className="ml-3 h-4 w-4 opacity-70"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                    <path d="m13 5 7 7-7 7" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
