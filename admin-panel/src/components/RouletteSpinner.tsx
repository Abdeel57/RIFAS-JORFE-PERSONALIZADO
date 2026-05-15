import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, X } from 'lucide-react';

interface Ticket {
    id: string;
    number: number;
    purchase?: { user?: { name?: string; phone?: string } };
}

interface Props {
    isOpen: boolean;
    tickets: Ticket[];
    onResult: (winner: Ticket) => void;
    onClose: () => void;
    raffleTitle?: string;
}

type Stage = 'idle' | 'preparing' | 'spinning' | 'reveal' | 'done';

const SEGMENT_COUNT = 16;
const SEGMENT_COLORS = ['#2563EB', '#7c3aed', '#db2777', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#8b5cf6'];
const SPIN_DURATION_MS = 9500; // duración de la animación de giro

const RouletteSpinner: React.FC<Props> = ({ isOpen, tickets, onResult, onClose, raffleTitle }) => {
    const [stage, setStage] = useState<Stage>('idle');
    const [cyclingTicket, setCyclingTicket] = useState<Ticket | null>(null);
    const [winner, setWinner] = useState<Ticket | null>(null);
    const [rotation, setRotation] = useState(0);

    const cycleRef = useRef<number | null>(null);
    const timeoutsRef = useRef<number[]>([]);

    const clearAll = () => {
        if (cycleRef.current !== null) {
            clearTimeout(cycleRef.current);
            cycleRef.current = null;
        }
        timeoutsRef.current.forEach(id => clearTimeout(id));
        timeoutsRef.current = [];
    };

    useEffect(() => {
        if (!isOpen) {
            clearAll();
            setStage('idle');
            setCyclingTicket(null);
            setWinner(null);
            setRotation(0);
            return;
        }
        if (tickets.length === 0) return;

        // Selecciona el ganador final una sola vez
        const finalWinner = tickets[Math.floor(Math.random() * tickets.length)];

        // === Etapa 1: PREPARANDO (600ms) ===
        setStage('preparing');
        setCyclingTicket(tickets[0]);
        setWinner(null);

        const t1 = window.setTimeout(() => {
            // === Etapa 2: SPINNING (5500ms) ===
            // Rotación final con un montón de vueltas + offset random
            const finalRotation = 2880 + Math.random() * 1440; // 8-12 vueltas
            setRotation(finalRotation);
            setStage('spinning');

            // Cycle del ticket mostrado en el centro (acelera y desacelera)
            let elapsed = 0;
            const cycle = () => {
                const t = Math.min(1, elapsed / SPIN_DURATION_MS);
                // Curva: rápido en el medio, lento al principio y al final
                // delay inicia en 50ms, baja a 30ms a la mitad, sube a 350ms al final
                const nextDelay = t < 0.6
                    ? 50 - t * 30
                    : 30 + Math.pow((t - 0.6) / 0.4, 2) * 320;

                const idx = Math.floor(Math.random() * tickets.length);
                setCyclingTicket(tickets[idx]);
                elapsed += nextDelay;
                if (elapsed < SPIN_DURATION_MS) {
                    cycleRef.current = window.setTimeout(cycle, nextDelay);
                }
            };
            cycle();

            const t2 = window.setTimeout(() => {
                if (cycleRef.current !== null) {
                    clearTimeout(cycleRef.current);
                    cycleRef.current = null;
                }
                // === Etapa 3: REVELACIÓN ===
                setCyclingTicket(finalWinner);
                setWinner(finalWinner);
                setStage('reveal');

                const t3 = window.setTimeout(() => {
                    setStage('done');
                    const t4 = window.setTimeout(() => {
                        onResult(finalWinner);
                    }, 1800);
                    timeoutsRef.current.push(t4);
                }, 600);
                timeoutsRef.current.push(t3);
            }, SPIN_DURATION_MS);
            timeoutsRef.current.push(t2);
        }, 600);
        timeoutsRef.current.push(t1);

        return () => clearAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, tickets.length]);

    if (!isOpen) return null;

    const display = winner ?? cyclingTicket;
    const padLen = Math.max(3, String(Math.max(...tickets.map(t => t.number), 1)).length);

    return (
        <AnimatePresence>
            <motion.div
                key="roulette-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1200] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget && stage !== 'spinning' && stage !== 'reveal') onClose();
                }}
            >
                {/* Confetti / sparkles cuando revela */}
                {stage === 'reveal' || stage === 'done' ? (
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: '50vh', x: `${Math.random() * 100}vw`, scale: 0 }}
                                animate={{ opacity: [0, 1, 0], y: '-20vh', scale: [0, 1, 0.6], rotate: Math.random() * 720 }}
                                transition={{ duration: 2.2, delay: i * 0.03, ease: 'easeOut' }}
                                className="absolute w-2 h-2 rounded-sm"
                                style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
                            />
                        ))}
                    </div>
                ) : null}

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                    className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-7 pt-6 pb-3 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Trophy className="text-amber-500" size={18} />
                                <h3 className="font-black text-slate-800 tracking-tight text-sm">Ruletazo de la Suerte</h3>
                            </div>
                            {raffleTitle && (
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate max-w-[260px]">
                                    {raffleTitle}
                                </p>
                            )}
                        </div>
                        {stage !== 'spinning' && stage !== 'reveal' && (
                            <button
                                onClick={onClose}
                                className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400 transition-all"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Wheel */}
                    <div className="px-6 pb-2 flex items-center justify-center">
                        <div className="relative w-80 h-80 max-w-full">
                            {/* Pointer (fijo arriba) */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20" style={{ marginTop: -10 }}>
                                <svg width="36" height="40" viewBox="0 0 32 36">
                                    <polygon
                                        points="16,34 2,4 30,4"
                                        fill="#1e293b"
                                        stroke="white"
                                        strokeWidth="3"
                                        strokeLinejoin="round"
                                    />
                                    <circle cx="16" cy="4" r="4" fill="#1e293b" stroke="white" strokeWidth="2" />
                                </svg>
                            </div>

                            {/* Wheel SVG */}
                            <motion.div
                                animate={{ rotate: rotation }}
                                transition={{
                                    duration: stage === 'spinning' ? SPIN_DURATION_MS / 1000 : 0,
                                    ease: stage === 'spinning' ? [0.15, 0.5, 0.05, 1] : 'linear',
                                }}
                                className="absolute inset-0"
                                style={{ filter: 'drop-shadow(0 12px 32px rgba(15, 23, 42, 0.35))' }}
                            >
                                <svg viewBox="0 0 200 200" className="w-full h-full">
                                    {/* Anillo exterior decorativo */}
                                    <circle cx="100" cy="100" r="99" fill="#0f172a" />
                                    <circle cx="100" cy="100" r="96" fill="#1e293b" />

                                    {/* Segmentos */}
                                    {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
                                        const segAngle = 360 / SEGMENT_COUNT;
                                        const startAngle = i * segAngle;
                                        const endAngle = startAngle + segAngle;
                                        const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                                        const s = (startAngle - 90) * (Math.PI / 180);
                                        const e = (endAngle - 90) * (Math.PI / 180);
                                        const r = 95;
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
                                                <line
                                                    x1="100" y1="100"
                                                    x2={x1} y2={y1}
                                                    stroke="rgba(255,255,255,0.35)"
                                                    strokeWidth="1.5"
                                                />
                                            </g>
                                        );
                                    })}

                                    {/* Bordes */}
                                    <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                                    <circle cx="100" cy="100" r="99" fill="none" stroke="#0f172a" strokeWidth="2" />

                                    {/* Tornillos decorativos */}
                                    {Array.from({ length: 16 }).map((_, i) => {
                                        const angle = (i / 16) * 360 * (Math.PI / 180);
                                        const x = 100 + 91 * Math.cos(angle);
                                        const y = 100 + 91 * Math.sin(angle);
                                        return <circle key={`bolt-${i}`} cx={x} cy={y} r="2.5" fill="rgba(255,255,255,0.55)" />;
                                    })}
                                </svg>
                            </motion.div>

                            {/* Centro fijo con info del ticket */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <motion.div
                                    animate={{
                                        scale: stage === 'reveal' ? [1, 1.12, 1] : 1,
                                    }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    className="bg-white rounded-full flex flex-col items-center justify-center text-center px-2 z-10 border-[5px]"
                                    style={{
                                        width: '46%',
                                        height: '46%',
                                        borderColor: stage === 'reveal' || stage === 'done' ? '#16a34a' : '#e2e8f0',
                                        boxShadow: stage === 'reveal' || stage === 'done'
                                            ? '0 0 32px rgba(22, 163, 74, 0.5), inset 0 2px 8px rgba(0,0,0,0.08)'
                                            : 'inset 0 2px 8px rgba(0,0,0,0.12)',
                                        transition: 'border-color 0.3s, box-shadow 0.3s',
                                    }}
                                >
                                    {display ? (
                                        <>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Boleto</p>
                                            <p
                                                className="font-black tabular-nums tracking-tight leading-none"
                                                style={{
                                                    fontSize: padLen <= 3 ? '2.5rem' : padLen <= 5 ? '1.85rem' : '1.35rem',
                                                    color: stage === 'reveal' || stage === 'done' ? '#16a34a' : '#0f172a',
                                                }}
                                            >
                                                #{String(display.number).padStart(padLen, '0')}
                                            </p>
                                            {display.purchase?.user?.name && (
                                                <p
                                                    className="text-[10px] font-bold text-slate-500 truncate max-w-[100%] mt-1 px-1"
                                                    style={{ color: stage === 'reveal' || stage === 'done' ? '#16a34a' : undefined }}
                                                >
                                                    {display.purchase.user.name}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <Sparkles size={32} className="text-slate-300 animate-pulse" />
                                    )}
                                </motion.div>
                            </div>

                        </div>
                    </div>

                    {/* Status text */}
                    <div className="text-center px-6 pb-6 min-h-[44px]">
                        {stage === 'preparing' && (
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
                                Preparando ruleta...
                            </p>
                        )}
                        {stage === 'spinning' && (
                            <p className="text-sm font-black text-blue-600 uppercase tracking-widest animate-pulse">
                                ¡La suerte está girando!
                            </p>
                        )}
                        {(stage === 'reveal' || stage === 'done') && winner && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.4 }}
                            >
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">¡Tenemos un ganador!</p>
                                <p className="text-base font-black text-slate-800 tracking-tight">
                                    {winner.purchase?.user?.name || `Boleto #${winner.number}`}
                                </p>
                                {winner.purchase?.user?.phone && (
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{winner.purchase.user.phone}</p>
                                )}
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RouletteSpinner;
