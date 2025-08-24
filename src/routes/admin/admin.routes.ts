import { Router } from "express";
import {
  changeUserPassword,
  getUserProfile,
  listUsers,
  toggleUserStatus,
  updateUserProfile,
} from "../../controllers/admin/index";
import checkToken from "../../middlewares/checkToken";
import authMiddleware from "../../middlewares/authMiddleware";
import requireAdmin from "../../middlewares/requireAdmin";
import { getDashboardMetrics } from "../../controllers/admin/getDashboardMetrics";
import { getProductivityRanking } from "../../controllers/admin/getProductivityRanking";

const router = Router();

router.use(checkToken, authMiddleware, requireAdmin);

router.get("/users", listUsers);
router.get("/users/:userId/profile", getUserProfile);
router.put("/users/:userId/profile", updateUserProfile);
router.post("/users/:userId/change-password", changeUserPassword);
router.post("/users/:userId/toggle-status", toggleUserStatus);
router.get("/dashboard", getDashboardMetrics);
router.get("/ranking", getProductivityRanking);
export default router;
