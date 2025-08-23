import { Response, NextFunction } from "express";
import { ERROR_MESSAGES } from "../utils/constants/messages/error.messages";
import { AuthRequest } from "../interfaces/auth.interface";

/**
 * Middleware para verificar que el usuario autenticado tenga rol de Administrador
 * IMPORTANTE: Este middleware debe ejecutarse DESPUÉS de authMiddleware
 * porque requiere que req.user esté poblado
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Verificar que el usuario esté autenticado (req.user debe existir)
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

    // Verificar que el rol sea "Administrador"
    if (req.user.role.name !== "Administrador") {
      res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.AUTH.ADMIN_REQUIRED,
        code: "ADMIN_REQUIRED",
        details: {
          userRole: req.user.role.name,
          requiredRole: "Administrador",
          userId: req.user.id,
          username: req.user.username,
        },
      });
      return;
    }

    // Verificar que el rol esté activo
    if (!req.user.role.isActive) {
      res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.AUTH.ROLE_INACTIVE,
        code: "ROLE_INACTIVE",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Error en requireAdmin:", error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER.INTERNAL_ERROR,
    });
    return;
  }
};

export default requireAdmin;
