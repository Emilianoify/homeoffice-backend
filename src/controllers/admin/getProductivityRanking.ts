import { Op } from "sequelize";
import { AuthRequest } from "../../interfaces/auth.interface";
import { DailyReport, User, Role } from "../../models";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { Response } from "express";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";

export const getProductivityRanking = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      date,
      period = "day",
      sector,
      limit = 50,
      sortBy = "productivity",
    } = req.query;

    let targetDate = new Date();
    if (date) {
      targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        sendBadRequest(res, ERROR_MESSAGES.REPORTS.INVALID_DATE_RANGE);
        return;
      }
    }

    let dateCondition: any;

    if (period === "week") {
      // Semana actual
      const startOfWeek = new Date(targetDate);
      const dayOfWeek = startOfWeek.getDay() || 7;
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + 1);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      dateCondition = {
        [Op.between]: [
          startOfWeek.toISOString().split("T")[0],
          endOfWeek.toISOString().split("T")[0],
        ],
      };
    } else {
      dateCondition = targetDate.toISOString().split("T")[0];
    }

    // Construir filtros
    const userWhere: any = { isActive: true };
    if (sector) {
      userWhere.sector = sector;
    }

    const reports = (await DailyReport.findAll({
      where: {
        reportDate: dateCondition,
      },
      include: [
        {
          model: User,
          as: "user",
          where: userWhere,
          attributes: ["id", "username", "firstname", "lastname", "sector"],
          include: [
            {
              model: Role,
              as: "role",
              attributes: ["name"],
            },
          ],
        },
      ],
      order:
        period === "week"
          ? [["weeklyProductivityAverage", "DESC"]]
          : [["productivityScore", "DESC"]],
      limit: parseInt(limit as string),
    })) as any[];

    // Agregar posición en el ranking
    const ranking = reports.map((report, index) => ({
      position: index + 1,
      user: {
        id: report.user.id,
        username: report.user.username,
        fullName: `${report.user.firstname} ${report.user.lastname}`,
        sector: report.user.sector,
        role: report.user.role.name,
      },
      metrics: {
        productivityScore: report.productivityScore,
        weeklyAverage: report.weeklyProductivityAverage,
        minutesWorked: report.totalMinutesWorked,
        popupAccuracy: report.popupAccuracy,
        taskCompletion: report.taskCompletionRate,
        qualifiesForFlex: report.qualifiesForFlexFriday,
      },
      reportDate: report.reportDate,
    }));

    // Calcular estadísticas del ranking
    const rankingStats = {
      totalEntries: ranking.length,
      averageProductivity: Math.round(
        ranking.reduce((sum, r) => sum + r.metrics.productivityScore, 0) /
          ranking.length,
      ),
      highPerformers: ranking.filter((r) => r.metrics.productivityScore >= 90)
        .length,
      lowPerformers: ranking.filter((r) => r.metrics.productivityScore < 60)
        .length,
      flexEligible: ranking.filter((r) => r.metrics.qualifiesForFlex).length,
    };

    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.ADMIN.PRODUCTIVITY_RANKING_RETRIEVED,
      {
        date: targetDate.toISOString().split("T")[0],
        period,
        sector: sector || "todos",
        ranking,
        statistics: rankingStats,
        filters: {
          period,
          sector,
          sortBy,
          limit: parseInt(limit as string),
        },
      },
    );
  } catch (error) {
    console.error("Error en getProductivityRanking:", error);
    sendInternalErrorResponse(res);
  }
};
