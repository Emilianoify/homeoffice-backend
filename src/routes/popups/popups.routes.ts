import { Router } from "express";
import {
  generatePopup,
  respondPopup,
  getPopupHistory,
} from "../../controllers/popups";
import authMiddleware from "../../middlewares/authMiddleware";
import checkToken from "../../middlewares/checkToken";

const router = Router();

// Todas las rutas requieren autenticación
router.use(checkToken);
router.use(authMiddleware);

// Generar pop-up matemático (manual para testing)
router.post("/generate", generatePopup);

// Responder a un pop-up
router.post("/respond", respondPopup);

// Obtener historial de pop-ups
router.get("/history", getPopupHistory);

export default router;
