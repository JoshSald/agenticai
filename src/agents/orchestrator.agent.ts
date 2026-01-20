import { tasteAnalyzerAgent } from "./tasteAnalyzer.agent";
import { inventoryLookupTool } from "../tools/inventory.tool";
import { fetchReleaseForAlbum } from "../tools/musicbrainz.tool";
import { getCoverArtUrl } from "../tools/coverart.tool";
import { recommendationCuratorAgent } from "./recommendationCurator.agent";

export const orchestratorAgent = async (prompt: string) => {
  const tasteProfile = await tasteAnalyzerAgent(prompt);
  const matches = inventoryLookupTool(tasteProfile);

  const enrichedMatches = await Promise.all(
    matches.map(async (record) => {
      const release = await fetchReleaseForAlbum(record.artist, record.album);

      return {
        ...record,
        musicBrainzId: release?.id,
        coverArt: release ? getCoverArtUrl(release.id) : undefined,
      };
    }),
  );

  const recommendations = await recommendationCuratorAgent(enrichedMatches);

  return {
    tasteProfile,
    matches: enrichedMatches,
    recommendations,
  };
};
