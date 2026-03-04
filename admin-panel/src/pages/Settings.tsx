import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmContext';

// ─── Color utility functions ─────────────────────────────────────────────────

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
    } catch {
        return '#6366f1';
    }
}

function isValidHex(hex: string): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(hex);
}

function isValidUrl(url: string): boolean {
    try {
        const u = new URL(url);
        return ['http:', 'https:'].includes(u.protocol);
    } catch {
        return false;
    }
}

// ─── Image compression via Canvas ────────────────────────────────────────────

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
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            let { width, height } = img;

            if (width > MAX_LOGO_DIMENSION || height > MAX_LOGO_DIMENSION) {
                if (width >= height) {
                    height = Math.round(height * MAX_LOGO_DIMENSION / width);
                    width = MAX_LOGO_DIMENSION;
                } else {
                    width = Math.round(width * MAX_LOGO_DIMENSION / height);
                    height = MAX_LOGO_DIMENSION;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas no disponible')); return; }

            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            const tryFormats = ['image/webp', 'image/png'];
            let dataUrl = '';
            for (const fmt of tryFormats) {
                const candidate = canvas.toDataURL(fmt, fmt === 'image/webp' ? 0.88 : undefined);
                if (candidate.startsWith(`data:${fmt}`)) {
                    dataUrl = candidate;
                    break;
                }
            }
            if (!dataUrl) dataUrl = canvas.toDataURL('image/png');

            const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
            resolve({ dataUrl, sizeKb });
        };

        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('No se pudo leer la imagen')); };
        img.src = objectUrl;
    });
}

// ─── Mini brand preview ───────────────────────────────────────────────────────

const BrandPreview: React.FC<{ primary: string; secondary: string; logoUrl: string; logoSize: number; siteName: string }> = ({
    primary, secondary, logoUrl, logoSize, siteName,
}) => {
    const gradient = `linear-gradient(135deg, ${primary}, ${secondary})`;
    return (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista previa</p>
            <div className="bg-white/80 backdrop-blur rounded-2xl px-3 py-2 flex items-center gap-2 shadow-sm border border-slate-100">
                {/* ── Logo with badge ── */}
                <div className="relative flex-shrink-0">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt="logo"
                            style={{ width: logoSize, height: logoSize }}
                            className="object-contain drop-shadow-sm"
                        />
                    ) : (
                        <div
                            className="rounded-xl flex items-center justify-center shadow"
                            style={{ width: logoSize, height: logoSize, background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                        >
                            <span className="text-white font-black italic" style={{ fontSize: logoSize * 0.45 }}>N</span>
                        </div>
                    )}
                    {/* Blue checkmark badge */}
                    <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#1877F2] border-[1.5px] border-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                        <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                        </svg>
                    </div>
                </div>
                <span className="font-black text-xs text-slate-700 tracking-tight">{siteName || 'RIFAS NAO'}</span>
                <div className="ml-auto flex gap-1">
                    <span className="px-2 py-0.5 bg-white rounded-lg text-[9px] font-black shadow-sm border"
                        style={{ color: primary }}>Sorteo</span>
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black text-slate-400">Verificar</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl text-white text-xs font-black shadow-sm"
                    style={{ background: gradient }}>$150</div>
                <div className="px-4 py-1.5 rounded-xl text-white text-xs font-black shadow-sm flex-1 text-center"
                    style={{ backgroundColor: primary }}>
                    COMPRAR BOLETO
                </div>
            </div>
            <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-white rounded-full text-[9px] font-black border shadow-sm"
                    style={{ color: primary }}>✦ Edición Especial</span>
                <span className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                    style={{ backgroundColor: secondary }}></span>
            </div>
        </div>
    );
};

// ─── OG Preview types ────────────────────────────────────────────────────────

interface OgData {
    title: string;
    description: string;
    image: string;
    siteName: string;
    url: string;
}

type OgStatus = 'idle' | 'loading' | 'success' | 'error';

// ─── Facebook Page Preview component ─────────────────────────────────────────

const FacebookPagePreview: React.FC<{ url: string }> = ({ url }) => {
    const [status, setStatus] = useState<OgStatus>('idle');
    const [og, setOg] = useState<OgData | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Clear pending debounce
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!url || !isValidUrl(url)) {
            setStatus('idle');
            setOg(null);
            return;
        }

        setStatus('loading');
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await api.get('/settings/og-preview', {
                    params: { url },
                });
                if (res.data?.success) {
                    setOg(res.data.data);
                    setStatus('success');
                } else {
                    setErrorMsg('No se pudo obtener el preview.');
                    setStatus('error');
                }
            } catch (err: any) {
                const msg = err?.response?.data?.error || 'No se pudo conectar a la URL.';
                setErrorMsg(msg);
                setStatus('error');
            }
        }, 800);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [url]);

    // ── Skeleton ──
    if (status === 'loading') {
        return (
            <div className="mt-3 rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 animate-pulse">
                <div className="h-28 bg-slate-200" />
                <div className="p-4 space-y-2">
                    <div className="h-3 bg-slate-200 rounded-full w-3/4" />
                    <div className="h-2.5 bg-slate-200 rounded-full w-full" />
                    <div className="h-2.5 bg-slate-200 rounded-full w-2/3" />
                </div>
            </div>
        );
    }

    // ── Error ──
    if (status === 'error') {
        return (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.56 1.73-2.89L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L3.34 16.11C2.57 17.44 3.53 19 5.07 19z" />
                    </svg>
                </div>
                <div>
                    <p className="text-xs font-black text-red-600">No se pudo cargar el preview</p>
                    <p className="text-[11px] text-red-400 mt-0.5">{errorMsg}</p>
                </div>
            </div>
        );
    }

    // ── Success ──
    if (status === 'success' && og) {
        const displayDomain = (() => {
            try { return new URL(og.url).hostname.replace('www.', ''); } catch { return og.url; }
        })();

        return (
            <div className="mt-3 rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm transition-all duration-300 group">
                {/* Cover image */}
                {og.image && (
                    <div className="relative h-32 bg-slate-100 overflow-hidden">
                        <img
                            src={og.image}
                            alt={og.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        {/* Facebook pill badge */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full pl-1.5 pr-2.5 py-1 shadow-sm">
                            {/* Facebook 'f' logo */}
                            <div className="w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                                <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </div>
                            <span className="text-[10px] font-black text-slate-600">{displayDomain}</span>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        {!og.image && (
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">{displayDomain}</span>
                            </div>
                        )}
                        {og.title && (
                            <p className="text-sm font-black text-slate-800 leading-tight line-clamp-2">
                                {og.title}
                            </p>
                        )}
                        {og.description && (
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                                {og.description}
                            </p>
                        )}
                        <p className="text-[10px] font-bold text-slate-300 mt-2 uppercase tracking-wider">
                            {displayDomain}
                        </p>
                    </div>

                    {/* Open link button */}
                    <a
                        href={og.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir página de Facebook"
                        className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            </div>
        );
    }

    return null;
};

// ─── Main Settings component ──────────────────────────────────────────────────

const Settings: React.FC = () => {
    const { showConfirm } = useConfirm();
    const logoInputRef = useRef<HTMLInputElement>(null);

    const [settings, setSettings] = useState({
        siteName: 'RIFAS NAO',
        bankName: '',
        clabe: '',
        beneficiary: '',
        accountNumber: '',
        paymentInstructions: '',
        whatsapp: '',
        contactEmail: '',
        instagram: '',
        facebookUrl: '',
        autoVerificationEnabled: true,
        logoUrl: '',
        logoSize: 44,
        primaryColor: '#3b82f6',
        secondaryColor: '#6366f1',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [logoSizeKb, setLogoSizeKb] = useState(0);
    const [primaryHexInput, setPrimaryHexInput] = useState('#3b82f6');
    const [secondaryHexInput, setSecondaryHexInput] = useState('#6366f1');

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
                        bankName: data.bankName || '',
                        clabe: data.clabe || '',
                        beneficiary: data.beneficiary || '',
                        accountNumber: data.accountNumber || '',
                        paymentInstructions: data.paymentInstructions || '',
                        whatsapp: data.whatsapp || '',
                        contactEmail: data.contactEmail || '',
                        instagram: data.instagram || '',
                        facebookUrl: data.facebookUrl || '',
                        autoVerificationEnabled: data.autoVerificationEnabled !== false,
                        logoUrl: savedLogo,
                        logoSize: typeof data.logoSize === 'number' ? data.logoSize : 44,
                        primaryColor: primary,
                        secondaryColor: secondary,
                    });
                    if (savedLogo) {
                        setLogoSizeKb(Math.round((savedLogo.length * 3) / 4 / 1024));
                    }
                    setPrimaryHexInput(primary);
                    setSecondaryHexInput(secondary);
                }
            } catch {
                toast.error('Error al cargar la configuración');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        const maxOriginalMb = 8;
        if (file.size > maxOriginalMb * 1024 * 1024) {
            toast.error(`El archivo no debe superar ${maxOriginalMb} MB`);
            return;
        }

        setIsCompressing(true);
        try {
            const { dataUrl, sizeKb } = await compressImage(file);
            setSettings(prev => ({ ...prev, logoUrl: dataUrl }));
            setLogoSizeKb(sizeKb);
            toast.success(`Logo listo (${sizeKb} KB optimizado)`);
        } catch {
            toast.error('No se pudo procesar la imagen. Intenta con otro archivo.');
        } finally {
            setIsCompressing(false);
        }
    };

    const handlePrimaryChange = (hex: string) => {
        setSettings(prev => ({
            ...prev,
            primaryColor: hex,
            secondaryColor: autoSecondary(hex),
        }));
        setPrimaryHexInput(hex);
        setSecondaryHexInput(autoSecondary(hex));
    };

    const handlePrimaryHexInput = (value: string) => {
        setPrimaryHexInput(value);
        if (isValidHex(value)) {
            handlePrimaryChange(value);
        }
    };

    const handleSecondaryChange = (hex: string) => {
        setSettings(prev => ({ ...prev, secondaryColor: hex }));
        setSecondaryHexInput(hex);
    };

    const handleSecondaryHexInput = (value: string) => {
        setSecondaryHexInput(value);
        if (isValidHex(value)) {
            setSettings(prev => ({ ...prev, secondaryColor: value }));
        }
    };

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
                } catch {
                    toast.error('Error al guardar la configuración');
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
                <p className="text-slate-500 mt-1">Gestiona los datos bancarios, contacto e identidad visual de tu página.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">

                {/* ── Identidad Visual: Logotipo ── */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-black text-slate-800 uppercase tracking-wider text-sm">Logotipo</h2>
                            <p className="text-[10px] text-slate-400 font-medium">Aparece en la parte superior izquierda de tu página</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Nombre de la página */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Nombre de la Página
                            </label>
                            <p className="text-[10px] text-slate-400 ml-1">
                                Se muestra en el encabezado y pie de página. Máximo 40 caracteres.
                            </p>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="admin-input font-black tracking-tighter pr-16"
                                    value={settings.siteName}
                                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value.slice(0, 40) })}
                                    placeholder="RIFAS NAO"
                                    maxLength={40}
                                />
                                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tabular-nums ${settings.siteName.length > 32 ? 'text-amber-500' : 'text-slate-300'}`}>
                                    {settings.siteName.length}/40
                                </span>
                            </div>
                            {/* Mini preview del nombre en header */}
                            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 w-fit">
                                <div className="w-5 h-5 rounded-lg flex-shrink-0 overflow-hidden"
                                    style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}>
                                    {settings.logoUrl
                                        ? <img src={settings.logoUrl} alt="" className="w-full h-full object-contain" />
                                        : <span className="w-full h-full flex items-center justify-center text-white font-black text-[8px] italic">N</span>}
                                </div>
                                <span
                                    className="font-black tracking-tighter text-slate-800 leading-none"
                                    style={{
                                        fontSize: settings.siteName.length <= 10 ? '14px'
                                            : settings.siteName.length <= 16 ? '12px'
                                                : settings.siteName.length <= 22 ? '10px'
                                                    : '9px',
                                    }}
                                >
                                    {settings.siteName || 'RIFAS NAO'}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-slate-100"></div>

                        {/* Logo upload area */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            {/* Preview actual */}
                            <div className="flex-shrink-0">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Logo actual</p>
                                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
                                    {settings.logoUrl ? (
                                        <img
                                            src={settings.logoUrl}
                                            alt="Logo actual"
                                            className="w-full h-full object-contain p-2"
                                        />
                                    ) : (
                                        <div
                                            className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md"
                                            style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                                        >
                                            <span className="text-white font-black text-2xl italic">N</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex-1 space-y-3">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-700">
                                        {settings.logoUrl ? 'Cambiar logo' : 'Subir logo'}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        PNG, JPG, WebP o SVG — hasta 8 MB. Se optimiza automáticamente
                                        al tamaño ideal (máx. 512 px) para todas las pantallas.
                                    </p>
                                    {settings.logoUrl && logoSizeKb > 0 && (
                                        <p className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Optimizado — {logoSizeKb} KB guardado
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => logoInputRef.current?.click()}
                                        disabled={isCompressing}
                                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm flex items-center gap-2"
                                    >
                                        {isCompressing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                Optimizando...
                                            </>
                                        ) : (
                                            settings.logoUrl ? 'Cambiar imagen' : 'Seleccionar imagen'
                                        )}
                                    </button>
                                    {settings.logoUrl && !isCompressing && (
                                        <button
                                            type="button"
                                            onClick={() => { setSettings(prev => ({ ...prev, logoUrl: '' })); setLogoSizeKb(0); }}
                                            className="px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 font-black rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95"
                                        >
                                            Eliminar logo
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                            </div>
                        </div>

                        {/* ── Tamaño del logo (slider) — siempre visible si hay logo ── */}
                        <div className={`rounded-2xl bg-slate-50 border border-slate-100 p-5 space-y-4 ${!settings.logoUrl ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Tamaño del logo en la barra</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Ajusta el slider y observa el cambio en tiempo real.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-violet-700 tabular-nums leading-none">{settings.logoSize}</span>
                                    <span className="text-[10px] font-bold text-slate-400">px</span>
                                </div>
                            </div>

                            {/* Live navbar simulation — badge is SEPARATE element from the logo */}
                            <div
                                className="rounded-xl border border-slate-200 shadow-sm"
                                style={{
                                    background: 'rgba(255,255,255,0.82)',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                }}
                            >
                                <div className="px-4 h-16 flex items-center justify-between gap-3">
                                    {/* Left: logo area + badge (as siblings) + text */}
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        {/*
                                          OUTER WRAPPER: always 80×80px — never changes size.
                                          Contains TWO SEPARATE siblings:
                                            1. Logo image: centered via flex, scales with logoSize
                                            2. Badge:      absolute at FIXED coords top:14 right:14
                                                           (= corner of the 44px default logo centered in 80px box)
                                          Badge is NOT a child of the logo — it's an independent element.
                                        */}
                                        <div
                                            className="relative flex-shrink-0 flex items-center justify-center"
                                            style={{ width: 80, height: 80 }}
                                        >
                                            {/* ① Logo: scales, centered — badge is NOT inside this */}
                                            {settings.logoUrl ? (
                                                <img
                                                    src={settings.logoUrl}
                                                    alt="Logo preview"
                                                    style={{
                                                        width: settings.logoSize,
                                                        height: settings.logoSize,
                                                        transition: 'width 0.12s ease, height 0.12s ease',
                                                    }}
                                                    className="object-contain drop-shadow-sm"
                                                />
                                            ) : (
                                                <div
                                                    className="rounded-xl flex items-center justify-center shadow-md"
                                                    style={{
                                                        width: settings.logoSize,
                                                        height: settings.logoSize,
                                                        background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`,
                                                        transition: 'width 0.12s ease, height 0.12s ease',
                                                    }}
                                                >
                                                    <span className="text-white font-black italic" style={{ fontSize: Math.max(10, settings.logoSize * 0.4) }}>N</span>
                                                </div>
                                            )}

                                            {/*
                                              Badge: posición dinámica = esquina real del logo.
                                              Fórmula: 50% del box (40px de 80px) - (logoSize + badgeSize) / 2
                                              → badge center queda exactamente en el corner del logo a cualquier tamaño.
                                            */}
                                            <div
                                                className="absolute bg-[#1877F2] border-2 border-white rounded-full flex items-center justify-center shadow-sm pointer-events-none"
                                                style={{
                                                    width: 14,
                                                    height: 14,
                                                    top: `calc(50% - ${(settings.logoSize + 14) / 2}px)`,
                                                    right: `calc(50% - ${(settings.logoSize + 14) / 2}px)`,
                                                }}
                                            >
                                                <svg width="8" height="8" viewBox="0 0 12 12" fill="white">
                                                    <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Text column: se parte en 2 líneas si el nombre es largo */}
                                        <div className="flex flex-col min-w-0">
                                            <span
                                                className="font-black text-slate-800 tracking-tight leading-tight"
                                                style={{
                                                    fontSize: (settings.siteName || 'RIFAS NAO').length <= 8 ? 11 : (settings.siteName || 'RIFAS NAO').length <= 14 ? 9 : 8,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    wordBreak: 'break-word',
                                                    maxWidth: 80,
                                                }}
                                            >
                                                {settings.siteName || 'RIFAS NAO'}
                                            </span>
                                            <span className="font-bold uppercase text-[7px] tracking-widest mt-0.5" style={{ color: settings.primaryColor }}>Sorteos Certificados</span>
                                        </div>
                                    </div>
                                    {/* Right: decorative nav pills */}
                                    <div className="flex-shrink-0 flex bg-slate-100/80 p-0.5 rounded-xl gap-0.5">
                                        <span className="px-2.5 py-1 rounded-lg text-[8px] font-black bg-white text-slate-700 shadow-sm">Sorteo</span>
                                        <span className="px-2.5 py-1 rounded-lg text-[8px] font-black text-slate-400">Verificar</span>
                                    </div>
                                </div>
                            </div>

                            {/* Slider */}
                            <div className="space-y-2">
                                <input
                                    type="range"
                                    min={20}
                                    max={80}
                                    step={1}
                                    value={settings.logoSize}
                                    onChange={(e) => setSettings(prev => ({ ...prev, logoSize: Number(e.target.value) }))}
                                    className="w-full h-3 rounded-full appearance-none cursor-pointer"
                                    style={{ accentColor: settings.primaryColor }}
                                />
                                <div className="flex justify-between text-[9px] text-slate-400 font-bold select-none">
                                    <span>Pequeño · 20px</span>
                                    <span>Grande · 80px</span>
                                </div>
                            </div>

                            {/* Quick size presets */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-1">Presets:</span>
                                {[28, 36, 44, 56, 68].map(size => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => setSettings(prev => ({ ...prev, logoSize: size }))}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-95 ${settings.logoSize === size
                                            ? 'text-white shadow-sm scale-105'
                                            : 'bg-white border border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600'
                                            }`}
                                        style={settings.logoSize === size ? { backgroundColor: settings.primaryColor } : {}}
                                    >
                                        {size}px{size === 44 ? ' ·def' : ''}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setSettings(prev => ({ ...prev, logoSize: 44 }))}
                                    className="ml-auto text-[9px] font-black text-slate-400 hover:text-violet-600 transition-colors"
                                >↺ Restablecer</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Identidad Visual: Colores ── */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
                        <div className="w-8 h-8 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-black text-slate-800 uppercase tracking-wider text-sm">Colores de Marca</h2>
                            <p className="text-[10px] text-slate-400 font-medium">Personaliza los colores del logo, botones y acentos de tu página</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">

                        {/* Selectores de color */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Color primario */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Color Primario
                                </label>
                                <p className="text-[10px] text-slate-400 -mt-1">Botones, logo, texto activo en navegación</p>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={settings.primaryColor}
                                            onChange={(e) => handlePrimaryChange(e.target.value)}
                                            className="w-14 h-14 rounded-2xl cursor-pointer border-2 border-slate-100 p-1 bg-white"
                                            style={{ colorScheme: 'light' }}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <input
                                            type="text"
                                            value={primaryHexInput}
                                            onChange={(e) => handlePrimaryHexInput(e.target.value)}
                                            className={`admin-input font-mono text-sm uppercase ${!isValidHex(primaryHexInput) ? 'border-red-300 focus:border-red-500' : ''}`}
                                            placeholder="#3b82f6"
                                            maxLength={7}
                                        />
                                        {!isValidHex(primaryHexInput) && (
                                            <p className="text-[10px] text-red-500 font-bold">Formato inválido (ej: #3b82f6)</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Color secundario */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Color Secundario
                                </label>
                                <p className="text-[10px] text-slate-400 -mt-1">Gradientes y acentos (auto-sugerido al cambiar primario)</p>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={settings.secondaryColor}
                                            onChange={(e) => handleSecondaryChange(e.target.value)}
                                            className="w-14 h-14 rounded-2xl cursor-pointer border-2 border-slate-100 p-1 bg-white"
                                            style={{ colorScheme: 'light' }}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <input
                                            type="text"
                                            value={secondaryHexInput}
                                            onChange={(e) => handleSecondaryHexInput(e.target.value)}
                                            className={`admin-input font-mono text-sm uppercase ${!isValidHex(secondaryHexInput) ? 'border-red-300 focus:border-red-500' : ''}`}
                                            placeholder="#6366f1"
                                            maxLength={7}
                                        />
                                        {!isValidHex(secondaryHexInput) && (
                                            <p className="text-[10px] text-red-500 font-bold">Formato inválido (ej: #6366f1)</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const suggested = autoSecondary(settings.primaryColor);
                                        handleSecondaryChange(suggested);
                                    }}
                                    className="text-[10px] font-black text-slate-400 hover:text-violet-600 uppercase tracking-wider transition-colors flex items-center gap-1"
                                >
                                    ↺ Auto-sugerir secundario
                                </button>
                            </div>
                        </div>

                        {/* Vista previa */}
                        <BrandPreview
                            primary={settings.primaryColor}
                            secondary={settings.secondaryColor}
                            logoUrl={settings.logoUrl}
                            logoSize={settings.logoSize}
                            siteName={settings.siteName}
                        />
                    </div>
                </div>

                {/* ── Datos de Transferencia (SPEI) ── */}
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
                                    <span className="text-sm font-bold text-slate-700">Habilitada (IA)</span>
                                </label>
                            </div>
                            <p className="text-[10px] text-slate-500 ml-1">Verifica comprobantes automáticamente usando IA. Desactiva para revisión 100% manual.</p>
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

                {/* ── Contacto y Redes ── */}
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
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instagram</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold select-none">@</span>
                                <input
                                    type="text"
                                    className="admin-input pl-7"
                                    value={settings.instagram.replace(/^@/, '')}
                                    onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                                    placeholder="rifasnao_oficial"
                                    required
                                />
                            </div>
                        </div>

                        {/* ── Facebook ── */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                {/* Facebook blue dot */}
                                <span className="w-3 h-3 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                                    <svg className="w-2 h-2 fill-white" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </span>
                                Página de Facebook
                                <span className="text-slate-300 font-bold normal-case tracking-normal">(opcional)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="url"
                                    className={`admin-input pr-10 ${settings.facebookUrl && !isValidUrl(settings.facebookUrl)
                                        ? 'border-red-300 focus:border-red-500'
                                        : ''
                                        }`}
                                    value={settings.facebookUrl}
                                    onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value.trim() })}
                                    placeholder="https://www.facebook.com/tu-pagina"
                                />
                                {/* Status indicator */}
                                {settings.facebookUrl && isValidUrl(settings.facebookUrl) && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#1877F2] animate-pulse" />
                                )}
                                {settings.facebookUrl && !isValidUrl(settings.facebookUrl) && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-400" />
                                )}
                            </div>
                            {settings.facebookUrl && !isValidUrl(settings.facebookUrl) && (
                                <p className="text-[10px] text-red-500 font-bold ml-1">
                                    Ingresa una URL válida (ej: https://www.facebook.com/tu-pagina)
                                </p>
                            )}
                            {settings.facebookUrl && isValidUrl(settings.facebookUrl) && (
                                <p className="text-[10px] text-slate-400 ml-1">
                                    Vista previa cargando…
                                </p>
                            )}

                            {/* Facebook page preview card */}
                            <FacebookPagePreview url={settings.facebookUrl} />
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
