import React, { useState, useEffect, useRef } from 'react';
import { soundService } from '../services/soundService.ts';

type Stage = 'idle' | 'preparing' | 'spinning' | 'revealing' | 'done';

interface Props {
  isOpen: boolean;
  count: number;
  totalTickets: number;
  /** Boletos ya seleccionados — no se vuelven a elegir */
  selectedSet: Set<number>;
  /** Mapa de estados: tickets vendidos/reservados se excluyen */
  statusMap: Map<number, string>;
  /** Se llama con los números ganadores cuando la animación termina */
  onComplete: (winners: number[]) => void;
  /** Se llama si el usuario cancela durante el spin */
  onCancel: () => void;
}

const SEGMENT_COUNT = 12;
const SEGMENT_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const RuletazoModal: React.FC<Props> = ({
  isOpen, count, totalTickets, selectedSet, statusMap, onComplete, onCancel,
}) => {
  const [stage, setStage] = useState<Stage>('idle');
  const [centerNumber, setCenterNumber] = useState<number>(1);
  const [winners, setWinners] = useState<number[]>([]);
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);

  const cycleTimeoutRef = useRef<number | null>(null);
  const stageTimeoutsRef = useRef<number[]>([]);

  // Limpia todos los timeouts pendientes
  const clearAllTimeouts = () => {
    if (cycleTimeoutRef.current !== null) {
      clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = null;
    }
    stageTimeoutsRef.current.forEach(id => clearTimeout(id));
    stageTimeoutsRef.current = [];
  };

  useEffect(() => {
    if (!isOpen) {
      clearAllTimeouts();
      setStage('idle');
      setCenterNumber(1);
      setWinners([]);
      setRevealedCount(0);
      setRotation(0);
      return;
    }

    // Generar los ganadores una sola vez al abrir
    const generated: number[] = [];
    const used = new Set(selectedSet);
    let attempts = 0;
    while (generated.length < count && attempts < 5000) {
      attempts++;
      const num = Math.floor(Math.random() * totalTickets) + 1;
      const status = statusMap.get(num) || 'available';
      if (!used.has(num) && status === 'available') {
        used.add(num);
        generated.push(num);
      }
    }
    setWinners(generated);

    if (generated.length === 0) {
      // Nada que sortear, cerrar inmediato
      const t = window.setTimeout(() => onComplete([]), 200);
      stageTimeoutsRef.current.push(t);
      return;
    }

    // === ETAPA 1 — PREPARANDO (500ms) ===
    setStage('preparing');

    const t1 = window.setTimeout(() => {
      // === ETAPA 2 — SPINNING (4500ms) ===
      const finalRotation = 1440 + Math.random() * 720; // 4-6 vueltas
      setRotation(finalRotation);
      setStage('spinning');
      soundService.playMachineRoll();

      // Cycling de números en el centro (se acelera al inicio, desacelera al final)
      let elapsed = 0;
      const SPIN_DURATION = 4500;
      const cycle = () => {
        // delay arranca rápido (40ms) y crece a 300ms al final
        const t = elapsed / SPIN_DURATION; // 0..1
        const nextDelay = 40 + t * t * 260;
        const num = Math.floor(Math.random() * totalTickets) + 1;
        setCenterNumber(num);
        elapsed += nextDelay;
        if (elapsed < SPIN_DURATION) {
          cycleTimeoutRef.current = window.setTimeout(cycle, nextDelay);
        }
      };
      cycle();

      const t2 = window.setTimeout(() => {
        if (cycleTimeoutRef.current !== null) {
          clearTimeout(cycleTimeoutRef.current);
          cycleTimeoutRef.current = null;
        }

        // === ETAPA 3 — REVELANDO ===
        setStage('revealing');
        soundService.playJackpot();

        // Velocidad de revelado adaptativa: rápido si son muchos
        const revealDelay = generated.length <= 8 ? 380 : generated.length <= 20 ? 180 : 80;

        generated.forEach((winner, idx) => {
          const t = window.setTimeout(() => {
            setCenterNumber(winner);
            setRevealedCount(idx + 1);
          }, idx * revealDelay);
          stageTimeoutsRef.current.push(t);
        });

        const totalRevealMs = generated.length * revealDelay;
        const t3 = window.setTimeout(() => {
          setStage('done');
          // pequeño beat antes de completar
          const t4 = window.setTimeout(() => onComplete(generated), 1400);
          stageTimeoutsRef.current.push(t4);
        }, totalRevealMs);
        stageTimeoutsRef.current.push(t3);
      }, SPIN_DURATION);
      stageTimeoutsRef.current.push(t2);
    }, 500);
    stageTimeoutsRef.current.push(t1);

    return () => clearAllTimeouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, count, totalTickets]);

  if (!isOpen) return null;

  const padLen = String(totalTickets).length;
  const primary = 'var(--brand-primary, #3b82f6)';

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={(e) => { if (e.target === e.currentTarget && stage !== 'done') onCancel(); }}
    >
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-6 flex flex-col items-center gap-4 relative overflow-hidden">
        {/* Close (no disponible cuando ya completó) */}
        {stage !== 'done' && stage !== 'revealing' && (
          <button
            onClick={onCancel}
            className="absolute top-3 right-3 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors z-30"
            title="Cancelar"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Título */}
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: primary }}>
            🎰 Ruletazo de la Suerte
          </p>
          <h2 className="text-base font-black text-slate-800 tracking-tight mt-1">
            {count} {count === 1 ? 'número ganador' : 'números ganadores'}
          </h2>
        </div>

        {/* Ruleta */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72">
          {/* Puntero (fijo arriba) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20" style={{ marginTop: -6 }}>
            <svg width="28" height="32" viewBox="0 0 28 32">
              <polygon
                points="14,30 2,4 26,4"
                fill={primary as any}
                stroke="white"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <polygon
                points="14,30 2,4 26,4"
                fill="none"
                stroke="rgba(0,0,0,0.15)"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Wheel SVG rotatorio */}
          <div
            className="absolute inset-0"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: stage === 'spinning'
                ? 'transform 4.5s cubic-bezier(0.15, 0.5, 0.05, 1)'
                : 'none',
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.25))',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Anillo exterior */}
              <circle cx="100" cy="100" r="98" fill="#0f172a" />
              <circle cx="100" cy="100" r="94" fill="#1e293b" />

              {/* Segmentos */}
              {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
                const segAngle = 360 / SEGMENT_COUNT;
                const startAngle = i * segAngle;
                const endAngle = startAngle + segAngle;
                const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                const s = (startAngle - 90) * (Math.PI / 180);
                const e = (endAngle - 90) * (Math.PI / 180);
                const r = 94;
                const x1 = 100 + r * Math.cos(s);
                const y1 = 100 + r * Math.sin(s);
                const x2 = 100 + r * Math.cos(e);
                const y2 = 100 + r * Math.sin(e);
                return (
                  <g key={i}>
                    <path
                      d={`M 100 100 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                      fill={color}
                      opacity={0.92}
                    />
                    {/* Líneas divisorias */}
                    <line
                      x1="100" y1="100"
                      x2={x1} y2={y1}
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}

              {/* Borde decorativo */}
              <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="98" fill="none" stroke="#0f172a" strokeWidth="2" />

              {/* Tornillos decorativos en el borde */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * 360 * (Math.PI / 180);
                const x = 100 + 91 * Math.cos(angle);
                const y = 100 + 91 * Math.sin(angle);
                return <circle key={`bolt-${i}`} cx={x} cy={y} r="2.5" fill="rgba(255,255,255,0.5)" />;
              })}
            </svg>
          </div>

          {/* Centro fijo (no rota) — muestra el número */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-full flex items-center justify-center bg-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] border-[3px] z-10"
              style={{
                width: '40%',
                height: '40%',
                borderColor: stage === 'revealing' || stage === 'done' ? primary as any : '#0f172a',
                transition: 'border-color 0.3s, transform 0.2s',
                transform: stage === 'revealing' ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <span
                className="font-black tabular-nums tracking-tight"
                style={{
                  fontSize: padLen <= 3 ? '2.25rem' : padLen <= 5 ? '1.75rem' : '1.25rem',
                  color: stage === 'revealing' || stage === 'done' ? (primary as any) : '#0f172a',
                  textShadow: stage === 'revealing' ? `0 0 16px ${primary}66` : 'none',
                  transition: 'color 0.3s, text-shadow 0.3s',
                }}
              >
                {String(centerNumber).padStart(padLen, '0')}
              </span>
            </div>
          </div>

          {/* Eje central */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-900 z-20 shadow-md" />
        </div>

        {/* Texto de estado */}
        <div className="text-center min-h-[24px]">
          {stage === 'preparing' && (
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Preparando ruleta...</p>
          )}
          {stage === 'spinning' && (
            <p className="text-sm font-black uppercase tracking-widest animate-pulse" style={{ color: primary as any }}>
              ¡Girando!
            </p>
          )}
          {stage === 'revealing' && (
            <p className="text-sm font-black uppercase tracking-widest text-green-600">
              ¡{revealedCount} de {count}!
            </p>
          )}
          {stage === 'done' && (
            <p className="text-sm font-black uppercase tracking-widest text-green-600 flex items-center justify-center gap-1.5">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              ¡Listo!
            </p>
          )}
        </div>

        {/* Lista de ganadores acumulada */}
        {(stage === 'revealing' || stage === 'done') && winners.length > 0 && (
          <div className="w-full">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center mb-2">
              Tus números de la suerte
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center max-h-32 overflow-y-auto px-1">
              {winners.slice(0, revealedCount).map((n, i) => (
                <span
                  key={n}
                  className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-black tabular-nums animate-in zoom-in-50 fade-in duration-300"
                  style={{
                    background: `${primary}1A`,
                    color: primary as any,
                    border: `1.5px solid ${primary}44`,
                    animationDelay: `${Math.min(i, 10) * 30}ms`,
                  }}
                >
                  {String(n).padStart(padLen, '0')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RuletazoModal;
