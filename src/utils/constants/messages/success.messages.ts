export const SUCCESS_MESSAGES = {
  DB: {
    DB_CONNECTED: "Conexión a la base de datos establecida correctamente.",
    DB_SYNCED: "Sincronización de base de datos completada.",
    DB_UP: "Base de datos inicializada correctamente",
  },
  AUTH: {
    LOGIN_SUCCESS: "Inicio de sesión exitoso.",
    LOGOUT_SUCCESS: "Sesión cerrada correctamente.",
    RECOVERY_EMAIL_SENT: "Email de recuperación enviado.",
    PASSWORD_RESET_SUCCESS: "Contraseña actualizada correctamente.",
    TOKEN_REFRESHED: "Token renovado exitosamente.",
    PASSWORD_CHANGED_SUCCESS: "Contraseña cambiada exitosamente.",
    SESSION_CLOSED: "Sesión de trabajo cerrada correctamente",
    WORK_SESSION_ENDED: "Jornada laboral finalizada exitosamente",
  },
  USER: {
    USER_CREATED: "Usuario creado correctamente.",
    PROFILE_RETRIEVED: "Perfil obtenido exitosamente.",
    PROFILE_UPDATED: "Perfil actualizado exitosamente.",
  },
  ADMIN: {
    PASSWORD_CHANGED_SUCCESS:
      "Contraseña cambiada exitosamente por administrador.",
    USER_PROFILE_RETRIEVED: "Perfil de usuario obtenido exitosamente.",

    USER_PROFILE_UPDATED:
      "Perfil de usuario actualizado exitosamente por administrador.",
    NO_CHANGES_DETECTED:
      "No se detectaron cambios en los datos proporcionados.",
  },
  SERVER: {
    STARTUP: "Server running on",
  },
  ROLE: {
    ROLE_CREATED: "Rol creado correctamente.",
  },
  STATES: {
    STATE_CHANGED: "Estado cambiado correctamente",
    CURRENT_STATE_RETRIEVED: "Estado actual obtenido exitosamente",
    HISTORY_RETRIEVED: "Historial de estados obtenido exitosamente",
    TEAM_STATES_RETRIEVED: "Estados del equipo obtenidos exitosamente",
    SESSION_STARTED: "Sesión de trabajo iniciada correctamente",
    SESSION_PAUSED: "Sesión de trabajo pausada",
    SESSION_RESUMED: "Sesión de trabajo reanudada",
  },
  POPUPS: {
    POPUP_SENT: "Pop-up matemático generado",
    HISTORY_RETRIEVED: "Historial de pop-ups obtenido",
    POPUP_CORRECT: "Excelente trabajo. Puedes continuar con tus tareas.",
    SECOND_CHANCE: "Segunda oportunidad",
    POPUP_FIRST_TIMEOUT:
      "Se agotó el tiempo. Aquí tienes una segunda oportunidad:",
    POPUP_FIRST_ERROR:
      "Respuesta incorrecta. Aquí tienes una segunda oportunidad:",
    CLOSING_SESSION:
      "Segundo error, cerrando sesion por inactividad o intentos fallidos",
  },
  PATIENT: {
    PATIENT_CREATED: "Paciente creado correctamente.",
  },
  PROFESSIONAL: {
    PROFESSIONAL_CREATED: "Profesional creado correctamente.",
  },
};
