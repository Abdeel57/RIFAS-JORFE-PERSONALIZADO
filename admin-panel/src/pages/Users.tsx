import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';

const Users = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    loadUsers();
  }, [searchTerm]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      const data = await adminService.getUsers(params);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const user = await adminService.getUserById(id);
      setSelectedUser(user);
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Usuarios</h2>
        <p className="text-slate-400 mt-1">Gestiona los usuarios registrados</p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          className="w-full px-4 py-2 border border-slate-200 rounded-xl"
        />
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
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Compras</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Registro</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{user.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{user.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{user.state || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{user._count?.purchases || 0}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString('es-MX')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(user.id)}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800">Detalles de Usuario</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Información Personal</p>
                <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                  <p className="font-bold text-slate-800">{selectedUser.name}</p>
                  <p className="text-sm text-slate-600">Teléfono: {selectedUser.phone}</p>
                  <p className="text-sm text-slate-600">Email: {selectedUser.email}</p>
                  {selectedUser.state && <p className="text-sm text-slate-600">Estado: {selectedUser.state}</p>}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Historial de Compras</p>
                <div className="space-y-4">
                  {selectedUser.purchases && selectedUser.purchases.length > 0 ? (
                    selectedUser.purchases.map((purchase: any) => (
                      <div key={purchase.id} className="bg-slate-50 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-slate-800">{purchase.raffle.title}</p>
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
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600">
                              Boletos: {purchase.tickets.map((t: any) => `#${t.number.toString().padStart(3, '0')}`).join(', ')}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(purchase.createdAt).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                          <p className="font-bold text-slate-800">${purchase.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-4">No hay compras registradas</p>
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





