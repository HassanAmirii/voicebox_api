import { Router } from "express";
import {
  createReport,
  getAllReports,
} from "../controllers/report.controllers.js";
import { reportSubmitLimiter } from "../middlewares/rateLimiter.middlewares.js";
const router = Router();

router.post("/", reportSubmitLimiter, createReport);
router.get("/", getAllReports);

export default router;
