import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useConfirm } from '../contexts/ConfirmContext';
import { adminService } from '../services/admin.service';
import Skeleton from '../components/Skeleton';
import {
  CheckCircle2, XCircle, Clock, MoreHorizontal, MessageSquare,
  Eye, ChevronRight, DollarSign, User, AlertCircle, Loader2, Pencil, X, Search, ShoppingBag, RefreshCw, Phone, Save
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toString().padStart(3, '0');
const fmtTime = (d: string) => {
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '—';
    const now = new Date();
    const diffMs = now.getTime() - dt.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    return dt.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  } catch { return '—'; }
};

const phoneToWA = (phone: string): string => {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('52')) return digits;
  if (digits.length === 10) return '52' + digits;
  if (digits.length > 10) return '52' + digits.slice(-10);
  return '52' + digits;
};

// ─── Order Card ───────────────────────────────────────────────────────────────

const OrderCard = ({
  purchase,
  onPay,
  onSetPending,
  onRelease,
  onEdit,
  paying,
}: {
  purchase: any;
  onPay: (p: any) => void;
  onSetPending: (id: string) => void;
  onRelease: (id: string) => void;
  onEdit: (p: any) => void;
  paying: string | null;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tickets: number[] = purchase.tickets?.map((t: any) => t.number) ?? [];
  const visibleTickets = expanded ? tickets : tickets.slice(0, 5);
  const hasMore = tickets.length > 5;
  const isPaid = purchase.status === 'paid';
  const isCancelled = purchase.status === 'cancelled';
  const hasProof = !!purchase.paymentProofUrl;
  const verStatus = purchase.verificationStatus as string | undefined;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const waMessage = encodeURIComponent(
    `✅ ¡Hola ${purchase.user?.name ?? ''}! Tu pago fue confirmado correctamente.\n\n` +
    `¡Gracias por participar! Mucha suerte 🍀`
  );
  const waLink = `https://wa.me/${phoneToWA(purchase.user?.phone ?? '')}?text=${waMessage}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`list-card relative border-l-4 transition-colors ${menuOpen ? 'z-20 shadow-2xl overflow-visible' : 'z-10'
        } ${isPaid ? 'border-emerald-500 bg-white' :
          isCancelled ? 'border-slate-300 opacity-50 bg-slate-50' :
            'border-amber-400 bg-white shadow-md'
        }`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="font-black text-slate-800 text-sm flex items-center gap-2">
              {purchase.user?.name ?? '—'}
              <span className="text-[10px] font-bold text-slate-400">{fmtTime(purchase.createdAt)}</span>
            </p>
            <p className="text-[11px] text-slate-400">{purchase.user?.phone ?? ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {isPaid ? (
              <span className="badge-green h-6 flex items-center"><CheckCircle2 size={10} className="mr-1" /> Pagado</span>
            ) : isCancelled ? (
              <span className="badge-red h-6 flex items-center"><XCircle size={10} className="mr-1" /> Liberado</span>
            ) : (
              <span className="badge-amber h-6 flex items-center animate-pulse"><Clock size={10} className="mr-1" /> Pendiente</span>
            )}
          </div>
        </div>

        <p className="text-[10px] font-black text-blue-500 uppercase tracking-wide truncate">{purchase.raffle?.title ?? ''}</p>

        <div className="flex flex-wrap gap-1">
          {visibleTickets.map((n: number) => (
            <span key={n} className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-600">
              #{fmt(n)}
            </span>
          ))}
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] font-black text-blue-500 px-1 hover:underline transition-all"
            >
              {expanded ? 'Ver menos' : `+${tickets.length - 5} más`}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-50 pt-2 bg-slate-50/50 -mx-4 px-4 py-2 mt-1">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black text-slate-800">${(purchase.totalAmount ?? 0).toLocaleString()}</span>

            {hasProof && (
              <button
                onClick={() => setShowProof(true)}
                className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors shadow-sm active:scale-90"
              >
                <Eye size={18} />
              </button>
            )}

            {verStatus === 'auto_verified' && (
              <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                Banxico ✓
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {!isPaid && !isCancelled && (
              <button
                onClick={() => onPay(purchase)}
                disabled={paying === purchase.id}
                className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white h-11 px-5 rounded-2xl text-xs font-black shadow-lg shadow-emerald-100 flex items-center gap-2 transition-all"
              >
                {paying === purchase.id ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
                Confirmar
              </button>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-11 h-11 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-500 rounded-2xl flex items-center justify-center transition-all"
              >
                <MoreHorizontal size={20} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 bottom-full mb-3 w-56 bg-white/95 backdrop-blur-xl rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-2 z-[100] overflow-hidden"
                  >
                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Acciones de orden</p>

                    <button
                      onClick={() => { onEdit(purchase); setMenuOpen(false); }}
                      className="w-full px-4 py-3.5 text-left text-xs font-black text-slate-700 hover:bg-slate-50 flex items-center gap-3.5 transition-all rounded-2xl group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Pencil size={14} />
                      </div>
                      Editar datos
                    </button>

                    <button
                      onClick={() => { onRelease(purchase.id); setMenuOpen(false); }}
                      className="w-full px-4 py-3.5 text-left text-xs font-black text-red-600 hover:bg-red-50 flex items-center gap-3.5 transition-all rounded-2xl group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <XCircle size={14} />
                      </div>
                      Liberar boletos
                    </button>

                    <div className="h-px bg-slate-50 my-1 mx-2" />

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="w-full px-4 py-3.5 text-left text-xs font-black text-emerald-600 hover:bg-emerald-50/50 flex items-center gap-3.5 transition-all rounded-2xl group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <MessageSquare size={14} />
                      </div>
                      Enviar WhatsApp
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Proof Viewer Overlay */}
      <AnimatePresence>
        {showProof && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProof(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Comprobante</span>
                <button onClick={() => setShowProof(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto bg-slate-50 p-2 text-center">
                {purchase.paymentProofUrl ? (
                  <img src={purchase.paymentProofUrl} alt="Comprobante" className="w-full h-auto rounded-xl inline-block" />
                ) : (
                  <div className="p-10 text-slate-300">Sin imagen</div>
                )}
              </div>
              <div className="p-4 flex gap-2">
                <button
                  onClick={() => { onPay(purchase); setShowProof(false); }}
                  className="flex-1 bg-emerald-500 text-white h-12 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-emerald-100"
                >
                  Confirmar Pago
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { showConfirm } = useConfirm();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all' | 'paid'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);

  const loadData = async (f: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = f === 'all' ? {} : { status: f };
      const data = await adminService.getPurchases(params);

      const pList = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);

      setPurchases(pList);
    } catch (e: any) {
      console.error('Error loading dashboard data:', e);
      setError(e.message || 'Error de conexión con el servidor');
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(filter); }, [filter]);

  const getFrontendBaseUrl = () => {
    const env = (import.meta as any).env?.VITE_FRONTEND_URL;
    if (env && typeof env === 'string' && env.trim()) return env.replace(/\/$/, '');
    const currentOrigin = window.location.origin;
    if (currentOrigin.includes('admin')) {
      return currentOrigin.replace(/admin\./, '').replace('/admin', '');
    }
    return currentOrigin;
  };

  const handlePay = (purchase: any) => {
    const id = purchase.id;
    showConfirm({
      message: '¿Confirmar este pago ahora?',
      onConfirm: async () => {
        setPaying(id);
        const originalData = [...purchases];
        setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: 'paid' } : p));

        try {
          await adminService.updatePurchaseStatus(id, 'paid');
          toast.success('¡Pago confirmado!');

          // Preparar mensaje de WhatsApp profesional
          const baseUrl = getFrontendBaseUrl();
          const ticketLink = `${baseUrl}/#comprobante?purchase=${id}`;
          const verifyLink = `${baseUrl}/#verify`;

          const ticketsList = purchase.tickets
            ? purchase.tickets.map((t: any) => `#${t.number.toString().padStart(3, '0')}`).join(', ')
            : 'Confirmados';

          const waMessage =
            `✅ ¡Hola ${purchase.user?.name ?? ''}! Tu pago ha sido confirmado correctamente.\n\n` +
            `¡Gracias por participar! 🎟️\n\n` +
            `🎫 *Boletos:* ${ticketsList}\n` +
            `📍 *Boleto Digital:* ${ticketLink}\n` +
            `🔗 *Verificar:* ${verifyLink}\n\n` +
            `¡Mucha suerte! 🍀`;

          const waLink = `https://api.whatsapp.com/send?phone=${phoneToWA(purchase.user?.phone ?? '')}&text=${encodeURIComponent(waMessage)}`;

          // Lógica robusta para abrir WhatsApp
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile) {
            window.location.assign(waLink);
          } else {
            const win = window.open(waLink, '_blank', 'noopener,noreferrer');
            if (!win || win.closed || typeof win.closed === 'undefined') {
              setTimeout(() => {
                window.location.assign(waLink);
              }, 1000);
            }
          }

          if (filter === 'pending') {
            setTimeout(() => {
              setPurchases(prev => prev.filter(p => p.id !== id));
            }, 400);
          }
        } catch (e) {
          setPurchases(originalData);
          toast.error('No se pudo confirmar el pago');
          throw e;
        } finally {
          setPaying(null);
        }
      },
    });
  };

  const handleRelease = (id: string) => {
    showConfirm({
      message: '¿Liberar estos boletos? La orden se cancelará.',
      onConfirm: async () => {
        const originalData = [...purchases];
        setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelled' } : p));
        try {
          await adminService.updatePurchaseStatus(id, 'cancelled');
          toast.success('Orden liberada');
          if (filter !== 'all') {
            setTimeout(() => {
              setPurchases(prev => prev.filter(p => p.id !== id));
            }, 400);
          }
        } catch (e) {
          setPurchases(originalData);
          toast.error('Error al liberar');
          throw e;
        }
      },
    });
  };

  const handleSetPending = (id: string) => {
    adminService.updatePurchaseStatus(id, 'pending').then(() => {
      setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: 'pending' } : p));
      toast.success('Regresado a pendiente');
    });
  };

  const pendingCount = Array.isArray(purchases) ? purchases.filter(p => p?.status === 'pending').length : 0;

  const filters = [
    { id: 'pending', label: 'Pendientes', color: 'bg-amber-500' },
    { id: 'all', label: 'Todas', color: 'bg-blue-500' },
    { id: 'paid', label: 'Pagadas', color: 'bg-emerald-500' }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Panel Principal</h2>
          <p className="section-sub">Resumen de actividad reciente</p>
        </div>
        {pendingCount > 0 && filter === 'pending' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl flex items-center gap-2 shadow-sm"
          >
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-tight">{pendingCount} Pendientes</span>
          </motion.div>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl overflow-x-auto scrollbar-none">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`flex-1 min-h-[40px] px-5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${filter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Main List */}
      <div className="space-y-3 min-h-[200px]">
        {isLoading ? (
          <Skeleton count={5} className="h-44 w-full" />
        ) : error ? (
          <div className="admin-card p-10 text-center border-red-100 bg-red-50/30">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="font-bold text-slate-800">No se pudieron cargar los datos</h3>
            <p className="text-xs text-slate-500 mt-2 mb-6 max-w-xs mx-auto">{error}</p>
            <button
              onClick={() => loadData(filter)}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 mx-auto active:scale-95 transition-all"
            >
              <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {(!purchases || purchases.length === 0) ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="admin-card p-16 text-center"
              >
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={40} />
                </div>
                <p className="text-slate-500 font-bold">¡Todo al día!</p>
                <p className="text-xs text-slate-400 mt-1">No hay órdenes en esta categoría</p>
              </motion.div>
            ) : (
              <LayoutGroup>
                {purchases.map(p => (
                  <OrderCard
                    key={p.id}
                    purchase={p}
                    onPay={handlePay}
                    onSetPending={handleSetPending}
                    onRelease={handleRelease}
                    onEdit={(p) => setEditTarget(p)}
                    paying={paying}
                  />
                ))}
              </LayoutGroup>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Edit Modal (Lightweight) */}
      <AnimatePresence>
        {editTarget && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditTarget(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-800">Editar Datos</h3>
                <button onClick={() => setEditTarget(null)} className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Cliente</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      className="admin-input pl-11"
                      value={editTarget.user?.name || ''}
                      onChange={e => setEditTarget({ ...editTarget, user: { ...editTarget.user, name: e.target.value } })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono (WhatsApp)</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      className="admin-input pl-11"
                      value={editTarget.user?.phone || ''}
                      onChange={e => setEditTarget({ ...editTarget, user: { ...editTarget.user, phone: e.target.value.replace(/\D/g, '').slice(0, 10) } })}
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex gap-3">
                  <AlertCircle className="text-blue-500 flex-shrink-0" size={18} />
                  <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                    Al modificar estos datos, se actualizarán en todas las órdenes actuales de este cliente.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditTarget(null)}
                    className="flex-1 h-12 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        setIsSaving(true);
                        await adminService.updateUser(editTarget.user.id, {
                          name: editTarget.user.name,
                          phone: editTarget.user.phone
                        });
                        toast.success('Datos actualizados');
                        loadData(filter);
                        setEditTarget(null);
                      } catch (e) {
                        toast.error('Error al guardar cambios');
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                    className="flex-[2] h-12 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
};

export default Dashboard;
