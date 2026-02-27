import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ConfirmOptions = {
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
};

type ConfirmContextType = {
  showConfirm: (opts: ConfirmOptions) => void;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const [busy, setBusy] = useState(false);

  const showConfirm = useCallback((opts: ConfirmOptions) => {
    setPending(opts);
  }, []);

  const handleConfirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await pending.onConfirm();
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    pending?.onCancel?.();
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      {/* Toast de confirmación: aparece desde abajo, NO bloquea, permite navegar */}
      {pending && (
        <div
          className="fixed left-0 right-0 z-[70] px-4 confirm-toast"
          style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center gap-3">
            <p className="flex-1 text-sm font-bold text-slate-800 text-center sm:text-left">
              {pending.message}
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleCancel}
                disabled={busy}
                className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 rounded-xl text-sm font-bold transition-colors touch-manipulation disabled:opacity-50"
              >
                No
              </button>
              <button
                onClick={handleConfirm}
                disabled={busy}
                className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-bold transition-colors touch-manipulation disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {busy ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Guardando…
                  </>
                ) : (
                  'Sí'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
