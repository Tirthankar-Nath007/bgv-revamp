import api from '@/services/axios';
import type { VerifierUser } from '@/features/auth/types';
import type { PagedResponse } from '@/features/appeals/appealsApi';

export interface DashboardStats {
  totalVerifications: number;
  pendingAppeals: number;
  activeVerifiers: number;
  totalEmployees: number;
  matchedVerifications: number;
  partialMatches: number;
  mismatches: number;
  completedAppeals: number;
  recentVerifications: ActivityItem[];
  recentAppeals: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: string;
  employeeId: string;
  status: string;
  timestamp: string;
}

export interface BlockedVerifier {
  id: number;              // VerificationAttempt.id — used for unblock
  verifierId: number;
  verifierEmail: string;
  verifierCompanyName: string;
  employeeId: string;
  employeeName: string;
  attemptCount: number;
  isBlocked: boolean;
  blockedAt: string;
  lastAttemptAt: string;
}

export interface AccessLog {
  id: number;
  email: string;
  role: string;
  action: string;
  status: string;
  ipAddress: string;
  userAgent: string;
  failureReason: string | null;
  metadata: string | null;
  timestamp: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<DashboardStats>('/api/admin/dashboard');
  return res.data;
}

export async function getVerifiers(): Promise<VerifierUser[]> {
  const res = await api.get<VerifierUser[]>('/api/admin/verifiers');
  return res.data;
}

export async function toggleVerifier(id: number): Promise<VerifierUser> {
  const res = await api.post<VerifierUser>(`/api/admin/verifiers/${id}/toggle`);
  return res.data;
}

export async function getBlockedVerifiers(): Promise<BlockedVerifier[]> {
  const res = await api.get<BlockedVerifier[]>('/api/admin/blocked-verifiers');
  return res.data;
}

export async function unblockAttempt(attemptId: number): Promise<void> {
  await api.delete(`/api/admin/blocked/${attemptId}`);
}

export async function getAccessLogs(params?: { status?: string; role?: string; email?: string; page?: number; size?: number }): Promise<PagedResponse<AccessLog>> {
  const res = await api.get<PagedResponse<AccessLog>>('/api/admin/logs', { params });
  return res.data;
}

export async function downloadExport(): Promise<Blob> {
  const res = await api.get('/api/admin/export', { responseType: 'blob' });
  return res.data;
}

export async function downloadAppealsExport(status?: string): Promise<Blob> {
  const res = await api.get('/api/admin/appeals/export', {
    responseType: 'blob',
    params: status ? { status } : undefined,
  });
  return res.data;
}

export async function downloadVerifiersExport(): Promise<Blob> {
  const res = await api.get('/api/admin/verifiers/export', { responseType: 'blob' });
  return res.data;
}
