import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Home,
  Ticket,
  ShoppingCart,
  Users,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      path: '/',
      label: 'Inicio',
      icon: Home
    },
    {
      path: '/raffles',
      label: 'Rifas',
      icon: Ticket
    },
    {
      path: '/tickets',
      label: 'Boletos',
      icon: Ticket
    },
    {
      path: '/purchases',
      label: 'Compras',
      icon: ShoppingCart
    },
    {
      path: '/users',
      label: 'Usuarios',
      icon: Users
    },
    {
      path: '/settings',
      label: 'Ajustes',
      icon: SettingsIcon
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F0F4FF] overflow-x-hidden">
      {/* Top Header */}
      <header className="glass sticky top-0 z-40 border-b border-slate-200/60 pt-safe">
        <div className="flex items-center justify-between h-14 min-h-[44px] px-4 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
              <span className="text-white font-black text-sm italic">N</span>
            </div>
            <div className="leading-none">
              <p className="font-black text-sm text-slate-800 tracking-tight">RIFAS NAO</p>
              <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">Admin</p>
            </div>
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            <div className="text-right leading-none hidden sm:block">
              <p className="text-xs font-bold text-slate-700">{admin?.name}</p>
              <p className="text-[10px] text-slate-400">{admin?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-500 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="px-4 py-4 pb-24 max-w-2xl mx-auto w-full min-w-0 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-slate-200/60 pb-safe overflow-x-auto scrollbar-none">
        <div className="flex items-center justify-around max-w-full px-2 min-w-0">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`tab-item min-w-[64px] ${active ? 'active' : ''}`}
              >
                <span className={`transition-transform ${active ? 'scale-110' : ''}`}>
                  <Icon size={20} className={active ? 'fill-indigo-600/10' : ''} />
                </span>
                <span
                  className={`text-[9px] font-bold tracking-tight text-center ${active ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                >
                  {item.label}
                </span>
                {active && (
                  <span className="absolute bottom-0 w-6 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;

