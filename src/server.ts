import app from "./app";
import { SUCCESS_MESSAGES } from "./utils/constants/messages/success.messages";
import { ERROR_MESSAGES } from "./utils/constants/messages/error.messages";
import { testDbConnection } from "./config/db";
import { createDefaultRoles } from "./utils/seeders/createRoles";
import sequelize from "./config/db";
import "./models";

const PORT = process.env.PORT || 3000;

const initializeDatabase = async (): Promise<void> => {
  try {
    await testDbConnection();

    await sequelize.sync({ alter: true });

    await createDefaultRoles();

    console.log(SUCCESS_MESSAGES.DB.DB_UP);
  } catch (error) {
    console.error(ERROR_MESSAGES.DB.DB_CONNECTION, error);
    throw error;
  }
};

const startServer = async (): Promise<void> => {
  try {
    // Inicializar base de datos y datos por defecto
    await initializeDatabase();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`${SUCCESS_MESSAGES.SERVER.STARTUP} ${PORT}`);
    });
  } catch (error) {
    console.error(ERROR_MESSAGES.SERVER.STARTUP, error);
    process.exit(1);
  }
};

startServer();
