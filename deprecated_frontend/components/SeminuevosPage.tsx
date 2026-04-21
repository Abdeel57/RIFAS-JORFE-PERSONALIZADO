import React from 'react';

const WHATSAPP_SEMINUEVOS = 'https://wa.me/XXXXXXXXXX?text=Hola%2C%20me%20interesa%20informaci%C3%B3n%20sobre%20los%20veh%C3%ADculos%20seminuevos%20disponibles';
const INFO_URL_SEMINUEVOS = 'https://PLACEHOLDER.com';

const VEHICULOS = [
  {
    nombre: 'Vehículo Ejemplo 1',
    modelo: '20XX',
    descripcion: 'Descripción breve del vehículo. Edita este texto con los detalles reales del auto disponible.',
    precio: 'Desde $XXX,XXX MXN',
    km: 'X,XXX km',
  },
  {
    nombre: 'Vehículo Ejemplo 2',
    modelo: '20XX',
    descripcion: 'Descripción breve del vehículo. Edita este texto con los detalles reales del auto disponible.',
    precio: 'Desde $XXX,XXX MXN',
    km: 'XX,XXX km',
  },
  {
    nombre: 'Vehículo Ejemplo 3',
    modelo: '20XX',
    descripcion: 'Descripción breve del vehículo. Edita este texto con los detalles reales del auto disponible.',
    precio: 'Desde $XXX,XXX MXN',
    km: 'XX,XXX km',
  },
];

interface Props {
  onBack: () => void;
}

const SeminuevosPage: React.FC<Props> = ({ onBack }) => {
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
          <div className="space-y-3">
            {VEHICULOS.map((v, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-black text-slate-800">{v.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium">{v.modelo}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                      <span className="text-[10px] text-slate-400 font-medium">{v.km}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1 flex-shrink-0">
                    {v.precio}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{v.descripcion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => window.open(WHATSAPP_SEMINUEVOS, '_blank')}
            className="w-full flex items-center justify-center gap-3 py-4 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-95"
            style={{ background: '#25d366', boxShadow: '0 8px 24px rgba(37,211,102,0.25)' }}
          >
            <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
            Consultar por WhatsApp
          </button>

          <button
            onClick={() => window.open(INFO_URL_SEMINUEVOS, '_blank')}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-200 font-black text-sm rounded-2xl transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver Más Información
          </button>
        </div>

        <p className="text-[10px] text-slate-300 text-center font-medium pb-8">
          Precios sujetos a cambio. Todos los vehículos son inspeccionados antes de su venta.
        </p>
      </div>
    </div>
  );
};

export default SeminuevosPage;
