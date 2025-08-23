import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "homeoffice-secret-key";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  sector: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
