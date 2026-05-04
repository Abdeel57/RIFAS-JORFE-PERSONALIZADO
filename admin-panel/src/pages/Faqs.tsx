import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../contexts/ConfirmContext';
import { adminService } from '../services/admin.service';
import {
    Plus, Trash2, Pencil, X, Save, Loader2, HelpCircle,
    ToggleLeft, ToggleRight,
} from 'lucide-react';

interface Faq {
    id: string;
    question: string;
    answer: string;
    order: number;
    isActive: boolean;
    createdAt: string;
}

const EMPTY_FORM = {
    question: '', answer: '', order: 0, isActive: true,
};

export default function Faqs() {
    const { showConfirm } = useConfirm();
    const [items, setItems] = useState<Faq[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });

    const load = async () => {
        try { setLoading(true); const data = await adminService.getFaqs(); setItems(data || []); }
        catch { toast.error('Error al cargar las preguntas'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
    const openEdit = (a: Faq) => {
        setEditingId(a.id);
        setForm({ question: a.question, answer: a.answer, order: a.order, isActive: a.isActive });
        setShowForm(true);
    };
    const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }); };

    const handleSave = async () => {
        if (!form.question.trim()) return toast.error('La pregunta es requerida');
        if (!form.answer.trim()) return toast.error('La respuesta es requerida');

        try {
            setSaving(true);
            const payload = {
                question: form.question.trim(),
                answer: form.answer.trim(),
                order: Number(form.order) || 0,
                isActive: form.isActive,
            };
            if (editingId) { await adminService.updateFaq(editingId, payload); toast.success('Pregunta actualizada'); }
            else { await adminService.createFaq(payload); toast.success('Pregunta creada'); }
            closeForm(); load();
        } catch (err: any) { toast.error(err?.response?.data?.message || 'Error al guardar'); }
        finally { setSaving(false); }
    };

    const handleDelete = (a: Faq) => {
        showConfirm({
            message: `¿Eliminar esta pregunta? Esta acción no se puede deshacer.`,
            onConfirm: async () => { await adminService.deleteFaq(a.id); toast.success('Pregunta eliminada'); load(); },
        });
    };

    const handleToggle = async (a: Faq) => {
        try {
            await adminService.updateFaq(a.id, { isActive: !a.isActive });
            setItems(prev => prev.map(x => x.id === a.id ? { ...x, isActive: !x.isActive } : x));
        } catch { toast.error('Error al actualizar el estado'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Preguntas Frecuentes</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Gestiona las preguntas y respuestas que aparecen en la sección "FAQ"
                    </p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black px-4 py-2.5 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95">
                    <Plus size={16} strokeWidth={3} /> Nueva pregunta
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-blue-400" /></div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="w-14 h-14 rounded-3xl bg-violet-50 flex items-center justify-center"><HelpCircle size={24} className="text-violet-300" /></div>
                    <p className="text-sm font-bold text-slate-400">Sin preguntas aún</p>
                    <p className="text-xs text-slate-300 max-w-xs">Agrega las preguntas frecuentes que tus visitantes pueden tener.</p>
                    <button onClick={openCreate} className="mt-2 flex items-center gap-2 bg-blue-600 text-white text-sm font-black px-5 py-2.5 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95">
                        <Plus size={15} strokeWidth={3} /> Agregar primera pregunta
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map(a => (
                        <motion.div key={a.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className={`bg-white rounded-2xl border p-4 flex items-start gap-4 shadow-sm transition-all ${a.isActive ? 'border-slate-200/60' : 'border-slate-100 opacity-60'}`}>
                            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                                <HelpCircle size={18} className="text-violet-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-black text-sm text-slate-800">{a.question}</p>
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${a.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>{a.isActive ? 'Activo' : 'Inactivo'}</span>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{a.answer}</p>
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
                                        <div className="w-9 h-9 rounded-2xl bg-violet-50 flex items-center justify-center"><HelpCircle size={18} className="text-violet-500" /></div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-sm">{editingId ? 'Editar pregunta' : 'Nueva pregunta'}</h3>
                                            <p className="text-[10px] text-slate-400 font-medium">Pregunta + respuesta del FAQ</p>
                                        </div>
                                    </div>
                                    <button onClick={closeForm} className="w-9 h-9 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"><X size={18} /></button>
                                </div>

                                <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Pregunta *</label>
                                        <input type="text" placeholder="Ej: ¿Cómo funciona el sorteo?" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-700 placeholder:text-slate-300 font-medium" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Respuesta *</label>
                                        <textarea placeholder="Respuesta clara y completa..." value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} rows={5} className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-slate-700 placeholder:text-slate-300 font-medium resize-none" />
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Orden</label>
                                            <input type="number" min={0} value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-700 font-medium" />
                                            <p className="text-[10px] text-slate-400 px-1">Menor = aparece primero</p>
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
