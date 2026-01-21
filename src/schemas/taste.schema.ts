import { z } from "zod";

export const tasteProfileSchema = z.object({
  genres: z.array(z.string()).default([]),
  era: z.string().optional(),
  similarArtists: z.array(z.string()).default([]),
  albums: z.array(z.string()).default([]), // Album titles the user mentioned
  genreMentions: z.array(z.string()).default([]), // Genre keywords the user mentioned
});

export type TasteProfile = z.infer<typeof tasteProfileSchema>;
