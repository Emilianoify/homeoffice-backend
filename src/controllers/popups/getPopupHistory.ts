import { AuthRequest } from "../../interfaces/auth.interface";
import { PopupResponse } from "../../models";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { Response } from "express";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { Op } from "sequelize";

export const getPopupHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { date, limit = 50 } = req.query;

    let whereConditions: any = { userId };

    // Filtrar por fecha si se proporciona
    if (date) {
      const targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        sendBadRequest(res, ERROR_MESSAGES.POPUPS.INVALID_DATE_FORMAT, "400");
        return;
      }

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      whereConditions.popupTime = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    const popupHistory = await PopupResponse.findAll({
      where: whereConditions,
      order: [["popupTime", "DESC"]],
      limit: parseInt(limit as string),
      attributes: [
        "id",
        "exercise",
        "correctAnswer",
        "userAnswer",
        "isCorrect",
        "wasAnswered",
        "popupTime",
        "answeredAt",
        "responseTime",
        "result",
        "isFirstAttempt",
      ],
    });

    // Calcular estadísticas del día
    const dayStats = {
      totalPopups: popupHistory.length,
      answered: popupHistory.filter((p) => p.wasAnswered).length,
      correct: popupHistory.filter((p) => p.isCorrect).length,
      accuracy: 0,
      averageResponseTime: 0,
    };

    const answeredPopups = popupHistory.filter(
      (p) => p.wasAnswered && p.responseTime,
    );
    if (answeredPopups.length > 0) {
      dayStats.accuracy = Math.round(
        (dayStats.correct / answeredPopups.length) * 100,
      );
      dayStats.averageResponseTime = Math.round(
        answeredPopups.reduce((sum, p) => sum + (p.responseTime || 0), 0) /
          answeredPopups.length,
      );
    }

    sendSuccessResponse(res, SUCCESS_MESSAGES.POPUPS.HISTORY_RETRIEVED, "200", {
      popupHistory,
      dayStats,
      requestDate: date || new Date().toDateString(),
    });
  } catch (error) {
    console.error("Error en getPopupHistory:", error);
    sendInternalErrorResponse(res);
  }
};
