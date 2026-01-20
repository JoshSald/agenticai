import { tasteAnalyzerAgent } from "./tasteAnalyzer.agent";
import { inventoryLookupTool } from "../tools/inventory.tool";
import { fetchReleaseForAlbum } from "../tools/musicbrainz.tool";
import { getCoverArtUrl } from "../tools/coverart.tool";
import { recommendationCuratorAgent } from "./recommendationCurator.agent";
import { refinerAgent } from "./refiner.agent";
import {
  ConversationState,
  createInitialConversationState,
} from "../conversation/conversationState";
import { handleClarification } from "./handleClarification";
import { hasEnoughTasteSignal } from "../conversation/hasEnoughTastesSignal";
import { normalizeResponse } from "../helpers/normalizeResponse";

export const orchestratorAgent = async (
  prompt: string,
  state?: ConversationState,
) => {
  const conversationState = state ?? createInitialConversationState();

  // 1️⃣ Handle clarification replies FIRST
  if (conversationState.awaitingClarification) {
    const clarificationResult = handleClarification(prompt, conversationState);

    if (!hasEnoughTasteSignal(conversationState)) {
      return normalizeResponse(clarificationResult);
    }
  }

  // 2️⃣ Run refiner ONLY if taste is not known yet
  let refined: Awaited<ReturnType<typeof refinerAgent>> | null = null;

  if (!hasEnoughTasteSignal(conversationState)) {
    refined = await refinerAgent(prompt);
    refined.needsClarification ??= false;
  }

  // 3️⃣ Guardrails + SAFE RESPONSES
  if (
    refined &&
    (refined.intent === "adult_off_topic" || refined.intent === "off_topic")
  ) {
    return normalizeResponse({
      tasteProfile: null,
      matches: [],
      recommendations:
        refined.safeResponse ??
        "Let’s keep things musical. Tell me about an artist or album you love.",
      state: conversationState,
    });
  }

  if (refined && refined.intent === "pricing") {
    return normalizeResponse({
      tasteProfile: null,
      matches: [],
      recommendations:
        "I can’t help with pricing, but I’d love to help you discover music you’ll enjoy.",
      state: conversationState,
    });
  }

  // 🔴 CRITICAL FIX: if refiner already answered, STOP HERE
  if (refined && refined.safeResponse) {
    return normalizeResponse({
      tasteProfile: null,
      matches: [],
      recommendations: refined.safeResponse,
      state: conversationState,
    });
  }

  // 4️⃣ Ask clarification only if still required
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

  // 5️⃣ Taste-based flow (SAFE now)
  const tasteProfile = await tasteAnalyzerAgent(prompt, conversationState);

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
  if (enrichedMatches.length === 0) {
    return normalizeResponse({
      tasteProfile,
      matches: [],
      recommendations:
        "I don’t currently have albums in stock that perfectly match this taste, but I can recommend similar artists or explore nearby styles if you want.",
      state: conversationState,
    });
  }
  const recommendations = await recommendationCuratorAgent(enrichedMatches);

  // 6️⃣ Final response
  return normalizeResponse({
    tasteProfile,
    matches: enrichedMatches,
    recommendations,
    state: conversationState,
  });
};
