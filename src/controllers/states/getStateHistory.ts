import { AuthRequest } from "../../interfaces/auth.interface";
import { UserStateModel, UserSession } from "../../models";
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
  sendBadRequest,
} from "../../utils/commons/responseFunctions";
import { Response } from "express";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";

export const getStateHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { date, limit = 50 } = req.query;

    // Validar límite
    const parsedLimit = parseInt(limit as string);
    if (parsedLimit > 100) {
      sendBadRequest(res, ERROR_MESSAGES.STATES.LIMIT_EXCEEDED, "400");
      return;
    }

    let whereConditions: any = { userId };

    // Filtrar por fecha si se proporciona
    if (date) {
      // Validar formato de fecha
      const targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        sendBadRequest(res, ERROR_MESSAGES.STATES.INVALID_DATE_FORMAT, "400");
        return;
      }

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      whereConditions.stateStart = {
        [require("sequelize").Op.between]: [startOfDay, endOfDay],
      };
    }

    const stateHistory = await UserStateModel.findAll({
      where: whereConditions,
      include: [
        {
          model: UserSession,
          as: "session",
          attributes: ["id", "sessionStart"],
        },
      ],
      order: [["stateStart", "DESC"]],
      limit: parseInt(limit as string),
    });

    // Calcular estadísticas del día
    const dayStats = {
      totalStates: stateHistory.length,
      stateBreakdown: {} as any,
      totalMinutesTracked: 0,
    };

    stateHistory.forEach((state: any) => {
      if (state.durationMinutes) {
        dayStats.stateBreakdown[state.state] =
          (dayStats.stateBreakdown[state.state] || 0) + state.durationMinutes;
        dayStats.totalMinutesTracked += state.durationMinutes;
      }
    });

    sendSuccessResponse(res, SUCCESS_MESSAGES.STATES.HISTORY_RETRIEVED, "200", {
      stateHistory,
      dayStats,
      requestDate: date || new Date().toDateString(),
    });
  } catch (error) {
    console.error("Error en getStateHistory:", error);
    sendInternalErrorResponse(res);
  }
};
