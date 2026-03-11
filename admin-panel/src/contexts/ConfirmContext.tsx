import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Loader2 } from 'lucide-react';

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
    } catch (e) {
      // toast is usually handled by the caller
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
      <AnimatePresence>
        {pending && (
          <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none"
          >
            {/* Backdrop solo si se quiere bloquear, pero el diseño original no bloqueaba */}
            {/* Si queremos que se sienta fluido y no bloquee, quitamos el backdrop */}

            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="w-full max-w-lg mx-4 bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-blue-50 p-5 flex flex-col sm:flex-row items-center gap-4 pointer-events-auto mb-20 sm:mb-0 relative overflow-hidden"
            >
              {/* Progress bar overlay when busy */}
              {busy && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, ease: 'linear' }}
                  className="absolute bottom-0 left-0 h-1 bg-blue-500/20"
                />
              )}

              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500">
                <HelpCircle size={24} />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-black text-slate-800 leading-snug">
                  {pending.message}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Confirma para continuar</p>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  className="flex-1 sm:flex-none min-h-[48px] px-6 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-500 rounded-2xl text-xs font-black transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={busy}
                  className="flex-1 sm:flex-none min-h-[48px] px-8 bg-[#2563EB] hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};
