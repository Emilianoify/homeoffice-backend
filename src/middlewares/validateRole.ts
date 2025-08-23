import { Response, NextFunction } from "express";
import { ERROR_MESSAGES } from "../utils/constants/messages/error.messages";
import { AuthRequest } from "../interfaces/auth.interface";

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

// Middlewares predefinidos para roles específicos
export const requireAdmin = validateRole("Administrador");
export const requireCoordination = validateRole("Coordinación");
export const requireAccounting = validateRole(["Contaduría", "Administrador"]);
export const requirePurchasing = validateRole(["Compras", "Administrador"]);
export const requirePayroll = validateRole(["Liquidaciones", "Administrador"]);
export const requireProfessional = validateRole("Profesionales");

// Middleware para múltiples roles administrativos
export const requireAdminRoles = validateRole([
  "Administrador",
  "Coordinación",
  "Contaduría",
  "Compras",
  "Liquidaciones",
]);

export default validateRole;
