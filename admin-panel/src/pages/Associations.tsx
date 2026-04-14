import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../contexts/ConfirmContext';
import { adminService } from '../services/admin.service';
import {
    Plus, Trash2, Pencil, X, Save, Loader2, Building2,
    Globe, ToggleLeft, ToggleRight, GripVertical, ImageIcon
} from 'lucide-react';

interface Association {
    id: string;
    name: string;
    description: string;
    logoUrl: string;
    websiteUrl: string;
    order: number;
    isActive: boolean;
    createdAt: string;
}

const EMPTY_FORM = {
    name: '',
    description: '',
    logoUrl: '',
    websiteUrl: '',
    order: 0,
    isActive: true,
};

export default function Associations() {
    const { showConfirm } = useConfirm();
    const [associations, setAssociations] = useState<Association[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [logoUploading, setLogoUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAssociations();
            setAssociations(data || []);
        } catch {
            toast.error('Error al cargar las asociaciones');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setShowForm(true);
    };

    const openEdit = (a: Association) => {
        setEditingId(a.id);
        setForm({
            name: a.name,
            description: a.description,
            logoUrl: a.logoUrl,
            websiteUrl: a.websiteUrl,
            order: a.order,
            isActive: a.isActive,
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setLogoUploading(true);
            const result = await adminService.uploadImage(file);
            setForm(f => ({ ...f, logoUrl: result.url }));
            toast.success('Logo subido correctamente');
        } catch {
            toast.error('Error al subir el logo');
        } finally {
            setLogoUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error('El nombre es requerido');
        if (!form.description.trim()) return toast.error('La descripción es requerida');
        if (!form.logoUrl.trim()) return toast.error('El logo es requerido');
        if (!form.websiteUrl.trim()) return toast.error('El link del sitio web es requerido');

        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(form.websiteUrl)) {
            return toast.error('El sitio web debe ser una URL válida (https://...)');
        }

        try {
            setSaving(true);
            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                logoUrl: form.logoUrl,
                websiteUrl: form.websiteUrl.trim(),
                order: Number(form.order) || 0,
                isActive: form.isActive,
            };

            if (editingId) {
                await adminService.updateAssociation(editingId, payload);
                toast.success('Asociación actualizada');
            } else {
                await adminService.createAssociation(payload);
                toast.success('Asociación creada');
            }
            closeForm();
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (a: Association) => {
        showConfirm({
            message: `¿Eliminar "${a.name}"? Esta acción no se puede deshacer.`,
            onConfirm: async () => {
                await adminService.deleteAssociation(a.id);
                toast.success('Asociación eliminada');
                load();
            },
        });
    };

    const handleToggle = async (a: Association) => {
        try {
            await adminService.updateAssociation(a.id, { isActive: !a.isActive });
            setAssociations(prev => prev.map(x => x.id === a.id ? { ...x, isActive: !x.isActive } : x));
        } catch {
            toast.error('Error al actualizar el estado');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Asociaciones Apoyadoras</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Gestiona los logos que aparecen en el carrusel de la página principal
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black px-4 py-2.5 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    <Plus size={16} strokeWidth={3} />
                    Nueva asociación
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-blue-400" />
                </div>
            ) : associations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="w-14 h-14 rounded-3xl bg-blue-50 flex items-center justify-center">
                        <Building2 size={24} className="text-blue-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Sin asociaciones aún</p>
                    <p className="text-xs text-slate-300 max-w-xs">
                        Agrega las asociaciones que te apoyan. Sus logos aparecerán en el carrusel de la página principal.
                    </p>
                    <button
                        onClick={openCreate}
                        className="mt-2 flex items-center gap-2 bg-blue-600 text-white text-sm font-black px-5 py-2.5 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                        <Plus size={15} strokeWidth={3} />
                        Agregar primera asociación
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {associations.map(a => (
                        <motion.div
                            key={a.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white rounded-2xl border p-4 flex items-center gap-4 shadow-sm transition-all ${a.isActive ? 'border-slate-200/60' : 'border-slate-100 opacity-60'}`}
                        >
                            {/* Logo */}
                            <div className="w-14 h-14 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {a.logoUrl ? (
                                    <img src={a.logoUrl} alt={a.name} className="w-full h-full object-contain p-1" />
                                ) : (
                                    <ImageIcon size={22} className="text-slate-300" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-black text-sm text-slate-800 truncate">{a.name}</p>
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${a.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {a.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{a.description}</p>
                                <a
                                    href={a.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] text-blue-500 font-bold mt-1 hover:underline"
                                >
                                    <Globe size={10} />
                                    {a.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                </a>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleToggle(a)}
                                    className="p-2 rounded-xl hover:bg-slate-50 transition-colors"
                                    title={a.isActive ? 'Desactivar' : 'Activar'}
                                >
                                    {a.isActive
                                        ? <ToggleRight size={20} className="text-green-500" />
                                        : <ToggleLeft size={20} className="text-slate-300" />
                                    }
                                </button>
                                <button
                                    onClick={() => openEdit(a)}
                                    className="p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                    <Pencil size={16} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => handleDelete(a)}
                                    className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                            onClick={closeForm}
                        />
                        {/* Centered container */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.97 }}
                            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                            className="pointer-events-auto w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center">
                                        <Building2 size={18} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-sm">
                                            {editingId ? 'Editar asociación' : 'Nueva asociación'}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            {editingId ? 'Modifica los datos de la asociación' : 'Completa los datos de la asociación'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeForm}
                                    className="w-9 h-9 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal body */}
                            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                                {/* Logo */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                        Logo de la asociación *
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {form.logoUrl ? (
                                                <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <ImageIcon size={24} className="text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={logoUploading}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 text-xs font-black hover:bg-blue-50 transition-colors disabled:opacity-50"
                                            >
                                                {logoUploading ? (
                                                    <><Loader2 size={14} className="animate-spin" /> Subiendo...</>
                                                ) : (
                                                    <><ImageIcon size={14} /> Subir imagen</>
                                                )}
                                            </button>
                                            <input
                                                type="text"
                                                placeholder="O pega una URL de imagen"
                                                value={form.logoUrl}
                                                onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-700 placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                </div>

                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                        Nombre de la asociación *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Cruz Roja Mexicana"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-700 placeholder:text-slate-300 font-medium"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                        Descripción *
                                    </label>
                                    <textarea
                                        placeholder="Descripción breve de la asociación y cómo apoya esta rifa..."
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-700 placeholder:text-slate-300 font-medium resize-none"
                                    />
                                </div>

                                {/* Website URL */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                        Sitio web *
                                    </label>
                                    <div className="relative">
                                        <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            type="url"
                                            placeholder="https://www.ejemplo.org"
                                            value={form.websiteUrl}
                                            onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-700 placeholder:text-slate-300 font-medium"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium px-1">
                                        Al hacer clic en el logo, el visitante será enviado a este sitio.
                                    </p>
                                </div>

                                {/* Order + Active */}
                                <div className="flex gap-3">
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                            Orden
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={form.order}
                                            onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-700 font-medium"
                                        />
                                        <p className="text-[10px] text-slate-400 px-1">Número menor = aparece primero</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                            Activo
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border font-black text-sm transition-all ${form.isActive
                                                ? 'bg-green-50 border-green-200 text-green-600'
                                                : 'bg-slate-50 border-slate-200 text-slate-400'
                                            }`}
                                        >
                                            {form.isActive
                                                ? <><ToggleRight size={18} /> Sí</>
                                                : <><ToggleLeft size={18} /> No</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Modal footer */}
                            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                                <button
                                    onClick={closeForm}
                                    className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-black text-sm hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-60"
                                >
                                    {saving ? (
                                        <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                                    ) : (
                                        <><Save size={16} /> Guardar</>
                                    )}
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
