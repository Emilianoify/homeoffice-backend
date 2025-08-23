import { IRole } from "./role.interface";

// Tipos para el sistema de home office
export type UserState =
  | "desconectado"
  | "activo"
  | "baño"
  | "almuerzo"
  | "ausente"
  | "licencia";

export type PopupFrequency = "standard" | "premium";

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
  currentState: UserState;
  isInSession: boolean;
  currentSessionId?: string | null;
  productivityScore?: number | null;
  popupFrequency: PopupFrequency;
  totalPopupsReceived: number;
  totalPopupsCorrect: number;
  sector: string;
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
