import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';

const Purchases = () => {
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

  const handleUpdateStatus = async (purchaseId: string, status: 'pending' | 'paid' | 'cancelled', paymentMethod?: string, paymentReference?: string) => {
    try {
      await adminService.updatePurchaseStatus(purchaseId, status, paymentMethod, paymentReference);
      loadPurchases();
      setSelectedPurchase(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar la compra');
    }
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
                    <button onClick={() => handleViewDetails(purchase.id)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-colors">
                      Ver
                    </button>
                    {purchase.status === 'pending' && (
                      <>
                        <button onClick={() => handleUpdateStatus(purchase.id, 'paid')} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-xs font-bold transition-colors">
                          ✓ Pagar
                        </button>
                        <button onClick={() => handleUpdateStatus(purchase.id, 'cancelled')} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-bold transition-colors">
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

      {/* Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl">
              <h3 className="text-lg font-black text-slate-800">Detalle de Compra</h3>
              <button onClick={() => setSelectedPurchase(null)} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {/* User */}
              <div className="admin-card p-4 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</p>
                <p className="font-bold text-slate-800">{selectedPurchase.user.name}</p>
                <p className="text-sm text-slate-500">{selectedPurchase.user.phone}</p>
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
              {/* Total & Status */}
              <div className="flex items-center justify-between admin-card p-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                  <p className="text-2xl font-black text-slate-800">${selectedPurchase.totalAmount.toLocaleString()}</p>
                </div>
                {getStatusBadge(selectedPurchase.status)}
              </div>
              {/* Actions */}
              {selectedPurchase.status === 'pending' && (
                <div className="flex gap-3">
                  <button onClick={() => handleUpdateStatus(selectedPurchase.id, 'paid')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-sm transition-colors">
                    ✓ Marcar como Pagado
                  </button>
                  <button onClick={() => handleUpdateStatus(selectedPurchase.id, 'cancelled')} className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 font-black py-3 rounded-xl text-sm transition-colors">
                    Cancelar
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
