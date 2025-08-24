import { Response } from "express";
import { UserSession, PopupResponse } from "../../models";
import { AuthRequest } from "../../interfaces/auth.interface";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { generateMathExercise } from "../../utils/commons/mathExercises";
import { calculateNextPopupTime } from "../../utils/commons/nextPopupTime";
import { PopupResult } from "../../utils/enums/PopupResult";

export const generatePopup = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { force = false } = req.body; // Para testing manual

    // Buscar sesión activa
    const activeSession = (await UserSession.findOne({
      where: {
        userId,
        isActive: true,
      },
    })) as any;

    if (!activeSession) {
      sendBadRequest(res, ERROR_MESSAGES.POPUPS.NO_ACTIVE_SESSION, "400");
      return;
    }

    // Verificar si es hora del popup (a menos que sea forzado)
    if (!force) {
      const now = new Date();
      const nextPopupTime = new Date(activeSession.nextPopupAt);

      if (now < nextPopupTime) {
        sendBadRequest(res, ERROR_MESSAGES.POPUPS.TIME_BETWEEN, "400");
        return;
      }
    }

    // Verificar si hay un popup pendiente sin responder
    const pendingPopup = await PopupResponse.findOne({
      where: {
        userId,
        sessionId: activeSession.id,
        result: PopupResult.PENDING,
      },
    });

    if (pendingPopup) {
      sendBadRequest(res, ERROR_MESSAGES.POPUPS.POPUP_IS_ACTIVE, "400");
      return;
    }

    // Generar ejercicio matemático
    const exercise = generateMathExercise();

    // Crear popup en BD
    const popup = (await PopupResponse.create({
      userId,
      sessionId: activeSession.id,
      exercise: exercise.question,
      correctAnswer: exercise.answer,
      popupTime: new Date(),
      timeLimit: 60, // 1 minuto
      result: PopupResult.PENDING,
      isFirstAttempt: true,
    })) as any;

    // Actualizar contadores de sesión
    await UserSession.update(
      {
        totalPopupsReceived: (activeSession.totalPopupsReceived || 0) + 1,
        nextPopupAt: calculateNextPopupTime(req.user!.popupFrequency),
      },
      { where: { id: activeSession.id } },
    );

    // Respuesta con datos del popup
    sendSuccessResponse(res, SUCCESS_MESSAGES.POPUPS.POPUP_SENT, "200", {
      popupId: popup.id,
      exercise: exercise.question,
      timeLimit: 60,
      popupTime: popup.popupTime,
      expiresAt: new Date(Date.now() + 60000), // +1 minuto
      isFirstAttempt: true,
    });
  } catch (error) {
    console.error("Error en generatePopup:", error);
    sendInternalErrorResponse(res);
  }
};
