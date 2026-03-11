import { useEffect, useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../contexts/ConfirmContext';
import { adminService } from '../services/admin.service';
import Skeleton from '../components/Skeleton';

const Purchases = () => {
  const { showConfirm } = useConfirm();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [raffles, setRaffles] = useState<any[]>([]);
  const [filters, setFilters] = useState({ status: '', raffleId: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { loadRaffles(); }, []);
  useEffect(() => { loadPurchases(); }, [filters]);

  const loadRaffles = async () => {
    try {
      const data = await adminService.getRaffles();
      setRaffles(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadPurchases = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.raffleId) params.raffleId = filters.raffleId;
      const data = await adminService.getPurchases(params);
      setPurchases(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = (purchaseId: string, status: 'pending' | 'paid' | 'cancelled', paymentMethod?: string, paymentReference?: string) => {
    const msg = status === 'paid' ? '¿Confirmar pago?' : status === 'cancelled' ? '¿Cancelar / liberar esta compra?' : status === 'pending' ? '¿Marcar como pendiente?' : '¿Guardar cambios?';

    showConfirm({
      message: msg,
      onConfirm: async () => {
        const previousPurchases = [...purchases];

        // Optimistic update
        setPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, status } : p));
        setUpdatingId(purchaseId);

        try {
          await adminService.updatePurchaseStatus(purchaseId, status, paymentMethod, paymentReference);

          if (status === 'paid') {
            const updated = await adminService.getPurchaseById(purchaseId);
            setSelectedPurchase(updated);
            // Update local state with fresh data from server
            setPurchases(prev => prev.map(p => p.id === purchaseId ? updated : p));
            toast.success('Pago confirmado correctamente');

            // AUTOMATIC WHATSAPP REDIRECTION
            handleSendWhatsApp(updated);
          } else {
            setSelectedPurchase(null);
            toast.success(status === 'cancelled' ? 'Compra cancelada' : 'Marcada como pendiente');
            // If the filter is applied and status changed, it might need to disappear from the list
            if (filters.status && filters.status !== status) {
              setPurchases(prev => prev.filter(p => p.id !== purchaseId));
            }
          }
        } catch (error: any) {
          // Revert on error
          setPurchases(previousPurchases);
          toast.error(error.response?.data?.error || 'Error al actualizar la compra');
        } finally {
          setUpdatingId(null);
        }
      },
    });
  };

  const handleViewDetails = async (id: string) => {
    try {
      const purchase = await adminService.getPurchaseById(id);
      setSelectedPurchase(purchase);
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'paid') return <span className="badge-green">Pagado</span>;
    if (status === 'pending') return <span className="badge-amber">Pendiente</span>;
    return <span className="badge-red">Cancelado</span>;
  };

  const getFrontendBaseUrl = () => {
    const env = (import.meta as any).env?.VITE_FRONTEND_URL;
    if (env && typeof env === 'string' && env.trim()) return env.replace(/\/$/, '');

    // En producción: frontend en mismo dominio (/) → usar origin
    if (window.location.hostname !== 'localhost') {
      return window.location.origin;
    }

    const currentOrigin = window.location.origin;
    if (currentOrigin.includes('admin')) {
      return currentOrigin.replace(/admin\./, '').replace('/admin', '');
    }
    return currentOrigin;
  };

  const buildWhatsAppMessage = (purchase: any) => {
    const baseUrl = getFrontendBaseUrl();
    const ticketLink = `${baseUrl}/#comprobante?purchase=${purchase.id}`;
    const verifyLink = `${baseUrl}/#verify`;

    const ticketsList = purchase.tickets
      ? purchase.tickets.map((t: any) => `#${t.number.toString().padStart(3, '0')}`).join(', ')
      : 'Confirmados';

    return `✅ ¡Hola ${purchase.user?.name ?? ''}! Tu pago ha sido confirmado correctamente.\n\n` +
      `¡Gracias por participar! 🎟️\n\n` +
      `🎫 *Boletos:* ${ticketsList}\n` +
      `📍 *Boleto Digital:* ${ticketLink}\n` +
      `🔗 *Verificar:* ${verifyLink}\n\n` +
      `¡Mucha suerte! 🍀`;
  };

  const formatPhoneForWhatsApp = (phone: string): string => {
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('52')) return digits;
    if (digits.length === 10) return '52' + digits;
    if (digits.length > 10) return '52' + digits.slice(-10);
    return '52' + digits;
  };

  const handleSendWhatsApp = (purchase: any) => {
    const phone = formatPhoneForWhatsApp(purchase.user.phone);
    const msg = buildWhatsAppMessage(purchase);
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;

    // Lógica robusta para evitar bloqueos de popups y mejorar experiencia en móvil
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // En móvil es mejor redirigir directamente para que abra la app
      window.location.assign(url);
    } else {
      // En desktop intentamos abrir nueva pestaña
      const win = window.open(url, '_blank', 'noopener,noreferrer');

      // Si el navegador bloqueó el popup
      if (!win || win.closed || typeof win.closed === 'undefined') {
        toast.success('Redirigiendo a WhatsApp...');
        setTimeout(() => {
          window.location.assign(url);
        }, 1000);
      } else {
        toast.success('Abriendo WhatsApp en una nueva pestaña');
      }
    }
  };

  const handleCopyMessage = (purchase: any) => {
    const msg = buildWhatsAppMessage(purchase);
    navigator.clipboard.writeText(msg);
    toast.success('Mensaje copiado');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="section-title">Compras</h2>
        <p className="section-sub">Gestiona compras y pagos</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="admin-input">
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Pagado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <select value={filters.raffleId} onChange={(e) => setFilters({ ...filters, raffleId: e.target.value })} className="admin-input">
          <option value="">Todas las rifas</option>
          {raffles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
      </div>

      {/* Card list */}
      <div className="space-y-3">
        {isLoading ? (
          <Skeleton count={5} className="h-32 w-full" />
        ) : (
          <AnimatePresence mode="popLayout">
            {purchases.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="admin-card p-10 text-center"
              >
                <p className="text-slate-400 text-sm">No hay compras que mostrar</p>
              </motion.div>
            ) : (
              purchases.map((purchase) => (
                <motion.div
                  key={purchase.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}
                  className={`list-card transition-opacity ${updatingId === purchase.id ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm">{purchase.user.name}</p>
                      <p className="text-[11px] text-slate-400">{purchase.user.phone}</p>
                    </div>
                    {getStatusBadge(purchase.status)}
                  </div>

                  <div className="text-xs text-slate-500">
                    <span className="font-semibold">{purchase.raffle.title}</span>
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span>{purchase.tickets.map((t: any) => `#${t.number.toString().padStart(3, '0')}`).join(', ')}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                      <p className="font-black text-slate-800 text-sm">${purchase.totalAmount.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">{new Date(purchase.createdAt).toLocaleDateString('es-MX')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleViewDetails(purchase.id)} className="min-h-[44px] px-3 py-2 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-[#2563EB] rounded-xl text-xs font-bold transition-all active:scale-95 touch-manipulation">
                        Ver
                      </button>
                      {purchase.status === 'pending' ? (
                        <>
                          <button onClick={() => handleUpdateStatus(purchase.id, 'paid')} className="min-h-[44px] px-3 py-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-600 rounded-xl text-xs font-bold transition-all active:scale-95 touch-manipulation">
                            ✓ Pagar
                          </button>
                          <button onClick={() => handleUpdateStatus(purchase.id, 'cancelled')} className="min-h-[44px] px-3 py-2 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-500 rounded-xl text-xs font-bold transition-all active:scale-95 touch-manipulation">
                            ✕
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleUpdateStatus(purchase.id, 'cancelled')} className="min-h-[44px] px-3 py-2 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-600 rounded-xl text-xs font-bold transition-all active:scale-95 touch-manipulation">
                          Liberar
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedPurchase && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPurchase(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85dvh] overflow-y-auto overflow-x-hidden overscroll-contain relative z-10"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 bg-white rounded-t-3xl sm:rounded-t-2xl shrink-0">
                <h3 className="text-lg font-black text-slate-800 truncate min-w-0">Detalle de Compra</h3>
                <button onClick={() => setSelectedPurchase(null)} className="w-10 h-10 min-w-[44px] min-h-[44px] shrink-0 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full flex items-center justify-center text-slate-500 touch-manipulation transition-colors">✕</button>
              </div>
              <div className="p-5 pb-safe space-y-4">
                {/* User */}
                <div className="admin-card p-4 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</p>
                  <p className="font-bold text-slate-800">{selectedPurchase.user.name}</p>
                  <p className="text-sm text-slate-500">{selectedPurchase.user.phone}</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                    WhatsApp: +{formatPhoneForWhatsApp(selectedPurchase.user.phone)}
                  </p>
                  <p className="text-sm text-slate-500">{selectedPurchase.user.email}</p>
                </div>
                {/* Raffle */}
                <div className="admin-card p-4 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rifa</p>
                  <p className="font-bold text-slate-800">{selectedPurchase.raffle.title}</p>
                </div>
                {/* Tickets */}
                <div className="admin-card p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Boletos ({selectedPurchase.tickets.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPurchase.tickets.map((ticket: any) => (
                      <span key={ticket.id} className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-sm font-black text-blue-700">
                        #{ticket.number.toString().padStart(3, '0')}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Comprobante de pago */}
                {selectedPurchase.paymentProofUrl && (
                  <div className="admin-card p-4 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comprobante de pago</p>
                    <img
                      src={selectedPurchase.paymentProofUrl}
                      alt="Comprobante"
                      className="w-full max-h-60 object-contain rounded-xl border border-slate-100 bg-slate-50"
                    />
                  </div>
                )}
                {/* Total & Status */}
                <div className="flex items-center justify-between admin-card p-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                    <p className="text-2xl font-black text-slate-800">${selectedPurchase.totalAmount.toLocaleString()}</p>
                  </div>
                  {getStatusBadge(selectedPurchase.status)}
                </div>
                {/* Enviar por WhatsApp (solo compras pagadas) */}
                {selectedPurchase.status === 'paid' && (
                  <div className="admin-card p-4 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmar al cliente</p>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-700 whitespace-pre-wrap font-medium">
                      {buildWhatsAppMessage(selectedPurchase)}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendWhatsApp(selectedPurchase)}
                        className="flex-1 min-h-[44px] flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white font-black py-3 rounded-xl text-sm transition-all"
                      >
                        Enviar WhatsApp
                      </button>
                      <button
                        onClick={() => handleCopyMessage(selectedPurchase)}
                        className="min-h-[44px] px-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 font-black py-3 rounded-xl text-sm transition-all"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                )}
                {/* Actions */}
                <div className="flex gap-3">
                  {selectedPurchase.status === 'pending' && (
                    <>
                      <button onClick={() => handleUpdateStatus(selectedPurchase.id, 'paid')} className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-3 rounded-xl text-sm transition-all">
                        ✓ Pagar
                      </button>
                      <button onClick={() => handleUpdateStatus(selectedPurchase.id, 'cancelled')} className="flex-1 min-h-[44px] bg-red-50 hover:bg-red-100 active:scale-95 text-red-500 font-black py-3 rounded-xl text-sm transition-all">
                        Cancelar
                      </button>
                    </>
                  )}
                  {selectedPurchase.status === 'paid' && (
                    <>
                      <button onClick={() => handleUpdateStatus(selectedPurchase.id, 'pending')} className="flex-1 min-h-[44px] bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black py-3 rounded-xl text-sm transition-all">
                        Pendiente
                      </button>
                      <button onClick={() => handleUpdateStatus(selectedPurchase.id, 'cancelled')} className="flex-1 min-h-[44px] bg-red-50 hover:bg-red-100 active:scale-95 text-red-500 font-black py-3 rounded-xl text-sm transition-all">
                        Liberar
                      </button>
                    </>
                  )}
                  {selectedPurchase.status === 'cancelled' && (
                    <button onClick={() => handleUpdateStatus(selectedPurchase.id, 'pending')} className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black py-3 rounded-xl text-sm transition-all">
                      Reactivar
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Purchases;
