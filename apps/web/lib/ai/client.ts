import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const gemini = createGoogleGenerativeAI({
  apiKey:
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY,
});

export const MODEL = "gemini-3.1-flash-lite-preview";
