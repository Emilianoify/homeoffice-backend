export const COMMENTS = {
  ROLE_ARRAY: "Array de permisos específicos del rol",
  IF_USER_EXISTS: "Si el usuario existe, recibirás un email con instrucciones",
  RECOVERY_EMAIL_DELIVERY:
    "Aguarde de 5-10 minutos antes de volver a intentarlo",
  RECOVERY_NEXT_STEP: "Inicia sesión con tu nueva contraseña",
  USER_CURRENT_STATE: "Estado actual del usuario en su sesión de trabajo",
  USER_IS_IN_SESSION: "Indica si el usuario tiene una sesión de trabajo activa",
  USER_CURRENT_SESSION_ID:
    "ID de la sesión de trabajo actual (si está en sesión)",
  USER_PRODUCTIVITY_SCORE:
    "Puntaje de productividad promedio del usuario (0-100)",
  USER_POPUP_FREQUENCY:
    "Frecuencia de pop-ups basada en rendimiento: standard (≤85%) o premium (>85%)",
  USER_TOTAL_POPUPS_RECEIVED: "Total de pop-ups recibidos desde el registro",
  USER_TOTAL_POPUPS_CORRECT: "Total de pop-ups respondidos correctamente",
  USER_SECTOR: "Sector al que pertenece el usuario (Facturación, RRHH, etc.)",
  USER_WEEKLY_PRODUCTIVITY_GOAL:
    "Meta de productividad semanal para viernes flex (%)",
  USER_QUALIFIES_FLEX_FRIDAY: "Si califica para salir temprano el viernes",
  SESSION_USER_ID: "ID del usuario propietario de la sesión",
  SESSION_START: "Momento en que inició la sesión de trabajo",
  SESSION_END: "Momento en que terminó la sesión (null si está activa)",
  SESSION_TOTAL_MINUTES:
    "Total de minutos trabajados efectivamente en la sesión",
  SESSION_CURRENT_STATE: "Estado actual del usuario en esta sesión",
  SESSION_IS_ACTIVE: "Indica si la sesión está actualmente activa",
  SESSION_IP_ADDRESS: "Dirección IP desde donde se conectó el usuario",
  SESSION_USER_AGENT: "Información del navegador y sistema operativo",
  SESSION_TOTAL_POPUPS: "Total de pop-ups matemáticos enviados en esta sesión",
  SESSION_POPUPS_CORRECT:
    "Total de pop-ups respondidos correctamente en esta sesión",
  SESSION_NEXT_POPUP: "Fecha y hora programada para el próximo pop-up",
  SESSION_STATE_BREAKDOWN:
    "Desglose de tiempo (en minutos) gastado en cada estado durante la sesión",
  STATE_USER_ID: "ID del usuario que cambió de estado",
  STATE_SESSION_ID:
    "ID de la sesión de trabajo a la que pertenece este cambio de estado",
  STATE_VALUE:
    "El estado específico (activo, baño, almuerzo, ausente, licencia, desconectado)",
  STATE_START: "Momento exacto en que comenzó este estado",
  STATE_END:
    "Momento exacto en que terminó este estado (null si es el estado actual)",
  STATE_DURATION: "Duración en minutos que el usuario estuvo en este estado",
  STATE_CHANGED_BY:
    "Quién/qué provocó el cambio de estado (user, system, admin, timeout)",
  STATE_REASON:
    "Razón adicional del cambio de estado (opcional, para contexto)",
  STATE_IP_ADDRESS: "IP desde donde se realizó el cambio de estado",
  STATE_USER_AGENT: "Navegador desde donde se realizó el cambio de estado",
  POPUP_USER_ID: "ID del usuario que recibió el pop-up matemático",
  POPUP_SESSION_ID:
    "ID de la sesión de trabajo durante la cual apareció el pop-up",
  POPUP_EXERCISE: "El ejercicio matemático mostrado (ej: '7 + 3', '9 - 4')",
  POPUP_CORRECT_ANSWER: "La respuesta correcta al ejercicio matemático",
  POPUP_USER_ANSWER: "La respuesta que dio el usuario (null si no respondió)",
  POPUP_IS_CORRECT: "Si la respuesta del usuario fue correcta",
  POPUP_WAS_ANSWERED: "Si el usuario respondió dentro del tiempo límite",
  POPUP_TIME: "Momento exacto en que apareció el pop-up",
  POPUP_ANSWERED_AT:
    "Momento exacto en que el usuario respondió (null si no respondió)",
  POPUP_RESPONSE_TIME: "Tiempo en segundos que tardó en responder",
  POPUP_TIME_LIMIT: "Tiempo límite en segundos para responder (por defecto 60)",
  POPUP_IS_FIRST_ATTEMPT: "Si es el primer intento o una segunda oportunidad",
  POPUP_PREVIOUS_ID: "ID del pop-up anterior (si es segunda oportunidad)",
  POPUP_RESULT:
    "Resultado del pop-up (pending, correct, incorrect, timeout, session_closed)",
  POPUP_ACTION_TAKEN:
    "Acción tomada por el sistema (none, warning, second_chance, session_closed, admin_notified)",
  POPUP_USER_AGENT: "Información del navegador cuando se mostró el pop-up",
  POPUP_WINDOW_FOCUSED:
    "Si la ventana estaba enfocada cuando se mostró el pop-up",
  TASK_TITLE:
    "Título descriptivo de la tarea (ej: 'Facturar 10 pacientes urgente')",
  TASK_DESCRIPTION: "Descripción detallada de la tarea y sus instrucciones",
  TASK_ASSIGNED_TO: "ID del usuario al que se le asignó la tarea",
  TASK_ASSIGNED_BY: "ID del usuario que creó y asignó la tarea (coordinador)",
  TASK_PRIORITY: "Nivel de prioridad de la tarea (alta, media, baja)",
  TASK_STATUS:
    "Estado actual de la tarea (pendiente, en_progreso, completada, cancelada)",
  TASK_DUE_DATE: "Fecha y hora límite para completar la tarea",
  TASK_COMPLETED_AT: "Momento exacto en que se marcó la tarea como completada",
  TASK_EMAIL_SENT: "Si se envió la notificación por email al asignar la tarea",
  TASK_EMAIL_SENT_AT: "Momento en que se envió el email de notificación",
  TASK_ESTIMATED_MINUTES: "Tiempo estimado en minutos para completar la tarea",
  TASK_ACTUAL_MINUTES: "Tiempo real en minutos que tomó completar la tarea",
  TASKFILE_TASK_ID: "ID de la tarea a la que pertenece este archivo",
  TASKFILE_FILE_NAME: "Nombre del archivo original",
  TASKFILE_DRIVE_URL: "URL completa del archivo en Google Drive",
  TASKFILE_DRIVE_FILE_ID:
    "ID único del archivo en Google Drive extraído de la URL",
  TASKFILE_FILE_SIZE: "Tamaño del archivo en bytes",
  TASKFILE_MIME_TYPE: "Tipo de archivo (application/pdf, image/jpeg, etc.)",
  TASKFILE_UPLOADED_BY: "ID del usuario que subió/agregó el archivo",
  REPORT_USER_ID: "ID del usuario al que pertenece este reporte diario",
  REPORT_DATE: "Fecha del reporte (solo fecha, sin hora)",
  REPORT_TOTAL_MINUTES:
    "Minutos trabajados efectivamente (solo tiempo productivo)",
  REPORT_SESSION_MINUTES: "Minutos totales en sesión (incluyendo baños, etc.)",
  REPORT_POPUPS_RECEIVED: "Total de pop-ups matemáticos recibidos en el día",
  REPORT_POPUPS_ANSWERED:
    "Total de pop-ups respondidos (dentro del tiempo límite)",
  REPORT_CORRECT_ANSWERS: "Cantidad de pop-ups respondidos correctamente",
  REPORT_POPUP_ACCURACY: "Porcentaje de precisión en pop-ups (0-100)",
  REPORT_AVG_RESPONSE_TIME: "Tiempo promedio de respuesta en segundos",
  REPORT_TASKS_ASSIGNED: "Total de tareas asignadas en el día",
  REPORT_TASKS_COMPLETED: "Total de tareas completadas en el día",
  REPORT_TASK_COMPLETION_RATE: "Porcentaje de tareas completadas vs asignadas",
  REPORT_PRODUCTIVITY_SCORE: "Puntaje final de productividad del día (0-100)",
  REPORT_STATE_BREAKDOWN:
    "JSON con minutos gastados en cada estado durante el día",
  REPORT_QUALIFIES_FLEX:
    "Si califica para viernes flex basado en productividad semanal",
  REPORT_WEEKLY_AVERAGE: "Promedio de productividad de la semana actual",
};
