import { AuditLogModel } from "../../models";
import { AuthRequest } from "../../interfaces/auth.interface";
import { AuditAction } from "../enums/AuditAction";
import { AuditEventData } from "../../interfaces/audit.interface";

/**
 * Registra un evento de auditoría en la base de datos
 * Solo para acciones administrativas importantes
 */
export const logAuditEvent = async (
  adminReq: AuthRequest, // Request del admin que hace la acción
  eventData: AuditEventData,
): Promise<void> => {
  try {
    // Verificar que tengamos la info del admin
    if (!adminReq.user) {
      console.error(
        "❌ Error en auditoría: No hay usuario admin en el request",
      );
      return;
    }

    await AuditLogModel.create({
      action: eventData.action,
      description: eventData.description,
      adminUserId: adminReq.user.id,
      adminEmail: adminReq.user.corporative_email,
      targetUserId: eventData.targetUserId || null,
      targetUserEmail: eventData.targetUserEmail || null,
      ipAddress: adminReq.ip || adminReq.socket?.remoteAddress || null,
      oldValue: eventData.oldValue || null,
      newValue: eventData.newValue || null,
      reason: eventData.reason || null,
      additionalData: eventData.additionalData || null,
    });

    // Log en consola para confirmar que se guardó
    console.log("✅ [AUDIT] Evento registrado:", {
      action: eventData.action,
      admin: adminReq.user.corporative_email,
      target: eventData.targetUserEmail || "N/A",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Si falla la auditoría, NO debe fallar la operación principal
    // Solo logear el error
    console.error("❌ Error guardando evento de auditoría:", error);
    console.error("   Datos del evento:", eventData);
  }
};

/**
 * Helper específico para cambios de contraseña por admin
 */
export const logAdminPasswordChange = async (
  adminReq: AuthRequest,
  targetUserId: string,
  targetUserEmail: string,
  reason?: string,
): Promise<void> => {
  await logAuditEvent(adminReq, {
    action: AuditAction.ADMIN_PASSWORD_CHANGE,
    description: `Administrador cambió contraseña del usuario ${targetUserEmail}`,
    targetUserId,
    targetUserEmail,
    reason,
    additionalData: {
      timestamp: new Date().toISOString(),
      adminRole: adminReq.user?.role?.name,
    },
  });
};

/**
 * Helper para cambios de rol de usuario
 */
export const logUserRoleChange = async (
  adminReq: AuthRequest,
  targetUserId: string,
  targetUserEmail: string,
  oldRole: string,
  newRole: string,
  reason?: string,
): Promise<void> => {
  await logAuditEvent(adminReq, {
    action: AuditAction.USER_ROLE_CHANGED,
    description: `Rol de usuario cambiado de ${oldRole} a ${newRole}`,
    targetUserId,
    targetUserEmail,
    oldValue: oldRole,
    newValue: newRole,
    reason,
    additionalData: {
      previousRole: oldRole,
      newRole: newRole,
      changedAt: new Date().toISOString(),
    },
  });
};

/**
 * Helper para activar/desactivar usuarios
 */
export const logUserStatusChange = async (
  adminReq: AuthRequest,
  targetUserId: string,
  targetUserEmail: string,
  isActivating: boolean, // true = activar, false = desactivar
  reason?: string,
): Promise<void> => {
  const action = isActivating
    ? AuditAction.USER_REACTIVATED
    : AuditAction.USER_DEACTIVATED;
  const statusText = isActivating ? "activado" : "desactivado";

  await logAuditEvent(adminReq, {
    action,
    description: `Usuario ${statusText}: ${targetUserEmail}`,
    targetUserId,
    targetUserEmail,
    oldValue: isActivating ? "inactivo" : "activo",
    newValue: isActivating ? "activo" : "inactivo",
    reason,
    additionalData: {
      statusChange: statusText,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Helper para cambios forzados de estado (por RRHH)
 */
export const logForcedStateChange = async (
  adminReq: AuthRequest,
  targetUserId: string,
  targetUserEmail: string,
  oldState: string,
  newState: string,
  reason?: string,
): Promise<void> => {
  await logAuditEvent(adminReq, {
    action: AuditAction.FORCE_STATE_CHANGE,
    description: `RRHH cambió estado forzadamente: ${targetUserEmail} de ${oldState} a ${newState}`,
    targetUserId,
    targetUserEmail,
    oldValue: oldState,
    newValue: newState,
    reason,
    additionalData: {
      stateChange: { from: oldState, to: newState },
      forcedBy: adminReq.user?.role?.name,
      timestamp: new Date().toISOString(),
    },
  });
};
