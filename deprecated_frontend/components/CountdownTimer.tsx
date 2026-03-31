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
        <div className="flex flex-col items-center">
            <span
                className="font-black tabular-nums leading-none"
                style={{
                    fontSize: 'clamp(36px, 9vw, 64px)',
                    letterSpacing: '-0.04em',
                    color: 'var(--brand-primary)',
                    textShadow: '0 2px 20px rgba(var(--brand-primary-rgb, 59, 130, 246), 0.18)',
                }}
            >
                {value.toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1">
                {label}
            </span>
        </div>
    );

    const Colon = () => (
        <span
            className="font-black text-slate-200 self-start"
            style={{ fontSize: 'clamp(28px, 7vw, 52px)', marginTop: '4px', lineHeight: 1 }}
        >
            :
        </span>
    );

    return (
        <div className="flex flex-col items-center gap-2 py-5 animate-in fade-in duration-700">
            <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">
                    Se realiza en:
                </span>
            </div>

            <div className="flex items-center gap-3 md:gap-5">
                <TimeUnit value={timeLeft.days} label="Días" />
                <Colon />
                <TimeUnit value={timeLeft.hours} label="Hrs" />
                <Colon />
                <TimeUnit value={timeLeft.minutes} label="Min" />
                <Colon />
                <TimeUnit value={timeLeft.seconds} label="Seg" />
            </div>
        </div>
    );
};

export default CountdownTimer;
