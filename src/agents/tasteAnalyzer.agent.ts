import OpenAI from "openai";
import { tasteProfileSchema, TasteProfile } from "../schemas/taste.schema";
import { createLLMClient } from "../llm/client";

export const tasteAnalyzerAgent = async (
  prompt: string,
): Promise<TasteProfile> => {
  const { client, model } = createLLMClient();

  const response = await client.responses.create({
    model,
    input: `
You MUST respond with valid JSON only.
Do NOT include markdown.
Do NOT include explanations.

Return an object with this shape:
{
  "genres": string[],
  "era": string,
  "similarArtists": string[]
}

User statement:
"${prompt}"
`,
  });

  const text = response.output_text;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("TasteAnalyzer returned invalid JSON");
  }

  return tasteProfileSchema.parse(parsed);
};
