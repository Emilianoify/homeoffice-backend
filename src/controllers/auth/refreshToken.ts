import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User, Role } from "../../models";
import { IUser } from "../../interfaces/user.interface";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { isTokenRevoked } from "../../utils/commons/tokenManager";

interface RefreshTokenRequest {
  refreshToken: string;
}

interface RefreshTokenPayload {
  id: string;
  username: string;
  type: string;
  iat?: number;
  exp?: number;
}

export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { refreshToken: token }: RefreshTokenRequest = req.body;

    // Validación de campo requerido
    if (!token) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.REFRESH_TOKEN_REQUIRED, "400");
      return;
    }

    // Verificar que exista JWT_SECRET
    const jwtSecret: jwt.Secret = process.env.JWT_SECRET!!;
    if (!jwtSecret) {
      sendInternalErrorResponse(res);
      return;
    }

    // Verificar y decodificar el refresh token
    const decoded = jwt.verify(token, jwtSecret) as RefreshTokenPayload;

    // Validar que sea un refresh token
    if (decoded.type !== "refresh") {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_TOKEN_TYPE, "400");
      return;
    }

    // Verificar si el token está revocado
    if (isTokenRevoked(token, decoded.id, decoded.iat)) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.TOKEN_REVOKED, "401");
      return;
    }

    // Buscar el usuario en la base de datos
    const user = (await User.findOne({
      where: {
        id: decoded.id,
        username: decoded.username,
      },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name", "permissions", "isActive"],
        },
      ],
    })) as IUser | null;

    // Verificar que el usuario exista
    if (!user) {
      sendBadRequest(res, ERROR_MESSAGES.USER.USER_NOT_FOUND, "404");
      return;
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.USER_INACTIVE, "401");
      return;
    }

    // Verificar que el rol esté activo
    if (!user.role?.isActive) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.ROLE_INACTIVE, "401");
      return;
    }

    // Configuración de tokens
    const accessTokenExpiry = process.env.JWT_EXPIRES_IN || "1h";

    // Generar nuevo Access Token
    const accessTokenPayload = {
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      type: "access",
    };

    const newAccessToken = jwt.sign(accessTokenPayload, jwtSecret, {
      expiresIn: accessTokenExpiry,
    } as jwt.SignOptions);

    // Actualizar lastLogin para tracking
    await User.update({ lastLogin: new Date() }, { where: { id: user.id } });

    // Preparar respuesta
    const responseData = {
      accessToken: newAccessToken,
      accessTokenExpiry,
      user: {
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        role: {
          id: user.role.id,
          name: user.role.name,
          permissions: user.role.permissions,
        },
      },
      refreshedAt: new Date().toISOString(),
    };

    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUTH.TOKEN_REFRESHED,
      "200",
      responseData,
    );
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.REFRESH_TOKEN_EXPIRED, "401");
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN, "401");
      return;
    }

    console.error("Error en refreshToken:", error);
    sendInternalErrorResponse(res);
  }
};
