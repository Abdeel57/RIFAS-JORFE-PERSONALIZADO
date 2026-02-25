import { useState, useEffect } from 'react';
import { authService, Admin } from '../services/auth.service';

export const useAuth = () => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const adminData = authService.getAdmin();
    setAdmin(adminData);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    localStorage.setItem('admin_token', response.token);
    localStorage.setItem('admin_user', JSON.stringify(response.admin));
    setAdmin(response.admin);
    return response;
  };

  const logout = () => {
    authService.logout();
    setAdmin(null);
  };

  return {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    login,
    logout,
  };
};






