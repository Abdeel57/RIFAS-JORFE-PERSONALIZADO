import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../contexts/ConfirmContext';
import { adminService } from '../services/admin.service';
import Skeleton from '../components/Skeleton';
import { Ticket as TicketIcon, Search, Filter, Loader2, CheckCircle2, Clock, Ban } from 'lucide-react';

const Tickets = () => {
  const { showConfirm } = useConfirm();
  const [tickets, setTickets] = useState<any[]>([]);
  const [raffles, setRaffles] = useState<any[]>([]);
  const [filters, setFilters] = useState({ raffleId: '', status: '', search: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { loadRaffles(); }, []);

  // Debounced ticket loading for search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTickets();
    }, 400);
    return () => clearTimeout(timer);
  }, [filters]);

  const loadRaffles = async () => {
    try {
      const data = await adminService.getRaffles();
      setRaffles(data || []);
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
      if (filters.search) params.search = filters.search;
      const data = await adminService.getTickets(params);
      setTickets(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = (ticketId: string, newStatus: 'available' | 'reserved' | 'sold') => {
    showConfirm({
      message: `¿Cambiar el boleto a ${newStatus === 'available' ? 'disponible' : newStatus === 'reserved' ? 'reservado' : 'vendido'}?`,
      onConfirm: async () => {
        const originalTickets = [...tickets];
        // Optimistic update
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
        setUpdatingId(ticketId);

        try {
          await adminService.updateTicket(ticketId, newStatus);
          toast.success('Estado actualizado');
        } catch (error: any) {
          setTickets(originalTickets);
          toast.error(error.response?.data?.error || 'Error al actualizar');
        } finally {
          setUpdatingId(null);
        }
      },
    });
  };

  const statusBadge = (status: string) => {
    if (status === 'sold') return <span className="badge-green">Vendido</span>;
    if (status === 'reserved') return <span className="badge-amber">Reservado</span>;
    return <span className="badge-slate">Disponible</span>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="section-title">Emisiones</h2>
        <p className="section-sub">Busca y gestiona números específicos</p>
      </div>

      {/* Modern Filter Bar */}
      <div className="space-y-3">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar por número o comprador..."
            className="admin-input pl-11 focus:bg-white"
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
            <select
              value={filters.raffleId}
              onChange={(e) => setFilters({ ...filters, raffleId: e.target.value })}
              className="admin-input pl-9 py-2.5 text-xs font-bold appearance-none"
            >
              <option value="">Rifas: Todas</option>
              {raffles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
              <div className="w-3 h-3 rounded-full border border-slate-200" />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="admin-input pl-9 py-2.5 text-xs font-bold appearance-none"
            >
              <option value="">Estado: Todos</option>
              <option value="available">Disponibles</option>
              <option value="reserved">Reservados</option>
              <option value="sold">Vendidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {isLoading ? (
          <Skeleton count={6} className="h-28 w-full" />
        ) : (
          <AnimatePresence mode="popLayout">
            {tickets.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="admin-card p-12 text-center"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TicketIcon size={32} className="text-slate-200" />
                </div>
                <p className="text-slate-400 text-sm font-medium">No se encontraron boletos</p>
              </motion.div>
            ) : (
              tickets.map((ticket, i) => (
                <motion.div
                  key={ticket.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="list-card border-slate-200/50 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex flex-col items-center justify-center font-black shadow-inner border border-blue-100/50">
                        <span className="text-[10px] uppercase leading-none opacity-60">No.</span>
                        <span className="text-sm leading-none mt-1">#{ticket.number.toString().padStart(3, '0')}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest truncate">{ticket.raffle.title}</p>
                        {ticket.purchase ? (
                          <div className="mt-1">
                            <p className="text-sm font-bold text-slate-800 leading-tight">{ticket.purchase.user.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{ticket.purchase.user.phone}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 font-medium mt-1 italic">Disponible — Sin comprador</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ticket.isGift && <span className="badge-blue">Regalo</span>}
                      {statusBadge(ticket.status)}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2 pt-2 border-t border-slate-50">
                    {[
                      { id: 'available', label: 'Liberar', icon: Ban, color: 'text-slate-600 bg-slate-100 hover:bg-slate-200' },
                      { id: 'reserved', label: 'Reservar', icon: Clock, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
                      { id: 'sold', label: 'Vender', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' }
                    ].map(btn => (
                      <button
                        key={btn.id}
                        disabled={ticket.status === btn.id || (updatingId === ticket.id)}
                        onClick={() => handleUpdateStatus(ticket.id, btn.id as any)}
                        className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale ${btn.color}`}
                      >
                        {updatingId === ticket.id ? <Loader2 size={12} className="animate-spin" /> : <btn.icon size={12} />}
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Tickets;
