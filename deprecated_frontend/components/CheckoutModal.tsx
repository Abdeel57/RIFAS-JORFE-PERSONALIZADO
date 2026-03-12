import React, { useState, useMemo, useEffect, useRef } from 'react';
import { soundService } from '../services/soundService.ts';
import { apiService } from '../services/apiService.ts';
import { pixelService } from '../services/pixelService.ts';
import { FALLBACK_RAFFLE_ID } from '../constants.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTickets: number[];
  raffleId: string;
  pricePerTicket: number;
  /** Se llama cuando la orden se creó y se subió el comprobante correctamente (para refrescar boletos). */
  onPurchaseSuccess?: () => void;
  logoUrl?: string;
  siteName?: string;
  raffleTitle: string;
  /** Settings cargados por el App (evita el doble fetch al abrir el modal) */
  initialSettings?: any;
}

// Steps: 1=Datos, 2=Pago+Comprobante, 3=Confirmado, 4=Final
type CheckoutStep = 1 | 2 | 3 | 4;

const STORAGE_KEY_USER = 'nao_rifas_user_data';
const STORAGE_KEY_PENDING = 'nao_pending_purchase';

const MEXICAN_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'CDMX', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango',
  'Edo. Mex', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
  'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
  'Yucatán', 'Zacatecas', 'Otro'
];

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedTickets,
  raffleId,
  pricePerTicket,
  onPurchaseSuccess,
  logoUrl,
  siteName,
  raffleTitle,
  initialSettings,
}) => {
  const [step, setStep] = useState<CheckoutStep>(1);
  const [formData, setFormData] = useState({ name: '', phone: '', state: '' });
  const [isAutocompleted, setIsAutocompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [dynamicSettings, setDynamicSettings] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Comprobante de pago
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  // Cargar datos guardados y configuraciones al abrir  
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPurchaseId(null);
      setProofFile(null);
      setProofPreview(null);
      setErrorMessage(null);

      const loadData = async () => {
        // Cargar usuario del localStorage (normalizando campos, sin email)
        const savedData = localStorage.getItem(STORAGE_KEY_USER);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            const normalized = {
              name: parsed.name || '',
              phone: parsed.phone || '',
              state: parsed.state || '',
            };
            if (normalized.name || normalized.phone) {
              setFormData(normalized);
              setIsAutocompleted(true);
            }
          } catch (e) { }
        }

        // Tracking: InitiateCheckout
        pixelService.trackInitiateCheckout({ title: raffleTitle, id: raffleId, ticketPrice: pricePerTicket }, selectedTickets.length);

        // Si el App ya pasó los settings, usarlos directamente (evita fetch redundante)
        if (initialSettings) {
          setDynamicSettings(initialSettings);
          return;
        }

        // Fallback: cargar configuraciones del sistema (bancos, etc)
        try {
          const settings = await apiService.getSettings();
          if (settings) {
            setDynamicSettings(settings);
          }
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      };

      loadData();
    }
  }, [isOpen, initialSettings]);

  const handleInputChange = (field: string, value: string) => {
    setErrorMessage(null);
    const savedDataStr = localStorage.getItem(STORAGE_KEY_USER);
    const savedData = savedDataStr ? JSON.parse(savedDataStr) : null;
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Autocompletar si coincide exactamente con datos guardados
      if (savedData) {
        if (field === 'name' && value.toLowerCase() === savedData.name?.toLowerCase() && value.length >= 4) {
          setIsAutocompleted(true);
          return { name: value, phone: savedData.phone || '', state: savedData.state || '' };
        }
        if (field === 'phone' && value === savedData.phone && value.length === 10) {
          setIsAutocompleted(true);
          return { name: savedData.name || '', phone: value, state: savedData.state || '' };
        }
      }
      // Si el usuario modifica cualquier campo, marcamos como no autocompletado
      // pero NUNCA bloqueamos la edición
      if (isAutocompleted) setIsAutocompleted(false);
      return newData;
    });
  };

  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'manual'>('idle');
  const [verificationReason, setVerificationReason] = useState<string | null>(null);

  const pollPurchaseStatus = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 20; // 20 intentos * 1.5s = 30 segundos máx de fondo

    const interval = setInterval(async () => {
      attempts++;
      try {
        const purchase = await apiService.getPurchase(id);
        if (purchase.status === 'paid') {
          clearInterval(interval);
          setVerificationStatus('success');
          soundService.playCoins();
          setStep(4);
        } else if (purchase.verificationStatus === 'rejected' || purchase.verificationStatus === 'pending_manual') {
          clearInterval(interval);
          setVerificationStatus('manual');
          setVerificationReason(purchase.verificationNote || null);
          setStep(4);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setVerificationStatus('manual');
          setStep(4);
        }
      } catch (e) {
        console.error('Error polling status:', e);
      }
    }, 1500);
  };

  const getHumanizedReason = (rawReason: string | null) => {
    if (!rawReason) return "El administrador validará tu pago en unos momentos.";

    if (rawReason.includes('Razón:')) {
      const parts = rawReason.split('Razón:');
      const practicalReason = parts[1].split('\n')[0].trim();

      const lowReason = practicalReason.toLowerCase();
      if (lowReason.includes('nombre') || lowReason.includes('name') || lowReason.includes('coincide')) {
        return "Tu nombre no aparece en el concepto del pago o no coincide con tu registro.";
      }
      if (lowReason.includes('monto') || lowReason.includes('amount')) {
        return "El monto de tu transferencia no coincide con el total solicitado.";
      }
      if (lowReason.includes('cuenta') || lowReason.includes('account')) {
        return "La cuenta de destino del comprobante no coincide con la nuestra.";
      }
      if (lowReason.includes('futuro') || lowReason.includes('fecha')) {
        return "La fecha de tu comprobante parece incorrecta o futura.";
      }
      return practicalReason;
    }

    return "No pudimos detectar los datos de tu pago automáticamente.";
  };

  const handleSupportWhatsApp = () => {
    const phone = (dynamicSettings?.whatsapp || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('52') ? phone : `52${phone}`;
    const name = formData.name;

    // Determinar la situación para el mensaje de WhatsApp
    let situacion = "Subí mi comprobante pero no se validó automáticamente en el sistema.";
    const rawReason = (verificationReason || '').toLowerCase();

    if (rawReason.includes('nombre') || rawReason.includes('name') || rawReason.includes('coincide')) {
      situacion = "El nombre en mi transferencia no coincide exactamente con mi registro o olvidé ponerlo en el concepto.";
    } else if (rawReason.includes('monto') || rawReason.includes('amount')) {
      situacion = "El monto que transferí parece tener una pequeña diferencia con el total que me pedía la página.";
    } else if (rawReason.includes('cuenta') || rawReason.includes('account')) {
      situacion = "Me equivoqué de cuenta o el número de cuenta destino no coincide con el del sistema.";
    } else if (rawReason.includes('futuro') || rawReason.includes('fecha')) {
      situacion = "Tuve un detalle con la fecha de mi transferencia al momento de subir mi comprobante.";
    }

    const message = `¡Hola! 👋 Necesito ayuda con mi pago por favor.

👤 *Nombre:* ${name}
🎟️ *Boletos para:* ${raffleTitle}
📝 *Situación:* ${situacion}

Me gustaría que verifiquen mi comprobante manualmente para confirmar mis boletos. ¡Muchas gracias! 🙏`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };


  const total = selectedTickets.length * pricePerTicket;

  const bankData = useMemo(() => ({
    bank: dynamicSettings?.bankName || 'BBVA México',
    clabe: dynamicSettings?.clabe || '012 180 0152 4895 2410',
    beneficiary: dynamicSettings?.beneficiary || 'Bismark México S.A.',
    concept: `Rifa NAO - ${selectedTickets.length} boleto(s)`,
  }), [selectedTickets.length, dynamicSettings]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    soundService.playSelect();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Step 1: Envía datos → crea la compra en BD (estado pending) ──
  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!formData.name.trim() || !formData.phone.trim() || !formData.state.trim()) {
      setErrorMessage('Por favor completa todos los campos: nombre, WhatsApp y estado.');
      return;
    }
    if (formData.phone.replace(/\D/g, '').length !== 10) {
      setErrorMessage('El WhatsApp debe tener exactamente 10 dígitos.');
      return;
    }
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(formData));
    soundService.playSelect();
    setStep(2);
  };

  // ── Manejo de imagen de comprobante ──
  const processFile = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Solo se aceptan imágenes (JPG, PNG, WEBP, etc.).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('La imagen no debe superar 10 MB.');
      return;
    }
    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ── Step 2: Confirmar compra y subir comprobante ──
  const handleConfirmWithProof = async () => {
    setErrorMessage(null);
    if (raffleId === FALLBACK_RAFFLE_ID) {
      setErrorMessage('Esta rifa es solo de demostración (no hay conexión con el servidor). Recarga la página e intenta de nuevo para comprar boletos reales.');
      return;
    }
    if (!proofPreview) {
      setErrorMessage('Por favor adjunta el comprobante de pago antes de confirmar.');
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Crear la compra en BD (no depende de verificación automática)
      const purchaseResult = await apiService.createPurchase({
        raffleId,
        ticketNumbers: selectedTickets,
        user: formData,
      });
      const newPurchaseId = purchaseResult?.id;
      if (!newPurchaseId) {
        setErrorMessage('El servidor no devolvió el número de orden. Intenta de nuevo o contacta soporte.');
        return;
      }
      setPurchaseId(newPurchaseId);

      // 2. Subir el comprobante 
      setIsUploadingProof(true);
      await apiService.uploadPaymentProof(newPurchaseId, proofPreview);
      setIsUploadingProof(false);

      // Tracking: Purchase (El usuario envió el comprobante)
      pixelService.trackPurchase({
        raffleTitle,
        raffleId,
        total,
        tickets: selectedTickets,
        purchaseId: newPurchaseId
      });

      // 3. Decidir flujo: IA o Manual directo
      if (dynamicSettings?.autoVerificationEnabled === false) {
        // FLUJO MANUAL DIRECTO: No pasamos por Step 3 (spinner)
        setVerificationStatus('manual');
        setStep(4);
      } else {
        // FLUJO IA: Pasamos por Step 3 (validando...) y hacemos polling
        setVerificationStatus('verifying');
        setStep(3);
        pollPurchaseStatus(newPurchaseId);
      }

      // Guardar en localStorage
      localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify({
        tickets: selectedTickets,
        total,
        user: formData,
        timestamp: Date.now(),
        purchaseId: newPurchaseId,
      }));

      onPurchaseSuccess?.();

    } catch (error: any) {
      const msg = error?.message || 'No se pudo crear la orden. Revisa tus datos e intenta de nuevo.';
      if (msg.includes('fetch') || msg.includes('red') || msg.includes('Failed') || msg.includes('404')) {
        setErrorMessage(`${msg} Si el error continúa, comprueba que la página tenga conexión con el servidor (config.json o URL del API).`);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsSubmitting(false);
      setIsUploadingProof(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={step < 3 ? onClose : undefined}
      />

      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh]">

        {/* ── Header ── */}
        {step <= 2 && (
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              {/* Logo de la página */}
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteName || 'Logo'}
                  className="w-8 h-8 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black italic text-sm"
                  style={{ background: 'linear-gradient(135deg, var(--brand-primary), rgba(var(--brand-primary-rgb),0.75))' }}
                >
                  {(siteName || 'N').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">
                  {step === 1 ? 'Tus Datos' : 'Pago y Comprobante'}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {[1, 2].map(s => (
                    <div
                      key={s}
                      className={`h-1 rounded-full transition-all duration-500 ${s === step ? 'w-6' : 'w-3'}`}
                      style={{
                        backgroundColor: s === step
                          ? 'var(--brand-primary)'
                          : s < step
                            ? 'rgba(var(--brand-primary-rgb), 0.35)'
                            : 'rgb(241 245 249)',
                      }}
                    />
                  ))}
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-1">Paso {step} de 2</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="overflow-y-auto custom-scrollbar-light flex-1">

          {/* ── Aviso modo demostración (rifa fallback = sin API) ── */}
          {raffleId === FALLBACK_RAFFLE_ID && (step === 1 || step === 2) && (
            <div className="mx-4 mt-4 p-4 rounded-2xl bg-blue-50 border border-blue-200 shadow-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-800 leading-snug">
                    Vista de demostración. No hay conexión con el servidor. Recarga la página para ver rifas reales y poder comprar boletos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Cuadro de error integrado (step 1 y 2) ── */}
          {errorMessage && (step === 1 || step === 2) && (
            <div className="mx-4 mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-800 leading-snug">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="mt-2 text-xs font-black text-amber-700 hover:text-amber-900 uppercase tracking-wider transition-colors"
                  >
                    Entendido
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="flex-shrink-0 p-1 rounded-lg text-amber-500 hover:bg-amber-100 transition-colors"
                  aria-label="Cerrar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 1 — DATOS DEL COMPRADOR
          ════════════════════════════════════════ */}
          {step === 1 && (
            <form onSubmit={handleNext} className="p-6 space-y-5">
              <div className="text-center mb-4">
                {isAutocompleted ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      Datos Recuperados
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ name: '', phone: '', state: '' });
                        setIsAutocompleted(false);
                      }}
                      className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest underline underline-offset-2 transition-colors"
                    >
                      Usar datos distintos
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Escribe tu nombre o teléfono para autocompletar.</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo *</label>
                  <input
                    required
                    className={`w-full px-5 py-3.5 border rounded-2xl outline-none transition-all text-sm font-bold text-slate-700 brand-input ${isAutocompleted ? 'bg-green-50/40 border-green-100' : 'bg-slate-50 border-slate-100'}`}
                    placeholder="Ej. Juan Pérez García"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp *</label>
                    <input
                      required
                      type="tel"
                      className={`w-full px-5 py-3.5 border rounded-2xl outline-none transition-all text-sm font-bold text-slate-700 brand-input ${isAutocompleted ? 'bg-green-50/40 border-green-100' : 'bg-slate-50 border-slate-100'}`}
                      placeholder="10 dígitos"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado *</label>
                    <select
                      required
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none transition-all text-sm font-bold text-slate-700 brand-input"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    >
                      <option value="">Estado...</option>
                      {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>


              </div>

              {/* Resumen rápido de boletos */}
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">
                    {selectedTickets.length} boleto{selectedTickets.length !== 1 ? 's' : ''}
                    <span className="text-slate-400 font-medium ml-2 text-xs">
                      #{selectedTickets.slice(0, 3).map(n => n.toString().padStart(3, '0')).join(' #')}
                      {selectedTickets.length > 3 ? ` +${selectedTickets.length - 3} más` : ''}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                  <p className="text-xl font-black tracking-tighter" style={{ color: 'var(--brand-primary)' }}>${total.toLocaleString()}</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full text-white font-black py-4 rounded-2xl text-sm uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg hover:opacity-90"
                style={{
                  backgroundColor: 'var(--brand-primary)',
                  boxShadow: '0 8px 25px rgba(var(--brand-primary-rgb), 0.25)',
                }}
              >
                Continuar al Pago →
              </button>
            </form>
          )}

          {/* ════════════════════════════════════════
              STEP 2 — DATOS BANCARIOS + COMPROBANTE
          ════════════════════════════════════════ */}
          {step === 2 && (
            <div className="p-4 space-y-3 animate-in slide-in-from-right-8 duration-300">

              {/* ── Tarjeta bancaria compacta ── */}
              <div
                className="border rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(var(--brand-primary-rgb),0.05) 0%, rgba(var(--brand-primary-rgb),0.09) 100%)',
                  borderColor: 'rgba(var(--brand-primary-rgb), 0.15)',
                }}
              >
                {/* Header compacto con total integrado */}
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--brand-primary)' }}>
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <span className="font-black text-slate-700 text-xs uppercase tracking-wide">Transferencia SPEI</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-lg tracking-tighter" style={{ color: 'var(--brand-primary)' }}>${total.toLocaleString()}</span>
                    <span className="text-slate-400 text-xs font-medium ml-1">MXN</span>
                  </div>
                </div>

                {/* Filas de datos */}
                <div className="bg-white mx-3 mb-3 rounded-xl divide-y divide-slate-50" style={{ border: '1px solid rgba(var(--brand-primary-rgb), 0.08)' }}>
                  {/* Banco */}
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Banco</span>
                    <span className="text-xs text-slate-800 font-black">{bankData.bank}</span>
                  </div>
                  {/* CLABE */}
                  <div className="flex items-center justify-between px-3 py-2 gap-2">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">CLABE</p>
                      <p className="text-xs text-slate-800 font-black tracking-wider mt-0.5">{bankData.clabe}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(bankData.clabe.replace(/\s/g, ''))}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex-shrink-0 ${copied ? 'bg-green-100 text-green-700' : 'hover:opacity-80'}`}
                      style={!copied ? { backgroundColor: 'rgba(var(--brand-primary-rgb), 0.08)', color: 'var(--brand-primary)' } : {}}
                    >
                      {copied ? (
                        <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>Copiado</>
                      ) : (
                        <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>Copiar</>
                      )}
                    </button>
                  </div>
                  {/* Beneficiario + Concepto en grid */}
                  <div className="grid grid-cols-2 divide-x divide-slate-50">
                    <div className="px-3 py-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Beneficiario</p>
                      <p className="text-[10px] text-slate-700 font-bold mt-0.5 truncate">{bankData.beneficiary}</p>
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                      <p className="text-sm font-black mt-0.5" style={{ color: 'var(--brand-primary)' }}>${total.toLocaleString()} <span className="text-slate-400 text-[10px] font-medium">MXN</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Aviso compacto ── */}
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-[11px] leading-tight">
                  <span className="font-black text-amber-700">Importante: </span>
                  <span className="text-amber-600 font-medium">Escribe tu nombre en el concepto de pago al transferir.</span>
                </p>
              </div>

              {/* ── Zona de comprobante compacta ── */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comprobante de pago</p>

                {!proofPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    className="border-2 border-dashed rounded-xl px-4 py-5 flex items-center gap-4 cursor-pointer transition-all duration-200"
                    style={isDragOver ? {
                      borderColor: 'var(--brand-primary)',
                      backgroundColor: 'rgba(var(--brand-primary-rgb), 0.04)',
                    } : {
                      borderColor: '#e2e8f0',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={isDragOver ? { backgroundColor: 'rgba(var(--brand-primary-rgb), 0.1)' } : { backgroundColor: 'white', border: '1px solid #f1f5f9' }}
                    >
                      <svg className="w-5 h-5" style={{ color: isDragOver ? 'var(--brand-primary)' : '#cbd5e1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-600" style={isDragOver ? { color: 'var(--brand-primary)' } : {}}>
                        {isDragOver ? 'Suelta aquí' : 'Adjuntar comprobante'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Clic o arrastra · JPG, PNG, WEBP · Máx. 10MB</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                    <img src={proofPreview} alt="Comprobante" className="w-full max-h-36 object-contain bg-slate-50 p-1.5" />
                    <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-[10px] font-black text-slate-600">Comprobante listo</p>
                      </div>
                      <button onClick={() => { setProofFile(null); setProofPreview(null); }} className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors px-2 py-1 hover:bg-red-50 rounded-lg">
                        Cambiar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setProofFile(null); setProofPreview(null); setErrorMessage(null); setStep(1); }}
                  className="flex-1 bg-slate-100 text-slate-500 font-black py-3 rounded-2xl text-xs uppercase tracking-widest transition-all hover:bg-slate-200"
                >
                  ← Atrás
                </button>
                <button
                  onClick={handleConfirmWithProof}
                  disabled={!proofPreview || isSubmitting}
                  className="flex-[2] font-black py-3 rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-95"
                  style={proofPreview && !isSubmitting ? {
                    backgroundColor: 'var(--brand-primary)',
                    color: 'white',
                    boxShadow: '0 8px 25px rgba(var(--brand-primary-rgb), 0.25)',
                  } : {
                    backgroundColor: '#f1f5f9',
                    color: '#cbd5e1',
                    cursor: 'not-allowed',
                  }}
                >
                  {isSubmitting
                    ? isUploadingProof
                      ? '📤 Subiendo...'
                      : '⏳ Creando orden...'
                    : proofPreview
                      ? '✓ Confirmar y Enviar'
                      : 'Adjunta el comprobante'
                  }
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 3 — CONFIRMACIÓN ANIMADA
          ════════════════════════════════════════ */}
          {step === 3 && (
            <div className="py-14 px-8 text-center space-y-5 animate-in zoom-in-95 duration-500">
              <div className="relative">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="absolute top-0 right-[35%] w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-50">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              </div>

              <div>
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">Validando tu pago...</h4>
                <p className="text-slate-500 font-medium mt-3 text-sm leading-relaxed px-4">
                  Estamos verificando tu comprobante. <br />
                  <span className="text-xs text-slate-400 font-normal">Esto tardará solo unos segundos.</span>
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Orden {purchaseId?.slice(-6).toUpperCase()}</p>
                  <p className="text-sm font-black text-slate-800">${total.toLocaleString()} MXN</p>
                </div>
                <div className="flex -space-x-2">
                  {selectedTickets.slice(0, 3).map(n => (
                    <div key={n} className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-[8px] font-black text-slate-400 shadow-sm">
                      #{n.toString().padStart(3, '0')}
                    </div>
                  ))}
                  {selectedTickets.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                      +{selectedTickets.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 4 — FINAL
          ════════════════════════════════════════ */}
          {step === 4 && (
            <div className="py-10 px-6 text-center space-y-6 animate-in fade-in duration-700">
              {verificationStatus === 'success' ? (
                // ── VISTA DE ÉXITO INSTANTÁNEO ──
                <>
                  <div className="space-y-6">
                    <div className="relative w-24 h-24 mx-auto">
                      {/* Brillo vibrante detrás del check */}
                      <div className="absolute inset-0 bg-[#00ffa3] opacity-25 blur-2xl animate-pulse rounded-full" />
                      <div className="relative w-24 h-24 bg-gradient-to-br from-[#00ffa3] to-[#00d1ff] rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(0,255,163,0.5)] animate-in zoom-in-50 duration-500">
                        <svg className="w-12 h-12 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" className="animate-draw-check" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">
                        ¡BOLETOS PAGADOS!
                      </h4>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00ffa3] animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validación Instantánea Exitosa</span>
                      </div>
                    </div>

                    <p className="text-slate-500 text-sm leading-relaxed px-6">
                      ¡Felicidades! Tu pago ha sido procesado y tus números ya están <span className="text-[#00c87d] font-black italic">confirmados</span>.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 px-2 pt-4">
                    {/* Botón de Descarga / Ver Boleto */}
                    <button
                      onClick={() => {
                        window.location.hash = `#comprobante?purchase=${purchaseId}`;
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-3 text-white font-black py-4.5 rounded-[1.5rem] text-sm uppercase tracking-[0.15em] transition-all active:scale-95 shadow-2xl hover:brightness-110 group relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #00ffa3, #00d17a)',
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      <span>Descargar Boleto</span>
                    </button>

                    <button
                      onClick={() => window.location.reload()}
                      className="w-full bg-slate-100 text-slate-600 font-black py-4 rounded-2xl text-sm uppercase tracking-widest transition-all hover:bg-slate-200 active:scale-95"
                    >
                      Volver a comprar
                    </button>
                  </div>
                </>
              ) : (
                // ── VISTA MANUAL (FLUJO NORMAL) ──
                <>
                  <div className="space-y-4">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                      <div className="absolute inset-0 bg-blue-100 opacity-30 blur-2xl rounded-full" />
                      <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] animate-in zoom-in-50 duration-500">
                        <p className="text-4xl">🎟️</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">
                        ¡CASI LISTO, {formData.name.split(' ')[0].toUpperCase()}!
                      </h4>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Pedido Recibido con Éxito</span>
                      </div>
                    </div>

                    <p className="text-slate-500 text-sm leading-relaxed px-6">
                      Hemos recibido tu comprobante correctamente. Tu participación está <span className="text-blue-600 font-black italic">siendo procesada</span>.
                    </p>
                  </div>

                  {!verificationReason && (
                    <div
                      className="rounded-[2rem] p-6 text-left space-y-4 border shadow-sm relative overflow-hidden"
                      style={{
                        backgroundColor: 'rgba(var(--brand-primary-rgb), 0.03)',
                        borderColor: 'rgba(var(--brand-primary-rgb), 0.1)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--brand-primary)' }}>Próximos pasos</p>
                        <div className="flex gap-1">
                          <div className="w-1 h-1 rounded-full bg-blue-200" />
                          <div className="w-1 h-1 rounded-full bg-blue-300" />
                          <div className="w-1 h-1 rounded-full bg-blue-400" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        {[
                          { title: 'Validación', text: 'El administrador confirmará tu pago' },
                          { title: 'Notificación', text: 'Recibirás tu boleto por WhatsApp' },
                          { title: 'Sorteo', text: '¡Participas directo por el gran premio!' },
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: 'var(--brand-primary)' }}>{i + 1}</div>
                              {i < 2 && <div className="w-0.5 h-full bg-slate-100 my-1" />}
                            </div>
                            <div className="space-y-0.5 pb-1">
                              <p className="text-xs font-black text-slate-800 leading-none">{item.title}</p>
                              <p className="text-[10px] text-slate-400 font-medium leading-tight">{item.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2.5 px-2">
                    {/* Botón de aclaración SOLO si hubo error real en validación automática (no en modo manual) */}
                    {(verificationReason && verificationStatus !== 'manual') && (
                      <button
                        onClick={handleSupportWhatsApp}
                        className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-green-200 hover:brightness-105 active:scale-[0.98] transition-all"
                      >
                        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Enviar aclaración
                      </button>
                    )}

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => window.location.reload()}
                        className="flex-1 text-slate-500 font-bold py-3.5 rounded-2xl text-[10px] uppercase tracking-widest border border-slate-200 transition-all active:scale-95 hover:bg-slate-50"
                      >
                        Volver a comprar
                      </button>

                      <button
                        onClick={() => window.open(dynamicSettings?.facebookUrl || 'https://facebook.com', '_blank')}
                        className="flex-1 flex items-center justify-center gap-1.5 text-white font-black py-3.5 rounded-2xl text-[9px] uppercase tracking-widest transition-all active:scale-95 hover:brightness-110 shadow-lg shadow-blue-100"
                        style={{ backgroundColor: '#1877F2' }}
                      >
                        <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073" /></svg>
                        Seguir en Facebook
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar-light::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

        /* Input focus states use brand color via CSS variable */
        .brand-input:focus {
          background-color: white;
          border-color: var(--brand-primary) !important;
          box-shadow: 0 0 0 4px rgba(var(--brand-primary-rgb), 0.08) !important;
          outline: none;
        }

        @keyframes draw-check {
          0% { stroke-dasharray: 0 100; stroke-dashoffset: 0; opacity: 0; }
          100% { stroke-dasharray: 100 100; stroke-dashoffset: 0; opacity: 1; }
        }

        .animate-draw-check {
          animation: draw-check 0.8s ease-out forwards;
        }

        .py-4\\.5 { padding-top: 1.125rem; padding-bottom: 1.125rem; }
      `}</style>
    </div>
  );
};

export default CheckoutModal;
