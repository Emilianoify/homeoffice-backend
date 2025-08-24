import { TokenRevocationReason } from "../enums/TokenRevocationReason";

interface RevokedToken {
  token: string;
  revokedAt: Date;
  reason: TokenRevocationReason;
}

interface UserTokenRevocation {
  userId: string;
  revokedAt: Date;
  reason: TokenRevocationReason;
}

// Blacklist de tokens específicos (sistema actual)
export const revokedTokens: RevokedToken[] = [];

// Blacklist de todos los tokens de un usuario desde una fecha específica
export const userTokenRevocations: UserTokenRevocation[] = [];

// Función para revocar un token específico
export function revokeToken(
  token: string,
  reason: TokenRevocationReason = TokenRevocationReason.LOGOUT,
): void {
  revokedTokens.push({
    token,
    revokedAt: new Date(),
    reason,
  });

  // Limpiar tokens antiguos (mayores a 30 días)
  cleanOldTokens();
}

// Función para revocar TODOS los tokens de un usuario
export function revokeAllUserTokens(
  userId: string,
  reason: TokenRevocationReason = TokenRevocationReason.PASSWORD_CHANGE,
): void {
  userTokenRevocations.push({
    userId,
    revokedAt: new Date(),
    reason,
  });
  // Limpiar revocaciones antiguas
  cleanOldUserRevocations();
}

// Verificar si un token está revocado
export function isTokenRevoked(
  token: string,
  userId?: string,
  issuedAt?: number,
): boolean {
  // 1. Verificar blacklist de tokens específicos
  const specificTokenRevoked = revokedTokens.some((rt) => rt.token === token);
  if (specificTokenRevoked) {
    return true;
  }

  // 2. Si tenemos userId e issuedAt, verificar revocaciones por usuario
  if (userId && issuedAt) {
    const userRevocation = userTokenRevocations.find(
      (ur) => ur.userId === userId,
    );
    if (userRevocation) {
      // Si el token fue emitido ANTES de la revocación del usuario, está revocado
      const tokenIssuedAt = new Date(issuedAt * 1000); // JWT iat está en segundos
      return tokenIssuedAt < userRevocation.revokedAt;
    }
  }

  return false;
}

// Limpiar tokens antiguos para evitar memory leaks
function cleanOldTokens(): void {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  revokedTokens.splice(
    0,
    revokedTokens.length,
    ...revokedTokens.filter((rt) => rt.revokedAt > thirtyDaysAgo),
  );
}

// Limpiar revocaciones de usuario antiguas
function cleanOldUserRevocations(): void {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  userTokenRevocations.splice(
    0,
    userTokenRevocations.length,
    ...userTokenRevocations.filter((ur) => ur.revokedAt > thirtyDaysAgo),
  );
}

// Funciones de compatibilidad con el sistema actual
export function addToRevokedTokens(token: string): void {
  revokeToken(token, TokenRevocationReason.LOGOUT);
}

// Función para obtener estadísticas (útil para debugging)
export function getTokenStats(): {
  revokedTokensCount: number;
  userRevocationsCount: number;
  oldestRevocation: Date | null;
} {
  return {
    revokedTokensCount: revokedTokens.length,
    userRevocationsCount: userTokenRevocations.length,
    oldestRevocation:
      revokedTokens.length > 0
        ? revokedTokens.reduce(
            (oldest, current) =>
              current.revokedAt < oldest ? current.revokedAt : oldest,
            new Date(),
          )
        : null,
  };
}
