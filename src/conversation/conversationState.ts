export type ConversationState = {
  likedArtists: string[];
  confirmedGenres: string[];
  excludedGenres: string[];
  awaitingClarification: boolean;
  lastClarification?: string;
};
export const createInitialConversationState = (): ConversationState => ({
  likedArtists: [],
  confirmedGenres: [],
  excludedGenres: [],
  awaitingClarification: false,
});
