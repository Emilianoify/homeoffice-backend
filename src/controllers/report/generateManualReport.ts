import { AuthRequest } from "../../interfaces/auth.interface";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { reportWorker } from "../../utils/workers/reportWorker";
import { Response } from "express";

export const generateManualReport = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { date } = req.body;
    const userId = req.user!.id;

    let targetDate = new Date();
    if (date) {
      targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        sendBadRequest(res, ERROR_MESSAGES.REPORTS.INVALID_DATE_RANGE);
        return;
      }
    }

    // Verificar que no sea fecha futura
    if (targetDate > new Date()) {
      sendBadRequest(res, ERROR_MESSAGES.REPORTS.FUTURE_DATE_NOT_ALLOWED);
      return;
    }

    console.log(
      `📊 Generación manual de reporte solicitada por ${req.user!.username}`,
    );

    // Generar reporte usando el servicio
    const report = await reportWorker.generateManualReport(userId, targetDate);

    sendSuccessResponse(res, SUCCESS_MESSAGES.REPORTS.MANUAL_REPORT_GENERATED, {
      report,
      generatedAt: new Date().toISOString(),
      requestedBy: {
        username: req.user!.username,
        userId: req.user!.id,
      },
    });
  } catch (error) {
    console.error("Error en generateManualReport:", error);
    sendInternalErrorResponse(res);
  }
};
