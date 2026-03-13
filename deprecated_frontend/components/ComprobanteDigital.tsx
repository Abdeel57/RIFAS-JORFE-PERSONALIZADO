import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService.ts';

interface ComprobanteDigitalProps {
  purchaseId: string;
  onClose?: () => void;
}

const ComprobanteDigital: React.FC<ComprobanteDigitalProps> = ({ purchaseId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [brand, setBrand] = useState<{ siteName: string; logoUrl: string, primaryColor: string, secondaryColor: string }>({
    siteName: 'Bismark',
    logoUrl: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#6366f1'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [compData, settings] = await Promise.all([
          apiService.getComprobante(purchaseId),
          apiService.getSettings().catch(() => null),
        ]);
        setData(compData);
        if (settings) {
          setBrand({
            siteName: settings.siteName || 'Bismark',
            logoUrl: settings.logoUrl || '',
            primaryColor: settings.primaryColor || '#3b82f6',
            secondaryColor: settings.secondaryColor || '#6366f1',
          });
        }
      } catch (e: any) {
        setError(e?.message || 'No se pudo cargar el comprobante');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [purchaseId]);

  const comprobanteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#comprobante?purchase=${purchaseId}`
    : '';
  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#verify`
    : '';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(verifyUrl)}&bgcolor=ffffff&color=334155&margin=1`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(comprobanteUrl);
    // Intentar usar toast si existe globalmente
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.success('Enlace copiado');
    } else {
      alert('✅ Enlace copiado al portapapeles');
    }
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-current rounded-full animate-spin mb-4" style={{ color: brand.primaryColor }} />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Generando tu boleto digital...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md text-center shadow-2xl border border-slate-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <p className="text-slate-800 font-black text-lg mb-2">{error || 'Boleto no encontrado'}</p>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">Hubo un problema al recuperar los datos de tu compra. Verifica el enlace o contacta a soporte.</p>
          {onClose && (
            <button onClick={onClose} className="w-full py-4 bg-slate-100 hover:bg-slate-200 rounded-2xl font-black text-slate-700 transition-colors">
              Volver al inicio
            </button>
          )}
        </div>
      </div>
    );
  }

  const { user, raffle, tickets, totalAmount, createdAt } = data;
  const drawDate = raffle?.drawDate ? new Date(raffle.drawDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const purchaseDate = new Date(createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen py-10 px-4 flex flex-col items-center selection:bg-blue-100 selection:text-blue-900" style={{ backgroundColor: '#f8fafc' }}>
      {/* Background Decor */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ background: `radial-gradient(circle at 20% 20%, ${brand.primaryColor} 0%, transparent 40%), radial-gradient(circle at 80% 80%, ${brand.primaryColor}dd 0%, transparent 40%)` }} />

      {/* Main Ticket */}
      <div
        ref={printRef}
        className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] overflow-hidden border border-white relative animate-in fade-in slide-in-from-bottom-8 duration-1000 mb-24"
      >
        {/* Decorative Top Bar - Usando solo el color principal (con variaciones de brillo para profundidad) */}
        <div className="h-3 w-full" style={{ background: `linear-gradient(90deg, ${brand.primaryColor}, ${brand.primaryColor}dd)` }} />

        <div className="p-8 md:p-12 space-y-10">
          {/* Header: Logo and Site Name */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt={brand.siteName} className="h-24 md:h-32 w-auto object-contain drop-shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-xl" style={{ background: brand.primaryColor }}>
                  {brand.siteName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter leading-none mb-1">{brand.siteName}</h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: brand.primaryColor }} />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Comprobante Digital Verificado</span>
              </div>
            </div>
          </div>

          {/* Ticket Body Content */}
          <div className="grid gap-8 relative">
            {/* Divider lines decoration */}
            <div className="absolute left-[-48px] right-[-48px] h-px bg-slate-100 top-[50%] -translate-y-[50%] opacity-50" />

            <div className="grid grid-cols-2 gap-y-8 gap-x-4">
              {/* Cliente */}
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Cliente</p>
                <p className="font-black text-slate-800 text-sm leading-tight">{user?.name}</p>
                <p className="text-[11px] font-medium text-slate-500 leading-none">{user?.phone}</p>
              </div>

              {/* Fecha Compra */}
              <div className="space-y-1 text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Fecha emisión</p>
                <p className="font-black text-slate-800 text-sm leading-tight">{purchaseDate.split(',')[0]}</p>
                <p className="text-[11px] font-medium text-slate-500 leading-none">{purchaseDate.split(',')[1]}</p>
              </div>

              {/* Rifa */}
              <div className="col-span-2 space-y-1 py-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Participando en</p>
                <p className="font-black text-slate-800 text-lg tracking-tight leading-tight">{raffle?.title}</p>
                {drawDate && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-[11px] font-bold text-slate-500">Sorteo: {drawDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Numbers Section */}
          <div className="bg-slate-50 rounded-[2rem] p-6 md:p-8 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
              <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M15 5v2h3v11h-3v2h5V5h-5zm-3 7l-4-4v3H2v2h6v3l4-4z" /></svg>
            </div>

            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Tus Números de la Suerte</p>
            <div className="flex flex-wrap justify-center gap-3">
              {tickets?.map((t: any) => (
                <div
                  key={t.number}
                  className="min-w-[64px] h-[48px] flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-slate-100 shadow-sm transition-transform hover:scale-110 relative"
                >
                  <span className="text-[8px] font-black text-slate-300 uppercase leading-none">
                    {t.isGift ? 'Regalo' : 'Boleto'}
                  </span>
                  <span className={`text-lg font-black leading-none mt-0.5 ${t.isGift ? 'text-blue-600' : 'text-slate-800'}`}>
                    #{t.number.toString().padStart(3, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer of Ticket: Price and QR */}
          <div className="flex flex-col items-center space-y-8 pt-4">
            {/* Amount Paid Chip */}
            <div className="px-6 py-3 rounded-2xl flex flex-col items-center justify-center border-2 border-white shadow-[0_15px_30px_-5px_rgba(0,0,0,0.05)] bg-white relative">
              <span className="absolute -top-2.5 px-2 bg-white text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 rounded-full">Liquidación Total</span>
              <p className="text-3xl font-black text-slate-800 tracking-tighter">
                ${Number(totalAmount).toLocaleString()} <span className="text-xs text-slate-400 font-bold ml-1 uppercase">MXN</span>
              </p>
            </div>

            {/* QR Code and Verification */}
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <img src={qrUrl} alt="QR Verificación" className="w-[160px] h-[160px] md:w-[180px] md:h-[180px] rounded-2xl" />
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1">ID de Validación Única</p>
                <code className="text-[10px] bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-mono font-bold select-all">
                  {purchaseId.slice(0, 18).toUpperCase()}...
                </code>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">
              Muchas gracias por tu compra. ¡Conserva este boleto digital!
            </p>
          </div>
        </div>

        {/* Decorative Ticket "Cuts" */}
        <div className="absolute left-0 right-0 h-10 flex items-center justify-between pointer-events-none" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          <div className="w-10 h-10 rounded-full bg-slate-100 -ml-5 shadow-inner" />
          <div className="w-10 h-10 rounded-full bg-slate-100 -mr-5 shadow-inner" />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .min-h-screen { min-height: auto !important; padding: 0 !important; }
          .max-w-lg { max-width: 100% !important; border: none !important; box-shadow: none !important; }
          .bg-slate-50 { background-color: #f8fafc !important; }
          .shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] { box-shadow: none !important; }
          p, span, h1, h2, code { color: black !important; }
          .fixed { display: none !important; }
        }

        .animate-in {
          animation-duration: 0.5s;
          animation-fill-mode: both;
        }

        .fade-in {
          animation-name: fadeIn;
        }

        .slide-in-from-top-4 {
          animation-name: slideInFromTop;
        }

        .slide-in-from-bottom-8 {
          animation-name: slideInFromBottom;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInFromTop {
          from { transform: translateY(-1rem); }
          to { transform: translateY(0); }
        }

        @keyframes slideInFromBottom {
          from { transform: translateY(2rem); }
          to { transform: translateY(0); }
        }
      `}</style>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent print:hidden flex justify-center z-50">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white p-2 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex gap-2">
          <button
            onClick={handleCopyLink}
            className="flex-1 min-h-[56px] bg-slate-100 rounded-[1.5rem] font-black text-slate-700 hover:bg-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <span className="text-[10px] uppercase tracking-widest">Link</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex-[2] min-h-[56px] text-white rounded-[1.5rem] font-black transition-all flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-95 group"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span className="text-[10px] uppercase tracking-widest">Imprimir Boleto</span>
          </button>
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="mt-4 mb-20 text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-[0.3em] transition-colors print:hidden"
        >
          &larr; Volver al Sorteo
        </button>
      )}
    </div>
  );
};

export default ComprobanteDigital;

