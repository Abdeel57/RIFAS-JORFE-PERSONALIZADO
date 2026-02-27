import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmContext';
import { adminService } from '../services/admin.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toString().padStart(3, '0');
const fmtTime = (d: string) => {
  const dt = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH}h`;
  return dt.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

const phoneToWA = (phone: string) => phone.replace(/\D/g, '');

// ─── Proof Viewer Modal ───────────────────────────────────────────────────────

const ProofViewerModal = ({
  purchase,
  onClose,
  onPay,
  onRelease,
  paying,
}: {
  purchase: any;
  onClose: () => void;
  onPay: (id: string) => void;
  onRelease: (id: string) => void;
  paying: string | null;
}) => {
  const isPaid = purchase.status === 'paid';
  const isCancelled = purchase.status === 'cancelled';

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm max-h-[90dvh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800">Comprobante de Pago</h3>
            <p className="text-xs text-slate-500">{purchase.user?.name}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 min-w-[44px] min-h-[44px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full flex items-center justify-center text-slate-500 transition-colors text-sm font-bold touch-manipulation">✕</button>
        </div>

        <div className="bg-slate-50 overflow-auto max-h-[50dvh]">
          {purchase.paymentProofUrl ? (
            <img
              src={purchase.paymentProofUrl}
              alt="Comprobante de pago"
              className="w-full h-auto object-contain"
            />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium">Sin comprobante adjunto</p>
            </div>
          )}
        </div>

        {!isPaid && !isCancelled && (
          <div className="p-4 pb-safe flex gap-2">
            <button
              onClick={() => onRelease(purchase.id)}
              className="flex-1 min-h-[44px] py-3 bg-slate-100 hover:bg-red-50 active:bg-red-100 text-slate-500 rounded-xl text-xs font-black transition-all uppercase tracking-wide touch-manipulation"
            >
              Rechazar
            </button>
            <button
              onClick={() => onPay(purchase.id)}
              disabled={paying === purchase.id}
              className="flex-[2] min-h-[44px] py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all uppercase tracking-wide shadow-sm shadow-emerald-200 disabled:opacity-60 touch-manipulation"
            >
              {paying === purchase.id ? 'Procesando...' : '✓ Confirmar Pago'}
            </button>
          </div>
        )}
        {(isPaid || isCancelled) && (
          <div className="p-4">
            <div className={`text-center py-2 rounded-xl text-xs font-black uppercase tracking-wide ${isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              {isPaid ? '✓ Pago Confirmado' : 'Orden Liberada'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Order Card ───────────────────────────────────────────────────────────────

const OrderCard = ({
  purchase,
  onPay,
  onRelease,
  onEdit,
  paying,
}: {
  purchase: any;
  onPay: (id: string) => void;
  onRelease: (id: string) => void;
  onEdit: (p: any) => void;
  paying: string | null;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tickets: number[] = purchase.tickets?.map((t: any) => t.number) ?? [];
  const visibleTickets = expanded ? tickets : tickets.slice(0, 5);
  const hasMore = tickets.length > 5;
  const isPaid = purchase.status === 'paid';
  const isCancelled = purchase.status === 'cancelled';
  const hasProof = !!purchase.paymentProofUrl;
  const verStatus = purchase.verificationStatus as string | undefined;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const waMessage = encodeURIComponent(
    `Hola ${purchase.user?.name ?? ''}, confirmamos que tu pago ha sido registrado. Boletos: ${tickets.map(n => `#${fmt(n)}`).join(', ')} — Rifas NAO 🎟️`
  );
  const waLink = `https://wa.me/${phoneToWA(purchase.user?.phone ?? '')}?text=${waMessage}`;

  const trackMessage = encodeURIComponent(
    `Hola ${purchase.user?.name ?? ''}, te informamos que tu pago está siendo verificado. En breve recibirás confirmación. Boletos: ${tickets.map(n => `#${fmt(n)}`).join(', ')} — Rifas NAO 🎟️`
  );
  const trackLink = `https://wa.me/${phoneToWA(purchase.user?.phone ?? '')}?text=${trackMessage}`;

  return (
    <>
      <div
        className={`list-card relative transition-all duration-300 ${isPaid ? 'opacity-60' : isCancelled ? 'opacity-40' : ''
          } ${menuOpen ? 'z-50 overflow-visible' : ''}`}
      >
        {/* LEFT accent bar by status */}
        <div
          className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${isPaid ? 'bg-emerald-400' : isCancelled ? 'bg-slate-300' : 'bg-amber-400'
            }`}
        />

        <div className="flex items-start gap-3 pl-3">
          {/* Main info */}
          <div className="flex-1 min-w-0">
            {/* Row 1: name + time */}
            <div className="flex items-center gap-2 justify-between">
              <p className="font-black text-slate-800 text-sm truncate">{purchase.user?.name ?? '—'}</p>
              <span className="text-[10px] text-slate-400 flex-shrink-0">{fmtTime(purchase.createdAt)}</span>
            </div>

            {/* Row 2: phone */}
            <p className="text-[11px] text-slate-400">{purchase.user?.phone ?? ''}</p>

            {/* Row 3: raffle */}
            <p className="text-[11px] font-semibold text-indigo-600 truncate mt-0.5">{purchase.raffle?.title ?? ''}</p>

            {/* Row 4: ticket chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {visibleTickets.map((n: number) => (
                <span
                  key={n}
                  className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-black text-slate-700"
                >
                  #{fmt(n)}
                </span>
              ))}
              {hasMore && !expanded && (
                <button
                  onClick={() => setExpanded(true)}
                  className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[11px] font-black text-indigo-500 hover:bg-indigo-100 transition-colors"
                >
                  +{tickets.length - 5} más
                </button>
              )}
              {expanded && hasMore && (
                <button
                  onClick={() => setExpanded(false)}
                  className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-black text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  Ver menos
                </button>
              )}
            </div>

            {/* Row 5: total + proof badge */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <p className="text-base font-black text-slate-800">${(purchase.totalAmount ?? 0).toLocaleString()}</p>
                {/* Comprobante badge */}
                <button
                  onClick={() => setShowProof(true)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${hasProof
                    ? 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                    }`}
                  title={hasProof ? 'Ver comprobante' : 'Sin comprobante'}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {hasProof ? 'Comprobante' : 'Sin foto'}
                </button>
              </div>
              {/* Verification Status Badge */}
              {verStatus === 'auto_verified' && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  Banxico ✓
                </span>
              )}
              {verStatus === 'pending_manual' && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  Revisar
                </span>
              )}
              {verStatus === 'pending_verification' && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-[10px] font-black">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Verificando
                </span>
              )}
              {isPaid && <span className="badge-green">Pagado</span>}
              {isCancelled && <span className="badge-red">Liberado</span>}
            </div>
          </div>

          {/* Action buttons column */}
          <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
            {/* PAY button — primary, most important */}
            {!isPaid && !isCancelled && (
              <button
                onClick={() => onPay(purchase.id)}
                disabled={paying === purchase.id}
                className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-sm shadow-emerald-200 disabled:opacity-60 touch-manipulation"
              >
                {paying === purchase.id ? (
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                Pago
              </button>
            )}

            {/* RELEASE button - touch target 44px */}
            {!isPaid && !isCancelled && (
              <button
                onClick={() => onRelease(purchase.id)}
                className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 bg-slate-100 hover:bg-red-50 active:bg-red-100 hover:text-red-500 text-slate-500 rounded-xl text-xs font-bold transition-all touch-manipulation"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Liberar
              </button>
            )}

            {/* OPTIONS button - menú abre hacia arriba para no taparse con la orden de abajo */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-3 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 rounded-xl text-xs font-bold transition-all touch-manipulation"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                </svg>
                Opciones
              </button>

              {menuOpen && (
                <div className="absolute right-0 bottom-full mb-1 w-52 min-w-[200px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[100]">
                  <button
                    onClick={() => { onEdit(purchase); setMenuOpen(false); }}
                    className="flex items-center gap-3 w-full min-h-[44px] px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
                  >
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Editar
                  </button>
                  <div className="border-t border-slate-50" />
                  <button
                    onClick={() => { setShowProof(true); setMenuOpen(false); }}
                    className="flex items-center gap-3 w-full min-h-[44px] px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
                  >
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Ver comprobante
                  </button>
                  <div className="border-t border-slate-50" />
                  <a
                    href={trackLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 w-full min-h-[44px] px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
                  >
                    <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.12 1.2 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.95-.95a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.9v2.02z" />
                    </svg>
                    Enviar seguimiento
                  </a>
                  <div className="border-t border-slate-50" />
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 w-full min-h-[44px] px-4 py-3 text-sm font-semibold text-[#25D366] hover:bg-green-50 active:bg-green-100 transition-colors touch-manipulation"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884 0 2.225.569 3.846 1.613 5.385l-.991 3.62 3.867-.996z" />
                    </svg>
                    Chat WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Proof Viewer Modal */}
      {showProof && (
        <ProofViewerModal
          purchase={purchase}
          onClose={() => setShowProof(false)}
          onPay={onPay}
          onRelease={onRelease}
          paying={paying}
        />
      )}
    </>
  );
};

// ─── Edit Modal (lightweight) ─────────────────────────────────────────────────

const EditModal = ({
  purchase,
  onClose,
  onSave,
}: {
  purchase: any;
  onClose: () => void;
  onSave: (id: string, status: 'pending' | 'paid' | 'cancelled') => void;
}) => {
  const { showConfirm } = useConfirm();
  const [status, setStatus] = useState<'pending' | 'paid' | 'cancelled'>(purchase.status);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    showConfirm({
      message: '¿Guardar cambios?',
      onConfirm: async () => {
        setSaving(true);
        try {
          await onSave(purchase.id, status);
          onClose();
        } finally {
          setSaving(false);
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-sm max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-black text-slate-800">Editar Orden</h3>
          <button onClick={onClose} className="w-10 h-10 min-w-[44px] min-h-[44px] shrink-0 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full flex items-center justify-center text-slate-500 text-sm touch-manipulation">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="admin-card p-4 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</p>
            <p className="font-bold text-slate-800">{purchase.user?.name}</p>
            <p className="text-sm text-slate-500">{purchase.user?.phone}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Estado</label>
            <div className="grid grid-cols-3 gap-2">
              {(['pending', 'paid', 'cancelled'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-3 rounded-xl text-xs font-black transition-all ${status === s
                    ? s === 'paid' ? 'bg-emerald-500 text-white shadow-sm' : s === 'cancelled' ? 'bg-red-400 text-white shadow-sm' : 'bg-amber-400 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500'
                    }`}
                >
                  {s === 'paid' ? 'Pagado' : s === 'cancelled' ? 'Liberado' : 'Pendiente'}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || status === purchase.status}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-3.5 rounded-xl text-sm transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'pending', label: 'Pendientes', color: 'bg-amber-500' },
  { key: 'all', label: 'Todas', color: 'bg-slate-400' },
  { key: 'paid', label: 'Pagadas', color: 'bg-emerald-500' },
] as const;

const Dashboard = () => {
  const { showConfirm } = useConfirm();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all' | 'paid'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);

  const load = async (f: typeof filter) => {
    setIsLoading(true);
    try {
      const params = f === 'all' ? {} : { status: f };
      const data = await adminService.getPurchases(params);
      // sort: newest first
      setPurchases((data ?? []).sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(filter); }, [filter]);

  const handlePay = (id: string) => {
    showConfirm({
      message: '¿Confirmar pago?',
      onConfirm: async () => {
        setPaying(id);
        try {
          await adminService.updatePurchaseStatus(id, 'paid');
          setPurchases(prev =>
            prev.map(p => p.id === id ? { ...p, status: 'paid' } : p)
          );
          toast.success('Pago confirmado');
        } catch (e: any) {
          toast.error(e.response?.data?.error || 'Error al actualizar el pago');
          throw e;
        } finally {
          setPaying(null);
        }
      },
    });
  };

  const handleRelease = (id: string) => {
    showConfirm({
      message: '¿Liberar (cancelar) esta orden y devolver los boletos?',
      onConfirm: async () => {
        try {
          await adminService.updatePurchaseStatus(id, 'cancelled');
          setPurchases(prev =>
            prev.map(p => p.id === id ? { ...p, status: 'cancelled' } : p)
          );
          toast.success('Orden liberada');
        } catch (e: any) {
          toast.error(e.response?.data?.error || 'Error al liberar la orden');
          throw e;
        }
      },
    });
  };

  const handleEditSave = async (id: string, status: 'pending' | 'paid' | 'cancelled') => {
    try {
      await adminService.updatePurchaseStatus(id, status);
      setPurchases(prev =>
        prev.map(p => p.id === id ? { ...p, status } : p)
      );
      setEditTarget(null);
      toast.success('Cambios guardados');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al actualizar');
      throw e;
    }
  };

  const pendingCount = purchases.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="section-title">Órdenes</h2>
          <p className="section-sub">Marcá los pagos recibidos</p>
        </div>
        {pendingCount > 0 && filter === 'pending' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-xs font-black text-amber-600">{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${filter === f.key
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="w-10 h-10 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Cargando órdenes...</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="admin-card p-12 flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-slate-500 font-semibold text-sm">
            {filter === 'pending' ? '¡Todo al día! Sin pendientes 🎉' : 'No hay órdenes aquí'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map(purchase => (
            <OrderCard
              key={purchase.id}
              purchase={purchase}
              onPay={handlePay}
              onRelease={handleRelease}
              onEdit={setEditTarget}
              paying={paying}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          purchase={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};

export default Dashboard;
