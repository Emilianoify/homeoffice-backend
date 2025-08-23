import { Response } from "express";
import bcrypt from "bcryptjs";
import { User, Role } from "../../models";
import { IUser } from "../../interfaces/user.interface";
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

interface AdminChangePasswordRequest {
  newPassword: string;
  reason?: string; // Opcional: razón del cambio
}

export const changeUserPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const adminUserId = req.user!.id; // Admin autenticado
    const targetUserId = req.params.userId; // Usuario objetivo
    const { newPassword, reason }: AdminChangePasswordRequest = req.body;

    // Validación de parámetros
    if (!targetUserId) {
      sendBadRequest(res, ERROR_MESSAGES.ADMIN.USER_ID_REQUIRED, "400");
      return;
    }

    if (!newPassword) {
      sendBadRequest(res, ERROR_MESSAGES.ADMIN.NEW_PASSWORD_REQUIRED, "400");
      return;
    }

    // Validación de fortaleza de nueva contraseña
    if (!isValidPassword(newPassword)) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.WEAK_PASSWORD, "400");
      return;
    }

    // Buscar el usuario objetivo
    const targetUser = (await User.findOne({
      where: { id: targetUserId },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name", "isActive"],
        },
      ],
      attributes: [
        "id",
        "username",
        "firstname",
        "lastname",
        "corporative_email",
        "password",
        "isActive",
      ],
    })) as IUser | null;

    if (!targetUser) {
      sendBadRequest(res, ERROR_MESSAGES.ADMIN.TARGET_USER_NOT_FOUND, "404");
      return;
    }

    // Verificar que el usuario objetivo esté activo
    if (!targetUser.isActive) {
      sendBadRequest(res, ERROR_MESSAGES.ADMIN.TARGET_USER_INACTIVE, "400");
      return;
    }

    // Seguridad: Prevenir que un admin cambie la contraseña de otro admin
    // a menos que sea un super admin (opcional, por ahora solo logging)
    if (targetUser.role?.name === "Administrador") {
      console.log(
        `⚠️  ADVERTENCIA: Admin ${req.user!.username} está cambiando contraseña de otro admin: ${targetUser.username}`,
      );
    }

    // Verificar que no sea la misma contraseña actual
    const isSamePassword = await bcrypt.compare(
      newPassword,
      targetUser.password!,
    );
    if (isSamePassword) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.SAME_PASSWORD, "400");
      return;
    }

    // Hash de la nueva contraseña
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await User.update(
      {
        password: hashedNewPassword,
        // No actualizamos lastLogin porque es acción de admin, no del usuario
      },
      { where: { id: targetUserId } },
    );

    // Revocar todos los tokens del usuario objetivo
    revokeAllUserTokens(targetUserId, "admin_password_change");

    // Log de seguridad detallado
    console.log(`🔐 [ADMIN ACTION] Contraseña cambiada por administrador:`);
    console.log(`   Admin: ${req.user!.username} (${adminUserId})`);
    console.log(
      `   Usuario objetivo: ${targetUser.username} (${targetUserId})`,
    );
    console.log(`   Razón: ${reason || "No especificada"}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(
      `🚫 Todos los tokens del usuario ${targetUser.username} han sido revocados`,
    );

    // Respuesta exitosa
    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.ADMIN.PASSWORD_CHANGED_SUCCESS,
      "200",
      {
        message: "Contraseña actualizada correctamente por administrador",
        targetUser: {
          id: targetUser.id,
          username: targetUser.username,
          firstname: targetUser.firstname,
          lastname: targetUser.lastname,
        },
        adminAction: {
          performedBy: req.user!.username,
          reason: reason || "No especificada",
          timestamp: new Date().toISOString(),
        },
        securityNote:
          "Se ha cerrado sesión en todos los dispositivos del usuario por seguridad",
        nextStep: "El usuario debe iniciar sesión nuevamente",
      },
    );
  } catch (error) {
    console.error("Error en changeUserPassword:", error);
    sendInternalErrorResponse(res);
  }
};
