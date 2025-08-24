import { PopupAction } from "../enums/PopupAction";
import { PopupFrequency } from "../enums/PopupFrequency";
import { PopupResult } from "../enums/PopupResult";
import { StateChangedBy } from "../enums/StateChangedBy";
import { TaskPriority } from "../enums/TaskPriority";
import { TaskStatus } from "../enums/TaskStatus";
import { UserState } from "../enums/UserState";

// Función auxiliar para validar formato de email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función auxiliar para validar fortaleza de contraseña
export const isValidPassword = (password: string): boolean => {
  // Mínimo 8 caracteres, al menos 1 mayúscula y 1 número
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

// Función auxiliar para validar username
export const isValidUsername = (username: string): boolean => {
  // Solo letras, números y guiones bajos, 3-50 caracteres
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  return usernameRegex.test(username);
};

export const USER_STATE_VALUES = Object.values(UserState);
export const TASK_PRIORITY_VALUES = Object.values(TaskPriority);
export const TASK_STATUS_VALUES = Object.values(TaskStatus);
export const POPUP_FREQUENCY_VALUES = Object.values(PopupFrequency);
export const POPUP_RESULT_VALUES = Object.values(PopupResult);
export const POPUP_ACTION_VALUES = Object.values(PopupAction);
export const STATE_CHANGED_BY_VALUES = Object.values(StateChangedBy);
