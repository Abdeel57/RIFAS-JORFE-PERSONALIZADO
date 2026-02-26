const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://paginas-production.up.railway.app/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data.data as T;
  }

  // Raffles
  async getRaffles(status?: 'active' | 'completed') {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/raffles${query}`);
  }

  async getRaffleById(id: string) {
    return this.request<any>(`/raffles/${id}`);
  }

  async getRaffleTickets(raffleId: string, status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/raffles/${raffleId}/tickets${query}`);
  }

  // Purchases
  async createPurchase(purchaseData: {
    raffleId: string;
    ticketNumbers: number[];
    user: {
      name: string;
      phone: string;
      email: string;
      state: string;
    };
  }) {
    return this.request<any>('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    });
  }

  // Verify
  async verifyTickets(phone: string) {
    return this.request<{
      user: {
        name: string;
        phone: string;
        email: string;
      } | null;
      tickets: Array<{
        number: number;
        status: string;
        purchaseId: string;
        raffle: {
          id: string;
          title: string;
          drawDate: string;
        };
      }>;
    }>('/verify', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  // Support Chat
  async sendChatMessage(message: string, raffleId?: string) {
    return this.request<{ response: string }>('/support/chat', {
      method: 'POST',
      body: JSON.stringify({ message, raffleId }),
    });
  }

  // Payment Proof
  async uploadPaymentProof(purchaseId: string, paymentProofUrl: string) {
    return this.request<any>(`/purchases/${purchaseId}/payment-proof`, {
      method: 'POST',
      body: JSON.stringify({ paymentProofUrl }),
    });
  }

  // System Settings
  async getSettings() {
    return this.request<any>('/settings');
  }
}

export const apiService = new ApiService();





