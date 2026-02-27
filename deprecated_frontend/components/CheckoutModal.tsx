import React, { useState, useMemo, useEffect, useRef } from 'react';
import { soundService } from '../services/soundService.ts';
import { apiService } from '../services/apiService.ts';
import { FALLBACK_RAFFLE_ID } from '../constants.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTickets: number[];
  raffleId: string;
  pricePerTicket: number;
  /** Se llama cuando la orden se creó y se subió el comprobante correctamente (para refrescar boletos). */
  onPurchaseSuccess?: () => void;
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
}) => {
  const [step, setStep] = useState<CheckoutStep>(1);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', state: '' });
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
        // Cargar usuario del localStorage
        const savedData = localStorage.getItem(STORAGE_KEY_USER);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            setFormData(parsed);
            setIsAutocompleted(true);
          } catch (e) { }
        }

        // Cargar configuraciones del sistema (bancos, etc)
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
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setErrorMessage(null);
    const savedDataStr = localStorage.getItem(STORAGE_KEY_USER);
    const savedData = savedDataStr ? JSON.parse(savedDataStr) : null;
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (savedData) {
        if (field === 'name' && value.toLowerCase() === savedData.name?.toLowerCase() && value.length >= 4) {
          setIsAutocompleted(true);
          return { ...savedData, name: value };
        }
        if (field === 'phone' && value === savedData.phone && value.length === 10) {
          setIsAutocompleted(true);
          return { ...savedData, phone: value };
        }
      }
      if (isAutocompleted) setIsAutocompleted(false);
      return newData;
    });
  };

  const total = selectedTickets.length * pricePerTicket;

  const bankData = useMemo(() => ({
    bank: dynamicSettings?.bankName || 'BBVA México',
    clabe: dynamicSettings?.clabe || '012 180 0152 4895 2410',
    beneficiary: dynamicSettings?.beneficiary || 'RIFAS NAO MÉXICO S.A.',
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
    if (!formData.name || !formData.phone || !formData.email || !formData.state) {
      setErrorMessage('Por favor completa todos los campos: nombre, WhatsApp, estado y correo.');
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

      // 2. Subir el comprobante (la orden ya existe; la verificación automática es opcional)
      setIsUploadingProof(true);
      await apiService.uploadPaymentProof(newPurchaseId, proofPreview);
      setIsUploadingProof(false);

      // Guardar en localStorage para verificación
      localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify({
        tickets: selectedTickets,
        total,
        user: formData,
        timestamp: Date.now(),
        purchaseId: newPurchaseId,
      }));

      soundService.playCoins();
      setStep(3);
      onPurchaseSuccess?.();

      // Auto-avanzar a step 4 después de 5s
      setTimeout(() => setStep(4), 5000);
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black italic text-sm">N</div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">
                  {step === 1 ? 'Tus Datos' : 'Pago y Comprobante'}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {[1, 2].map(s => (
                    <div
                      key={s}
                      className={`h-1 rounded-full transition-all duration-500 ${s === step ? 'w-6 bg-blue-600' : s < step ? 'w-3 bg-blue-300' : 'w-3 bg-slate-100'}`}
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
                {isAutocompleted && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Datos Recuperados
                  </div>
                )}
                <p className="text-slate-500 text-sm">Escribe tu nombre o teléfono para autocompletar.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo *</label>
                  <input
                    required
                    className={`w-full px-5 py-3.5 border rounded-2xl outline-none transition-all text-sm font-bold text-slate-700 ${isAutocompleted ? 'bg-green-50/40 border-green-100' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50'}`}
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
                      className={`w-full px-5 py-3.5 border rounded-2xl outline-none transition-all text-sm font-bold text-slate-700 ${isAutocompleted ? 'bg-green-50/40 border-green-100' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50'}`}
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
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-400 outline-none transition-all text-sm font-bold text-slate-700"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    >
                      <option value="">Estado...</option>
                      {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email *</label>
                  <input
                    required
                    type="email"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-400 outline-none transition-all text-sm font-bold text-slate-700"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
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
                  <p className="text-xl font-black text-blue-600 tracking-tighter">${total.toLocaleString()}</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-blue-100"
              >
                Continuar al Pago →
              </button>
            </form>
          )}

          {/* ════════════════════════════════════════
              STEP 2 — DATOS BANCARIOS + COMPROBANTE
          ════════════════════════════════════════ */}
          {step === 2 && (
            <div className="p-6 space-y-5 animate-in slide-in-from-right-8 duration-300">

              {/* Datos bancarios SPEI */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h5 className="font-black text-slate-800 text-sm uppercase tracking-wider">Transferencia SPEI</h5>
                  </div>
                  <span className="text-[9px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase">Rápido</span>
                </div>

                <div className="bg-white rounded-2xl border border-blue-50 divide-y divide-slate-50">
                  {/* Banco */}
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Banco</span>
                    <span className="text-sm text-slate-800 font-black">{bankData.bank}</span>
                  </div>
                  {/* CLABE */}
                  <div className="px-4 py-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">CLABE Interbancaria</span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-800 font-black text-sm tracking-wider">{bankData.clabe}</span>
                      <button
                        onClick={() => handleCopy(bankData.clabe.replace(/\s/g, ''))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                      >
                        {copied ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            Copiado
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  {/* Beneficiario */}
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Beneficiario</span>
                    <span className="text-xs text-slate-700 font-bold truncate max-w-[60%] text-right">{bankData.beneficiary}</span>
                  </div>
                  {/* Concepto */}
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Concepto</span>
                    <span className="text-xs text-slate-700 font-bold truncate max-w-[60%] text-right">{bankData.concept}</span>
                  </div>
                </div>
              </div>

              {/* Total visible (compacto y claro) */}
              <div className="flex items-center justify-between bg-slate-900 rounded-2xl px-5 py-4">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Monto Exacto a Transferir</p>
                  <p className="text-2xl font-black text-white tracking-tighter mt-0.5">${total.toLocaleString()} <span className="text-slate-500 text-sm font-medium">MXN</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{selectedTickets.length} boleto{selectedTickets.length !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-slate-400 mt-0.5">${pricePerTicket.toLocaleString()} c/u</p>
                </div>
              </div>

              {/* ── ZONA DE CARGA DEL COMPROBANTE ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Comprobante de Pago</p>
                  <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-full px-2.5 py-1">
                    <svg className="w-3 h-3 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest">Verificación Banxico</span>
                  </div>
                </div>

                {!proofPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    className={`border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 group ${isDragOver
                      ? 'border-blue-400 bg-blue-50 scale-[1.02]'
                      : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDragOver ? 'bg-blue-100' : 'bg-white border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50'}`}>
                      <svg className={`w-6 h-6 transition-colors ${isDragOver ? 'text-blue-500' : 'text-slate-300 group-hover:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-600 group-hover:text-blue-600 transition-colors">
                        {isDragOver ? 'Suelta aquí tu comprobante' : 'Adjuntar comprobante de pago'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Haz clic o arrastra la imagen aquí</p>
                      <p className="text-[10px] text-slate-300 mt-0.5 font-medium">JPG, PNG, WEBP · Máx. 10MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  /* Preview del comprobante cargado */
                  <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                    <img
                      src={proofPreview}
                      alt="Comprobante de pago"
                      className="w-full max-h-52 object-contain bg-slate-50 p-2"
                    />
                    <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-600">Comprobante cargado</p>
                          {proofFile && <p className="text-[9px] text-slate-400">{proofFile.name} · {(proofFile.size / 1024).toFixed(0)}KB</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => { setProofFile(null); setProofPreview(null); }}
                        className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-2 py-1 hover:bg-red-50 rounded-lg"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                )}

                {/* Leyenda de verificación automática */}
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl px-4 py-3 flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-violet-700 leading-tight">
                      Confirmación automática con Banxico
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      Para agilizar tu confirmación, asegúrate de que la <span className="font-bold text-slate-700">Clave de Rastreo SPEI</span> sea claramente visible en la imagen. Si no aparece, un agente revisará tu pago en menos de 24 horas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 pb-2">
                <button
                  onClick={() => { setProofFile(null); setProofPreview(null); setErrorMessage(null); setStep(1); }}
                  className="flex-1 bg-slate-100 text-slate-500 font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all hover:bg-slate-200"
                >
                  ← Atrás
                </button>
                <button
                  onClick={handleConfirmWithProof}
                  disabled={!proofPreview || isSubmitting}
                  className={`flex-[2] font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all ${proofPreview && !isSubmitting
                    ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg active:scale-95'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
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
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-3xl font-black text-slate-800 tracking-tight leading-none">¡Recibido!</h4>
                <p className="text-slate-500 font-medium mt-3 leading-relaxed px-4">
                  Tu comprobante fue enviado. El administrador validará tu pago y confirmará tus boletos por WhatsApp al número{' '}
                  <span className="text-blue-600 font-bold">{formData.phone}</span>.
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tu orden</p>
                <div className="flex flex-wrap gap-1">
                  {selectedTickets.slice(0, 8).map(n => (
                    <span key={n} className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black">#{n.toString().padStart(3, '0')}</span>
                  ))}
                  {selectedTickets.length > 8 && (
                    <span className="px-2 py-1 bg-slate-200 text-slate-500 rounded-lg text-[10px] font-black">+{selectedTickets.length - 8} más</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 justify-center">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                ))}
              </div>
              <p className="text-xs text-slate-400">Preparando resumen final...</p>
            </div>
          )}

          {/* ════════════════════════════════════════
              STEP 4 — FINAL
          ════════════════════════════════════════ */}
          {step === 4 && (
            <div className="py-10 px-6 text-center space-y-6 animate-in fade-in duration-700">
              <div className="space-y-2">
                <p className="text-4xl">🎟️</p>
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">¡Gracias, {formData.name.split(' ')[0]}!</h4>
                <p className="text-slate-500 text-sm leading-relaxed px-2">
                  Revisa tu WhatsApp pronto. Te confirmaremos tus boletos en cuanto validemos el pago.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-left space-y-2">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">¿Qué sigue?</p>
                <div className="space-y-1.5">
                  {[
                    { icon: '🔍', text: 'El admin verifica tu comprobante' },
                    { icon: '✅', text: 'Te confirmamos por WhatsApp' },
                    { icon: '🎰', text: 'Participas en el sorteo' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 px-2">
                <button
                  onClick={() => window.open(`https://wa.me/${(dynamicSettings?.whatsapp || '+521234567890').replace(/\D/g, '')}?text=${encodeURIComponent('Hola, acabo de realizar mi pago de Rifas NAO y subí mi comprobante. Por favor confirma mis boletos 🎟️')}`, '_blank')}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] text-white py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-105 transition-all shadow-lg shadow-green-100 active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884 0 2.225.569 3.846 1.613 5.385l-.991 3.62 3.867-.996z" /></svg>
                  Enviar WhatsApp
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar-light::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default CheckoutModal;
