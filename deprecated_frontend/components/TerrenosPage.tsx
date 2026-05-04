import React, { useState, useEffect } from 'react';

// ── Configura estos valores según tu negocio ──────────────────────────────────
const WHATSAPP_TERRENOS = 'https://wa.me/XXXXXXXXXX?text=Hola%2C%20me%20interesa%20informaci%C3%B3n%20sobre%20los%20terrenos%20disponibles';
const INFO_URL_TERRENOS = 'https://PLACEHOLDER.com';
// ─────────────────────────────────────────────────────────────────────────────

interface LandDevelopment {
  id: string;
  name: string;
  location: string;
  description: string;
  price: string;
  imageUrl?: string | null;
}

// Fallback (si el backend no responde, mostramos al menos algo)
const FALLBACK_DEVELOPMENTS: LandDevelopment[] = [
  { id: 'fb-1', name: 'Desarrollo Ejemplo 1', location: 'Ciudad, Estado', description: 'Descripción breve del desarrollo. Edita este texto desde el panel admin.', price: 'Desde $XXX,XXX MXN' },
  { id: 'fb-2', name: 'Desarrollo Ejemplo 2', location: 'Ciudad, Estado', description: 'Descripción breve del desarrollo. Edita este texto desde el panel admin.', price: 'Desde $XXX,XXX MXN' },
];

async function fetchDevelopments(): Promise<LandDevelopment[] | null> {
  const urls = ['/api/land-developments', 'http://localhost:3001/api/land-developments'];
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

interface Props {
  onBack: () => void;
}

const TerrenosPage: React.FC<Props> = ({ onBack }) => {
  const [items, setItems] = useState<LandDevelopment[] | null>(null);

  useEffect(() => {
    fetchDevelopments().then(data => {
      // null = backend no respondió → fallback. [] = admin no configuró nada → respeta y muestra empty.
      setItems(data === null ? FALLBACK_DEVELOPMENTS : data);
    });
  }, []);

  const loading = items === null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-black text-sm transition-colors active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Regresar
          </button>
          <h2 className="text-sm font-black text-slate-800 tracking-tight">Terrenos Disponibles</h2>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight mb-1">Terrenos y Desarrollos</h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Conoce nuestros proyectos de desarrollo disponibles. Agenda una cita con nuestro equipo para recibir información personalizada y asesoría sobre financiamiento.
            </p>
          </div>
        </div>

        {/* Desarrollos */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Desarrollos Disponibles</p>

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
              <p className="text-slate-400 font-bold text-sm">No hay desarrollos disponibles por el momento.</p>
              <p className="text-slate-300 text-xs mt-1">Vuelve pronto o contáctanos directamente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((dev) => (
                <div key={dev.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  {dev.imageUrl && (
                    <div className="w-full aspect-video rounded-xl overflow-hidden mb-3 bg-slate-50">
                      <img src={dev.imageUrl} alt={dev.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-black text-slate-800">{dev.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-[10px] text-slate-400 font-medium">{dev.location}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1 flex-shrink-0">{dev.price}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{dev.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => window.open(WHATSAPP_TERRENOS, '_blank')}
            className="w-full flex items-center justify-center gap-3 py-4 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-95"
            style={{ background: '#25d366', boxShadow: '0 8px 24px rgba(37,211,102,0.25)' }}
          >
            <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
            Agendar Cita por WhatsApp
          </button>

          <button
            onClick={() => window.open(INFO_URL_TERRENOS, '_blank')}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 font-black text-sm rounded-2xl transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver Más Información
          </button>
        </div>

        <p className="text-[10px] text-slate-300 text-center font-medium pb-8">
          Nuestro equipo te atenderá en horario de oficina. Los precios son referenciales y pueden variar.
        </p>
      </div>
    </div>
  );
};

export default TerrenosPage;
