import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
    targetDate: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft(null);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return null;

    const TimeUnit = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center px-3 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[64px]">
            <span className="text-xl font-black text-slate-800 tracking-tighter leading-none tabular-nums">
                {value.toString().padStart(2, '0')}
            </span>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {label}
            </span>
        </div>
    );

    return (
        <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">El sorteo finaliza en:</span>
            </div>

            <div className="flex items-center gap-2">
                <TimeUnit value={timeLeft.days} label="Días" />
                <span className="text-xl font-black text-slate-200 -mt-4">:</span>
                <TimeUnit value={timeLeft.hours} label="Hrs" />
                <span className="text-xl font-black text-slate-200 -mt-4">:</span>
                <TimeUnit value={timeLeft.minutes} label="Min" />
                <span className="text-xl font-black text-slate-200 -mt-4">:</span>
                <TimeUnit value={timeLeft.seconds} label="Seg" />
            </div>
        </div>
    );
};

export default CountdownTimer;
