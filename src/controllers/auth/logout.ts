import { AuthRequest } from "../../interfaces/auth.interface";
import { User, UserSession, UserStateModel } from "../../models";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { revokeToken } from "../../utils/commons/tokenManager";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { Response } from "express";
import { UserState } from "../../utils/enums/UserState";
import { StateChangedBy } from "../../utils/enums/StateChangedBy";

export const logout = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const token = req.rawToken;

    if (!token) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.TOKEN_REQUIRED, "400");
      return;
    }

    // ===== NUEVA LÓGICA DE HOME OFFICE =====

    const now = new Date();
    const ipAddress = req.socket?.remoteAddress || null;
    const userAgent = req.get("User-Agent") || null;

    // 1. Buscar sesión activa del usuario
    const activeSession = (await UserSession.findOne({
      where: {
        userId,
        isActive: true,
      },
    })) as any;

    if (activeSession) {
      // 2. Cerrar estado actual (si existe)
      const currentState = (await UserStateModel.findOne({
        where: {
          userId,
          sessionId: activeSession.id,
          stateEnd: null, // Estado activo
        },
      })) as any;

      if (currentState) {
        // Calcular duración del último estado
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

        // Actualizar breakdown final de la sesión
        const currentBreakdown = activeSession.stateTimeBreakdown || {};
        currentBreakdown[currentState.state] =
          (currentBreakdown[currentState.state] || 0) + durationMinutes;

        // Calcular tiempo total trabajado (solo estados productivos)
        const productiveStates = [UserState.ACTIVO];
        const totalWorked = productiveStates.reduce((sum, state) => {
          return sum + (currentBreakdown[state] || 0);
        }, 0);

        await UserSession.update(
          {
            stateTimeBreakdown: currentBreakdown,
            totalMinutesWorked: totalWorked,
          },
          { where: { id: activeSession.id } },
        );
      }

      // 3. Crear estado final de logout
      await UserStateModel.create({
        userId,
        sessionId: activeSession.id,
        state: UserState.DESCONECTADO,
        stateStart: now,
        changedBy: StateChangedBy.USER,
        reason: "Logout - fin de jornada",
        ipAddress,
        userAgent,
      });

      // 4. Cerrar la sesión de trabajo
      const sessionStart = new Date(activeSession.sessionStart);
      const totalSessionMinutes = Math.round(
        (now.getTime() - sessionStart.getTime()) / (1000 * 60),
      );

      await UserSession.update(
        {
          sessionEnd: now,
          isActive: false,
          currentState: UserState.DESCONECTADO,
        },
        { where: { id: activeSession.id } },
      );

      // 5. Actualizar estado del usuario
      await User.update(
        {
          currentState: UserState.DESCONECTADO,
          isInSession: false,
          currentSessionId: null,
          lastLogin: now,
        },
        { where: { id: userId } },
      );

      console.log(`📊 Sesión cerrada - Usuario: ${req.user!.username}`);
      console.log(`⏱️  Tiempo total en sesión: ${totalSessionMinutes} minutos`);
      console.log(
        `💼 Tiempo productivo: ${activeSession.stateTimeBreakdown?.activo || 0} minutos`,
      );
    }

    // Revocar el token JWT
    revokeToken(token, "logout");

    // Actualizar lastLogin del usuario (para tracking)
    await User.update({ lastLogin: now }, { where: { id: userId } });

    // ===== RESPUESTA COMPLETA =====
    const sessionSummary = activeSession
      ? {
          sessionId: activeSession.id,
          sessionStart: activeSession.sessionStart,
          sessionEnd: now,
          totalMinutesInSession: Math.round(
            (now.getTime() - new Date(activeSession.sessionStart).getTime()) /
              (1000 * 60),
          ),
          totalMinutesWorked: activeSession.stateTimeBreakdown?.activo || 0,
          stateBreakdown: activeSession.stateTimeBreakdown || {},
          finalState: UserState.DESCONECTADO,
        }
      : null;

    sendSuccessResponse(res, SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS, "200", {
      message: SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS,
      timestamp: now.toISOString(),
      sessionSummary,
      nextAction:
        "Sesión de trabajo cerrada. Puede iniciar sesión nuevamente cuando lo necesite.",
    });
  } catch (error) {
    console.error("Error en logout:", error);
    sendInternalErrorResponse(res);
  }
};
