import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import reportRoutes from "./routes/report.routes.js";

const app = express();
app.use(express.json());

/*
cors setup
*/

const productionOrigin = process.env.FRONTEND_URL;

const allowedOrigins =
  process.env.APP_ENV === "production"
    ? productionOrigin
    : [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
      ];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/*
health checks
*/
app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "healthy",
  });
});

/*
routes mount
*/
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/reports", reportRoutes);

/*
global error handler
*/
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // 1. Handle Mongoose/MongoDB Validation Errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // 2. Handle MongoDB Duplicate Key (e.g., Email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    statusCode = 409;
    message = `${field} already exists.`;
  }

  // 3. Handle JWT Errors (Categorized by name)
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your token has expired.";
  }

  return res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.APP_ENV === "development" ? err.stack : undefined,
  });
});

export default app;
