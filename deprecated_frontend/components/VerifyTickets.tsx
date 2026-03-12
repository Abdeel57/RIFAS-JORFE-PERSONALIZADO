
import React, { useState, useEffect } from 'react';
import { soundService } from '../services/soundService.ts';
import { apiService } from '../services/apiService.ts';
import ComprobanteDigital from './ComprobanteDigital.tsx';

const STORAGE_KEY_PENDING = 'nao_pending_purchase';

const VerifyTickets: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ number: number; status: string; raffle?: any }[] | null>(null);
  const [userInfo, setUserInfo] = useState<{ name: string; phone: string } | null>(null);
  const [pendingPurchase, setPendingPurchase] = useState<any>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);

  // Efecto proactivo: Se ejecuta al montar para ver si el dispositivo tiene algo pendiente
  useEffect(() => {
    const checkPending = async () => {
      const savedPending = localStorage.getItem(STORAGE_KEY_PENDING);
      if (savedPending) {
        try {
          const parsed = JSON.parse(savedPending);
          setPendingPurchase(parsed);

          // Verificar contra el servidor si ya está pagada
          if (parsed.purchaseId) {
            try {
              const latest = await apiService.getPurchase(parsed.purchaseId);
              if (latest.status === 'paid') {
                localStorage.removeItem(STORAGE_KEY_PENDING);
                setPendingPurchase(null);
              }
            } catch (e) {
              // Si falla el fetch (404 o red), no hacemos nada con la alerta local
            }
          }
        } catch (e) {
          console.error("Error al cargar snapshot de compra", e);
        }
      }
    };

    checkPending();
    // Escuchar cambios en otras pestañas por si el usuario paga en otro lado
    window.addEventListener('storage', checkPending);
    return () => window.removeEventListener('storage', checkPending);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return alert("Ingresa un número de 10 dígitos");

    setIsSearching(true);
    soundService.playSelect();

    try {
      const data = await apiService.verifyTickets(phone);

      if (data.user) {
        setUserInfo(data.user);
        setResults(data.tickets.map(t => ({
          number: t.number,
          status: t.status,
          purchaseId: t.purchaseId,
          raffle: t.raffle,
        })));

        // Si encontramos que alguno de sus boletos ya está pagado en sistema, 
        // limpiamos proactivamente la alerta de "Pago Pendiente" local.
        if (data.tickets.some(t => t.status === 'Pagado')) {
          localStorage.removeItem(STORAGE_KEY_PENDING);
          setPendingPurchase(null);
        }
      } else {
        setUserInfo(null);
        setResults([]);
      }
    } catch (error: any) {
      console.error('Error verifying tickets:', error);
      alert(error.message || 'Error al consultar los boletos. Por favor intenta de nuevo.');
      setResults(null);
      setUserInfo(null);
    } finally {
      setIsSearching(false);
    }
  };

  const clearPending = () => {
    soundService.playCoins();
    localStorage.removeItem(STORAGE_KEY_PENDING);
    setPendingPurchase(null);
    alert("¡Pago reportado! Tu boleto digital será validado en minutos. ¡Mucha suerte!");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 py-10">
      <div className="text-center space-y-3">
        <div className="inline-block px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2">
          Consultas 24/7
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">Mis Boletos</h2>
        <p className="text-slate-500 text-base">Revisa tus números o liquida tus apartados pendientes.</p>
      </div>

      {/* TARJETA DE COMPRA PENDIENTE (ALERTA ROBUSTA) */}
      {pendingPurchase && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-500 shadow-xl shadow-amber-100/50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="bg-amber-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest w-fit mb-2">Acción Requerida</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Compra Pendiente</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Por pagar</p>
              <p className="text-2xl font-black text-slate-800 tracking-tighter">${pendingPurchase.total.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 py-4 border-y border-amber-100/50">
            {pendingPurchase.tickets.map((n: number) => (
              <div key={n} className="bg-white px-3 py-2 rounded-xl text-xs font-black text-amber-700 shadow-sm border border-amber-100">
                #{n.toString().padStart(3, '0')}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-white/70 backdrop-blur-sm p-5 rounded-3xl border border-amber-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Pagar ahora por SPEI</h4>
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">CLABE BBVA</span>
                  <span className="text-sm font-black text-slate-800">012 180 0152 4895 2410</span>
                </div>
                <button onClick={() => { navigator.clipboard.writeText('012180015248952410'); soundService.playSelect(); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg active:scale-90 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { localStorage.removeItem(STORAGE_KEY_PENDING); setPendingPurchase(null); soundService.playDeselect(); }}
                className="py-4 bg-white border border-amber-200 text-amber-600 font-black rounded-2xl text-[10px] uppercase tracking-widest active:bg-amber-100 transition-colors"
              >
                Cancelar Apartado
              </button>
              <button
                onClick={clearPending}
                className="py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
              >
                Ya Realicé el Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BUSCADOR POR TELÉFONO */}
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100">
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número registrado</label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="10 dígitos de tu WhatsApp"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-base font-bold text-slate-700"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
              />
            </div>
          </div>

          <button
            disabled={isSearching}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3
              ${isSearching ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'}`}
          >
            {isSearching ? <div className="animate-spin h-5 w-5 border-2 border-slate-300 border-t-blue-600 rounded-full"></div> : 'Consultar Boletos'}
          </button>
        </form>

        {results !== null && (
          <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-500 space-y-4">
            {userInfo && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Usuario</p>
                <p className="text-sm font-bold text-slate-800 leading-none">{userInfo.name}</p>
              </div>
            )}
            {results.length > 0 ? (
              <>
                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest border-b border-slate-50 pb-2">Resultados encontrados</h4>
                <div className="grid grid-cols-2 gap-3">
                  {results.map((res, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                      {res.raffle && (
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{res.raffle.title}</p>
                      )}
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Boleto</p>
                      <p className="text-xl font-black text-slate-800">#{res.number.toString().padStart(3, '0')}</p>
                      <span className={`inline-block mt-2 px-3 py-1 text-[8px] font-black rounded-full uppercase ${res.status === 'Pagado' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                        }`}>{res.status}</span>

                      {res.status === 'Pagado' && (
                        <button
                          onClick={() => {
                            setSelectedPurchaseId((res as any).purchaseId);
                            soundService.playCoins();
                          }}
                          className="mt-3 w-full py-2 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 5v2h3v11h-3v2h5V5h-5zm-3 7l-4-4v3H2v2h6v3l4-4z" /></svg>
                          Ver Boleto
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400">No se encontraron boletos para este número.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE COMPROBANTE DIGITAL */}
      {selectedPurchaseId && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto pt-10">
          <ComprobanteDigital
            purchaseId={selectedPurchaseId}
            onClose={() => setSelectedPurchaseId(null)}
          />
        </div>
      )}
    </div>
  );
};

export default VerifyTickets;
