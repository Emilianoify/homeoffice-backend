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

interface UpdateProfileRequest {
  username?: string;
  firstname?: string;
  lastname?: string;
  corporative_email?: string;
}

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id; // Usuario ya autenticado por middleware
    const {
      username,
      firstname,
      lastname,
      corporative_email,
    }: UpdateProfileRequest = req.body;

    // Verificar que al menos un campo esté presente para actualizar
    if (!username && !firstname && !lastname && !corporative_email) {
      return sendBadRequest(
        res,
        ERROR_MESSAGES.USER.NO_FIELDS_TO_UPDATE,
        "400",
      );
    }

    // Preparar objeto de actualización
    const updateData: Partial<UpdateProfileRequest> = {};

    // Validar y preparar username si se proporciona
    if (username !== undefined) {
      if (!username.trim()) {
        return sendBadRequest(res, ERROR_MESSAGES.USER.EMPTY_USERNAME, "400");
      }

      if (!isValidUsername(username)) {
        return sendBadRequest(
          res,
          ERROR_MESSAGES.AUTH.INVALID_USERNAME_FORMAT,
          "400",
        );
      }

      // Verificar que el username no esté en uso por otro usuario
      const existingUser = (await User.findOne({
        where: { username },
        attributes: ["id"],
      })) as IUser | null;

      if (existingUser && existingUser.id !== userId) {
        return sendBadRequest(res, ERROR_MESSAGES.AUTH.USERNAME_IN_USE, "409");
      }

      updateData.username = username.trim();
    }

    // Validar y preparar email si se proporciona
    if (corporative_email !== undefined) {
      if (!corporative_email.trim()) {
        return sendBadRequest(res, ERROR_MESSAGES.USER.EMPTY_EMAIL, "400");
      }

      if (!isValidEmail(corporative_email)) {
        return sendBadRequest(
          res,
          ERROR_MESSAGES.AUTH.INVALID_EMAIL_FORMAT,
          "400",
        );
      }

      // Verificar que el email no esté en uso por otro usuario
      const existingEmail = (await User.findOne({
        where: { corporative_email },
        attributes: ["id"],
      })) as IUser | null;

      if (existingEmail && existingEmail.id !== userId) {
        sendBadRequest(res, ERROR_MESSAGES.AUTH.EMAIL_IN_USE, "409");
        return;
      }

      updateData.corporative_email = corporative_email.trim().toLowerCase();
    }

    // Validar y preparar nombres si se proporcionan
    if (firstname !== undefined) {
      if (!firstname.trim() || firstname.trim().length < 2) {
        sendBadRequest(res, ERROR_MESSAGES.USER.INVALID_FIRSTNAME, "400");
        return;
      }
      updateData.firstname = firstname.trim();
    }

    if (lastname !== undefined) {
      if (!lastname.trim() || lastname.trim().length < 2) {
        sendBadRequest(res, ERROR_MESSAGES.USER.INVALID_LASTNAME, "400");
        return;
      }
      updateData.lastname = lastname.trim();
    }

    // Actualizar el usuario
    await User.update(updateData, { where: { id: userId } });

    // Obtener el usuario actualizado con información del rol
    const updatedUser = (await User.findByPk(userId, {
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

    // Log de actualización
    const updatedFields = Object.keys(updateData);

    // Preparar datos de respuesta
    const responseData = {
      id: updatedUser.id,
      username: updatedUser.username,
      firstname: updatedUser.firstname,
      lastname: updatedUser.lastname,
      corporative_email: updatedUser.corporative_email,
      isActive: updatedUser.isActive,
      lastLogin: updatedUser.lastLogin,
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
      updatedFields,
      updatedAt: new Date().toISOString(),
    };

    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.USER.PROFILE_UPDATED,
      "200",
      responseData,
    );
  } catch (error) {
    console.error("Error en updateProfile:", error);
    sendInternalErrorResponse(res);
  }
};
