import { ConversationState } from "../conversation/conversationState";

export function handleClarification(
  userReply: string,
  state: ConversationState,
) {
  const reply = userReply.toLowerCase();

  // Clear clarification state by default
  state.awaitingClarification = false;
  state.lastClarification = undefined;

  // Very common clarifications
  if (
    reply.includes("sigur") ||
    reply.includes("post rock") ||
    reply.includes("post-rock")
  ) {
    state.confirmedGenres.push("post-rock");
    state.likedArtists.push("Sigur Rós");
  }

  if (reply.includes("not electronic") || reply.includes("no electronic")) {
    state.excludedGenres.push("electronic");
  }

  // If they said something vague like "just them"
  if (reply.length < 12) {
    state.awaitingClarification = true;
    state.lastClarification =
      "Got it. What is it about Sigur Rós you love most? Atmosphere, guitars, vocals, or long builds?";
  }

  return {
    tasteProfile: null,
    matches: [],
    recommendations:
      state.lastClarification ??
      "Nice, that helps. Let me find some artists that really live in that same space.",
    state,
  };
}
