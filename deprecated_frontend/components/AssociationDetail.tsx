import React from 'react';
import { Association } from '../types.ts';

interface Props {
  association: Association;
  onBack: () => void;
}

const AssociationDetail: React.FC<Props> = ({ association, onBack }) => {
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
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col items-center space-y-8">
        {/* Logo card */}
        <div className="w-32 h-32 rounded-3xl bg-white border border-slate-100 shadow-lg flex items-center justify-center overflow-hidden">
          <img
            src={association.logoUrl}
            alt={association.name}
            className="w-full h-full object-contain p-3"
          />
        </div>

        {/* Name */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{association.name}</h1>
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xs font-bold text-blue-500">Asociación verificada</p>
          </div>
        </div>

        {/* Description card */}
        <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Sobre esta asociación</p>
          <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{association.description}</p>
        </div>

        {/* CTA */}
        <a
          href={association.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
          </svg>
          Visitar sitio web oficial
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>

        {/* Footer note */}
        <p className="text-[10px] text-slate-300 text-center font-medium">
          Esta asociación apoya oficialmente la transparencia de nuestros sorteos.
        </p>
      </div>
    </div>
  );
};

export default AssociationDetail;
