import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService.ts';

interface ComprobanteDigitalProps {
  purchaseId: string;
  onClose?: () => void;
}

const ComprobanteDigital: React.FC<ComprobanteDigitalProps> = ({ purchaseId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [brand, setBrand] = useState<{ siteName: string; logoUrl: string }>({ siteName: 'RIFAS NAO', logoUrl: '' });
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
            siteName: settings.siteName || 'RIFAS NAO',
            logoUrl: settings.logoUrl || '',
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
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(comprobanteUrl);
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.success('Enlace copiado');
    } else {
      alert('Enlace copiado al portapapeles');
    }
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Cargando comprobante...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-xl">
          <p className="text-red-500 font-bold mb-4">{error || 'Comprobante no encontrado'}</p>
          {onClose && (
            <button onClick={onClose} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700">
              Volver
            </button>
          )}
        </div>
      </div>
    );
  }

  const { user, raffle, tickets, totalAmount, createdAt } = data;
  const drawDate = raffle?.drawDate ? new Date(raffle.drawDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      {/* Controles fuera del área imprimible */}
      <div className="max-w-md mx-auto mb-6 flex gap-3 print:hidden">
        <button
          onClick={handleCopyLink}
          className="flex-1 py-3 px-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
          Copiar enlace
        </button>
        <button
          onClick={handleDownloadPdf}
          className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Descargar PDF
        </button>
        {onClose && (
          <button onClick={onClose} className="py-3 px-4 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold text-slate-700 print:hidden">
            Cerrar
          </button>
        )}
      </div>

      {/* Comprobante imprimible */}
      <div ref={printRef} className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
        <div className="p-6 md:p-8 space-y-6">
          {/* Logo y nombre */}
          <div className="text-center border-b border-slate-100 pb-6">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.siteName} className="h-14 mx-auto mb-2 object-contain" />
            ) : (
              <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-2xl">
                {brand.siteName.charAt(0)}
              </div>
            )}
            <h1 className="text-xl font-black text-slate-800 tracking-tight">{brand.siteName}</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Comprobante de pago digital</p>
          </div>

          {/* Datos del cliente */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cliente</p>
            <p className="font-bold text-slate-800">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.phone}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {user?.state && <p className="text-sm text-slate-500">{user.state}</p>}
          </div>

          {/* Rifa */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rifa</p>
            <p className="font-bold text-slate-800">{raffle?.title}</p>
            {drawDate && <p className="text-sm text-slate-500">Sorteo: {drawDate}</p>}
          </div>

          {/* Boletos */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Boletos</p>
            <div className="flex flex-wrap gap-2">
              {tickets?.map((t: any) => (
                <span key={t.number} className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-black text-slate-700">
                  #{t.number.toString().padStart(3, '0')}
                </span>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-4 border-t border-b border-slate-100">
            <p className="text-sm font-bold text-slate-500">Total pagado</p>
            <p className="text-2xl font-black text-slate-800">${Number(totalAmount).toLocaleString()}</p>
          </div>

          <p className="text-xs text-slate-400">
            Fecha: {new Date(createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>

          {/* QR para verificación */}
          <div className="pt-6 border-t border-slate-100 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Escanea para verificar tus boletos</p>
            <img src={qrUrl} alt="QR Verificación" className="w-[180px] h-[180px] mx-auto border border-slate-100 rounded-xl" />
            <p className="text-xs text-slate-500 mt-2">{verifyUrl}</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none; }
          .print\\:rounded-none { border-radius: 0; }
        }
      `}</style>
    </div>
  );
};

export default ComprobanteDigital;
