import OpenAI from "openai";

export type TasteProfile = {
  genres: string[];
  era?: string;
  similarArtists?: string[];
};

export const tasteAnalyzerAgent = async (
  prompt: string,
): Promise<TasteProfile> => {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.responses.create({
    model: "gpt-4o-mini",
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

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("TasteAnalyzer returned invalid JSON");
  }
};
