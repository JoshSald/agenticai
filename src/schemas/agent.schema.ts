import { z } from "zod";

export const agentRequestSchema = z.object({
  prompt: z
    .string()
    .min(5, "Prompt is too short")
    .max(1000, "Prompt is too long"),
});

export type AgentRequest = z.infer<typeof agentRequestSchema>;
