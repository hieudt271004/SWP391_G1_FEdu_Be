import { apiClient } from './api.client'; // chỉ còn dùng cho logout (cần custom header)
import { http } from './http';
import { LoginResponse, User } from '../types/user';

export const authService = {
  login: (email: string, password: string) =>
    http.post<LoginResponse>('/auth/login', { email, password }),

  register: (
    firstName: string, lastName: string,
    email: string, password: string, confirmPassword: string,
  ) =>
    http.post<void>('/auth/register', { firstName, lastName, email, password, confirmPassword }),

  getMe: () => http.get<User>('/auth/me'),

  googleLogin: (credential: string) =>
    http.post<LoginResponse>('/auth/google-login', { credential }),

  forgotPassword: (email: string) =>
    http.post<void>('/auth/forgot-password', { email }),

  async logout(refreshToken: string): Promise<void> {
    try {
      await apiClient.post('/auth/log-out', null, {
        headers: { 'x-refresh-token': refreshToken },
      });
    } catch {
      // logout: kệ lỗi, FE vẫn clear token
    }
  },
};