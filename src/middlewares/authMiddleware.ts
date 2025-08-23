import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ERROR_MESSAGES } from "../utils/constants/messages/error.messages";
import { User, Role } from "../models";
import { AuthRequest, JwtPayload } from "../interfaces/auth.interface";
import { IUser } from "../interfaces/user.interface";

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extraer token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.AUTH.TOKEN_REQUIRED,
      });
      return;
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar que exista JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        message: ERROR_MESSAGES.SERVER.JWT_SECRET_MISSING,
      });
      return;
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Buscar el usuario en la base de datos
    const user = (await User.findByPk(decoded.id, {
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name", "permissions", "isActive"],
        },
      ],
      attributes: { exclude: ["password"] },
    })) as IUser | null;

    // Verificar que el usuario exista y esté activo
    if (!user) {
      res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.USER.USER_NOT_FOUND,
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.AUTH.USER_INACTIVE,
      });
      return;
    }

    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      corporative_email: user.corporative_email,
      role: user.role,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.AUTH.TOKEN_EXPIRED,
        code: "TOKEN_EXPIRED",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.AUTH.INVALID_TOKEN,
        code: "INVALID_TOKEN",
      });
      return;
    }

    console.error("Error en authMiddleware:", error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER.INTERNAL_ERROR,
    });
    return;
  }
};

export default authMiddleware;
