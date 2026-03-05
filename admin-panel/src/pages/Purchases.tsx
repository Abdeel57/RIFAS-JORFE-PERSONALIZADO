import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmContext';
import { adminService } from '../services/admin.service';

const Purchases = () => {
  const { showConfirm } = useConfirm();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [raffles, setRaffles] = useState<any[]>([]);
  const [filters, setFilters] = useState({ status: '', raffleId: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);

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
        try {
          await adminService.updatePurchaseStatus(purchaseId, status, paymentMethod, paymentReference);
          loadPurchases();
          if (status === 'paid') {
            const updated = await adminService.getPurchaseById(purchaseId);
            setSelectedPurchase(updated);
            toast.success('Pago confirmado. Puedes enviar la confirmación por WhatsApp.');
          } else {
            setSelectedPurchase(null);
            toast.success(status === 'cancelled' ? 'Compra cancelada' : status === 'pending' ? 'Marcada como pendiente' : 'Cambios guardados');
          }
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Error al actualizar la compra');
          throw error;
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

  /** URL base del frontend público (comprobante y verificador). Usa VITE_FRONTEND_URL si existe, sino origin. */
  const getFrontendBaseUrl = () => {
    const env = import.meta.env?.VITE_FRONTEND_URL;
    if (env && typeof env === 'string' && env.trim()) return env.replace(/\/$/, '');
    return 'https://naorifas.netlify.app';
  };

  /** Mensaje predefinido para enviar por WhatsApp al cliente (con emojis) */
  const buildWhatsAppMessage = (purchase: any) => {
    const tickets = purchase?.tickets ?? [];
    const ticketsShort = tickets.length > 5
      ? tickets.slice(0, 5).map((t: any) => `#${String(t.number).padStart(3, '0')}`).join(', ') + ` +${tickets.length - 5} más`
      : tickets.map((t: any) => `#${String(t.number).padStart(3, '0')}`).join(', ') || '—';
    const baseUrl = getFrontendBaseUrl();
    const comprobanteLink = `${baseUrl}/#comprobante?purchase=${purchase.id}`;

    return `✅ ¡Hola ${purchase.user?.name ?? ''}! Tu pago fue confirmado correctamente.\n\n` +
      `*Descarga tu boleto digital aquí:*\n${comprobanteLink}\n\n` +
      `¡Gracias por participar! Mucha suerte 🍀`;
  };

  /**
   * Normaliza un número de teléfono al formato internacional de México (+52)
   * para usarlo en links de wa.me. Ejemplos:
   *   '6622560890'    -> '526622560890'  OK
   *   '+526622560890' -> '526622560890'  OK
   *   '526622560890'  -> '526622560890'  OK
   */
  const formatPhoneForWhatsApp = (phone: string): string => {
    const digits = (phone || '').replace(/\D/g, '');
    // Si ya tiene código de país mexicano (52 + 10 dígitos = 12 dígitos)
    if (digits.length === 12 && digits.startsWith('52')) return digits;
    // Si tiene exactamente 10 dígitos (número local México)
    if (digits.length === 10) return '52' + digits;
    // Si tiene más de 10 dígitos, tomar los últimos 10 y agregar 52
    if (digits.length > 10) return '52' + digits.slice(-10);
    // Número incompleto: agregar 52 de todas formas
    return '52' + digits;
  };

  const handleSendWhatsApp = (purchase: any) => {
    const phone = formatPhoneForWhatsApp(purchase.user.phone);
    const msg = buildWhatsAppMessage(purchase);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp abierto con el mensaje listo');
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
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="w-10 h-10 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Cargando compras...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.length === 0 ? (
            <div className="admin-card p-10 text-center">
              <p className="text-slate-400 text-sm">No hay compras que mostrar</p>
            </div>
          ) : (
            purchases.map((purchase) => (
              <div key={purchase.id} className="list-card">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm">{purchase.user.name}</p>
                    <p className="text-[11px] text-slate-400">{purchase.user.phone}</p>
                  </div>
                  {getStatusBadge(purchase.status)}
                </div>

                {/* Raffle & tickets */}
                <div className="text-xs text-slate-500">
                  <span className="font-semibold">{purchase.raffle.title}</span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span>{purchase.tickets.map((t: any) => `#${t.number.toString().padStart(3, '0')}`).join(', ')}</span>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <p className="font-black text-slate-800 text-sm">${purchase.totalAmount.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">{new Date(purchase.createdAt).toLocaleDateString('es-MX')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleViewDetails(purchase.id)} className="min-h-[44px] px-3 py-2 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-600 rounded-xl text-xs font-bold transition-colors touch-manipulation">
                      Ver
                    </button>
                    {purchase.status === 'pending' && (
                      <>
                        <button onClick={() => handleUpdateStatus(purchase.id, 'paid')} className="min-h-[44px] px-3 py-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-600 rounded-xl text-xs font-bold transition-colors touch-manipulation">
                          ✓ Pagar
                        </button>
                        <button onClick={() => handleUpdateStatus(purchase.id, 'cancelled')} className="min-h-[44px] px-3 py-2 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-500 rounded-xl text-xs font-bold transition-colors touch-manipulation">
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Details Modal - móvil: bottom sheet */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85dvh] overflow-y-auto overflow-x-hidden overscroll-contain">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 bg-white rounded-t-3xl sm:rounded-t-2xl shrink-0">
              <h3 className="text-lg font-black text-slate-800 truncate min-w-0">Detalle de Compra</h3>
              <button onClick={() => setSelectedPurchase(null)} className="w-10 h-10 min-w-[44px] min-h-[44px] shrink-0 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full flex items-center justify-center text-slate-500 touch-manipulation">✕</button>
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Boletos</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPurchase.tickets.map((ticket: any) => (
                    <span key={ticket.id} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-black text-indigo-700">
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
                    className="w-full max-h-40 object-contain rounded-xl border border-slate-100 bg-slate-50"
                  />
                  <p className="text-[10px] text-slate-400">Puedes adjuntar esta imagen al mensaje de WhatsApp manualmente.</p>
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
                      className="flex-1 min-h-[44px] flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1a9f4d] text-white font-black py-3 rounded-xl text-sm transition-colors touch-manipulation"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                      Enviar por WhatsApp
                    </button>
                    <button
                      onClick={() => handleCopyMessage(selectedPurchase)}
                      className="min-h-[44px] px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-black py-3 rounded-xl text-sm transition-colors touch-manipulation"
                    >
                      Copiar mensaje
                    </button>
                  </div>
                </div>
              )}
              {/* Actions */}
              {selectedPurchase.status === 'pending' && (
                <div className="flex gap-3">
                  <button onClick={() => handleUpdateStatus(selectedPurchase.id, 'paid')} className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-3 rounded-xl text-sm transition-colors touch-manipulation">
                    ✓ Marcar como Pagado
                  </button>
                  <button onClick={() => handleUpdateStatus(selectedPurchase.id, 'cancelled')} className="flex-1 min-h-[44px] bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-500 font-black py-3 rounded-xl text-sm transition-colors touch-manipulation">
                    Cancelar
                  </button>
                </div>
              )}
              {selectedPurchase.status === 'paid' && (
                <div className="flex gap-3">
                  <button onClick={() => handleUpdateStatus(selectedPurchase.id, 'pending')} className="flex-1 min-h-[44px] bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black py-3 rounded-xl text-sm transition-colors touch-manipulation">
                    Marcar como Pendiente
                  </button>
                  <button onClick={() => handleUpdateStatus(selectedPurchase.id, 'cancelled')} className="flex-1 min-h-[44px] bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-500 font-black py-3 rounded-xl text-sm transition-colors touch-manipulation">
                    Liberar orden
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;

