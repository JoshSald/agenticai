export type AlbumMatch = {
  artist: string;
  album: string;
  genre: string[];
  era: string;
  coverArt?: string;
};

export type ConversationState = {
  likedArtists: string[];
  confirmedGenres: string[];
  excludedGenres: string[];
  awaitingClarification: boolean;
  lastClarification?: string;
  activeArtist?: string;
};

export type AgentResponse = {
  tasteProfile: {
    genres: string[];
    era?: string;
    similarArtists?: string[];
  };
  matches: AlbumMatch[];
  recommendations: string;
  state?: ConversationState;
};
