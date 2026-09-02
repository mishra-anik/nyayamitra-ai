import { Router } from "express";
import upload from "../middleware/upload.js";
import { uploadData } from "../controllers/document.controller.js";
const mainRagRouter = Router();
mainRagRouter.post("/upload-data", upload.single("document"), uploadData);
export default mainRagRouter;
