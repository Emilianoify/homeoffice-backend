import { Router } from "express";
import {
  changeState,
  getCurrentState,
  getStateHistory,
  getTeamStates,
} from "../../controllers/states";
import authMiddleware from "../../middlewares/authMiddleware";
import checkToken from "../../middlewares/checkToken";

const router = Router();

router.use(checkToken);
router.use(authMiddleware);

// Cambiar estado del usuario
router.post("/change", changeState);

// Obtener estado actual del usuario
router.get("/current", getCurrentState);

// Obtener historial de estados del usuario
router.get("/history", getStateHistory);

// Obtener estados del equipo (mismo sector)
router.get("/team", getTeamStates);

export default router;
