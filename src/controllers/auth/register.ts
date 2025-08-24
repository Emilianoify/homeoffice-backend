import { IRole } from "../../interfaces/role.interface";
import { IUser } from "../../interfaces/user.interface";
import { Role, User } from "../../models";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
  sendNotFound,
  sendConflict,
  sendUnauthorized,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
} from "../../utils/validators/validators";
import { SECTOR_BY_ROLE } from "../../utils/constants/const";
import { UserRole } from "../../utils/enums/UserRole";

interface RegisterRequest {
  username: string;
  firstname: string;
  lastname: string;
  corporative_email: string;
  password: string;
  roleId: string;
  sector?: string; // Opcional - se puede auto-asignar por rol
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
      sector,
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
      sendBadRequest(res, ERROR_MESSAGES.AUTH.MISSING_REQUIRED_FIELDS);
      return;
    }

    // Validación de formato de username
    if (!isValidUsername(username)) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_USERNAME_FORMAT);
      return;
    }

    // Validación de formato de email
    if (!isValidEmail(corporative_email)) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.INVALID_EMAIL_FORMAT);
      return;
    }

    // Validación de fortaleza de contraseña
    if (!isValidPassword(password)) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.WEAK_PASSWORD);
      return;
    }

    // Verificar que el rol exista y esté activo
    const role = (await Role.findByPk(roleId)) as IRole | null;
    if (!role) {
      sendNotFound(res, ERROR_MESSAGES.AUTH.ROLE_NOT_FOUND);
      return;
    }

    if (!role.isActive) {
      sendBadRequest(res, ERROR_MESSAGES.AUTH.ROLE_INACTIVE);
      return;
    }

    // Determinar el sector
    let finalSector = sector;

    // Si no se proporciona sector, intentar auto-asignar por rol
    if (!finalSector) {
      // Usar el nombre del rol obtenido de la base de datos para buscar el sector.
      const autoSector = SECTOR_BY_ROLE[role.name as UserRole];

      if (autoSector && autoSector !== "Variable") {
        finalSector = autoSector;
      } else {
        // Para roles como "Coordinador de Sector" que requieren especificar sector
        sendBadRequest(res, ERROR_MESSAGES.AUTH.SECTOR_REQUIRED);
        return;
      }
    }

    // Verificar que el username no esté en uso
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      sendConflict(res, ERROR_MESSAGES.AUTH.USERNAME_IN_USE);
      return;
    }

    // Verificar que el email no esté en uso
    const existingEmail = await User.findOne({ where: { corporative_email } });
    if (existingEmail) {
      sendConflict(res, ERROR_MESSAGES.AUTH.EMAIL_IN_USE);
      return;
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el usuario con el sector
    const newUser = (await User.create({
      username,
      firstname,
      lastname,
      corporative_email,
      password: hashedPassword,
      roleId,
      sector: finalSector, // ← NUEVO CAMPO AGREGADO
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
      return sendUnauthorized(res, ERROR_MESSAGES.AUTH.USER_NO_ROLE);
    }

    const responseData = {
      id: userWithRole.id,
      username: userWithRole.username,
      firstname: userWithRole.firstname,
      lastname: userWithRole.lastname,
      corporative_email: userWithRole.corporative_email,
      sector: userWithRole.sector, // ← INCLUIR EN RESPUESTA
      isActive: userWithRole.isActive,
      role: userWithRole.role,
      createdAt: userWithRole.createdAt,
    };

    sendSuccessResponse(res, SUCCESS_MESSAGES.USER.USER_CREATED, responseData);
  } catch (error) {
    console.error("Error en register:", error);
    sendInternalErrorResponse(res);
  }
};
