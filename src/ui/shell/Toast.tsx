import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { X } from 'lucide-react';

export type Notify = (message: string, onUndo?: () => void) => void;

const TOAST_MS = 6000;

const ToastContext = createContext<Notify>(() => {});

export const useToast = () => useContext(ToastContext);

interface Toast {
  id: number;
  message: string;
  onUndo?: () => void;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<Toast | null>(null);
  const notify = useCallback<Notify>((message, onUndo) => setToast({ id: Date.now(), message, onUndo }), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div role="status" aria-label="Notifications" className="no-print fixed bottom-4 inset-x-4 z-50 flex justify-center pointer-events-none">
        {toast && (
          <div key={toast.id} className="pointer-events-auto flex items-center gap-4 rounded-xl bg-slate-900 pl-4 pr-2 py-2 text-sm text-white shadow-lg">
            <span>{toast.message}</span>
            {toast.onUndo && (
              <button
                onClick={() => {
                  toast.onUndo?.();
                  setToast(null);
                }}
                className="rounded-lg px-2 py-1 font-semibold text-sky-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Undo
              </button>
            )}
            <button
              onClick={() => setToast(null)}
              aria-label="Dismiss"
              className="rounded-lg p-1 text-slate-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
};
