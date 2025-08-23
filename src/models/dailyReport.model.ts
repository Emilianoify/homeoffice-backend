import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import { COMMENTS } from "../utils/constants/messages/comments";

const DailyReport = sequelize.define(
  "DailyReport",
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
      comment: COMMENTS.REPORT_USER_ID,
    },
    reportDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: COMMENTS.REPORT_DATE,
    },
    // Métricas de tiempo trabajado
    totalMinutesWorked: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: COMMENTS.REPORT_TOTAL_MINUTES,
    },
    totalMinutesInSession: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: COMMENTS.REPORT_SESSION_MINUTES,
    },
    // Métricas de pop-ups
    totalPopupsReceived: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: COMMENTS.REPORT_POPUPS_RECEIVED,
    },
    totalPopupsAnswered: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: COMMENTS.REPORT_POPUPS_ANSWERED,
    },
    correctAnswersCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: COMMENTS.REPORT_CORRECT_ANSWERS,
    },
    popupAccuracy: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
      comment: COMMENTS.REPORT_POPUP_ACCURACY,
    },
    averageResponseTime: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: COMMENTS.REPORT_AVG_RESPONSE_TIME,
    },
    // Métricas de tareas
    totalTasksAssigned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: COMMENTS.REPORT_TASKS_ASSIGNED,
    },
    totalTasksCompleted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: COMMENTS.REPORT_TASKS_COMPLETED,
    },
    taskCompletionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
      comment: COMMENTS.REPORT_TASK_COMPLETION_RATE,
    },
    // Score final de productividad
    productivityScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
      comment: COMMENTS.REPORT_PRODUCTIVITY_SCORE,
    },
    // Desglose de tiempo por estado (JSON)
    stateBreakdown: {
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
      comment: COMMENTS.REPORT_STATE_BREAKDOWN,
    },
    // Viernes flex
    qualifiesForFlexFriday: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: COMMENTS.REPORT_QUALIFIES_FLEX,
    },
    weeklyProductivityAverage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: COMMENTS.REPORT_WEEKLY_AVERAGE,
    },
  },
  {
    tableName: "daily_reports",
    modelName: "DailyReport",
    timestamps: true,
    paranoid: false, // No soft delete para reportes
    // ÍNDICES PARA CONSULTAS DE REPORTES
    indexes: [
      {
        fields: ["userId"],
        name: "idx_daily_reports_user_id",
      },
      {
        fields: ["reportDate"],
        name: "idx_daily_reports_date",
      },
      {
        fields: ["productivityScore"],
        name: "idx_daily_reports_score",
      },
      // Para encontrar reporte específico
      {
        unique: true,
        fields: ["userId", "reportDate"],
        name: "idx_daily_reports_user_date",
      },
      // Para rankings y comparativas
      {
        fields: ["reportDate", "productivityScore"],
        name: "idx_daily_reports_date_score",
      },
    ],
  },
);

export default DailyReport;
