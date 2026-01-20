import OpenAI from "openai";
import { tasteProfileSchema, TasteProfile } from "../schemas/taste.schema";
import { createLLMClient } from "../llm/client";
import { ConversationState } from "../conversation/conversationState";

export async function tasteAnalyzerAgent(
  prompt: string,
  state?: ConversationState,
) {
  const { client, model } = createLLMClient();
  const stateContext = state
    ? `
Known preferences:
- Liked artists: ${state.likedArtists.join(", ") || "none"}
- Confirmed genres: ${state.confirmedGenres.join(", ") || "none"}
- Excluded genres: ${state.excludedGenres.join(", ") || "none"}
`
    : "No prior preferences.";

  const response = await client.responses.create({
    model,
    input: `
You MUST respond with valid JSON only.
Do NOT include markdown.
Do NOT include explanations.

IMPORTANT GENRE RULES:
- "ambient" does NOT imply "electronic"
- Only include "electronic" if the artist is primarily electronic
- Post-rock bands using atmosphere and guitars are NOT electronic
- If guitars, live drums, or rock structures are present:
  exclude electronic artists

IMPORTANT RULES:
- You MUST respect confirmedGenres and excludedGenres
- Do NOT introduce new genres unless the user explicitly asks for discovery
- If an artist is already known (e.g. Sigur Rós), infer genres conservatively
- Sigur Rós is NOT electronic music
- If excludedGenres includes "electronic", do NOT include electronic or ambient electronic artists

Return an object with this shape:
{
  "genres": string[],
  "era": string,
  "similarArtists": string[]
}

${stateContext}

User request:
${prompt}
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
}
