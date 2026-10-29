import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span aria-hidden="true" className={`block rounded-md bg-slate-200 animate-pulse motion-reduce:animate-none ${className}`} />
);

export const Loading: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className, children }) => (
  <div role="status" aria-label={label} className={className}>
    <span className="sr-only">{label}</span>
    {children}
  </div>
);

export const ListSkeleton: React.FC<{ label: string; rows?: number }> = ({ label, rows = 4 }) => (
  <Loading label={label} className="space-y-2">
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
        <Skeleton className="w-5 h-5" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/5" />
        </div>
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    ))}
  </Loading>
);

export const DocumentPageSkeleton: React.FC<{ label: string }> = ({ label }) => (
  <Loading label={label} className="flex-1 overflow-hidden flex justify-center p-8">
    <div className="w-full max-w-[210mm] aspect-[210/297] bg-white shadow-sm p-12 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      {[0, 1, 2].map((section) => (
        <div key={section} className="space-y-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  </Loading>
);

export const AppSkeleton: React.FC = () => (
  <Loading label="Loading your data" className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
    <div className="hidden md:flex w-60 shrink-0 h-screen bg-white border-r border-slate-200 flex-col p-4 gap-6">
      <div className="flex items-center gap-2 px-2 pt-2">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-10 rounded-xl" />
      <Skeleton className="h-9 rounded-lg" />
      <div className="space-y-3 px-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-4 w-28" />
        ))}
      </div>
    </div>
    <div className="flex-1 min-w-0 px-4 py-6 md:px-10 md:py-8 max-w-6xl space-y-10">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[0, 1, 2, 3, 4].map((tile) => (
          <div key={tile} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {[0, 1].map((card) => (
          <div key={card} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-32" />
          </div>
        ))}
      </div>
    </div>
  </Loading>
);
