import React from 'react';

// ── Configura estos valores según tu negocio ──────────────────────────────────
const WHATSAPP_FINANCIAMIENTO = 'https://wa.me/XXXXXXXXXX?text=Hola%2C%20me%20interesa%20informaci%C3%B3n%20sobre%20financiamiento%20y%20carros%20seminuevos';
const CATALOGO_URL = 'https://PLACEHOLDER.com';

const OPCIONES = [
  {
    titulo: 'Financiamiento Vehicular',
    icono: '💳',
    descripcion: 'Obtén tu vehículo con pagos cómodos y tasas competitivas. Edita este texto con los planes de financiamiento disponibles.',
    detalle: 'Enganche desde XX% · Plazos hasta XX meses',
  },
  {
    titulo: 'Carros Seminuevos',
    icono: '🚗',
    descripcion: 'Selección de vehículos seminuevos en excelente estado, revisados y con garantía. Edita este texto con los modelos disponibles.',
    detalle: 'Modelos: Edita con tus vehículos disponibles',
  },
  {
    titulo: 'Asesoría Personalizada',
    icono: '🤝',
    descripcion: 'Nuestro equipo te ayuda a encontrar la opción que mejor se adapta a tu presupuesto y necesidades.',
    detalle: 'Atención personalizada sin costo',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

const FinanciamientoPage: React.FC<Props> = ({ onBack }) => {
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
          <h2 className="text-sm font-black text-slate-800 tracking-tight">Financiamiento y Carros</h2>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1.5 1M13 16l1.5-1M13 16H9m5-3h3l2 3" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight mb-1">Financiamiento y Carros Seminuevos</h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Accede a las mejores opciones de financiamiento vehicular y encuentra el carro seminuevo ideal para ti con planes a tu medida.
            </p>
          </div>
        </div>

        {/* Opciones */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Nuestras Opciones</p>
          <div className="space-y-3">
            {OPCIONES.map((op, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{op.icono}</span>
                  <p className="text-sm font-black text-slate-800">{op.titulo}</p>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-2">{op.descripcion}</p>
                <span className="inline-block text-[10px] font-black text-green-600 bg-green-50 border border-green-100 rounded-full px-2.5 py-1">{op.detalle}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => window.open(WHATSAPP_FINANCIAMIENTO, '_blank')}
            className="w-full flex items-center justify-center gap-3 py-4 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-95"
            style={{ background: '#25d366', boxShadow: '0 8px 24px rgba(37,211,102,0.25)' }}
          >
            <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
            Solicitar Información por WhatsApp
          </button>

          <button
            onClick={() => window.open(CATALOGO_URL, '_blank')}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-slate-200 text-slate-600 hover:text-green-600 hover:border-green-200 font-black text-sm rounded-2xl transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver Catálogo Completo
          </button>
        </div>

        <p className="text-[10px] text-slate-300 text-center font-medium pb-8">
          Sujeto a aprobación de crédito. Precios y disponibilidad pueden variar sin previo aviso.
        </p>
      </div>
    </div>
  );
};

export default FinanciamientoPage;
