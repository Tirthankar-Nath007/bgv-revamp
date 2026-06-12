interface JwtPayload {
  sub: string;
  userId: number;
  userType: string;
  role: string;
  displayName: string;
  iat: number;
  exp: number;
  jti: string;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return true;
  return Math.floor(Date.now() / 1000) >= expiresAt;
}

export function secondsUntilExpiry(expiresAt: number | null): number {
  if (!expiresAt) return 0;
  return expiresAt - Math.floor(Date.now() / 1000);
}
