import axios from "axios";

const BASE_URL = "https://musicbrainz.org/ws/2";

export type ReleaseInfo = {
  id: string;
  title: string;
};

export type ArtistInfo = {
  id: string;
  name: string;
};

export type ReleaseGroup = {
  id: string;
  title: string;
  "artist-credit"?: Array<{ name: string }>;
  "first-release-date"?: string;
};

export const fetchReleaseForAlbum = async (
  artist: string,
  album: string,
): Promise<ReleaseInfo | null> => {
  try {
    const escapeQuery = (str: string) =>
      str.replace(/([+\-&|!(){}[\]^"~*?:\\])/g, "\\$1");
    const response = await axios.get(`${BASE_URL}/release`, {
      params: {
        query: `artist:${escapeQuery(artist)} AND release:${escapeQuery(album)} AND status:official`,
        fmt: "json",
        limit: 5,
      },
      headers: {
        "User-Agent": "NeedleDropRecords/1.0 (experimental project)",
      },
      timeout: 5000,
    });

    const releases = response.data.releases ?? [];
    if (!releases.length) return null;

    const withArt = releases.find((r: any) => r["cover-art-archive"]?.front);
    const release = withArt ?? releases[0];

    return {
      id: release.id,
      title: release.title,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(
      `MusicBrainz lookup failed for ${artist} - ${album}:`,
      message,
    );
    return null;
  }
};

export const fetchArtistByName = async (
  name: string,
): Promise<ArtistInfo | null> => {
  try {
    const escapeQuery = (str: string) =>
      str.replace(/([+\-&|!(){}\[^]"~*?:\\])/g, "\\$1");
    const response = await axios.get(`${BASE_URL}/artist`, {
      params: {
        query: `artist:${escapeQuery(name)}`,
        fmt: "json",
        limit: 5,
      },
      headers: { "User-Agent": "NeedleDropRecords/1.0 (experimental project)" },
      timeout: 5000,
    });
    const artists = response.data.artists ?? [];
    if (!artists.length) return null;

    const exact = artists.find(
      (a: any) => (a.name || "").toLowerCase() === name.toLowerCase(),
    );
    const sorted = [...artists].sort(
      (a: any, b: any) => (b.score ?? 0) - (a.score ?? 0),
    );
    const best = exact ?? sorted[0];
    return { id: best.id, name: best.name };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(`MusicBrainz artist lookup failed for ${name}:`, message);
    return null;
  }
};

export const fetchReleaseGroupsForArtist = async (
  artistId: string,
  limit = 5,
): Promise<ReleaseGroup[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/release-group`, {
      params: {
        artist: artistId,
        type: "album",
        fmt: "json",
        limit,
      },
      headers: { "User-Agent": "NeedleDropRecords/1.0 (experimental project)" },
      timeout: 5000,
    });
    return response.data["release-groups"] ?? [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(
      `MusicBrainz release-group lookup failed for artist ${artistId}:`,
      message,
    );
    return [];
  }
};

export const fetchTopReleaseGroupsByTag = async (
  tag: string,
  limit = 5,
): Promise<ReleaseGroup[]> => {
  try {
    const escapeQuery = (str: string) =>
      str.replace(/([+\-&|!(){}\[^]"~*?:\\])/g, "\\$1");
    const response = await axios.get(`${BASE_URL}/release-group`, {
      params: {
        query: `tag:${escapeQuery(tag)} AND type:album`,
        fmt: "json",
        limit,
      },
      headers: { "User-Agent": "NeedleDropRecords/1.0 (experimental project)" },
      timeout: 5000,
    });
    return response.data["release-groups"] ?? [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(
      `MusicBrainz release-group lookup failed for tag ${tag}:`,
      message,
    );
    return [];
  }
};

export const fetchReleaseByTitle = async (
  title: string,
  limit = 5,
): Promise<ReleaseGroup[]> => {
  try {
    const escapeQuery = (str: string) =>
      str.replace(/([+\-&|!(){}\[^]"~*?:\\])/g, "\\$1");
    const response = await axios.get(`${BASE_URL}/release-group`, {
      params: {
        query: `release:${escapeQuery(title)} AND type:album`,
        fmt: "json",
        limit,
      },
      headers: { "User-Agent": "NeedleDropRecords/1.0 (experimental project)" },
      timeout: 5000,
    });
    const results = response.data["release-groups"] ?? [];
    return results.map((rg: any) => ({
      ...rg,
      genres: rg.tags?.map((t: any) => t.name) ?? [],
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(`MusicBrainz release search failed for "${title}":`, message);
    return [];
  }
};
