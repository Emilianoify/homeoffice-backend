import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ERROR_MESSAGES } from "../utils/constants/messages/error.messages";
import { AuthRequest, JwtPayload } from "../interfaces/auth.interface";
import { isTokenRevoked } from "../utils/commons/tokenManager";

export const checkToken = async (
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
        code: "TOKEN_REQUIRED",
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

    // Verificar si el token está revocado (individual o por usuario)
    if (isTokenRevoked(token, decoded.id, decoded.iat)) {
      res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.AUTH.TOKEN_REVOKED,
        code: "TOKEN_REVOKED",
      });
      return;
    }

    // Validar estructura del payload
    if (!decoded.id || !decoded.username || !decoded.roleId) {
      res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.AUTH.INVALID_TOKEN_STRUCTURE,
        code: "INVALID_TOKEN_STRUCTURE",
      });
      return;
    }

    // Verificar expiración manualmente (redundante pero explícito)
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.AUTH.TOKEN_EXPIRED,
        code: "TOKEN_EXPIRED",
      });
      return;
    }

    // Agregar payload decodificado al request para uso posterior
    req.tokenPayload = decoded;
    req.rawToken = token;

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

    if (error instanceof jwt.NotBeforeError) {
      res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.AUTH.TOKEN_NOT_ACTIVE,
        code: "TOKEN_NOT_ACTIVE",
      });
      return;
    }

    console.error("Error en checkToken:", error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER.INTERNAL_ERROR,
    });
    return;
  }
};

export default checkToken;
