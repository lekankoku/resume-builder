import React, { useLayoutEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Link } from 'react-router';

interface Props {
  title: string;
  printViewHref: string;
  children: React.ReactNode;
}

const LivePreview: React.FC<Props> = ({ title, printViewHref, children }) => (
  <aside aria-label={title} className="no-print sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-100">
    <div className="sticky top-0 z-10 flex justify-between items-center px-4 py-2 bg-slate-100/95 backdrop-blur border-b border-slate-200">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      <Link to={printViewHref} className="flex items-center gap-1 text-sm text-accent hover:underline">
        Print view <Maximize2 size={14} />
      </Link>
    </div>
    <div className="p-4">
      <ScaledPage>{children}</ScaledPage>
    </div>
  </aside>
);

const ScaledPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 1, height: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      if (!outer.current || !inner.current) return;
      const scale = Math.min(1, outer.current.clientWidth / inner.current.offsetWidth);
      setSize({ scale, height: inner.current.offsetHeight * scale });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(outer.current!);
    observer.observe(inner.current!);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={outer} className="w-full overflow-hidden" style={{ height: size.height }}>
      <div ref={inner} className="w-max origin-top-left" style={{ transform: `scale(${size.scale})` }}>
        {children}
      </div>
    </div>
  );
};

export default LivePreview;
