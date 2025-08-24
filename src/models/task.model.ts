import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import { COMMENTS } from "../utils/constants/messages/comments";
import {
  TASK_PRIORITY_VALUES,
  TASK_STATUS_VALUES,
} from "../utils/validators/validators";
import { TaskPriority } from "../utils/enums/TaskPriority";
import { TaskStatus } from "../utils/enums/TaskStatus";

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 200],
      },
      comment: COMMENTS.TASK_TITLE,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: COMMENTS.TASK_DESCRIPTION,
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      comment: COMMENTS.TASK_ASSIGNED_TO,
    },
    assignedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      comment: COMMENTS.TASK_ASSIGNED_BY,
    },
    priority: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: TaskPriority.BAJA,
      validate: {
        isIn: [TASK_PRIORITY_VALUES],
      },
      comment: COMMENTS.TASK_PRIORITY,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: TaskStatus.PENDIENTE,
      validate: {
        isIn: [TASK_STATUS_VALUES],
      },
      comment: COMMENTS.TASK_STATUS,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: COMMENTS.TASK_DUE_DATE,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: COMMENTS.TASK_COMPLETED_AT,
    },
    // Control de notificaciones
    emailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: COMMENTS.TASK_EMAIL_SENT,
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: COMMENTS.TASK_EMAIL_SENT_AT,
    },
    // Métricas y seguimiento
    estimatedMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: COMMENTS.TASK_ESTIMATED_MINUTES,
    },
    actualMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: COMMENTS.TASK_ACTUAL_MINUTES,
    },
  },
  {
    tableName: "tasks",
    modelName: "Task",
    timestamps: true,
    paranoid: true, // Soft delete para mantener historial
    // ÍNDICES MÍNIMOS NECESARIOS
    indexes: [
      // FK para relaciones
      {
        fields: ["assignedTo"],
        name: "idx_tasks_assigned_to",
      },
      {
        fields: ["assignedBy"],
        name: "idx_tasks_assigned_by",
      },
      // Para dashboard de empleado (mis tareas)
      {
        fields: ["assignedTo", "status"],
        name: "idx_tasks_assigned_status",
      },
      // Para dashboard de coordinador (tareas por estado)
      {
        fields: ["assignedBy", "status"],
        name: "idx_tasks_created_status",
      },
      // Para alertas de vencimiento
      {
        fields: ["dueDate", "status"],
        name: "idx_tasks_due_status",
      },
    ],
  },
);

export default Task;
