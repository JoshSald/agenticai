import { ConversationState } from "./conversationState";

export function hasEnoughTasteSignal(state: ConversationState): boolean {
  if (state.likedArtists.length > 0) return true;
  if (state.confirmedGenres.length > 0) return true;

  return false;
}
