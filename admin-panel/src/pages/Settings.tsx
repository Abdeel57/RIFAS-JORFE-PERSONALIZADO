import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmContext';

const Settings: React.FC = () => {
    const { showConfirm } = useConfirm();
    const [settings, setSettings] = useState({
        bankName: '',
        clabe: '',
        beneficiary: '',
        accountNumber: '',
        paymentInstructions: '',
        whatsapp: '',
        contactEmail: '',
        instagram: '',
        autoVerificationEnabled: true,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings');
                if (response.data?.success) {
                    const data = response.data.data || {};
                    setSettings({
                        bankName: data.bankName || '',
                        clabe: data.clabe || '',
                        beneficiary: data.beneficiary || '',
                        accountNumber: data.accountNumber || '',
                        paymentInstructions: data.paymentInstructions || '',
                        whatsapp: data.whatsapp || '',
                        contactEmail: data.contactEmail || '',
                        instagram: data.instagram || '',
                        autoVerificationEnabled: data.autoVerificationEnabled !== false,
                    });
                }
            } catch (error) {
                toast.error('Error al cargar la configuración');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        showConfirm({
            message: '¿Guardar cambios?',
            onConfirm: async () => {
                setIsSaving(true);
                try {
                    const response = await api.put('/settings', settings);
                    if (response.data?.success) {
                        toast.success('Configuración guardada correctamente');
                    }
                } catch (error) {
                    toast.error('Error al guardar la configuración');
                    throw error;
                } finally {
                    setIsSaving(false);
                }
            },
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto w-full min-w-0 space-y-8 animate-in fade-in duration-500 overflow-x-hidden">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Configuración del Sistema</h1>
                <p className="text-slate-500 mt-1">Gestiona los datos bancarios y de contacto que ven tus clientes.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Datos Bancarios */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <h2 className="font-black text-slate-800 uppercase tracking-wider text-sm">Datos de Transferencia (SPEI)</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Banco</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.bankName}
                                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                                placeholder="Ej. BBVA México"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CLABE Interbancaria</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.clabe}
                                onChange={(e) => setSettings({ ...settings, clabe: e.target.value })}
                                placeholder="18 dígitos"
                                required
                            />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Beneficiario</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.beneficiary}
                                onChange={(e) => setSettings({ ...settings, beneficiary: e.target.value })}
                                placeholder="Ej. Juan Pérez García"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Cuenta (opcional)</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.accountNumber || ''}
                                onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                                placeholder="Ej. 0123456789"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verificación automática de pagos</label>
                            <div className="flex items-center gap-3 h-12">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.autoVerificationEnabled}
                                        onChange={(e) => setSettings({ ...settings, autoVerificationEnabled: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-bold text-slate-700">Habilitada (Banxico CEP + IA)</span>
                                </label>
                            </div>
                            <p className="text-[10px] text-slate-500 ml-1">Verifica comprobantes SPEI automáticamente usando IA y Banxico. Desactiva para revisión 100% manual.</p>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instrucciones extra de pago (opcional)</label>
                            <textarea
                                className="admin-input resize-none min-h-[80px]"
                                value={settings.paymentInstructions || ''}
                                onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
                                placeholder="Ej. Incluir número de orden en el concepto. Tiempo de acreditación: 24 hrs."
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                {/* Contacto y Redes */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="font-black text-slate-800 uppercase tracking-wider text-sm">Contacto y Soporte</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Soporte</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.whatsapp}
                                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                                placeholder="Ej. +521234567890"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de Contacto</label>
                            <input
                                type="email"
                                className="admin-input"
                                value={settings.contactEmail}
                                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                                placeholder="Ej. contacto@rifasnao.com"
                                required
                            />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de Usuario Instagram</label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.instagram}
                                onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                                placeholder="Ej. @rifasnao_oficial"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-10 py-4 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 touch-manipulation"
                    >
                        {isSaving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Guardando...
                            </>
                        ) : (
                            'Guardar Configuración'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
