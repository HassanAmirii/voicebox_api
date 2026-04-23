import { rateLimit } from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  message: {
    success: false,
    message: "too many attempts, try again later",
  },
});

export const registerLimiter = rateLimit({
  windowMs: 1 * 60 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message: "too many attempts, try again later",
  },
});

export const reportSubmitLimiter = rateLimit({
  windowMs: 1 * 60 * 60 * 1000,
  limit: 20,
  message: {
    success: false,
    message: "too many attempts, try again later",
  },
});
