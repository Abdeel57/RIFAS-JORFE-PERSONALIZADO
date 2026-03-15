import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../services/admin.service';
import { useAuth } from '../hooks/useAuth';
import Skeleton from '../components/Skeleton';
import { Search, User, Calendar, Phone, Mail, MapPin, ExternalLink, X, ChevronRight, FileSpreadsheet, Shield, Plus, Trash2, Crown, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── AdminPanel sub-component ──────────────────────────────────────────────────

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  planType: string | null;
  planStartDate: string | null;
  planExpiryDate: string | null;
  createdAt: string;
}

const PLAN_LABELS: Record<string, string> = {
  mensual: 'Mensual',
  por_rifa: 'Por Rifa',
};

const PLAN_COLORS: Record<string, string> = {
  mensual: 'bg-blue-50 text-blue-700 border-blue-100',
  por_rifa: 'bg-violet-50 text-violet-700 border-violet-100',
};

const AdminsPanel = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [planModal, setPlanModal] = useState<AdminUser | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'mensual' | 'por_rifa' | ''>('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', planType: '' });
  const [creating, setCreating] = useState(false);

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAdminUsers();
      setAdmins(data || []);
    } catch {
      toast.error('Error al cargar administradores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleSetPlan = async () => {
    if (!planModal) return;
    setSavingPlan(true);
    try {
      await adminService.setAdminPlan(planModal.id, selectedPlan as 'mensual' | 'por_rifa' | null);
      toast.success('Plan actualizado correctamente');
      setPlanModal(null);
      loadAdmins();
    } catch {
      toast.error('Error al actualizar el plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    setCreating(true);
    try {
      await adminService.createAdminUser({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: 'admin',
        planType: createForm.planType || undefined,
      });
      toast.success('Administrador creado correctamente');
      setShowCreate(false);
      setCreateForm({ name: '', email: '', password: '', planType: '' });
      loadAdmins();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al crear administrador');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al administrador "${name}"?`)) return;
    try {
      await adminService.deleteAdminUser(id);
      toast.success('Administrador eliminado');
      loadAdmins();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al eliminar');
    }
  };

  const getDaysLeft = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Administradores del sistema</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[#2563EB] text-white font-black rounded-xl text-xs transition-all active:scale-95 shadow-sm"
        >
          <Plus size={14} /> Nuevo admin
        </button>
      </div>

      {isLoading ? (
        <Skeleton count={3} className="h-20 w-full" />
      ) : (
        <div className="space-y-3">
          {admins.filter(a => a.role !== 'super_admin').map((admin) => {
            const daysLeft = getDaysLeft(admin.planExpiryDate);
            const isExpired = daysLeft !== null && daysLeft < 0;
            const isWarning = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
            return (
              <motion.div
                key={admin.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center shrink-0">
                    <Shield size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm">{admin.name}</p>
                    <p className="text-xs text-slate-400">{admin.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {admin.planType ? (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${PLAN_COLORS[admin.planType]}`}>
                          {PLAN_LABELS[admin.planType]}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg border bg-slate-50 text-slate-400 border-slate-100">
                          Sin plan
                        </span>
                      )}
                      {admin.planType === 'mensual' && admin.planExpiryDate && (
                        <span className={`text-[10px] font-bold ${isExpired ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-slate-400'}`}>
                          {isExpired
                            ? 'Plan expirado'
                            : daysLeft === 0
                            ? 'Vence hoy'
                            : `Vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setPlanModal(admin); setSelectedPlan((admin.planType as any) || ''); }}
                      className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center transition-all"
                      title="Gestionar plan"
                    >
                      <RefreshCw size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(admin.id, admin.name)}
                      className="w-8 h-8 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-all"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {admins.filter(a => a.role !== 'super_admin').length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm font-medium">
              No hay administradores creados aún
            </div>
          )}
        </div>
      )}

      {/* Modal: Asignar / Renovar Plan */}
      <AnimatePresence>
        {planModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPlanModal(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
            >
              <div>
                <h3 className="font-black text-slate-800 text-base">Gestionar plan</h3>
                <p className="text-sm text-slate-400 mt-0.5">{planModal.name}</p>
              </div>
              <div className="space-y-2">
                {(['mensual', 'por_rifa'] as const).map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${selectedPlan === plan ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                  >
                    <p className="font-black text-sm text-slate-800">{PLAN_LABELS[plan]}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {plan === 'mensual' ? 'Acceso por 30 días. Se puede renovar.' : 'Acceso por rifa. Sin botón de crear rifa.'}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                {selectedPlan === 'mensual' ? 'Al guardar se establecerán 30 días de acceso desde hoy.' : selectedPlan === 'por_rifa' ? 'El usuario solo podrá editar rifas existentes.' : ''}
              </p>
              <div className="flex gap-2">
                <button onClick={handleSetPlan} disabled={!selectedPlan || savingPlan}
                  className="flex-1 min-h-[44px] bg-[#2563EB] disabled:opacity-50 text-white font-black rounded-xl text-sm transition-all active:scale-95">
                  {savingPlan ? 'Guardando...' : 'Guardar plan'}
                </button>
                <button onClick={() => setPlanModal(null)}
                  className="px-4 min-h-[44px] bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Crear Admin */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col"
            >
              <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
                <h3 className="font-black text-slate-800 text-base">Nuevo administrador</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Nombre', key: 'name', type: 'text', placeholder: 'Nombre del admin' },
                    { label: 'Usuario / Email', key: 'email', type: 'text', placeholder: 'usuario o email' },
                    { label: 'Contraseña', key: 'password', type: 'password', placeholder: 'Mínimo 6 caracteres' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
                      <input
                        type={type}
                        value={(createForm as any)[key]}
                        onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="admin-input mt-1"
                      />
                    </div>
                  ))}

                  {/* Selección de plan con tarjetas */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan de acceso</label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { value: '', label: 'Sin plan', desc: '—' },
                        { value: 'mensual', label: 'Mensual', desc: '30 días' },
                        { value: 'por_rifa', label: 'Por Rifa', desc: 'Sin crear rifas' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCreateForm(f => ({ ...f, planType: opt.value }))}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                            createForm.planType === opt.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                          }`}
                        >
                          <p className="font-black text-xs text-slate-800">{opt.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0">
                <button onClick={handleCreate} disabled={creating}
                  className="flex-1 min-h-[44px] bg-[#2563EB] disabled:opacity-50 text-white font-black rounded-xl text-sm transition-all active:scale-95">
                  {creating ? 'Creando...' : 'Crear administrador'}
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="px-4 min-h-[44px] bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Users component ──────────────────────────────────────────────────────

const Users = () => {
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState<'clientes' | 'admins'>('clientes');
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Debounced search logic
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      const data = await adminService.getUsers(params);
      setUsers(data || []);
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

  const handleExportExcel = () => {
    if (!users.length) {
      toast.error('No hay usuarios para exportar');
      return;
    }

    const data = users.map(u => ({
      'Nombre': u.name,
      'Teléfono': u.phone,
      'Email': u.email || '—',
      'Estado/Ciudad': u.state || '—',
      'Total Compras': u._count?.purchases || 0,
      'Fecha Registro': new Date(u.createdAt).toLocaleDateString('es-MX')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, `Base_de_Datos_Clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getInitials = (name: string) => {
    return (name || '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const statusBadge = (status: string) => {
    if (status === 'paid') return <span className="badge-green">Pagado</span>;
    if (status === 'pending') return <span className="badge-amber">Pendiente</span>;
    return <span className="badge-red">Cancelado</span>;
  };

  const avatarColors = [
    'from-blue-400 to-violet-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-pink-400 to-rose-500',
    'from-indigo-400 to-blue-500',
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Usuarios</h2>
          <p className="section-sub">Gestiona tu base de clientes</p>
        </div>
        {activeTab === 'clientes' && (
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95 border border-emerald-100/50 shadow-sm"
            title="Exportar a Excel"
          >
            <FileSpreadsheet size={18} />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
        )}
      </div>

      {/* Tabs (solo super_admin ve la pestaña de admins) */}
      {isSuperAdmin && (
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('clientes')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'clientes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
          >
            Clientes
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${activeTab === 'admins' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
          >
            <Crown size={12} /> Administradores
          </button>
        </div>
      )}

      {/* Panel de administradores */}
      {activeTab === 'admins' && isSuperAdmin && <AdminsPanel />}

      {/* Contenido de clientes (solo visible en pestaña clientes) */}
      {activeTab === 'clientes' && <>

      {/* Searchbar */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          className="admin-input pl-11 focus:bg-white focus:shadow-xl focus:shadow-blue-100/50"
        />
      </div>

      {/* Table/List */}
      <div className="space-y-3">
        {isLoading ? (
          <Skeleton count={5} className="h-24 w-full" />
        ) : (
          <AnimatePresence mode="popLayout">
            {users.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="admin-card p-12 text-center"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User size={32} className="text-slate-200" />
                </div>
                <p className="text-slate-400 text-sm font-medium">
                  {searchTerm ? 'No se encontraron resultados' : 'No hay usuarios registrados'}
                </p>
              </motion.div>
            ) : (
              users.map((user, i) => (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className="list-card hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => handleViewDetails(user.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${avatarColors[i % avatarColors.length]} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
                      <span className="text-white font-black text-sm">{getInitials(user.name)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <Phone size={10} /> {user.phone}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium truncate">
                          <Mail size={10} /> {user.email}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-black text-blue-600 leading-none">{user._count?.purchases || 0}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">compras</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                      {user.state && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded-lg">
                          <MapPin size={10} /> {user.state}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Calendar size={10} /> Registrado el {new Date(user.createdAt).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                    <div className="text-[#2563EB] text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Detalles <ChevronRight size={14} />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedUser && activeTab === 'clientes' && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden relative z-10"
            >
              {/* Modal header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                    <span className="text-white font-black text-base">{getInitials(selectedUser.name)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">{selectedUser.name}</h3>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                      <Phone size={12} /> {selectedUser.phone}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto overscroll-contain space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Compras</p>
                    <p className="text-2xl font-black text-blue-700">{selectedUser.purchases?.length || 0}</p>
                  </div>
                  <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Efectivo Total</p>
                    <p className="text-2xl font-black text-emerald-700">
                      ${selectedUser.purchases?.reduce((acc: number, p: any) => acc + (p.status === 'paid' ? p.totalAmount : 0), 0).toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="space-y-3">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Información de contacto</p>
                  <div className="admin-card p-4 grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                        <Mail size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Email</p>
                        <p className="text-sm font-bold text-slate-700 break-all">{selectedUser.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                        <MapPin size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Estado / Ciudad</p>
                        <p className="text-sm font-bold text-slate-700">{selectedUser.state || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchase History */}
                <div className="space-y-4">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Historial de participación</p>
                  <div className="space-y-3">
                    {selectedUser.purchases && selectedUser.purchases.length > 0 ? (
                      selectedUser.purchases.map((purchase: any) => (
                        <motion.div
                          key={purchase.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="list-card border-slate-200/60"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-bold text-slate-800 text-sm flex-1 min-w-0 truncate">{purchase.raffle.title}</p>
                            {statusBadge(purchase.status)}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex flex-wrap gap-1">
                              {purchase.tickets.map((t: any) => (
                                <span key={t.id} className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                  #{t.number.toString().padStart(3, '0')}
                                </span>
                              ))}
                            </div>
                            <p className="font-black text-slate-800 text-sm">${purchase.totalAmount.toLocaleString()}</p>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Comprado el {new Date(purchase.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </motion.div>
                      ))
                    ) : (
                      <div className="admin-card p-8 text-center bg-slate-50/50 border-dashed">
                        <p className="text-slate-400 text-sm font-medium">Sin compras aún</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => window.open(`https://wa.me/${selectedUser.phone.replace(/\D/g, '')}`, '_blank')}
                  className="flex-1 min-h-[48px] bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100"
                >
                  Abrir WhatsApp <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-6 min-h-[48px] bg-slate-100 text-slate-600 font-bold rounded-xl text-sm transition-all"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </>}
    </div>
  );
};

export default Users;
