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

  jsonText = jsonText
    .replace(/\\\r?\n/g, "\\n")
    .replace(/\r/g, "")
    .replace(/\t/g, "\\t");

  jsonText = jsonText.replace(/";(\s*")/g, '",\n  $1');

  jsonText = jsonText.replace(/,\s*([}\]])/g, "$1");

  jsonText = jsonText.replace(
    /("(?:[^"\\]|\\.)*")\s*:\s*([a-zA-Z][^,}]*?)(?=\s*[,}])/g,
    (match, key, value) => {
      if (
        value.trim().startsWith('"') ||
        value.trim().startsWith("{") ||
        value.trim().startsWith("[") ||
        value.trim() === "null" ||
        value.trim() === "true" ||
        value.trim() === "false" ||
        /^\d/.test(value.trim())
      ) {
        return match;
      }
      return `${key}: "${value.trim()}"`;
    },
  );

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("RefinerAgent JSON parse failed:");
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

If the user gives a short affirmation ("yes", "yes please", "sure", "okay", "go ahead", "sounds good"):
- intent = "taste_recommendation"
- needsClarification = false
- safeResponse = a warm, concise nudge to share an artist, record, or vibe they like (1 sentence, no markdown)

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

CRITICAL RULES - NEVER ASK CLARIFYING QUESTIONS IF:
1. User mentions a SPECIFIC ARTIST by name (e.g. "I love Sigrid", "into The National", "checking out Radiohead")
2. User mentions a SPECIFIC ALBUM (e.g. "Wish You Were Here", "OK Computer")
3. User mentions a SPECIFIC GENRE EXPLICITLY (e.g. "synthwave", "indie folk", "post-rock")
4. User asks for recommendations or similar artists

In ALL of these cases:
- intent = "taste_recommendation"
- needsClarification = ALWAYS false
- DO NOT ask questions
- DO NOT ask for clarification

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
  → needsClarification = false
  → DO NOT suggest the rejected genre again
- AMBIGUOUS cases only (e.g. "I like dark stuff" with no artist/genre) = ask for clarification
- When in doubt, set needsClarification = false and recommend based on what you know

IMPORTANT:
ALWAYS prefer needsClarification = false.
Only set to true for truly ambiguous requests with ZERO artist/genre mentions.
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
  // Normalize/patch malformed outputs from LLM
  if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as Record<string, unknown>;

    // Intent: default to taste_recommendation if missing/invalid
    const intent = typeof obj.intent === "string" ? obj.intent : "";
    const allowed = [
      "taste_recommendation",
      "discovery",
      "pricing",
      "off_topic",
      "adult_off_topic",
    ];
    if (!allowed.includes(intent)) {
      obj.intent = "taste_recommendation";
    }

    // needsClarification: default false
    if (typeof obj.needsClarification !== "boolean") {
      obj.needsClarification = false;
    }

    // Drop empty strings/nulls for safeResponse/clarifyingQuestion
    if (
      typeof obj.safeResponse !== "string" ||
      obj.safeResponse.trim() === ""
    ) {
      delete obj.safeResponse;
    }
    if (
      typeof obj.clarifyingQuestion !== "string" ||
      obj.clarifyingQuestion.trim() === ""
    ) {
      delete obj.clarifyingQuestion;
    }
  }

  return refinedIntentSchema.parse(parsed);
}
