import { IRole } from "../../interfaces/role.interface";
import { IUser } from "../../interfaces/user.interface";
import { Role, User } from "../../models";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
} from "../../utils/validators/validators";

interface RegisterRequest {
  username: string;
  firstname: string;
  lastname: string;
  corporative_email: string;
  password: string;
  roleId: string;
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      username,
      firstname,
      lastname,
      corporative_email,
      password,
      roleId,
    }: RegisterRequest = req.body;

    // Validación de campos requeridos
    if (
      !username ||
      !firstname ||
      !lastname ||
      !corporative_email ||
      !password ||
      !roleId
    ) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.MISSING_REQUIRED_FIELDS, "400");
      return;
    }

    // Validación de formato de username
    if (!isValidUsername(username)) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_USERNAME_FORMAT, "400");
      return;
    }

    // Validación de formato de email
    if (!isValidEmail(corporative_email)) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_EMAIL_FORMAT, "400");
      return;
    }

    // Validación de fortaleza de contraseña
    if (!isValidPassword(password)) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.WEAK_PASSWORD, "400");
      return;
    }

    // Verificar que el rol exista y esté activo
    const role = (await Role.findByPk(roleId)) as IRole | null;
    if (!role) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.ROLE_NOT_FOUND, "404");
      return;
    }

    if (!role.isActive) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.ROLE_INACTIVE, "400");
      return;
    }

    // Verificar que el username no esté en uso
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.USERNAME_IN_USE, "409");
      return;
    }

    // Verificar que el email no esté en uso
    const existingEmail = await User.findOne({ where: { corporative_email } });
    if (existingEmail) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.EMAIL_IN_USE, "409");
      return;
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el usuario
    const newUser = (await User.create({
      username,
      firstname,
      lastname,
      corporative_email,
      password: hashedPassword,
      roleId,
      isActive: true,
    })) as any;

    // Buscar el usuario creado con información del rol (para respuesta)
    const userWithRole = (await User.findByPk(newUser.id, {
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name"],
        },
      ],
      attributes: { exclude: ["password"] },
    })) as IUser | null;

    // Preparar datos de respuesta

    if (!userWithRole) {
      return sendBadRequest(res, ERROR_MESSAGES.AUTH.USER_NO_ROLE, "401");
    }

    const responseData = {
      id: userWithRole.id,
      username: userWithRole.username,
      firstname: userWithRole.firstname,
      lastname: userWithRole.lastname,
      corporative_email: userWithRole.corporative_email,
      isActive: userWithRole.isActive,
      role: userWithRole.role,
      createdAt: userWithRole.createdAt,
    };

    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.USER.USER_CREATED,
      "201",
      responseData,
    );
  } catch (error) {
    console.error("Error en register:", error);
    sendInternalErrorResponse(res);
  }
};
