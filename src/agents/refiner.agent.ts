import { refinedIntentSchema } from "../schemas/refinedIntent.schema";
import { createLLMClient } from "../llm/client";

function extractText(response: any): string {
  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  if (Array.isArray(response.output)) {
    for (const item of response.output) {
      if (item.type === "message" && Array.isArray(item.content)) {
        for (const chunk of item.content) {
          if (chunk.type === "output_text" && typeof chunk.text === "string") {
            return chunk.text;
          }
        }
      }
    }
  }

  throw new Error("RefinerAgent: no text output found");
}

function extractJsonObject(text: string): unknown {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("RefinerAgent: no JSON object found");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function refinerAgent(prompt: string) {
  const { client, model } = createLLMClient();

  const response = await client.responses.create({
    model,
    input: `
You are an intent classification and safety refiner agent for a music record store assistant.

You DO NOT answer the user directly.
You ONLY classify intent and optionally provide a safe response.

Return JSON ONLY in this exact shape:

{
  "intent": "taste_recommendation" | "discovery" | "pricing" | "off_topic" | "adult_off_topic",
  "safeResponse"?: string,
  "needsClarification"?: boolean,
  "clarifyingQuestion"?: string
}

Rules:
- adult_off_topic: witty, playful deflection, redirect to music
- off_topic: gentle redirection
- pricing: explain you can’t help with pricing
- Do NOT include markdown
- Do NOT include explanations

User input:
"${prompt}"
`,
  });

  let rawText: string;
  try {
    rawText = extractText(response);
    console.log(response);
  } catch (err) {
    console.error("RefinerAgent full response:", response);
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = extractJsonObject(rawText);
  } catch (err) {
    console.error("RefinerAgent raw text:", rawText);
    throw new Error("RefinerAgent returned invalid JSON");
  }

  return refinedIntentSchema.parse(parsed);
}
