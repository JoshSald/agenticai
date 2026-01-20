import axios from "axios";

const BASE_URL = "https://musicbrainz.org/ws/2";

export type ReleaseInfo = {
  id: string;
  title: string;
};

export const fetchReleaseForAlbum = async (
  artist: string,
  album: string,
): Promise<ReleaseInfo | null> => {
  const response = await axios.get(`${BASE_URL}/release`, {
    params: {
      query: `artist:${artist} AND release:${album}`,
      fmt: "json",
      limit: 1,
    },
    headers: {
      "User-Agent": "NeedleDropRecords/1.0 (experimental project)",
    },
  });

  const release = response.data.releases?.[0];
  if (!release) return null;

  return {
    id: release.id,
    title: release.title,
  };
};
