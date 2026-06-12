import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, VerifierUser, AdminUser, UserRole } from './types';
import { decodeToken } from '@/utils/token';

const initialState: AuthState = {
  token: null,
  verifier: null,
  admin: null,
  role: null,
  expiresAt: null,
  pendingOtpEmail: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPendingOtp(state, action: PayloadAction<string>) {
      state.pendingOtpEmail = action.payload;
    },

    loginVerifier(state, action: PayloadAction<{ token: string; verifier: VerifierUser }>) {
      const { token, verifier } = action.payload;
      const decoded = decodeToken(token);
      state.token = token;
      state.verifier = verifier;
      state.admin = null;
      state.role = 'VERIFIER';
      state.expiresAt = decoded?.exp ?? null;
      state.pendingOtpEmail = null;
    },

    loginAdmin(state, action: PayloadAction<{ token: string; admin: AdminUser }>) {
      const { token, admin } = action.payload;
      const decoded = decodeToken(token);
      state.token = token;
      state.admin = admin;
      state.verifier = null;
      // Use the JWT claim (backend normalizes it via toUpperCase) to avoid raw DB value case mismatches
      state.role = (decoded?.role ?? admin.role) as UserRole;
      state.expiresAt = decoded?.exp ?? null;
      state.pendingOtpEmail = null;
    },

    refreshSession(state, action: PayloadAction<{ token: string }>) {
      const decoded = decodeToken(action.payload.token);
      state.token = action.payload.token;
      state.expiresAt = decoded?.exp ?? null;
    },

    logout(state) {
      state.token = null;
      state.verifier = null;
      state.admin = null;
      state.role = null;
      state.expiresAt = null;
      state.pendingOtpEmail = null;
    },
  },
});

export const { setPendingOtp, loginVerifier, loginAdmin, refreshSession, logout } = authSlice.actions;
export default authSlice.reducer;
