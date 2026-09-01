import express from "express";
import chatRoute from "./router/chat.route.js";
import mainRagRouter from "./router/mainRag.route.js";

const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  return res.json({
    status: 200,
    message: "Server is running",
  });
});

// Routes
app.use("/", mainRagRouter);
app.use("/", chatRoute);

// 404 Handler
app.all("/{*splat}", (req, res, next) => {
  const error: any = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

export default app;
