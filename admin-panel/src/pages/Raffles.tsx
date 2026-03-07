import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmContext';
import { adminService } from '../services/admin.service';
import {
  Plus, Pencil, Trash2, Ticket, ChevronRight, X, ArrowLeft,
  Image, DollarSign, Calendar, Hash, FileText, Video, CheckCircle2, Loader2, Upload
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
  status: 'active' | 'completed';
}

type WizardStep = 'info' | 'media' | 'config';

const EMPTY_FORM: FormData = {
  title: '', subtitle: '', description: '',
  prizeImage: '', galleryImages: '', videoUrl: '',
  ticketPrice: '', totalTickets: '',
  drawDate: '', status: 'active',
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const steps: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
  { id: 'info', label: 'Información', icon: <FileText size={14} /> },
  { id: 'media', label: 'Imágenes', icon: <Image size={14} /> },
  { id: 'config', label: 'Configurar', icon: <DollarSign size={14} /> },
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
                ${done ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'bg-slate-200 text-slate-400'}`}>
                {done ? <CheckCircle2 size={14} /> : step.icon}
              </div>
              <span className={`text-[10px] font-bold hidden sm:block ${active ? 'text-indigo-600' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
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

      {/* Preview */}
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
          <img src={value} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
          <button type="button" onClick={() => onChange('')}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all touch-manipulation">
            <X size={12} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-full aspect-video border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-50">
          {uploading ? (
            <Loader2 size={24} className="animate-spin text-indigo-400" />
          ) : (
            <Upload size={22} className="text-slate-300" />
          )}
          <span className="text-xs font-bold text-slate-400">{uploading ? 'Subiendo...' : 'Toca para subir imagen'}</span>
          <span className="text-[10px] text-slate-300">JPG, PNG, WebP</span>
        </button>
      )}

      {/* URL input */}
      <input type="url" value={value} onChange={e => onChange(e.target.value)}
        placeholder="O pega una URL de imagen..."
        className="admin-input text-xs" style={{ fontSize: 14 }} />

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }}
        disabled={uploading} />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Raffles = () => {
  const { showConfirm } = useConfirm();
  const [raffles, setRaffles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRaffle, setEditingRaffle] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [uploadingImage, setUploadingImage] = useState<'prize' | 'gallery0' | 'gallery1' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('info');

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
        try {
          await adminService.deleteRaffle(id);
          loadRaffles();
          toast.success('Rifa eliminada');
        } catch (error: any) {
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

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Cargando rifas...</p>
      </div>
    );
  }

  // ─── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Rifas</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {raffles.length === 0 ? 'Sin rifas aún' : `${raffles.length} rifa${raffles.length !== 1 ? 's' : ''} registrada${raffles.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-2xl text-sm transition-all active:scale-95 shadow-md shadow-indigo-200 touch-manipulation">
          <Plus size={18} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nueva Rifa</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* Empty state */}
      {raffles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center">
            <Ticket size={36} className="text-indigo-300" />
          </div>
          <div className="text-center">
            <p className="font-black text-slate-700 text-lg">Sin rifas aún</p>
            <p className="text-sm text-slate-400 mt-1">Crea tu primera rifa para comenzar</p>
          </div>
          <button onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2 px-6 touch-manipulation">
            <Plus size={16} /> Crear primera rifa
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {raffles.map((raffle) => {
            const sold = raffle._count?.tickets || 0;
            const progress = Math.round((sold / raffle.totalTickets) * 100);
            const isActive = raffle.status === 'active';
            const revenue = sold * raffle.ticketPrice;
            return (
              <div key={raffle.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Image header */}
                {raffle.prizeImage && (
                  <div className="relative h-32 bg-slate-100 overflow-hidden">
                    <img src={raffle.prizeImage} alt={raffle.title}
                      className="w-full h-full object-cover"
                      onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {/* Status badge on image */}
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${isActive ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-700 text-slate-200 border-slate-600'}`}>
                      {isActive ? '● Activa' : '○ Completada'}
                    </span>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Title + badge (if no image) */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 text-base leading-tight truncate">{raffle.title}</p>
                      {raffle.subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{raffle.subtitle}</p>}
                    </div>
                    {!raffle.prizeImage && (
                      <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {isActive ? 'Activa' : 'Completada'}
                      </span>
                    )}
                  </div>

                  {/* Stats row */}
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

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>{progress}% vendido</span>
                      <span>Sorteo: {new Date(raffle.drawDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' : progress >= 70 ? 'bg-indigo-500' : 'bg-gradient-to-r from-indigo-400 to-violet-500'
                        }`} style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleOpenModal(raffle)}
                      className="flex-1 flex items-center justify-center gap-2 min-h-[44px] px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-600 rounded-xl text-sm font-bold transition-colors touch-manipulation">
                      <Pencil size={14} /> Editar
                    </button>
                    <button onClick={() => handleDelete(raffle.id, raffle.title)}
                      className="flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-500 rounded-xl text-sm font-bold transition-colors touch-manipulation">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL / BOTTOM SHEET ─────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-0 shrink-0">
              {wizardStep !== 'info' ? (
                <button onClick={prevStep}
                  className="w-10 h-10 min-w-[44px] min-h-[44px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl flex items-center justify-center text-slate-600 transition-all touch-manipulation flex-shrink-0">
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Ticket size={18} className="text-indigo-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-slate-800 leading-tight">
                  {editingRaffle ? 'Editar Rifa' : 'Nueva Rifa'}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Paso {steps.findIndex(s => s.id === wizardStep) + 1} de {steps.length}
                </p>
              </div>
              <button onClick={handleClose}
                className="w-10 h-10 min-w-[44px] min-h-[44px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl flex items-center justify-center text-slate-500 transition-all touch-manipulation flex-shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Step bar */}
            <StepBar current={wizardStep} />

            {/* Step content (scrollable) */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

              {/* ── Step 1: Información ── */}
              {wizardStep === 'info' && (
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Título del Premio <span className="text-red-400">*</span>
                    </label>
                    <input type="text" value={formData.title}
                      onChange={e => set('title', e.target.value)}
                      required className="admin-input font-bold text-lg"
                      placeholder="Ej. GANA $50,000 EN EFECTIVO" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtítulo</label>
                    <input type="text" value={formData.subtitle}
                      onChange={e => set('subtitle', e.target.value)}
                      className="admin-input" placeholder="Ej. BILLETIZA EXPRESS" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Descripción Detallada <span className="text-red-400">*</span>
                    </label>
                    <textarea value={formData.description}
                      onChange={e => set('description', e.target.value)}
                      required rows={5} className="admin-input resize-none leading-relaxed"
                      placeholder="Describe el premio con todos los detalles importantes. Mientras más información, más confianza genera." />
                    <p className="text-[10px] text-slate-400 ml-1">{formData.description.length} caracteres</p>
                  </div>
                </div>
              )}

              {/* ── Step 2: Medios ── */}
              {wizardStep === 'media' && (
                <div className="p-5 space-y-5">
                  <ImageField
                    label="Imagen Principal del Premio"
                    hint="Foto del premio. Se muestra en la cabecera de la rifa."
                    value={formData.prizeImage}
                    onChange={url => set('prizeImage', url)}
                    onUpload={f => handleImageUpload('prize', f)}
                    uploading={uploadingImage === 'prize'}
                    required
                  />

                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      Imágenes de Galería (opcional)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <ImageField
                        label="Imagen Galería 1"
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
                        label="Imagen Galería 2"
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

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Video YouTube (opcional)
                    </label>
                    <div className="relative">
                      <Video size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="url" value={formData.videoUrl}
                        onChange={e => set('videoUrl', e.target.value)}
                        className="admin-input pl-10"
                        placeholder="https://www.youtube.com/embed/..." />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: Configuración ── */}
              {wizardStep === 'config' && (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Precio por boleto <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input type="number" step="0.01" min="1" value={formData.ticketPrice}
                          onChange={e => set('ticketPrice', e.target.value)}
                          required className="admin-input pl-8 font-black text-lg"
                          placeholder="50" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total de boletos <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input type="number" min="1" value={formData.totalTickets}
                          onChange={e => set('totalTickets', e.target.value)}
                          required className="admin-input pl-9 font-black text-lg"
                          placeholder="1000" />
                      </div>
                    </div>
                  </div>

                  {/* Revenue preview */}
                  {formData.ticketPrice && formData.totalTickets && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Recaudación potencial</p>
                        <p className="text-xl font-black text-indigo-700 mt-0.5">
                          ${(parseFloat(formData.ticketPrice || '0') * parseInt(formData.totalTickets || '0')).toLocaleString('es-MX')}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <DollarSign size={20} className="text-indigo-500" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Fecha y Hora del Sorteo <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="datetime-local" value={formData.drawDate}
                        onChange={e => set('drawDate', e.target.value)}
                        required className="admin-input pl-10" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['active', 'completed'] as const).map(status => (
                        <button key={status} type="button"
                          onClick={() => set('status', status)}
                          className={`min-h-[44px] rounded-xl text-sm font-bold transition-all active:scale-95 touch-manipulation border-2 ${formData.status === status
                            ? status === 'active'
                              ? 'bg-emerald-500 text-white border-emerald-400'
                              : 'bg-slate-600 text-white border-slate-500'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}>
                          {status === 'active' ? '● Activa' : '○ Completada'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary before save */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Resumen</p>
                    {[
                      { label: 'Premio', value: formData.title || '—' },
                      { label: 'Precio', value: formData.ticketPrice ? `$${formData.ticketPrice}` : '—' },
                      { label: 'Boletos', value: formData.totalTickets || '—' },
                      { label: 'Sorteo', value: formData.drawDate ? new Date(formData.drawDate).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">{label}</span>
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[160px]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons (sticky bottom) */}
            <div className="px-5 py-4 border-t border-slate-100 bg-white shrink-0 space-y-2">
              {wizardStep !== 'config' ? (
                <button type="button" onClick={nextStep} disabled={!canGoNext()}
                  className="w-full flex items-center justify-center gap-2 min-h-[52px] bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 text-white font-black rounded-2xl text-sm uppercase tracking-wide transition-all active:scale-[0.98] touch-manipulation">
                  Siguiente <ChevronRight size={18} />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={!canSubmit() || isSaving}
                  className="w-full flex items-center justify-center gap-2 min-h-[52px] bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 text-white font-black rounded-2xl text-sm uppercase tracking-wide transition-all active:scale-[0.98] touch-manipulation">
                  {isSaving ? (
                    <><Loader2 size={18} className="animate-spin" /> Guardando...</>
                  ) : (
                    <><CheckCircle2 size={18} /> {editingRaffle ? 'Guardar Cambios' : 'Crear Rifa'}</>
                  )}
                </button>
              )}
              <button type="button" onClick={handleClose}
                className="w-full min-h-[44px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-bold rounded-2xl text-sm transition-all active:scale-[0.98] touch-manipulation">
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Raffles;
