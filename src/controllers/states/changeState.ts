import { Response } from "express";
import { User, UserSession, UserStateModel } from "../../models";
import { AuthRequest } from "../../interfaces/auth.interface";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { USER_STATE_VALUES } from "../../utils/validators/validators";
import { StateChangedBy } from "../../utils/enums/StateChangedBy";

export const changeState = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { newState, reason } = req.body;
    const userId = req.user!.id;

    if (!newState || !USER_STATE_VALUES.includes(newState)) {
      sendBadRequest(res, ERROR_MESSAGES.STATES.INVALID_STATE, "400");
      return;
    }

    // Buscar sesión activa del usuario
    const activeSession = (await UserSession.findOne({
      where: {
        userId,
        isActive: true,
      },
    })) as any;

    if (!activeSession) {
      sendBadRequest(res, ERROR_MESSAGES.STATES.NO_ACTIVE_SESSION, "400");
      return;
    }

    // Obtener información de la request
    const ipAddress = req.socket?.remoteAddress || null;
    const userAgent = req.get("User-Agent") || null;
    const now = new Date();

    // 1. Cerrar estado actual (si existe)
    const currentState = (await UserStateModel.findOne({
      where: {
        userId,
        sessionId: activeSession.id,
        stateEnd: null, // Estado activo
      },
    })) as any;

    if (currentState) {
      // Calcular duración en minutos
      const stateStart = new Date(currentState.stateStart);
      const durationMinutes = Math.round(
        (now.getTime() - stateStart.getTime()) / (1000 * 60),
      );

      await UserStateModel.update(
        {
          stateEnd: now,
          durationMinutes,
        },
        {
          where: { id: currentState.id },
        },
      );

      // Actualizar breakdown de tiempo en la sesión
      const currentBreakdown = activeSession.stateTimeBreakdown || {};
      currentBreakdown[currentState.state] =
        (currentBreakdown[currentState.state] || 0) + durationMinutes;

      await UserSession.update(
        { stateTimeBreakdown: currentBreakdown },
        { where: { id: activeSession.id } },
      );
    }

    await UserStateModel.create({
      userId,
      sessionId: activeSession.id,
      state: newState, // Ya validado que es del enum
      stateStart: now,
      changedBy: StateChangedBy.USER, // ← ENUM en lugar de 'user'
      reason,
      ipAddress,
      userAgent,
    });

    // 3. Actualizar User y UserSession
    await User.update({ currentState: newState }, { where: { id: userId } });

    await UserSession.update(
      { currentState: newState },
      { where: { id: activeSession.id } },
    );

    // Respuesta
    sendSuccessResponse(res, SUCCESS_MESSAGES.STATES.STATE_CHANGED, "200", {
      newState,
      stateStart: now,
      sessionId: activeSession.id,
      previousStateDuration: currentState
        ? Math.round(
            (now.getTime() - new Date(currentState.stateStart).getTime()) /
              (1000 * 60),
          )
        : 0,
    });
  } catch (error) {
    console.error("Error en changeState:", error);
    sendInternalErrorResponse(res);
  }
};
