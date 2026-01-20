import OpenAI from "openai";
import { Record } from "../data/inventory";
import { createLLMClient } from "../llm/client";

export const recommendationCuratorAgent = async (records: Record[]) => {
  const { client, model } = createLLMClient();

  const response = await client.responses.create({
    model,
    input: `
You are a friendly record store assistant.

Your task:
- Write a short, friendly recommendation message for the customer.
- Refer to albums and artists in plain text only.
- Do NOT include markdown.
- Do NOT include image links.
- Do NOT list raw data fields.
- Assume album art and metadata will be displayed separately in the UI.

Focus on:
- Why these albums fit the customer's taste
- A conversational, welcoming tone

!IMPORTANT:
- DO NOT discuss pricing with the customer, but refer them to get in touch

Records:
${JSON.stringify(records, null, 2)}
`,
  });

  return response.output_text;
};
