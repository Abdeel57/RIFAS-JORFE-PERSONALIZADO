import React, { useState, useEffect, useRef } from 'react';
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

// ─── Image compression via Canvas ────────────────────────────────────────────

const MAX_LOGO_DIMENSION = 512; // px — cubre pantallas retina 3× hasta 170px de display

function compressImage(file: File): Promise<{ dataUrl: string; sizeKb: number }> {
    return new Promise((resolve, reject) => {
        // SVGs son vectoriales: leer como data URL sin re-renderizar en canvas
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

            // Escalar manteniendo proporción
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

            // Fondo transparente para logos con transparencia
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // Intentar WebP primero, fallback a PNG (para mantener transparencia)
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

// ─── Mini preview component ───────────────────────────────────────────────────

const BrandPreview: React.FC<{ primary: string; secondary: string; logoUrl: string }> = ({
    primary, secondary, logoUrl,
}) => {
    const gradient = `linear-gradient(135deg, ${primary}, ${secondary})`;
    return (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista previa</p>
            {/* Mini navbar */}
            <div className="bg-white/80 backdrop-blur rounded-2xl px-3 py-2 flex items-center gap-2 shadow-sm border border-slate-100">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shadow overflow-hidden flex-shrink-0"
                    style={{ background: gradient }}>
                    {logoUrl ? (
                        <img src={logoUrl} alt="logo" className="w-full h-full object-contain" />
                    ) : (
                        <span className="text-white font-black text-xs italic">N</span>
                    )}
                </div>
                <span className="font-black text-xs text-slate-700 tracking-tight">RIFAS NAO</span>
                <div className="ml-auto flex gap-1">
                    <span className="px-2 py-0.5 bg-white rounded-lg text-[9px] font-black shadow-sm border"
                        style={{ color: primary }}>Sorteo</span>
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black text-slate-400">Verificar</span>
                </div>
            </div>
            {/* Precio + botón */}
            <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl text-white text-xs font-black shadow-sm"
                    style={{ background: gradient }}>$150</div>
                <div className="px-4 py-1.5 rounded-xl text-white text-xs font-black shadow-sm flex-1 text-center"
                    style={{ backgroundColor: primary }}>
                    COMPRAR BOLETO
                </div>
            </div>
            {/* Badge */}
            <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-white rounded-full text-[9px] font-black border shadow-sm"
                    style={{ color: primary }}>✦ Edición Especial</span>
                <span className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                    style={{ backgroundColor: secondary }}></span>
            </div>
        </div>
    );
};

// ─── Main Settings component ──────────────────────────────────────────────────

const Settings: React.FC = () => {
    const { showConfirm } = useConfirm();
    const logoInputRef = useRef<HTMLInputElement>(null);

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
        logoUrl: '',
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
                        bankName: data.bankName || '',
                        clabe: data.clabe || '',
                        beneficiary: data.beneficiary || '',
                        accountNumber: data.accountNumber || '',
                        paymentInstructions: data.paymentInstructions || '',
                        whatsapp: data.whatsapp || '',
                        contactEmail: data.contactEmail || '',
                        instagram: data.instagram || '',
                        autoVerificationEnabled: data.autoVerificationEnabled !== false,
                        logoUrl: savedLogo,
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
                    <div className="p-6">
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
