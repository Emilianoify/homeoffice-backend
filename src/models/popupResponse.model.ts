import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import { COMMENTS } from "../utils/constants/messages/comments";
import {
  POPUP_ACTION_VALUES,
  POPUP_RESULT_VALUES,
} from "../utils/validators/validators";
import { PopupResult } from "../utils/enums/PopupResult";

const PopupResponseModel = sequelize.define(
  "PopupResponse",
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
      comment: COMMENTS.POPUP_USER_ID,
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "user_sessions",
        key: "id",
      },
      comment: COMMENTS.POPUP_SESSION_ID,
    },
    // Datos del ejercicio matemático
    exercise: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: COMMENTS.POPUP_EXERCISE,
    },
    correctAnswer: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: COMMENTS.POPUP_CORRECT_ANSWER,
    },
    // Respuesta del usuario
    userAnswer: {
      type: DataTypes.INTEGER,
      allowNull: true, // null si no respondió
      comment: COMMENTS.POPUP_USER_ANSWER,
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: COMMENTS.POPUP_IS_CORRECT,
    },
    wasAnswered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: COMMENTS.POPUP_WAS_ANSWERED,
    },
    // Tiempos y métricas
    popupTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: COMMENTS.POPUP_TIME,
    },
    answeredAt: {
      type: DataTypes.DATE,
      allowNull: true, // null si no respondió
      comment: COMMENTS.POPUP_ANSWERED_AT,
    },
    responseTime: {
      type: DataTypes.INTEGER, // segundos
      allowNull: true, // null si no respondió
      comment: COMMENTS.POPUP_RESPONSE_TIME,
    },
    timeLimit: {
      type: DataTypes.INTEGER, // segundos (por defecto 60)
      allowNull: false,
      defaultValue: 60,
      comment: COMMENTS.POPUP_TIME_LIMIT,
    },
    // Control de alertas escalonadas
    isFirstAttempt: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: COMMENTS.POPUP_IS_FIRST_ATTEMPT,
    },
    previousPopupId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "popup_responses",
        key: "id",
      },
      comment: COMMENTS.POPUP_PREVIOUS_ID,
    },
    // Resultado y consecuencias
    result: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: PopupResult.PENDING,
      validate: {
        isIn: [[POPUP_RESULT_VALUES]],
      },
      comment: COMMENTS.POPUP_RESULT,
    },
    actionTaken: {
      type: DataTypes.STRING(30),
      allowNull: true,
      validate: {
        isIn: [[POPUP_ACTION_VALUES]],
      },
      comment: COMMENTS.POPUP_ACTION_TAKEN,
    },
    // Información técnica
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: COMMENTS.POPUP_USER_AGENT,
    },
    windowFocused: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: COMMENTS.POPUP_WINDOW_FOCUSED,
    },
  },
  {
    tableName: "popup_responses",
    modelName: "PopupResponse",
    timestamps: true,
    paranoid: false, // No soft delete para métricas
    indexes: [
      {
        fields: ["userId"],
        name: "idx_popup_responses_user_id",
      },
      {
        fields: ["sessionId"],
        name: "idx_popup_responses_session_id",
      },
      {
        fields: ["popupTime"],
        name: "idx_popup_responses_popup_time",
      },
      {
        fields: ["result"],
        name: "idx_popup_responses_result",
      },
      {
        fields: ["isFirstAttempt"],
        name: "idx_popup_responses_first_attempt",
      },
      // Índices compuestos para consultas frecuentes
      {
        fields: ["userId", "popupTime"],
        name: "idx_popup_responses_user_time",
      },
      {
        fields: ["userId", "result"],
        name: "idx_popup_responses_user_result",
      },
      {
        fields: ["sessionId", "result"],
        name: "idx_popup_responses_session_result",
      },
    ],
    // Hooks para cálculos automáticos
    hooks: {
      beforeUpdate: (popupResponse: any) => {
        // Calcular tiempo de respuesta automáticamente
        if (
          popupResponse.answeredAt &&
          popupResponse.popupTime &&
          !popupResponse.responseTime
        ) {
          const popupTime = new Date(popupResponse.popupTime);
          const answeredTime = new Date(popupResponse.answeredAt);
          const diffMs = answeredTime.getTime() - popupTime.getTime();
          popupResponse.responseTime = Math.round(diffMs / 1000); // convertir a segundos
        }

        // Determinar si la respuesta es correcta
        if (
          popupResponse.userAnswer !== null &&
          popupResponse.userAnswer !== undefined
        ) {
          popupResponse.isCorrect =
            popupResponse.userAnswer === popupResponse.correctAnswer;
          popupResponse.wasAnswered = true;

          // Establecer resultado
          if (popupResponse.isCorrect) {
            popupResponse.result = "correct";
          } else {
            popupResponse.result = "incorrect";
          }
        }

        // Manejar timeout
        if (!popupResponse.wasAnswered && popupResponse.result === "pending") {
          const now = new Date();
          const popupTime = new Date(popupResponse.popupTime);
          const timeLimitMs = popupResponse.timeLimit * 1000;

          if (now.getTime() - popupTime.getTime() > timeLimitMs) {
            popupResponse.result = "timeout";
          }
        }
      },
    },
  },
);

export default PopupResponseModel;
