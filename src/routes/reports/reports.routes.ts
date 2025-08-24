import { Router } from "express";
import {
  getPersonalReport,
  getFlexFridayStatus,
  generateManualReport,
  getTeamReport,
} from "../../controllers/report";
import authMiddleware from "../../middlewares/authMiddleware";
import checkToken from "../../middlewares/checkToken";

const router = Router();

// Todas las rutas requieren autenticación
router.use(checkToken, authMiddleware);

// === REPORTES PERSONALES ===
// Cualquier usuario puede ver sus propios reportes
router.get("/personal", getPersonalReport);
router.get("/flex-friday", getFlexFridayStatus);
router.post("/generate", generateManualReport);

// === REPORTES DE EQUIPO ===
// Solo usuarios del mismo sector pueden ver reportes del equipo
router.get("/team", getTeamReport);

export default router;
