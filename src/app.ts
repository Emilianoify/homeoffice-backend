import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";
import routes from "./routes";
import { authMiddleware } from "./middlewares/auth";
import { rateLimitMiddleware } from "./middlewares/rateLimit";
import logger from "./middlewares/logging";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Middlewares globales
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimitMiddleware);

// Logging de requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Rutas
app.use("/api", routes);

// Middleware de manejo de errores
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error(err.stack);
    res.status(500).json({ message: "Error interno del servidor" });
  },
);

// Configuración de Socket.IO para notificaciones en tiempo real
io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  socket.on("join-user-room", (userId) => {
    socket.join(`user-${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
  });
});

export { io };
export default app;
