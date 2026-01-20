import { inventory, Record } from "../data/inventory";
import { TasteProfile } from "../schemas/taste.schema";

export const inventoryLookupTool = (taste: TasteProfile): Record[] => {
  const tasteGenres = taste.genres.map((g) => g.toLowerCase());

  return inventory.filter((record) =>
    record.genre.some((g) => tasteGenres.includes(g.toLowerCase())),
  );
};
