import { Request } from "express";
import { PopupFrequency } from "../utils/enums/PopupFrequency";
import { UserState } from "../utils/enums/UserState";
import { IRole } from "./role.interface";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
    corporative_email: string;
    role?: IRole;
    isActive: boolean;
    sector: string;
    currentState: UserState;
    isInSession: boolean;
    currentSessionId?: string | null;
    productivityScore?: number | null;
    popupFrequency: PopupFrequency;
    totalPopupsReceived: number;
    totalPopupsCorrect: number;
    weeklyProductivityGoal: number;
    qualifiesForFlexFriday: boolean;
    lastLogin?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
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
