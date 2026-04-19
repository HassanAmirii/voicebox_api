import { Router } from "express";
import {
  createReport,
  getAllReports,
} from "../controllers/report.controllers.js";

const router = Router();

router.post("/", createReport);
router.get("/", getAllReports);

export default router;
