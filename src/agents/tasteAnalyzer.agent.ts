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

Your job is to extract musical taste information from the user's message.

CRITICAL ARTIST EXTRACTION:
- If the user mentions ANY artist or band name (e.g., "I love Sigrid", "I’m into Radiohead"), you MUST include it in similarArtists.
- Preserve the exact spelling or use the proper spelling.
- The mentioned artist should be the first entry in similarArtists.

CRITICAL GENRE INFERENCE:
- If you recognize the artist, infer their genres based on common associations (e.g., "Radiohead" → ["alternative rock", "art rock"]).
- If unsure, leave genres empty and include only the artist in similarArtists.

IMPORTANT GENRE RULES:
- "ambient" does NOT imply "electronic"
- Only include "electronic" if the artist is primarily electronic
- Post-rock bands using atmosphere and guitars are NOT electronic
- If guitars, live drums, or rock structures are present: exclude electronic artists

ALBUM DETECTION:
- If user mentions a specific album title (e.g., "What about Wish You Were Here?" or "Dark Side of the Moon"), include it in albums
- Try to identify the artist if possible from context

GENRE DETECTION:
- If user explicitly mentions a genre (e.g., "I like synthwave" or "What about indie folk?"), include it in genreMentions
- Common genres: synthwave, vaporwave, indie folk, indie pop, post-punk, dream pop, hyperpop, emo, metalcore, deathcore, dark wave, shoegaze, witchhouse, etc.
- If the user says "What about [GENRE]?", add to genreMentions instead of similarArtists

IMPORTANT RULES:
- You MUST respect confirmedGenres and excludedGenres from the conversation state
- Do NOT introduce new genres unless the user explicitly asks for discovery
- If excludedGenres includes "electronic", do NOT include electronic or ambient electronic artists

Return an object with this exact shape:
{
  "genres": string[],
  "era": string,
  "similarArtists": string[],
  "albums": string[],
  "genreMentions": string[]
}

${stateContext}

User request:
${prompt}

Example outputs:
User: "I love Sigrid"
→ {"genres": ["synth pop", "electronic"], "era": "2020s", "similarArtists": ["Sigrid"], "albums": [], "genreMentions": []}

User: "What about Wish You Were Here?"
→ {"genres": ["progressive rock", "psychedelic rock"], "era": "1970s", "similarArtists": ["Pink Floyd"], "albums": ["Wish You Were Here"], "genreMentions": []}

User: "I like synthwave"
→ {"genres": ["synthwave", "electronic"], "era": "2010s", "similarArtists": [], "albums": [], "genreMentions": ["synthwave"]}
`,
  });

  const text = response.output_text;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("TasteAnalyzer returned invalid JSON");
  }

  if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as Record<string, any>;
    if (obj.similarArtists && typeof obj.similarArtists === "string") {
      obj.similarArtists = [obj.similarArtists];
    }
    if (obj.albums && typeof obj.albums === "string") {
      obj.albums = [obj.albums];
    }
    if (obj.genreMentions && typeof obj.genreMentions === "string") {
      obj.genreMentions = [obj.genreMentions];
    }
    if (obj.genres && typeof obj.genres === "string") {
      obj.genres = [obj.genres];
    }

    // Harden types: convert null/invalid to defaults
    if (
      obj.era === null ||
      obj.era === undefined ||
      typeof obj.era !== "string"
    ) {
      obj.era = "unknown";
    }
    if (!Array.isArray(obj.albums)) {
      obj.albums = obj.albums ? [String(obj.albums)] : [];
    }
    if (!Array.isArray(obj.similarArtists)) {
      obj.similarArtists = obj.similarArtists
        ? [String(obj.similarArtists)]
        : [];
    }
    if (!Array.isArray(obj.genreMentions)) {
      obj.genreMentions = obj.genreMentions ? [String(obj.genreMentions)] : [];
    }
    if (!Array.isArray(obj.genres)) {
      obj.genres = obj.genres ? [String(obj.genres)] : [];
    }
  }

  const result = tasteProfileSchema.parse(parsed);
  return result;
}
