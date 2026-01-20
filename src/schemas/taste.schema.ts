import { z } from "zod";

export const tasteProfileSchema = z.object({
  genres: z.array(z.string()).default([]),
  era: z.string().optional(),
  similarArtists: z.array(z.string()).default([]),
});

export type TasteProfile = z.infer<typeof tasteProfileSchema>;
