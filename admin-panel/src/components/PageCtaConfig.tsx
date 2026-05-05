import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../services/admin.service';
import {
    Phone, Link2, Save, Loader2, Settings as Cog, ChevronDown, MessageCircle,
} from 'lucide-react';

interface Props {
    section: 'terrenos' | 'seminuevos';
    /** Etiqueta humana de la sección, ej "Desarrollos" o "Vehículos Seminuevos" */
    sectionLabel: string;
    /** Color de acento (azul, ámbar, etc.) */
    accentColor?: 'blue' | 'amber';
}

const COLORS = {
    blue:  { bg: 'bg-blue-50',  border: 'border-blue-100',  text: 'text-blue-600',  ring: 'focus:ring-blue-200' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', ring: 'focus:ring-amber-200' },
};

const PageCtaConfig: React.FC<Props> = ({ section, sectionLabel, accentColor = 'blue' }) => {
    const c = COLORS[accentColor];
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        whatsappPhone: '',
        whatsappMessage: '',
        infoUrl: '',
        primaryLabel: '',
        secondaryLabel: '',
    });

    useEffect(() => {
        let mounted = true;
        adminService.getPageCta(section)
            .then(data => {
                if (!mounted) return;
                if (data) {
                    setForm({
                        whatsappPhone: data.whatsappPhone || '',
                        whatsappMessage: data.whatsappMessage || '',
                        infoUrl: data.infoUrl || '',
                        primaryLabel: data.primaryLabel || '',
                        secondaryLabel: data.secondaryLabel || '',
                    });
                }
            })
            .catch(() => { /* silent — first time, sin datos */ })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [section]);

    const handleSave = async () => {
        // Validación básica del teléfono (solo dígitos)
        if (form.whatsappPhone && !/^\d{10,15}$/.test(form.whatsappPhone)) {
            return toast.error('Teléfono inválido. Solo dígitos, 10-15 caracteres (incluye lada del país)');
        }
        if (form.infoUrl && !/^https?:\/\/.+/.test(form.infoUrl)) {
            return toast.error('URL inválida. Debe empezar con https://');
        }
        try {
            setSaving(true);
            await adminService.savePageCta(section, form);
            toast.success('Configuración guardada');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const isConfigured = form.whatsappPhone || form.infoUrl;

    return (
        <div className={`rounded-2xl border ${c.border} ${c.bg} overflow-hidden`}>
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-white/40 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-sm ${c.text}`}>
                        <Cog size={16} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-black text-slate-800">Configurar botones de CTA</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                            {loading ? 'Cargando...' : isConfigured ? `WhatsApp y URL para ${sectionLabel}` : `Sin configurar — los botones no funcionarán hasta que llenes esto`}
                        </p>
                    </div>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {expanded && !loading && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-2 space-y-4 border-t border-white/60 bg-white/60">
                            {/* WhatsApp Phone */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                    Teléfono WhatsApp (con lada)
                                </label>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        type="text"
                                        placeholder="526621234567"
                                        value={form.whatsappPhone}
                                        onChange={e => setForm(f => ({ ...f, whatsappPhone: e.target.value.replace(/\D/g, '') }))}
                                        maxLength={15}
                                        className={`w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${c.ring} text-slate-700 placeholder:text-slate-300 font-medium bg-white`}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium px-1">
                                    Solo dígitos, incluye lada del país (52 para México). Ej: 526621234567
                                </p>
                            </div>

                            {/* WhatsApp Message */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                    Mensaje pre-cargado
                                </label>
                                <div className="relative">
                                    <MessageCircle size={14} className="absolute left-4 top-3 text-slate-300" />
                                    <textarea
                                        placeholder="Hola, me interesa información sobre los terrenos disponibles"
                                        value={form.whatsappMessage}
                                        onChange={e => setForm(f => ({ ...f, whatsappMessage: e.target.value }))}
                                        rows={2}
                                        maxLength={500}
                                        className={`w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${c.ring} text-slate-700 placeholder:text-slate-300 font-medium resize-none bg-white`}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium px-1">
                                    Texto que se autocompletará en el chat al abrir WhatsApp.
                                </p>
                            </div>

                            {/* Info URL */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                    URL de "Ver Más Información"
                                </label>
                                <div className="relative">
                                    <Link2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        type="url"
                                        placeholder="https://www.ejemplo.com/catalogo"
                                        value={form.infoUrl}
                                        onChange={e => setForm(f => ({ ...f, infoUrl: e.target.value }))}
                                        className={`w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${c.ring} text-slate-700 placeholder:text-slate-300 font-medium bg-white`}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium px-1">
                                    Sitio web, catálogo PDF, Facebook, etc. Si lo dejas vacío el botón no aparecerá.
                                </p>
                            </div>

                            {/* Etiquetas opcionales */}
                            <details className="rounded-xl border border-slate-200 bg-white">
                                <summary className="cursor-pointer px-4 py-2.5 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 select-none">
                                    Personalizar texto de botones (opcional)
                                </summary>
                                <div className="px-4 pb-4 pt-1 space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Botón primario (WhatsApp)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Agendar Cita por WhatsApp"
                                            value={form.primaryLabel}
                                            onChange={e => setForm(f => ({ ...f, primaryLabel: e.target.value }))}
                                            maxLength={60}
                                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-700"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Botón secundario (URL info)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Ver Más Información"
                                            value={form.secondaryLabel}
                                            onChange={e => setForm(f => ({ ...f, secondaryLabel: e.target.value }))}
                                            maxLength={60}
                                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-700"
                                        />
                                    </div>
                                </div>
                            </details>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-md shadow-blue-200 transition-all active:scale-95 disabled:opacity-60"
                            >
                                {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : <><Save size={14} /> Guardar configuración</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PageCtaConfig;
