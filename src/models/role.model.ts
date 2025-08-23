import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import { COMMENTS } from "../utils/constants/messages/comments";

const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500],
      },
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: COMMENTS.ROLE_ARRAY,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: "roles",
    modelName: "Role",
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ["name"],
      },
      {
        fields: ["isActive"],
      },
    ],
  },
);

export default Role;
