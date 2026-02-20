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
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        prizeImage: '',
        galleryImages: '',
        videoUrl: '',
        ticketPrice: '',
        totalTickets: '',
        drawDate: '',
        status: 'active',
      });
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Rifas</h2>
          <p className="text-slate-400 mt-1">Gestiona las rifas disponibles</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg"
        >
          + Nueva Rifa
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Título</th>
                <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Boletos</th>
                <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Fecha Sorteo</th>
                <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {raffles.map((raffle) => (
                <tr key={raffle.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{raffle.title}</p>
                    {raffle.subtitle && <p className="text-xs text-slate-400">{raffle.subtitle}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">${raffle.ticketPrice}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {raffle._count?.tickets || 0} / {raffle.totalTickets}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        raffle.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {raffle.status === 'active' ? 'Activa' : 'Completada'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-400">
                      {new Date(raffle.drawDate).toLocaleDateString('es-MX')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(raffle)}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(raffle.id)}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800">
                {editingRaffle ? 'Editar Rifa' : 'Nueva Rifa'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Título *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Subtítulo</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Descripción *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Imagen Principal *</label>
                  <input
                    type="url"
                    value={formData.prizeImage}
                    onChange={(e) => setFormData({ ...formData, prizeImage: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Video URL</label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Imágenes Galería (una por línea)</label>
                <textarea
                  value={formData.galleryImages}
                  onChange={(e) => setFormData({ ...formData, galleryImages: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Precio Boleto *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.ticketPrice}
                    onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Total Boletos *</label>
                  <input
                    type="number"
                    value={formData.totalTickets}
                    onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'completed' })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="active">Activa</option>
                    <option value="completed">Completada</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Fecha Sorteo *</label>
                <input
                  type="datetime-local"
                  value={formData.drawDate}
                  onChange={(e) => setFormData({ ...formData, drawDate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Raffles;





