import { z } from "zod";

export const tasteProfileSchema = z.object({
  genres: z.array(z.string()),
  era: z.string().optional(),
  similarArtists: z.array(z.string()).optional(),
});

export type TasteProfile = z.infer<typeof tasteProfileSchema>;
