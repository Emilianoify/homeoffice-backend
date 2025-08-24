import { IUser } from "../../interfaces/user.interface";
import { User, Role, UserSession } from "../../models";
import {
  sendBadRequest,
  sendInternalErrorResponse,
  sendSuccessResponse,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { calculateNextPopupTime } from "../../utils/commons/nextPopupTime";
import UserStateModel from "../../models/userState.model";
import { StateChangedBy } from "../../utils/enums/StateChangedBy";
import { UserState } from "../../utils/enums/UserState";

interface LoginRequest {
  username: string;
  password: string;
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.MISSING_CREDENTIALS);
      return;
    }
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
      sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
      return;
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.USER_INACTIVE);
      return;
    }

    // Verificar que el rol esté activo
    if (!user.role?.isActive) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.ROLE_INACTIVE);
      return;
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
      return;
    }

    // Verificar que exista JWT_SECRET
    const jwtSecret: jwt.Secret = process.env.JWT_SECRET!!;
    if (!jwtSecret) {
      sendInternalErrorResponse(res);
      return;
    }

    // 1. Cerrar sesión activa anterior (si existe)
    await UserSession.update(
      {
        sessionEnd: new Date(),
        isActive: false,
      },
      {
        where: {
          userId: user.id,
          isActive: true,
        },
      },
    );

    // 2. Obtener información de la request
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.get("User-Agent") || null;

    // 3. Calcular próximo popup basado en frecuencia del usuario
    const nextPopupAt = calculateNextPopupTime(user.popupFrequency);

    // 4. Crear nueva sesión de trabajo
    const newSession = (await UserSession.create({
      userId: user.id,
      sessionStart: new Date(),
      currentState: UserState.DESCONECTADO, // Inicia desconectado, luego cambia a activo
      ipAddress,
      userAgent,
      nextPopupAt,
      isActive: true,
    })) as any;

    // 5. Actualizar estado del usuario
    await User.update(
      {
        currentState: UserState.DESCONECTADO, // Estará desconectado hasta que haga "Iniciar trabajo"
        isInSession: true,
        currentSessionId: newSession.id,
        lastLogin: new Date(),
      },
      { where: { id: user.id } },
    );

    // 6. Crear registro inicial en UserState
    await UserStateModel.create({
      userId: user.id,
      sessionId: newSession.id,
      state: UserState.DESCONECTADO, // ← ENUM
      stateStart: new Date(),
      changedBy: StateChangedBy.SYSTEM, // ← ENUM
      reason: "Login inicial",
      ipAddress,
      userAgent,
    });

    // ===== GENERAR TOKENS (LÓGICA ORIGINAL) =====
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

    // ===== PREPARAR RESPUESTA COMPLETA =====
    const responseData = {
      user: {
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        corporative_email: user.corporative_email,
        sector: user.sector,
        isActive: user.isActive,
        currentState: UserState.DESCONECTADO,
        isInSession: true,
        productivityScore: user.productivityScore,
        popupFrequency: user.popupFrequency,
        weeklyProductivityGoal: user.weeklyProductivityGoal,
        qualifiesForFlexFriday: user.qualifiesForFlexFriday,
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
      // Información de la sesión de trabajo
      workSession: {
        sessionId: newSession.id,
        sessionStart: newSession.sessionStart,
        currentState: UserState.DESCONECTADO,
        nextPopupAt: nextPopupAt,
        totalMinutesWorked: 0,
      },
    };

    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESS,

      responseData,
    );
  } catch (error) {
    console.error("Error en login:", error);
    sendInternalErrorResponse(res);
  }
};
