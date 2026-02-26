/**
 * Base URL del API:
 * 1. Se intenta cargar desde /config.json (mismo origen) para no depender del build.
 * 2. Si falla, se usa VITE_API_URL del build (Netlify) o este fallback absoluto.
 */
const BUILD_TIME_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'https://paginas-production.up.railway.app/api';

function normalizeBaseUrl(raw: string): string {
  const s = (raw || '').trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s.replace(/\/$/, '');
  return `https://${s.replace(/^\//, '')}`;
}

const defaultBaseUrl = normalizeBaseUrl(BUILD_TIME_BASE);

let configPromise: Promise<string> | null = null;

function getBaseUrl(): Promise<string> {
  if (configPromise) return configPromise;
  configPromise = (async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(`${origin}/config.json`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const url = json?.apiUrl;
        if (url && typeof url === 'string') return normalizeBaseUrl(url);
      }
    } catch {
      // ignore
    }
    return defaultBaseUrl;
  })();
  return configPromise;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const base = await getBaseUrl();
    const url = `${base}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch {
      throw new Error(
        response.ok
          ? 'Error al leer la respuesta del servidor.'
          : `Error del servidor (${response.status}). Intenta de nuevo en un momento.`
      );
    }

    if (!response.ok || !data.success) {
      const message = data.error || `Error ${response.status}. Intenta de nuevo.`;
      throw new Error(message);
    }

    return data.data as T;
  }

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

  async createPurchase(purchaseData: {
    raffleId: string;
    ticketNumbers: number[];
    user: { name: string; phone: string; email: string; state: string };
  }) {
    return this.request<any>('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    });
  }

  async verifyTickets(phone: string) {
    return this.request<any>('/verify', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async sendChatMessage(message: string, raffleId?: string) {
    return this.request<{ response: string }>('/support/chat', {
      method: 'POST',
      body: JSON.stringify({ message, raffleId }),
    });
  }

  async uploadPaymentProof(purchaseId: string, paymentProofUrl: string) {
    return this.request<any>(`/purchases/${purchaseId}/payment-proof`, {
      method: 'POST',
      body: JSON.stringify({ paymentProofUrl }),
    });
  }

  async getSettings() {
    return this.request<any>('/settings');
  }
}

export const apiService = new ApiService();
