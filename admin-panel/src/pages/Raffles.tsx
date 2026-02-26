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
                    <button onClick={() => handleOpenModal(raffle)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-colors">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(raffle.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-bold transition-colors">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl">
              <h3 className="text-lg font-black text-slate-800">
                {editingRaffle ? 'Editar Rifa' : 'Nueva Rifa'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Descripción *</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={3} className="admin-input resize-none" placeholder="Describe el premio..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Imagen principal *</label>
                  <input type="url" value={formData.prizeImage} onChange={(e) => setFormData({ ...formData, prizeImage: e.target.value })} required className="admin-input" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Video URL</label>
                  <input type="url" value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} className="admin-input" placeholder="https://www.youtube.com/embed/VIDEO_ID" />
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    En YouTube: comparte → insertar → copia la URL del src del iframe.<br />
                    Ej: <span className="font-mono">https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1</span>
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Imágenes de galería (una por línea)</label>
                <textarea value={formData.galleryImages} onChange={(e) => setFormData({ ...formData, galleryImages: e.target.value })} rows={3} className="admin-input resize-none" placeholder="https://imagen1.com&#10;https://imagen2.com" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Precio *</label>
                  <input type="number" step="0.01" value={formData.ticketPrice} onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })} required className="admin-input" placeholder="50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Total *</label>
                  <input type="number" value={formData.totalTickets} onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })} required className="admin-input" placeholder="1000" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Estado</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'completed' })} className="admin-input">
                    <option value="active">Activa</option>
                    <option value="completed">Completada</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Fecha de sorteo *</label>
                <input type="datetime-local" value={formData.drawDate} onChange={(e) => setFormData({ ...formData, drawDate: e.target.value })} required className="admin-input" />
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

