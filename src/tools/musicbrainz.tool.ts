import axios from "axios";

const BASE_URL = "https://musicbrainz.org/ws/2";

export type ArtistInfo = {
  name: string;
  country?: string;
  disambiguation?: string;
};

export const fetchArtistInfo = async (
  artistName: string,
): Promise<ArtistInfo | null> => {
  const response = await axios.get(`${BASE_URL}/artist`, {
    params: {
      query: `artist:${artistName}`,
      fmt: "json",
      limit: 1,
    },
    headers: {
      "User-Agent": "NeedleDropRecords/1.0 (experimental project)",
    },
  });

  const artist = response.data.artists?.[0];

  if (!artist) return null;

  return {
    name: artist.name,
    country: artist.country,
    disambiguation: artist.disambiguation,
  };
};
