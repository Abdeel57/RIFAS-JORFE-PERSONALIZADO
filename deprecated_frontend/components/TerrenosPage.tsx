import React from 'react';

// ── Configura estos valores según tu negocio ──────────────────────────────────
const WHATSAPP_TERRENOS = 'https://wa.me/XXXXXXXXXX?text=Hola%2C%20me%20interesa%20informaci%C3%B3n%20sobre%20los%20terrenos%20disponibles';
const INFO_URL_TERRENOS = 'https://PLACEHOLDER.com';

const DESARROLLOS = [
  {
    nombre: 'Desarrollo Ejemplo 1',
    ubicacion: 'Ciudad, Estado',
    descripcion: 'Descripción breve del desarrollo. Edita este texto con los detalles reales del proyecto.',
    precio: 'Desde $XXX,XXX MXN',
  },
  {
    nombre: 'Desarrollo Ejemplo 2',
    ubicacion: 'Ciudad, Estado',
    descripcion: 'Descripción breve del desarrollo. Edita este texto con los detalles reales del proyecto.',
    precio: 'Desde $XXX,XXX MXN',
  },
  {
    nombre: 'Desarrollo Ejemplo 3',
    ubicacion: 'Ciudad, Estado',
    descripcion: 'Descripción breve del desarrollo. Edita este texto con los detalles reales del proyecto.',
    precio: 'Desde $XXX,XXX MXN',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

const TerrenosPage: React.FC<Props> = ({ onBack }) => {
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
          <div className="space-y-3">
            {DESARROLLOS.map((dev, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-black text-slate-800">{dev.nombre}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-[10px] text-slate-400 font-medium">{dev.ubicacion}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1 flex-shrink-0">{dev.precio}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{dev.descripcion}</p>
              </div>
            ))}
          </div>
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
