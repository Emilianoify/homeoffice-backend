import { Response, NextFunction } from "express";
import { ERROR_MESSAGES } from "../utils/constants/messages/error.messages";
import { AuthRequest } from "../interfaces/auth.interface";
import { UserRole } from "../utils/enums/UserRole";

export const validateRole = (allowedRoles: string | string[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Verificar que el usuario esté en el request (debe pasar por authMiddleware primero)
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.USER_NOT_AUTHENTICATED,
          code: "USER_NOT_AUTHENTICATED",
        });
        return;
      }

      // Verificar que el usuario tenga un rol asignado
      if (!req.user.role) {
        res.status(403).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.USER_NO_ROLE,
          code: "USER_NO_ROLE",
        });
        return;
      }

      // Normalizar allowedRoles a array
      const rolesArray = Array.isArray(allowedRoles)
        ? allowedRoles
        : [allowedRoles];

      // Verificar si el rol del usuario está en los roles permitidos
      const userRoleName = req.user.role.name;
      const hasPermission = rolesArray.includes(userRoleName);

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: ERROR_MESSAGES.AUTH.INSUFFICIENT_PERMISSIONS,
          code: "INSUFFICIENT_PERMISSIONS",
          details: {
            userRole: userRoleName,
            requiredRoles: rolesArray,
          },
        });
        return;
      }

      // El usuario tiene permisos, continuar
      next();
    } catch (error) {
      console.error("Error en validateRole:", error);
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SERVER.INTERNAL_ERROR,
      });
      return;
    }
  };
};

// Middlewares predefinidos para roles específicos usando enums
export const requireAdmin = validateRole(UserRole.ADMINISTRADOR);
export const requireCoordination = validateRole(UserRole.COORDINACION);
export const requireAccounting = validateRole([
  UserRole.CONTADURIA,
  UserRole.ADMINISTRADOR,
]);
export const requirePurchasing = validateRole([
  UserRole.COMPRAS,
  UserRole.ADMINISTRADOR,
]);
export const requirePayroll = validateRole([
  UserRole.LIQUIDACIONES,
  UserRole.ADMINISTRADOR,
]);
export const requireProfessional = validateRole(UserRole.PROFESIONALES);

// ===== NUEVOS ROLES PARA HOME OFFICE =====
export const requireSectorCoordinator = validateRole(
  UserRole.COORDINADOR_SECTOR,
);
export const requireBilling = validateRole([
  UserRole.FACTURACION,
  UserRole.ADMINISTRADOR,
]);
export const requireHR = validateRole([
  UserRole.RECURSOS_HUMANOS,
  UserRole.ADMINISTRADOR,
]);
export const requireComplaints = validateRole([
  UserRole.RECLAMOS,
  UserRole.ADMINISTRADOR,
]);
export const requireReception = validateRole([
  UserRole.RECEPCION,
  UserRole.ADMINISTRADOR,
]);

// Middleware para múltiples roles administrativos (ACTUALIZADO con nuevos roles)
export const requireAdminRoles = validateRole([
  UserRole.ADMINISTRADOR,
  UserRole.COORDINACION,
  UserRole.CONTADURIA,
  UserRole.COMPRAS,
  UserRole.LIQUIDACIONES,
  UserRole.RECURSOS_HUMANOS,
]);

// Middleware para coordinadores (incluye coordinador general y de sector)
export const requireAnyCoordinator = validateRole([
  UserRole.COORDINACION,
  UserRole.COORDINADOR_SECTOR,
  UserRole.ADMINISTRADOR,
]);

// Middleware para roles que pueden asignar tareas
export const requireTaskAssigner = validateRole([
  UserRole.COORDINADOR_SECTOR,
  UserRole.COORDINACION,
  UserRole.ADMINISTRADOR,
]);

// Middleware para roles que pueden ver reportes de productividad
export const requireProductivityViewer = validateRole([
  UserRole.RECURSOS_HUMANOS,
  UserRole.COORDINADOR_SECTOR,
  UserRole.COORDINACION,
  UserRole.ADMINISTRADOR,
]);

// Middleware para acceso a funciones financieras
export const requireFinancialAccess = validateRole([
  UserRole.CONTADURIA,
  UserRole.FACTURACION,
  UserRole.LIQUIDACIONES,
  UserRole.ADMINISTRADOR,
]);

export default validateRole;
