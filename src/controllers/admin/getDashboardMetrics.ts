import { Response } from "express";
import { AuthRequest } from "../../interfaces/auth.interface";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { calculateAlerts } from "../../utils/commons/calculateAlerts";
import { calculateFlexFridayStats } from "../../utils/commons/calculateFlexFridayStats";
import { calculatePerformanceRanking } from "../../utils/commons/calculatePerformanceRanking";
import { calculateRealTimeMetrics } from "../../utils/commons/calculateRealTimeMetrics";
import { calculateSectorRanking } from "../../utils/commons/calculateSectorRanking";
import { calculateGeneralMetrics } from "../../utils/commons/calculateGeneralMetrics";

export const getDashboardMetrics = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { date, period = "day" } = req.query;

    let targetDate = new Date();
    if (date) {
      targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        sendBadRequest(res, "Formato de fecha inválido");
        return;
      }
    }

    const dateStr = targetDate.toISOString().split("T")[0];

    // 1. Métricas generales del día
    const generalMetrics = await calculateGeneralMetrics(dateStr);

    // 2. Ranking por sector
    const sectorRanking = await calculateSectorRanking(dateStr);

    // 3. Top performers y low performers
    const performanceRanking = await calculatePerformanceRanking(dateStr);

    // 4. Alertas y usuarios en riesgo
    const alerts = await calculateAlerts(dateStr);

    // 5. Estadísticas de viernes flex
    const flexFridayStats = await calculateFlexFridayStats(dateStr);

    // 6. Métricas de actividad en tiempo real
    const realTimeMetrics = await calculateRealTimeMetrics();

    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.ADMIN.DASHBOARD_METRICS_RETRIEVED,
      {
        date: dateStr,
        period,
        generalMetrics,
        sectorRanking,
        performanceRanking,
        alerts,
        flexFridayStats,
        realTimeMetrics,
        generatedAt: new Date().toISOString(),
        generatedBy: {
          username: req.user!.username,
          role: req.user!.role?.name,
        },
      },
    );
  } catch (error) {
    console.error("Error en getDashboardMetrics:", error);
    sendInternalErrorResponse(res);
  }
};
