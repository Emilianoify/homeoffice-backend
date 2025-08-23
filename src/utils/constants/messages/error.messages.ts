export const ERROR_MESSAGES = {
  DB: {
    DB_CONNECTION: "Error al conectar con la base de datos.",
    DB_SYNC: "Error al sincronizar la base de datos.",
  },
  AUTH: {
    USER_NOT_AUTHENTICATED:
      "Usuario no autenticado. Debe pasar por autenticación primero.",
    USER_NO_ROLE: "Usuario sin rol asignado. Contacta al administrador.",
    INSUFFICIENT_PERMISSIONS:
      "Permisos insuficientes para acceder a este recurso.",
    MISSING_REQUIRED_FIELDS: "Todos los campos son requeridos.",
    INVALID_USERNAME_FORMAT:
      "Username debe tener 3-50 caracteres alfanuméricos.",
    INVALID_EMAIL_FORMAT: "Formato de email inválido.",
    WEAK_PASSWORD:
      "Password debe tener mínimo 8 caracteres, 1 mayúscula y 1 número.",
    USERNAME_IN_USE: "Username ya está en uso.",
    EMAIL_IN_USE: "Email ya está registrado.",
    ROLE_NOT_FOUND: "Rol no encontrado.",
    ROLE_INACTIVE: "Rol inactivo.",
    MISSING_CREDENTIALS: "Username y password son requeridos.",
    INVALID_CREDENTIALS: "Credenciales inválidas.",
    USER_INACTIVE: "Usuario inactivo. Contacte al administrador",
    TOKEN_REVOKED: "Token revocado. Inicia sesión nuevamente.",
    TOKEN_REQUIRED: "Token de acceso requerido",
    TOKEN_NOT_ACTIVE: "El token no esta activo.",
    TOKEN_EXPIRED: "Token expirado",
    INVALID_TOKEN: "Token invalido",
    INVALID_TOKEN_STRUCTURE: "La estructura del token es invalida.",
    IDENTIFIER_REQUIRED: "Username o email requerido.",
    MISSING_RESET_FIELDS: "Token y nueva contraseña son requeridos.",
    INVALID_RESET_TOKEN: "Token de recuperación inválido o expirado.",
    SAME_PASSWORD: "La nueva contraseña debe ser diferente a la actual.",
    REFRESH_TOKEN_REQUIRED: "Refresh token es requerido.",
    INVALID_TOKEN_TYPE: "Tipo de token inválido. Se esperaba refresh token.",
    REFRESH_TOKEN_EXPIRED: "Refresh token expirado. Inicia sesión nuevamente.",
    INVALID_REFRESH_TOKEN: "Refresh token inválido.",
    ADMIN_REQUIRED:
      "Se requieren permisos de administrador para acceder a este recurso.",
    MISSING_PASSWORD_FIELDS:
      "Contraseña actual y nueva contraseña son requeridas.",
    INVALID_CURRENT_PASSWORD: "Contraseña actual incorrecta.",
  },
  ADMIN: {
    USER_ID_REQUIRED: "ID de usuario es requerido.",
    NEW_PASSWORD_REQUIRED: "Nueva contraseña es requerida.",
    TARGET_USER_NOT_FOUND: "Usuario objetivo no encontrado.",
    TARGET_USER_INACTIVE: "Usuario objetivo está inactivo.",
  },
  SERVER: {
    STARTUP: "Error al iniciar el servidor.",
    INTERNAL_ERROR: "Error interno del servidor",
    JWT_SECRET_MISSING: "Error de configuración del servidor",
  },
  ROUTING: {
    NOT_FOUND: "Ruta no encontrada.",
  },
  USER: {
    USER_CREATION: "Error al crear el usuario.",
    INVALID_USERNAME: "Username debe contener solo letras y números",
    INVALID_EMAIL: "Debe ser un email válido",
    USER_NOT_FOUND: "Usuario no encontrado",
    NO_FIELDS_TO_UPDATE: "Debe proporcionar al menos un campo para actualizar.",
    EMPTY_USERNAME: "Username no puede estar vacío.",
    EMPTY_EMAIL: "Email no puede estar vacío.",
    INVALID_FIRSTNAME: "Nombre debe tener al menos 2 caracteres.",
    INVALID_LASTNAME: "Apellido debe tener al menos 2 caracteres.",
    UPDATE_FAILED: "Error al actualizar el perfil.",
  },
  ROLE: { ROLE_CREATION: "Error al crear el rol." },

  PATIENT: { PATIENT_CREATION: "Error al crear el paciente." },
  PROFESSIONAL: { PROFESSIONAL_CREATION: "Error al crear el profesional." },
};
