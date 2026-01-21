import { z } from "zod";

export const agentRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt cannot be empty")
    .max(1000, "Prompt is too long"),
  state: z
    .object({
      likedArtists: z.array(z.string()),
      confirmedGenres: z.array(z.string()),
      excludedGenres: z.array(z.string()),
      awaitingClarification: z.boolean(),
      lastClarification: z.string().optional(),
      activeArtist: z.string().optional(),
      recommendedAlbums: z.array(z.string()).optional(),
    })
    .optional(),
});

export type AgentRequest = z.infer<typeof agentRequestSchema>;
