import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmContext';
import {
    ChevronRight, Palette, CreditCard, Phone, Settings as SettingsIcon,
    Image, Sliders, Globe, Instagram, ArrowLeft, Save, Bot, X, Users, Trash2, Plus, Mail, Lock, User
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

function isValidUrl(url: string): boolean {
    try {
        const u = new URL(url);
        return ['http:', 'https:'].includes(u.protocol);
    } catch { return false; }
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
            const tryFormats = ['image/webp', 'image/png'];
            let dataUrl = '';
            for (const fmt of tryFormats) {
                const candidate = canvas.toDataURL(fmt, fmt === 'image/webp' ? 0.88 : undefined);
                if (candidate.startsWith(`data:${fmt}`)) { dataUrl = candidate; break; }
            }
            if (!dataUrl) dataUrl = canvas.toDataURL('image/png');
            const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
            resolve({ dataUrl, sizeKb });
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('No se pudo leer la imagen')); };
        img.src = objectUrl;
    });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Panel = 'logo' | 'colores' | 'banco' | 'contacto' | 'redes' | 'sistema' | 'usuarios' | null;

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
}

// ─── Shared sub-components ────────────────────────────────────────────────────

const FieldLabel: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
    <div className="mb-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{children}</label>
        {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
);

const PanelHeader: React.FC<{ title: string; icon: React.ReactNode; onBack: () => void; onSave: () => void; isSaving: boolean }> = ({
    title, icon, onBack, onSave, isSaving
}) => (
    <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all touch-manipulation flex-shrink-0">
            <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-[#2563EB] flex-shrink-0">
                {icon}
            </div>
            <h2 className="font-black text-slate-800 text-base tracking-tight truncate">{title}</h2>
        </div>
        <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[40px] bg-[#2563EB] hover:bg-blue-700 active:scale-95 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm shadow-blue-200 disabled:opacity-60 touch-manipulation flex-shrink-0"
        >
            {isSaving ? (
                <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
                <Save size={14} />
            )}
            Guardar
        </button>
    </div>
);

// ─── Menu row component ───────────────────────────────────────────────────────

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
        className={`w-full flex items-center gap-3.5 px-4 py-3.5 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation text-left ${!last ? 'border-b border-slate-100' : ''}`}
    >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-slate-800 leading-tight">{label}</p>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{subtitle}</p>}
        </div>
        {value && (
            <span className="text-[11px] font-medium text-slate-400 truncate max-w-[80px] flex-shrink-0">{value}</span>
        )}
        <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
    </button>
);

// ─── Section wrapper ──────────────────────────────────────────────────────────

const MenuSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">{title}</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {children}
        </div>
    </div>
);

// ─── BrandPreview (mini) ──────────────────────────────────────────────────────

const BrandPreview: React.FC<{ primary: string; secondary: string; logoUrl: string; logoSize: number; siteName: string }> = ({
    primary, secondary, logoUrl, logoSize, siteName,
}) => {
    const gradient = `linear-gradient(135deg, ${primary}, ${secondary})`;
    return (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista previa</p>
            <div className="bg-white/80 backdrop-blur rounded-2xl px-3 py-2 flex items-center gap-2 shadow-sm border border-slate-100">
                <div className="relative flex-shrink-0">
                    {logoUrl ? (
                        <img src={logoUrl} alt="logo" style={{ width: logoSize, height: logoSize }} className="object-contain drop-shadow-sm" />
                    ) : (
                        <div className="rounded-xl flex items-center justify-center shadow" style={{ width: logoSize, height: logoSize, background: gradient }}>
                            <span className="text-white font-black italic" style={{ fontSize: logoSize * 0.45 }}>N</span>
                        </div>
                    )}
                    <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#1877F2] border-[1.5px] border-white rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                        </svg>
                    </div>
                </div>
                <span className="font-black text-xs text-slate-700 tracking-tight">{siteName || 'RIFAS NAO'}</span>
                <div className="ml-auto flex gap-1">
                    <span className="px-2 py-0.5 bg-white rounded-lg text-[9px] font-black shadow-sm border" style={{ color: primary }}>Sorteo</span>
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black text-slate-400">Verificar</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl text-white text-xs font-black shadow-sm" style={{ background: gradient }}>$150</div>
                <div className="px-4 py-1.5 rounded-xl text-white text-xs font-black shadow-sm flex-1 text-center" style={{ backgroundColor: primary }}>COMPRAR BOLETO</div>
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
        siteName: 'RIFAS NAO', bankName: '', clabe: '', beneficiary: '',
        accountNumber: '', paymentInstructions: '', whatsapp: '',
        contactEmail: '', instagram: '', facebookUrl: '',
        autoVerificationEnabled: true, logoUrl: '', logoSize: 44,
        primaryColor: '#3b82f6', secondaryColor: '#6366f1',
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [logoSizeKb, setLogoSizeKb] = useState(0);
    const [primaryHexInput, setPrimaryHexInput] = useState('#3b82f6');
    const [secondaryHexInput, setSecondaryHexInput] = useState('#6366f1');

    // ── Estados para la administración de usuarios ──
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [isUsersLoading, setIsUsersLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });

    const fetchAdmins = async () => {
        setIsUsersLoading(true);
        try {
            const res = await api.get('/admin-users');
            if (res.data?.success) setAdminUsers(res.data.data);
        } catch { toast.error('Error al cargar administradores'); }
        finally { setIsUsersLoading(false); }
    };

    useEffect(() => {
        if (activePanel === 'usuarios') fetchAdmins();
    }, [activePanel]);

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
                        siteName: data.siteName || 'RIFAS NAO',
                        bankName: data.bankName || '', clabe: data.clabe || '',
                        beneficiary: data.beneficiary || '', accountNumber: data.accountNumber || '',
                        paymentInstructions: data.paymentInstructions || '',
                        whatsapp: data.whatsapp || '', contactEmail: data.contactEmail || '',
                        instagram: data.instagram || '', facebookUrl: data.facebookUrl || '',
                        autoVerificationEnabled: data.autoVerificationEnabled !== false,
                        logoUrl: savedLogo,
                        logoSize: typeof data.logoSize === 'number' ? data.logoSize : 44,
                        primaryColor: primary, secondaryColor: secondary,
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
                        toast.success('✅ Configuración guardada');
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
        if (file.size > 8 * 1024 * 1024) { toast.error('El archivo no debe superar 8 MB'); return; }
        setIsCompressing(true);
        try {
            const { dataUrl, sizeKb } = await compressImage(file);
            setSettings(prev => ({ ...prev, logoUrl: dataUrl }));
            setLogoSizeKb(sizeKb);
            toast.success(`Logo optimizado (${sizeKb} KB)`);
        } catch { toast.error('No se pudo procesar la imagen.'); }
        finally { setIsCompressing(false); }
    };

    const handlePrimaryChange = (hex: string) => {
        setSettings(prev => ({ ...prev, primaryColor: hex, secondaryColor: autoSecondary(hex) }));
        setPrimaryHexInput(hex);
        setSecondaryHexInput(autoSecondary(hex));
    };

    const set = useCallback((field: keyof SettingsData, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                <p className="text-sm text-slate-400 font-medium">Cargando configuración…</p>
            </div>
        );
    }

    // ── Panel: Logo & Nombre ──────────────────────────────────────────────────
    if (activePanel === 'logo') return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <PanelHeader title="Logo y Nombre" icon={<Image size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />

            {/* Nombre */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                <FieldLabel hint="Se muestra en el encabezado y pie de página. Máx. 40 caracteres.">Nombre de la Página</FieldLabel>
                <div className="relative">
                    <input type="text" className="admin-input font-black tracking-tighter pr-16"
                        value={settings.siteName}
                        onChange={e => set('siteName', e.target.value.slice(0, 40))}
                        placeholder="RIFAS NAO" maxLength={40} />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tabular-nums ${settings.siteName.length > 32 ? 'text-amber-500' : 'text-slate-300'}`}>
                        {settings.siteName.length}/40
                    </span>
                </div>
            </div>

            {/* Logo upload */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <FieldLabel hint="PNG, JPG, WebP o SVG hasta 8MB. Se optimiza automáticamente.">Logotipo</FieldLabel>
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 flex-shrink-0">
                        {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                                style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}>
                                <span className="text-white font-black text-xl italic">N</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-2">
                        {settings.logoUrl && logoSizeKb > 0 && (
                            <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                Optimizado — {logoSizeKb} KB
                            </p>
                        )}
                        <button type="button" onClick={() => logoInputRef.current?.click()} disabled={isCompressing}
                            className="w-full px-4 py-2.5 min-h-[44px] bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 touch-manipulation">
                            {isCompressing ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />Optimizando...</> : (settings.logoUrl ? 'Cambiar logo' : 'Subir logo')}
                        </button>
                        {settings.logoUrl && !isCompressing && (
                            <button type="button" onClick={() => { set('logoUrl', ''); setLogoSizeKb(0); }}
                                className="w-full px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 font-black rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 touch-manipulation">
                                Eliminar logo
                            </button>
                        )}
                    </div>
                </div>
                <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoChange} />
            </div>

            {/* Tamaño slider */}
            <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 ${!settings.logoUrl ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between">
                    <FieldLabel hint="Ajusta el tamaño del logo en la barra de navegación.">Tamaño en Navbar</FieldLabel>
                    <span className="text-2xl font-black text-violet-700 tabular-nums leading-none">{settings.logoSize}<span className="text-xs font-bold text-slate-400 ml-1">px</span></span>
                </div>
                <input type="range" min={20} max={120} step={1} value={settings.logoSize}
                    onChange={e => set('logoSize', Number(e.target.value))}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer" style={{ accentColor: settings.primaryColor }} />
                <div className="flex gap-2 flex-wrap">
                    {[36, 44, 60, 80, 100].map(size => (
                        <button key={size} type="button" onClick={() => set('logoSize', size)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-95 flex-1 min-w-[48px] touch-manipulation ${settings.logoSize === size ? 'text-white shadow-sm' : 'bg-slate-50 border border-slate-200 text-slate-500'}`}
                            style={settings.logoSize === size ? { backgroundColor: settings.primaryColor } : {}}>
                            {size}px
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // ── Panel: Colores ────────────────────────────────────────────────────────
    if (activePanel === 'colores') return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <PanelHeader title="Colores de Marca" icon={<Palette size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-6">
                {/* Primary */}
                <div className="space-y-3">
                    <FieldLabel hint="Botones, logo, texto activo en navegación.">Color Primario</FieldLabel>
                    <div className="flex items-center gap-3">
                        <input type="color" value={settings.primaryColor}
                            onChange={e => { handlePrimaryChange(e.target.value); setPrimaryHexInput(e.target.value); }}
                            className="w-14 h-14 rounded-2xl cursor-pointer border-2 border-slate-100 p-1 bg-white flex-shrink-0" style={{ colorScheme: 'light' }} />
                        <input type="text" value={primaryHexInput}
                            onChange={e => { setPrimaryHexInput(e.target.value); if (isValidHex(e.target.value)) handlePrimaryChange(e.target.value); }}
                            className={`admin-input font-mono text-sm uppercase ${!isValidHex(primaryHexInput) ? 'border-red-300' : ''}`}
                            placeholder="#3b82f6" maxLength={7} />
                    </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Secondary */}
                <div className="space-y-3">
                    <FieldLabel hint="Gradientes y acentos. Se auto-sugiere al cambiar el primario.">Color Secundario</FieldLabel>
                    <div className="flex items-center gap-3">
                        <input type="color" value={settings.secondaryColor}
                            onChange={e => { set('secondaryColor', e.target.value); setSecondaryHexInput(e.target.value); }}
                            className="w-14 h-14 rounded-2xl cursor-pointer border-2 border-slate-100 p-1 bg-white flex-shrink-0" style={{ colorScheme: 'light' }} />
                        <input type="text" value={secondaryHexInput}
                            onChange={e => { setSecondaryHexInput(e.target.value); if (isValidHex(e.target.value)) set('secondaryColor', e.target.value); }}
                            className={`admin-input font-mono text-sm uppercase ${!isValidHex(secondaryHexInput) ? 'border-red-300' : ''}`}
                            placeholder="#6366f1" maxLength={7} />
                    </div>
                    <button type="button" onClick={() => { const s = autoSecondary(settings.primaryColor); set('secondaryColor', s); setSecondaryHexInput(s); }}
                        className="text-[10px] font-black text-slate-400 hover:text-violet-600 uppercase tracking-wider transition-colors flex items-center gap-1 touch-manipulation">
                        ↺ Auto-sugerir desde primario
                    </button>
                </div>
            </div>

            {/* Vista previa */}
            <BrandPreview primary={settings.primaryColor} secondary={settings.secondaryColor} logoUrl={settings.logoUrl} logoSize={settings.logoSize} siteName={settings.siteName} />
        </div>
    );

    // ── Panel: Métodos de Pago ────────────────────────────────────────────────
    if (activePanel === 'banco') return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <PanelHeader title="Métodos de Pago" icon={<CreditCard size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
                {[
                    { label: 'Banco', field: 'bankName' as keyof SettingsData, placeholder: 'Ej. BBVA México', type: 'text' },
                    { label: 'CLABE Interbancaria', field: 'clabe' as keyof SettingsData, placeholder: '18 dígitos', type: 'text' },
                    { label: 'Beneficiario', field: 'beneficiary' as keyof SettingsData, placeholder: 'Ej. Juan Pérez García', type: 'text' },
                    { label: 'Número de Cuenta (opcional)', field: 'accountNumber' as keyof SettingsData, placeholder: 'Ej. 0123456789', type: 'text' },
                ].map(({ label, field, placeholder, type }) => (
                    <div key={field} className="p-4 space-y-1.5">
                        <FieldLabel>{label}</FieldLabel>
                        <input type={type} className="admin-input" value={(settings[field] as string) || ''}
                            onChange={e => set(field, e.target.value)} placeholder={placeholder} />
                    </div>
                ))}
                <div className="p-4 space-y-1.5">
                    <FieldLabel hint="Instrucciones adicionales que se muestran en el checkout.">Instrucciones de Pago (opcional)</FieldLabel>
                    <textarea className="admin-input resize-none min-h-[80px]"
                        value={settings.paymentInstructions || ''}
                        onChange={e => set('paymentInstructions', e.target.value)}
                        placeholder="Ej. Incluir número de orden en el concepto." rows={3} />
                </div>
            </div>
        </div>
    );

    // ── Panel: Contacto ───────────────────────────────────────────────────────
    if (activePanel === 'contacto') return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <PanelHeader title="Contacto y Soporte" icon={<Phone size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
                <div className="p-4 space-y-1.5">
                    <FieldLabel hint="Número con código de país. Ej: +521234567890">WhatsApp de Soporte</FieldLabel>
                    <input type="text" className="admin-input" value={settings.whatsapp}
                        onChange={e => set('whatsapp', e.target.value)} placeholder="+521234567890" />
                </div>
                <div className="p-4 space-y-1.5">
                    <FieldLabel>Email de Contacto</FieldLabel>
                    <input type="email" className="admin-input" value={settings.contactEmail}
                        onChange={e => set('contactEmail', e.target.value)} placeholder="contacto@rifasnao.com" />
                </div>
            </div>
        </div>
    );

    // ── Panel: Redes Sociales ─────────────────────────────────────────────────
    if (activePanel === 'redes') return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <PanelHeader title="Redes Sociales" icon={<Globe size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
                <div className="p-4 space-y-1.5">
                    <FieldLabel hint="Sin el @. Ej: rifasnao_oficial">Instagram</FieldLabel>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none">@</span>
                        <input type="text" className="admin-input pl-8"
                            value={settings.instagram.replace(/^@/, '')}
                            onChange={e => set('instagram', e.target.value)} placeholder="rifasnao_oficial" />
                    </div>
                </div>
                <div className="p-4 space-y-1.5">
                    <FieldLabel hint="URL completa de tu página de Facebook. Opcional.">Página de Facebook</FieldLabel>
                    <input type="url" className={`admin-input ${settings.facebookUrl && !isValidUrl(settings.facebookUrl) ? 'border-red-300' : ''}`}
                        value={settings.facebookUrl}
                        onChange={e => set('facebookUrl', e.target.value.trim())}
                        placeholder="https://www.facebook.com/tu-pagina" />
                    {settings.facebookUrl && !isValidUrl(settings.facebookUrl) && (
                        <p className="text-[10px] text-red-500 font-bold">URL inválida (debe empezar con https://)</p>
                    )}
                </div>
            </div>
        </div>
    );

    const handleCreateAdmin = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            toast.error('Todos los campos son obligatorios');
            return;
        }
        setIsSaving(true);
        try {
            const res = await api.post('/admin-users', newUser);
            if (res.data?.success) {
                toast.success('Usuario creado correctamente');
                setNewUser({ name: '', email: '', password: '' });
                setShowAddForm(false);
                fetchAdmins();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al crear usuario');
        } finally { setIsSaving(false); }
    };

    const handleDeleteAdmin = (id: string, name: string) => {
        showConfirm({
            message: `¿Estás seguro de eliminar a ${name}? Esta acción no se puede deshacer.`,
            onConfirm: async () => {
                try {
                    await api.delete(`/admin-users/${id}`);
                    toast.success('Usuario eliminado');
                    fetchAdmins();
                } catch (err: any) {
                    toast.error(err.response?.data?.error || 'Error al eliminar');
                }
            }
        });
    };

    if (activePanel === 'usuarios') return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => { setActivePanel(null); setShowAddForm(false); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex-shrink-0">
                    <ArrowLeft size={18} className="text-slate-600" />
                </button>
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                        <Users size={16} />
                    </div>
                    <h2 className="font-black text-slate-800 text-base tracking-tight truncate">Usuarios del Sistema</h2>
                </div>
                {!showAddForm && (
                    <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:scale-95 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm shadow-blue-200">
                        <Plus size={14} />
                        Nuevo
                    </button>
                )}
            </div>

            {showAddForm && (
                <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-xl shadow-blue-500/5 p-5 space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Plus size={16} className="text-[#2563EB]" />
                            Crear Nuevo Administrador
                        </h3>
                        <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Nombre Completo</FieldLabel>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" className="admin-input pl-10" value={newUser.name}
                                    onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="Ej. Juan Pérez" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Correo Electrónico</FieldLabel>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="email" className="admin-input pl-10" value={newUser.email}
                                    onChange={e => setNewUser(p => ({ ...p, email: e.target.value.toLowerCase() }))} placeholder="correo@ejemplo.com" />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                            <FieldLabel hint="Mínimo 6 caracteres">Contraseña</FieldLabel>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="password" minLength={6} className="admin-input pl-10" value={newUser.password}
                                    onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowAddForm(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all">
                            Cancelar
                        </button>
                        <button onClick={handleCreateAdmin} disabled={isSaving} className="flex-[2] py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                            {isSaving ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" /> : <Save size={14} />}
                            Crear Usuario
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {isUsersLoading ? (
                    <div className="py-12 flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Cargando...</p>
                    </div>
                ) : adminUsers.length === 0 ? (
                    <div className="py-12 text-center">
                        <Users size={32} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-sm text-slate-400 font-medium">No hay otros administradores registrados.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {adminUsers.map((user) => (
                            <div key={user.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] font-black text-xs">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate">{user.name}</p>
                                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-[#2563EB] text-[9px] font-black uppercase tracking-wider">
                                        {user.role}
                                    </span>
                                    <button onClick={() => handleDeleteAdmin(user.id, user.name)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                <Sliders size={18} className="text-[#2563EB] flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#2563EB] font-medium leading-relaxed">
                    <strong>Sugerencia pro:</strong> Usa correos corporativos para una mejor organización. Todos los administradores creados aquí tendrán acceso completo a todas las funciones del sistema.
                </p>
            </div>
        </div>
    );

    // ── Panel: Sistema ────────────────────────────────────────────────────────
    if (activePanel === 'sistema') return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <PanelHeader title="Sistema" icon={<Bot size={16} />} onBack={() => setActivePanel(null)} onSave={handleSave} isSaving={isSaving} />

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot size={20} className="text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-slate-800">Verificación Automática IA</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Analiza comprobantes de pago con Gemini Vision. Desactiva para revisión 100% manual por el administrador.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                        <input type="checkbox" checked={settings.autoVerificationEnabled}
                            onChange={e => set('autoVerificationEnabled', e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
                    </label>
                </div>

                <div className={`mx-4 mb-4 rounded-xl px-4 py-3 text-xs font-medium flex items-center gap-2 ${settings.autoVerificationEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${settings.autoVerificationEnabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {settings.autoVerificationEnabled ? 'IA activa — Gemini verificará comprobantes automáticamente' : 'Modo manual — tú aprobarás cada pago desde el panel'}
                </div>
            </div>
        </div>
    );

    // ── Main menu ─────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Configuración</h1>
                <p className="text-sm text-slate-400 mt-0.5">Gestiona la identidad, pagos y contacto de tu página.</p>
            </div>

            {/* Sección: Personalizar */}
            <MenuSection title="Personalizar">
                <MenuRow
                    icon={<Image size={17} className="text-violet-600" />}
                    iconBg="bg-violet-100"
                    label="Logo y Nombre"
                    subtitle="Imagen y nombre de tu página"
                    value={settings.siteName || '—'}
                    onClick={() => setActivePanel('logo')}
                />
                <MenuRow
                    icon={<Palette size={17} className="text-pink-600" />}
                    iconBg="bg-pink-100"
                    label="Colores de Marca"
                    subtitle="Color primario y secundario"
                    value={settings.primaryColor}
                    onClick={() => setActivePanel('colores')}
                    last
                />
            </MenuSection>

            {/* Sección: Pagos */}
            <MenuSection title="Métodos de Pago">
                <MenuRow
                    icon={<CreditCard size={17} className="text-blue-600" />}
                    iconBg="bg-blue-100"
                    label="Datos Bancarios SPEI"
                    subtitle={settings.bankName || 'Sin configurar'}
                    value={settings.clabe ? `****${settings.clabe.slice(-4)}` : '—'}
                    onClick={() => setActivePanel('banco')}
                    last
                />
            </MenuSection>

            {/* Sección: Contacto */}
            <MenuSection title="Contacto y Redes">
                <MenuRow
                    icon={<Phone size={17} className="text-emerald-600" />}
                    iconBg="bg-emerald-100"
                    label="Contacto y Soporte"
                    subtitle="WhatsApp y email"
                    value={settings.whatsapp || '—'}
                    onClick={() => setActivePanel('contacto')}
                />
                <MenuRow
                    icon={<Globe size={17} className="text-[#2563EB]" />}
                    iconBg="bg-blue-100"
                    label="Redes Sociales"
                    subtitle="Instagram y Facebook"
                    value={settings.instagram ? `@${settings.instagram.replace(/^@/, '')}` : '—'}
                    onClick={() => setActivePanel('redes')}
                    last
                />
            </MenuSection>

            {/* Sección: Sistema */}
            <MenuSection title="Seguridad y Acceso">
                <MenuRow
                    icon={<Users size={17} className="text-amber-600" />}
                    iconBg="bg-amber-100"
                    label="Usuarios del Sistema"
                    subtitle="Administra accesos y permisos"
                    onClick={() => setActivePanel('usuarios')}
                />
                <MenuRow
                    icon={<Bot size={17} className="text-violet-600" />}
                    iconBg="bg-violet-100"
                    label="Verificación Automática IA"
                    subtitle="Gemini Vision analiza comprobantes"
                    value={settings.autoVerificationEnabled ? 'Activa' : 'Manual'}
                    onClick={() => setActivePanel('sistema')}
                    last
                />
            </MenuSection>

            {/* Guardar flotante */}
            <div className="pt-2 pb-4">
                <button onClick={handleSave} disabled={isSaving}
                    className="w-full py-4 min-h-[52px] bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white font-black rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-3 touch-manipulation">
                    {isSaving ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Guardando...</>
                    ) : (
                        <><Save size={16} />Guardar Todo</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Settings;
