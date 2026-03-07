/**
 * Base URL del API:
 * 1. Se intenta cargar desde /config.json (mismo origen, cacheado 5 min) para no depender del build.
 * 2. Si falla, se usa VITE_API_URL del build (Netlify) o este fallback absoluto.
 */
const DEFAULT_API = 'https://paginas-production.up.railway.app/api';

// ── In-memory cache con TTL ─────────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

function getCached<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.data as T;
  memCache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T, ttlMs: number) {
  memCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ── URL resolution ──────────────────────────────────────────────────────────
function normalizeBaseUrl(raw: string): string {
  const s = (raw || '').trim();
  if (!s) return DEFAULT_API;
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return s.replace(/\/$/, '') || DEFAULT_API;
  }
  if (typeof window !== 'undefined' && s.startsWith('/')) {
    return `${window.location.origin}${s}`;
  }
  const withHttps = `https://${s.replace(/^\//, '')}`;
  return withHttps.includes('.') ? withHttps : DEFAULT_API;
}

const defaultBaseUrl = normalizeBaseUrl(
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : DEFAULT_API
);

let configPromise: Promise<string> | null = null;

function getBaseUrl(): Promise<string> {
  if (configPromise) return configPromise;
  configPromise = (async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      // max-age=300 = 5 minutos de caché del navegador (antes era no-store)
      const res = await fetch(`${origin}/config.json`, { cache: 'default' });
      if (res.ok) {
        const json = await res.json();
        const url = json?.apiUrl;
        if (url && typeof url === 'string') {
          const base = normalizeBaseUrl(url);
          if (base.startsWith('http://') || base.startsWith('https://')) return base;
        }
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
    const fullUrl = `${base}${endpoint}`;
    const url = fullUrl.startsWith('http://') || fullUrl.startsWith('https://') ? fullUrl : `${DEFAULT_API}${endpoint}`;

    const response = await fetch(url, {
      mode: 'cors',
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
      let message = data.error || `Error ${response.status}. Intenta de nuevo.`;
      if (data.details && Array.isArray(data.details) && data.details.length > 0) {
        const first = data.details[0];
        const path = first?.path?.join?.('.') || '';
        if (path && first?.message) message = `${message} (${path}: ${first.message})`;
      }
      throw new Error(message);
    }

    return data.data as T;
  }

  async getRaffles(status?: 'active' | 'completed') {
    const query = status ? `?status=${status}` : '';
    const cacheKey = `raffles_${status ?? 'all'}`;
    const cached = getCached<any[]>(cacheKey);
    if (cached) return cached;

    // Deduplicación: si ya hay un request en vuelo para esta key, reutilizarlo
    if (inFlightRequests.has(cacheKey)) return inFlightRequests.get(cacheKey)!;

    const promise = this.request<any[]>(`/raffles${query}`)
      .then(data => {
        // Caché de 3 minutos para la lista de rifas activas
        setCache(cacheKey, data, 3 * 60 * 1000);
        inFlightRequests.delete(cacheKey);
        return data;
      })
      .catch(err => {
        inFlightRequests.delete(cacheKey);
        throw err;
      });

    inFlightRequests.set(cacheKey, promise);
    return promise;
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
    user: { name: string; phone: string; email?: string; state: string };
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

  async getPurchase(id: string) {
    return this.request<any>(`/purchases/${id}`);
  }

  async getComprobante(purchaseId: string) {
    return this.request<any>(`/comprobante/${purchaseId}`);
  }

  async getSettings() {
    const cacheKey = 'settings';
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    // Deduplicación: si ya hay un request en vuelo para settings, reutilizarlo
    if (inFlightRequests.has(cacheKey)) return inFlightRequests.get(cacheKey)!;

    const promise = this.request<any>('/settings')
      .then(data => {
        // Caché de 5 minutos para settings (cambian raramente)
        setCache(cacheKey, data, 5 * 60 * 1000);
        inFlightRequests.delete(cacheKey);
        return data;
      })
      .catch(err => {
        inFlightRequests.delete(cacheKey);
        throw err;
      });

    inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  /** Invalida el caché de settings manualmente (tras guardar cambios en el admin) */
  clearSettingsCache() {
    memCache.delete('settings');
  }

  async getOgPreview(url: string) {
    const encoded = encodeURIComponent(url);
    return this.request<{ title: string; description: string; image: string; siteName: string; url: string }>(
      `/settings/og-preview?url=${encoded}`
    );
  }
}

export const apiService = new ApiService();
