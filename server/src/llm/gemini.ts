import {ChatGoogleGenerativeAI} from "@langchain/google-genai"

export const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash-lite",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});
