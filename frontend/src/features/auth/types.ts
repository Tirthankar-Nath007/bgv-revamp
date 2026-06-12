export type UserRole = 'VERIFIER' | 'ADMIN' | 'SUPER_ADMIN' | 'HR_MANAGER';

export interface VerifierUser {
  id: number;
  email: string;
  companyName: string;
  isEmailVerified: boolean;
  isActive: boolean;
  isBgvAgency: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  permissions: string[];
  isActive: boolean;
}

export interface AuthState {
  token: string | null;
  verifier: VerifierUser | null;
  admin: AdminUser | null;
  role: UserRole | null;
  expiresAt: number | null; // Unix seconds
  pendingOtpEmail: string | null; // email awaiting OTP
}
