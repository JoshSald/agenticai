import { tasteAnalyzerAgent } from "./tasteAnalyzer.agent";
import { inventoryLookupTool } from "../tools/inventory.tool";
import { inventory } from "../data/inventory";
import {
  fetchReleaseForAlbum,
  fetchArtistByName,
  fetchReleaseGroupsForArtist,
} from "../tools/musicbrainz.tool";
import {
  getCoverArtUrl,
  getReleaseGroupCoverArtUrl,
} from "../tools/coverart.tool";
import { recommendationCuratorAgent } from "./recommendationCurator.agent";
import { refinerAgent } from "./refiner.agent";
import {
  ConversationState,
  createInitialConversationState,
} from "../conversation/conversationState";
import { hasEnoughTasteSignal } from "../conversation/hasEnoughTastesSignal";
import { normalizeResponse } from "../helpers/normalizeResponse";
import { getSimilarArtists } from "../tools/lastfm.tool";

export const orchestratorAgent = async (
  prompt: string,
  state?: ConversationState,
) => {
  const conversationState = state ?? createInitialConversationState();

  let refined: Awaited<ReturnType<typeof refinerAgent>> | null = null;

  if (!hasEnoughTasteSignal(conversationState)) {
    refined = await refinerAgent(prompt);
    refined.needsClarification ??= false;
  }

  if (
    refined &&
    (refined.intent === "adult_off_topic" || refined.intent === "off_topic")
  ) {
    return normalizeResponse({
      tasteProfile: null,
      matches: [],
      recommendations:
        refined.safeResponse ??
        "Let's keep things musical. Tell me about an artist or album you love.",
      state: conversationState,
    });
  }

  if (refined && refined.intent === "pricing") {
    return normalizeResponse({
      tasteProfile: null,
      matches: [],
      recommendations:
        "I can't help with pricing, but I'd love to help you discover music you'll enjoy.",
      state: conversationState,
    });
  }

  if (
    refined &&
    refined.safeResponse &&
    refined.intent !== "taste_recommendation"
  ) {
    return normalizeResponse({
      tasteProfile: null,
      matches: [],
      recommendations: refined.safeResponse,
      state: conversationState,
    });
  }

  if (
    refined &&
    refined.needsClarification === true &&
    !hasEnoughTasteSignal(conversationState)
  ) {
    conversationState.awaitingClarification = true;
    conversationState.lastClarification = refined.clarifyingQuestion;
    return normalizeResponse({
      tasteProfile: null,
      matches: [],
      recommendations: refined.clarifyingQuestion,
      state: conversationState,
    });
  }

  const tasteProfile = await tasteAnalyzerAgent(prompt, conversationState);

  let matches: any[] = [];

  const mentionedAlbums = tasteProfile.albums || [];
  if (mentionedAlbums.length > 0) {
    const inventoryAlbumMatches = inventory.filter((record) =>
      mentionedAlbums.some(
        (album) =>
          album.toLowerCase() === record.album.toLowerCase() ||
          album.toLowerCase().includes(record.album.toLowerCase()) ||
          record.album.toLowerCase().includes(album.toLowerCase()),
      ),
    );

    if (inventoryAlbumMatches.length > 0) {
      const enrichedMatches = await Promise.all(
        inventoryAlbumMatches.map(async (record) => {
          try {
            const release = await fetchReleaseForAlbum(
              record.artist,
              record.album,
            );
            return {
              ...record,
              musicBrainzId: release?.id,
              coverArt: release ? getCoverArtUrl(release.id) : undefined,
              available: true,
            };
          } catch (e) {
            return { ...record, available: true };
          }
        }),
      );
      matches = enrichedMatches;
    }
  }

  if (matches.length > 0) {
    const recommendations = await recommendationCuratorAgent(matches);
    return normalizeResponse({
      tasteProfile,
      matches,
      recommendations,
      state: conversationState,
    });
  }

  try {
    const artistsToLookup = tasteProfile.similarArtists || [];

    for (const artist of artistsToLookup) {
      try {
        const similar = await getSimilarArtists(artist, 5);

        for (const similarArtist of similar) {
          try {
            let artistMbid: string | null = null;
            if (similarArtist.mbid) {
              artistMbid = similarArtist.mbid;
            } else {
              const mbArtist = await fetchArtistByName(similarArtist.name);
              if (mbArtist) artistMbid = mbArtist.id;
            }

            if (!artistMbid) continue;

            const releaseGroups = await fetchReleaseGroupsForArtist(
              artistMbid,
              3,
            );

            for (const rg of releaseGroups) {
              try {
                let coverUrl: string | undefined;
                try {
                  coverUrl = await getReleaseGroupCoverArtUrl(rg.id);
                } catch (e) {
                  try {
                    const release = await fetchReleaseForAlbum(
                      similarArtist.name,
                      rg.title,
                    );
                    if (release) {
                      coverUrl = getCoverArtUrl(release.id);
                    }
                  } catch (e2) {}
                }

                matches.push({
                  artist: similarArtist.name,
                  album: rg.title,
                  genre: tasteProfile.genres || [],
                  era: rg["first-release-date"]?.split("-")[0] || "unknown",
                  available: false,
                  musicBrainzId: rg.id,
                  coverArt: coverUrl,
                });

                if (matches.length >= 10) break;
              } catch (e) {}
            }

            if (matches.length >= 10) break;
          } catch (e) {}
        }

        if (matches.length >= 10) break;
      } catch (e) {}
    }

    if (matches.length === 0) {
      const inventoryMatches = inventoryLookupTool(tasteProfile);

      const enrichedMatches = await Promise.all(
        inventoryMatches.map(async (record) => {
          try {
            const release = await fetchReleaseForAlbum(
              record.artist,
              record.album,
            );
            return {
              ...record,
              musicBrainzId: release?.id,
              coverArt: release ? getCoverArtUrl(release.id) : undefined,
              available: true,
            };
          } catch (e) {
            return { ...record, available: true };
          }
        }),
      );
      matches = enrichedMatches;
    }
  } catch (e) {
    const inventoryMatches = inventoryLookupTool(tasteProfile);
    const enrichedMatches = await Promise.all(
      inventoryMatches.map(async (record) => {
        const release = await fetchReleaseForAlbum(record.artist, record.album);
        return {
          ...record,
          musicBrainzId: release?.id,
          coverArt: release ? getCoverArtUrl(release.id) : undefined,
          available: true,
        };
      }),
    );
    matches = enrichedMatches;
  }

  if (matches.length === 0) {
    return normalizeResponse({
      tasteProfile,
      matches: [],
      recommendations:
        "I don't currently have albums in stock that perfectly match this taste, but I can recommend similar artists or explore nearby styles if you want.",
      state: conversationState,
    });
  }

  const recommendations = await recommendationCuratorAgent(matches);

  return normalizeResponse({
    tasteProfile,
    matches,
    recommendations,
    state: conversationState,
  });
};
