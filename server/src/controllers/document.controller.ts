import { Request, Response } from "express";
import { documentParse } from "../rag/documentParse.js";
import { vectorEmbed } from "../rag/embeddings.js";

interface CustomRequest extends Request {
  file?: Express.Multer.File;
}

export const uploadData = async (
  req: CustomRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "File is required",
      });
    }

    const result = await documentParse(
      new Uint8Array(req.file.buffer),
      req.file.originalname,
    );

    await vectorEmbed(result);

    return res.status(200).json({
      message: "File received",
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
