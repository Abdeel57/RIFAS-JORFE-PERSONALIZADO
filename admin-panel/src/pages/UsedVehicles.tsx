import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../contexts/ConfirmContext';
import { adminService } from '../services/admin.service';
import {
    Plus, Trash2, Pencil, X, Save, Loader2, Car,
    ToggleLeft, ToggleRight, ImageIcon, Calendar, Gauge, DollarSign,
} from 'lucide-react';

interface UsedVehicle {
    id: string;
    name: string;
    modelYear: string;
    mileage: string;
    description: string;
    price: string;
    imageUrl: string | null;
    order: number;
    isActive: boolean;
    createdAt: string;
}

const EMPTY_FORM = {
    name: '', modelYear: '', mileage: '', description: '', price: '',
    imageUrl: '', order: 0, isActive: true,
};

export default function UsedVehicles() {
    const { showConfirm } = useConfirm();
    const [items, setItems] = useState<UsedVehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [imageUploading, setImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = async () => {
        try { setLoading(true); const data = await adminService.getUsedVehicles(); setItems(data || []); }
        catch { toast.error('Error al cargar los vehículos'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
    const openEdit = (a: UsedVehicle) => {
        setEditingId(a.id);
        setForm({
            name: a.name, modelYear: a.modelYear, mileage: a.mileage, description: a.description,
            price: a.price, imageUrl: a.imageUrl || '', order: a.order, isActive: a.isActive,
        });
        setShowForm(true);
    };
    const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }); };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        try { setImageUploading(true); const result = await adminService.uploadImage(file); setForm(f => ({ ...f, imageUrl: result.url })); toast.success('Imagen subida'); }
        catch { toast.error('Error al subir la imagen'); }
        finally { setImageUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error('El nombre es requerido');
        if (!form.modelYear.trim()) return toast.error('El año es requerido');
        if (!form.mileage.trim()) return toast.error('El kilometraje es requerido');
        if (!form.description.trim()) return toast.error('La descripción es requerida');
        if (!form.price.trim()) return toast.error('El precio es requerido');

        try {
            setSaving(true);
            const payload = {
                name: form.name.trim(),
                modelYear: form.modelYear.trim(),
                mileage: form.mileage.trim(),
                description: form.description.trim(),
                price: form.price.trim(),
                imageUrl: form.imageUrl || null,
                order: Number(form.order) || 0,
                isActive: form.isActive,
            };
            if (editingId) { await adminService.updateUsedVehicle(editingId, payload); toast.success('Vehículo actualizado'); }
            else { await adminService.createUsedVehicle(payload); toast.success('Vehículo creado'); }
            closeForm(); load();
        } catch (err: any) { toast.error(err?.response?.data?.message || 'Error al guardar'); }
        finally { setSaving(false); }
    };

    const handleDelete = (a: UsedVehicle) => {
        showConfirm({
            message: `¿Eliminar "${a.name}"? Esta acción no se puede deshacer.`,
            onConfirm: async () => { await adminService.deleteUsedVehicle(a.id); toast.success('Vehículo eliminado'); load(); },
        });
    };

    const handleToggle = async (a: UsedVehicle) => {
        try {
            await adminService.updateUsedVehicle(a.id, { isActive: !a.isActive });
            setItems(prev => prev.map(x => x.id === a.id ? { ...x, isActive: !x.isActive } : x));
        } catch { toast.error('Error al actualizar el estado'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Vehículos Seminuevos</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Gestiona el catálogo que aparece en la sección "Vehículos seminuevos"
                    </p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black px-4 py-2.5 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95">
                    <Plus size={16} strokeWidth={3} /> Nuevo vehículo
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-blue-400" /></div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="w-14 h-14 rounded-3xl bg-amber-50 flex items-center justify-center"><Car size={24} className="text-amber-300" /></div>
                    <p className="text-sm font-bold text-slate-400">Sin vehículos aún</p>
                    <p className="text-xs text-slate-300 max-w-xs">Agrega los autos seminuevos del catálogo para que aparezcan en la página pública.</p>
                    <button onClick={openCreate} className="mt-2 flex items-center gap-2 bg-blue-600 text-white text-sm font-black px-5 py-2.5 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95">
                        <Plus size={15} strokeWidth={3} /> Agregar primer vehículo
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map(a => (
                        <motion.div key={a.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className={`bg-white rounded-2xl border p-4 flex items-center gap-4 shadow-sm transition-all ${a.isActive ? 'border-slate-200/60' : 'border-slate-100 opacity-60'}`}>
                            <div className="w-14 h-14 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {a.imageUrl ? <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover" /> : <Car size={20} className="text-slate-300" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-black text-sm text-slate-800 truncate">{a.name}</p>
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${a.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>{a.isActive ? 'Activo' : 'Inactivo'}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Calendar size={10} /> {a.modelYear}</p>
                                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Gauge size={10} /> {a.mileage}</p>
                                    <p className="text-[10px] text-amber-700 font-bold">{a.price}</p>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{a.description}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => handleToggle(a)} className="p-2 rounded-xl hover:bg-slate-50 transition-colors">{a.isActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} className="text-slate-300" />}</button>
                                <button onClick={() => openEdit(a)} className="p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={16} strokeWidth={2.5} /></button>
                                <button onClick={() => handleDelete(a)} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} strokeWidth={2.5} /></button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={closeForm} />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                            <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ type: 'spring', damping: 24, stiffness: 320 }} className="pointer-events-auto w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-2xl bg-amber-50 flex items-center justify-center"><Car size={18} className="text-amber-500" /></div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-sm">{editingId ? 'Editar vehículo' : 'Nuevo vehículo'}</h3>
                                            <p className="text-[10px] text-slate-400 font-medium">Datos del auto seminuevo</p>
                                        </div>
                                    </div>
                                    <button onClick={closeForm} className="w-9 h-9 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"><X size={18} /></button>
                                </div>

                                <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                                    {/* Imagen */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Imagen (opcional)</label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {form.imageUrl ? <img src={form.imageUrl} alt="img" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-slate-300" />}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageUploading} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-amber-200 rounded-xl text-amber-600 text-xs font-black hover:bg-amber-50 transition-colors disabled:opacity-50">
                                                    {imageUploading ? <><Loader2 size={14} className="animate-spin" /> Subiendo...</> : <><ImageIcon size={14} /> Subir imagen</>}
                                                </button>
                                                <input type="text" placeholder="O pega una URL" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-700 placeholder:text-slate-300" />
                                            </div>
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </div>

                                    {/* Nombre */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Nombre del vehículo *</label>
                                        <input type="text" placeholder="Ej: Toyota Hilux 4x4" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-700 placeholder:text-slate-300 font-medium" />
                                    </div>

                                    {/* Year + Mileage */}
                                    <div className="flex gap-3">
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Año *</label>
                                            <div className="relative">
                                                <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input type="text" placeholder="2020" value={form.modelYear} onChange={e => setForm(f => ({ ...f, modelYear: e.target.value }))} className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-700 placeholder:text-slate-300 font-medium" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Kilometraje *</label>
                                            <div className="relative">
                                                <Gauge size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input type="text" placeholder="45,000 km" value={form.mileage} onChange={e => setForm(f => ({ ...f, mileage: e.target.value }))} className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-700 placeholder:text-slate-300 font-medium" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Precio */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Precio *</label>
                                        <div className="relative">
                                            <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input type="text" placeholder="Ej: $350,000 MXN" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-700 placeholder:text-slate-300 font-medium" />
                                        </div>
                                    </div>

                                    {/* Descripción */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Descripción *</label>
                                        <textarea placeholder="Características, condición, equipamiento, etc." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-700 placeholder:text-slate-300 font-medium resize-none" />
                                    </div>

                                    {/* Order + Active */}
                                    <div className="flex gap-3">
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Orden</label>
                                            <input type="number" min={0} value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-700 font-medium" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Activo</label>
                                            <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} className={`flex items-center gap-2 px-4 py-3 rounded-2xl border font-black text-sm transition-all ${form.isActive ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                                {form.isActive ? <><ToggleRight size={18} /> Sí</> : <><ToggleLeft size={18} /> No</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                                    <button onClick={closeForm} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-black text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
                                    <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-60">
                                        {saving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : <><Save size={16} /> Guardar</>}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
