
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { soundService } from '../services/soundService.ts';
import { apiService } from '../services/apiService.ts';
import { PromoTier } from '../types.ts';
import CountdownTimer from './CountdownTimer.tsx';

// ─── Constants ────────────────────────────────────────────────────────────────
const GAP = 8;
const OVERSCAN = 3;

/**
 * Determines optimal column count, font size and aspect ratio.
 */
function computeLayout(
  containerWidth: number,
  maxTickets: number,
): { cols: number; fontSize: string; aspectRatio: number } {
  const digits = maxTickets.toString().length;

  // Si son 6 dígitos o más, usamos un diseño casi cuadrado (2 líneas de texto)
  const isMultiLevel = digits >= 6;
  const aspectRatio = isMultiLevel ? 1.15 : 1.8;

  // Forzamos columnas para ganar espacio horizontal
  let cols: number;
  if (containerWidth < 500) {
    // Reducimos una "fila" visual (columnas) para que todo quepa perfectamente
    cols = digits >= 6 ? 3 : 5;
  } else {
    cols = digits >= 6 ? 5 : 7;
  }
  const btnW = (containerWidth - (cols - 1) * GAP) / cols;

  // Fuente ajustada para el diseño de 2 niveles
  let fontSize = '12px';
  if (isMultiLevel) {
    // En 2 niveles el texto puede ser un poco más grande proporcionalmente
    fontSize = btnW >= 90 ? '14px' : btnW >= 70 ? '12px' : '11px';
  } else {
    if (digits >= 5) fontSize = btnW >= 80 ? '14px' : '12px';
    else fontSize = btnW >= 60 ? '15px' : '13px';
  }

  return { cols, fontSize, aspectRatio };
}

// ─── TicketItem ──────────────────────────────────────────────────────────────
const TicketItem = React.memo(({
  number,
  status,
  isSelected,
  isLucky,
  fontSize,
  aspectRatio,
  onClick,
  totalTickets, // Añadido para cálculo dinámico de ceros
}: {
  number: number;
  status: string;
  isSelected: boolean;
  isLucky: boolean;
  fontSize: string;
  aspectRatio: number;
  onClick: (num: number, status: string) => void;
  totalTickets: number;
}) => {
  const isUnavailable = status === 'sold' || status === 'reserved';

  const padded = useMemo(() => {
    // Calculamos el largo total basado en la cantidad de boletos (ej. 1M = 7 dígitos si incluye el 1,000,000, o 6 si es 999,999)
    const maxDigits = totalTickets.toString().length;
    return number.toString().padStart(maxDigits, '0');
  }, [number, totalTickets]);

  return (
    <button
      onClick={() => onClick(number, status)}
      disabled={isUnavailable}
      style={{ width: '100%', aspectRatio: `${aspectRatio} / 1`, fontSize }}
      className={`
        flex items-center justify-center font-black rounded-lg
        transition-colors duration-150 relative leading-none tracking-tighter
        ${status === 'sold'
          ? 'bg-slate-50 text-slate-100 cursor-not-allowed'
          : status === 'reserved'
            ? 'bg-amber-50 text-amber-600 border border-amber-200 cursor-not-allowed opacity-60'
            : isLucky
              ? 'bg-blue-600 text-white scale-110 z-10 animate-bounce'
              : isSelected
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105 z-10'
                : 'bg-white text-black border border-black hover:bg-blue-50 hover:text-blue-700 hover:border-blue-600'}
      `}
    >
      {padded.length >= 6 ? (
        <div className="flex flex-col items-center justify-center leading-[0.8] py-1">
          <span className="opacity-70 text-[0.85em] font-bold">{padded.slice(0, 3)}</span>
          <span className="font-black">{padded.slice(3)}</span>
        </div>
      ) : (
        padded
      )}
    </button>
  );
});

// ─── Props ────────────────────────────────────────────────────────────────────
interface TicketSelectorProps {
  raffleId: string;
  totalTickets: number;
  pricePerTicket: number;
  onCheckout: (tickets: number[], effectiveTotal?: number) => void;
  refreshTrigger?: number;
  isVirtual?: boolean;
  luckyNumbers?: number[];
  promoTiers?: PromoTier[] | null;
  showCountdown?: boolean;
  drawDate?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const TicketSelector: React.FC<TicketSelectorProps> = ({
  raffleId,
  totalTickets,
  pricePerTicket,
  onCheckout,
  refreshTrigger,
  luckyNumbers = [5, 10, 20, 50],
  promoTiers,
  showCountdown,
  drawDate
}) => {
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMachineOpen, setIsMachineOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isTrayExpanded, setIsTrayExpanded] = useState(false);
  const [lastLuckyNumbers, setLastLuckyNumbers] = useState<number[]>([]);
  const [statusMap, setStatusMap] = useState<Map<number, string>>(new Map());
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [discoveryTickets, setDiscoveryTickets] = useState<number[]>([]);
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false);

  // Modo Descubrimiento si > 25,000 boletos (umbral reducido para mejor performance móvil)
  const isDiscoveryMode = useMemo(() => totalTickets > 25000, [totalTickets]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Estado inicial inteligente: Más columnas y alto reducido para el diseño rectangular
  // Estado inicial inteligente: Menos columnas por defecto para evitar saltos visuales
  const [columnsCount, setColumnsCount] = useState(3);
  const [rowHeight, setRowHeight] = useState(60);
  const [ticketFontSize, setTicketFontSize] = useState('14px');
  const [ticketAspectRatio, setTicketAspectRatio] = useState(1.15);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const recalculate = (width: number) => {
      const { cols, fontSize, aspectRatio } = computeLayout(width, totalTickets);
      const itemW = (width - (cols - 1) * GAP) / cols;
      const itemH = itemW / aspectRatio;
      setColumnsCount(cols);
      setRowHeight(Math.ceil(itemH) + GAP);
      setTicketFontSize(fontSize);
      setTicketAspectRatio(aspectRatio);
    };

    const observer = new ResizeObserver(([entry]) => recalculate(entry.contentRect.width));
    observer.observe(container);
    recalculate(container.clientWidth || 300);
    return () => observer.disconnect();
  }, [totalTickets, isDiscoveryMode]); // Añadido isDiscoveryMode a las dependencias

  // ── Generador de boletos al azar 100% disponibles ────────────────────────
  const generateRandomDiscovery = useCallback((currentMap: Map<number, string>) => {
    setIsDiscoveryLoading(true);
    const count = 1000;
    const randoms: number[] = [];
    let attempts = 0;
    const maxAttempts = 15000;

    while (randoms.length < count && attempts < maxAttempts) {
      attempts++;
      const num = Math.floor(Math.random() * totalTickets) + 1;
      if (!randoms.includes(num) && (currentMap.get(num) || 'available') === 'available') {
        randoms.push(num);
      }
    }
    setDiscoveryTickets(randoms.sort((a, b) => a - b));
    setTimeout(() => setIsDiscoveryLoading(false), 300);
  }, [totalTickets]);

  // Load tickets
  useEffect(() => {
    if (!raffleId) return;
    setIsLoadingTickets(true);
    const load = async () => {
      try {
        // OPTIMIZACIÓN CLAVE: Solo traemos boletos No Disponibles.
        // Si no está en este mapa, asumimos que está disponible.
        // Esto reduce el payload de 100k+ registros a solo unos cientos/miles.
        const [sold, reserved] = await Promise.all([
          apiService.getRaffleTickets(raffleId, 'sold'),
          apiService.getRaffleTickets(raffleId, 'reserved')
        ]);

        const combined = [...sold, ...reserved];
        const map = new Map<number, string>(combined.map((t: any) => [t.number, t.status]));

        setStatusMap(map);
        if (isDiscoveryMode) generateRandomDiscovery(map);
      } catch (error) {
        console.error("Error loading tickets:", error);
        setStatusMap(new Map());
      } finally {
        setIsLoadingTickets(false);
      }
    };
    load();
  }, [raffleId, totalTickets, refreshTrigger, isDiscoveryMode, generateRandomDiscovery]);

  // ── Búsqueda Inteligente ──
  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length < 1) return null;
    const term = searchTerm.trim();
    const results: number[] = [];
    const maxResults = 1000;

    // Exacto
    const exact = parseInt(term);
    if (!isNaN(exact) && exact >= 1 && exact <= totalTickets) {
      if ((statusMap.get(exact) || 'available') === 'available') {
        results.push(exact);
      }
    }

    // Terminaciones y similares
    const suffixNum = parseInt(term);
    if (!isNaN(suffixNum)) {
      const step = Math.pow(10, term.length);
      for (let base = 0; base < totalTickets && results.length < maxResults; base += step) {
        const candidate = base + suffixNum;
        if (candidate >= 1 && candidate <= totalTickets && candidate !== exact) {
          if ((statusMap.get(candidate) || 'available') === 'available') {
            if (!results.includes(candidate)) results.push(candidate);
          }
        }
      }
    }

    // Prefijos
    if (term.length > 0 && results.length < maxResults) {
      for (let k = 0; k <= (7 - term.length); k++) {
        const base = parseInt(term) * Math.pow(10, k);
        const nextBase = (parseInt(term) + 1) * Math.pow(10, k);
        for (let num = base; num < nextBase && num <= totalTickets && results.length < maxResults; num++) {
          if (num >= 1 && (statusMap.get(num) || 'available') === 'available') {
            if (!results.includes(num)) results.push(num);
          }
        }
      }
    }

    return results.sort((a, b) => a - b);
  }, [searchTerm, totalTickets, statusMap]);

  // Qué renderizar
  const ticketsToRender = useMemo(() => {
    if (searchResults !== null) return searchResults;
    if (isDiscoveryMode) return discoveryTickets;
    return null; // El virtualizer mapeará el rango 1...totalTickets
  }, [searchResults, isDiscoveryMode, discoveryTickets]);

  const totalItemsCount = ticketsToRender !== null ? ticketsToRender.length : totalTickets;
  const totalRows = Math.ceil(totalItemsCount / columnsCount);

  const virtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => rowHeight,
    overscan: OVERSCAN,
  });

  useEffect(() => {
    virtualizer.scrollToIndex(0);
  }, [ticketsToRender?.length]);

  const selectedSet = useMemo(() => new Set(selectedTickets), [selectedTickets]);

  const toggleTicket = useCallback((num: number, status: string) => {
    if (status !== 'available' || isAnimating) return;
    setSelectedTickets(prev => {
      if (prev.includes(num)) {
        soundService.playDeselect();
        return prev.filter(t => t !== num);
      }
      soundService.playSelect();
      return [...prev, num];
    });
  }, [isAnimating]);

  const runLuckyMachine = (count: number) => {
    setIsMachineOpen(false);
    setIsAnimating(true);
    setIsTrayExpanded(false);
    soundService.playMachineRoll();

    setTimeout(() => {
      const lucky: number[] = [];
      let attempts = 0;
      while (lucky.length < count && attempts < 2000) {
        attempts++;
        const num = Math.floor(Math.random() * totalTickets) + 1;
        if (!selectedSet.has(num) && (statusMap.get(num) || 'available') === 'available') {
          if (!lucky.includes(num)) lucky.push(num);
        }
      }
      setLastLuckyNumbers(lucky);
      setSelectedTickets(prev => [...prev, ...lucky]);
      setIsAnimating(false);
      soundService.playJackpot();
      setTimeout(() => setLastLuckyNumbers([]), 3000);
    }, 1200);
  };

  // ── Tier pricing logic ──
  const activeTiers = useMemo(() => {
    if (!promoTiers || promoTiers.length === 0) return [];
    return [...promoTiers].sort((a, b) => a.qty - b.qty);
  }, [promoTiers]);

  const getEffectiveTotal = useCallback((count: number): { total: number; tier: PromoTier | null } => {
    if (activeTiers.length === 0) return { total: count * pricePerTicket, tier: null };
    // Find exact match first
    const exact = activeTiers.find(t => t.qty === count);
    if (exact) return { total: exact.price, tier: exact };
    // Otherwise use regular price
    return { total: count * pricePerTicket, tier: null };
  }, [activeTiers, pricePerTicket]);

  const { total: totalPrice, tier: appliedTier } = useMemo(
    () => getEffectiveTotal(selectedTickets.length),
    [selectedTickets.length, getEffectiveTotal]
  );

  // Quick-select a tier: pick N random available tickets (optimized for large raffles)
  const handleTierSelect = useCallback((qty: number) => {
    soundService.playSelect();
    const available: number[] = [];
    let attempts = 0;
    const maxTotalAttempts = 10000;

    // Buscamos números al azar para que sea instantáneo incluso en rifas de 1M
    while (available.length < qty && attempts < maxTotalAttempts) {
      attempts++;
      const num = Math.floor(Math.random() * totalTickets) + 1;
      // Verificamos en el mapa parcial. Si no está en el mapa, está disponible.
      if (!available.includes(num) && (statusMap.get(num) || 'available') === 'available') {
        available.push(num);
      }
    }

    // Fallback: si por mala suerte no encontramos suficientes al azar (muy improbable si hay stock), 
    // hacemos una búsqueda lineal pequeña solo para completar el cupo.
    if (available.length < qty) {
      for (let n = 1; n <= totalTickets && available.length < qty; n++) {
        if (!available.includes(n) && (statusMap.get(n) || 'available') === 'available') {
          available.push(n);
        }
      }
    }

    setSelectedTickets(available.slice(0, qty));
  }, [totalTickets, statusMap]);

  const regularTotal = selectedTickets.length * pricePerTicket;

  return (
    <>
      {/* ── Countdown Timer — Independiente del card, sobre el fondo ── */}
      {showCountdown && drawDate && (
        <CountdownTimer targetDate={drawDate} />
      )}

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-4 md:p-6 space-y-6 relative overflow-hidden w-[95%] mx-auto">
        {isAnimating && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <div className="text-5xl animate-bounce mb-4">🎰</div>
            <h3 className="text-xl font-black text-blue-600 italic tracking-tighter animate-pulse">BUSCANDO TU SUERTE...</h3>
          </div>
        )}



        {/* ── Pricing Tiers — vertical list ── */}
        {activeTiers.length > 0 && (
          <div className="space-y-1.5">
            {activeTiers.map((tier, i) => {
              const saving = Math.round(tier.qty * pricePerTicket - tier.price);
              const isActive = selectedTickets.length === tier.qty;
              return (
                <button
                  key={i}
                  onClick={() => handleTierSelect(tier.qty)}
                  style={{
                    background: isActive
                      ? 'color-mix(in srgb, var(--brand-secondary) 10%, white)'
                      : '#f8fafc',
                    border: isActive ? '1.5px solid var(--brand-secondary)' : '1.5px solid #e2e8f0',
                    transition: 'all 0.18s',
                    borderRadius: '1rem',
                  }}
                  className="w-full flex flex-col items-center justify-center px-4 py-2.5 active:scale-[0.98]"
                >
                  <span
                    className="font-black uppercase tracking-widest leading-tight"
                    style={{
                      fontSize: 'clamp(11px, 3.5vw, 13px)',
                      letterSpacing: '0.06em',
                      color: isActive ? 'var(--brand-secondary)' : '#334155',
                    }}
                  >
                    {tier.qty} POR{' '}
                    <span style={{ color: 'var(--brand-secondary)' }}>
                      ${tier.price.toLocaleString()}
                    </span>
                  </span>
                  {saving > 0 && (
                    <span
                      className="text-[10px] font-semibold leading-none mt-0.5"
                      style={{ color: '#16a34a' }}
                    >
                      Ahorras ${saving}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Divider before ticket grid */}
            <div className="border-t border-slate-100 pt-2" />
          </div>
        )}

        <div className="text-center">
          <h2 className="text-xl font-black text-slate-800 tracking-[0.05em] uppercase">ELIGE TUS BOLETOS</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-300">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                placeholder={isDiscoveryMode ? "Busca terminaciones ej. '777'..." : "Busca un número..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-base font-bold text-slate-600"
              />
            </div>

            {!searchTerm && isDiscoveryMode && (
              <button
                onClick={() => { soundService.playSelect(); generateRandomDiscovery(statusMap); }}
                className="h-[52px] bg-white border border-slate-100 px-4 rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95 group shadow-sm"
              >
                <div className={isDiscoveryLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}>
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">Regenerar</span>
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => { soundService.playSelect(); setIsMachineOpen(!isMachineOpen); }}
                className={`h-[52px] px-4 rounded-2xl font-black text-xs uppercase transition-all flex items-center gap-2 border shadow-lg relative overflow-hidden group ${isMachineOpen ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-transparent text-white'}`}
              >
                {!isMachineOpen && <div className="absolute inset-0 bg-[length:300%_auto] animate-rainbow-bg opacity-90 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: 'linear-gradient(90deg, #ff0000, #ff6600, #ffdd00, #00cc00, #0088ff, #6600ff, #ff0099, #ff0000)' }} />}
                <span className="relative z-10 flex items-center gap-2 drop-shadow-md">🎰 <span className="hidden sm:inline">Suerte</span></span>
              </button>
              {isMachineOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-40 p-1 grid grid-cols-2 gap-1 animate-in slide-in-from-top-2">
                  {luckyNumbers.map(qty => (
                    <button key={qty} onClick={() => runLuckyMachine(qty)} className="py-3 rounded-xl hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-black text-sm transition-all">+{qty}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {searchTerm && (
            <div className="px-1 flex items-center justify-between">
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic">Resultados para "{searchTerm}" (Solo disponibles)</span>
              <button onClick={() => setSearchTerm('')} className="text-[9px] font-black text-slate-300 hover:text-red-400">Limpiar ×</button>
            </div>
          )}
        </div>

        {isLoadingTickets || isDiscoveryLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
            <p className="text-slate-400 text-xs font-bold animate-pulse">Cargando boletos...</p>
          </div>
        ) : (
          <div ref={scrollContainerRef} className="max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar-light border-y border-slate-50 py-4 touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {virtualizer.getVirtualItems().map(virtualRow => {
                const startIdx = virtualRow.index * columnsCount;
                const rowItems = [];
                for (let i = 0; i < columnsCount; i++) {
                  const globalIdx = startIdx + i;
                  if (ticketsToRender !== null) {
                    if (globalIdx < ticketsToRender.length) {
                      const num = ticketsToRender[globalIdx];
                      rowItems.push({ number: num, status: statusMap.get(num) || 'available' });
                    }
                  } else {
                    const num = globalIdx + 1;
                    if (num <= totalTickets) {
                      rowItems.push({ number: num, status: statusMap.get(num) || 'available' });
                    }
                  }
                }

                return (
                  <div key={virtualRow.key} data-index={virtualRow.index} ref={virtualizer.measureElement} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualRow.start}px)`, paddingBottom: `${GAP}px` }}>
                    <div style={{ display: 'flex', gap: `${GAP}px` }}>
                      {rowItems.map(ticket => (
                        <div key={ticket.number} style={{ flex: 1, minWidth: 0 }}>
                          <TicketItem
                            number={ticket.number}
                            status={ticket.status}
                            isSelected={selectedSet.has(ticket.number)}
                            isLucky={lastLuckyNumbers.includes(ticket.number)}
                            fontSize={ticketFontSize}
                            aspectRatio={ticketAspectRatio}
                            onClick={toggleTicket}
                            totalTickets={totalTickets}
                          />
                        </div>
                      ))}
                      {rowItems.length < columnsCount && Array.from({ length: columnsCount - rowItems.length }).map((_, i) => (
                        <div key={`empty-${i}`} style={{ flex: 1, minWidth: 0 }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 px-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-white border border-black rounded-full" /><span>Libre</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-600 rounded-full" /><span>Mío</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-amber-100 border border-amber-200 rounded-full" /><span>Apartado</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-slate-50 rounded-full opacity-50" /><span>Vendido</span></div>
        </div>

        {selectedTickets.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-4 animate-in slide-in-from-bottom-5">
            <div className="max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-[2rem] overflow-hidden transition-all duration-300" style={{ maxHeight: isTrayExpanded ? '50vh' : '72px' }}>
              <div onClick={() => setIsTrayExpanded(!isTrayExpanded)} className="px-4 py-2.5 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors">
                <div className="flex flex-col pl-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total a pagar</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-800 font-black text-xl tracking-tighter">${totalPrice.toLocaleString()}</span>
                    {appliedTier && (
                      <span className="text-green-600 text-[9px] font-black bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                        Promo ×{appliedTier.qty}
                      </span>
                    )}
                    {!appliedTier && (
                      <span className="text-blue-600 text-[10px] font-bold bg-blue-50 px-2 py-0.5 rounded-full">{selectedTickets.length} boleto(s)</span>
                    )}
                    {appliedTier && regularTotal > totalPrice && (
                      <span className="text-slate-400 line-through text-xs">${regularTotal.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="bg-green-600 hover:bg-green-700 text-white font-black py-3 px-6 rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg animate-soft-glow" onClick={e => { e.stopPropagation(); onCheckout(selectedTickets, totalPrice); }}>Pagar</button>
                  <div className={`p-1 transition-transform duration-300 ${isTrayExpanded ? 'rotate-180 text-blue-600' : 'text-slate-300'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg>
                  </div>
                </div>
              </div>
              <div className={`px-5 pb-6 pt-2 transition-opacity duration-200 ${isTrayExpanded ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center justify-between mb-4 border-t border-slate-50 pt-4">
                  <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Tus números</span>
                  <button onClick={e => { e.stopPropagation(); soundService.playDeselect(); setSelectedTickets([]); }} className="text-red-400 text-[9px] font-black uppercase">Vaciar</button>
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar-light">
                  {selectedTickets.sort((a, b) => a - b).map(num => (
                    <div key={num} onClick={e => { e.stopPropagation(); toggleTicket(num, 'available'); }} className="group bg-white border border-black rounded-lg py-2 px-1 flex flex-col items-center justify-center transition-all hover:bg-red-50 relative cursor-pointer active:scale-90 shadow-sm min-h-[54px]">
                      {num.toString().padStart(totalTickets.toString().length, '0').length >= 6 ? (
                        <div className="flex flex-col items-center leading-[0.8]">
                          <span className="text-slate-400 font-bold text-[9px]">{num.toString().padStart(totalTickets.toString().length, '0').slice(0, 3)}</span>
                          <span className="text-black font-black text-[12px]">{num.toString().padStart(totalTickets.toString().length, '0').slice(3)}</span>
                        </div>
                      ) : (
                        <span className="text-black font-black text-[11px]">#{num.toString().padStart(totalTickets.toString().length, '0')}</span>
                      )}
                      <span className="text-red-400 text-[8px] font-bold uppercase mt-0.5 group-hover:block hidden">Quitar</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <style>{`
        .custom-scrollbar-light::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        @keyframes rainbow-bg { 0% { background-position: 0% 50%; } 50% { background-position: 150% 50%; } 100% { background-position: 300% 50%; } }
        .animate-rainbow-bg { animation: rainbow-bg 4s ease-in-out infinite; }
        @keyframes soft-glow { 0% { box-shadow: 0 0 0 0 rgba(22,163,74,0.4); } 70% { box-shadow: 0 0 0 10px rgba(22,163,74,0); } 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); } }
        .animate-soft-glow { animation: soft-glow 2s infinite ease-in-out; }
        @media (max-width: 768px) { .custom-scrollbar-light::-webkit-scrollbar { width: 0px; } }
      `}</style>
      </div>
    </>
  );
};

export default TicketSelector;
