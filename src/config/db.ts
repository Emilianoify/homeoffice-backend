import "dotenv/config";
import { Sequelize } from "sequelize";
import { ERROR_MESSAGES } from "../utils/constants/messages/error.messages";

const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS } = process.env;

if (!DB_HOST || !DB_PORT || !DB_NAME || !DB_USER || !DB_PASS) {
  throw new Error(ERROR_MESSAGES.DB.DB_CONNECTION);
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: parseInt(DB_PORT),
  dialect: "postgres",
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const testDbConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
  } catch (error) {
    console.error(ERROR_MESSAGES.DB.DB_CONNECTION, error);
    throw error;
  }
};

export default sequelize;
