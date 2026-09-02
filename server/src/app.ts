import express from "express";
import chatRoute from "./router/chat.route.js";
import mainRagRouter from "./router/mainRag.route.js";

const app = express();

app.use(express.json());

// Root route
app.get("/", (_req, res) => {
  res.status(200).json({
    status: 200,
    message: "NyayaMitra API is running",
  });
});

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
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
