
import React, { useState, useEffect, useCallback } from 'react';
import { FEATURED_RAFFLE, CONTACT_INFO, FALLBACK_RAFFLE_ID } from './constants.ts';
import TicketSelector from './components/TicketSelector.tsx';
import RaffleDetails from './components/RaffleDetails.tsx';
import CheckoutModal from './components/CheckoutModal.tsx';
import VerifyTickets from './components/VerifyTickets.tsx';
import TermsAndConditions from './components/TermsAndConditions.tsx';
import SupportChat from './components/SupportChat.tsx';
import ComprobanteDigital from './components/ComprobanteDigital.tsx';
import { RaffleSkeleton, TicketSkeleton } from './components/SkeletonLoader.tsx';
import { soundService } from './services/soundService.ts';
import { apiService } from './services/apiService.ts';
import { pixelService } from './services/pixelService.ts';
import { Raffle } from './types.ts';

interface BrandSettings {
  siteName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  facebookUrl: string;
  logoSize: number;
}

const DEFAULT_BRAND: BrandSettings = {
  siteName: 'Bismark',
  logoUrl: '',
  primaryColor: '#3b82f6',
  secondaryColor: '#6366f1',
  facebookUrl: '',
  logoSize: 44,
};

// Tamaño de fuente adaptativo para el header según longitud del nombre
function headerNameSize(name: string): string {
  const n = name.length;
  if (n <= 10) return 'text-sm md:text-lg';
  if (n <= 16) return 'text-xs md:text-sm';
  if (n <= 22) return 'text-[10px] md:text-xs';
  return 'text-[9px] md:text-[10px]';
}

// Tamaño adaptativo para el footer
function footerNameSize(name: string): string {
  const n = name.length;
  if (n <= 10) return 'text-xl';
  if (n <= 16) return 'text-lg';
  if (n <= 22) return 'text-base';
  return 'text-sm';
}

function applyBrandCssVars(brand: BrandSettings) {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', brand.primaryColor);
  root.style.setProperty('--brand-secondary', brand.secondaryColor);
  // RGB descompuesto para usar en rgba(var(--brand-primary-rgb), 0.x)
  const hex = brand.primaryColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  root.style.setProperty('--brand-primary-rgb', `${r}, ${g}, ${b}`);
}

function getComprobantePurchaseId(): string | null {
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  if (!hash.startsWith('#comprobante')) return null;
  const qs = hash.split('?')[1] || '';
  return new URLSearchParams(qs).get('purchase');
}

const App: React.FC = () => {
  const [comprobantePurchaseId, setComprobantePurchaseId] = useState<string | null>(() => getComprobantePurchaseId());
  const [activeView, setActiveView] = useState<'raffle' | 'verify' | 'terms'>('raffle');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [refreshTicketsAt, setRefreshTicketsAt] = useState<number>(0);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [selectedTicketsToBuy, setSelectedTicketsToBuy] = useState<number[]>([]);
  const [overrideTotal, setOverrideTotal] = useState<number | undefined>(undefined);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [featuredRaffle, setFeaturedRaffle] = useState<Raffle | null>(null);
  const [activeRaffles, setActiveRaffles] = useState<Raffle[]>([]);
  const [isRaffleDropdownOpen, setIsRaffleDropdownOpen] = useState(false);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  // rawSettings: se pasa al CheckoutModal para evitar que haga su propio fetch (doble petición)
  const [rawSettings, setRawSettings] = useState<any>(null);

  const raffleDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onHashChange = () => {
      setComprobantePurchaseId(getComprobantePurchaseId());
      if (window.location.hash === '#verify') setActiveView('verify');
    };
    if (window.location.hash === '#verify') setActiveView('verify');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (raffleDropdownRef.current && !raffleDropdownRef.current.contains(event.target as Node)) {
        setIsRaffleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load brand settings (logo + colors) from the backend
  useEffect(() => {
    applyBrandCssVars(DEFAULT_BRAND);
    apiService.getSettings()
      .then((data: any) => {
        if (data) {
          const b: BrandSettings = {
            siteName: data.siteName || DEFAULT_BRAND.siteName,
            logoUrl: data.logoUrl || '',
            primaryColor: data.primaryColor || DEFAULT_BRAND.primaryColor,
            secondaryColor: data.secondaryColor || DEFAULT_BRAND.secondaryColor,
            facebookUrl: data.facebookUrl || '',
            logoSize: typeof data.logoSize === 'number' ? data.logoSize : DEFAULT_BRAND.logoSize,
          };
          setBrand(b);
          applyBrandCssVars(b);
          // Guardamos rawSettings para pasarlos al CheckoutModal (evita doble fetch)
          setRawSettings(data);

          // ACTUALIZAR METADATOS DEL NAVEGADOR
          // 1. Título de la pestaña
          document.title = b.siteName;

          // 2. Favicon (Ícono de la pestaña)
          if (b.logoUrl) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = b.logoUrl;
          }
          // Inicializar Pixel si está configurado
          if (data.facebookPixelId) {
            pixelService.init(data.facebookPixelId);
          }
        }
      })
      .catch(() => {/* fallback to defaults silently */ });
  }, []);

  // Rastrear PageView al cambiar de vista
  useEffect(() => {
    pixelService.track('PageView');
  }, [activeView]);

  // Rastrear ViewContent cuando se selecciona una rifa
  useEffect(() => {
    if (featuredRaffle && activeView === 'raffle') {
      pixelService.trackViewContent(featuredRaffle);
    }
  }, [featuredRaffle, activeView]);

  // Carga ultra-rápida: Solo la rifa principal al inicio
  useEffect(() => {
    const loadMainContent = async () => {
      try {
        // Primero cargamos todas para saber cuál es la principal y mostrar la UI base
        const raffles = await apiService.getRaffles('active');
        if (raffles && raffles.length > 0) {
          const main = raffles[0] as Raffle;
          setFeaturedRaffle(main);
          setActiveRaffles(raffles as Raffle[]);

          // LA CLAVE: Liberamos la carga visual de inmediato
          setIsAppLoading(false);

          // Postergamos la carga de datos pesados (como otras rifas o estados de boletos)
          // para que el resto de la página cargue fluido
        } else {
          setFeaturedRaffle(FEATURED_RAFFLE);
          setActiveRaffles([FEATURED_RAFFLE as Raffle]);
          setIsAppLoading(false);
        }
      } catch (error) {
        setFeaturedRaffle(FEATURED_RAFFLE);
        setActiveRaffles([FEATURED_RAFFLE as Raffle]);
        setIsAppLoading(false);
      }
    };
    loadMainContent();
  }, []);

  // Postergamos la aparición de la boletera para que el scroll inicial sea fluido
  const [showTickets, setShowTickets] = useState(false);
  useEffect(() => {
    if (!isAppLoading) {
      const timer = setTimeout(() => setShowTickets(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isAppLoading]);

  // Lock body scroll when any modal is open (iOS-safe: stores scroll position)
  useEffect(() => {
    const shouldLock = isCheckoutOpen || isSupportChatOpen;
    if (!shouldLock) return;

    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
    };
  }, [isCheckoutOpen, isSupportChatOpen]);

  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    soundService.setMute(newMute);
  };

  const handleCheckout = useCallback((tickets: number[], effectiveTotal?: number) => {
    setSelectedTicketsToBuy(tickets);
    setOverrideTotal(effectiveTotal);
    setIsCheckoutOpen(true);
  }, []);

  const handleViewChange = (view: 'raffle' | 'verify' | 'terms') => {
    if (view === activeView) return;
    window.scrollTo({ top: 0, behavior: 'instant' as any });
    setActiveView(view);
  };

  const handleCloseComprobante = () => {
    setComprobantePurchaseId(null);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  if (comprobantePurchaseId) {
    return (
      <ComprobanteDigital
        purchaseId={comprobantePurchaseId}
        onClose={handleCloseComprobante}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 scroll-smooth antialiased">
      {/* ── Navbar "Liquid Glass" ────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 px-3 py-3 md:px-4 md:py-5 flex justify-center pointer-events-none">
        <nav
          className="pointer-events-auto relative w-full max-w-2xl bg-white/55 backdrop-blur-[20px] border border-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-2xl md:rounded-[2rem] h-14 md:h-16 overflow-visible"
          style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', alignItems: 'center', gap: 0, paddingLeft: 6, paddingRight: 12 }}
        >
          {/* Glassmorphism inner gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-white/10 pointer-events-none rounded-2xl md:rounded-[2rem]" />

          {/*
            ╔══════════════════════════════════════════════════════════╗
            ║  BADGE VERIFICADO — POSICIÓN 100% FIJA                  ║
            ║  Hijo directo del <nav>, position:absolute               ║
            ║  Coordenadas en píxeles duros: top:5 left:40            ║
            ║  No tiene relación con el logo ni con nada más          ║
            ║  Nunca se moverá sin importar logoSize, nombre, etc.    ║
            ╚══════════════════════════════════════════════════════════╝
          */}
          <div
            className="absolute bg-[#1877F2] border-2 border-white rounded-full flex items-center justify-center shadow-sm pointer-events-none"
            style={{ width: 14, height: 14, top: 5, left: 40, zIndex: 50 }}
          >
            <svg width="8" height="8" viewBox="0 0 12 12" fill="white">
              <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
            </svg>
          </div>

          {/* ── COLUMNA IZQUIERDA: Logo (absolute) + Nombre ── */}
          <div
            className="relative flex items-center z-10 cursor-pointer group min-w-0"
            style={{ paddingLeft: 50 }}
            onClick={() => handleViewChange('raffle')}
          >
            {/* Logo: position:absolute, centrado verticalmente, escala libre */}
            <div
              className="absolute flex items-center justify-center"
              style={{ left: 0, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, overflow: 'visible', zIndex: 10 }}
            >
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt="Logo"
                  className="object-contain drop-shadow-sm transform group-hover:scale-105 transition-transform duration-300"
                  style={{ position: 'absolute', width: brand.logoSize, height: brand.logoSize, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                />
              ) : (
                <div
                  className="rounded-xl flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform duration-300"
                  style={{ position: 'absolute', width: brand.logoSize, height: brand.logoSize, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: `linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))` }}
                >
                  <span className="text-white font-black text-lg italic">N</span>
                </div>
              )}
            </div>

            {/* Nombre: hasta 2 líneas, empuja el menú */}
            <div className="flex flex-col" style={{ paddingRight: 8 }}>
              <span
                className="font-black tracking-tight text-slate-800 leading-tight"
                style={{
                  fontSize: brand.siteName.length <= 8 ? 14 : brand.siteName.length <= 14 ? 12 : 10,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                }}
              >
                {brand.siteName}
              </span>
              <span className="font-bold uppercase leading-none mt-0.5 hidden md:block tracking-widest" style={{ fontSize: 7, color: 'var(--brand-primary)', whiteSpace: 'nowrap' }}>
                Sorteos Certificados
              </span>
            </div>
          </div>


          {/* ── COLUMNA CENTRAL (auto): Botones de navegación ──────── */}
          <div className="relative flex bg-white/50 p-0.5 rounded-xl border border-white/80 z-10 shadow-inner">
            <div className="relative" ref={raffleDropdownRef}>
              <button
                onClick={() => {
                  if (activeRaffles.length > 1) {
                    setIsRaffleDropdownOpen(!isRaffleDropdownOpen);
                  } else {
                    handleViewChange('raffle');
                  }
                }}
                className={`px-3 md:px-5 py-1.5 rounded-[10px] text-[9px] md:text-[10px] font-black transition-all duration-200 uppercase tracking-widest flex items-center gap-1.5 ${activeView === 'raffle' ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                style={activeView === 'raffle' ? { color: 'var(--brand-primary)' } : {}}
              >
                Sorteo
                {activeRaffles.length > 1 && (
                  <svg
                    className={`w-2.5 h-2.5 transition-transform duration-300 ${isRaffleDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {/* Menú Desplegable de Rifas */}
              {isRaffleDropdownOpen && activeRaffles.length > 1 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 md:w-56 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-2xl py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 mb-1 border-b border-slate-50">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sorteos Activos</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar-light">
                    {activeRaffles.map((raffle) => (
                      <button
                        key={raffle.id}
                        onClick={() => {
                          setFeaturedRaffle(raffle);
                          handleViewChange('raffle');
                          setIsRaffleDropdownOpen(false);
                          window.scrollTo({ top: 0, behavior: 'instant' as any });
                        }}
                        className={`w-full text-left px-4 py-2.5 transition-all flex flex-col gap-0.5 hover:bg-slate-50 ${featuredRaffle?.id === raffle.id ? 'bg-blue-50/50' : ''}`}
                      >
                        <span className={`text-[10px] font-black tracking-tight ${featuredRaffle?.id === raffle.id ? 'text-blue-600' : 'text-slate-700'}`}>
                          {raffle.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">${raffle.ticketPrice} por boleto</span>
                          {featuredRaffle?.id === raffle.id && (
                            <span className="w-1 h-1 rounded-full bg-blue-600"></span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => handleViewChange('verify')}
              className={`px-3 md:px-5 py-1.5 rounded-[10px] text-[9px] md:text-[10px] font-black transition-all duration-200 uppercase tracking-widest ${activeView === 'verify' ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
              style={activeView === 'verify' ? { color: 'var(--brand-primary)' } : {}}
            >
              Verificar
            </button>
          </div>

          {/* ── COLUMNA DERECHA (1fr): Botón de sonido ─────────────── */}
          <div className="flex items-center justify-end z-10">
            <button
              onClick={toggleMute}
              className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl border transition-all active:scale-90 ${isMuted ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-white shadow-sm'}`}
              style={!isMuted ? { color: 'var(--brand-primary)' } : {}}
              title={isMuted ? 'Activar Sonido' : 'Silenciar Sonido'}
            >
              {isMuted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11.707 5.293L7 10H4a1 1 0 00-1 1v2a1 1 0 001 1h3l4.707 4.707A1 1 0 0013 18V6a1 1 0 00-1.293-.707z" /></svg>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* ── PROMO BANNER (sticky, below navbar) ── */}
      {activeView === 'raffle' && featuredRaffle && featuredRaffle.promoTitle && !isCheckoutOpen && !isSupportChatOpen && (
        <>
          <style>{`
            @keyframes promo-shimmer {
              0%   { transform: translateX(-120%) skewX(-12deg); }
              100% { transform: translateX(300%) skewX(-12deg); }
            }
            @keyframes promo-breathe {
              0%, 100% { opacity: 1; }
              50%       { opacity: 0.9; }
            }
            @keyframes promo-enter {
              from { opacity: 0; transform: translateY(-10px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          <div
            className="fixed left-0 right-0 z-40 px-3 md:px-6"
            style={{
              top: '74px',
              animation: 'promo-enter 0.4s cubic-bezier(0.34,1.35,0.64,1) both',
            }}
          >
            <div
              className="overflow-hidden shadow-lg shadow-orange-900/20"
              style={{ borderRadius: '1.25rem' }}
            >
              {/* ── gradient title bar ── */}
              <div
                style={{
                  background: 'linear-gradient(108deg,#c2410c 0%,#ea580c 20%,#ef4444 55%,#dc2626 80%,#991b1b 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: 'promo-breathe 3s ease-in-out infinite',
                }}
              >
                {/* shimmer sweep */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  width: '30%',
                  background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)',
                  animation: 'promo-shimmer 3s ease-in-out infinite',
                  pointerEvents: 'none',
                }} />

                {/* top highlight */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: 'rgba(255,255,255,0.3)',
                  pointerEvents: 'none',
                }} />

                <div className="relative flex items-center justify-center px-4 py-2 md:py-2.5">
                  <span
                    className="font-black text-white text-center leading-tight"
                    style={{
                      fontSize: 'clamp(11px, 3.5vw, 14px)',
                      letterSpacing: '0.03em',
                      textShadow: '0 1px 8px rgba(0,0,0,0.35)',
                    }}
                  >
                    {featuredRaffle.promoTitle}
                  </span>
                </div>
              </div>

              {/* ── frosted description strip ── */}
              {featuredRaffle.promoDescription && (
                <div
                  style={{
                    background: 'rgba(100,10,10,0.72)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderTop: '1px solid rgba(255,120,100,0.15)',
                  }}
                  className="px-4 py-1.5 md:py-2"
                >
                  <p
                    className="text-white/90 text-center font-semibold leading-snug"
                    style={{ fontSize: 'clamp(10px, 2.8vw, 13px)', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
                  >
                    {featuredRaffle.promoDescription}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Dynamic spacer: taller when promo is shown */}
      <div className={activeView === 'raffle' && featuredRaffle && featuredRaffle.promoTitle && !isCheckoutOpen && !isSupportChatOpen
        ? [featuredRaffle.promoDescription ? 'h-36 md:h-44' : 'h-28 md:h-36'].join(' ')
        : 'h-20 md:h-28'
      } />


      <main className="flex-grow max-w-7xl mx-auto px-4 py-6 md:py-10 w-full">
        {activeView === 'raffle' ? (
          <div className="space-y-12">
            {isAppLoading ? (
              <div className="animate-in fade-in duration-300">
                <RaffleSkeleton />
                <TicketSkeleton />
              </div>
            ) : (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {featuredRaffle?.id === FALLBACK_RAFFLE_ID && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-bold text-amber-800 text-sm">Sin conexión con el servidor</p>
                      <p className="text-amber-700 text-xs mt-0.5">Estás viendo una vista de demostración. Recarga la página para cargar rifas reales y poder comprar boletos.</p>
                    </div>
                  </div>
                )}
                {featuredRaffle ? (
                  <>
                    <div className="text-center max-w-4xl mx-auto space-y-3 mb-8">
                      <div className="inline-block px-4 py-1.5 bg-white shadow-sm border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--brand-primary)' }}>
                        Edición Especial
                      </div>
                      <h1 className="text-4xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                        {featuredRaffle.title}
                      </h1>
                      <h2 className="text-slate-400 text-base md:text-xl font-medium max-w-2xl mx-auto mt-4">
                        {featuredRaffle.subtitle}
                      </h2>
                    </div>

                    <div className="relative rounded-[3rem] overflow-hidden shadow-[0_30px_70px_-15px_rgba(0,0,0,0.1)] bg-white border-[6px] border-white group will-change-transform aspect-square">
                      <img
                        src={featuredRaffle.prizeImage}
                        alt={featuredRaffle.title}
                        className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-[1.015] transition-transform duration-1000"
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                      {/* Price pill — small, inside image at bottom-center */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-in slide-in-from-bottom-2 duration-500 delay-300">
                        <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-full px-3 py-1.5 flex items-center gap-2">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">Boleto</span>
                          <span className="w-px h-2.5 bg-slate-200 inline-block" />
                          <span className="text-sm font-black tracking-tighter leading-none" style={{ color: 'var(--brand-primary)' }}>
                            ${featuredRaffle.ticketPrice}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative pt-4 overflow-hidden min-h-[400px]">
                      {showTickets ? (
                        <TicketSelector
                          key={featuredRaffle.id}
                          raffleId={featuredRaffle.id}
                          totalTickets={featuredRaffle.totalTickets}
                          pricePerTicket={featuredRaffle.ticketPrice}
                          onCheckout={handleCheckout}
                          refreshTrigger={refreshTicketsAt}
                          isVirtual={featuredRaffle.isVirtual}
                          luckyNumbers={featuredRaffle.luckyMachineNumbers}
                          promoTiers={featuredRaffle.promoTiers}
                        />
                      ) : (
                        <div className="w-full bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center p-20 text-center animate-pulse">
                          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Preparando boletera...</p>
                        </div>
                      )}
                    </div>

                    <RaffleDetails raffle={featuredRaffle} onOpenSupport={() => setIsSupportChatOpen(true)} facebookUrl={brand.facebookUrl} siteName={brand.siteName} logoUrl={brand.logoUrl} />
                  </>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-slate-400">No hay rifas disponibles en este momento.</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col items-center justify-center pt-3 pb-4 border-t border-slate-100">
              <button
                onClick={() => handleViewChange('terms')}
                className="group flex items-center gap-3 text-slate-400 hover:text-blue-600 transition-all duration-300 py-2"
              >
                <span className="w-8 h-[1px] bg-slate-200 group-hover:bg-blue-200 transition-colors"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Términos y Condiciones</span>
                <span className="w-8 h-[1px] bg-slate-200 group-hover:bg-blue-200 transition-colors"></span>
              </button>
              <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-3">Al participar aceptas nuestras políticas de legalidad.</p>
            </div>
          </div>
        ) : activeView === 'verify' ? (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <VerifyTickets />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TermsAndConditions onBack={() => handleViewChange('raffle')} siteName={brand.siteName} />
          </div>
        )}
      </main>

      {
        featuredRaffle && (
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => { setIsCheckoutOpen(false); setOverrideTotal(undefined); }}
            selectedTickets={selectedTicketsToBuy}
            raffleId={featuredRaffle.id}
            raffleTitle={featuredRaffle.title}
            pricePerTicket={featuredRaffle.ticketPrice}
            onPurchaseSuccess={() => setRefreshTicketsAt(Date.now())}
            logoUrl={brand.logoUrl}
            siteName={brand.siteName}
            initialSettings={rawSettings}
            overrideTotal={overrideTotal}
          />
        )
      }

      <SupportChat isOpen={isSupportChatOpen} onClose={() => setIsSupportChatOpen(false)} />

      {/* ── Badge Flotante Sorteos Seguros ── */}
      {activeView === 'raffle' && !isCheckoutOpen && !isSupportChatOpen && (
        <div className="fixed bottom-4 left-0 right-0 z-[55] flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="pointer-events-auto flex items-center gap-3 bg-white/95 backdrop-blur-sm border border-blue-100 rounded-full pl-2 pr-6 py-1.5 shadow-lg shadow-blue-100/50">
            {/* Ícono verificado */}
            <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            {/* Textos */}
            <div className="leading-tight text-center">
              <p className="text-[11px] font-black text-blue-700 uppercase tracking-wide leading-none whitespace-nowrap">Éstos sorteos son seguros</p>
              <p className="text-[9px] font-bold text-blue-400 mt-0.5 leading-none whitespace-nowrap">Sorteos en base a la Lotería Nacional</p>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-slate-100 mt-8 py-8 md:py-10 pb-28 md:pb-32">
        <div className="max-w-md mx-auto px-4 flex flex-col items-center text-center space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center cursor-pointer" onClick={() => handleViewChange('raffle')}>
              {brand.logoUrl ? (
                // No container box — logo floats transparently over white footer
                <img
                  src={brand.logoUrl}
                  alt="Logo"
                  style={{ width: brand.logoSize, height: brand.logoSize }}
                  className="object-contain drop-shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: 'var(--brand-primary)' }}>
                  <span className="text-white font-black text-lg italic">N</span>
                </div>
              )}
              <span className={`font-black tracking-tighter text-slate-800 ${footerNameSize(brand.siteName)}`}>
                {brand.siteName}
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">
              Seguridad y transparencia total en México.
            </p>
          </div>

          <div className="w-full flex flex-col items-center gap-3">
            {(() => {
              const whatsapp = rawSettings?.whatsapp || '';
              const phone = whatsapp.replace(/\D/g, '');
              const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent('Hola, tengo dudas sobre el sorteo. ¿Me pueden ayudar?')}` : '#';
              const formatPhone = (p: string) => {
                const digits = p.replace(/\D/g, '');
                if (digits.startsWith('52') && digits.length >= 12) {
                  const rest = digits.slice(2, 12);
                  return `+52 ${rest.slice(0, 3)}-${rest.slice(3, 6)}-${rest.slice(6)}`;
                }
                if (digits.length >= 10) return `+52 ${digits.slice(-10, -7)}-${digits.slice(-7, -4)}-${digits.slice(-4)}`;
                return whatsapp || 'Sin configurar';
              };
              const displayPhone = phone ? formatPhone(whatsapp) : 'Sin configurar';
              return (
                <>
                  <p className="text-lg font-bold text-[#25D366] tracking-tight tabular-nums">
                    {displayPhone}
                  </p>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center p-3 rounded-full border-2 transition-all active:scale-95 ${phone ? 'border-[#25D366] bg-white hover:bg-[#25D366]/5 text-[#25D366]' : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed pointer-events-none'}`}
                  >
                    <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-8 h-8 object-contain" />
                  </a>
                </>
              );
            })()}
          </div>

          <div className="pt-6 border-t border-slate-50 w-full flex flex-col items-center gap-4">
            <p className="text-slate-300 text-[8px] font-black uppercase tracking-[0.3em]">
              © 2024 {brand.siteName.toUpperCase()}
            </p>

            <div className="flex flex-col items-center gap-3 py-5 px-6 bg-gradient-to-br from-blue-50/80 to-white rounded-[2.5rem] border border-blue-100/50 w-full max-w-[300px] shadow-xl shadow-blue-600/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
                  <img
                    src="/bismark.png"
                    alt="Bismark Logo"
                    className="w-full h-full object-contain scale-[1.35] transform transition-transform duration-500 hover:scale-[1.4]"
                  />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-left">Sitio desarrollado por</p>
                  <p className="text-[12px] font-black text-slate-800 tracking-tight"><span className="text-[#2563EB]">Bismark</span></p>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-bold leading-relaxed px-2">
                ¿Quieres una plataforma como ésta?
              </p>
              <a
                href="https://wa.me/526629480105?text=%C2%A1Hola!%20%F0%9F%91%8B%20Vi%20su%20plataforma%20de%20sorteos%20y%20me%20encant%C3%B3%20el%20sistema.%20%F0%9F%9A%80%20Me%20gustar%C3%ADa%20recibir%20informaci%C3%B3n%20detallada%20para%20crear%20mi%20propia%20p%C3%A1gina%20de%20rifas%20personalizada.%20%C2%BFMe%20pueden%20asesorar%3F%20%F0%9F%98%8A"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-3 bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all active:scale-95"
              >
                Empieza a rifar aquí
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div >
  );
};

export default App;
