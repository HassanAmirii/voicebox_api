import { Router } from "express";
import {
  createReport,
  getAllReports,
  findReport
} from "../controllers/report.controllers.js";
import { reportSubmitLimiter } from "../middlewares/rateLimiter.middlewares.js";
const router = Router();

router.post("/", reportSubmitLimiter, createReport);
router.get("/", getAllReports);
router.get("/:ticketId", findReport);

export default router;
