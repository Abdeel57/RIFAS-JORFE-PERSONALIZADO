import React, { useState, useEffect } from 'react';
import { Association } from '../types.ts';

interface CommercialAlly {
  key: string;
  name: string;
  shortName: string;
  /** Deja vacío hasta integrar el logo real; muestra iniciales como placeholder */
  logoUrl: string;
  targetView: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  badgeLabel: string;
  sectionLabel: string;
}

// ── Aliados comerciales ────────────────────────────────────────────────────────
// Cuando tengas los logos reales, reemplaza logoUrl con la ruta o URL del archivo.
const COMMERCIAL_ALLIES: CommercialAlly[] = [
  {
    key: 'villas',
    name: 'Villas de Guadalupe',
    shortName: 'VG',
    logoUrl: '',
    targetView: 'terrenos',
    accentColor: '#16a34a',
    gradientFrom: '#bbf7d0',
    gradientTo: '#86efac',
    badgeLabel: 'Desarrollos',
    sectionLabel: 'Terrenos y desarrollos campestres',
  },
  {
    key: 'red',
    name: 'RED Autos',
    shortName: 'RA',
    logoUrl: '',
    targetView: 'seminuevos',
    accentColor: '#dc2626',
    gradientFrom: '#fecaca',
    gradientTo: '#fca5a5',
    badgeLabel: 'Seminuevos',
    sectionLabel: 'Vehículos seminuevos de calidad',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onAssociationClick: (association: Association) => void;
  onNavigate: (view: string) => void;
}

const BADGE_DURATION = 3500;

async function fetchAssociations(): Promise<Association[]> {
  const urls = ['/api/associations', 'http://localhost:3001/api/associations'];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const json = await res.json();
      if (json?.success && Array.isArray(json.data) && json.data.length > 0) return json.data;
    } catch { /* try next */ }
  }
  return [];
}

const BottomTrustBanner: React.FC<Props> = ({ onAssociationClick, onNavigate }) => {
  const [phase, setPhase] = useState<'badge' | 'out' | 'banner'>('badge');
  const [associations, setAssociations] = useState<Association[]>([]);

  useEffect(() => { fetchAssociations().then(setAssociations); }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('out'),    BADGE_DURATION);
    const t2 = setTimeout(() => setPhase('banner'), BADGE_DURATION + 420);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase !== 'banner' || associations.length > 0) return;
    fetchAssociations().then(setAssociations);
  }, [phase]);

  const SCROLL_THRESHOLD = 3;
  const useScroll = associations.length >= SCROLL_THRESHOLD;
  const items = associations.length === 0
    ? []
    : useScroll ? [...associations, ...associations] : associations;
  const dur = Math.max(14, associations.length * 5);

  const badgeStyle: React.CSSProperties = {
    opacity:    phase === 'badge' ? 1 : 0,
    transform:  phase === 'badge' ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.93)',
    transition: 'opacity 0.32s cubic-bezier(0.4,0,1,1), transform 0.32s cubic-bezier(0.4,0,1,1)',
    pointerEvents: phase === 'badge' ? 'auto' : 'none',
  };

  const bannerStyle: React.CSSProperties = {
    opacity:    phase === 'banner' ? 1 : 0,
    transform:  phase === 'banner' ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.96)',
    transition: 'opacity 0.55s cubic-bezier(0.34,1.4,0.64,1), transform 0.55s cubic-bezier(0.34,1.4,0.64,1)',
    pointerEvents: phase === 'banner' ? 'auto' : 'none',
  };

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 0, right: 0, zIndex: 60,
      display: 'flex', justifyContent: 'center',
      paddingLeft: 12, paddingRight: 12,
      pointerEvents: 'none',
    }}>

      {/* ── Badge "Sorteos Seguros" ── */}
      {phase !== 'banner' && (
        <div style={{
          ...badgeStyle,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid #dbeafe', borderRadius: 9999,
          paddingLeft: 8, paddingRight: 20, paddingTop: 7, paddingBottom: 7,
          boxShadow: '0 4px 24px rgba(59,130,246,0.15)',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(37,99,235,0.32)',
          }}>
            <svg width="14" height="14" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              Éstos sorteos son seguros
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 9, fontWeight: 700, color: '#93c5fd', whiteSpace: 'nowrap' }}>
              Sorteos en base a la Lotería Nacional
            </p>
          </div>
        </div>
      )}

      {/* ── Banner principal ── */}
      {phase === 'banner' && (
        <div
          className="trust-banner-root"
          style={{
            ...bannerStyle,
            width: '100%',
            maxWidth: 680,
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(203,213,225,0.6)',
            borderRadius: 22,
            boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >

          {/* ══════════════════════════════════════════
              BLOQUE 1 — ALIADOS COMERCIALES (protagonistas)
          ══════════════════════════════════════════ */}
          <div style={{ padding: '8px 10px 6px' }}>
            {/* Etiqueta de sección */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="9" height="9" fill="white" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: 8, fontWeight: 900, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Aliados Comerciales
              </p>
            </div>

            {/* Cards de aliados — dos columnas iguales */}
            <div style={{ display: 'flex', gap: 8 }}>
              {COMMERCIAL_ALLIES.map(ally => (
                <button
                  key={ally.key}
                  onClick={() => onNavigate(ally.targetView)}
                  className="trust-ally-card"
                  style={{
                    flex: 1,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 4,
                    background: `linear-gradient(160deg, ${ally.gradientFrom}30, white 60%)`,
                    border: `1.5px solid ${ally.accentColor}20`,
                    borderRadius: 12,
                    padding: '7px 6px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    boxShadow: `0 2px 8px ${ally.accentColor}15`,
                  }}
                >
                  {/* Acento de color en el borde superior */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${ally.gradientFrom}, ${ally.gradientTo}, ${ally.gradientFrom})`,
                  }} />

                  {/* Logo / placeholder */}
                  <div style={{
                    width: 40, height: 40,
                    borderRadius: 10,
                    background: ally.logoUrl ? 'white' : `linear-gradient(135deg, ${ally.gradientFrom}, ${ally.gradientTo})`,
                    border: ally.logoUrl ? `1.5px solid ${ally.accentColor}20` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                  }}>
                    {ally.logoUrl ? (
                      <img
                        src={ally.logoUrl}
                        alt={ally.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        loading="lazy"
                      />
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
                        {ally.shortName}
                      </span>
                    )}
                  </div>

                  {/* Nombre */}
                  <p style={{
                    margin: 0, fontSize: 9, fontWeight: 900,
                    color: '#1e293b', textAlign: 'center', lineHeight: 1.25,
                    letterSpacing: '-0.01em',
                  }}>
                    {ally.name}
                  </p>

                  {/* Badge categoría */}
                  <span style={{
                    fontSize: 7, fontWeight: 900,
                    color: ally.accentColor,
                    background: `${ally.accentColor}12`,
                    border: `1px solid ${ally.accentColor}25`,
                    borderRadius: 5,
                    padding: '1px 6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}>
                    {ally.badgeLabel}
                  </span>

                  {/* Flecha "ir a sección" */}
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 14, height: 14, borderRadius: '50%',
                    background: `${ally.accentColor}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="7" height="7" fill="none" stroke={ally.accentColor} viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Separador */}
          <div style={{ height: 1, background: '#f1f5f9', marginLeft: 10, marginRight: 10 }} />

          {/* ══════════════════════════════════════════
              BLOQUE 2 — ASOCIACIONES CIVILES (socios)
          ══════════════════════════════════════════ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px 11px' }}>
            {/* Ícono + etiqueta */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(22,163,74,0.3)',
              }}>
                <svg width="10" height="10" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p style={{
                margin: 0, fontSize: 7.5, fontWeight: 900, color: '#16a34a',
                textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
              }}>
                Nos apoyan
              </p>
            </div>

            {/* Divisor */}
            <div style={{ width: 1, alignSelf: 'stretch', background: '#e2e8f0', flexShrink: 0 }} />

            {/* Carrusel de logos */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minWidth: 0 }}>
              {/* Fades laterales */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 14, background: 'linear-gradient(to right,rgba(255,255,255,0.97),transparent)', zIndex: 1, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 14, background: 'linear-gradient(to left,rgba(255,255,255,0.97),transparent)', zIndex: 1, pointerEvents: 'none' }} />

              {associations.length === 0 ? (
                <div style={{ display: 'flex', gap: 8, paddingLeft: 8 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9', flexShrink: 0 }} />
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: 'max-content',
                  animation: useScroll ? `trust-marquee ${dur}s linear infinite` : 'none',
                }}>
                  {items.map((assoc, idx) => (
                    <button
                      key={`${assoc.id}-${idx}`}
                      onClick={() => onAssociationClick(assoc)}
                      title={assoc.name}
                      style={{
                        flexShrink: 0, background: 'none', border: 'none',
                        padding: 0, cursor: 'pointer', borderRadius: 8,
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={assoc.logoUrl}
                        alt={assoc.name}
                        style={{ width: 44, height: 44, objectFit: 'contain', display: 'block' }}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      <style>{`
        @keyframes trust-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .trust-ally-card:active {
          transform: scale(0.96);
          box-shadow: none !important;
        }
        @media (hover: hover) {
          .trust-ally-card:hover {
            transform: scale(1.02);
            box-shadow: 0 6px 20px rgba(0,0,0,0.12) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BottomTrustBanner;
