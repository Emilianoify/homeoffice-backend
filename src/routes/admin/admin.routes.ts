import { Router } from "express";
import {
  changeUserPassword,
  getUserProfile,
  updateUserProfile,
} from "../../controllers/admin/index";
import checkToken from "../../middlewares/checkToken";
import authMiddleware from "../../middlewares/authMiddleware";
import requireAdmin from "../../middlewares/requireAdmin";

const router = Router();

router.use(checkToken, authMiddleware, requireAdmin);

router.post("/users/:userId/change-password", changeUserPassword);
router.get("/users/:userId/profile", getUserProfile);
router.put("/users/:userId/profile", updateUserProfile);

// router.post("/users/:userId/toggle-status", toggleUserStatus);
// router.get("/users", listUsers);

export default router;
