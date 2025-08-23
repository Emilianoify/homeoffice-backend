export const revokedTokens: string[] = [];

export function addToRevokedTokens(token: string): void {
  revokedTokens.push(token);
}

export function isTokenRevoked(token: string): boolean {
  return revokedTokens.includes(token);
}
