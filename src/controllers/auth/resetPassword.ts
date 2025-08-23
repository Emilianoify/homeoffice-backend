import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User, Role } from "../../models";
import { IUser } from "../../interfaces/user.interface";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { isValidPassword } from "../../utils/validators/validators";
import { revokeAllUserTokens } from "../../utils/commons/tokenManager";
import { COMMENTS } from "../../utils/constants/messages/comments";
import { Op } from "sequelize";

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token, newPassword }: ResetPasswordRequest = req.body;

    // Validación de campos requeridos
    if (!token || !newPassword) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.MISSING_RESET_FIELDS, "400");
      return;
    }

    // Validación de fortaleza de nueva contraseña
    if (!isValidPassword(newPassword)) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.WEAK_PASSWORD, "400");
      return;
    }

    // Buscar usuario con el token de recuperación válido y no expirado
    const user = (await User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          [Op.gt]: new Date(), // Token no expirado
        },
      },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name", "isActive"],
        },
      ],
    })) as IUser | null;

    // Verificar que el token sea válido
    if (!user) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_RESET_TOKEN, "400");
      return;
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.USER_INACTIVE, "401");
      return;
    }

    // Verificar que el rol esté activo
    if (!user.role?.isActive) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.ROLE_INACTIVE, "401");
      return;
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const isSamePassword = await bcrypt.compare(newPassword, user.password!);
    if (isSamePassword) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.SAME_PASSWORD, "400");
      return;
    }

    // Hash de la nueva contraseña
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña y limpiar tokens de recuperación
    await User.update(
      {
        password: hashedNewPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        lastLogin: new Date(), // Actualizar último acceso
      },
      { where: { id: user.id } },
    );

    // Revocar todos los tokens JWT existentes del usuario
    // Esto fuerza logout en todos los dispositivos por seguridad
    revokeAllUserTokens(user.id, "password_change");

    // Respuesta exitosa (sin datos sensibles)
    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.AUTH.PASSWORD_RESET_SUCCESS,
      "200",
      {
        message: "Contraseña actualizada correctamente",
        timestamp: new Date().toISOString(),
        nextStep: COMMENTS.RECOVERY_NEXT_STEP,
      },
    );
  } catch (error) {
    console.error("Error en resetPassword:", error);
    sendInternalErrorResponse(res);
  }
};
