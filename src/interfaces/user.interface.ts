import { IRole } from "./role.interface";

export interface IUser {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  corporative_email: string;
  password?: string; // Opcional porque se excluye en consultas
  roleId: string;
  isActive: boolean;
  lastLogin?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // Relación
  role?: IRole;
}

export interface IUserSafe
  extends Omit<IUser, "password" | "passwordResetToken"> {
  // Usuario sin campos sensibles para respuestas
}
