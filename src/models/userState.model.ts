import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import { COMMENTS } from "../utils/constants/messages/comments";
import {
  STATE_CHANGED_BY_VALUES,
  USER_STATE_VALUES,
} from "../utils/validators/validators";
import { StateChangedBy } from "../utils/enums/StateChangedBy";

const UserStateModel = sequelize.define(
  "UserState",
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
      comment: COMMENTS.STATE_USER_ID,
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "user_sessions",
        key: "id",
      },
      comment: COMMENTS.STATE_SESSION_ID,
    },
    state: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [USER_STATE_VALUES],
      },
      comment: COMMENTS.STATE_VALUE,
    },
    stateStart: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: COMMENTS.STATE_START,
    },
    stateEnd: {
      type: DataTypes.DATE,
      allowNull: true, // null = estado actual/activo
      comment: COMMENTS.STATE_END,
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true, // se calcula cuando se cierra el estado
      comment: COMMENTS.STATE_DURATION,
    },
    // Información adicional del cambio de estado
    changedBy: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: StateChangedBy.USER,
      validate: {
        isIn: [STATE_CHANGED_BY_VALUES],
      },
      comment: COMMENTS.STATE_CHANGED_BY,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: COMMENTS.STATE_REASON,
    },
    // Para auditoría y debugging
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
      comment: COMMENTS.STATE_IP_ADDRESS,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: COMMENTS.STATE_USER_AGENT,
    },
  },
  {
    tableName: "user_states",
    modelName: "UserState",
    timestamps: true,
    paranoid: false, // No soft delete para historial
    indexes: [
      {
        fields: ["userId"],
        name: "idx_user_states_user_id",
      },
      {
        fields: ["sessionId"],
        name: "idx_user_states_session_id",
      },
      {
        fields: ["state"],
        name: "idx_user_states_state",
      },
      {
        fields: ["stateStart"],
        name: "idx_user_states_start",
      },
      {
        fields: ["stateEnd"],
        name: "idx_user_states_end",
      },
      // Índices compuestos para consultas frecuentes
      {
        fields: ["userId", "stateStart"],
        name: "idx_user_states_user_start",
      },
      {
        fields: ["userId", "stateEnd"],
        name: "idx_user_states_user_end",
      },
      // Para encontrar estados activos (sin stateEnd)
      {
        fields: ["userId", "stateEnd"],
        name: "idx_user_states_user_active",
        where: {
          stateEnd: null,
        },
      },
    ],
  },
);

export default UserStateModel;
