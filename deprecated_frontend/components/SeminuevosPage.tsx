import React, { useState, useEffect, useMemo } from 'react';

interface UsedVehicle {
  id: string;
  name: string;
  modelYear: string;
  mileage: string;
  description: string;
  price: string;
  imageUrl?: string | null;
}

interface PageCta {
  whatsappPhone?: string | null;
  whatsappMessage?: string | null;
  infoUrl?: string | null;
  primaryLabel?: string | null;
  secondaryLabel?: string | null;
}

const FALLBACK_VEHICLES: UsedVehicle[] = [
  { id: 'fb-1', name: 'Vehículo Ejemplo 1', modelYear: '20XX', mileage: 'X,XXX km', description: 'Descripción breve. Edita este texto desde el panel admin.', price: 'Desde $XXX,XXX MXN' },
  { id: 'fb-2', name: 'Vehículo Ejemplo 2', modelYear: '20XX', mileage: 'XX,XXX km', description: 'Descripción breve. Edita este texto desde el panel admin.', price: 'Desde $XXX,XXX MXN' },
];

async function fetchVehicles(): Promise<UsedVehicle[] | null> {
  const urls = ['/api/used-vehicles', 'http://localhost:3001/api/used-vehicles'];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) return json.data;
    } catch { /* try next */ }
  }
  return null;
}

async function fetchPageCta(section: string): Promise<PageCta | null> {
  const urls = [`/api/page-ctas/${section}`, `http://localhost:3001/api/page-ctas/${section}`];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const json = await res.json();
      if (json?.success) return json.data;
    } catch { /* try next */ }
  }
  return null;
}

interface Props {
  onBack: () => void;
}

const SeminuevosPage: React.FC<Props> = ({ onBack }) => {
  const [items, setItems] = useState<UsedVehicle[] | null>(null);
  const [cta, setCta] = useState<PageCta | null>(null);

  useEffect(() => {
    fetchVehicles().then(data => {
      setItems(data === null ? FALLBACK_VEHICLES : data);
    });
    fetchPageCta('seminuevos').then(setCta);
  }, []);

  const loading = items === null;

  const whatsappUrl = useMemo(() => {
    const phone = cta?.whatsappPhone?.trim();
    if (!phone) return null;
    const message = cta?.whatsappMessage?.trim() || 'Hola, me interesa información sobre los vehículos seminuevos disponibles';
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }, [cta]);

  const infoUrl = cta?.infoUrl?.trim() || null;
  const primaryLabel = cta?.primaryLabel?.trim() || 'Consultar por WhatsApp';
  const secondaryLabel = cta?.secondaryLabel?.trim() || 'Ver Más Información';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-amber-600 font-black text-sm transition-colors active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Regresar
          </button>
          <h2 className="text-sm font-black text-slate-800 tracking-tight">Vehículos Seminuevos</h2>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1.5 1M13 16l1.5-1M13 16H9m5-3h3l2 3" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight mb-1">Vehículos Seminuevos</h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Explora nuestro catálogo de vehículos seminuevos de calidad. Todos los autos pasan por revisión mecánica y cuentan con garantía. Contáctanos para conocer más detalles y opciones de financiamiento.
            </p>
          </div>
        </div>

        {/* Vehículos */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
            Vehículos Disponibles
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
                  <div className="h-2 bg-slate-100 rounded w-1/3 mb-3" />
                  <div className="h-2 bg-slate-100 rounded w-full mb-1" />
                  <div className="h-2 bg-slate-100 rounded w-4/5" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
              <p className="text-slate-400 font-bold text-sm">No hay vehículos disponibles por el momento.</p>
              <p className="text-slate-300 text-xs mt-1">Vuelve pronto o contáctanos directamente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((v) => (
                <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  {v.imageUrl && (
                    <div className="w-full aspect-video rounded-xl overflow-hidden mb-3 bg-slate-50">
                      <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-black text-slate-800">{v.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">{v.modelYear}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                        <span className="text-[10px] text-slate-400 font-medium">{v.mileage}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1 flex-shrink-0">
                      {v.price}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{v.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTAs — solo se muestran los botones que estén configurados en el admin */}
        {(whatsappUrl || infoUrl) && (
          <div className="space-y-3 pt-2">
            {whatsappUrl && (
              <button
                onClick={() => window.open(whatsappUrl, '_blank')}
                className="w-full flex items-center justify-center gap-3 py-4 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-95"
                style={{ background: '#25d366', boxShadow: '0 8px 24px rgba(37,211,102,0.25)' }}
              >
                <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
                {primaryLabel}
              </button>
            )}

            {infoUrl && (
              <button
                onClick={() => window.open(infoUrl, '_blank')}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-200 font-black text-sm rounded-2xl transition-all active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {secondaryLabel}
              </button>
            )}
          </div>
        )}

        <p className="text-[10px] text-slate-300 text-center font-medium pb-8">
          Precios sujetos a cambio. Todos los vehículos son inspeccionados antes de su venta.
        </p>
      </div>
    </div>
  );
};

export default SeminuevosPage;
