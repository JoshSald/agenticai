import { tasteAnalyzerAgent } from "./tasteAnalyzer.agent";
import { inventoryLookupTool } from "../tools/inventory.tool";
import { fetchArtistInfo } from "../tools/musicbrainz.tool";
import { recommendationCuratorAgent } from "./recommendationCurator.agent";

export const orchestratorAgent = async (prompt: string) => {
  const tasteProfile = await tasteAnalyzerAgent(prompt);
  const matches = inventoryLookupTool(tasteProfile);

  const enrichedMatches = await Promise.all(
    matches.map(async (record) => ({
      ...record,
      artistInfo: await fetchArtistInfo(record.artist),
    })),
  );

  const recommendations = await recommendationCuratorAgent(enrichedMatches);

  return {
    tasteProfile,
    matches: enrichedMatches,
    recommendations,
  };
};
