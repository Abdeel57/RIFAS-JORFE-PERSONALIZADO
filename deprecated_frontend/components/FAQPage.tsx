import React, { useState } from 'react';

const FAQS = [
  {
    q: '¿Cómo funciona el sorteo?',
    a: 'Elige los números de boleto que deseas, realiza tu pago y recibirás un comprobante digital. El sorteo se realiza con base en el resultado oficial de la Lotería Nacional en la fecha indicada.',
  },
  {
    q: '¿Cómo sé si gané?',
    a: 'Puedes verificar tus boletos en la sección "Verificar" de nuestra página ingresando tu número de teléfono. También te notificaremos directamente por WhatsApp si resultaste ganador.',
  },
  {
    q: '¿Cuáles son los métodos de pago?',
    a: 'Aceptamos transferencia bancaria, depósito en efectivo, tarjeta de débito/crédito y pago en efectivo. Los detalles de pago se muestran al momento de proceder al checkout.',
  },
  {
    q: '¿Es seguro participar?',
    a: 'Sí. Todos nuestros sorteos están basados en el resultado oficial de la Lotería Nacional, lo que garantiza transparencia total e imparcialidad. Publicamos todos los resultados y comprobantes públicamente.',
  },
  {
    q: '¿Cómo recibo mi premio si gano?',
    a: 'El ganador es contactado directamente por WhatsApp para coordinar la entrega del premio. Se requiere identificación oficial al momento de la entrega.',
  },
  {
    q: '¿Puedo comprar boletos para otra persona?',
    a: 'Sí, puedes comprar boletos como regalo. Solo asegúrate de registrar los datos correctos al momento de la compra.',
  },
  {
    q: '¿Qué pasa si el sorteo se cancela o pospone?',
    a: 'En caso de cancelación definitiva, todos los pagos serán reembolsados en su totalidad. Si el sorteo se pospone, los boletos mantienen su validez para la nueva fecha.',
  },
  {
    q: '¿Cuándo se realizan los sorteos?',
    a: 'La fecha y hora exacta del sorteo se muestra en la página principal antes de que compres tu boleto. Siempre sabrás cuándo se realiza antes de participar.',
  },
  {
    q: '¿Cuántos boletos puedo comprar?',
    a: 'Puedes comprar todos los boletos que desees, sujeto a disponibilidad. No hay límite máximo por persona.',
  },
  {
    q: '¿Dónde puedo ver los resultados del sorteo?',
    a: 'Los resultados se publican en nuestra página y en nuestras redes sociales en cuanto se conocen. También puedes verificar en la sección "Verificar" de la página.',
  },
];

interface Props {
  onBack: () => void;
}

const FAQPage: React.FC<Props> = ({ onBack }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50/30">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-violet-600 font-black text-sm transition-colors active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Regresar
          </button>
          <h2 className="text-sm font-black text-slate-800 tracking-tight">Preguntas Frecuentes</h2>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight mb-1">Preguntas Frecuentes</h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Resolvemos tus dudas más comunes sobre cómo funcionan nuestros sorteos y cómo participar de forma segura.
            </p>
          </div>
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
              >
                <span className="text-sm font-black text-slate-800 leading-snug">{faq.q}</span>
                <svg
                  className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4 border-t border-slate-50">
                  <p className="text-sm text-slate-500 font-medium leading-relaxed pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-[10px] text-slate-300 text-center font-medium pb-8">
          ¿No encontraste tu respuesta? Contáctanos directamente por WhatsApp.
        </p>
      </div>
    </div>
  );
};

export default FAQPage;
