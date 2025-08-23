import { Response } from "express";
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

export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const adminUserId = req.user!.id; // Admin autenticado
    const targetUserId = req.params.userId; // Usuario objetivo

    // Validación de parámetros
    if (!targetUserId) {
      sendBadRequest(res, ERROR_MESSAGES.ADMIN.USER_ID_REQUIRED, "400");
      return;
    }

    // Buscar el usuario objetivo con información completa
    const targetUser = (await User.findByPk(targetUserId, {
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name", "description", "permissions", "isActive"],
        },
      ],
      attributes: {
        exclude: ["password", "passwordResetToken", "passwordResetExpires"],
      },
    })) as IUser | null;

    // Verificar que el usuario objetivo exista
    if (!targetUser) {
      sendBadRequest(res, ERROR_MESSAGES.ADMIN.TARGET_USER_NOT_FOUND, "404");
      return;
    }

    // Función helper para calcular tiempo como miembro
    const calculateMemberSince = (createdAt: Date): string => {
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) {
        return `${diffDays} días`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} ${months === 1 ? "mes" : "meses"}`;
      } else {
        const years = Math.floor(diffDays / 365);
        const remainingMonths = Math.floor((diffDays % 365) / 30);
        if (remainingMonths === 0) {
          return `${years} ${years === 1 ? "año" : "años"}`;
        }
        return `${years} ${years === 1 ? "año" : "años"} y ${remainingMonths} ${remainingMonths === 1 ? "mes" : "meses"}`;
      }
    };

    // Preparar datos completos del perfil
    const profileData = {
      id: targetUser.id,
      username: targetUser.username,
      firstname: targetUser.firstname,
      lastname: targetUser.lastname,
      corporative_email: targetUser.corporative_email,
      isActive: targetUser.isActive,
      lastLogin: targetUser.lastLogin,
      role: {
        id: targetUser.role?.id,
        name: targetUser.role?.name,
        description: targetUser.role?.description,
        permissions: targetUser.role?.permissions,
        isActive: targetUser.role?.isActive,
      },
      account: {
        createdAt: targetUser.createdAt,
        updatedAt: targetUser.updatedAt,
        memberSince: calculateMemberSince(targetUser.createdAt),
      },
      adminInfo: {
        viewedBy: {
          id: adminUserId,
          username: req.user!.username,
        },
        viewedAt: new Date().toISOString(),
        canEdit: true, // El admin siempre puede editar
        canChangePassword: true, // El admin siempre puede cambiar contraseña
        canToggleStatus: targetUser.id !== adminUserId, // No puede desactivarse a sí mismo
      },
    };

    // Log de auditoría
    console.log(`👁️  [ADMIN VIEW] Perfil consultado:`);
    console.log(`   Admin: ${req.user!.username} (${adminUserId})`);
    console.log(
      `   Usuario consultado: ${targetUser.username} (${targetUserId})`,
    );
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.ADMIN.USER_PROFILE_RETRIEVED,
      "200",
      profileData,
    );
  } catch (error) {
    console.error("Error en getUserProfile:", error);
    sendInternalErrorResponse(res);
  }
};
