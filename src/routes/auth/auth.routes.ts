import { Router } from "express";
import {
  forgotPassword,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
} from "../../controllers/auth/index";
import authMiddleware from "../../middlewares/authMiddleware";
import checkToken from "../../middlewares/checkToken";
import { changePassword } from "../../controllers/auth/changePassword";
const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", checkToken, authMiddleware, logout);
router.post("/change-password", checkToken, authMiddleware, changePassword);

export default router;
