import { Router } from "express";
import checkToken from "../../middlewares/checkToken";
import authMiddleware from "../../middlewares/authMiddleware";
import { requireTaskAssigner } from "../../middlewares/validateRole";
import {
  updateTask,
  completeTask,
  deleteTask,
  createTask,
  getTasks,
} from "../../controllers/task";

const router = Router();

// Todas las rutas de tasks requieren autenticación
router.use(checkToken, authMiddleware);

// Rutas de tareas
router.post("/", requireTaskAssigner, createTask); // Solo coordinadores pueden crear
router.get("/", getTasks); // Todos pueden ver sus tareas
router.put("/:taskId", updateTask); // Solo quien creó la tarea o admin
router.post("/:taskId/complete", completeTask); // Solo el asignado
router.delete("/:taskId", deleteTask); // Solo quien creó la tarea o admin

export default router;
