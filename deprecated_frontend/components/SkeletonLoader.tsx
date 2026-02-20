
import React from 'react';

export const RaffleSkeleton: React.FC = () => (
  <div className="space-y-12 animate-pulse">
    <div className="text-center max-w-4xl mx-auto space-y-4">
      <div className="h-6 w-32 bg-slate-200 rounded-full mx-auto"></div>
      <div className="h-16 md:h-24 w-full bg-slate-200 rounded-[2rem]"></div>
      <div className="h-6 w-2/3 bg-slate-100 rounded-full mx-auto mt-4"></div>
    </div>
    <div className="h-72 md:h-[650px] w-full bg-slate-200 rounded-[3rem]"></div>
  </div>
);

export const TicketSkeleton: React.FC = () => (
  <div className="bg-white rounded-[2rem] border border-slate-100 p-8 space-y-6 animate-pulse">
    <div className="flex justify-between">
      <div className="space-y-2">
        <div className="h-6 w-40 bg-slate-200 rounded-lg"></div>
        <div className="h-4 w-32 bg-slate-100 rounded-lg"></div>
      </div>
    </div>
    <div className="h-12 w-full bg-slate-100 rounded-2xl"></div>
    <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="aspect-square bg-slate-50 rounded-lg"></div>
      ))}
    </div>
  </div>
);

export const DetailsSkeleton: React.FC = () => (
  <div className="space-y-10 animate-pulse py-10">
    <div className="h-10 w-64 bg-slate-200 rounded-full mx-auto"></div>
    <div className="grid grid-cols-12 gap-5 h-[500px]">
      <div className="col-span-8 bg-slate-200 rounded-[3rem]"></div>
      <div className="col-span-4 flex flex-col gap-5">
        <div className="flex-1 bg-slate-100 rounded-[2.5rem]"></div>
        <div className="flex-1 bg-slate-100 rounded-[2.5rem]"></div>
      </div>
    </div>
  </div>
);
