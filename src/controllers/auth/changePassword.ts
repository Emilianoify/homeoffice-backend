import { Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../../models";
import { AuthRequest } from "../../interfaces/auth.interface";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { isValidPassword } from "../../utils/validators/validators";
import { revokeAllUserTokens } from "../../utils/commons/tokenManager";

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;
    const userId = req.user!.id; // Usuario ya autenticado por middleware

    // Validación de campos requeridos
    if (!currentPassword || !newPassword) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.MISSING_PASSWORD_FIELDS, "400");
      return;
    }

    // Validación de fortaleza de nueva contraseña
    if (!isValidPassword(newPassword)) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.WEAK_PASSWORD, "400");
      return;
    }

    // Verificar que las contraseñas sean diferentes
    if (currentPassword === newPassword) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.SAME_PASSWORD, "400");
      return;
    }

    // Buscar el usuario con su contraseña actual
    const user = (await User.findByPk(userId, {
      attributes: [
        "id",
        "username",
        "password",
        "corporative_email",
        "isActive",
      ],
    })) as any;

    if (!user) {
      sendBadRequest(res, ERROR_MESSAGES.USER.USER_NOT_FOUND, "404");
      return;
    }

    // Verificar que el usuario siga activo
    if (!user.isActive) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.USER_INACTIVE, "401");
      return;
    }

    // Verificar la contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_CURRENT_PASSWORD, "401");
      return;
    }

    // Verificar que la nueva contraseña sea diferente a la actual (hash comparison)
    const isSameAsCurrentPassword = await bcrypt.compare(
      newPassword,
      user.password,
    );
    if (isSameAsCurrentPassword) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.SAME_PASSWORD, "400");
      return;
    }

    // Hash de la nueva contraseña
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña y lastLogin
    await User.update(
      {
        password: hashedNewPassword,
        lastLogin: new Date(),
      },
      { where: { id: userId } },
    );

    // Revocar todos los tokens del usuario por seguridad
    // Esto fuerza logout en todos los dispositivos
    revokeAllUserTokens(userId, "password_change");

    // Respuesta exitosa (sin datos sensibles)
    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUTH.PASSWORD_CHANGED_SUCCESS,
      "200",
      {
        message: "Contraseña actualizada correctamente",
        timestamp: new Date().toISOString(),
        securityNote:
          "Se ha cerrado sesión en todos los dispositivos por seguridad",
        nextStep: "Inicia sesión nuevamente con tu nueva contraseña",
      },
    );
  } catch (error) {
    console.error("Error en changePassword:", error);
    sendInternalErrorResponse(res);
  }
};
