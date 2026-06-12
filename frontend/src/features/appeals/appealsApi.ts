import api from '@/services/axios';

export interface MismatchedField {
  fieldName: string;
  verifierValue: string;
  companyValue: string;
}

export interface ComparisonResult {
  field: string;
  verifierValue: string;
  companyValue: string;
  isMatch: boolean;
  matchType: string;
}

export interface AppealPayload {
  verificationId: string;
  comments: string;
  mismatchedFields: MismatchedField[];
}

export interface AppealVerifier {
  id: number;
  companyName: string;
  email: string;
}

export interface AppealEmployee {
  employeeId: string;
  name: string;
  department: string;
  designation: string;
}

export interface AppealVerification {
  verificationId: string;
  overallStatus: string;
  matchScore: number;
}

export interface Appeal {
  id: number;
  appealId: string;
  verificationId: number;
  employeeId: string;
  appealReason: string;
  status: 'pending' | 'completed';
  hrResponse: string | null;
  hrComments: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  mismatchedFields: MismatchedField[];
  allComparisonResults: ComparisonResult[] | null;
  verifier: AppealVerifier;
  employee: AppealEmployee;
  verification: AppealVerification;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export async function submitAppeal(data: AppealPayload): Promise<Appeal> {
  const res = await api.post<Appeal>('/api/appeals', data);
  return res.data;
}

export async function getAppeals(params?: { status?: string; page?: number; size?: number }): Promise<PagedResponse<Appeal>> {
  const res = await api.get<PagedResponse<Appeal>>('/api/appeals', { params });
  return res.data;
}

export async function getAppeal(appealId: string): Promise<Appeal> {
  const res = await api.get<Appeal>(`/api/appeals/${appealId}`);
  return res.data;
}

export async function respondToAppeal(appealId: string, hrComments: string): Promise<Appeal> {
  const res = await api.post<Appeal>(`/api/appeals/${appealId}/respond`, { hrComments });
  return res.data;
}
