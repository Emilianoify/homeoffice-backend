import { AuthRequest } from "../../interfaces/auth.interface";
import { User, UserSession, UserStateModel } from "../../models";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { Response } from "express";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";

export const getCurrentState = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Buscar usuario con sesión activa
    const user = (await User.findByPk(userId, {
      include: [
        {
          model: UserSession,
          as: "sessions",
          where: { isActive: true },
          required: false,
          include: [
            {
              model: UserStateModel,
              as: "stateChanges",
              where: { stateEnd: null },
              required: false,
              limit: 1,
            },
          ],
        },
      ],
    })) as any;

    if (!user) {
      sendBadRequest(res, ERROR_MESSAGES.USER.USER_NOT_FOUND, "404");
      return;
    }

    const activeSession = user.sessions?.[0];
    const currentStateRecord = activeSession?.stateChanges?.[0];

    // Calcular tiempo en estado actual
    let minutesInCurrentState = 0;
    if (currentStateRecord) {
      const stateStart = new Date(currentStateRecord.stateStart);
      minutesInCurrentState = Math.round(
        (Date.now() - stateStart.getTime()) / (1000 * 60),
      );
    }

    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.STATES.CURRENT_STATE_RETRIEVED,
      "200",
      {
        currentState: user.currentState,
        isInSession: user.isInSession,
        sessionId: activeSession?.id || null,
        sessionStart: activeSession?.sessionStart || null,
        stateStart: currentStateRecord?.stateStart || null,
        minutesInCurrentState,
        totalMinutesWorked: activeSession?.totalMinutesWorked || 0,
        stateTimeBreakdown: activeSession?.stateTimeBreakdown || {},
      },
    );
  } catch (error) {
    console.error("Error en getCurrentState:", error);
    sendInternalErrorResponse(res);
  }
};
