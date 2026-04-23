import { Router } from "express";
import { register, login } from "../controllers/auth.controllers.js";
import {
  loginLimiter,
  registerLimiter,
} from "../middlewares/rateLimiter.middlewares.js";
const router = Router();

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);

export default router;

