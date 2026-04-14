import React, { useState } from 'react';

// ── Configura estos valores según tu negocio ──────────────────────────────────
const WHATSAPP_CONTACTO = 'https://wa.me/XXXXXXXXXX?text=Hola%2C%20me%20interesa%20ser%20aliado%20comercial%20en%20los%20sorteos';
const EMAIL_CONTACTO = 'contacto@PLACEHOLDER.com';
const TELEFONO_DISPLAY = '+52 XXX-XXX-XXXX';
const HORARIO = 'Lunes a Viernes: 9:00 am – 6:00 pm';

const FAQS = [
  {
    pregunta: '¿Cómo puedo ser aliado comercial?',
    respuesta: 'Para ser aliado comercial, contáctanos por WhatsApp o correo electrónico. Nuestro equipo te explicará los beneficios y el proceso para asociarte con nosotros en las próximas ediciones del sorteo.',
  },
  {
    pregunta: '¿Qué beneficios tiene patrocinar un sorteo?',
    respuesta: 'Al patrocinar nuestros sorteos obtienes visibilidad de tu marca ante miles de participantes, presencia en redes sociales, mención en comunicados oficiales y la posibilidad de incluir tu logo en materiales promocionales.',
  },
  {
    pregunta: '¿Cuáles son los requisitos para asociarse?',
    respuesta: 'Los requisitos básicos incluyen: empresa o negocio legalmente constituido, proporcionar información de contacto y redes sociales, y firmar un acuerdo de participación. Contáctanos para conocer los detalles completos.',
  },
  {
    pregunta: '¿Cómo se distribuye la publicidad entre los aliados?',
    respuesta: 'Cada aliado recibe menciones proporcionales al nivel de participación. Los logos aparecen en el carrusel de la plataforma y en comunicados del sorteo. Los detalles específicos se definen en el acuerdo de alianza.',
  },
  {
    pregunta: '¿Cuál es el proceso para asociarse?',
    respuesta: '1. Contáctanos por WhatsApp o correo. 2. Revisamos tu propuesta. 3. Coordinamos una llamada o reunión. 4. Firmamos el acuerdo de participación. 5. Tu logo aparece en el próximo sorteo.',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

const ContactoPage: React.FC<Props> = ({ onBack }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
          <h2 className="text-sm font-black text-slate-800 tracking-tight">Contacto y FAQ</h2>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 3H3l2 16h14L21 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight mb-1">Aliados Comerciales</h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              ¿Quieres que tu marca aparezca en nuestros sorteos? Aquí encuentras todo lo que necesitas saber para ser parte de nuestra red de aliados.
            </p>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Preguntas Frecuentes</p>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <p className="text-sm font-black text-slate-700 leading-snug">{faq.pregunta}</p>
                  <svg
                    className="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200"
                    style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 border-t border-slate-50">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pt-3">{faq.respuesta}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info de contacto */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información de Contacto</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-600">{TELEFONO_DISPLAY}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-600">{EMAIL_CONTACTO}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-600">{HORARIO}</p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => window.open(WHATSAPP_CONTACTO, '_blank')}
            className="w-full flex items-center justify-center gap-3 py-4 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-95"
            style={{ background: '#25d366', boxShadow: '0 8px 24px rgba(37,211,102,0.25)' }}
          >
            <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
            Contactar por WhatsApp
          </button>

          <a
            href={`mailto:${EMAIL_CONTACTO}`}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-slate-200 text-slate-600 hover:text-purple-600 hover:border-purple-200 font-black text-sm rounded-2xl transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Enviar Correo Electrónico
          </a>
        </div>

        <p className="text-[10px] text-slate-300 text-center font-medium pb-8">
          Respondemos todas las consultas dentro de las 24 horas hábiles.
        </p>
      </div>
    </div>
  );
};

export default ContactoPage;
