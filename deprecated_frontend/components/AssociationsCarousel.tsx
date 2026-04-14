import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService.ts';
import { Association } from '../types.ts';

interface Props {
  onAssociationClick: (association: Association) => void;
}

const AssociationsCarousel: React.FC<Props> = ({ onAssociationClick }) => {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getAssociations()
      .then((data: Association[]) => setAssociations(data || []))
      .catch(() => setAssociations([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || associations.length === 0) return null;

  // Duplicar items para el loop infinito
  const items = associations.length < 4
    ? [...associations, ...associations, ...associations]
    : [...associations, ...associations];

  return (
    <div className="w-full py-6 border-t border-slate-100">
      <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.25em] mb-4">
        Asociaciones que nos apoyan
      </p>

      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div
          className="flex gap-5 w-max"
          style={{
            animation: `assoc-marquee ${Math.max(15, associations.length * 5)}s linear infinite`,
          }}
        >
          {items.map((assoc, idx) => (
            <button
              key={`${assoc.id}-${idx}`}
              onClick={() => onAssociationClick(assoc)}
              className="flex-shrink-0 group"
              title={assoc.name}
            >
              <div className="w-16 h-16 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:shadow-md group-hover:border-blue-100 group-hover:scale-105 group-active:scale-95">
                <img
                  src={assoc.logoUrl}
                  alt={assoc.name}
                  className="w-full h-full object-contain p-1.5"
                  loading="lazy"
                />
              </div>
              <p className="text-[9px] font-black text-slate-400 text-center mt-1.5 leading-tight max-w-[64px] truncate group-hover:text-blue-500 transition-colors">
                {assoc.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes assoc-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default AssociationsCarousel;
