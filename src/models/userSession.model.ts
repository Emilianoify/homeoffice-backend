import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import { COMMENTS } from "../utils/constants/messages/comments";
import { UserState } from "../utils/enums/UserState";
import { USER_STATE_VALUES } from "../utils/validators/validators";

const UserSession = sequelize.define(
  "UserSession",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      comment: COMMENTS.SESSION_USER_ID,
    },
    sessionStart: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: COMMENTS.SESSION_START,
    },
    sessionEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: COMMENTS.SESSION_END,
    },
    totalMinutesWorked: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: COMMENTS.SESSION_TOTAL_MINUTES,
    },
    currentState: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: UserState.DESCONECTADO,
      validate: {
        isIn: [USER_STATE_VALUES],
      },
      comment: COMMENTS.SESSION_CURRENT_STATE,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: COMMENTS.SESSION_IS_ACTIVE,
    },
    // Información técnica para seguridad y debugging
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
      comment: COMMENTS.SESSION_IP_ADDRESS,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: COMMENTS.SESSION_USER_AGENT,
    },
    lastActivity: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
      comment: COMMENTS.LAST_ACTIVITY,
    },
    // Métricas de la sesión
    totalPopupsReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: COMMENTS.SESSION_TOTAL_POPUPS,
    },
    totalPopupsCorrect: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: COMMENTS.SESSION_POPUPS_CORRECT,
    },
    // Control de próximo pop-up
    nextPopupAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: COMMENTS.SESSION_NEXT_POPUP,
    },
    warningsIssued: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: COMMENTS.TIMEOUT_QUANTITY,
    },

    autoTransitions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: COMMENTS.QUANTITY_AUTO_TRANSITIONS,
    },

    lastWarningAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: COMMENTS.LAST_TIMEOUT_WARNING,
    },
    // Tiempo en cada estado (JSON para estadísticas)
    stateTimeBreakdown: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        activo: 0,
        baño: 0,
        ausente: 0,
        almuerzo: 0,
        desconectado: 0,
        licencia: 0,
      },
      comment: COMMENTS.SESSION_STATE_BREAKDOWN,
    },
  },
  {
    tableName: "user_sessions",
    modelName: "UserSession",
    timestamps: true,
    paranoid: false, // No soft delete para sessions
    indexes: [
      {
        fields: ["lastActivity"],
        name: "idx_user_sessions_last_activity",
      },
      {
        fields: ["isActive", "lastActivity"],
        name: "idx_user_sessions_active_activity",
      },
      {
        fields: ["userId"],
        name: "idx_user_sessions_user_id",
      },
      {
        fields: ["isActive"],
        name: "idx_user_sessions_is_active",
      },
      {
        fields: ["sessionStart"],
        name: "idx_user_sessions_start",
      },
      {
        fields: ["currentState"],
        name: "idx_user_sessions_current_state",
      },
      // Índice compuesto para encontrar sesión activa de un usuario
      {
        fields: ["userId", "isActive"],
        name: "idx_user_sessions_user_active",
      },
    ],
  },
);

export default UserSession;
