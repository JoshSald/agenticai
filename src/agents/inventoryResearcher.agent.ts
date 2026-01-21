import { inventory } from "../data/inventory";
import { TasteProfile } from "../schemas/taste.schema";
import { inferPrimaryGenre } from "../helpers/inferGenre";

const INCOMPATIBLE_GENRES: Record<string, string[]> = {
  "post-rock": ["electronic"],
  electronic: ["post-rock"],
};

export const inventoryResearcherAgent = async (taste: TasteProfile) => {
  const tastePrimary = inferPrimaryGenre(taste.genres);

  return inventory.filter((record) => {
    const recordPrimary = inferPrimaryGenre(record.genre);

    if (INCOMPATIBLE_GENRES[tastePrimary]?.includes(recordPrimary)) {
      return false;
    }

    return recordPrimary === tastePrimary;
  });
};
