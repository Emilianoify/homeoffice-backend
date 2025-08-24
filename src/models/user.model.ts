import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import { ERROR_MESSAGES } from "../utils/constants/messages/error.messages";
import { COMMENTS } from "../utils/constants/messages/comments";
import {
  POPUP_FREQUENCY_VALUES,
  USER_STATE_VALUES,
} from "../utils/validators/validators";
import { UserState } from "../utils/enums/UserState";
import { PopupFrequency } from "../utils/enums/PopupFrequency";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        isAlphanumeric: {
          msg: ERROR_MESSAGES.USER.INVALID_USERNAME,
        },
      },
    },
    firstname: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    lastname: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    corporative_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: ERROR_MESSAGES.USER.INVALID_EMAIL,
        },
        len: [5, 255],
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 255],
      },
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "roles",
        key: "id",
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // ===== NUEVOS CAMPOS PARA HOME OFFICE =====
    currentState: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: UserState.DESCONECTADO, // ← ENUM en lugar de string
      validate: {
        isIn: [USER_STATE_VALUES], // ← Array del enum
      },
      comment: COMMENTS.USER_CURRENT_STATE,
    },
    isInSession: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: COMMENTS.USER_IS_IN_SESSION,
    },
    currentSessionId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: COMMENTS.USER_CURRENT_SESSION_ID,
    },
    productivityScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
      comment: COMMENTS.USER_PRODUCTIVITY_SCORE,
    },
    popupFrequency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: PopupFrequency.STANDARD, // ← ENUM
      validate: {
        isIn: [POPUP_FREQUENCY_VALUES], // ← Valores del enum
      },
      comment: COMMENTS.USER_POPUP_FREQUENCY,
    },
    totalPopupsReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: COMMENTS.USER_TOTAL_POPUPS_RECEIVED,
    },
    totalPopupsCorrect: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: COMMENTS.USER_TOTAL_POPUPS_CORRECT,
    },
    sector: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: COMMENTS.USER_SECTOR,
    },
    // Campos para el sistema de viernes flex
    weeklyProductivityGoal: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 85,
      allowNull: false,
      comment: COMMENTS.USER_WEEKLY_PRODUCTIVITY_GOAL,
    },
    qualifiesForFlexFriday: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: COMMENTS.USER_QUALIFIES_FLEX_FRIDAY,
    },
  },
  {
    tableName: "users",
    modelName: "User",
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ["username"],
      },
      {
        unique: true,
        fields: ["corporative_email"],
      },
      {
        fields: ["roleId"],
      },
      {
        fields: ["isActive"],
      },
      // NUEVOS INDEXES PARA HOME OFFICE
      {
        fields: ["currentState"],
        name: "idx_users_current_state",
      },
      {
        fields: ["isInSession"],
        name: "idx_users_is_in_session",
      },
      {
        fields: ["sector"],
        name: "idx_users_sector",
      },
      {
        fields: ["productivityScore"],
        name: "idx_users_productivity_score",
      },
    ],
  },
);

export default User;
