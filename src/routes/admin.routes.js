import { Router } from "express";
import {
  getReport,
  patchReport,
  getStats,
  getAllAdmins,
  deleteAdmin,
  getMembershipCode,
} from "../controllers/admin.controllers.js";
import { auth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/reports", auth, getReport);
router.patch("/reports/:id", auth, patchReport);
router.get("/stats", auth, getStats);
router.get("/admins", auth, getAllAdmins);
router.delete("/admins/:username", auth, deleteAdmin);
router.post("/membership-code", auth, getMembershipCode);

export default router;