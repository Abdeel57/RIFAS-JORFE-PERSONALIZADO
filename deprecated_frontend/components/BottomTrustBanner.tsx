import React, { useState, useEffect } from 'react';
import { Association } from '../types.ts';

interface Props {
  onAssociationClick: (association: Association) => void;
}

const BADGE_DURATION = 3500;

/** Intenta cargar asociaciones desde la API, probando rutas relativas y absolutas */
async function fetchAssociations(): Promise<Association[]> {
  const urls = [
    '/api/associations',
    'http://localhost:3001/api/associations',
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const json = await res.json();
      if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    } catch {
      // siguiente URL
    }
  }
  return [];
}

const BottomTrustBanner: React.FC<Props> = ({ onAssociationClick }) => {
  const [phase, setPhase]           = useState<'badge' | 'out' | 'carousel'>('badge');
  const [associations, setAssociations] = useState<Association[]>([]);

  /* Fetch — independiente del timer */
  useEffect(() => {
    fetchAssociations().then(setAssociations);
  }, []);

  /* Timer — siempre arranca al montar */
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('out'),      BADGE_DURATION);
    const t2 = setTimeout(() => setPhase('carousel'), BADGE_DURATION + 420);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* Si el carrusel arranca y aún no hay datos, reintenta una vez */
  useEffect(() => {
    if (phase !== 'carousel' || associations.length > 0) return;
    fetchAssociations().then(setAssociations);
  }, [phase]);

  // Solo duplicar si hay suficientes logos para llenar el carrusel sin que se vean repetidos
  const SCROLL_THRESHOLD = 4; // mínimo de logos para activar el scroll infinito
  const useScroll = associations.length >= SCROLL_THRESHOLD;
  const items =
    associations.length === 0 ? [] :
    useScroll ? [...associations, ...associations] : associations;

  const dur = Math.max(10, associations.length * 5);

  /* Estilos de transición */
  // Badge: sale hacia abajo con fade y escala ligera
  const badgeStyle: React.CSSProperties = {
    opacity:    phase === 'badge' ? 1 : 0,
    transform:  phase === 'badge' ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.93)',
    transition: 'opacity 0.32s cubic-bezier(0.4,0,1,1), transform 0.32s cubic-bezier(0.4,0,1,1)',
    pointerEvents: phase === 'badge' ? 'auto' : 'none',
  };

  // Carrusel: entra desde abajo con resorte suave (ligero overshoot)
  const carouselStyle: React.CSSProperties = {
    opacity:    phase === 'carousel' ? 1 : 0,
    transform:  phase === 'carousel' ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.92)',
    transition: 'opacity 0.5s cubic-bezier(0.34,1.56,0.64,1), transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
    pointerEvents: phase === 'carousel' ? 'auto' : 'none',
  };

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 0, right: 0, zIndex: 60,
      display: 'flex', justifyContent: 'center',
      paddingLeft: 16, paddingRight: 16,
      pointerEvents: 'none',
    }}>

      {/* ── Badge "Sorteos Seguros" ── */}
      {phase !== 'carousel' && (
        <div style={{
          ...badgeStyle,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid #dbeafe', borderRadius: 9999,
          paddingLeft: 8, paddingRight: 20, paddingTop: 6, paddingBottom: 6,
          boxShadow: '0 4px 20px rgba(59,130,246,0.13)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37,99,235,0.28)',
          }}>
            <svg width="14" height="14" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <p style={{ margin:0, fontSize:11, fontWeight:900, color:'#1d4ed8', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>
              Éstos sorteos son seguros
            </p>
            <p style={{ margin:'3px 0 0', fontSize:9, fontWeight:700, color:'#93c5fd', whiteSpace:'nowrap' }}>
              Sorteos en base a la Lotería Nacional
            </p>
          </div>
        </div>
      )}

      {/* ── Carrusel ── (siempre renderiza en fase carousel; oculto si no hay datos) */}
      {phase === 'carousel' && (
        <div style={{
          ...carouselStyle,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid #dbeafe', borderRadius: 18,
          paddingLeft: 10, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
          boxShadow: '0 4px 20px rgba(59,130,246,0.13)',
          width: '100%', maxWidth: 320,
          // Si no hay datos todavía, el pill está invisible para no mostrar un pill vacío
          visibility: associations.length > 0 ? 'visible' : 'hidden',
        }}>

          {/* Ícono + label */}
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <div style={{
              width:24, height:24, borderRadius:'50%',
              background:'linear-gradient(135deg,#22c55e,#16a34a)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <svg width="11" height="11" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <p style={{ margin:0, fontSize:7, fontWeight:900, color:'#4ade80', textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>
              Nos apoyan
            </p>
          </div>

          {/* Divisor */}
          <div style={{ width:1, alignSelf:'stretch', background:'#dbeafe', flexShrink:0 }}/>

          {/* Logos */}
          <div style={{ flex:1, overflow:'hidden', position:'relative', minWidth:0 }}>
            <div style={{ position:'absolute', top:0, bottom:0, left:0, width:14, background:'linear-gradient(to right,rgba(255,255,255,0.95),transparent)', zIndex:1, pointerEvents:'none' }}/>
            <div style={{ position:'absolute', top:0, bottom:0, right:0, width:14, background:'linear-gradient(to left,rgba(255,255,255,0.95),transparent)', zIndex:1, pointerEvents:'none' }}/>

            <div style={{
              display:'flex', alignItems:'center', gap:10,
              width:'max-content',
              animation: useScroll ? `trust-marquee ${dur}s linear infinite` : 'none',
            }}>
              {items.map((assoc, idx) => (
                <button
                  key={`${assoc.id}-${idx}`}
                  onClick={() => onAssociationClick(assoc)}
                  title={assoc.name}
                  style={{ flexShrink:0, background:'none', border:'none', padding:0, cursor:'pointer' }}
                >
                  <img
                    src={assoc.logoUrl}
                    alt={assoc.name}
                    style={{ width:38, height:38, objectFit:'contain', display:'block' }}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes trust-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default BottomTrustBanner;
