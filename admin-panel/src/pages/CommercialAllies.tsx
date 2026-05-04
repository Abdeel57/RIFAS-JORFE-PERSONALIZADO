import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../contexts/ConfirmContext';
import { adminService } from '../services/admin.service';
import {
    Plus, Trash2, Pencil, X, Save, Loader2, Handshake,
    ToggleLeft, ToggleRight, ImageIcon, Link2, Tag,
} from 'lucide-react';

interface CommercialAlly {
    id: string;
    name: string;
    shortName: string;
    logoUrl: string;
    targetView: string;
    badgeLabel: string;
    accentColor: string;
    gradientFrom: string;
    gradientTo: string;
    order: number;
    isActive: boolean;
    createdAt: string;
}

const TARGET_VIEWS = [
    { value: 'terrenos', label: 'Desarrollos campestres' },
    { value: 'seminuevos', label: 'Vehículos seminuevos' },
    { value: 'causas', label: 'Causas sociales' },
    { value: 'faq', label: 'Preguntas frecuentes' },
    { value: 'financiamiento', label: 'Financiamiento' },
    { value: 'contacto', label: 'Contacto' },
    { value: 'verify', label: 'Verificar boletos' },
];

const COLOR_PRESETS = [
    { name: 'Verde', accentColor: '#16a34a', gradientFrom: '#bbf7d0', gradientTo: '#86efac' },
    { name: 'Rojo',  accentColor: '#dc2626', gradientFrom: '#fecaca', gradientTo: '#fca5a5' },
    { name: 'Azul',  accentColor: '#2563eb', gradientFrom: '#bfdbfe', gradientTo: '#93c5fd' },
    { name: 'Ámbar', accentColor: '#d97706', gradientFrom: '#fde68a', gradientTo: '#fcd34d' },
    { name: 'Violeta',accentColor: '#7c3aed', gradientFrom: '#ddd6fe', gradientTo: '#c4b5fd' },
    { name: 'Rosa',  accentColor: '#db2777', gradientFrom: '#fbcfe8', gradientTo: '#f9a8d4' },
    { name: 'Cian',  accentColor: '#0891b2', gradientFrom: '#a5f3fc', gradientTo: '#67e8f9' },
    { name: 'Slate', accentColor: '#475569', gradientFrom: '#cbd5e1', gradientTo: '#94a3b8' },
];

const EMPTY_FORM = {
    name: '',
    shortName: '',
    logoUrl: '',
    targetView: 'terrenos',
    badgeLabel: '',
    accentColor: '#16a34a',
    gradientFrom: '#bbf7d0',
    gradientTo: '#86efac',
    order: 0,
    isActive: true,
};

export default function CommercialAllies() {
    const { showConfirm } = useConfirm();
    const [allies, setAllies] = useState<CommercialAlly[]>([]);
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
            const data = await adminService.getCommercialAllies();
            setAllies(data || []);
        } catch {
            toast.error('Error al cargar los aliados comerciales');
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

    const openEdit = (a: CommercialAlly) => {
        setEditingId(a.id);
        setForm({
            name: a.name,
            shortName: a.shortName,
            logoUrl: a.logoUrl,
            targetView: a.targetView,
            badgeLabel: a.badgeLabel,
            accentColor: a.accentColor,
            gradientFrom: a.gradientFrom,
            gradientTo: a.gradientTo,
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
        if (!form.shortName.trim()) return toast.error('Las iniciales son requeridas');
        if (form.shortName.trim().length > 4) return toast.error('Máximo 4 caracteres en iniciales');
        if (!form.logoUrl.trim()) return toast.error('El logo es requerido (sube una imagen o pega una URL)');
        if (!form.targetView) return toast.error('Selecciona la sección destino');
        if (!form.badgeLabel.trim()) return toast.error('La etiqueta del badge es requerida');

        try {
            setSaving(true);
            const payload = {
                name: form.name.trim(),
                shortName: form.shortName.trim().toUpperCase(),
                logoUrl: form.logoUrl,
                targetView: form.targetView,
                badgeLabel: form.badgeLabel.trim(),
                accentColor: form.accentColor,
                gradientFrom: form.gradientFrom,
                gradientTo: form.gradientTo,
                order: Number(form.order) || 0,
                isActive: form.isActive,
            };

            if (editingId) {
                await adminService.updateCommercialAlly(editingId, payload);
                toast.success('Aliado actualizado');
            } else {
                await adminService.createCommercialAlly(payload);
                toast.success('Aliado creado');
            }
            closeForm();
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (a: CommercialAlly) => {
        showConfirm({
            message: `¿Eliminar "${a.name}"? Esta acción no se puede deshacer.`,
            onConfirm: async () => {
                await adminService.deleteCommercialAlly(a.id);
                toast.success('Aliado eliminado');
                load();
            },
        });
    };

    const handleToggle = async (a: CommercialAlly) => {
        try {
            await adminService.updateCommercialAlly(a.id, { isActive: !a.isActive });
            setAllies(prev => prev.map(x => x.id === a.id ? { ...x, isActive: !x.isActive } : x));
        } catch {
            toast.error('Error al actualizar el estado');
        }
    };

    const targetViewLabel = (value: string) =>
        TARGET_VIEWS.find(t => t.value === value)?.label || value;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Aliados Comerciales</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Gestiona los cards grandes del banner inferior — Villas de Guadalupe, RED Autos, etc.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black px-4 py-2.5 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    <Plus size={16} strokeWidth={3} />
                    Nuevo aliado
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-blue-400" />
                </div>
            ) : allies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="w-14 h-14 rounded-3xl bg-blue-50 flex items-center justify-center">
                        <Handshake size={24} className="text-blue-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Sin aliados comerciales aún</p>
                    <p className="text-xs text-slate-300 max-w-xs">
                        Agrega tus aliados comerciales (negocios asociados). Aparecerán como cards grandes en el banner inferior.
                    </p>
                    <button
                        onClick={openCreate}
                        className="mt-2 flex items-center gap-2 bg-blue-600 text-white text-sm font-black px-5 py-2.5 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                        <Plus size={15} strokeWidth={3} />
                        Agregar primer aliado
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {allies.map(a => (
                        <motion.div
                            key={a.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white rounded-2xl border p-4 flex items-center gap-4 shadow-sm transition-all ${a.isActive ? 'border-slate-200/60' : 'border-slate-100 opacity-60'}`}
                        >
                            {/* Logo */}
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                                style={{
                                    background: a.logoUrl ? '#f8fafc' : `linear-gradient(135deg, ${a.gradientFrom}, ${a.gradientTo})`,
                                    border: `1.5px solid ${a.accentColor}30`,
                                }}
                            >
                                {a.logoUrl ? (
                                    <img src={a.logoUrl} alt={a.name} className="w-full h-full object-contain p-1" />
                                ) : (
                                    <span className="text-base font-black text-white">{a.shortName}</span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-black text-sm text-slate-800 truncate">{a.name}</p>
                                    <span
                                        className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                                        style={{ background: `${a.accentColor}15`, color: a.accentColor }}
                                    >
                                        {a.badgeLabel}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${a.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {a.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                                    <Link2 size={10} />
                                    Redirige a: <span className="text-slate-600 font-bold">{targetViewLabel(a.targetView)}</span>
                                </p>
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
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                            onClick={closeForm}
                        />
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
                                            <Handshake size={18} className="text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-sm">
                                                {editingId ? 'Editar aliado comercial' : 'Nuevo aliado comercial'}
                                            </h3>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {editingId ? 'Modifica los datos del aliado' : 'Configura el card del aliado'}
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
                                            Logo del aliado *
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
                                                style={{
                                                    background: form.logoUrl ? '#f8fafc' : `linear-gradient(135deg, ${form.gradientFrom}, ${form.gradientTo})`,
                                                    border: `2px dashed ${form.accentColor}40`,
                                                }}
                                            >
                                                {form.logoUrl ? (
                                                    <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                                                ) : form.shortName ? (
                                                    <span className="text-xl font-black text-white">{form.shortName.toUpperCase()}</span>
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

                                    {/* Name + ShortName */}
                                    <div className="flex gap-3">
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                                Nombre completo *
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Villas de Guadalupe"
                                                value={form.name}
                                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-700 placeholder:text-slate-300 font-medium"
                                            />
                                        </div>
                                        <div className="w-24 space-y-1.5">
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                                Iniciales *
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={4}
                                                placeholder="VG"
                                                value={form.shortName}
                                                onChange={e => setForm(f => ({ ...f, shortName: e.target.value.toUpperCase() }))}
                                                className="w-full px-3 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 text-center font-black uppercase text-slate-700"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium px-1 -mt-3">
                                        Las iniciales se muestran como placeholder cuando no hay logo cargado.
                                    </p>

                                    {/* Target View */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                            Sección destino *
                                        </label>
                                        <select
                                            value={form.targetView}
                                            onChange={e => setForm(f => ({ ...f, targetView: e.target.value }))}
                                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-700 font-medium bg-white cursor-pointer"
                                        >
                                            {TARGET_VIEWS.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-slate-400 font-medium px-1">
                                            A qué página de la rifa redirige al hacer clic en el card.
                                        </p>
                                    </div>

                                    {/* Badge Label */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                            Etiqueta del badge *
                                        </label>
                                        <div className="relative">
                                            <Tag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="text"
                                                placeholder="Ej: Desarrollos"
                                                maxLength={16}
                                                value={form.badgeLabel}
                                                onChange={e => setForm(f => ({ ...f, badgeLabel: e.target.value }))}
                                                className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-700 placeholder:text-slate-300 font-medium"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium px-1">
                                            Texto pequeño debajo del nombre (ej: "Desarrollos", "Seminuevos").
                                        </p>
                                    </div>

                                    {/* Color Presets */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                            Color del card
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {COLOR_PRESETS.map(preset => {
                                                const selected = form.accentColor === preset.accentColor;
                                                return (
                                                    <button
                                                        key={preset.name}
                                                        type="button"
                                                        onClick={() => setForm(f => ({
                                                            ...f,
                                                            accentColor: preset.accentColor,
                                                            gradientFrom: preset.gradientFrom,
                                                            gradientTo: preset.gradientTo,
                                                        }))}
                                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${selected ? 'border-slate-700 scale-105' : 'border-transparent hover:border-slate-200'}`}
                                                    >
                                                        <div
                                                            className="w-8 h-8 rounded-lg shadow-sm"
                                                            style={{ background: `linear-gradient(135deg, ${preset.gradientFrom}, ${preset.gradientTo})` }}
                                                        />
                                                        <span className="text-[9px] font-black text-slate-600">{preset.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
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
                                            <p className="text-[10px] text-slate-400 px-1">Menor = aparece primero</p>
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
