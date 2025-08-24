import sequelize from "../../config/db";
import { logout } from "../../controllers/auth";
import { AuthRequest } from "../../interfaces/auth.interface";
import { UserSession, PopupResponse } from "../../models";
import { SUCCESS_MESSAGES } from "../constants/messages/success.messages";
import { PopupAction } from "../enums/PopupAction";
import { PopupResult } from "../enums/PopupResult";
import { generateMathExercise } from "./mathExercises";
import { sendSuccessResponse } from "./responseFunctions";
import { Response } from "express";

export async function handlePopupSuccess(
  popup: any,
  res: Response,
): Promise<void> {
  // Actualizar contadores de sesión
  await UserSession.update(
    {
      totalPopupsCorrect: sequelize.literal("totalPopupsCorrect + 1"),
    },
    { where: { id: popup.sessionId } },
  );

  sendSuccessResponse(res, SUCCESS_MESSAGES.POPUPS.POPUP_CORRECT, "200", {
    result: PopupResult.CORRECT,
    message: "Excelente trabajo. Puedes continuar trabajando.",
    nextPopupIn: "Se calculará automáticamente",
  });
}

export async function handlePopupFailure(
  popup: any,
  res: Response,
  failureType: PopupResult.INCORRECT | PopupResult.TIMEOUT,
  req: AuthRequest,
): Promise<void> {
  if (popup.isFirstAttempt) {
    // Primera falla: dar segunda oportunidad
    const exercise = generateMathExercise();

    const secondChance = await PopupResponse.create({
      userId: popup.userId,
      sessionId: popup.sessionId,
      exercise: exercise.question,
      correctAnswer: exercise.answer,
      popupTime: new Date(),
      timeLimit: 60,
      result: PopupResult.PENDING,
      isFirstAttempt: false,
      previousPopupId: popup.id,
    });

    sendSuccessResponse(res, SUCCESS_MESSAGES.POPUPS.SECOND_CHANCE, "200", {
      result: PopupAction.SECOND_CHANCE,
      message:
        failureType === PopupResult.TIMEOUT
          ? SUCCESS_MESSAGES.POPUPS.POPUP_FIRST_TIMEOUT
          : SUCCESS_MESSAGES.POPUPS.POPUP_FIRST_ERROR,
      newPopup: {
        popupId: secondChance.id,
        exercise: exercise.question,
        timeLimit: 60,
        expiresAt: new Date(Date.now() + 60000),
      },
    });
  } else {
    // Segunda falla: cerrar sesión
    // TODO: Implementar cierre de sesión

    sendSuccessResponse(res, SUCCESS_MESSAGES.POPUPS.CLOSING_SESSION, "200", {
      result: PopupResult.SESSION_CLOSED,
      message: "Se cerró la sesión por fallar dos veces seguidas.",
      action: "logout_required",
    });
    logout(req, res);
  }
}
