import api from './api';

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  planType?: string | null;
  planExpiryDate?: string | null;
}

export interface LoginResponse {
  token: string;
  admin: Admin;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<{ success: boolean; data: LoginResponse }>('/admin/auth/login', {
      email,
      password,
    });
    return response.data.data;
  },

  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },

  getToken(): string | null {
    return localStorage.getItem('admin_token');
  },

  getAdmin(): Admin | null {
    const adminStr = localStorage.getItem('admin_user');
    return adminStr ? JSON.parse(adminStr) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};






