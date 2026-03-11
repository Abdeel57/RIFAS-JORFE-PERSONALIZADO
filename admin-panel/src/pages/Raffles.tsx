import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useConfirm } from '../contexts/ConfirmContext';
import { adminService } from '../services/admin.service';
import { useAuth } from '../hooks/useAuth';
import Skeleton from '../components/Skeleton';
import {
  Plus, Pencil, Trash2, Ticket, ChevronRight, X, ArrowLeft,
  Image, DollarSign, Calendar, Hash, FileText, Video, CheckCircle2, Loader2, Upload,
  MoreVertical, Trophy, Sliders, FileSpreadsheet, Download, RefreshCw, Save,
  Dice5, UserCheck, Play, RotateCcw, AlertCircle, Sparkles
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  title: string;
  subtitle: string;
  description: string;
  prizeImage: string;
  galleryImages: string;
  videoUrl: string;
  ticketPrice: string;
  totalTickets: string;
  drawDate: string;
  status: 'active' | 'completed' | 'draft';
}

type WizardStep = 'info' | 'media' | 'config';

const EMPTY_FORM: FormData = {
  title: '', subtitle: '', description: '',
  prizeImage: '', galleryImages: '', videoUrl: '',
  ticketPrice: '', totalTickets: '',
  drawDate: '', status: 'draft',
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const steps: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
  { id: 'info', label: 'General', icon: <FileText size={14} /> },
  { id: 'media', label: 'Multimedia', icon: <Video size={14} /> },
  { id: 'config', label: 'Finalizar', icon: <Sliders size={14} /> },
];

const StepBar: React.FC<{ current: WizardStep }> = ({ current }) => {
  const idx = steps.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-0 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
      {steps.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className={`flex items-center gap-1.5 flex-1 ${i < steps.length - 1 ? '' : 'justify-end'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all text-xs font-black
                ${done ? 'bg-emerald-500 text-white' : active ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-200' : 'bg-slate-200 text-slate-400'}`}>
                {done ? <CheckCircle2 size={14} /> : step.icon}
              </div>
              <span className={`text-[10px] font-bold hidden sm:block ${active ? 'text-[#2563EB]' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 rounded-full transition-all ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Image upload field ───────────────────────────────────────────────────────

const ImageField: React.FC<{
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  required?: boolean;
}> = ({ label, hint, value, onChange, onUpload, uploading, required }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
      </div>

      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            <div className="relative rounded-[1.5rem] overflow-hidden border border-slate-100 bg-slate-50 shadow-inner group aspect-video">
              <img src={value} alt="preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={e => (e.currentTarget.style.display = 'none')} />
              <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 min-h-[44px] bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-slate-200">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {uploading ? 'PROCESANDO...' : 'CAMBIAR'}
              </button>
              <button type="button" onClick={() => onChange('')}
                className="min-h-[44px] px-4 bg-red-50 hover:bg-red-100 active:scale-95 text-red-500 rounded-xl transition-all border border-red-100/50 shadow-sm">
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="w-full aspect-video border-2 border-dashed border-slate-100 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50 group active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              {uploading ? (
                <Loader2 size={20} className="animate-spin text-blue-500" />
              ) : (
                <Plus size={22} className="text-slate-300" />
              )}
            </div>
            <div className="text-center">
              <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                {uploading ? 'Subiendo...' : 'Agregar Imagen'}
              </span>
              <span className="text-[10px] font-bold text-slate-300">Formato: 16:9</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }}
        disabled={uploading} />
    </div>
  );
};


// ─── Main Component ───────────────────────────────────────────────────────────

const Raffles = () => {
  const { admin } = useAuth();
  const { showConfirm } = useConfirm();
  const [raffles, setRaffles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRaffle, setEditingRaffle] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [uploadingImage, setUploadingImage] = useState<'prize' | 'gallery0' | 'gallery1' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('info');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // New States for Ticket View & Winner
  const [viewingTicketsRaffle, setViewingTicketsRaffle] = useState<any>(null);
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [winnerTarget, setWinnerTarget] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState(1000);
  const [winnerModalRaffle, setWinnerModalRaffle] = useState<any>(null);
  const [winnerMethod, setWinnerMethod] = useState<'manual' | 'random' | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rouletteWinner, setRouletteWinner] = useState<any>(null);

  // Reiniciar contador al buscar para mantener fluidez
  useEffect(() => {
    setVisibleCount(1000);
  }, [ticketSearch]);

  const handleStartRoulette = async () => {
    if (!winnerModalRaffle) return;
    const soldTickets = ticketsList.filter(t => t.status === 'sold');

    if (soldTickets.length === 0) {
      toast.error('No hay boletos pagados');
      return;
    }

    setIsRolling(true);
    setRouletteWinner(null);

    let iterations = 0;
    const maxIterations = 30;
    let delay = 60;

    const roll = () => {
      const randomIdx = Math.floor(Math.random() * soldTickets.length);
      setRouletteWinner(soldTickets[randomIdx]);
      iterations++;

      if (iterations < maxIterations) {
        // Efecto de frenado (Easing)
        if (iterations > 20) delay += 60;
        else if (iterations > 12) delay += 20;

        setTimeout(roll, delay);
      } else {
        setIsRolling(false);
        toast.success('¡Tenemos un ganador!', { icon: '🏆' });
      }
    };

    roll();
  };

  const confirmWinnerFinal = async (ticket: any) => {
    showConfirm({
      message: `¿DECLARAR OFICIALMENTE al boleto #${ticket.number} (${ticket.purchase?.user?.name}) como GANADOR? Esta acción cerrará la rifa permanentemente.`,
      onConfirm: async () => {
        try {
          await adminService.updateRaffle(ticket.raffleId, {
            status: 'completed',
            description: `${formData.description}\n\n🏆 GANADOR OFICIAL: ${ticket.purchase.user.name} (Boleto #${ticket.number})\nFecha del sorteo: ${new Date().toLocaleDateString()}`
          });
          toast.success('¡Rifa finalizada y ganador registrado!');
          setWinnerModalRaffle(null);
          setRouletteWinner(null);
          setWinnerMethod(null);
          loadRaffles();
        } catch (e) {
          toast.error('Error al finalizar la rifa');
        }
      }
    });
  };

  // Lock scroll when modal is open
  useEffect(() => {
    if (isModalOpen || viewingTicketsRaffle || winnerTarget || winnerModalRaffle) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none'; // Evitar scroll lateral en móviles
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
  }, [isModalOpen, viewingTicketsRaffle, winnerTarget, winnerModalRaffle]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClick = () => setOpenDropdown(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Ocultar la barra de navegación inferior cuando el modal está abierto
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => { document.body.classList.remove('modal-open'); };
  }, [isModalOpen]);

  useEffect(() => { loadRaffles(); }, []);

  const loadRaffles = async () => {
    try {
      const data = await adminService.getRaffles();
      setRaffles(data);
    } catch { /* silently */ }
    finally { setIsLoading(false); }
  };

  const handleOpenModal = (raffle?: any) => {
    if (raffle) {
      setEditingRaffle(raffle);
      setFormData({
        title: raffle.title,
        subtitle: raffle.subtitle || '',
        description: raffle.description,
        prizeImage: raffle.prizeImage,
        galleryImages: Array.isArray(raffle.galleryImages) ? raffle.galleryImages.join('\n') : '',
        videoUrl: raffle.videoUrl || '',
        ticketPrice: raffle.ticketPrice.toString(),
        totalTickets: raffle.totalTickets.toString(),
        drawDate: raffle.drawDate ? new Date(raffle.drawDate).toISOString().slice(0, 16) : '',
        status: raffle.status,
      });
    } else {
      setEditingRaffle(null);
      setFormData(EMPTY_FORM);
    }
    setWizardStep('info');
    setIsModalOpen(true);
  };

  const handleClose = () => { setIsModalOpen(false); setEditingRaffle(null); };

  const set = (field: keyof FormData, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    showConfirm({
      message: editingRaffle ? '¿Guardar cambios en esta rifa?' : '¿Crear esta nueva rifa?',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          const submitData = {
            ...formData,
            ticketPrice: parseFloat(formData.ticketPrice),
            totalTickets: parseInt(formData.totalTickets),
            galleryImages: formData.galleryImages.split('\n').filter(u => u.trim()),
            drawDate: new Date(formData.drawDate).toISOString(),
          };
          if (editingRaffle) {
            await adminService.updateRaffle(editingRaffle.id, submitData);
            toast.success('✅ Rifa actualizada correctamente');
          } else {
            await adminService.createRaffle(submitData);
            toast.success('✅ Rifa creada correctamente');
          }
          handleClose();
          loadRaffles();
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Error al guardar la rifa');
        } finally { setIsSaving(false); }
      },
    });
  };

  const handleDelete = (id: string, title: string) => {
    showConfirm({
      message: `¿Eliminar la rifa "${title}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        const previousRaffles = [...raffles];
        setRaffles(prev => prev.filter(r => r.id !== id)); // Optimistic delete
        try {
          await adminService.deleteRaffle(id);
          toast.success('Rifa eliminada');
        } catch (error: any) {
          setRaffles(previousRaffles); // Rollback
          toast.error(error.response?.data?.error || 'Error al eliminar');
        }
      },
    });
  };

  const handleImageUpload = async (field: 'prize' | 'gallery0' | 'gallery1', file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes (JPG, PNG, WebP)'); return; }
    setUploadingImage(field);
    try {
      const { url } = await adminService.uploadImage(file);
      if (field === 'prize') {
        set('prizeImage', url);
      } else {
        const lines = formData.galleryImages.split('\n');
        lines[field === 'gallery0' ? 0 : 1] = url;
        set('galleryImages', lines.join('\n'));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al subir la imagen');
    } finally { setUploadingImage(null); }
  };

  const canGoNext = () => {
    if (wizardStep === 'info') return formData.title.trim() && formData.description.trim();
    if (wizardStep === 'media') return !!formData.prizeImage.trim();
    return true;
  };

  const nextStep = () => {
    if (wizardStep === 'info') setWizardStep('media');
    else if (wizardStep === 'media') setWizardStep('config');
  };

  const prevStep = () => {
    if (wizardStep === 'config') setWizardStep('media');
    else if (wizardStep === 'media') setWizardStep('info');
  };

  const canSubmit = () => formData.title && formData.description && formData.prizeImage && formData.ticketPrice && formData.totalTickets && formData.drawDate;

  // ─── Tickets Logic ────────────────────────────────────────────────────────
  const loadTickets = async (raffleId: string) => {
    setIsLoadingTickets(true);
    setVisibleCount(1000); // Reset count on load
    try {
      const data = await adminService.getTickets({ raffleId });
      setTicketsList(data);
    } catch (e) {
      toast.error('Error al cargar boletos');
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleSetWinner = async (ticket: any) => {
    showConfirm({
      message: `¿Confirmar al boleto #${ticket.number} (${ticket.purchase?.user?.name}) como GANADOR de esta rifa?`,
      onConfirm: async () => {
        try {
          // Nota: El backend asume que marcamos la rifa como completada y guardamos al ganador
          // Por ahora simulamos el éxito o usamos un endpoint si existe. 
          // Ajustado según el esquema: Actualizamos la rifa a completada y quizás una nota.
          await adminService.updateRaffle(ticket.raffleId, {
            status: 'completed',
            description: ticket.purchase?.user?.name ? `${formData.description}\n\n🏆 GANADOR: ${ticket.purchase.user.name} (Boleto #${ticket.number})` : formData.description
          });
          toast.success('¡Ganador registrado y rifa completada!');
          setWinnerTarget(null);
          setViewingTicketsRaffle(null);
          loadRaffles();
        } catch (e) {
          toast.error('Error al registrar ganador');
        }
      }
    });
  };

  const filteredTickets = ticketsList.filter(t => {
    if (!ticketSearch) return true;
    const s = ticketSearch.toLowerCase();
    return t.number.toString().includes(s) ||
      t.purchase?.user?.name?.toLowerCase().includes(s) ||
      t.purchase?.user?.phone?.includes(s);
  });

  const handleExportExcel = () => {
    if (!ticketsList.length) return;

    const soldTickets = ticketsList.filter(t => t.status === 'sold');
    if (!soldTickets.length) {
      toast.error('No hay boletos pagados para exportar');
      return;
    }

    const data = soldTickets.map(t => ({
      'Boleto': `#${t.number}`,
      'Cliente': t.purchase?.user?.name || '—',
      'Teléfono': t.purchase?.user?.phone || '—',
      'Estado': 'PAGADO',
      'Fecha Compra': t.purchase?.createdAt ? new Date(t.purchase.createdAt).toLocaleDateString() : '—',
      'Método': t.purchase?.paymentMethod || '—'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Boletos Pagados");
    XLSX.writeFile(wb, `Boletos_Pagados_${viewingTicketsRaffle?.title.substring(0, 25).replace(/\s+/g, '_')}.xlsx`);
    toast.success('Excel generado correctamente');
  };

  // ─── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Rifas</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {isLoading ? 'Cargando...' : raffles.length === 0 ? 'Sin rifas aún' : `${raffles.length} rifa${raffles.length !== 1 ? 's' : ''} registrada${raffles.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 active:scale-95 text-white font-black rounded-2xl text-sm transition-all shadow-md shadow-blue-200">
          <Plus size={18} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nueva Rifa</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* Main content */}
      <div className="space-y-3">
        {isLoading ? (
          <Skeleton count={3} className="h-64 w-full" />
        ) : (
          <AnimatePresence mode="popLayout">
            {raffles.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center">
                  <Ticket size={36} className="text-blue-300" />
                </div>
                <div className="text-center">
                  <p className="font-black text-slate-700 text-lg">Sin rifas aún</p>
                  <p className="text-sm text-slate-400 mt-1">Crea tu primera rifa para comenzar</p>
                </div>
                <button onClick={() => handleOpenModal()}
                  className="btn-primary flex items-center gap-2 px-6">
                  <Plus size={16} /> Crear primera rifa
                </button>
              </motion.div>
            ) : (
              <LayoutGroup>
                {raffles.map((raffle) => {
                  const sold = raffle._count?.tickets || 0;
                  const progress = Math.round((sold / raffle.totalTickets) * 100);
                  const isActive = raffle.status === 'active';
                  const revenue = sold * raffle.ticketPrice;
                  return (
                    <motion.div
                      key={raffle.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      {/* Image header */}
                      {raffle.prizeImage && (
                        <div className="relative h-32 bg-slate-100 overflow-hidden">
                          <img src={raffle.prizeImage} alt={raffle.title}
                            className="w-full h-full object-cover"
                            onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${raffle.status === 'active' ? 'bg-emerald-500 text-white border-emerald-400' :
                            raffle.status === 'draft' ? 'bg-slate-900/80 text-white border-white/20 backdrop-blur-md' :
                              'bg-slate-700 text-slate-200 border-slate-600'
                            }`}>
                            {raffle.status === 'active' ? '● Activa' :
                              raffle.status === 'draft' ? '✎ Borrador' :
                                '○ Completada'}
                          </span>
                        </div>
                      )}

                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-800 text-base leading-tight truncate">{raffle.title}</p>
                            {raffle.subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{raffle.subtitle}</p>}
                          </div>
                          {!raffle.prizeImage && (
                            <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${raffle.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                              raffle.status === 'draft' ? 'bg-slate-100 text-slate-900 border-slate-200' :
                                'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                              {raffle.status === 'active' ? 'Activa' :
                                raffle.status === 'draft' ? 'Borrador' :
                                  'Completada'}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Precio', value: `$${raffle.ticketPrice}` },
                            { label: 'Boletos', value: `${sold.toLocaleString()}/${raffle.totalTickets.toLocaleString()}` },
                            { label: 'Recaudado', value: `$${revenue.toLocaleString()}` },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-slate-50 rounded-xl px-2.5 py-2 text-center">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                              <p className="text-xs font-black text-slate-700 mt-0.5 truncate">{value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>{progress}% vendido</span>
                            <span>Sorteo: {new Date(raffle.drawDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(progress, 100)}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className={`h-full rounded-full ${progress >= 80 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1 relative">
                          <button onClick={() => handleOpenModal(raffle)}
                            className="flex-1 flex items-center justify-center gap-2 min-h-[44px] px-3 py-2.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-[#2563EB] rounded-xl text-sm font-bold transition-all">
                            <Pencil size={14} /> Editar
                          </button>

                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(openDropdown === raffle.id ? null : raffle.id);
                              }}
                              className="flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 rounded-xl text-sm font-bold transition-all"
                            >
                              <MoreVertical size={16} />
                            </button>

                            <AnimatePresence>
                              {openDropdown === raffle.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 overflow-hidden"
                                >
                                  <button
                                    onClick={() => {
                                      setViewingTicketsRaffle(raffle);
                                      loadTickets(raffle.id);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                  >
                                    <Ticket size={16} className="text-blue-500" /> Ver boletos
                                  </button>
                                  <button
                                    onClick={() => {
                                      setWinnerModalRaffle(raffle);
                                      loadTickets(raffle.id);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                  >
                                    <Trophy size={16} className="text-amber-500" /> Ganador
                                  </button>
                                  {admin?.role === 'admin' && (
                                    <div className="border-t border-slate-50 mt-1 pt-1">
                                      <button
                                        onClick={() => handleDelete(raffle.id, raffle.title)}
                                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                      >
                                        <Trash2 size={16} /> Eliminar
                                      </button>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </LayoutGroup>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0.5, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '100%', opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.8 }}
              className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden relative z-10 border border-white/20"
            >
              {/* Modal Header */}
              <div className="flex items-center gap-4 px-6 pt-6 pb-2 shrink-0">
                {wizardStep !== 'info' ? (
                  <button onClick={prevStep}
                    className="w-11 h-11 bg-slate-50 hover:bg-slate-100 active:scale-90 rounded-2xl flex items-center justify-center text-slate-400 transition-all flex-shrink-0 group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <div className="w-11 h-11 flex-shrink-0 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <Trophy size={20} className="text-[#2563EB]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
                    {editingRaffle ? 'Editar Rifa' : 'Nueva Rifa'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                      Paso {steps.findIndex(s => s.id === wizardStep) + 1} de {steps.length}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">
                      {steps.find(s => s.id === wizardStep)?.label}
                    </span>
                  </div>
                </div>
                <button onClick={handleClose}
                  className="w-11 h-11 bg-slate-50 hover:bg-slate-100 active:scale-90 rounded-2xl flex items-center justify-center text-slate-400 transition-all flex-shrink-0">
                  <X size={20} />
                </button>
              </div>

              <StepBar current={wizardStep} />

              <div className="flex-1 overflow-y-auto overscroll-contain">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={wizardStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-5"
                  >
                    {/* Step 1: Información General y Configuración Base */}
                    {wizardStep === 'info' && (
                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Título del Premio <span className="text-red-400">*</span>
                          </label>
                          <input type="text" value={formData.title}
                            onChange={e => set('title', e.target.value)}
                            required className="admin-input font-bold text-lg"
                            placeholder="Ej. GANA $50,000 EN EFECTIVO" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio Boleto</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                              <input type="number" value={formData.ticketPrice}
                                onChange={e => set('ticketPrice', e.target.value)}
                                className="admin-input pl-8 font-black" placeholder="50" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Boletos</label>
                            <input type="number" value={formData.totalTickets}
                              onChange={e => set('totalTickets', e.target.value)}
                              className="admin-input font-black" placeholder="1000" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha del Sorteo</label>
                          <div className="relative">
                            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input type="datetime-local" value={formData.drawDate}
                              onChange={e => set('drawDate', e.target.value)}
                              className="admin-input pl-11" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subtítulo (opcional)</label>
                          <input type="text" value={formData.subtitle}
                            onChange={e => set('subtitle', e.target.value)}
                            className="admin-input" placeholder="Ej. BILLETIZA EXPRESS" />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción Breve</label>
                          <textarea value={formData.description}
                            onChange={e => set('description', e.target.value)}
                            required rows={4} className="admin-input resize-none text-xs font-medium leading-relaxed"
                            placeholder="Describe los detalles del sorteo..." />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Medios y Video */}
                    {wizardStep === 'media' && (
                      <div className="space-y-5">
                        <ImageField
                          label="Imagen Principal (Requerida)"
                          value={formData.prizeImage}
                          onChange={url => set('prizeImage', url)}
                          onUpload={f => handleImageUpload('prize', f)}
                          uploading={uploadingImage === 'prize'}
                          required
                        />

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Video de Facebook/YouTube (opcional)</label>
                          <div className="relative">
                            <Video size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input type="text" value={formData.videoUrl}
                              onChange={e => set('videoUrl', e.target.value)}
                              className="admin-input pl-11" placeholder="https://facebook.com/watch/..." />
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-5">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Galería Auxiliar</p>
                          <div className="grid grid-cols-2 gap-3">
                            <ImageField
                              label="Foto 1"
                              value={formData.galleryImages.split('\n')[0] || ''}
                              onChange={url => {
                                const lines = formData.galleryImages.split('\n');
                                lines[0] = url;
                                set('galleryImages', lines.join('\n'));
                              }}
                              onUpload={f => handleImageUpload('gallery0', f)}
                              uploading={uploadingImage === 'gallery0'}
                            />
                            <ImageField
                              label="Foto 2"
                              value={formData.galleryImages.split('\n')[1] || ''}
                              onChange={url => {
                                const lines = formData.galleryImages.split('\n');
                                lines[1] = url;
                                set('galleryImages', lines.join('\n'));
                              }}
                              onUpload={f => handleImageUpload('gallery1', f)}
                              uploading={uploadingImage === 'gallery1'}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Estado y Finalizar */}
                    {wizardStep === 'config' && (
                      <div className="space-y-6">
                        <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">
                            <AlertCircle className="text-blue-500" size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-blue-900 leading-tight">Configuración final</p>
                            <p className="text-xs text-blue-700/70 font-medium mt-1">Selecciona el estado inicial de tu rifa antes de guardarla.</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Define el Estado</label>
                          <div className="grid grid-cols-1 gap-3">
                            <button onClick={() => set('status', 'draft')}
                              className={`p-4 rounded-[1.5rem] border-2 transition-all flex items-center justify-between group ${formData.status === 'draft' ? 'bg-slate-900 border-slate-800 text-white shadow-xl translate-y-[-2px]' : 'bg-white border-slate-100 text-slate-500'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.status === 'draft' ? 'bg-white/10' : 'bg-slate-50'}`}>
                                  <FileText size={18} />
                                </div>
                                <div className="text-left">
                                  <p className="font-black text-sm">Borrador</p>
                                  <p className="text-[10px] font-bold opacity-60">No visible para clientes</p>
                                </div>
                              </div>
                              {formData.status === 'draft' && <CheckCircle2 size={20} className="text-blue-400" />}
                            </button>

                            <button onClick={() => set('status', 'active')}
                              className={`p-4 rounded-[1.5rem] border-2 transition-all flex items-center justify-between group ${formData.status === 'active' ? 'bg-blue-600 border-blue-500 text-white shadow-xl translate-y-[-2px]' : 'bg-white border-slate-100 text-slate-500'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.status === 'active' ? 'bg-white/10' : 'bg-blue-50'}`}>
                                  <Play size={18} />
                                </div>
                                <div className="text-left">
                                  <p className="font-black text-sm">Activa</p>
                                  <p className="text-[10px] font-bold opacity-80">Visible y lista para vender</p>
                                </div>
                              </div>
                              {formData.status === 'active' && <CheckCircle2 size={20} className="text-white" />}
                            </button>

                            <button onClick={() => set('status', 'completed')}
                              className={`p-4 rounded-[1.5rem] border-2 transition-all flex items-center justify-between group ${formData.status === 'completed' ? 'bg-emerald-600 border-emerald-500 text-white shadow-xl translate-y-[-2px]' : 'bg-white border-slate-100 text-slate-500'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.status === 'completed' ? 'bg-white/10' : 'bg-emerald-50'}`}>
                                  <Trophy size={18} />
                                </div>
                                <div className="text-left">
                                  <p className="font-black text-sm">Finalizada</p>
                                  <p className="text-[10px] font-bold opacity-80">Sorteo cerrado</p>
                                </div>
                              </div>
                              {formData.status === 'completed' && <CheckCircle2 size={20} className="text-white" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="p-6 border-t border-slate-50 bg-white shrink-0">
                <div className="flex gap-3">
                  <button type="button" onClick={handleClose}
                    className="flex-1 h-14 bg-slate-50 hover:bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95">
                    Cerrar
                  </button>
                  {wizardStep !== 'config' ? (
                    <button type="button" onClick={nextStep} disabled={!canGoNext()}
                      className="flex-[2] flex items-center justify-center gap-2 h-14 bg-[#2563EB] hover:bg-blue-700 active:scale-95 disabled:opacity-40 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-100">
                      Siguiente
                      <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button type="button" onClick={handleSubmit} disabled={!canSubmit() || isSaving}
                      className="flex-[2] flex items-center justify-center gap-2 h-14 bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:opacity-40 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-100">
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      {isSaving ? 'GUARDANDO...' : editingRaffle ? 'GUARDAR' : 'CREAR'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {viewingTicketsRaffle && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingTicketsRaffle(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "100%", opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden border border-white/20"
            >
              <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="min-w-0 pr-2">
                  <h3 className="font-extrabold text-slate-800 tracking-tight leading-none text-base sm:text-lg">Boletería</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate">{viewingTicketsRaffle.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportExcel}
                    className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-sm border border-emerald-100/50"
                    title="Exportar a Excel"
                  >
                    <FileSpreadsheet size={18} />
                  </button>
                  <button
                    onClick={() => setViewingTicketsRaffle(null)}
                    className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 active:scale-95 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="px-4 pr-3 py-3 bg-slate-50/30 border-b border-slate-100 shrink-0">
                <div className="relative">
                  <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar # o cliente..."
                    className="w-full pl-10 pr-4 h-11 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-blue-400 transition-all"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
                {isLoadingTickets ? (
                  <div className="space-y-3 py-10">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="h-14 bg-slate-50 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="py-16 text-center">
                    <Hash size={32} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sin resultados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTickets.slice(0, visibleCount).map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all ${ticket.status === 'sold' ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50/40 border-dashed border-slate-200 opacity-60'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-[11px] border-2 ${ticket.status === 'sold' ? 'bg-blue-50 border-blue-100 text-[#2563EB]' : 'bg-slate-100 border-slate-200 text-slate-400'
                            }`}>
                            #{ticket.number.toString().padStart(Math.max(3, viewingTicketsRaffle.totalTickets.toString().length), '0')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 text-[11px] truncate leading-none">
                              {ticket.purchase?.user?.name || (ticket.status === 'sold' ? '—' : 'Disponible')}
                            </p>
                            {ticket.purchase?.user?.phone && (
                              <p className="text-[9px] font-bold text-slate-400 mt-1">{ticket.purchase.user.phone}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {ticket.status === 'sold' && (
                            <div className="flex flex-col items-end gap-1.2">
                              <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100/50">
                                PAGADO
                              </div>
                            </div>
                          )}
                          {ticket.status === 'available' && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-widest">
                              Libre
                            </span>
                          )}
                          {ticket.status === 'reserved' && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-amber-100/50">
                              Apartado
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {filteredTickets.length > visibleCount && (
                      <button
                        onClick={() => setVisibleCount(prev => prev + 1000)}
                        className="w-full py-4 mt-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl border-2 border-dashed border-slate-200 transition-all active:scale-[0.98]"
                      >
                        Cargar 1,000 boletos más...
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5 border-t border-slate-100 bg-white shadow-inner shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    {Math.min(visibleCount, filteredTickets.length)} / {filteredTickets.length} mostrados
                  </span>
                </div>
                <button
                  onClick={() => setViewingTicketsRaffle(null)}
                  className="px-5 h-10 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-200"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* ── WINNER SELECTION MODAL ─────────────────────────── */}
      {winnerModalRaffle && createPortal(
        <AnimatePresence mode="wait">
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isRolling) setWinnerModalRaffle(null); }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-8 pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="text-amber-500" size={20} />
                    <h3 className="font-extrabold text-slate-800 text-xl tracking-tight">Sorteo de Ganador</h3>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{winnerModalRaffle.title}</p>
                </div>
                {!isRolling && (
                  <button
                    onClick={() => setWinnerModalRaffle(null)}
                    className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              <div className="p-8 pt-4">
                {/* Step 1: Choose Method */}
                {!winnerMethod && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-8">
                    <button
                      onClick={() => setWinnerMethod('random')}
                      className="group p-6 bg-blue-50 hover:bg-[#2563EB] rounded-[2.5rem] border border-blue-100 transition-all text-left flex flex-col gap-4 active:scale-95"
                    >
                      <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Dice5 size={28} className="text-[#2563EB]" />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 group-hover:text-white text-lg">Ruletazo</p>
                        <p className="text-[10px] font-bold text-slate-400 group-hover:text-blue-100 uppercase mt-1">Azar transparente</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setWinnerMethod('manual');
                        setTicketSearch('');
                      }}
                      className="group p-6 bg-emerald-50 hover:bg-emerald-600 rounded-[2.5rem] border border-emerald-100 transition-all text-left flex flex-col gap-4 active:scale-95"
                    >
                      <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <UserCheck size={28} className="text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 group-hover:text-white text-lg">Manual</p>
                        <p className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-100 uppercase mt-1">Elegir un boleto</p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Step 2: Random Roulette */}
                {winnerMethod === 'random' && (
                  <div className="py-6 flex flex-col items-center text-center">
                    <div className="relative mb-8 pt-4">
                      <AnimatePresence mode="wait">
                        {rouletteWinner ? (
                          <motion.div
                            key={rouletteWinner.id}
                            initial={{ scale: 0.8, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 1.2, opacity: 0, y: -10 }}
                            className="w-48 h-48 bg-[#2563EB] rounded-[3rem] shadow-2xl flex flex-col items-center justify-center text-white border-8 border-white group relative"
                          >
                            <div className="absolute -top-4 bg-amber-400 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Ganador</div>
                            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Boleto</p>
                            <h4 className="text-5xl font-black">#{rouletteWinner.number}</h4>
                            <p className="text-xs font-bold text-blue-100 mt-2 truncate max-w-[140px]">{rouletteWinner.purchase?.user?.name || 'Varios'}</p>
                          </motion.div>
                        ) : (
                          <div className="w-48 h-48 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] flex items-center justify-center text-slate-300">
                            <Sparkles size={48} className="animate-pulse" />
                          </div>
                        )}
                      </AnimatePresence>
                    </div>

                    {!isRolling && !rouletteWinner && (
                      <button
                        onClick={handleStartRoulette}
                        className="btn-primary w-full max-w-xs h-14 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest"
                      >
                        <Play size={18} /> Iniciar Ruletazo
                      </button>
                    )}

                    {!isRolling && rouletteWinner && (
                      <div className="flex flex-col gap-3 w-full max-w-xs">
                        <button
                          onClick={() => confirmWinnerFinal(rouletteWinner)}
                          className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={18} /> Confirmar Ganador
                        </button>
                        <button
                          onClick={handleStartRoulette}
                          className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          <RotateCcw size={16} /> Reintentar
                        </button>
                      </div>
                    )}

                    {isRolling && (
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.1s]" />
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.2s]" />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Girando la suerte...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Manual Selection */}
                {winnerMethod === 'manual' && (
                  <div className="py-4 space-y-6">
                    <div className="relative">
                      <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar por # o por nombre..."
                        className="w-full pl-11 pr-4 h-14 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all"
                        value={ticketSearch}
                        onChange={(e) => setTicketSearch(e.target.value)}
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                      {ticketsList.filter(t => t.status === 'sold' && (t.number.toString().includes(ticketSearch) || t.purchase?.user?.name?.toLowerCase().includes(ticketSearch.toLowerCase()))).length === 0 ? (
                        <div className="py-10 text-center text-slate-300">
                          <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
                          <p className="text-xs font-bold uppercase">No se encontraron boletos pagados</p>
                        </div>
                      ) : (
                        ticketsList
                          .filter(t => t.status === 'sold' && (t.number.toString().includes(ticketSearch) || t.purchase?.user?.name?.toLowerCase().includes(ticketSearch.toLowerCase())))
                          .slice(0, 50)
                          .map(t => (
                            <button
                              key={t.id}
                              onClick={() => confirmWinnerFinal(t)}
                              className="w-full p-4 bg-white hover:bg-emerald-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-between transition-all group active:scale-[0.98]"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-xs text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                  #{t.number}
                                </div>
                                <div className="text-left">
                                  <p className="font-black text-slate-800 text-sm group-hover:text-emerald-700">{t.purchase.user.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400">{t.purchase.user.phone}</p>
                                </div>
                              </div>
                              <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 translate-x-0 group-hover:translate-x-1 transition-all" />
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {!isRolling && (
                <div className="p-8 pt-0 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {ticketsList.filter(t => t.status === 'sold').length} Boletos pagados participan
                    </span>
                  </div>
                  {winnerMethod && (
                    <button
                      onClick={() => setWinnerMethod(null)}
                      className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest hover:underline"
                    >
                      Cambiar método
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default Raffles;
