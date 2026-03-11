import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';
import {
  Home,
  Ticket,
  Settings as SettingsIcon,
  Bell,
  BellOff,
  Users,
  ShoppingBag,
  LogOut,
  Zap
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
    { path: '/', label: 'Órdenes', icon: Home },
    { path: '/raffles', label: 'Rifas', icon: Ticket },
    { path: '/settings', label: 'Ajustes', icon: SettingsIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFF] flex flex-col overflow-x-hidden selection:bg-blue-100 selection:text-blue-600">
      {/* Top Header */}
      <header className="glass sticky top-0 z-40 border-b border-slate-200/50 pt-safe">
        <div className="flex items-center justify-between h-16 px-5 max-w-2xl mx-auto w-full">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 border border-slate-100 overflow-hidden group transition-all active:scale-90">
              <img
                src="/admin/bismark.png"
                alt="B"
                className="w-7 h-7 object-contain group-hover:scale-110 transition-transform"
              />
            </div>
            <div className="leading-none">
              <p className="font-black text-[10px] text-slate-400 tracking-[0.2em] uppercase">Bismark</p>
              <p className="font-black text-sm text-slate-800 tracking-tight mt-0.5">Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Stats or Status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl mr-2">
              <Zap size={14} className="text-blue-500 fill-blue-500" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Optimized UI</span>
            </div>

            {/* Notifications */}
            {isSupported && permission !== 'denied' && (
              <button
                onClick={subscribed ? unsubscribe : subscribe}
                disabled={pushLoading}
                className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${subscribed ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'
                  }`}
              >
                <Bell size={18} strokeWidth={2.5} />
                {subscribed && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white" />}
              </button>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all active:scale-90"
            >
              <LogOut size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content with Page Transitions */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 pb-32">
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

      {/* Modern Bottom Navigation */}
      <nav className="bottom-tab-nav fixed bottom-0 left-0 right-0 z-50 glass border-t border-slate-200/50 pb-safe">
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

      {/* Global CSS for safer areas */}
      <style>{`
        .glass {
           backdrop-filter: blur(20px);
           -webkit-backdrop-filter: blur(20px);
           background-color: rgba(255, 255, 255, 0.85);
        }
        main {
           min-height: calc(100vh - 4rem - 4rem);
        }
      `}</style>
    </div>
  );
};

export default Layout;
