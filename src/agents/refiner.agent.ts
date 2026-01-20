import { refinedIntentSchema } from "../schemas/refinedIntent.schema";
import { createLLMClient } from "../llm/client";
import { ConversationState } from "../conversation/conversationState";

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

  let jsonText = cleaned.slice(start, end + 1);

  // ✅ Normalize broken newlines inside strings
  jsonText = jsonText
    .replace(/\\\r?\n/g, "\\n") // escaped line breaks
    .replace(/\r/g, "")
    .replace(/\t/g, "\\t");

  // ✅ CRITICAL FIX: remove trailing commas (LLMs love these)
  jsonText = jsonText.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("❌ RefinerAgent JSON parse failed:");
    console.error(jsonText);
    throw err;
  }
}

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export async function refinerAgent(prompt: string, state?: ConversationState) {
  const { client, model } = createLLMClient();
  const knownTaste = state
    ? `
Known taste signals:
- likedArtists: ${state.likedArtists.join(", ") || "none"}
- confirmedGenres: ${state.confirmedGenres.join(", ") || "none"}
- excludedGenres: ${state.excludedGenres.join(", ") || "none"}
`
    : "No known taste yet.";

  const response = await client.responses.create({
    model,
    input: `
You are an intent classification and safety refiner agent for a music record store assistant.

You DO NOT answer the user.
You ONLY classify intent and optionally provide a safe response.

${knownTaste}

Latest user input:
"${prompt}"

Return JSON ONLY in this exact shape:

{
  "intent": "taste_recommendation" | "discovery" | "pricing" | "off_topic" | "adult_off_topic",
  "safeResponse"?: string,
  "needsClarification"?: boolean,
  "clarifyingQuestion"?: string
}

CRITICAL RULE:
If the user mentions a specific artist by name (e.g. "Sigur Rós"):
- intent MUST be "taste_recommendation"
- needsClarification MUST be false
- DO NOT ask questions
- DO NOT generalize the genre
- Assume the user wants similar artists

Rules:
- Respond with JSON ONLY. No markdown. No explanations.
- If the user asks about prices, discounts, or free items → intent = "pricing"
- If the input is sexual or adult but unrelated to music → intent = "adult_off_topic"
- If the input is unrelated to music → intent = "off_topic"
- If the assistant previously asked a clarification question and the user responds affirmatively (yes, yes please, sure, ok):
  → intent = "taste_recommendation"
  → needsClarification = false
- If the user explicitly rejects a genre (e.g. "I'm not into electronic music"):
  → intent = "taste_recommendation"
  → DO NOT suggest the rejected genre again
- Only set needsClarification = true if critical information is missing

IMPORTANT:
If the user has already mentioned a specific artist or genre,
DO NOT ask clarifying questions.
Set "needsClarification" to false.

The refiner must be consistent across turns.
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
