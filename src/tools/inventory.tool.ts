import { inventory, Record } from "../data/inventory";
import { TasteProfile } from "../schemas/taste.schema";
import { inferPrimaryGenre } from "../helpers/inferGenre";

export const inventoryLookupTool = (taste: TasteProfile): Record[] => {
  const tastePrimary = inferPrimaryGenre(taste.genres).toLowerCase();

  return inventory.filter((record) => {
    const recordPrimary = inferPrimaryGenre(record.genre).toLowerCase();
    return recordPrimary === tastePrimary;
  });
};
