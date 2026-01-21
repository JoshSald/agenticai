import { inventory, Record } from "../data/inventory";
import { TasteProfile } from "../schemas/taste.schema";
import { inferPrimaryGenre } from "../helpers/inferGenre";

export const inventoryLookupTool = (taste: TasteProfile): Record[] => {
  if (!taste || !Array.isArray(taste.genres) || taste.genres.length === 0) {
    return [];
  }

  const inferred = inferPrimaryGenre(taste.genres);

  if (!inferred || typeof inferred !== "string") {
    return [];
  }

  const tastePrimary = inferred.toLowerCase();

  const matches = inventory.filter((record) => {
    const recordPrimary = inferPrimaryGenre(record.genre);
    return (
      typeof recordPrimary === "string" &&
      recordPrimary.toLowerCase() === tastePrimary
    );
  });

  return matches;
};
