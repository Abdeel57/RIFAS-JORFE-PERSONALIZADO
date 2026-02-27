import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';

const Raffles = () => {
  const [raffles, setRaffles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRaffle, setEditingRaffle] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    prizeImage: '',
    galleryImages: '',
    videoUrl: '',
    ticketPrice: '',
    totalTickets: '',
    drawDate: '',
    status: 'active' as 'active' | 'completed',
  });
  const [uploadingImage, setUploadingImage] = useState<'prize' | 'gallery0' | 'gallery1' | null>(null);

  useEffect(() => {
    loadRaffles();
  }, []);

  const loadRaffles = async () => {
    try {
      const data = await adminService.getRaffles();
      setRaffles(data);
    } catch (error) {
      console.error('Error loading raffles:', error);
    } finally {
      setIsLoading(false);
    }
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
      setFormData({ title: '', subtitle: '', description: '', prizeImage: '', galleryImages: '', videoUrl: '', ticketPrice: '', totalTickets: '', drawDate: '', status: 'active' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        ticketPrice: parseFloat(formData.ticketPrice),
        totalTickets: parseInt(formData.totalTickets),
        galleryImages: formData.galleryImages.split('\n').filter((url) => url.trim()),
        drawDate: new Date(formData.drawDate).toISOString(),
      };
      if (editingRaffle) {
        await adminService.updateRaffle(editingRaffle.id, submitData);
      } else {
        await adminService.createRaffle(submitData);
      }
      setIsModalOpen(false);
      loadRaffles();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar la rifa');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta rifa?')) return;
    try {
      await adminService.deleteRaffle(id);
      loadRaffles();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar la rifa');
    }
  };

  const handleImageUpload = async (field: 'prize' | 'gallery0' | 'gallery1', file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes (JPG, PNG, WebP).');
      return;
    }
    setUploadingImage(field);
    try {
      const { url } = await adminService.uploadImage(file);
      if (field === 'prize') {
        setFormData((prev) => ({ ...prev, prizeImage: url }));
      } else {
        const lines = formData.galleryImages.split('\n');
        lines[field === 'gallery0' ? 0 : 1] = url;
        setFormData((prev) => ({ ...prev, galleryImages: lines.join('\n') }));
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al subir la imagen');
    } finally {
      setUploadingImage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Cargando rifas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Rifas</h2>
          <p className="section-sub">Gestiona las rifas</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva
        </button>
      </div>

      {/* Raffle Cards */}
      <div className="space-y-3">
        {raffles.length === 0 ? (
          <div className="admin-card p-10 text-center">
            <p className="text-slate-400 text-sm">No hay rifas registradas</p>
            <button onClick={() => handleOpenModal()} className="btn-primary mt-4 mx-auto block">
              Crear primera rifa
            </button>
          </div>
        ) : (
          raffles.map((raffle) => {
            const sold = raffle._count?.tickets || 0;
            const progress = Math.round((sold / raffle.totalTickets) * 100);
            return (
              <div key={raffle.id} className="list-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm leading-tight">{raffle.title}</p>
                    {raffle.subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{raffle.subtitle}</p>}
                  </div>
                  <span className={`badge flex-shrink-0 ${raffle.status === 'active' ? 'badge-green' : 'badge-slate'}`}>
                    {raffle.status === 'active' ? 'Activa' : 'Completada'}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-slate-400 font-medium">{sold} / {raffle.totalTickets} boletos</p>
                    <p className="text-[10px] font-bold text-indigo-600">{progress}%</p>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[10px] text-slate-400">Precio</p>
                      <p className="text-sm font-black text-slate-800">${raffle.ticketPrice}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Sorteo</p>
                      <p className="text-[11px] font-bold text-slate-600">{new Date(raffle.drawDate).toLocaleDateString('es-MX')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(raffle)} className="min-h-[44px] px-3 py-2 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-600 rounded-xl text-xs font-bold transition-colors touch-manipulation">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(raffle.id)} className="min-h-[44px] px-3 py-2 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-500 rounded-xl text-xs font-bold transition-colors touch-manipulation">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal - móvil: bottom sheet; desktop: centrado */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 pb-0 sm:pb-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85dvh] overflow-y-auto overflow-x-hidden overscroll-contain flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 bg-white rounded-t-3xl sm:rounded-t-2xl shrink-0">
              <h3 className="text-lg font-black text-slate-800">
                {editingRaffle ? 'Editar Rifa' : 'Nueva Rifa'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 min-w-[44px] min-h-[44px] shrink-0 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full flex items-center justify-center text-slate-500 transition-colors touch-manipulation">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 pb-safe flex-1 min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Título *</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="admin-input" placeholder="Ej. iPhone 15 Pro" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Subtítulo</label>
                  <input type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} className="admin-input" placeholder="Opcional" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Descripción Detallada *</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={5} className="admin-input resize-none" placeholder="Describe el premio con lujo de detalle..." />
              </div>

              <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Diseño de Galería</h4>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Imagen 1 (Principal - Cabecera) *</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="url" value={formData.prizeImage} onChange={(e) => setFormData({ ...formData, prizeImage: e.target.value })} required className="admin-input bg-white flex-1" placeholder="URL o sube desde dispositivo" />
                    <label className="btn-secondary cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0">
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload('prize', f); e.target.value = ''; }} disabled={!!uploadingImage} />
                      {uploadingImage === 'prize' ? 'Subiendo…' : '📷 Subir imagen'}
                    </label>
                  </div>
                  {formData.prizeImage && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 bg-white max-w-[200px]">
                      <img src={formData.prizeImage} alt="Vista previa" className="w-full h-auto object-contain max-h-32" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Imagen 2 (Detalle Abajo)</label>
                    <div className="flex gap-2">
                      <input type="url" value={formData.galleryImages.split('\n')[0] || ''} onChange={(e) => {
                        const lines = formData.galleryImages.split('\n');
                        lines[0] = e.target.value;
                        setFormData({ ...formData, galleryImages: lines.join('\n') });
                      }} className="admin-input bg-white flex-1" placeholder="URL o subir" />
                      <label className="btn-secondary cursor-pointer shrink-0 px-2 flex items-center">
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload('gallery0', f); e.target.value = ''; }} disabled={!!uploadingImage} />
                        {uploadingImage === 'gallery0' ? '…' : '📷'}
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Imagen 3 (Detalle Abajo)</label>
                    <div className="flex gap-2">
                      <input type="url" value={formData.galleryImages.split('\n')[1] || ''} onChange={(e) => {
                        const lines = formData.galleryImages.split('\n');
                        lines[1] = e.target.value;
                        setFormData({ ...formData, galleryImages: lines.join('\n') });
                      }} className="admin-input bg-white flex-1" placeholder="URL o subir" />
                      <label className="btn-secondary cursor-pointer shrink-0 px-2 flex items-center">
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload('gallery1', f); e.target.value = ''; }} disabled={!!uploadingImage} />
                        {uploadingImage === 'gallery1' ? '…' : '📷'}
                      </label>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  Puedes pegar una URL o subir desde tu dispositivo (JPG, PNG, WebP). Se guardan en la base de datos con alta calidad.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Video URL (YouTube Embed)</label>
                  <input type="url" value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} className="admin-input" placeholder="https://www.youtube.com/embed/..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Precio *</label>
                  <input type="number" step="0.01" value={formData.ticketPrice} onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })} required className="admin-input" placeholder="50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Total *</label>
                <input type="number" value={formData.totalTickets} onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })} required className="admin-input" placeholder="1000" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Estado</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'completed' })} className="admin-input">
                    <option value="active">Activa</option>
                    <option value="completed">Completada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Fecha de sorteo *</label>
                  <input type="datetime-local" value={formData.drawDate} onChange={(e) => setFormData({ ...formData, drawDate: e.target.value })} required className="admin-input" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Guardar</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Raffles;

