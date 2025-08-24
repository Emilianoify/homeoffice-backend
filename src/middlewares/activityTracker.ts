import { Response, NextFunction } from "express";
import { AuthRequest } from "../interfaces/auth.interface";
import { User, UserSession } from "../models";

// Actualizar última actividad en cada request autenticado
export const trackActivity = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Solo si el usuario está autenticado
    if (req.user && req.user.isInSession) {
      const userId = req.user.id;
      const now = new Date();

      // Actualizar última actividad en la sesión activa
      await UserSession.update(
        {
          lastActivity: now,
          // También actualizar IP si cambió
          ipAddress: req.socket?.remoteAddress || null,
        },
        {
          where: {
            userId,
            isActive: true,
          },
        },
      );

      await User.update({ lastActivity: now }, { where: { id: userId } });
    }

    next();
  } catch (error) {
    console.error("Error en trackActivity:", error);

    next();
  }
};
