import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';

const Purchases = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [raffles, setRaffles] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    raffleId: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);

  useEffect(() => {
    loadRaffles();
  }, []);

  useEffect(() => {
    loadPurchases();
  }, [filters]);

  const loadRaffles = async () => {
    try {
      const data = await adminService.getRaffles();
      setRaffles(data);
    } catch (error) {
      console.error('Error loading raffles:', error);
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
      console.error('Error loading purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    purchaseId: string,
    status: 'pending' | 'paid' | 'cancelled',
    paymentMethod?: string,
    paymentReference?: string
  ) => {
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
      console.error('Error loading purchase details:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Compras</h2>
        <p className="text-slate-400 mt-1">Gestiona las compras y pagos</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl"
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Rifa</label>
            <select
              value={filters.raffleId}
              onChange={(e) => setFilters({ ...filters, raffleId: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl"
            >
              <option value="">Todas</option>
              {raffles.map((raffle) => (
                <option key={raffle.id} value={raffle.id}>
                  {raffle.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Rifa</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Boletos</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-800">{purchase.user.name}</p>
                        <p className="text-xs text-slate-400">{purchase.user.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{purchase.raffle.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {purchase.tickets.map((t: any) => `#${t.number.toString().padStart(3, '0')}`).join(', ')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">${purchase.totalAmount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                          purchase.status === 'paid'
                            ? 'bg-green-100 text-green-600'
                            : purchase.status === 'pending'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {purchase.status === 'paid' ? 'Pagado' : purchase.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400">
                        {new Date(purchase.createdAt).toLocaleDateString('es-MX')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(purchase.id)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                        >
                          Ver
                        </button>
                        {purchase.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(purchase.id, 'paid')}
                            className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100"
                          >
                            Pagar
                          </button>
                        )}
                        {purchase.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(purchase.id, 'cancelled')}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800">Detalles de Compra</h3>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Usuario</p>
                <p className="font-bold text-slate-800">{selectedPurchase.user.name}</p>
                <p className="text-sm text-slate-600">{selectedPurchase.user.phone}</p>
                <p className="text-sm text-slate-600">{selectedPurchase.user.email}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Rifa</p>
                <p className="font-bold text-slate-800">{selectedPurchase.raffle.title}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Boletos</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPurchase.tickets.map((ticket: any) => (
                    <span
                      key={ticket.id}
                      className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-bold text-slate-800"
                    >
                      #{ticket.number.toString().padStart(3, '0')}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Total</p>
                <p className="text-2xl font-black text-slate-800">${selectedPurchase.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Estado</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    selectedPurchase.status === 'paid'
                      ? 'bg-green-100 text-green-600'
                      : selectedPurchase.status === 'pending'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {selectedPurchase.status === 'paid' ? 'Pagado' : selectedPurchase.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                </span>
              </div>
              {selectedPurchase.status === 'pending' && (
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleUpdateStatus(selectedPurchase.id, 'paid')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl"
                  >
                    Marcar como Pagado
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedPurchase.id, 'cancelled')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl"
                  >
                    Cancelar Compra
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





