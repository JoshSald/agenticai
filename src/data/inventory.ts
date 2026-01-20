export type Record = {
  artist: string;
  album: string;
  genre: string[];
  era: string;
};

export const inventory: Record[] = [
  {
    artist: "Radiohead",
    album: "Kid A",
    genre: ["Alternative Rock", "Experimental"],
    era: "2000s",
  },
  {
    artist: "Pink Floyd",
    album: "Dark Side of the Moon",
    genre: ["Progressive Rock", "Psychedelic"],
    era: "1970s",
  },
  {
    artist: "Portishead",
    album: "Dummy",
    genre: ["Trip Hop", "Electronic"],
    era: "1990s",
  },
  {
    artist: "Tame Impala",
    album: "Lonerism",
    genre: ["Psychedelic Rock", "Indie"],
    era: "2010s",
  },
  {
    artist: "Steven Wilson",
    album: "To the Bone",
    genre: ["Psychedelic Rock", "Progressive Rock"],
    era: "2020s",
  },
];
