import api from './api';

export const adminService = {
  // Dashboard
  async getDashboardStats() {
    const response = await api.get('/admin/dashboard/stats');
    return response.data.data;
  },

  // Raffles
  async getRaffles(status?: string) {
    const params = status ? { status } : {};
    const response = await api.get('/admin/raffles', { params });
    return response.data.data;
  },

  async getRaffleById(id: string) {
    const response = await api.get(`/admin/raffles/${id}`);
    return response.data.data;
  },

  async createRaffle(data: any) {
    const response = await api.post('/admin/raffles', data);
    return response.data.data;
  },

  async updateRaffle(id: string, data: any) {
    const response = await api.put(`/admin/raffles/${id}`, data);
    return response.data.data;
  },

  async deleteRaffle(id: string) {
    const response = await api.delete(`/admin/raffles/${id}`);
    return response.data;
  },

  /** Sube una imagen desde el dispositivo; devuelve { id, url } para usar en prizeImage o galleryImages. */
  async uploadImage(file: File): Promise<{ id: string; url: string }> {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post('/admin/upload-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  // Tickets
  async getTickets(filters?: { raffleId?: string; status?: string; purchaseId?: string }) {
    const response = await api.get('/admin/tickets', { params: filters });
    return response.data.data;
  },

  async updateTicket(id: string, status: 'available' | 'reserved' | 'sold') {
    const response = await api.put(`/admin/tickets/${id}`, { status });
    return response.data.data;
  },

  // Purchases
  async getPurchases(filters?: { status?: string; raffleId?: string; userId?: string }) {
    const response = await api.get('/admin/purchases', { params: filters });
    return response.data.data;
  },

  async getPurchaseById(id: string) {
    const response = await api.get(`/admin/purchases/${id}`);
    return response.data.data;
  },

  async updatePurchaseStatus(
    id: string,
    status: 'pending' | 'paid' | 'cancelled',
    paymentMethod?: string,
    paymentReference?: string
  ) {
    const response = await api.put(`/admin/purchases/${id}/status`, {
      status,
      paymentMethod,
      paymentReference,
    });
    return response.data.data;
  },

  // Users
  async getUsers(filters?: { search?: string; phone?: string; email?: string }) {
    const response = await api.get('/admin/users', { params: filters });
    return response.data.data;
  },

  async getUserById(id: string) {
    const response = await api.get(`/admin/users/${id}`);
    return response.data.data;
  },

  // Settings
  async getSettings() {
    const response = await api.get('/settings');
    return response.data.data;
  },

  async updateSettings(data: any) {
    const response = await api.put('/settings', data);
    return response.data.data;
  },
};






