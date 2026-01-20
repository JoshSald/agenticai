import OpenAI from "openai";
import { Record } from "../data/inventory";
import { createLLMClient } from "../llm/client";

export const recommendationCuratorAgent = async (records: Record[]) => {
  const { client, model } = createLLMClient();

  const response = await client.responses.create({
    model,
    input: `
You are a record store assistant.
Given these records, recommend them to a customer in a friendly tone.

Records:
${JSON.stringify(records, null, 2)}
`,
  });

  return response.output_text;
};
