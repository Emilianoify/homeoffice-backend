import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import { AuditAction } from "../utils/enums/AuditAction";
import { AUDIT_ACTION_VALUES } from "../utils/validators/validators";
import { COMMENTS } from "../utils/constants/messages/comments";

const AuditLogModel = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: AuditAction.FORCE_STATE_CHANGE,
      validate: {
        isIn: [AUDIT_ACTION_VALUES],
      },
      comment: COMMENTS.ADMIN_ACTION_DO,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: COMMENTS.ADMIN_CHANGE_DESCRIPTION,
    },

    adminUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      comment: COMMENTS.ADMIN_ID,
    },
    adminEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: COMMENTS.ADMIN_EMAIL,
    },

    targetUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      comment: COMMENTS.MODIFIED_USER_ID,
    },
    targetUserEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: COMMENTS.MODIFIED_USER_EMAIL,
    },

    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
    },

    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: COMMENTS.ADMIN_REASON,
    },

    additionalData: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "audit_logs",
    modelName: "AuditLog",
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        fields: ["adminUserId"],
        name: "idx_audit_admin_user",
      },
      {
        fields: ["targetUserId"],
        name: "idx_audit_target_user",
      },
      {
        fields: ["action"],
        name: "idx_audit_action",
      },
      {
        fields: ["createdAt"],
        name: "idx_audit_created_at",
      },
      // Índice compuesto para buscar acciones de un admin sobre un usuario
      {
        fields: ["adminUserId", "targetUserId", "createdAt"],
        name: "idx_audit_admin_target_date",
      },
    ],
  },
);

export default AuditLogModel;
