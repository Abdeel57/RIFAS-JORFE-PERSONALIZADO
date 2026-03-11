import React from 'react';

interface SkeletonProps {
    className?: string;
    count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`animate-pulse bg-slate-200 rounded-xl ${className}`}
                    style={{
                        animationDelay: `${i * 0.05}s`,
                        animationDuration: '1.5s'
                    }}
                />
            ))}
        </>
    );
};

export default Skeleton;
