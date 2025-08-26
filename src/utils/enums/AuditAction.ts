export enum AuditAction {
  
  ADMIN_PASSWORD_CHANGE = 'admin_password_change',
  USER_DEACTIVATED = 'user_deactivated',
  USER_REACTIVATED = 'user_reactivated',
  USER_ROLE_CHANGED = 'user_role_changed',
  USER_SECTOR_CHANGED = 'user_sector_changed',
  
  // RRHH cambiando estados de usuarios
  FORCE_STATE_CHANGE = 'force_state_change',
  FORCE_SESSION_CLOSE = 'force_session_close',
  
  // Eventos críticos del sistema
  POPUP_FAILED_TWICE = 'popup_failed_twice',
  PRODUCTIVITY_THRESHOLD_REACHED = 'productivity_threshold_reached',
  
  // Creación/eliminación de tareas importantes
  TASK_CREATED = 'task_created',
  TASK_CANCELLED = 'task_cancelled',
}
