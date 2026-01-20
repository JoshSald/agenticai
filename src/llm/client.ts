import OpenAI from "openai";

export const createLLMClient = () => {
  if (process.env.NODE_ENV === "development") {
    return {
      client: new OpenAI({
        baseURL: "http://localhost:11434/v1",
        apiKey: "ollama",
        timeout: 120_000,
      }),
      model: process.env.OLLAMA_MODEL || "llama3.2",
    };
  }

  return {
    client: new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30_000,
    }),
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  };
};
