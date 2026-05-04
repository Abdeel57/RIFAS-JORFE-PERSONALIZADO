import React, { useState, useEffect } from 'react';

interface Faq {
  id: string;
  question: string;
  answer: string;
}

const FALLBACK_FAQS: Faq[] = [
  { id: 'fb-1', question: '¿Cómo funciona el sorteo?', answer: 'Elige los números de boleto que deseas, realiza tu pago y recibirás un comprobante digital. El sorteo se realiza con base en el resultado oficial de la Lotería Nacional.' },
  { id: 'fb-2', question: '¿Cómo sé si gané?', answer: 'Puedes verificar tus boletos en la sección "Verificar". También te notificaremos directamente por WhatsApp si resultaste ganador.' },
  { id: 'fb-3', question: '¿Es seguro participar?', answer: 'Sí. Todos nuestros sorteos están basados en el resultado oficial de la Lotería Nacional, garantizando transparencia total.' },
];

async function fetchFaqs(): Promise<Faq[] | null> {
  const urls = ['/api/faqs', 'http://localhost:3001/api/faqs'];
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

const FAQPage: React.FC<Props> = ({ onBack }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [items, setItems] = useState<Faq[] | null>(null);

  useEffect(() => {
    fetchFaqs().then(data => {
      setItems(data === null ? FALLBACK_FAQS : data);
    });
  }, []);

  const loading = items === null;

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
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
                <div className="h-3 bg-slate-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <p className="text-slate-400 font-bold text-sm">Aún no hay preguntas configuradas.</p>
            <p className="text-slate-300 text-xs mt-1">Contáctanos directamente por WhatsApp si tienes dudas.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((faq, i) => (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <span className="text-sm font-black text-slate-800 leading-snug">{faq.question}</span>
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
                    <p className="text-sm text-slate-500 font-medium leading-relaxed pt-3 whitespace-pre-line">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-slate-300 text-center font-medium pb-8">
          ¿No encontraste tu respuesta? Contáctanos directamente por WhatsApp.
        </p>
      </div>
    </div>
  );
};

export default FAQPage;
