import { IUser } from "../../interfaces/user.interface";
import { User, Role } from "../../models";
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

interface LoginRequest {
  username: string;
  password: string;
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password }: LoginRequest = req.body;

    // Validación de campos requeridos
    if (!username || !password) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.MISSING_CREDENTIALS, "400");
      return;
    }

    // Buscar usuario por username, incluyendo información del rol
    const user = (await User.findOne({
      where: { username },
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
      sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS, "401");
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

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS, "401");
      return;
    }

    // Verificar que exista JWT_SECRET
    const jwtSecret: jwt.Secret = process.env.JWT_SECRET!!;
    if (!jwtSecret) {
      sendInternalErrorResponse(res);
      return;
    }

    // Configuración de tokens con validación de tipos
    const accessTokenExpiry = process.env.JWT_EXPIRES_IN || "1h";
    const refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

    // Generar Access Token (corto)
    const accessTokenPayload = {
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      type: "access",
    };

    const accessToken = jwt.sign(accessTokenPayload, jwtSecret, {
      expiresIn: accessTokenExpiry,
    } as jwt.SignOptions);

    // Generar Refresh Token (largo)
    const refreshTokenPayload = {
      id: user.id,
      username: user.username,
      type: "refresh",
    };

    const refreshToken = jwt.sign(refreshTokenPayload, jwtSecret, {
      expiresIn: refreshTokenExpiry,
    } as jwt.SignOptions);

    // Actualizar lastLogin
    await User.update({ lastLogin: new Date() }, { where: { id: user.id } });

    // Preparar datos de respuesta (sin password)
    const responseData = {
      user: {
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        corporative_email: user.corporative_email,
        isActive: user.isActive,
        role: {
          id: user.role.id,
          name: user.role.name,
          permissions: user.role.permissions,
          isActive: user.role.isActive,
        },
        lastLogin: new Date(),
      },
      tokens: {
        accessToken,
        refreshToken,
        accessTokenExpiry,
        refreshTokenExpiry,
      },
    };

    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESS,
      "200",
      responseData,
    );
  } catch (error) {
    console.error("Error en login:", error);
    sendInternalErrorResponse(res);
  }
};
