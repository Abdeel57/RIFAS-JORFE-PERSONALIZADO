import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../contexts/ConfirmContext';
import { useAuth } from '../hooks/useAuth';
import Skeleton from '../components/Skeleton';
import {
    ChevronRight, Palette, CreditCard, Phone,
    Image, Globe, Instagram, ArrowLeft, Save, Bot, X, Users, Trash2, Plus, Mail, User, Loader2, Facebook
} from 'lucide-react';

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

type Panel = 'logo' | 'colores' | 'banco' | 'contacto' | 'redes' | 'marketing' | 'sistema' | 'usuarios' | null;

interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
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
        className={`w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-slate-50/80 active:bg-slate-100 transition-all ${!last ? 'border-b border-slate-50' : ''}`}
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

    const { admin } = useAuth();
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [isUsersLoading, setIsUsersLoading] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'vendedor' });

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
    }, [activePanel]);

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
            const res = await api.post('/admin/admin-users', { name: name.trim(), email: email.trim(), password, role });
            if (res.data?.success) {
                toast.success('Usuario creado correctamente');
                setNewUser({ name: '', email: '', password: '', confirmPassword: '', role: 'vendedor' });
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

                    <MenuSection title="Identidad de Marca">
                        <MenuRow icon={<Image size={18} />} iconBg="bg-blue-50 text-blue-500" label="Logo y Nombre" subtitle={settings.siteName} onClick={() => setActivePanel('logo')} />
                        <MenuRow icon={<Palette size={18} />} iconBg="bg-violet-50 text-violet-500" label="Colores de Interfaz" value={settings.primaryColor} onClick={() => setActivePanel('colores')} last />
                    </MenuSection>

                    <MenuSection title="Pagos y Ventas">
                        <MenuRow icon={<CreditCard size={18} />} iconBg="bg-emerald-50 text-emerald-500" label="Métodos de Pago" subtitle={settings.bankName || 'Bancos y Transferencia'} onClick={() => setActivePanel('banco')} />
                        <MenuRow icon={<Bot size={18} />} iconBg="bg-indigo-50 text-indigo-500" label="Validación de pagos" value={settings.autoVerificationEnabled ? 'Activa' : 'Manual'} onClick={() => setActivePanel('sistema')} last />
                    </MenuSection>

                    <MenuSection title="Comunicación">
                        <MenuRow icon={<Phone size={18} />} iconBg="bg-rose-50 text-rose-500" label="Contacto y Soporte" subtitle={settings.whatsapp} onClick={() => setActivePanel('contacto')} />
                        <MenuRow icon={<Globe size={18} />} iconBg="bg-sky-50 text-sky-500" label="Redes Sociales" value={`@${settings.instagram.replace(/^@/, '')}`} onClick={() => setActivePanel('redes')} last />
                    </MenuSection>

                    <MenuSection title="Marketing y Análisis">
                        <MenuRow icon={<Facebook size={18} />} iconBg="bg-blue-50 text-blue-600" label="Meta Pixel" subtitle={settings.facebookPixelId || 'No configurado'} onClick={() => setActivePanel('marketing')} last />
                    </MenuSection>

                    <MenuSection title="Control de Acceso">
                        <MenuRow icon={<Users size={18} />} iconBg="bg-slate-50 text-slate-600" label="Gestionar Administradores" last onClick={() => setActivePanel('usuarios')} />
                    </MenuSection>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full h-14 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.1em] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'Guardando cambios...' : 'Guardar Todo'}
                    </button>

                    <div className="pb-8" />
                </motion.div>
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
                        <PanelHeader title="Ajustes de Pago" icon={<CreditCard size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />
                        <div className="admin-card p-0 overflow-hidden divide-y divide-slate-100">
                            {[
                                { label: 'Nombre del Banco', field: 'bankName' as keyof SettingsData, placeholder: 'Ej: BBVA, Banamex...' },
                                { label: 'Número CLABE', field: 'clabe' as keyof SettingsData, placeholder: '18 dígitos interbancaria' },
                                { label: 'Nombre del Beneficiario', field: 'beneficiary' as keyof SettingsData, placeholder: 'Nombre a quien va el pago' },
                                { label: 'Número de Cuenta', field: 'accountNumber' as keyof SettingsData, placeholder: 'Opcional' },
                            ].map((item, i) => (
                                <div key={i} className="p-6">
                                    <FieldLabel>{item.label}</FieldLabel>
                                    <input type="text" className="admin-input focus:bg-slate-50" value={(settings[item.field] as string) || ''} onChange={e => set(item.field, e.target.value)} placeholder={item.placeholder} />
                                </div>
                            ))}
                            <div className="p-6 bg-slate-50/50">
                                <FieldLabel hint="Mensaje que verá el cliente al terminar su pedido.">Instrucciones Especiales</FieldLabel>
                                <textarea className="admin-input resize-none h-32" value={settings.paymentInstructions} onChange={e => set('paymentInstructions', e.target.value)} placeholder="Ej: Favor de enviar comprobante por WhatsApp con su número de orden." />
                            </div>
                        </div>
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
                        <div className="admin-card p-6 space-y-4">
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
                                <div className="space-y-2">
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
                                        <div className="flex gap-2">
                                            <button onClick={handleCreateAdmin} disabled={isCreatingUser} className="bg-blue-600 text-white px-6 h-10 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center gap-2">
                                                {isCreatingUser ? <Loader2 size={14} className="animate-spin" /> : null}
                                                {isCreatingUser ? 'Creando...' : 'Crear Usuario'}
                                            </button>
                                            <button onClick={() => { setShowAddForm(false); setNewUser({ name: '', email: '', password: '', confirmPassword: '', role: 'vendedor' }); }} disabled={isCreatingUser} className="bg-white text-slate-400 px-6 h-10 rounded-xl font-bold text-xs">Cancelar</button>
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
                                    adminUsers.map(u => (
                                        <div key={u.id} className="p-5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-xs text-slate-600">{u.name.charAt(0)}</div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{u.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{u.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{u.role}</span>
                                                <button onClick={() => handleDeleteAdmin(u.id, u.name)} className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50" title="Eliminar"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
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
