
import React, { useState, useEffect, useCallback } from 'react';
import { FEATURED_RAFFLE, CONTACT_INFO, FALLBACK_RAFFLE_ID } from './constants.ts';
import TicketSelector from './components/TicketSelector.tsx';
import RaffleDetails from './components/RaffleDetails.tsx';
import CheckoutModal from './components/CheckoutModal.tsx';
import VerifyTickets from './components/VerifyTickets.tsx';
import TermsAndConditions from './components/TermsAndConditions.tsx';
import SupportChat from './components/SupportChat.tsx';
import { RaffleSkeleton, TicketSkeleton } from './components/SkeletonLoader.tsx';
import { soundService } from './services/soundService.ts';
import { apiService } from './services/apiService.ts';
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
  siteName: 'RIFAS NAO',
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

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'raffle' | 'verify' | 'terms'>('raffle');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [refreshTicketsAt, setRefreshTicketsAt] = useState<number>(0);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [selectedTicketsToBuy, setSelectedTicketsToBuy] = useState<number[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [featuredRaffle, setFeaturedRaffle] = useState<Raffle | null>(null);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);

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
        }
      })
      .catch(() => {/* fallback to defaults silently */ });
  }, []);

  useEffect(() => {
    const loadRaffle = async () => {
      try {
        const raffles = await apiService.getRaffles('active');
        if (raffles && raffles.length > 0) {
          // Usar la primera rifa activa disponible
          setFeaturedRaffle(raffles[0] as Raffle);
        } else {
          // Fallback a la constante si no hay rifas en la API
          setFeaturedRaffle(FEATURED_RAFFLE);
        }
      } catch (error) {
        console.error('Error loading raffle:', error);
        // Fallback a la constante en caso de error
        setFeaturedRaffle(FEATURED_RAFFLE);
      } finally {
        setTimeout(() => {
          setIsAppLoading(false);
        }, 1200);
      }
    };
    loadRaffle();
  }, []);

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

  const handleCheckout = useCallback((tickets: number[]) => {
    setSelectedTicketsToBuy(tickets);
    setIsCheckoutOpen(true);
  }, []);

  const handleViewChange = (view: 'raffle' | 'verify' | 'terms') => {
    if (view === activeView) return;

    setIsAppLoading(true);
    window.scrollTo({ top: 0, behavior: 'instant' as any });

    setTimeout(() => {
      setActiveView(view);
      setIsAppLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 scroll-smooth antialiased">
      {/* ── Navbar "Liquid Glass" ────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 px-3 py-3 md:px-4 md:py-5 flex justify-center pointer-events-none">
        <nav
          className="pointer-events-auto relative w-full max-w-2xl bg-white/55 backdrop-blur-[20px] border border-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-2xl md:rounded-[2rem] h-14 md:h-16 overflow-visible"
          style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 0, paddingLeft: 16, paddingRight: 12 }}
        >
          {/* Glassmorphism inner gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-white/10 pointer-events-none rounded-2xl md:rounded-[2rem]" />

          {/* ── COLUMNA IZQUIERDA (1fr): Logo + Nombre ─────────────── */}
          {/* Logo es position:absolute → nunca afecta el grid layout  */}
          {/* El nombre es el único elemento en el flujo               */}
          <div
            className="relative flex items-center z-10 cursor-pointer group min-w-0"
            style={{ paddingLeft: 50 }}
            onClick={() => handleViewChange('raffle')}
          >
            {/* Logo: position:absolute, fuera del flujo CSS */}
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
              {/* Palomita azul: siempre en top-right del reference box de 44px */}
              <div className="absolute bg-[#1877F2] border-2 border-white rounded-full flex items-center justify-center shadow-sm" style={{ width: 13, height: 13, top: -3, right: -3, zIndex: 30 }}>
                <svg width="7" height="7" viewBox="0 0 12 12" fill="white">
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
              </div>
            </div>

            {/* Nombre del sitio — único elemento en el flujo del grid */}
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span
                className="font-black tracking-tight text-slate-800 leading-none truncate"
                style={{ fontSize: brand.siteName.length <= 10 ? 14 : brand.siteName.length <= 16 ? 12 : brand.siteName.length <= 22 ? 10 : 9 }}
              >
                {brand.siteName}
              </span>
              <span className="font-bold uppercase leading-none mt-0.5 hidden md:block tracking-widest truncate" style={{ fontSize: 7, color: 'var(--brand-primary)' }}>
                Sorteos Certificados
              </span>
            </div>
          </div>

          {/* ── COLUMNA CENTRAL (auto): Botones de navegación ──────── */}
          <div className="relative flex bg-white/50 p-0.5 rounded-xl border border-white/80 z-10 shadow-inner">
            <button
              onClick={() => handleViewChange('raffle')}
              className={`px-3 md:px-5 py-1.5 rounded-[10px] text-[9px] md:text-[10px] font-black transition-all duration-200 uppercase tracking-widest ${activeView === 'raffle' ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
              style={activeView === 'raffle' ? { color: 'var(--brand-primary)' } : {}}
            >
              Sorteo
            </button>
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


      <div className="h-20 md:h-28"></div>


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

                    <div className="relative pt-4">
                      <TicketSelector
                        raffleId={featuredRaffle.id}
                        totalTickets={featuredRaffle.totalTickets}
                        pricePerTicket={featuredRaffle.ticketPrice}
                        onCheckout={handleCheckout}
                        refreshTrigger={refreshTicketsAt}
                      />
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

            <div className="flex flex-col items-center justify-center pt-8 pb-4 border-t border-slate-100">
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
            <TermsAndConditions onBack={() => handleViewChange('raffle')} />
          </div>
        )}
      </main>

      {
        featuredRaffle && (
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            selectedTickets={selectedTicketsToBuy}
            raffleId={featuredRaffle.id}
            pricePerTicket={featuredRaffle.ticketPrice}
            onPurchaseSuccess={() => setRefreshTicketsAt(Date.now())}
            logoUrl={brand.logoUrl}
            siteName={brand.siteName}
          />
        )
      }

      <SupportChat isOpen={isSupportChatOpen} onClose={() => setIsSupportChatOpen(false)} />

      <footer className="bg-white border-t border-slate-100 mt-8 py-8 md:py-10">
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

          <div className="w-full space-y-3">
            <button
              onClick={() => setIsSupportChatOpen(true)}
              className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white py-3.5 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:brightness-105 transition-all shadow-lg active:scale-95"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884 0 2.225.569 3.846 1.613 5.385l-.991 3.62 3.867-.996z" /></svg>
              Chat de Soporte
            </button>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">{CONTACT_INFO.email}</p>
          </div>

          <div className="pt-6 border-t border-slate-50 w-full">
            <p className="text-slate-300 text-[8px] font-black uppercase tracking-[0.3em]">
              © 2024 RIFAS NAO MÉXICO
            </p>
          </div>
        </div>
      </footer>
    </div >
  );
};

export default App;
