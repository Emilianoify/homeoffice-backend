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
import {
  isValidEmail,
  isValidUsername,
} from "../../utils/validators/validators";
import { IRole } from "../../interfaces/role.interface";
import { Sector } from "../../utils/enums/Sector";

interface AdminUpdateUserProfileRequest {
  username?: string;
  firstname?: string;
  lastname?: string;
  corporative_email?: string;
  roleId?: string;
  sector?: Sector;
}

export const updateUserProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const adminUserId = req.user!.id; // Admin autenticado
    const targetUserId = req.params.userId; // Usuario objetivo
    const {
      username,
      firstname,
      lastname,
      corporative_email,
      roleId,
      sector,
    }: AdminUpdateUserProfileRequest = req.body;

    // Validación de parámetros
    if (!targetUserId) {
      sendBadRequest(res, ERROR_MESSAGES.ADMIN.USER_ID_REQUIRED, "400");
      return;
    }

    // Verificar que al menos un campo esté presente para actualizar
    if (
      !username &&
      !firstname &&
      !lastname &&
      !corporative_email &&
      !roleId &&
      !sector
    ) {
      sendBadRequest(res, ERROR_MESSAGES.USER.NO_FIELDS_TO_UPDATE, "400");
      return;
    }

    // Verificar que el usuario objetivo exista
    const targetUser = (await User.findByPk(targetUserId, {
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
        "roleId",
        "isActive",
        "sector",
      ],
    })) as IUser | null;

    if (!targetUser) {
      sendBadRequest(res, ERROR_MESSAGES.ADMIN.TARGET_USER_NOT_FOUND, "404");
      return;
    }

    // Preparar objeto de actualización
    const updateData: Partial<AdminUpdateUserProfileRequest> = {};
    const changesLog: string[] = [];

    // Validar y preparar username si se proporciona
    if (username !== undefined) {
      if (!username.trim()) {
        sendBadRequest(res, ERROR_MESSAGES.USER.EMPTY_USERNAME, "400");
        return;
      }

      if (!isValidUsername(username)) {
        sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_USERNAME_FORMAT, "400");
        return;
      }

      // Verificar que el username no esté en uso por otro usuario
      const existingUser = (await User.findOne({
        where: { username },
        attributes: ["id"],
      })) as IUser | null;

      if (existingUser && existingUser.id !== targetUserId) {
        sendBadRequest(res, ERROR_MESSAGES.AUTH.USERNAME_IN_USE, "409");
        return;
      }

      if (username.trim() !== targetUser.username) {
        updateData.username = username.trim();
        changesLog.push(
          `username: ${targetUser.username} → ${username.trim()}`,
        );
      }
    }

    // Validar y preparar email si se proporciona
    if (corporative_email !== undefined) {
      if (!corporative_email.trim()) {
        sendBadRequest(res, ERROR_MESSAGES.USER.EMPTY_EMAIL, "400");
        return;
      }

      if (!isValidEmail(corporative_email)) {
        sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_EMAIL_FORMAT, "400");
        return;
      }

      // Verificar que el email no esté en uso por otro usuario
      const existingEmail = (await User.findOne({
        where: { corporative_email },
        attributes: ["id"],
      })) as IUser | null;

      if (existingEmail && existingEmail.id !== targetUserId) {
        sendBadRequest(res, ERROR_MESSAGES.AUTH.EMAIL_IN_USE, "409");
        return;
      }

      const newEmail = corporative_email.trim().toLowerCase();
      if (newEmail !== targetUser.corporative_email) {
        updateData.corporative_email = newEmail;
        changesLog.push(`email: ${targetUser.corporative_email} → ${newEmail}`);
      }
    }

    // Validar y preparar nombres si se proporcionan
    if (firstname !== undefined) {
      if (!firstname.trim() || firstname.trim().length < 2) {
        sendBadRequest(res, ERROR_MESSAGES.USER.INVALID_FIRSTNAME, "400");
        return;
      }

      if (firstname.trim() !== targetUser.firstname) {
        updateData.firstname = firstname.trim();
        changesLog.push(
          `firstname: ${targetUser.firstname} → ${firstname.trim()}`,
        );
      }
    }

    if (lastname !== undefined) {
      if (!lastname.trim() || lastname.trim().length < 2) {
        sendBadRequest(res, ERROR_MESSAGES.USER.INVALID_LASTNAME, "400");
        return;
      }

      if (lastname.trim() !== targetUser.lastname) {
        updateData.lastname = lastname.trim();
        changesLog.push(
          `lastname: ${targetUser.lastname} → ${lastname.trim()}`,
        );
      }
    }

    // Validar y preparar roleId si se proporciona
    if (roleId !== undefined) {
      if (roleId !== targetUser.roleId) {
        // Verificar que el nuevo rol exista y esté activo
        const newRole = (await Role.findByPk(roleId)) as IRole | null;
        if (!newRole) {
          sendBadRequest(res, ERROR_MESSAGES.AUTH.ROLE_NOT_FOUND, "404");
          return;
        }

        if (!newRole.isActive) {
          sendBadRequest(res, ERROR_MESSAGES.AUTH.ROLE_INACTIVE, "400");
          return;
        }

        updateData.roleId = roleId;
        changesLog.push(`rol: ${targetUser.role?.name} → ${newRole.name}`);
      }
    }

    if (sector !== undefined) {
      if (!Object.values(Sector).includes(sector)) {
        sendBadRequest(res, ERROR_MESSAGES.AUTH.SECTOR_NOT_FOUND, "400");
        return;
      }
      if (sector === targetUser.sector) {
        sendBadRequest(res, ERROR_MESSAGES.AUTH.SAME_SECTOR, "400");
        return;
      }
      updateData.sector = sector;
    }

    // Si no hay cambios reales, devolver mensaje
    if (Object.keys(updateData).length === 0) {
      sendSuccessResponse(
        res,
        SUCCESS_MESSAGES.ADMIN.NO_CHANGES_DETECTED,
        "200",
        {
          message: "No se detectaron cambios en los datos proporcionados",
          targetUser: {
            id: targetUser.id,
            username: targetUser.username,
          },
        },
      );
      return;
    }

    // Actualizar el usuario
    await User.update(updateData, { where: { id: targetUserId } });

    // Obtener el usuario actualizado con información del rol
    const updatedUser = (await User.findByPk(targetUserId, {
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

    if (!updatedUser) {
      sendBadRequest(res, ERROR_MESSAGES.USER.UPDATE_FAILED, "500");
      return;
    }

    // Log de auditoría detallado
    console.log(`✏️  [ADMIN UPDATE] Perfil modificado:`);
    console.log(`   Admin: ${req.user!.username} (${adminUserId})`);
    console.log(
      `   Usuario modificado: ${updatedUser.username} (${targetUserId})`,
    );
    console.log(`   Cambios realizados:`);
    changesLog.forEach((change) => console.log(`     - ${change}`));
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // Preparar datos de respuesta
    const responseData = {
      id: updatedUser.id,
      username: updatedUser.username,
      firstname: updatedUser.firstname,
      lastname: updatedUser.lastname,
      corporative_email: updatedUser.corporative_email,
      isActive: updatedUser.isActive,
      lastLogin: updatedUser.lastLogin,
      sector: updatedUser.sector,
      role: {
        id: updatedUser.role?.id,
        name: updatedUser.role?.name,
        description: updatedUser.role?.description,
        permissions: updatedUser.role?.permissions,
        isActive: updatedUser.role?.isActive,
      },
      account: {
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
      adminAction: {
        performedBy: req.user!.username,
        changesApplied: changesLog,
        timestamp: new Date().toISOString(),
      },
    };

    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.ADMIN.USER_PROFILE_UPDATED,
      "200",
      responseData,
    );
  } catch (error) {
    console.error("Error en updateUserProfile:", error);
    sendInternalErrorResponse(res);
  }
};
