import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import { COMMENTS } from "../utils/constants/messages/comments";

const TaskFile = sequelize.define(
  "TaskFile",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "tasks",
        key: "id",
      },
      comment: COMMENTS.TASKFILE_TASK_ID,
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: COMMENTS.TASKFILE_FILE_NAME,
    },
    driveUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        isUrl: true,
      },
      comment: COMMENTS.TASKFILE_DRIVE_URL,
    },
    driveFileId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: COMMENTS.TASKFILE_DRIVE_FILE_ID,
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: COMMENTS.TASKFILE_FILE_SIZE,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: COMMENTS.TASKFILE_MIME_TYPE,
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      comment: COMMENTS.TASKFILE_UPLOADED_BY,
    },
  },
  {
    tableName: "task_files",
    modelName: "TaskFile",
    timestamps: true,
    paranoid: true,
    // ÍNDICES MÍNIMOS
    indexes: [
      {
        fields: ["taskId"],
        name: "idx_task_files_task_id",
      },
      {
        fields: ["driveFileId"],
        name: "idx_task_files_drive_file_id",
        unique: true,
      },
    ],
  },
);

export default TaskFile;
