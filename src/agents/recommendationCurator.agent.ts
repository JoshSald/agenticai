import OpenAI from "openai";
import { Record } from "../data/inventory";

export const recommendationCuratorAgent = async (records: Record[]) => {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: `
You are a record store assistant.
Given these records, recommend them to a customer in a friendly tone.

Records:
${JSON.stringify(records, null, 2)}
`,
  });

  return response.output_text;
};
