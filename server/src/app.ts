import express from "express";
import chatRoute from "./router/chat.route.js";
import mainRagRouter from "./router/mainRag.route.js";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  return res.json({
    status: 200,
    message: "Server is running",
  });
});

app.use("/" , mainRagRouter);

app.use("/", chatRoute);

export default app;
