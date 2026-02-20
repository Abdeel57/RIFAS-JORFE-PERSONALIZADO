import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!stats) {
    return <div>Error al cargar datos</div>;
  }

  const purchaseStatusData = [
    { name: 'Pagadas', value: stats.paidPurchases },
    { name: 'Pendientes', value: stats.pendingPurchases },
  ];

  const ticketStatusData = [
    { name: 'Vendidos', value: stats.soldTickets },
    { name: 'Disponibles', value: stats.availableTickets },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Dashboard</h2>
        <p className="text-slate-400 mt-1">Resumen general del sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-2">Rifas Activas</p>
          <p className="text-3xl font-black text-blue-600">{stats.activeRaffles}</p>
          <p className="text-xs text-slate-400 mt-1">de {stats.totalRaffles} totales</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-2">Boletos Vendidos</p>
          <p className="text-3xl font-black text-green-600">{stats.soldTickets}</p>
          <p className="text-xs text-slate-400 mt-1">de {stats.totalTickets} totales</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-2">Compras Pendientes</p>
          <p className="text-3xl font-black text-amber-600">{stats.pendingPurchases}</p>
          <p className="text-xs text-slate-400 mt-1">de {stats.totalPurchases} totales</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-2">Ingresos Totales</p>
          <p className="text-3xl font-black text-slate-800">${stats.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">{stats.paidPurchases} compras pagadas</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 mb-4">Estado de Compras</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={purchaseStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {purchaseStatusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 mb-4">Estado de Boletos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ticketStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ticketStatusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-800">Compras Recientes</h3>
        </div>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPurchases.map((purchase) => (
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
                    <p className="text-sm text-slate-600">{purchase.tickets.length} boletos</p>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


