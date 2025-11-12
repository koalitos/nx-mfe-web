import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    visibility: 'authenticated',
    pageKey: 'dashboard.home',
  },
  {
    id: 'login',
    label: 'Login',
    path: '/login',
    visibility: 'guests',
  },
  {
    id: 'register',
    label: 'Registrar',
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

  const items = NAV_ITEMS.filter((item) => {
    const matchesVisibility = shouldRender(
      item.visibility,
      isAuthenticated
    );
    if (!matchesVisibility) {
      return false;
    }
    if (item.pageKey && isAuthenticated) {
      return canAccessPage(item.pageKey);
    }
    return true;
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className={`rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-2 text-sm text-white shadow-lg shadow-slate-950/40 ${className}`}
      aria-label="Menu principal"
    >
      <ul className="flex flex-wrap items-center gap-3">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li key={item.id}>
              <Link
                to={item.path}
                className={`inline-flex items-center rounded-md px-3 py-1 transition ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-200'
                    : 'text-slate-200 hover:text-white hover:bg-slate-800/60'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
