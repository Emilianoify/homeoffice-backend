// src/controllers/states/getStateTimeout.ts
import { AuthRequest } from "../../interfaces/auth.interface";
import { UserSession, UserStateModel } from "../../models";
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
  sendNotFound,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { Response } from "express";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { STATE_TRANSITION_RULES } from "../../utils/constants/stateTimeouts";

export const getStateTimeout = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Buscar sesión activa con estado actual
    const activeSession = (await UserSession.findOne({
      where: {
        userId,
        isActive: true,
      },
      include: [
        {
          model: UserStateModel,
          as: "stateChanges",
          where: { stateEnd: null },
          required: false,
          limit: 1,
          order: [["stateStart", "DESC"]],
        },
      ],
    })) as any;

    if (!activeSession) {
      sendNotFound(res, ERROR_MESSAGES.STATES.NO_ACTIVE_SESSION);
      return;
    }

    const currentStateRecord = activeSession.stateChanges?.[0];
    if (!currentStateRecord) {
      sendNotFound(res, ERROR_MESSAGES.STATES.CURRENT_STATE_NOT_FOUND);
      return;
    }

    const now = new Date();
    const stateStart = new Date(currentStateRecord.stateStart);
    const minutesInState = Math.floor(
      (now.getTime() - stateStart.getTime()) / (1000 * 60),
    );
    const currentState = currentStateRecord.state;

    // Buscar regla de timeout para este estado
    const timeoutRule = STATE_TRANSITION_RULES.find(
      (r) => r.fromState === currentState,
    );

    let timeoutInfo = null;
    if (timeoutRule) {
      const minutesRemaining = Math.max(
        0,
        timeoutRule.timeoutMinutes - minutesInState,
      );
      const warningMinutesRemaining = timeoutRule.warningMinutes
        ? Math.max(0, timeoutRule.warningMinutes - minutesInState)
        : null;

      timeoutInfo = {
        hasTimeout: true,
        timeoutMinutes: timeoutRule.timeoutMinutes,
        warningMinutes: timeoutRule.warningMinutes,
        minutesInCurrentState: minutesInState,
        minutesUntilTimeout: minutesRemaining,
        minutesUntilWarning: warningMinutesRemaining,
        nextState: timeoutRule.toState,
        isInWarningPeriod:
          warningMinutesRemaining !== null && warningMinutesRemaining <= 0,
        willTimeoutSoon: minutesRemaining <= 5,
        reason: timeoutRule.reason,
      };
    } else {
      timeoutInfo = {
        hasTimeout: false,
        minutesInCurrentState: minutesInState,
        message: "Este estado no tiene límite de tiempo",
      };
    }

    sendSuccessResponse(res, SUCCESS_MESSAGES.STATES.CURRENT_STATE_RETRIEVED, {
      currentState,
      stateStart: currentStateRecord.stateStart,
      sessionId: activeSession.id,
      lastActivity: activeSession.lastActivity,
      timeout: timeoutInfo,
    });
  } catch (error) {
    console.error("Error en getStateTimeout:", error);
    sendInternalErrorResponse(res);
  }
};
