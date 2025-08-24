import { Response } from "express";
import { DailyReport } from "../../models";
import { AuthRequest } from "../../interfaces/auth.interface";
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { Op } from "sequelize";
import {
  daysOfWeek,
  getNextFriday,
  getWeekNumber,
} from "../../utils/constants/const";
import { generateRecommendations } from "../../utils/commons/generateRecommendations";

export const getFlexFridayStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const today = new Date();

    // Calcular inicio de la semana (lunes)
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay() || 7; // Domingo = 7
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    // Calcular fin de semana (viernes)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 4); // +4 días = viernes
    endOfWeek.setHours(23, 59, 59, 999);

    // Obtener reportes de la semana
    const weeklyReports = (await DailyReport.findAll({
      where: {
        userId,
        reportDate: {
          [Op.between]: [
            startOfWeek.toISOString().split("T")[0],
            endOfWeek.toISOString().split("T")[0],
          ],
        },
      },
      order: [["reportDate", "ASC"]],
    })) as any[];

    // Calcular estadísticas de la semana
    const weekStats = {
      daysWorked: weeklyReports.length,
      daysRequired: 5, // Lunes a viernes
      averageProductivity: 0,
      minimumRequired: req.user!.weeklyProductivityGoal || 85,
      qualifiesForFlex: false,
      currentStreak: 0,
      missingDays: [] as string[],
      dailyBreakdown: [] as any[],
    };

    if (weeklyReports.length > 0) {
      // Calcular promedio semanal
      const totalScore = weeklyReports.reduce(
        (sum, report) => sum + report.productivityScore,
        0,
      );
      weekStats.averageProductivity =
        Math.round((totalScore / weeklyReports.length) * 100) / 100;

      // Verificar elegibilidad para viernes flex
      weekStats.qualifiesForFlex =
        weekStats.averageProductivity >= weekStats.minimumRequired;

      // Calcular racha actual (días consecutivos sobre el mínimo)
      let streak = 0;
      for (let i = weeklyReports.length - 1; i >= 0; i--) {
        if (weeklyReports[i].productivityScore >= weekStats.minimumRequired) {
          streak++;
        } else {
          break;
        }
      }
      weekStats.currentStreak = streak;

      // Crear breakdown diario
      weekStats.dailyBreakdown = weeklyReports.map((report) => ({
        date: report.reportDate,
        productivity: report.productivityScore,
        qualifies: report.productivityScore >= weekStats.minimumRequired,
        minutesWorked: report.totalMinutesWorked,
        popupAccuracy: report.popupAccuracy,
        taskCompletion: report.taskCompletionRate,
      }));
    }

    // Identificar días faltantes de la semana

    const reportDates = weeklyReports.map((r) => r.reportDate);

    for (let i = 0; i < 5; i++) {
      const checkDate = new Date(startOfWeek);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split("T")[0];

      if (!reportDates.includes(dateStr) && checkDate <= today) {
        weekStats.missingDays.push(daysOfWeek[i]);
      }
    }

    // Información adicional para el usuario
    const flexInfo = {
      isCurrentlyFriday: today.getDay() === 5,
      canLeavePremium: weekStats.qualifiesForFlex && today.getDay() === 5,
      hoursCanSave: weekStats.qualifiesForFlex ? 2 : 0, // 2 horas antes
      nextEvaluation: getNextFriday(today),
      recommendations: generateRecommendations(weekStats),
    };

    sendSuccessResponse(res, SUCCESS_MESSAGES.REPORTS.FLEX_FRIDAY_STATUS, {
      weekRange: {
        start: startOfWeek.toISOString().split("T")[0],
        end: endOfWeek.toISOString().split("T")[0],
        currentWeek: getWeekNumber(today),
      },
      weeklyStatistics: weekStats,
      flexFridayInfo: flexInfo,
      user: {
        username: req.user!.username,
        firstname: req.user!.firstname,
        lastname: req.user!.lastname,
        weeklyGoal: req.user!.weeklyProductivityGoal || 85,
      },
    });
  } catch (error) {
    console.error("Error en getFlexFridayStatus:", error);
    sendInternalErrorResponse(res);
  }
};
