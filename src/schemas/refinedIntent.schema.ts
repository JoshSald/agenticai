import { z } from "zod";

export const refinedIntentSchema = z.object({
  intent: z.enum([
    "taste_recommendation",
    "discovery",
    "pricing",
    "off_topic",
    "adult_off_topic",
  ]),
  needsClarification: z.boolean(),
  clarifyingQuestion: z.string().optional(),
  safeResponse: z.string().optional(),
});

export type refinedIntent = z.infer<typeof refinedIntentSchema>;
