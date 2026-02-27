
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Ticket } from '../types';
import { soundService } from '../services/soundService.ts';
import { apiService } from '../services/apiService.ts';

// Componente memoizado para evitar re-renders costosos en el grid
const TicketItem = React.memo(({ 
  number, 
  status, 
  isSelected, 
  isHighlighted, 
  isLucky, 
  onClick 
}: { 
  number: number; 
  status: string; 
  isSelected: boolean; 
  isHighlighted: boolean; 
  isLucky: boolean; 
  onClick: (num: number, status: string) => void;
}) => {
  const isUnavailable = status === 'sold' || status === 'reserved';
  
  return (
    <button
      id={`ticket-${number}`}
      onClick={() => onClick(number, status)}
      disabled={isUnavailable}
      className={`
        aspect-square flex items-center justify-center text-[10px] font-black rounded-lg transition-all duration-200 relative will-change-transform
        ${status === 'sold' ? 'bg-slate-50 text-slate-200 cursor-not-allowed' : 
          status === 'reserved' ? 'bg-amber-50 text-amber-300 border border-amber-100 cursor-not-allowed' :
          isLucky ? 'bg-blue-600 text-white scale-110 z-10 animate-bounce' :
          isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105 z-10' : 
          isHighlighted ? 'bg-blue-50 text-blue-600 border border-blue-200 scale-105' :
          'bg-slate-50/50 text-slate-400 hover:bg-white hover:text-blue-600 border border-transparent hover:border-blue-100'}
      `}
    >
      {number.toString().padStart(3, '0')}
    </button>
  );
});

interface TicketSelectorProps {
  raffleId: string;
  totalTickets: number;
  pricePerTicket: number;
  onCheckout: (tickets: number[]) => void;
  /** Cuando cambia, se vuelven a cargar los boletos (ej. tras una compra exitosa). */
  refreshTrigger?: number;
}

const TicketSelector: React.FC<TicketSelectorProps> = ({ raffleId, totalTickets, pricePerTicket, onCheckout, refreshTrigger }) => {
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMachineOpen, setIsMachineOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isTrayExpanded, setIsTrayExpanded] = useState(false);
  const [lastLuckyNumbers, setLastLuckyNumbers] = useState<number[]>([]);
  const [initialTickets, setInitialTickets] = useState<Array<{ number: number; status: string }>>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const tickets = await apiService.getRaffleTickets(raffleId);
        const ticketsMap = new Map(tickets.map((t: any) => [t.number, t.status]));
        
        // Crear array completo de boletos con sus estados
        const allTickets = Array.from({ length: totalTickets }, (_, i) => ({
          number: i + 1,
          status: ticketsMap.get(i + 1) || 'available',
        }));
        
        setInitialTickets(allTickets);
      } catch (error) {
        console.error('Error loading tickets:', error);
        // Fallback a tickets disponibles si hay error
        setInitialTickets(Array.from({ length: totalTickets }, (_, i) => ({
          number: i + 1,
          status: 'available',
        })));
      } finally {
        setIsLoadingTickets(false);
      }
    };
    
    if (raffleId) {
      loadTickets();
    }
  }, [raffleId, totalTickets, refreshTrigger]);

  const toggleTicket = useCallback((num: number, status: string) => {
    if (status !== 'available' || isAnimating) return;
    
    setSelectedTickets(prev => {
      const isRemoving = prev.includes(num);
      if (isRemoving) {
        soundService.playDeselect();
        return prev.filter(t => t !== num);
      } else {
        soundService.playSelect();
        return [...prev, num];
      }
    });
  }, [isAnimating]);

  const runLuckyMachine = (count: number) => {
    setIsMachineOpen(false);
    setIsAnimating(true);
    setIsTrayExpanded(false);
    soundService.playMachineRoll();
    
    setTimeout(() => {
      const available = initialTickets.filter(t => 
        t.status === 'available' && !selectedTickets.includes(t.number)
      );
      const shuffled = [...available].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count).map(t => t.number);
      
      setLastLuckyNumbers(selected);
      setSelectedTickets(prev => [...prev, ...selected]);
      setIsAnimating(false);
      soundService.playJackpot();
      
      setTimeout(() => setLastLuckyNumbers([]), 3000);
    }, 1200);
  };

  const toggleMachineMenu = () => {
    soundService.playSelect();
    setIsMachineOpen(!isMachineOpen);
  };

  const totalPrice = selectedTickets.length * pricePerTicket;

  const highlightedTicket = useMemo(() => {
    const num = parseInt(searchTerm);
    if (isNaN(num) || num < 1 || num > totalTickets) return null;
    return num;
  }, [searchTerm, totalTickets]);

  useEffect(() => {
    if (highlightedTicket) {
      const el = document.getElementById(`ticket-${highlightedTicket}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedTicket]);

  useEffect(() => {
    if (selectedTickets.length === 0) setIsTrayExpanded(false);
  }, [selectedTickets]);

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-5 md:p-8 space-y-6 relative transition-all duration-300">
      
      {isAnimating && (
        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 rounded-[2rem]">
          <div className="text-5xl animate-bounce mb-4">🎰</div>
          <h3 className="text-xl font-black text-blue-600 italic tracking-tighter animate-pulse">BUSCANDO TU SUERTE...</h3>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Elige tus Boletos</h2>
          <p className="text-slate-400 text-xs font-medium">Pulsa los números para elegir</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-300">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="number"
              placeholder="Ej. 777"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-base font-bold text-slate-600"
            />
          </div>

          <div className="relative">
            <button 
              onClick={toggleMachineMenu}
              className={`h-full px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border shadow-lg relative overflow-hidden group
                ${isMachineOpen 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-white border-transparent text-white'}`}
            >
              {/* Capa de Arcoíris Animada para el botón */}
              {!isMachineOpen && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-[length:200%_auto] animate-rainbow-bg opacity-90 group-hover:opacity-100 transition-opacity"></div>
              )}
              <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                🎰 <span className="hidden sm:inline">Suerte</span>
              </span>
            </button>

            {isMachineOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-40 p-1 grid grid-cols-2 gap-1 animate-in slide-in-from-top-2">
                {[1, 5, 10, 20].map(qty => (
                  <button
                    key={qty}
                    onClick={() => runLuckyMachine(qty)}
                    className="py-3 rounded-xl hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-black text-sm transition-all"
                  >
                    +{qty}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoadingTickets ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="max-h-[300px] overflow-y-auto pr-1 custom-scrollbar-light border-y border-slate-50 py-4 touch-pan-y">
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {initialTickets.map((ticket) => (
              <TicketItem 
                key={ticket.number}
                number={ticket.number}
                status={ticket.status}
                isSelected={selectedTickets.includes(ticket.number)}
                isHighlighted={highlightedTicket === ticket.number}
                isLucky={lastLuckyNumbers.includes(ticket.number)}
                onClick={toggleTicket}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 px-1 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-slate-100 rounded-full"></div><span>Libre</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-600 rounded-full"></div><span>Mío</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-amber-100 rounded-full"></div><span>Apartado</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-slate-50 rounded-full opacity-50"></div><span>Vendido</span></div>
      </div>

      {selectedTickets.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-4 animate-in slide-in-from-bottom-5 will-change-transform">
          <div className="max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] overflow-hidden transition-all duration-300 ease-out"
               style={{ maxHeight: isTrayExpanded ? '50vh' : '72px' }}>
            
            <div 
              onClick={() => setIsTrayExpanded(!isTrayExpanded)}
              className="px-4 py-2.5 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
            >
              <div className="flex flex-col pl-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total a pagar</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-800 font-black text-xl tracking-tighter">${totalPrice.toLocaleString()}</span>
                  <span className="text-blue-600 text-[10px] font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                    {selectedTickets.length} boleto(s)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  className="bg-green-600 hover:bg-green-700 text-white font-black py-3 px-6 rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-green-100 animate-soft-glow"
                  onClick={(e) => { e.stopPropagation(); onCheckout(selectedTickets); }}
                >
                  Pagar
                </button>
                <div className={`p-1 transition-transform duration-300 ${isTrayExpanded ? 'rotate-180 text-blue-600' : 'text-slate-300'}`}>
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg>
                </div>
              </div>
            </div>

            <div className={`px-5 pb-6 pt-2 transition-opacity duration-200 ${isTrayExpanded ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center justify-between mb-4 border-t border-slate-50 pt-4">
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Tus números</span>
                <button onClick={(e) => { e.stopPropagation(); soundService.playDeselect(); setSelectedTickets([]); }} className="text-red-400 text-[9px] font-black uppercase">Vaciar</button>
              </div>
              
              <div className="grid grid-cols-4 gap-2 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar-light">
                {selectedTickets.sort((a,b) => a-b).map(num => (
                  <div key={num} 
                       onClick={(e) => { e.stopPropagation(); toggleTicket(num, 'available'); }}
                       className="group bg-slate-50 border border-slate-100 rounded-xl py-2 px-1 flex flex-col items-center justify-center transition-all hover:border-red-100 hover:bg-red-50 relative cursor-pointer active:scale-90">
                    <span className="text-slate-700 font-black text-[11px]">#{num.toString().padStart(3, '0')}</span>
                    <span className="text-red-400 text-[8px] font-bold uppercase mt-0.5 group-hover:block hidden">Quitar</span>
                    <div className="absolute top-1 right-1 sm:hidden">
                       <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    </div>
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
        
        @keyframes rainbow-bg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-rainbow-bg {
          animation: rainbow-bg 3s linear infinite;
        }

        @keyframes soft-glow {
          0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(22, 163, 74, 0); }
          100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }

        .animate-soft-glow {
          animation: soft-glow 2s infinite ease-in-out;
        }

        @media (max-width: 768px) {
          .custom-scrollbar-light::-webkit-scrollbar { width: 0px; }
        }
      `}</style>
    </div>
  );
};

export default TicketSelector;
