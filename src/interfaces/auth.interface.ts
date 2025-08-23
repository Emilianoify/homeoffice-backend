import { Request } from "express";

export interface AuthRequest extends Request {
  user?: any;
  tokenPayload?: JwtPayload;
  rawToken?: string;
}

export interface JwtPayload {
  id: string;
  username: string;
  roleId: string;
  iat?: number;
  exp?: number;
}
