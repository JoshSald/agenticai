import { tasteAnalyzerAgent } from "./tasteAnalyzer.agent";
import { inventoryLookupTool } from "../tools/inventory.tool";
import { fetchReleaseForAlbum } from "../tools/musicbrainz.tool";
import { getCoverArtUrl } from "../tools/coverart.tool";
import { recommendationCuratorAgent } from "./recommendationCurator.agent";
import { refinerAgent } from "./refiner.agent";

export const orchestratorAgent = async (prompt: string) => {
  const refined = await refinerAgent(prompt);

  if (refined.intent === "adult_off_topic" || refined.intent === "off_topic") {
    return {
      tasteProfile: null,
      matches: [],
      recommendations:
        refined.safeResponse ??
        "Let’s keep things musical. Tell me about an artist or album you love.",
    };
  }

  if (refined.intent === "pricing") {
    return {
      tasteProfile: null,
      matches: [],
      recommendations:
        "I can’t help with free albums, discounts, or pricing, but I’d love to help you discover music you’ll enjoy.",
    };
  }

  if (refined.needsClarification) {
    return {
      tasteProfile: null,
      matches: [],
      recommendations: refined.clarifyingQuestion,
    };
  }

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
