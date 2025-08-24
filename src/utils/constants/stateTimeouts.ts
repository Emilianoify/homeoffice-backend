import { UserState } from "../enums/UserState";

export const STATE_TIMEOUTS = {
  [UserState.ACTIVO]: 30, // 30 minutos sin actividad → automático a ausente
  [UserState.BANO]: 15, // 15 minutos max en baño → automático a activo
  [UserState.ALMUERZO]: 90, // 90 minutos max almuerzo → automático a activo
  [UserState.AUSENTE]: 60, // 60 minutos ausente → automático a desconectado
  [UserState.BREVE_DESCANSO]: 15,
  [UserState.LICENCIA]: null, // Sin límite
  [UserState.DESCONECTADO]: null, // Sin límite
} as const;

export const INACTIVITY_WARNINGS = {
  [UserState.ACTIVO]: 25, // Advertir a los 25 min (5 min antes)
  [UserState.BANO]: 12, // Advertir a los 12 min
  [UserState.ALMUERZO]: 75, // Advertir a los 75 min
  [UserState.AUSENTE]: 50, // Advertir a los 50 min
  [UserState.BREVE_DESCANSO]: 10,
  [UserState.LICENCIA]: null, // Sin límite
  [UserState.DESCONECTADO]: null, // Sin límite
} as const;

export interface StateTransitionRule {
  fromState: UserState;
  toState: UserState;
  timeoutMinutes: number;
  warningMinutes?: number;
  reason: string;
}

export const STATE_TRANSITION_RULES: StateTransitionRule[] = [
  {
    fromState: UserState.ACTIVO,
    toState: UserState.AUSENTE,
    timeoutMinutes: 30,
    warningMinutes: 25,
    reason: "Inactividad prolongada detectada automáticamente",
  },
  {
    fromState: UserState.BANO,
    toState: UserState.ACTIVO,
    timeoutMinutes: 15,
    warningMinutes: 12,
    reason: "Tiempo límite en baño excedido - regresando a activo",
  },
  {
    fromState: UserState.ALMUERZO,
    toState: UserState.ACTIVO,
    timeoutMinutes: 90,
    warningMinutes: 75,
    reason: "Tiempo de almuerzo excedido - regresando a activo",
  },
  {
    fromState: UserState.AUSENTE,
    toState: UserState.DESCONECTADO,
    timeoutMinutes: 60,
    warningMinutes: 50,
    reason: "Ausencia prolongada - cerrando sesión automáticamente",
  },
  {
    fromState: UserState.BREVE_DESCANSO,
    toState: UserState.ACTIVO,
    timeoutMinutes: 15,
    warningMinutes: 12,
    reason: "Ausencia prolongada - regresando a activo",
  },
];

export function getTimeoutForState(state: UserState): number | null {
  return STATE_TIMEOUTS[state];
}

export function getWarningTimeForState(state: UserState): number | null {
  return INACTIVITY_WARNINGS[state] || null;
}
