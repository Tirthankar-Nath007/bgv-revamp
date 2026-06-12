import api from '@/services/axios';

export interface ValidateEmployeePayload {
  employeeId: string;
  name: string;
  entityName: string;
}

export interface ValidateEmployeeResponse {
  found: boolean;
  employeeId: string;
  message: string;
}

export interface VerificationPayload {
  employeeId: string;
  name: string;
  entityName: string;
  dateOfJoining: string;
  dateOfLeaving: string;
  designation: string;
  exitReason: string;
  consentGiven: true;
}

export interface ComparisonResult {
  field: string;
  verifierValue: string;
  companyValue: string;
  isMatch: boolean;
  matchType: string;
}

export interface EmployeeInfo {
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  entityName: string;
  dateOfJoining: string;
  dateOfLeaving: string;
  fnfStatus: string;
}

export interface VerificationResponse {
  id: number;
  verificationId: string;
  employeeId: string;
  overallStatus: 'MATCH' | 'PARTIAL_MATCH' | 'MISMATCH';
  matchScore: number;
  comparisonResults: ComparisonResult[];
  verificationCompletedAt: string;
  createdAt: string;
  employee: EmployeeInfo;
}

export async function validateEmployee(data: ValidateEmployeePayload): Promise<ValidateEmployeeResponse> {
  const res = await api.post<ValidateEmployeeResponse>('/api/verify/validate-employee', data);
  return res.data;
}

export async function submitVerification(data: VerificationPayload): Promise<VerificationResponse> {
  const res = await api.post<VerificationResponse>('/api/verify/request', data);
  return res.data;
}

export async function getVerificationHistory(): Promise<VerificationResponse[]> {
  const res = await api.get<VerificationResponse[]>('/api/verify/request');
  return res.data;
}
