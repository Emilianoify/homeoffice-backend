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

export const validStates = [
  "activo",
  "baño",
  "almuerzo",
  "ausente",
  "licencia",
  "desconectado",
];
