import { IUser } from "../../interfaces/user.interface";
import { User, Role } from "../../models";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { Request, Response } from "express";

import { COMMENTS } from "../../utils/constants/messages/comments";
import { Op } from "sequelize";
import { generateRecoveryToken, generateTokenExpiration } from "./helper";

interface ForgotPasswordRequest {
  identifier: string;
}

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { identifier }: ForgotPasswordRequest = req.body;

    // Validación de campo requerido
    if (!identifier) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.IDENTIFIER_REQUIRED, "400");
      return;
    }

    // Buscar usuario por username o email
    const user = (await User.findOne({
      where: {
        [Op.or]: [{ username: identifier }, { corporative_email: identifier }],
      },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name", "isActive"],
        },
      ],
    })) as IUser | null;

    // Por seguridad, siempre respondemos éxito aunque el usuario no exista
    // Esto previene enumeración de usuarios válidos
    if (!user) {
      sendSuccessResponse(
        res,
        SUCCESS_MESSAGES.AUTH.RECOVERY_EMAIL_SENT,
        "200",
        {
          message: COMMENTS.IF_USER_EXISTS,
          estimatedDelivery: COMMENTS.RECOVERY_EMAIL_DELIVERY,
        },
      );
      return;
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      sendSuccessResponse(
        res,
        SUCCESS_MESSAGES.AUTH.RECOVERY_EMAIL_SENT,
        "200",
        {
          message: COMMENTS.IF_USER_EXISTS,
          estimatedDelivery: COMMENTS.RECOVERY_EMAIL_DELIVERY,
        },
      );
      return;
    }

    // Verificar que el rol esté activo
    if (!user.role?.isActive) {
      sendSuccessResponse(
        res,
        SUCCESS_MESSAGES.AUTH.RECOVERY_EMAIL_SENT,
        "200",
        {
          message: COMMENTS.IF_USER_EXISTS,
          estimatedDelivery: COMMENTS.RECOVERY_EMAIL_DELIVERY,
        },
      );
      return;
    }

    // Generar token de recuperación y fecha de expiración
    const recoveryToken = generateRecoveryToken();
    const tokenExpiration = generateTokenExpiration();

    // Actualizar usuario con token de recuperación
    await User.update(
      {
        passwordResetToken: recoveryToken,
        passwordResetExpires: tokenExpiration,
      },
      { where: { id: user.id } },
    );

    // TODO: Aquí se enviaría el email real
    // Por ahora simulamos el envío con console.log
    console.log("\n📧 ========== EMAIL DE RECUPERACIÓN ==========");
    console.log(`Para: ${user.corporative_email}`);
    console.log(`Usuario: ${user.firstname} ${user.lastname}`);
    console.log(`Token de recuperación: ${recoveryToken}`);
    console.log(`Válido hasta: ${tokenExpiration.toLocaleString()}`);
    console.log("============================================\n");

    // Log para debugging (quitar en producción)
    console.log(
      `🔑 Token generado para ${user.username}: ${recoveryToken} (expira: ${tokenExpiration})`,
    );

    sendSuccessResponse(res, SUCCESS_MESSAGES.AUTH.RECOVERY_EMAIL_SENT, "200", {
      message: COMMENTS.IF_USER_EXISTS,
      estimatedDelivery: COMMENTS.RECOVERY_EMAIL_DELIVERY,
      // En desarrollo, incluir token para testing
      ...(process.env.NODE_ENV === "development" && {
        dev_token: recoveryToken,
        dev_expires: tokenExpiration,
      }),
    });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    sendInternalErrorResponse(res);
  }
};
