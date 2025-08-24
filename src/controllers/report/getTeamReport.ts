import { AuthRequest } from "../../interfaces/auth.interface";
import { DailyReport, User } from "../../models";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { Response } from "express";

export const getTeamReport = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userSector = req.user!.sector;
    const { date, limit = 50 } = req.query;

    let targetDate = new Date();
    if (date) {
      targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        sendBadRequest(res, ERROR_MESSAGES.REPORTS.INVALID_DATE_RANGE);
        return;
      }
    }

    const dateStr = targetDate.toISOString().split("T")[0];

    // Obtener reportes del equipo (mismo sector)
    const teamReports = (await DailyReport.findAll({
      where: {
        reportDate: dateStr,
      },
      include: [
        {
          model: User,
          as: "user",
          where: {
            sector: userSector,
            isActive: true,
          },
          attributes: ["id", "username", "firstname", "lastname", "sector"],
        },
      ],
      order: [["productivityScore", "DESC"]],
      limit: parseInt(limit as string),
    })) as any[];

    // Calcular estadísticas del equipo
    const teamStats = {
      totalMembers: teamReports.length,
      averageProductivity: 0,
      highPerformers: 0, // >85%
      lowPerformers: 0, // <60%
      flexEligible: 0,
      totalMinutesWorked: 0,
      topPerformer: null as any,
      sectorRanking: userSector,
    };

    if (teamReports.length > 0) {
      teamStats.averageProductivity = Math.round(
        teamReports.reduce((sum, r) => sum + r.productivityScore, 0) /
          teamReports.length,
      );

      teamStats.highPerformers = teamReports.filter(
        (r) => r.productivityScore >= 85,
      ).length;
      teamStats.lowPerformers = teamReports.filter(
        (r) => r.productivityScore < 60,
      ).length;
      teamStats.flexEligible = teamReports.filter(
        (r) => r.qualifiesForFlexFriday,
      ).length;
      teamStats.totalMinutesWorked = teamReports.reduce(
        (sum, r) => sum + r.totalMinutesWorked,
        0,
      );
      teamStats.topPerformer = teamReports[0]; // Ya ordenados por productivityScore DESC
    }

    sendSuccessResponse(res, SUCCESS_MESSAGES.REPORTS.TEAM_REPORT_RETRIEVED, {
      date: dateStr,
      sector: userSector,
      teamReports,
      statistics: teamStats,
      viewer: {
        username: req.user!.username,
        canViewTeam: true,
      },
    });
  } catch (error) {
    console.error("Error en getTeamReport:", error);
    sendInternalErrorResponse(res);
  }
};
