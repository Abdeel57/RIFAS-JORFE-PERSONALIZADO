import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { useAuth } from '../hooks/useAuth';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ['#4F46E5', '#8B5CF6', '#10B981', '#F59E0B'];

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { admin } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data.overview);
        setRecentPurchases(data.recentPurchases || []);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Cargando dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-slate-500 font-medium">No se pudieron cargar los datos</p>
      </div>
    );
  }

  const purchaseStatusData = [
    { name: 'Pagadas', value: stats.paidPurchases || 0 },
    { name: 'Pendientes', value: stats.pendingPurchases || 0 },
  ];

  const ticketStatusData = [
    { name: 'Vendidos', value: stats.soldTickets || 0 },
    { name: 'Disponibles', value: stats.availableTickets || 0 },
  ];

  const statCards = [
    {
      label: 'Rifas Activas',
      value: stats.activeRaffles,
      sub: `de ${stats.totalRaffles} totales`,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      ),
    },
    {
      label: 'Boletos Vendidos',
      value: stats.soldTickets,
      sub: `de ${stats.totalTickets} totales`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9a3 3 0 010-6h20a3 3 0 010 6H2zM2 15a3 3 0 000 6h20a3 3 0 000-6H2z" />
        </svg>
      ),
    },
    {
      label: 'Compras Pendientes',
      value: stats.pendingPurchases,
      sub: `de ${stats.totalPurchases} totales`,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: 'Ingresos Totales',
      value: `$${(stats.totalRevenue || 0).toLocaleString()}`,
      sub: `${stats.paidPurchases} compras pagadas`,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'paid') return <span className="badge-green">Pagado</span>;
    if (status === 'pending') return <span className="badge-amber">Pendiente</span>;
    return <span className="badge-red">Cancelado</span>;
  };

  return (
    <div className="space-y-5">
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
        <div className="absolute -right-2 bottom-0 w-16 h-16 bg-white/10 rounded-full" />
        <div className="relative">
          <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Bienvenido</p>
          <h2 className="text-xl font-black">
            {admin?.name || 'Administrador'} 👋
          </h2>
          <p className="text-indigo-200 text-xs mt-1">Panel de control · Rifas NAO</p>
        </div>
      </div>

      {/* Stats Grid — "chocolate bar" 2×2 layout */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className={`w-9 h-9 ${card.bg} ${card.color} rounded-xl flex items-center justify-center`}>
              {card.icon}
            </div>
            <p className={`text-2xl font-black ${card.color} leading-none mt-1`}>{card.value}</p>
            <p className="text-[11px] font-semibold text-slate-500 leading-tight">{card.label}</p>
            <p className="text-[10px] text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="admin-card p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Compras</p>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={purchaseStatusData} cx="50%" cy="50%" outerRadius={45} dataKey="value" labelLine={false}>
                {purchaseStatusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1 mt-1">
            {purchaseStatusData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                <p className="text-[10px] text-slate-500 truncate">{item.name}: <b className="text-slate-700">{item.value}</b></p>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-card p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Boletos</p>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={ticketStatusData} cx="50%" cy="50%" outerRadius={45} dataKey="value" labelLine={false}>
                {ticketStatusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index + 2]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1 mt-1">
            {ticketStatusData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i + 2] }} />
                <p className="text-[10px] text-slate-500 truncate">{item.name}: <b className="text-slate-700">{item.value}</b></p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Purchases */}
      <div>
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-3">Compras Recientes</h3>
        <div className="space-y-3">
          {recentPurchases.length === 0 ? (
            <div className="admin-card p-8 text-center">
              <p className="text-slate-400 text-sm">No hay compras recientes</p>
            </div>
          ) : (
            recentPurchases.map((purchase) => (
              <div key={purchase.id} className="list-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{purchase.user.name}</p>
                    <p className="text-xs text-slate-400">{purchase.user.phone}</p>
                  </div>
                  {getStatusBadge(purchase.status)}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                  <div>
                    <p className="text-xs text-slate-500 truncate max-w-[150px]">{purchase.raffle.title}</p>
                    <p className="text-[10px] text-slate-400">{purchase.tickets.length} boletos · {new Date(purchase.createdAt).toLocaleDateString('es-MX')}</p>
                  </div>
                  <p className="font-black text-sm text-slate-800">${purchase.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
