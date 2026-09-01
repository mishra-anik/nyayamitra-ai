import { Router } from "express";
import chatController from "../controllers/chat.controller.js";

const chatRoute = Router();

chatRoute.post("/chat", chatController);

export default chatRoute;
