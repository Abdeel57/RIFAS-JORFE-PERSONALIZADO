import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? '0' : '2'} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        </svg>
      ),
    },
    {
      path: '/raffles',
      label: 'Rifas',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? '0' : '2'} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
          <line x1="12" y1="12" x2="12" y2="16" />
          <line x1="10" y1="14" x2="14" y2="14" />
        </svg>
      ),
    },
    {
      path: '/tickets',
      label: 'Boletos',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? '0' : '2'} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9a3 3 0 010-6h20a3 3 0 010 6H2zM2 15a3 3 0 000 6h20a3 3 0 000-6H2z" />
        </svg>
      ),
    },
    {
      path: '/purchases',
      label: 'Compras',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? '0' : '2'} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6" />
        </svg>
      ),
    },
    {
      path: '/users',
      label: 'Usuarios',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? '0' : '2'} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F0F4FF]">
      {/* Top Header */}
      <header className="glass sticky top-0 z-40 border-b border-slate-200/60">
        <div className="flex items-center justify-between h-14 px-4">
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
      <main className="px-4 py-4 pb-24 max-w-2xl mx-auto">
        <Outlet />
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-slate-200/60 pb-safe">
        <div className="flex items-center justify-around max-w-2xl mx-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`tab-item ${active ? 'active' : ''}`}
              >
                <span className={`transition-transform ${active ? 'scale-110' : ''}`}>
                  {item.icon(active)}
                </span>
                <span
                  className={`text-[10px] font-bold tracking-wide ${active ? 'text-indigo-600' : 'text-slate-400'
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
