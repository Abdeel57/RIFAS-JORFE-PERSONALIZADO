import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';
import {
  Home,
  Ticket,
  Settings as SettingsIcon,
  Bell,
  BellOff,
} from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const { subscribed, loading: pushLoading, subscribe, unsubscribe, permission, isSupported } = usePushNotifications();

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
      path: '/settings',
      label: 'Configuración',
      icon: SettingsIcon
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#EEF4FF] overflow-x-hidden">
      {/* Top Header */}
      <header className="glass sticky top-0 z-40 border-b border-slate-200/60 pt-safe">
        <div className="flex items-center justify-between h-14 min-h-[44px] px-4 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            {/* Logo Bismark — B geométrica bold con flecha */}
            <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-md shadow-blue-300/60 flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* B — trazo bold moderno */}
                <path d="M6 4.5H12.5C14.2 4.5 15.5 5.8 15.5 7.5C15.5 9.2 14.2 10.5 12.5 10.5H6V4.5Z" fill="white" />
                <path d="M6 10.5H13C14.9 10.5 16.5 12.1 16.5 14C16.5 15.9 14.9 17.5 13 17.5H6V10.5Z" fill="rgba(255,255,255,0.65)" />
                <line x1="6" y1="4.5" x2="6" y2="17.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                {/* Flecha diagonal dinámica — acento Bismark */}
                <path d="M13.5 5L19 5L19 10.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="19" y1="5" x2="14" y2="10" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <div className="leading-none">
              <p className="font-black text-[10px] text-slate-400 tracking-widest uppercase leading-none">Sistema</p>
              <p className="font-black text-sm text-slate-800 tracking-tight leading-tight mt-0.5">Bismark</p>
            </div>
          </div>


          {/* User info + acciones */}
          <div className="flex items-center gap-2">
            {/* Botón de notificaciones push */}
            {isSupported && permission !== 'denied' && (
              <button
                onClick={subscribed ? unsubscribe : subscribe}
                disabled={pushLoading}
                title={subscribed ? 'Desactivar notificaciones' : 'Activar notificaciones push'}
                className={`relative flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold transition-all ${pushLoading ? 'opacity-50 cursor-not-allowed' :
                  subscribed
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-500'
                  }`}
              >
                {subscribed ? <Bell size={16} /> : <BellOff size={16} />}
                {subscribed && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
                )}
              </button>
            )}
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
      <nav className="bottom-tab-nav fixed bottom-0 left-0 right-0 z-50 glass border-t border-slate-200/60 pb-safe overflow-x-auto scrollbar-none">
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
                  <Icon size={20} className={active ? 'fill-blue-600/10' : ''} />
                </span>
                <span
                  className={`text-[9px] font-bold tracking-tight text-center ${active ? 'text-[#2563EB]' : 'text-slate-400'
                    }`}
                >
                  {item.label}
                </span>
                {active && (
                  <span className="absolute bottom-0 w-6 h-0.5 bg-[#2563EB] rounded-full" />
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

