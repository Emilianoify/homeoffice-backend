import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/db";
import logger from "./middlewares/logging";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Conectar a la base de datos
    await connectDB();

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`Servidor iniciado en puerto ${PORT}`);
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("Error al iniciar servidor:", error);
    process.exit(1);
  }
}

startServer();
