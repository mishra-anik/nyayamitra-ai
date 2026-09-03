import express from "express";
import chatRoute from "./router/chat.route.js";
import mainRagRouter from "./router/mainRag.route.js";

const app = express();

app.use(express.json());

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

export default app;
