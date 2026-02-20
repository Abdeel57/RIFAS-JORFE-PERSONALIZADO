
import React, { useState, useMemo, useEffect } from 'react';
import { soundService } from '../services/soundService.ts';
import { apiService } from '../services/apiService.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTickets: number[];
  raffleId: string;
  pricePerTicket: number;
}

type CheckoutStep = 1 | 2 | 3 | 4; 

const STORAGE_KEY_USER = 'nao_rifas_user_data';
const STORAGE_KEY_PENDING = 'nao_pending_purchase';

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, selectedTickets, raffleId, pricePerTicket }) => {
  const [step, setStep] = useState<CheckoutStep>(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    state: ''
  });
  const [isAutocompleted, setIsAutocompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos guardados al abrir el modal para pre-rellenar
  useEffect(() => {
    if (isOpen) {
      const savedData = localStorage.getItem(STORAGE_KEY_USER);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData(parsed);
          setIsAutocompleted(true);
        } catch (e) {
          console.error("Error cargando datos", e);
        }
      }
    }
  }, [isOpen]);

  // Lógica de autocompletado inteligente bidireccional
  const handleInputChange = (field: string, value: string) => {
    const savedDataStr = localStorage.getItem(STORAGE_KEY_USER);
    const savedData = savedDataStr ? JSON.parse(savedDataStr) : null;

    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (savedData) {
        // Autocompletar desde NOMBRE (si coincide nombre guardado y el actual lleva > 4 letras)
        if (field === 'name' && value.toLowerCase() === savedData.name.toLowerCase() && value.length >= 4) {
          setIsAutocompleted(true);
          return { ...savedData, name: value };
        }
        // Autocompletar desde TELÉFONO (si coincide teléfono de 10 dígitos)
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

  const uniqueBankData = useMemo(() => ({
    bank: 'BBVA México',
    clabe: '012 180 0152 4895 2410', // CLABE Fija para consistencia
    beneficiary: 'RIFAS NAO MÉXICO S.A.'
  }), []);

  useEffect(() => {
    if (step === 3) {
      soundService.playCoins();
      localStorage.removeItem(STORAGE_KEY_PENDING);
      const timer = setTimeout(() => {
        setStep(4);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  if (!isOpen) return null;

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phone && formData.email && formData.state) {
      // Persistir usuario en localStorage para autocompletado futuro
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(formData));
      
      soundService.playSelect();
      setStep(2);
    } else {
      alert("Por favor completa todos los campos para continuar.");
    }
  };

  const handleConfirmPurchase = async () => {
    setIsSubmitting(true);
    try {
      await apiService.createPurchase({
        raffleId,
        ticketNumbers: selectedTickets,
        user: formData,
      });
      
      // Guardar en localStorage para verificación
      const pendingData = {
        tickets: selectedTickets,
        total: total,
        user: formData,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(pendingData));
      
      soundService.playCoins();
      setStep(3);
    } catch (error: any) {
      console.error('Error creating purchase:', error);
      alert(error.message || 'Error al procesar la compra. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={step < 3 ? onClose : undefined} />
      
      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {step <= 2 && (
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic">N</div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Registro de Compra</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Paso {step} de 2</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        <div className="p-8 overflow-y-auto custom-scrollbar-light">
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-5">
              <div className="text-center mb-6">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 transition-colors duration-500 ${isAutocompleted ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                  {isAutocompleted ? 'Datos Recuperados' : 'Dispositivo Recordado'}
                </div>
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">Tus Datos</h4>
                <p className="text-slate-500 text-sm mt-1">Escribe tu nombre o teléfono para autocompletar.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <input 
                    required
                    className={`w-full px-5 py-3.5 border rounded-2xl outline-none transition-all text-base font-bold text-slate-700 ${isAutocompleted ? 'bg-green-50/30 border-green-100' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50'}`}
                    placeholder="Ej. Juan Pérez"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                    <input 
                      required
                      type="tel"
                      className={`w-full px-5 py-3.5 border rounded-2xl outline-none transition-all text-base font-bold text-slate-700 ${isAutocompleted ? 'bg-green-50/30 border-green-100' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50'}`}
                      placeholder="10 dígitos"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                    <select 
                      required
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-400 outline-none transition-all text-base font-bold text-slate-700"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="CDMX">CDMX</option>
                      <option value="Jalisco">Jalisco</option>
                      <option value="Nuevo Leon">Nuevo León</option>
                      <option value="Edo. Mex">Edo. Mex</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input 
                    required
                    type="email"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-400 outline-none transition-all text-base font-bold text-slate-700"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-base uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-blue-100 mt-6"
              >
                Continuar al Pago
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-10 duration-300">
              <div className="text-center mb-6">
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">Resumen y Pago</h4>
                <p className="text-slate-500 text-sm">Estás adquiriendo <span className="font-bold text-blue-600">{selectedTickets.length} boleto(s)</span></p>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-black text-slate-800 uppercase text-xs tracking-widest">Transferencia SPEI</h5>
                  <span className="text-blue-600 font-bold text-[9px] uppercase">Rápido</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-blue-50 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">BANCO</span>
                    <span className="text-slate-800 font-black">{uniqueBankData.bank}</span>
                  </div>
                  <div className="flex flex-col pt-2 border-t border-slate-50">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CLABE</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-slate-800 font-black text-sm">{uniqueBankData.clabe}</span>
                      <button className="p-2 text-blue-600" onClick={() => { navigator.clipboard.writeText(uniqueBankData.clabe); soundService.playSelect(); }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center mb-4">Monto Exacto</p>
                <p className="text-4xl font-black text-slate-800 text-center tracking-tighter">${total.toLocaleString()}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all">Atrás</button>
                <button 
                  onClick={handleConfirmPurchase}
                  disabled={isSubmitting}
                  className={`flex-[2] bg-slate-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar Pago'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-12 text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h4 className="text-3xl font-black text-slate-800 tracking-tight leading-none">¡Recibido!</h4>
              <p className="text-slate-500 font-medium px-6">Validaremos tu pago y te enviaremos tus boletos digitales por WhatsApp a <span className="text-blue-600 font-bold">{formData.phone}</span>.</p>
            </div>
          )}

          {step === 4 && (
            <div className="py-6 text-center space-y-8 animate-in fade-in duration-700">
              <h4 className="text-2xl font-black text-slate-800 tracking-tight px-4">¡Gracias por participar en Rifas Nao!</h4>
              <div className="space-y-3 px-6">
                <button onClick={() => window.open('https://facebook.com', '_blank')} className="w-full bg-[#1877F2] text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg">
                   Sorteos en Facebook
                </button>
                <button onClick={onClose} className="w-full bg-slate-100 text-slate-600 font-black py-4 rounded-2xl text-xs uppercase tracking-widest">Cerrar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
