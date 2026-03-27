import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  Home,
  Ticket,
  Settings as SettingsIcon,
  LogOut,
  AlertTriangle,
} from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, admin } = useAuth();

  const planDaysLeft = (() => {
    if (admin?.planType !== 'mensual' || !admin?.planExpiryDate) return null;
    const diff = new Date(admin.planExpiryDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  })();
  const showPlanWarning = planDaysLeft !== null && planDaysLeft <= 3 && planDaysLeft >= 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handler = (event: MessageEvent) => {
        if (event.data && event.data.type === 'PUSH_RECEIVED') {
          // Mostrar aviso visual inmediato
          toast.success(event.data.title || 'Nueva Notificación', {
            duration: 6000,
            icon: '🔔'
          });

          // Intentar reproducir sonido (específico o default si fallara)
          const audio = new Audio('/admin/notification.mp3');
          audio.play().catch(() => {
            console.log('🔊 El navegador requiere interacción previa para sonar o el archivo no existe.');
          });
        }
      };
      navigator.serviceWorker.addEventListener('message', handler);
      return () => navigator.serviceWorker.removeEventListener('message', handler);
    }
  }, []);

  const navItems = [
    { path: '/', label: 'Órdenes', icon: Home },
    { path: '/raffles', label: 'Rifas', icon: Ticket },
    { path: '/settings', label: 'Ajustes', icon: SettingsIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFF] selection:bg-blue-100 selection:text-blue-600">

      {/* ── Sidebar (desktop only) ─────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 z-40 bg-white border-r border-slate-200/60 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100 shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-black/5 overflow-hidden">
            <img
              src="/admin/bismark.png"
              alt="B"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="leading-none">
            <p className="font-black text-[9px] text-slate-400 tracking-[0.2em] uppercase">Bismark</p>
            <p className="font-black text-sm text-slate-800 tracking-tight mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-3 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Navegación</p>
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-sm transition-all group
                  ${active
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 3 : 2}
                  className={`transition-transform ${active ? '' : 'group-hover:scale-110'}`}
                />
                {item.label}
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin info + Logout */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-2 shrink-0">
          {admin?.name && (
            <div className="px-4 py-2">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Sesión activa</p>
              <p className="text-xs font-bold text-slate-600 mt-0.5 truncate">{admin.name}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 font-black text-sm transition-all group"
          >
            <LogOut size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────────── */}
      <div className="flex flex-col min-h-[100dvh] lg:pl-60">

        {/* Top Header — mobile only */}
        <header className="glass sticky top-0 z-40 border-b border-slate-200/50 pt-safe lg:hidden">
          <div className="flex items-center justify-between h-16 px-5 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl shadow-black/10 overflow-hidden group transition-all active:scale-90">
                <img
                  src="/admin/bismark.png"
                  alt="B"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <div className="leading-none">
                <p className="font-black text-[10px] text-slate-400 tracking-[0.2em] uppercase">Bismark</p>
                <p className="font-black text-sm text-slate-800 tracking-tight mt-0.5">Admin</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all active:scale-90"
            >
              <LogOut size={18} strokeWidth={2.5} />
            </button>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex items-center justify-between h-16 px-8 bg-white border-b border-slate-200/50 sticky top-0 z-30">
          <div>
            <h1 className="font-black text-slate-800 text-base tracking-tight">
              {navItems.find(n => isActive(n.path))?.label ?? 'Panel'}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Panel de administración</p>
          </div>
          {showPlanWarning && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl">
              <AlertTriangle size={16} className="text-amber-500 shrink-0" />
              <p className="text-xs font-bold text-amber-800">
                {planDaysLeft === 0
                  ? 'Tu plan vence hoy.'
                  : `Plan vence en ${planDaysLeft} día${planDaysLeft !== 1 ? 's' : ''}.`}
              </p>
            </div>
          )}
        </header>

        {/* Plan warning banner — mobile only */}
        <AnimatePresence>
          {showPlanWarning && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-50 border-b border-amber-200 overflow-hidden lg:hidden"
            >
              <div className="flex items-center gap-3 px-5 py-3 max-w-2xl mx-auto">
                <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                <p className="text-sm font-bold text-amber-800">
                  {planDaysLeft === 0
                    ? 'Tu plan mensual vence hoy. Contacta al administrador para renovarlo.'
                    : `Tu plan mensual vence en ${planDaysLeft} día${planDaysLeft !== 1 ? 's' : ''}. Contacta al administrador para renovarlo.`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 pb-32 lg:max-w-6xl lg:px-8 lg:py-8 lg:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom navigation — mobile only */}
        <nav className="bottom-tab-nav fixed bottom-0 left-0 right-0 z-50 glass border-t border-slate-200/50 pb-safe lg:hidden">
          <div className="flex items-center justify-between max-w-2xl mx-auto h-16 px-2">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all text-center relative group py-2 rounded-2xl ${active ? 'text-[#2563EB]' : 'text-slate-400'}`}
                >
                  <motion.div
                    animate={{ y: active ? -2 : 0 }}
                    className={`flex items-center justify-center relative ${active ? 'after:content-[""] after:absolute after:-inset-2 after:bg-blue-50 after:rounded-full after:-z-10' : ''}`}
                  >
                    <Icon size={20} strokeWidth={active ? 3 : 2} />
                  </motion.div>
                  <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity ${active ? 'opacity-100' : 'opacity-60 grayscale'}`}>
                    {item.label}
                  </span>

                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute bottom-0 w-8 h-1 bg-[#2563EB] rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <style>{`
        .glass {
           backdrop-filter: blur(20px);
           -webkit-backdrop-filter: blur(20px);
           background-color: rgba(255, 255, 255, 0.85);
        }
        @media (max-width: 1023px) {
          main {
            min-height: calc(100vh - 4rem - 4rem);
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
