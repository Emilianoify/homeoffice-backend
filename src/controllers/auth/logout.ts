import { AuthRequest } from "../../interfaces/auth.interface";
import { User } from "../../models";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { revokeToken } from "../../utils/commons/tokenManager";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { Response } from "express";

export const logout = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // El token ya fue validado por checkToken middleware
    const token = req.rawToken;

    if (!token) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.TOKEN_REQUIRED, "400");
      return;
    }

    // Agregar token a la lista de tokens revocados
    revokeToken(token, "logout");

    // Actualizar lastLogin del usuario (opcional, para tracking)
    if (req.user) {
      await User.update(
        { lastLogin: new Date() },
        { where: { id: req.user.id } },
      );
    }

    sendSuccessResponse(res, SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS, "200", {
      message: SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en logout:", error);
    sendInternalErrorResponse(res);
  }
};
