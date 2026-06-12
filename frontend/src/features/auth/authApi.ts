import api from '@/services/axios';
import type { VerifierUser, AdminUser } from './types';

export interface RegisterPayload {
  companyName: string;
  email: string;
  password: string;
  isBgvAgency: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface OtpPayload {
  email: string;
  otp: string;
}

export interface AdminLoginPayload {
  username: string;
  password: string;
}

export async function registerVerifier(data: RegisterPayload): Promise<VerifierUser> {
  const res = await api.post<VerifierUser>('/api/auth/register', data);
  return res.data;
}

export async function initiateLogin(data: LoginPayload): Promise<{ requireOtp: boolean; email: string }> {
  const res = await api.post('/api/auth/login', data);
  return res.data;
}

export async function verifyOtp(data: OtpPayload): Promise<{ token: string; verifier: VerifierUser }> {
  const res = await api.post('/api/auth/verify-otp', data);
  return res.data;
}

export async function adminLogin(data: AdminLoginPayload): Promise<{ token: string; admin: AdminUser }> {
  const res = await api.post('/api/admin/auth/login', data);
  return res.data;
}

export async function revokeToken(): Promise<void> {
  await api.post('/api/auth/revoke').catch(() => {/* best effort */});
}

export async function refreshToken(): Promise<{ token: string }> {
  const res = await api.post<{ token: string }>('/api/auth/refresh');
  return res.data;
}

export async function getMe(): Promise<VerifierUser> {
  const res = await api.get<VerifierUser>('/api/auth/me');
  return res.data;
}
