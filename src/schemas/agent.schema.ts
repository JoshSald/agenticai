import { z } from "zod";

export const agentRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt cannot be empty")
    .max(1000, "Prompt is too long"),
});

export type AgentRequest = z.infer<typeof agentRequestSchema>;
