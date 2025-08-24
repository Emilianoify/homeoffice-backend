import { Sector } from "../enums/Sector";
import { UserRole } from "../enums/UserRole";

export const SECTOR_BY_ROLE: Record<UserRole, Sector> = {
  [UserRole.ADMINISTRADOR]: Sector.ADMINISTRACION,
  [UserRole.COORDINACION]: Sector.COORDINACION,
  [UserRole.PROFESIONALES]: Sector.PROFESIONALES,
  [UserRole.CONTADURIA]: Sector.CONTADURIA,
  [UserRole.COMPRAS]: Sector.COMPRAS,
  [UserRole.LIQUIDACIONES]: Sector.LIQUIDACIONES,
  [UserRole.COORDINADOR_SECTOR]: Sector.VARIABLE,
  [UserRole.FACTURACION]: Sector.FACTURACION,
  [UserRole.RECURSOS_HUMANOS]: Sector.RRHH,
  [UserRole.RECLAMOS]: Sector.RECLAMOS,
  [UserRole.RECEPCION]: Sector.RECEPCION,
};

export const daysOfWeek = ["lunes", "martes", "miércoles", "jueves", "viernes"];

export function getNextFriday(date: Date): string {
  const nextFriday = new Date(date);
  const daysUntilFriday = (5 - date.getDay() + 7) % 7;
  if (daysUntilFriday === 0 && date.getDay() === 5) {
    nextFriday.setDate(date.getDate() + 7); // Siguiente viernes
  } else {
    nextFriday.setDate(date.getDate() + daysUntilFriday);
  }
  return nextFriday.toISOString().split("T")[0];
}

export function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
