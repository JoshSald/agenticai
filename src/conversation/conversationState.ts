export type ConversationState = {
  likedArtists: string[];
  confirmedGenres: string[];
  excludedGenres: string[];
  awaitingClarification: boolean;
  lastClarification?: string;
  activeArtist?: string;
  recommendedAlbums?: string[]; // Track previously recommended albums to avoid repetition
};
export const createInitialConversationState = (): ConversationState => ({
  likedArtists: [],
  confirmedGenres: [],
  excludedGenres: [],
  awaitingClarification: false,
  recommendedAlbums: [],
});
