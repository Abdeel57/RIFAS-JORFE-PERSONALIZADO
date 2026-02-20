import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';

const Tickets = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [raffles, setRaffles] = useState<any[]>([]);
  const [filters, setFilters] = useState({ raffleId: '', status: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadRaffles(); }, []);
  useEffect(() => { loadTickets(); }, [filters]);

  const loadRaffles = async () => {
    try {
      const data = await adminService.getRaffles();
      setRaffles(data);
    } catch (error) {
      console.error(error);
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
      console.error(error);
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

  const getStatusBadge = (status: string) => {
    if (status === 'sold') return <span className="badge-green">Vendido</span>;
    if (status === 'reserved') return <span className="badge-amber">Reservado</span>;
    return <span className="badge-slate">Disponible</span>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="section-title">Boletos</h2>
        <p className="section-sub">Estado de los boletos</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3">
        <select value={filters.raffleId} onChange={(e) => setFilters({ ...filters, raffleId: e.target.value })} className="admin-input">
          <option value="">Todas las rifas</option>
          {raffles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="admin-input">
          <option value="">Todos los estados</option>
          <option value="available">Disponible</option>
          <option value="reserved">Reservado</option>
          <option value="sold">Vendido</option>
        </select>
      </div>

      {/* Ticket count summary */}
      {!isLoading && tickets.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Disponibles', count: tickets.filter(t => t.status === 'available').length, color: 'text-slate-600', bg: 'bg-slate-50 border border-slate-200' },
            { label: 'Reservados', count: tickets.filter(t => t.status === 'reserved').length, color: 'text-amber-600', bg: 'bg-amber-50 border border-amber-200' },
            { label: 'Vendidos', count: tickets.filter(t => t.status === 'sold').length, color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-200' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
              <p className={`text-xl font-black ${s.color}`}>{s.count}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="w-10 h-10 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Cargando boletos...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="admin-card p-10 text-center">
              <p className="text-slate-400 text-sm">No hay boletos que mostrar</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="list-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* Ticket number badge */}
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <p className="text-sm font-black text-indigo-700">#{ticket.number.toString().padStart(3, '0')}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{ticket.raffle.title}</p>
                      {ticket.purchase ? (
                        <p className="text-xs text-slate-400">{ticket.purchase.user.name} · {ticket.purchase.user.phone}</p>
                      ) : (
                        <p className="text-xs text-slate-400">Sin comprador asignado</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>

                {/* Status selector */}
                <div className="pt-2 border-t border-slate-50">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block mb-1">Cambiar estado</label>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleUpdateStatus(ticket.id, e.target.value as 'available' | 'reserved' | 'sold')}
                    className="admin-input py-2 text-xs"
                  >
                    <option value="available">Disponible</option>
                    <option value="reserved">Reservado</option>
                    <option value="sold">Vendido</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Tickets;
