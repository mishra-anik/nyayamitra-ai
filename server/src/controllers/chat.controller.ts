import { Request, Response } from "express";
import { vectorSearch } from "../rag/embeddings.js";
import { aiSearch } from "../services/ai.service.js";

const chatController = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    const context = await vectorSearch(text);
    const response = await aiSearch(context, text);

    return res.status(200).json({
      response,
    });
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return res.status(500).json({
      message: errorMessage,
    });
  }
};

export default chatController;
