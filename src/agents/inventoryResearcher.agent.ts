import { inventory } from "../data/inventory";
import { TasteProfile } from "../schemas/taste.schema";

export const inventoryResearcherAgent = async (taste: TasteProfile) => {
  return inventory.filter((record) =>
    record.genre.some((g) =>
      taste.genres.map((tg) => tg.toLowerCase()).includes(g.toLowerCase()),
    ),
  );
};
