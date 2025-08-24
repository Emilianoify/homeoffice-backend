import { AuthRequest } from "../../interfaces/auth.interface";
import { PopupResponse } from "../../models";
import {
  handlePopupFailure,
  handlePopupSuccess,
} from "../../utils/commons/handlePopup";
import {
  sendBadRequest,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { Response } from "express";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { PopupResult } from "../../utils/enums/PopupResult";
import { PopupAction } from "../../utils/enums/PopupAction";

export const respondPopup = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { popupId, userAnswer } = req.body;
    const userId = req.user!.id;

    // Validaciones
    if (!popupId || userAnswer === undefined || userAnswer === null) {
      sendBadRequest(res, ERROR_MESSAGES.POPUPS.MISSING_FIELDS, "400");
      return;
    }

    // Buscar el popup
    const popup = (await PopupResponse.findOne({
      where: {
        id: popupId,
        userId,
        result: PopupResult.PENDING,
      },
    })) as any;

    if (!popup) {
      sendBadRequest(res, ERROR_MESSAGES.POPUPS.NOT_FOUND, "404");
      return;
    }

    // Verificar tiempo límite
    const now = new Date();
    const popupTime = new Date(popup.popupTime);
    const timeElapsed = Math.round(
      (now.getTime() - popupTime.getTime()) / 1000,
    ); // segundos

    if (timeElapsed > popup.timeLimit) {
      // Timeout - marcar como tal
      await PopupResponse.update(
        {
          result: PopupResult.TIMEOUT,
          actionTaken: popup.isFirstAttempt
            ? PopupAction.SECOND_CHANCE
            : PopupAction.SESSION_CLOSED,
        },
        { where: { id: popupId } },
      );

      return handlePopupFailure(popup, res, PopupResult.TIMEOUT, req);
    }

    // Procesar respuesta
    const isCorrect = parseInt(userAnswer) === popup.correctAnswer;
    const result = isCorrect ? PopupResult.CORRECT : PopupResult.INCORRECT;

    // Actualizar popup con respuesta
    await PopupResponse.update(
      {
        userAnswer: parseInt(userAnswer),
        answeredAt: now,
        responseTime: timeElapsed,
        isCorrect,
        wasAnswered: true,
        result,
        actionTaken: isCorrect
          ? PopupAction.NONE
          : popup.isFirstAttempt
            ? PopupAction.SECOND_CHANCE
            : PopupAction.SESSION_CLOSED,
      },
      { where: { id: popupId } },
    );

    if (isCorrect) {
      // Respuesta correcta
      await handlePopupSuccess(popup, res);
    } else {
      // Respuesta incorrecta
      await handlePopupFailure(popup, res, PopupResult.INCORRECT, req);
    }
  } catch (error) {
    console.error("Error en respondPopup:", error);
    sendInternalErrorResponse(res);
  }
};
