import { Router } from "express";
import { getProfile, updateProfile } from "../../controllers/user/index";
import checkToken from "../../middlewares/checkToken";
import authMiddleware from "../../middlewares/authMiddleware";

const router = Router();

// Todas las rutas de user requieren autenticación
router.use(checkToken, authMiddleware);

// Rutas de perfil de usuario
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

export default router;
