import { Response } from "express";
import { DailyReport } from "../../models";
import { AuthRequest } from "../../interfaces/auth.interface";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { Op } from "sequelize";

export const getPersonalReport = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { date, period = "day" } = req.query;

    let startDate: Date;
    let endDate: Date;

    if (date) {
      startDate = new Date(date as string);
      if (isNaN(startDate.getTime())) {
        sendBadRequest(res, ERROR_MESSAGES.REPORTS.INVALID_DATE_RANGE);
        return;
      }
    } else {
      startDate = new Date();
    }

    // Configurar rango según período
    switch (period) {
      case "day":
        endDate = new Date(startDate);
        break;
      case "week":
        // Inicio de semana (lunes)
        const dayOfWeek = startDate.getDay() || 7;
        startDate.setDate(startDate.getDate() - dayOfWeek + 1);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        break;
      case "month":
        startDate.setDate(1);
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        break;
      default:
        endDate = new Date(startDate);
    }

    const reports = (await DailyReport.findAll({
      where: {
        userId,
        reportDate: {
          [Op.between]: [
            startDate.toISOString().split("T")[0],
            endDate.toISOString().split("T")[0],
          ],
        },
      },
      order: [["reportDate", "DESC"]],
    })) as any[];

    // Calcular estadísticas del período
    const stats = {
      totalDays: reports.length,
      averageProductivity: 0,
      totalMinutesWorked: 0,
      totalPopupsReceived: 0,
      totalPopupsCorrect: 0,
      overallAccuracy: 0,
      flexFridayDays: 0,
      bestDay: null as any,
      worstDay: null as any,
    };

    if (reports.length > 0) {
      stats.averageProductivity = Math.round(
        reports.reduce((sum, r) => sum + r.productivityScore, 0) /
          reports.length,
      );

      stats.totalMinutesWorked = reports.reduce(
        (sum, r) => sum + r.totalMinutesWorked,
        0,
      );
      stats.totalPopupsReceived = reports.reduce(
        (sum, r) => sum + r.totalPopupsReceived,
        0,
      );
      stats.totalPopupsCorrect = reports.reduce(
        (sum, r) => sum + r.correctAnswersCount,
        0,
      );

      stats.overallAccuracy =
        stats.totalPopupsReceived > 0
          ? Math.round(
              (stats.totalPopupsCorrect / stats.totalPopupsReceived) * 100,
            )
          : 0;

      stats.flexFridayDays = reports.filter(
        (r) => r.qualifiesForFlexFriday,
      ).length;

      // Mejor y peor día
      const sortedReports = [...reports].sort(
        (a, b) => b.productivityScore - a.productivityScore,
      );
      stats.bestDay = sortedReports[0];
      stats.worstDay = sortedReports[sortedReports.length - 1];
    }

    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.REPORTS.PERSONAL_REPORT_RETRIEVED,
      {
        period,
        dateRange: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
        },
        reports,
        statistics: stats,
        user: {
          id: req.user!.id,
          username: req.user!.username,
          firstname: req.user!.firstname,
          lastname: req.user!.lastname,
          sector: req.user!.sector,
        },
      },
    );
  } catch (error) {
    console.error("Error en getPersonalReport:", error);
    sendInternalErrorResponse(res);
  }
};
