import { PopupFrequency } from "../utils/enums/PopupFrequency";
import { Sector } from "../utils/enums/Sector";
import { UserState } from "../utils/enums/UserState";
import { IRole } from "./role.interface";

export interface IUser {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  corporative_email: string;
  password?: string;
  roleId: string;
  isActive: boolean;
  lastLogin?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  currentState: UserState; // ← Tipo del enum
  popupFrequency: PopupFrequency; // ← Tipo del enum
  sector: Sector;
  isInSession: boolean;
  currentSessionId?: string | null;
  productivityScore?: number | null;

  totalPopupsReceived: number;
  totalPopupsCorrect: number;

  weeklyProductivityGoal: number;
  qualifiesForFlexFriday: boolean;
  role?: IRole;
}

export interface IUserSafe
  extends Omit<IUser, "password" | "passwordResetToken"> {
  // Usuario sin campos sensibles para respuestas
}

export interface ChangeStateDto {
  newState: UserState;
  reason?: string;
}

export interface StartSessionDto {}

export interface SessionStatusDto {
  isInSession: boolean;
  currentState: UserState;
  sessionId?: string;
  sessionStartTime?: Date;
  totalMinutesWorked?: number;
}

export interface ProductivityStatsDto {
  productivityScore: number;
  popupAccuracy: number;
  totalPopupsReceived: number;
  totalPopupsCorrect: number;
  qualifiesForFlexFriday: boolean;
  weeklyGoal: number;
}
