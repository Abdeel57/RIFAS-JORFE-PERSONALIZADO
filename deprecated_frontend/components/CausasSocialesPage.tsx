import React, { useState, useEffect } from 'react';
import { Association } from '../types.ts';

async function fetchAssociations(): Promise<Association[]> {
  const urls = ['/api/associations', 'http://localhost:3001/api/associations'];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) return json.data;
    } catch { /* try next */ }
  }
  return [];
}

interface Props {
  onBack: () => void;
  onAssociationClick: (association: Association) => void;
}

const CausasSocialesPage: React.FC<Props> = ({ onBack, onAssociationClick }) => {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssociations().then(data => {
      setAssociations(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50/30">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-green-600 font-black text-sm transition-colors active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Regresar
          </button>
          <h2 className="text-sm font-black text-slate-800 tracking-tight">Causas Sociales</h2>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight mb-1">Causas Sociales</h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Parte de lo recaudado en cada sorteo apoya directamente a estas organizaciones. Al participar, contribuyes a causas que transforman vidas en nuestra comunidad.
            </p>
          </div>
        </div>

        {/* Associations list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                    <div className="h-2 bg-slate-100 rounded w-full" />
                    <div className="h-2 bg-slate-100 rounded w-4/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : associations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-slate-400 font-bold text-sm">No hay asociaciones registradas aún.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {associations.map(assoc => (
              <button
                key={assoc.id}
                onClick={() => onAssociationClick(assoc)}
                className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:border-green-100 transition-all active:scale-[0.99]"
              >
                <div className="w-14 h-14 rounded-xl border border-slate-100 bg-slate-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {assoc.logoUrl ? (
                    <img
                      src={assoc.logoUrl}
                      alt={assoc.name}
                      className="w-full h-full object-contain p-1"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-lg font-black text-slate-300">{assoc.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-800 truncate">{assoc.name}</p>
                  {assoc.description && (
                    <p className="text-xs text-slate-400 font-medium leading-relaxed mt-0.5 line-clamp-2">
                      {assoc.description}
                    </p>
                  )}
                </div>
                <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}

        <p className="text-[10px] text-slate-300 text-center font-medium pb-8">
          Toca una organización para conocer más sobre su misión e impacto social.
        </p>
      </div>
    </div>
  );
};

export default CausasSocialesPage;
