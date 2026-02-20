import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';

const Tickets = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [raffles, setRaffles] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    raffleId: '',
    status: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRaffles();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [filters]);

  const loadRaffles = async () => {
    try {
      const data = await adminService.getRaffles();
      setRaffles(data);
    } catch (error) {
      console.error('Error loading raffles:', error);
    }
  };

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filters.raffleId) params.raffleId = filters.raffleId;
      if (filters.status) params.status = filters.status;
      const data = await adminService.getTickets(params);
      setTickets(data);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: 'available' | 'reserved' | 'sold') => {
    try {
      await adminService.updateTicket(ticketId, newStatus);
      loadTickets();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar el boleto');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Boletos</h2>
        <p className="text-slate-400 mt-1">Gestiona el estado de los boletos</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl"
            >
              <option value="">Todos</option>
              <option value="available">Disponible</option>
              <option value="reserved">Reservado</option>
              <option value="sold">Vendido</option>
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
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Rifa</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Compra</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{ticket.raffle.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">#{ticket.number.toString().padStart(3, '0')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                          ticket.status === 'sold'
                            ? 'bg-green-100 text-green-600'
                            : ticket.status === 'reserved'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ticket.status === 'sold' ? 'Vendido' : ticket.status === 'reserved' ? 'Reservado' : 'Disponible'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {ticket.purchase ? (
                        <div>
                          <p className="text-sm font-bold text-slate-800">{ticket.purchase.user.name}</p>
                          <p className="text-xs text-slate-400">{ticket.purchase.user.phone}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">-</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={ticket.status}
                        onChange={(e) =>
                          handleUpdateStatus(ticket.id, e.target.value as 'available' | 'reserved' | 'sold')
                        }
                        className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-bold"
                      >
                        <option value="available">Disponible</option>
                        <option value="reserved">Reservado</option>
                        <option value="sold">Vendido</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;





