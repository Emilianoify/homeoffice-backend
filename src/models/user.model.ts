import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import { ERROR_MESSAGES } from "../utils/constants/messages/error.messages";

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
    ],
  },
);

export default User;
