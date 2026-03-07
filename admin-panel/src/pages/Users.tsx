import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';

const Users = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => { loadUsers(); }, [searchTerm]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      const data = await adminService.getUsers(params);
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const user = await adminService.getUserById(id);
      setSelectedUser(user);
    } catch (error) {
      console.error(error);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    if (status === 'paid') return <span className="badge-green">Pagado</span>;
    if (status === 'pending') return <span className="badge-amber">Pendiente</span>;
    return <span className="badge-red">Cancelado</span>;
  };

  const avatarColors = [
    'from-blue-400 to-violet-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-pink-400 to-rose-500',
    'from-blue-400 to-cyan-500',
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="section-title">Usuarios</h2>
        <p className="section-sub">Clientes registrados</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          className="admin-input pl-9"
        />
      </div>

      {/* User cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="w-10 h-10 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Cargando usuarios...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.length === 0 ? (
            <div className="admin-card p-10 text-center">
              <p className="text-slate-400 text-sm">
                {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
              </p>
            </div>
          ) : (
            users.map((user, i) => (
              <div key={user.id} className="list-card">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={`w-11 h-11 bg-gradient-to-br ${avatarColors[i % avatarColors.length]} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <span className="text-white font-black text-sm">{getInitials(user.name)}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.phone}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black text-[#2563EB]">{user._count?.purchases || 0}</p>
                    <p className="text-[10px] text-slate-400">compras</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    {user.state && (
                      <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-semibold text-slate-500">
                        {user.state}
                      </span>
                    )}
                    <p className="text-[10px] text-slate-400">
                      Desde {new Date(user.createdAt).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewDetails(user.id)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-xl text-xs font-bold transition-colors"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* User detail modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-violet-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-sm">{getInitials(selectedUser.name)}</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-400">{selectedUser.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500">✕</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Info card */}
              <div className="admin-card p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Información Personal</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[10px] text-slate-400">Email</p>
                    <p className="font-semibold text-slate-700 text-xs break-all">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Teléfono</p>
                    <p className="font-semibold text-slate-700 text-xs">{selectedUser.phone}</p>
                  </div>
                  {selectedUser.state && (
                    <div>
                      <p className="text-[10px] text-slate-400">Estado</p>
                      <p className="font-semibold text-slate-700 text-xs">{selectedUser.state}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-slate-400">Registro</p>
                    <p className="font-semibold text-slate-700 text-xs">{new Date(selectedUser.createdAt).toLocaleDateString('es-MX')}</p>
                  </div>
                </div>
              </div>

              {/* Purchase history */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Historial de Compras ({selectedUser.purchases?.length || 0})
                </p>
                <div className="space-y-3">
                  {selectedUser.purchases && selectedUser.purchases.length > 0 ? (
                    selectedUser.purchases.map((purchase: any) => (
                      <div key={purchase.id} className="list-card">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800 text-sm flex-1 min-w-0 truncate pr-2">{purchase.raffle.title}</p>
                          {getStatusBadge(purchase.status)}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <p className="text-slate-500">
                              {purchase.tickets.map((t: any) => `#${t.number.toString().padStart(3, '0')}`).join(', ')}
                            </p>
                            <p className="text-slate-400">{new Date(purchase.createdAt).toLocaleDateString('es-MX')}</p>
                          </div>
                          <p className="font-black text-slate-800">${purchase.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="admin-card p-6 text-center">
                      <p className="text-slate-400 text-sm">Sin compras registradas</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

