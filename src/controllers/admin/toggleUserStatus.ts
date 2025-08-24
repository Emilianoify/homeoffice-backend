import { Response } from "express";
import { User, Role, UserSession, UserStateModel } from "../../models";
import { IUser } from "../../interfaces/user.interface";
import { AuthRequest } from "../../interfaces/auth.interface";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
  sendNotFound,
  sendConflict,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { revokeAllUserTokens } from "../../utils/commons/tokenManager";
import { UserState } from "../../utils/enums/UserState";
import { StateChangedBy } from "../../utils/enums/StateChangedBy";
import { TokenRevocationReason } from "../../utils/enums/TokenRevocationReason";

interface ToggleStatusRequest {
  reason?: string;
}

export const toggleUserStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const adminUserId = req.user!.id;
    const targetUserId = req.params.userId;

    // Manejo seguro del body que puede venir vacío
    const body = req.body || {};
    const { reason }: ToggleStatusRequest = body;

    // Validación de parámetros
    if (!targetUserId) {
      sendBadRequest(res, ERROR_MESSAGES.ADMIN.USER_ID_REQUIRED);
      return;
    }

    // Validación de razón (solo requerida para desactivación)
    // Nota: Considera si realmente necesitas razón para activación también
    if (!reason || reason.trim() === "") {
      sendBadRequest(res, ERROR_MESSAGES.ADMIN.CHANGE_REASON_REQUIRED);
      return;
    }

    // Prevenir que un admin se desactive a sí mismo
    if (targetUserId === adminUserId) {
      sendConflict(res, ERROR_MESSAGES.ADMIN.SAME_TARGET_USER);
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
        "isActive",
        "isInSession",
        "currentState",
        "currentSessionId",
      ],
    })) as IUser | null;

    if (!targetUser) {
      sendNotFound(res, ERROR_MESSAGES.ADMIN.TARGET_USER_NOT_FOUND);
      return;
    }

    // Determinar nueva acción
    const newStatus = !targetUser.isActive;
    const action = newStatus ? "activar" : "desactivar";

    // Información adicional para logging
    const ipAddress = req.socket?.remoteAddress || null;
    const userAgent = req.get("User-Agent") || null;
    const now = new Date();

    // ===== LÓGICA ESPECIAL PARA DESACTIVACIÓN =====
    if (!newStatus && targetUser.isInSession) {
      // El usuario está en sesión activa, necesitamos cerrar todo
      console.log(`🚨 Desactivando usuario en sesión: ${targetUser.username}`);

      // 1. Buscar sesión activa
      const activeSession = (await UserSession.findOne({
        where: {
          userId: targetUserId,
          isActive: true,
        },
      })) as any;

      if (activeSession) {
        // 2. Cerrar estado actual si existe
        const currentState = (await UserStateModel.findOne({
          where: {
            userId: targetUserId,
            sessionId: activeSession.id,
            stateEnd: null,
          },
        })) as any;

        if (currentState) {
          const stateStart = new Date(currentState.stateStart);
          const durationMinutes = Math.round(
            (now.getTime() - stateStart.getTime()) / (1000 * 60),
          );

          await UserStateModel.update(
            {
              stateEnd: now,
              durationMinutes,
            },
            { where: { id: currentState.id } },
          );

          // Actualizar breakdown de la sesión
          const currentBreakdown = activeSession.stateTimeBreakdown || {};
          currentBreakdown[currentState.state] =
            (currentBreakdown[currentState.state] || 0) + durationMinutes;

          await UserSession.update(
            { stateTimeBreakdown: currentBreakdown },
            { where: { id: activeSession.id } },
          );
        }

        // 3. Crear estado final de desactivación
        await UserStateModel.create({
          userId: targetUserId,
          sessionId: activeSession.id,
          state: UserState.DESCONECTADO,
          stateStart: now,
          changedBy: StateChangedBy.ADMIN,
          reason: `Usuario desactivado por admin: ${reason || "No especificada"}`,
          ipAddress,
          userAgent,
        });

        // 4. Cerrar la sesión
        await UserSession.update(
          {
            sessionEnd: now,
            isActive: false,
            currentState: UserState.DESCONECTADO,
          },
          { where: { id: activeSession.id } },
        );
      }

      // Revocar todos los tokens del usuario
      revokeAllUserTokens(targetUserId, TokenRevocationReason.ADMIN_ACTION);
    }

    // ===== ACTUALIZAR ESTADO DEL USUARIO =====
    await User.update(
      {
        isActive: newStatus,
        ...(newStatus
          ? {}
          : {
              // Si se desactiva, resetear campos de sesión
              currentState: UserState.DESCONECTADO,
              isInSession: false,
              currentSessionId: null,
            }),
      },
      { where: { id: targetUserId } },
    );

    // Obtener usuario actualizado
    const updatedUser = (await User.findByPk(targetUserId, {
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name", "description", "isActive"],
        },
      ],
      attributes: {
        exclude: ["password", "passwordResetToken", "passwordResetExpires"],
      },
    })) as IUser | null;

    if (!updatedUser) {
      sendInternalErrorResponse(res);
      return;
    }

    // Log de seguridad detallado
    console.log(`🔄 [ADMIN STATUS] Usuario ${action}:`);
    console.log(`   Admin: ${req.user!.username} (${adminUserId})`);
    console.log(
      `   Usuario objetivo: ${updatedUser.username} (${targetUserId})`,
    );
    console.log(
      `   Estado anterior: ${targetUser.isActive ? "activo" : "inactivo"}`,
    );
    console.log(
      `   Estado nuevo: ${updatedUser.isActive ? "activo" : "inactivo"}`,
    );
    console.log(`   Razón: ${reason || "No especificada"}`);
    console.log(`   Sesión cerrada: ${targetUser.isInSession ? "Sí" : "No"}`);
    console.log(`   Timestamp: ${now.toISOString()}`);

    // Preparar respuesta
    const responseData = {
      id: updatedUser.id,
      username: updatedUser.username,
      firstname: updatedUser.firstname,
      lastname: updatedUser.lastname,
      corporative_email: updatedUser.corporative_email,
      isActive: updatedUser.isActive,
      currentState: updatedUser.currentState,
      isInSession: updatedUser.isInSession,
      sector: updatedUser.sector,
      role: {
        id: updatedUser.role?.id,
        name: updatedUser.role?.name,
        description: updatedUser.role?.description,
        isActive: updatedUser.role?.isActive,
      },
      statusChange: {
        action: action,
        previousStatus: targetUser.isActive,
        newStatus: updatedUser.isActive,
        performedBy: req.user!.username,
        reason: reason || "No especificada",
        timestamp: now.toISOString(),
        sessionClosed: targetUser.isInSession && !newStatus,
        tokensRevoked: !newStatus, // Solo se revocan tokens al desactivar
      },
    };

    const successMessage = newStatus
      ? SUCCESS_MESSAGES.ADMIN.USER_ACTIVATED
      : SUCCESS_MESSAGES.ADMIN.USER_DEACTIVATED;

    sendSuccessResponse(res, successMessage, responseData);
  } catch (error) {
    console.error("Error en toggleUserStatus:", error);
    sendInternalErrorResponse(res);
  }
};
