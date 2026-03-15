import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../contexts/ConfirmContext';
import { useAuth } from '../hooks/useAuth';
import Skeleton from '../components/Skeleton';
import {
    ChevronRight, Palette, CreditCard, Phone,
    Image, Globe, Instagram, ArrowLeft, Save, Bot, X, Users, Trash2, Plus, Mail, User, Loader2, Facebook,
    Wrench, Clock, AlertTriangle, CheckCircle2, Bell, BellOff, BellRing, Settings2
} from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

// ─── Color utilities ──────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
    h /= 360; s /= 100; l /= 100;
    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    if (s === 0) {
        const v = Math.round(l * 255).toString(16).padStart(2, '0');
        return `#${v}${v}${v}`;
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return `#${[hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)]
        .map(v => Math.round(v * 255).toString(16).padStart(2, '0'))
        .join('')}`;
}

function autoSecondary(primaryHex: string): string {
    try {
        const [h, s, l] = hexToHsl(primaryHex);
        return hslToHex((h + 30) % 360, Math.min(s + 5, 100), Math.max(l - 5, 10));
    } catch { return '#6366f1'; }
}

function isValidHex(hex: string): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(hex);
}

// ─── Image compression ────────────────────────────────────────────────────────

const MAX_LOGO_DIMENSION = 512;

function compressImage(file: File): Promise<{ dataUrl: string; sizeKb: number }> {
    return new Promise((resolve, reject) => {
        if (file.type === 'image/svg+xml') {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string;
                resolve({ dataUrl, sizeKb: Math.round(file.size / 1024) });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        const img = document.createElement('img');
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            let { width, height } = img;
            if (width > MAX_LOGO_DIMENSION || height > MAX_LOGO_DIMENSION) {
                if (width >= height) { height = Math.round(height * MAX_LOGO_DIMENSION / width); width = MAX_LOGO_DIMENSION; }
                else { width = Math.round(width * MAX_LOGO_DIMENSION / height); height = MAX_LOGO_DIMENSION; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas no disponible')); return; }
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/webp', 0.85);
            const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
            resolve({ dataUrl, sizeKb });
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('No se pudo leer la imagen')); };
        img.src = objectUrl;
    });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Panel = 'logo' | 'colores' | 'banco' | 'contacto' | 'redes' | 'marketing' | 'sistema' | 'usuarios' | 'herramientas' | 'notificaciones' | null;

interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
    planType: string | null;
    planStartDate: string | null;
    planExpiryDate: string | null;
    createdAt: string;
}

interface SettingsData {
    siteName: string;
    bankName: string;
    clabe: string;
    beneficiary: string;
    accountNumber: string;
    paymentInstructions: string;
    whatsapp: string;
    contactEmail: string;
    instagram: string;
    facebookUrl: string;
    autoVerificationEnabled: boolean;
    logoUrl: string;
    logoSize: number;
    primaryColor: string;
    secondaryColor: string;
    facebookPixelId: string;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

const FieldLabel: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
    <div className="mb-1.5 px-0.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{children}</label>
        {hint && <p className="text-[10px] text-slate-400/80 mt-0.5 font-medium">{hint}</p>}
    </div>
);

const PanelHeader: React.FC<{ title: string; icon: React.ReactNode; onBack: () => void; onSave: () => void; isSaving: boolean }> = ({
    title, icon, onBack, onSave, isSaving
}) => (
    <div className="flex items-center gap-3 mb-6 bg-white/50 sticky top-0 z-20 backdrop-blur-md pt-2 pb-2">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50 active:scale-90 transition-all">
            <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#2563EB] shadow-inner">
                {icon}
            </div>
            <h2 className="font-black text-slate-800 text-base tracking-tight truncate">{title}</h2>
        </div>
        <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 active:scale-95 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-100 disabled:opacity-60"
        >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isSaving ? 'Guardando' : 'Guardar'}</span>
        </button>
    </div>
);

const MenuRow: React.FC<{
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    subtitle?: string;
    value?: string;
    onClick: () => void;
    last?: boolean;
}> = ({ icon, iconBg, label, subtitle, value, onClick, last }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-slate-50/80 active:bg-slate-100 transition-all ${!last ? 'border-b border-slate-100' : ''}`}
    >
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-black/5 ${iconBg}`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-slate-800 tracking-tight leading-none">{label}</p>
            {subtitle && <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider tabular-nums">{subtitle}</p>}
        </div>
        {value && (
            <span className="text-[11px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg truncate max-w-[100px] flex-shrink-0">{value}</span>
        )}
        <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
    </button>
);

const MenuSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{title}</p>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {children}
        </div>
    </div>
);

const BrandPreview: React.FC<{ primary: string; secondary: string; logoUrl: string; logoSize: number; siteName: string }> = ({
    primary, secondary, logoUrl, logoSize, siteName,
}) => {
    const gradient = `linear-gradient(135deg, ${primary}, ${secondary})`;
    return (
        <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 space-y-4 shadow-inner">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Globe size={12} /> Vista previa en vivo
            </p>

            <div className="bg-white rounded-3xl p-1 shadow-2xl border border-slate-200">
                <div className="bg-white rounded-[20px] px-4 py-3 flex items-center gap-3 border border-slate-50">
                    <div className="relative flex-shrink-0">
                        {logoUrl ? (
                            <img src={logoUrl} alt="logo" style={{ width: logoSize, height: logoSize }} className="object-contain" />
                        ) : (
                            <div className="rounded-xl flex items-center justify-center shadow-lg shadow-black/10" style={{ width: 40, height: 40, background: gradient }}>
                                <span className="text-white font-black italic text-xl">N</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <span className="font-black text-sm text-slate-800 tracking-tighter block">{siteName || 'TU MARCA'}</span>
                        <div className="flex gap-1 mt-0.5">
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="h-12 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg" style={{ background: primary }}>BOTÓN COMPRA</div>
                <div className="h-12 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg" style={{ background: secondary }}>BOTÓN COMPRA</div>
            </div>
        </div>
    );
};

// ─── Main Settings component ──────────────────────────────────────────────────

const Settings: React.FC = () => {
    const { showConfirm } = useConfirm();
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [activePanel, setActivePanel] = useState<Panel>(null);
    const { permission, subscribed, loading: pushLoading, subscribe, unsubscribe, sendTest, isSupported } = usePushNotifications();
    const push = { permission, subscribed, loading: pushLoading, subscribe, unsubscribe, sendTest, isSupported };


    const [settings, setSettings] = useState<SettingsData>({
        siteName: 'Bismark', bankName: '', clabe: '', beneficiary: '',
        accountNumber: '', paymentInstructions: '', whatsapp: '',
        contactEmail: '', instagram: '', facebookUrl: '',
        autoVerificationEnabled: true, logoUrl: '', logoSize: 44,
        primaryColor: '#3b82f6', secondaryColor: '#6366f1',
        facebookPixelId: '',
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [logoSizeKb, setLogoSizeKb] = useState(0);
    const [primaryHexInput, setPrimaryHexInput] = useState('#3b82f6');
    const [secondaryHexInput, setSecondaryHexInput] = useState('#6366f1');
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);
    const [isEditingPayment, setIsEditingPayment] = useState<string | null>(null);
    const [paymentForm, setPaymentForm] = useState({ bankName: '', clabe: '', beneficiary: '', accountNumber: '', isActive: false });

    const fetchPaymentMethods = async () => {
        setIsPaymentsLoading(true);
        try {
            const res = await api.get('/settings/payment-methods');
            if (res.data?.success) setPaymentMethods(res.data.data);
        } catch { toast.error('Error al cargar métodos de pago'); }
        finally { setIsPaymentsLoading(false); }
    };

    useEffect(() => {
        if (activePanel === 'banco') fetchPaymentMethods();
    }, [activePanel]);

    const handleSavePayment = async () => {
        if (!paymentForm.bankName || !paymentForm.clabe || !paymentForm.beneficiary) {
            toast.error('Completa los campos obligatorios');
            return;
        }
        try {
            if (isEditingPayment === 'new') {
                await api.post('/settings/payment-methods', paymentForm);
                toast.success('Método de pago agregado');
            } else {
                await api.put(`/settings/payment-methods/${isEditingPayment}`, paymentForm);
                toast.success('Método de pago actualizado');
            }
            setIsEditingPayment(null);
            fetchPaymentMethods();
        } catch { toast.error('Error al guardar el método de pago'); }
    };

    const handleDeletePayment = (id: string) => {
        showConfirm({
            message: '¿Eliminar este método de pago?',
            onConfirm: async () => {
                try {
                    await api.delete(`/settings/payment-methods/${id}`);
                    toast.success('Método de pago eliminado');
                    fetchPaymentMethods();
                } catch { toast.error('Error al eliminar'); }
            }
        });
    };

    const handleTogglePayment = async (id: string, currentStatus: boolean) => {
        try {
            await api.put(`/settings/payment-methods/${id}`, { isActive: !currentStatus });
            toast.success(!currentStatus ? 'Método de pago activado' : 'Método de pago desactivado');
            fetchPaymentMethods();
        } catch { toast.error('Error al actualizar estado'); }
    };

    const { admin } = useAuth();
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [isUsersLoading, setIsUsersLoading] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'vendedor', planType: '' });
    const [planModal, setPlanModal] = useState<AdminUser | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<'mensual' | 'por_rifa' | ''>('');
    const [savingPlan, setSavingPlan] = useState(false);

    const fetchAdmins = async () => {
        setIsUsersLoading(true);
        try {
            const res = await api.get('/admin/admin-users');
            if (res.data?.success) setAdminUsers(res.data.data);
        } catch { toast.error('Error al cargar administradores'); }
        finally { setIsUsersLoading(false); }
    };

    useEffect(() => {
        if (activePanel === 'usuarios') fetchAdmins();
        if (activePanel === 'herramientas') fetchRaffles();
    }, [activePanel]);

    const [raffles, setRaffles] = useState<any[]>([]);
    const [isRafflesLoading, setIsRafflesLoading] = useState(false);
    const [selectedRaffleId, setSelectedRaffleId] = useState<string | null>(null);

    const activeRaffleDetail = useMemo(() =>
        raffles.find(r => r.id === selectedRaffleId),
        [raffles, selectedRaffleId]);

    const fetchRaffles = async () => {
        setIsRafflesLoading(true);
        try {
            const res = await api.get('/admin/raffles');
            if (res.data?.success) setRaffles(res.data.data);
        } catch { toast.error('Error al cargar rifas'); }
        finally { setIsRafflesLoading(false); }
    };

    const handleUpdateRaffleHours = async (raffleId: string, hours: number) => {
        try {
            const res = await api.put(`/admin/raffles/${raffleId}`, { autoReleaseHours: hours });
            if (res.data?.success) {
                toast.success('Tiempo de liberación actualizado');
                setRaffles(prev => prev.map(r => r.id === raffleId ? { ...r, autoReleaseHours: hours } : r));
            }
        } catch { toast.error('Error al actualizar el tiempo'); }
    };

    const handleUpdateLuckyNumbers = async (raffleId: string, numbers: number[]) => {
        try {
            const res = await api.put(`/admin/raffles/${raffleId}`, { luckyMachineNumbers: numbers });
            if (res.data?.success) {
                toast.success('Números de la suerte actualizados');
                setRaffles(prev => prev.map(r => r.id === raffleId ? { ...r, luckyMachineNumbers: numbers } : r));
            }
        } catch { toast.error('Error al actualizar los números'); }
    };

    const handleCreateAdmin = async () => {
        const { name, email, password, confirmPassword, role } = newUser;
        if (!name.trim() || name.trim().length < 2) {
            toast.error('El nombre debe tener al menos 2 caracteres');
            return;
        }
        if (!email.trim() || email.trim().length < 3) {
            toast.error('El usuario/correo debe tener al menos 3 caracteres');
            return;
        }
        if (!password || password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }
        setIsCreatingUser(true);
        try {
            const res = await api.post('/admin/admin-users', { name: name.trim(), email: email.trim(), password, role, planType: newUser.planType || undefined });
            if (res.data?.success) {
                toast.success('Usuario creado correctamente');
                setNewUser({ name: '', email: '', password: '', confirmPassword: '', role: 'vendedor', planType: '' });
                setShowAddForm(false);
                fetchAdmins();
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message || 'Error al crear usuario';
            toast.error(msg);
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleSetPlan = async () => {
        if (!planModal) return;
        setSavingPlan(true);
        try {
            await api.put(`/admin/admin-users/${planModal.id}/plan`, { planType: selectedPlan || null });
            toast.success('Plan actualizado correctamente');
            setPlanModal(null);
            fetchAdmins();
        } catch {
            toast.error('Error al actualizar el plan');
        } finally {
            setSavingPlan(false);
        }
    };

    const getPlanDaysLeft = (expiryDate: string | null) => {
        if (!expiryDate) return null;
        return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    };

    const handleDeleteAdmin = (id: string, name: string) => {
        showConfirm({
            message: `¿Eliminar a "${name}"? Debe haber al menos un administrador en el sistema.`,
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/admin-users/${id}`);
                    toast.success('Usuario eliminado');
                    fetchAdmins();
                } catch (err: any) {
                    const msg = err.response?.data?.error || err.message || 'Error al eliminar';
                    toast.error(msg);
                }
            },
        });
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings');
                if (response.data?.success) {
                    const data = response.data.data || {};
                    const primary = data.primaryColor || '#3b82f6';
                    const secondary = data.secondaryColor || '#6366f1';
                    const savedLogo = data.logoUrl || '';
                    setSettings({
                        siteName: data.siteName || 'Bismark',
                        bankName: data.bankName || '', clabe: data.clabe || '',
                        beneficiary: data.beneficiary || '', accountNumber: data.accountNumber || '',
                        paymentInstructions: data.paymentInstructions || '',
                        whatsapp: data.whatsapp || '', contactEmail: data.contactEmail || '',
                        instagram: data.instagram || '', facebookUrl: data.facebookUrl || '',
                        autoVerificationEnabled: data.autoVerificationEnabled !== false,
                        logoUrl: savedLogo,
                        logoSize: typeof data.logoSize === 'number' ? data.logoSize : 44,
                        primaryColor: primary, secondaryColor: secondary,
                        facebookPixelId: data.facebookPixelId || '',
                    });
                    if (savedLogo) setLogoSizeKb(Math.round((savedLogo.length * 3) / 4 / 1024));
                    setPrimaryHexInput(primary);
                    setSecondaryHexInput(secondary);
                }
            } catch { toast.error('Error al cargar la configuración'); }
            finally { setIsLoading(false); }
        };
        fetchSettings();
    }, []);

    const handleSave = useCallback(() => {
        showConfirm({
            message: '¿Guardar todos los cambios?',
            onConfirm: async () => {
                setIsSaving(true);
                try {
                    const response = await api.put('/settings', settings);
                    if (response.data?.success) {
                        toast.success('Configuración guardada');
                    }
                } catch { toast.error('Error al guardar'); }
                finally { setIsSaving(false); }
            },
        });
    }, [settings, showConfirm]);

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setIsCompressing(true);
        try {
            const { dataUrl, sizeKb } = await compressImage(file);
            setSettings(prev => ({ ...prev, logoUrl: dataUrl }));
            setLogoSizeKb(sizeKb);
            toast.success(`Logo listo (${sizeKb} KB)`);
        } catch { toast.error('No se pudo procesar la imagen.'); }
        finally { setIsCompressing(false); }
    };

    const handlePrimaryChange = (hex: string) => {
        const secondary = autoSecondary(hex);
        setSettings(prev => ({ ...prev, primaryColor: hex, secondaryColor: secondary }));
        setPrimaryHexInput(hex);
        setSecondaryHexInput(secondary);
    };

    const set = useCallback((field: keyof SettingsData, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    }, []);

    if (isLoading) return <Skeleton count={6} className="h-20 w-full mb-4" />;

    const renderContent = () => {
        if (!activePanel) {
            return (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Configuración</h1>
                        <p className="text-sm text-slate-400 mt-1">Personaliza la experiencia de tu plataforma</p>
                    </div>


                    <div className="space-y-4 max-w-2xl">
                        <MenuSection title="Identidad de Marca">
                            <MenuRow icon={<Image size={18} />} iconBg="bg-blue-50 text-blue-500" label="Logo y Nombre" subtitle={settings.siteName} onClick={() => setActivePanel('logo')} />
                            <MenuRow icon={<Palette size={18} />} iconBg="bg-violet-50 text-violet-500" label="Colores de Interfaz" value={settings.primaryColor} onClick={() => setActivePanel('colores')} last />
                        </MenuSection>

                        <MenuSection title="Pagos y Ventas">
                            <MenuRow icon={<CreditCard size={18} />} iconBg="bg-emerald-50 text-emerald-500" label="Métodos de Pago" subtitle={settings.bankName || 'Bancos y Transferencia'} onClick={() => setActivePanel('banco')} />
                            <MenuRow icon={<Bot size={18} />} iconBg="bg-indigo-50 text-indigo-500" label="Validación de pagos" value={settings.autoVerificationEnabled ? 'Activa' : 'Manual'} onClick={() => setActivePanel('sistema')} last />
                        </MenuSection>

                        {admin?.role !== 'vendedor' && (
                            <MenuSection title="Herramientas Avanzadas">
                                <MenuRow
                                    icon={<Bell size={18} />}
                                    iconBg="bg-amber-50 text-amber-500"
                                    label="Notificaciones Push"
                                    subtitle={push.subscribed ? 'Activadas en este dispositivo' : 'Desactivadas'}
                                    onClick={() => setActivePanel('notificaciones')}
                                />
                                <MenuRow
                                    icon={<Wrench size={18} />}
                                    iconBg="bg-orange-50 text-orange-500"
                                    label="Herramientas y funciones"
                                    subtitle="Configuración de automatización"
                                    onClick={() => setActivePanel('herramientas')}
                                    last
                                />
                            </MenuSection>
                        )}

                        <MenuSection title="Comunicación">
                            <MenuRow icon={<Phone size={18} />} iconBg="bg-rose-50 text-rose-500" label="Contacto y Soporte" subtitle={settings.whatsapp} onClick={() => setActivePanel('contacto')} />
                            <MenuRow icon={<Globe size={18} />} iconBg="bg-sky-50 text-sky-500" label="Redes Sociales" value={`@${settings.instagram.replace(/^@/, '')}`} onClick={() => setActivePanel('redes')} last />
                        </MenuSection>

                        <MenuSection title="Marketing y Análisis">
                            <MenuRow icon={<Facebook size={18} />} iconBg="bg-blue-50 text-blue-600" label="Meta Pixel" subtitle={settings.facebookPixelId || 'No configurado'} onClick={() => setActivePanel('marketing')} last />
                        </MenuSection>

                        {admin?.role === 'super_admin' && (
                            <MenuSection title="Control de Acceso">
                                <MenuRow icon={<Users size={18} />} iconBg="bg-slate-50 text-slate-600" label="Gestionar Administradores" last onClick={() => setActivePanel('usuarios')} />
                            </MenuSection>
                        )}
                    </div>


                    {/* ── Notificaciones Push ── */}
                    {
                        (admin?.role === 'admin' || admin?.role === 'super_admin') && isSupported && (
                            <div className="space-y-2 max-w-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notificaciones</p>
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="flex items-center gap-4 px-5 py-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-black/5 ${subscribed ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
                                            {subscribed ? <Bell size={18} /> : <BellOff size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-sm text-slate-800 tracking-tight leading-none">Notificaciones de pagos</p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">
                                                {permission === 'denied'
                                                    ? 'Bloqueadas en el navegador'
                                                    : subscribed
                                                        ? 'Activas en este dispositivo'
                                                        : 'Desactivadas'}
                                            </p>
                                        </div>
                                        {permission !== 'denied' && (
                                            <button
                                                onClick={subscribed ? unsubscribe : subscribe}
                                                disabled={pushLoading}
                                                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 ${subscribed
                                                    ? 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
                                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                                                    }`}
                                            >
                                                {pushLoading ? <Loader2 size={14} className="animate-spin" /> : subscribed ? 'Desactivar' : 'Activar'}
                                            </button>
                                        )}
                                    </div>
                                    {subscribed && (
                                        <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                                            <p className="text-[10px] text-slate-400 font-medium">Enviar notificación de prueba</p>
                                            <button
                                                onClick={() => sendTest().then(() => toast.success('Notificación de prueba enviada'))}
                                                className="text-[10px] font-black text-blue-500 hover:underline uppercase tracking-wider"
                                            >
                                                Probar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full h-14 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.1em] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 lg:max-w-sm"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'Guardando cambios...' : 'Guardar Todo'}
                    </button>

                    <div className="pb-8" />
                </motion.div >
            );
        }

        return (
            <motion.div
                key={activePanel}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="space-y-6"
            >
                {activePanel === 'logo' && (
                    <div className="space-y-5">
                        <PanelHeader title="Logo y Nombre" icon={<Image size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />
                        <div className="admin-card p-6 space-y-5">
                            <div className="space-y-2">
                                <FieldLabel hint="Nombre público de tu plataforma. Máx 30 letras.">Nombre del Sitio</FieldLabel>
                                <input type="text" className="admin-input font-black text-lg focus:shadow-xl" value={settings.siteName} onChange={e => set('siteName', e.target.value.slice(0, 30))} maxLength={30} />
                            </div>
                            <div className="border-t border-slate-50 pt-5 space-y-4">
                                <FieldLabel hint="Sube un logo transparente (PNG/WebP) para un mejor acabado.">Cargar Logotipo</FieldLabel>
                                <div className="flex items-center gap-5">
                                    <div className="w-24 h-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center relative group overflow-hidden">
                                        {settings.logoUrl ? (
                                            <img src={settings.logoUrl} className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <Plus className="text-slate-200" size={32} />
                                        )}
                                        <button onClick={() => logoInputRef.current?.click()} className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-black uppercase">Cambiar</button>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <button onClick={() => logoInputRef.current?.click()} className="w-full h-11 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-100 transition-all">Seleccionar Archivo</button>
                                        {settings.logoUrl && (
                                            <button onClick={() => set('logoUrl', '')} className="w-full text-red-400 font-bold text-[10px] uppercase hover:underline">Eliminar imagen</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activePanel === 'colores' && (
                    <div className="space-y-5">
                        <PanelHeader title="Identidad Visual" icon={<Palette size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />
                        <div className="admin-card p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <FieldLabel hint="Color principal para acciones e identidad.">Color Primario</FieldLabel>
                                <div className="flex gap-4">
                                    <input type="color" className="w-[72px] h-[72px] rounded-2x border-4 border-white shadow-xl bg-white" value={settings.primaryColor} onChange={e => handlePrimaryChange(e.target.value)} />
                                    <input type="text" className="admin-input flex-1 font-mono uppercase" value={primaryHexInput} onChange={e => { setPrimaryHexInput(e.target.value); if (isValidHex(e.target.value)) handlePrimaryChange(e.target.value); }} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <FieldLabel hint="Complemento automático (puedes ajustarlo).">Color Secundario</FieldLabel>
                                <div className="flex gap-4">
                                    <input type="color" className="w-[72px] h-[72px] rounded-2x border-4 border-white shadow-xl bg-white" value={settings.secondaryColor} onChange={e => { set('secondaryColor', e.target.value); setSecondaryHexInput(e.target.value); }} />
                                    <input type="text" className="admin-input flex-1 font-mono uppercase" value={secondaryHexInput} onChange={e => { setSecondaryHexInput(e.target.value); if (isValidHex(e.target.value)) set('secondaryColor', e.target.value); }} />
                                </div>
                            </div>
                        </div>
                        <BrandPreview primary={settings.primaryColor} secondary={settings.secondaryColor} logoUrl={settings.logoUrl} logoSize={settings.logoSize} siteName={settings.siteName} />
                    </div>
                )}

                {activePanel === 'banco' && (
                    <div className="space-y-5">
                        <PanelHeader title="Métodos de Pago" icon={<CreditCard size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />

                        {!isEditingPayment ? (
                            <div className="space-y-4">
                                <div className="admin-card p-0 overflow-hidden divide-y divide-slate-50">
                                    <div className="p-4 bg-slate-50 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tus Cuentas Bancarias</span>
                                        <button
                                            onClick={() => {
                                                setPaymentForm({ bankName: '', clabe: '', beneficiary: '', accountNumber: '', isActive: paymentMethods.length === 0 });
                                                setIsEditingPayment('new');
                                            }}
                                            className="bg-[#2563EB] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-blue-100 transition-all"
                                        >
                                            Agregar Tarjeta
                                        </button>
                                    </div>

                                    {isPaymentsLoading ? (
                                        <div className="p-8 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-200" /></div>
                                    ) : paymentMethods.length === 0 ? (
                                        <div className="p-12 text-center space-y-3">
                                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-200">
                                                <CreditCard size={32} />
                                            </div>
                                            <p className="text-sm text-slate-400 font-medium">No hay tarjetas registradas.</p>
                                        </div>
                                    ) : (
                                        paymentMethods.map(method => (
                                            <div key={method.id} className="p-5 flex items-start justify-between group">
                                                <div className="flex gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all ${method.isActive ? 'bg-blue-50 border-blue-100 text-[#2563EB]' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                        <CreditCard size={20} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-black text-slate-800 text-sm truncate">{method.bankName}</p>
                                                            {method.isActive && <span className="badge-blue !py-0.5 !px-2 scale-90">Activa</span>}
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{method.beneficiary}</p>
                                                        <p className="text-[11px] font-mono text-slate-500 mt-1">{method.clabe}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setPaymentForm({ ...method });
                                                                setIsEditingPayment(method.id);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                        >
                                                            <Wrench size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePayment(method.id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => handleTogglePayment(method.id, method.isActive)}
                                                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border active:scale-95 transition-all ${method.isActive
                                                            ? 'text-red-500 bg-red-50 border-red-100 hover:bg-red-100'
                                                            : 'text-[#2563EB] bg-blue-50 border-blue-100 hover:bg-blue-100'
                                                            }`}
                                                    >
                                                        {method.isActive ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="admin-card p-6 bg-slate-50/50 border-dashed border-2">
                                    <FieldLabel hint="Mensaje que verá el cliente al terminar su pedido.">Instrucciones de Pago Generales</FieldLabel>
                                    <textarea
                                        className="admin-input resize-none h-32 bg-white"
                                        value={settings.paymentInstructions}
                                        onChange={e => set('paymentInstructions', e.target.value)}
                                        placeholder="Ej: Favor de enviar comprobante por WhatsApp con su número de orden."
                                    />
                                    <div className="flex justify-end mt-4">
                                        <button onClick={handleSave} disabled={isSaving} className="btn-primary !py-2 !h-auto text-[10px] uppercase tracking-widest flex items-center gap-2">
                                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                            Guardar Instrucciones
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="admin-card p-6 space-y-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">
                                        {isEditingPayment === 'new' ? 'Nueva Tarjeta' : 'Editar Tarjeta'}
                                    </h3>
                                    <button onClick={() => setIsEditingPayment(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <FieldLabel>Nombre del Banco *</FieldLabel>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            placeholder="Ej: BBVA México"
                                            value={paymentForm.bankName}
                                            onChange={e => setPaymentForm(p => ({ ...p, bankName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <FieldLabel>Beneficiario *</FieldLabel>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            placeholder="Nombre completo"
                                            value={paymentForm.beneficiary}
                                            onChange={e => setPaymentForm(p => ({ ...p, beneficiary: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <FieldLabel>Número CLABE *</FieldLabel>
                                        <input
                                            type="text"
                                            className="admin-input font-mono"
                                            placeholder="18 dígitos"
                                            value={paymentForm.clabe}
                                            onChange={e => setPaymentForm(p => ({ ...p, clabe: e.target.value.replace(/\s/g, '') }))}
                                            maxLength={18}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <FieldLabel>Número de Cuenta (Opcional)</FieldLabel>
                                        <input
                                            type="text"
                                            className="admin-input font-mono"
                                            placeholder="10 dígitos"
                                            value={paymentForm.accountNumber || ''}
                                            onChange={e => setPaymentForm(p => ({ ...p, accountNumber: e.target.value }))}
                                            maxLength={11}
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-2xl flex items-center justify-between border border-blue-100">
                                    <div>
                                        <p className="text-sm font-black text-blue-900">Activar automáticamente</p>
                                        <p className="text-[10px] text-blue-600 font-medium">Esta tarjeta se mostrará en el flujo de pago.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={paymentForm.isActive}
                                            onChange={e => setPaymentForm(p => ({ ...p, isActive: e.target.checked }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-[#2563EB] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setIsEditingPayment(null)} className="btn-secondary flex-1">Cancelar</button>
                                    <button onClick={handleSavePayment} className="btn-primary flex-[2] flex items-center justify-center gap-2">
                                        <Save size={18} />
                                        Guardar Tarjeta
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}


                {activePanel === 'contacto' && (
                    <div className="space-y-5">
                        <PanelHeader title="Contacto y Soporte" icon={<Phone size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />
                        <div className="admin-card p-6 space-y-4">
                            <div className="space-y-1">
                                <FieldLabel hint="Número para WhatsApp, comprobantes y dudas. Ej: 5215512345678">Número de Teléfono</FieldLabel>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input type="tel" inputMode="numeric" className="admin-input pl-11" placeholder="Ej: 5215512345678" value={settings.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activePanel === 'redes' && (
                    <div className="space-y-5">
                        <PanelHeader title="Redes Sociales" icon={<Globe size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />
                        <div className="admin-card p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <FieldLabel hint="Solo el usuario (sin @).">Instagram</FieldLabel>
                                <div className="relative">
                                    <Instagram size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" />
                                    <input className="admin-input pl-11" placeholder="TuUsuario" value={settings.instagram} onChange={e => set('instagram', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <FieldLabel hint="URL completa de tu página de Facebook.">Facebook Page</FieldLabel>
                                <div className="relative">
                                    <Facebook size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" />
                                    <input className="admin-input pl-11" placeholder="https://facebook.com/..." value={settings.facebookUrl} onChange={e => set('facebookUrl', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activePanel === 'marketing' && (
                    <div className="space-y-5">
                        <PanelHeader title="Meta Pixel" icon={<Facebook size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />
                        <div className="admin-card p-6 space-y-5">
                            <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mb-2">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
                                    <Facebook size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Rastreo de Conversiones</p>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Configura tu Pixel ID para medir visitas, inicios de pago y compras. Esto te ayudará a optimizar tus anuncios en Facebook e Instagram.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <FieldLabel hint="Solo el número identificador de tu Pixel de Meta.">Pixel ID</FieldLabel>
                                <input
                                    type="text"
                                    className="admin-input font-mono focus:shadow-xl"
                                    placeholder="Ej: 123456789012345"
                                    value={settings.facebookPixelId}
                                    onChange={e => set('facebookPixelId', e.target.value.replace(/\D/g, ''))}
                                />
                            </div>

                            <div className="pt-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Eventos Activos</p>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                    {[
                                        { ev: 'PageView', desc: 'Vistas de cualquier página' },
                                        { ev: 'ViewContent', desc: 'Ver detalles de una rifa' },
                                        { ev: 'InitiateCheckout', desc: 'Abrir el modal de compra' },
                                        { ev: 'Purchase', desc: 'Confirmación de envío de pago' }
                                    ].map(item => (
                                        <div key={item.ev} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <p className="text-[11px] font-black text-slate-700">{item.ev}</p>
                                                <p className="text-[10px] text-slate-400">{item.desc}</p>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activePanel === 'sistema' && (
                    <div className="space-y-5">
                        <PanelHeader title="Validación de pagos" icon={<Bot size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />
                        <div className="admin-card p-6 flex items-start gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                                <Bot size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-black text-slate-800">Validación avanzada de pagos</p>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={settings.autoVerificationEnabled} onChange={e => set('autoVerificationEnabled', e.target.checked)} className="sr-only peer" />
                                        <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6 shadow-inner"></div>
                                    </label>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 leading-relaxed">Al activar esta opción, los comprobantes subidos por los clientes serán procesados por sistemas avanzados de validación para confirmar el monto y concepto de forma inmediata.</p>

                                <div className={`mt-4 p-4 rounded-2xl border ${settings.autoVerificationEnabled ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'} flex items-center gap-3 transition-colors`}>
                                    <div className={`w-2 h-2 rounded-full ${settings.autoVerificationEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{settings.autoVerificationEnabled ? 'SISTEMA DE VALIDACIÓN EN LÍNEA' : 'SISTEMA DE VALIDACIÓN DESACTIVADO'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activePanel === 'usuarios' && (
                    <div className="space-y-5">
                        <PanelHeader title="Cuentas de Staff" icon={<Users size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />
                        <div className="admin-card p-0 overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaboradores con acceso</span>
                                <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-blue-100 transition-all">Agregar Nuevo</button>
                            </div>

                            <AnimatePresence>
                                {showAddForm && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-blue-50/30 overflow-hidden border-b border-blue-100 px-6 py-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <input className="admin-input bg-white" placeholder="Nombre completo" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} />
                                            <input className="admin-input bg-white" placeholder="Usuario / Correo (para login)" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
                                            <input type="password" className="admin-input bg-white" placeholder="Contraseña (mín. 6 caracteres)" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
                                            <input type="password" className="admin-input bg-white" placeholder="Confirmar contraseña" value={newUser.confirmPassword} onChange={e => setNewUser(p => ({ ...p, confirmPassword: e.target.value }))} />
                                            <select className="admin-input bg-white cursor-pointer col-span-2" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                                                <option value="vendedor">Vendedor</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Plan de acceso</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { value: '', label: 'Sin plan', desc: '—' },
                                                    { value: 'mensual', label: 'Mensual', desc: '30 días' },
                                                    { value: 'por_rifa', label: 'Por Rifa', desc: 'Sin crear rifas' },
                                                ].map(opt => (
                                                    <button key={opt.value} type="button"
                                                        onClick={() => setNewUser(p => ({ ...p, planType: opt.value }))}
                                                        className={`p-2.5 rounded-xl border-2 text-center transition-all ${newUser.planType === opt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                                        <p className="font-black text-xs text-slate-800">{opt.label}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={handleCreateAdmin} disabled={isCreatingUser} className="bg-blue-600 text-white px-6 h-10 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center gap-2">
                                                {isCreatingUser ? <Loader2 size={14} className="animate-spin" /> : null}
                                                {isCreatingUser ? 'Creando...' : 'Crear Usuario'}
                                            </button>
                                            <button onClick={() => { setShowAddForm(false); setNewUser({ name: '', email: '', password: '', confirmPassword: '', role: 'vendedor', planType: '' }); }} disabled={isCreatingUser} className="bg-white text-slate-400 px-6 h-10 rounded-xl font-bold text-xs">Cancelar</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="divide-y divide-slate-50">
                                {isUsersLoading ? (
                                    <div className="p-6 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
                                ) : adminUsers.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">No hay colaboradores. Agrega uno con el botón de arriba.</div>
                                ) : (
                                    adminUsers.filter(u => u.role !== 'super_admin').map(u => {
                                        const daysLeft = getPlanDaysLeft(u.planExpiryDate);
                                        const isExpired = daysLeft !== null && daysLeft < 0;
                                        return (
                                            <div key={u.id} className="p-5 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-xs text-slate-600 shrink-0">{u.name.charAt(0)}</div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-black text-slate-800">{u.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{u.email}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {u.planType ? (
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${u.planType === 'mensual' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-violet-50 text-violet-700 border-violet-100'}`}>
                                                                    {u.planType === 'mensual' ? 'Mensual' : 'Por Rifa'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[9px] font-black px-2 py-0.5 rounded-lg border bg-slate-50 text-slate-400 border-slate-100">Sin plan</span>
                                                            )}
                                                            {u.planType === 'mensual' && u.planExpiryDate && (
                                                                <span className={`text-[9px] font-bold ${isExpired ? 'text-red-500' : daysLeft !== null && daysLeft <= 3 ? 'text-amber-500' : 'text-slate-400'}`}>
                                                                    {isExpired ? 'Expirado' : daysLeft === 0 ? 'Vence hoy' : `${daysLeft}d restantes`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[9px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{u.role}</span>
                                                    <button onClick={() => { setPlanModal(u); setSelectedPlan((u.planType as any) || ''); }} className="text-slate-400 hover:text-blue-500 transition-colors p-1.5 rounded-lg hover:bg-blue-50" title="Gestionar plan">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                                                    </button>
                                                    <button onClick={() => handleDeleteAdmin(u.id, u.name)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50" title="Eliminar"><Trash2 size={15} /></button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal: Gestionar Plan */}
                <AnimatePresence>
                    {planModal && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setPlanModal(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                                className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                                <div>
                                    <h3 className="font-black text-slate-800 text-base">Gestionar plan</h3>
                                    <p className="text-sm text-slate-400 mt-0.5">{planModal.name}</p>
                                </div>
                                <div className="space-y-2">
                                    {([
                                        { value: 'mensual', label: 'Mensual', desc: 'Acceso por 30 días. Se puede renovar.' },
                                        { value: 'por_rifa', label: 'Por Rifa', desc: 'Acceso por rifa. Sin botón de crear rifa.' },
                                    ] as const).map(plan => (
                                        <button key={plan.value} onClick={() => setSelectedPlan(plan.value)}
                                            className={`w-full p-3 rounded-xl border-2 text-left transition-all ${selectedPlan === plan.value ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                                            <p className="font-black text-sm text-slate-800">{plan.label}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{plan.desc}</p>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    {selectedPlan === 'mensual' ? 'Al guardar se establecerán 30 días de acceso desde hoy.' : selectedPlan === 'por_rifa' ? 'El usuario solo podrá editar rifas existentes.' : ''}
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={handleSetPlan} disabled={!selectedPlan || savingPlan}
                                        className="flex-1 min-h-[44px] bg-blue-600 disabled:opacity-50 text-white font-black rounded-xl text-sm transition-all active:scale-95">
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

                {activePanel === 'herramientas' && (
                    <div className="space-y-5">
                        <PanelHeader
                            title={selectedRaffleId ? "Personalizar Rifa" : "Herramientas y funciones"}
                            icon={<Wrench size={16} />}
                            onBack={() => selectedRaffleId ? setSelectedRaffleId(null) : setActivePanel(null)}
                            onSave={handleSave}
                            isSaving={isSaving}
                        />

                        {!selectedRaffleId ? (
                            <div className="admin-card p-6 space-y-4">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Selecciona una rifa para configurar</p>
                                    {isRafflesLoading ? (
                                        <div className="p-6 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
                                    ) : raffles.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400 text-sm">No hay rifas activas.</div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {raffles.map(raffle => (
                                                <button
                                                    key={raffle.id}
                                                    onClick={() => setSelectedRaffleId(raffle.id)}
                                                    className="w-full p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all group"
                                                >
                                                    <div className="text-left">
                                                        <p className="text-sm font-black text-slate-800">{raffle.title}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{raffle.status} • {raffle.totalTickets} boletos</p>
                                                    </div>
                                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : activeRaffleDetail && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Bloque 1: Liberación Automática */}
                                <div className="admin-card p-6 space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-orange-50/50 rounded-2xl border border-orange-100 mb-2">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm flex-shrink-0">
                                            <Clock size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Liberación Automática</p>
                                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Libera boletos apartados sin pago después de X horas.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tiempo límite (horas)</p>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="admin-input h-10 w-24 text-center font-black"
                                                    value={activeRaffleDetail.autoReleaseHours || 0}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        setRaffles(prev => prev.map(r => r.id === activeRaffleDetail.id ? { ...r, autoReleaseHours: val } : r));
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleUpdateRaffleHours(activeRaffleDetail.id, activeRaffleDetail.autoReleaseHours || 0)}
                                                    className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                                                >
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bloque 2: Máquina de la Suerte */}
                                <div className="admin-card p-6 space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mb-2">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
                                            <Bot size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Máquina de la Suerte</p>
                                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Configura los números de boletos rápidos (crece automáticamente).</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Opciones configuradas</p>

                                        <div className="flex flex-wrap gap-2">
                                            {(activeRaffleDetail.luckyMachineNumbers || []).map((num: number, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 pl-4 pr-2 py-2 rounded-xl shadow-sm animate-in zoom-in-95 duration-200">
                                                    <span className="text-sm font-black text-slate-700">+{num}</span>
                                                    <button
                                                        onClick={() => {
                                                            const next = (activeRaffleDetail.luckyMachineNumbers || []).filter((_: any, i: number) => i !== idx);
                                                            setRaffles(prev => prev.map(r => r.id === activeRaffleDetail.id ? { ...r, luckyMachineNumbers: next } : r));
                                                        }}
                                                        className="w-6 h-6 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    const val = prompt('¿Cuántos boletos quieres añadir?') || '';
                                                    const num = parseInt(val);
                                                    if (!isNaN(num) && num > 0) {
                                                        const current = activeRaffleDetail.luckyMachineNumbers || [];
                                                        if (!current.includes(num)) {
                                                            const next = [...current, num].sort((a, b) => a - b);
                                                            setRaffles(prev => prev.map(r => r.id === activeRaffleDetail.id ? { ...r, luckyMachineNumbers: next } : r));
                                                        }
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95 border-dashed"
                                            >
                                                <Plus size={14} />
                                                Añadir
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => handleUpdateLuckyNumbers(activeRaffleDetail.id, activeRaffleDetail.luckyMachineNumbers || [])}
                                            className="w-full h-12 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-100 mt-2"
                                        >
                                            Actualizar Máquina de la Suerte
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activePanel === 'notificaciones' && (
                    <div className="space-y-5">
                        <PanelHeader
                            title="Notificaciones Push"
                            icon={<Bell size={16} />}
                            onBack={() => setActivePanel(null)}
                            onSave={handleSave}
                            isSaving={isSaving}
                        />

                        <div className="admin-card p-6 space-y-6">
                            <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mb-2">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
                                    <BellRing size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Alertas en Tiempo Real</p>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                        Recibe avisos inmediatos cuando un cliente suba un comprobante o cuando el sistema verifique un pago automáticamente.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div>
                                        <p className="text-sm font-black text-slate-800">Estado en este dispositivo</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                            {push.isSupported
                                                ? (push.subscribed ? 'Suscripción activa' : 'Sin suscripción')
                                                : 'Navegador no compatible'}
                                        </p>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${push.subscribed ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                                </div>

                                {!push.isSupported ? (
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                                        <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                                        <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                                            Tu navegador o dispositivo no soporta notificaciones push nativas.
                                            Si usas iOS (iPhone), asegúrate de estar en iOS 16.4+ y haber "Añadido a pantalla de inicio" esta web.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {push.subscribed ? (
                                            <>
                                                <button
                                                    onClick={push.unsubscribe}
                                                    disabled={push.loading}
                                                    className="w-full h-12 bg-white border border-red-100 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {push.loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                    Desactivar en este móvil/PC
                                                </button>
                                                <button
                                                    onClick={push.sendTest}
                                                    className="w-full h-12 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Settings2 size={14} />
                                                    Enviar Notificación de Prueba
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={push.subscribe}
                                                disabled={push.loading}
                                                className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-3"
                                            >
                                                {push.loading ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
                                                Activar Notificaciones Aquí
                                            </button>
                                        )}

                                        {push.permission === 'denied' && (
                                            <p className="text-[10px] text-red-500 font-bold text-center uppercase mt-2">
                                                Permiso denegado. Debes habilitarlo en los ajustes del navegador.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">¿Qué notificaciones recibiré?</p>
                                <div className="space-y-2">
                                    {[
                                        { title: 'Nuevos Comprobantes', desc: 'Cuando un cliente suba un comprobante o se aparte una orden' },
                                        { title: 'Validaciones Gemini', desc: 'Resultados del análisis automático por IA' },
                                        { title: 'Alertas de Fraude', desc: 'Aviso inmediato si se detecta un ticket falso' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                                            <div>
                                                <p className="text-[11px] font-black text-slate-700">{item.title}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="max-w-xl mx-auto pb-10">
            <AnimatePresence mode="wait">
                {renderContent()}
            </AnimatePresence>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        </div>
    );
};

export default Settings;
