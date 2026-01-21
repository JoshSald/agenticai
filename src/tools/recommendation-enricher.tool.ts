import {
  getSimilarArtists,
  getTopAlbumsByTag,
  getTopArtistsByTag,
} from "./lastfm.tool";
import {
  fetchArtistByName,
  fetchReleaseGroupsForArtist,
} from "./musicbrainz.tool";
import { Record } from "../data/inventory";

export const enrichRecommendationsWithLastFm = async (
  likedArtists: string[],
  genres: string[],
  limit: number = 15,
  focusArtist?: string,
): Promise<Record[]> => {
  const enrichedAlbums: Record[] = [];
  const seen = new Set<string>();

  const getEraFromDate = (dateStr?: string): string => {
    if (!dateStr) return "unknown";
    const year = dateStr.split("-")[0];
    return isNaN(parseInt(year)) ? "unknown" : year;
  };

  if (likedArtists.length > 0) {
    const sourceArtists = focusArtist
      ? [
          focusArtist,
          ...likedArtists.filter(
            (a) => a.toLowerCase() !== focusArtist.toLowerCase(),
          ),
        ]
      : likedArtists;

    for (const artist of sourceArtists) {
      if (enrichedAlbums.length >= limit) break;
      const similar = await getSimilarArtists(artist, 6);
      for (const similarArtist of similar.slice(0, 4)) {
        if (enrichedAlbums.length >= limit) break;
        const mbArtist = await fetchArtistByName(similarArtist.name);
        if (!mbArtist) continue;
        const rgs = await fetchReleaseGroupsForArtist(mbArtist.id, 3);
        for (const rg of rgs) {
          const key = `${similarArtist.name}::${rg.title}`.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          enrichedAlbums.push({
            artist: similarArtist.name,
            album: rg.title,
            genre: genres.length ? genres : [],
            era: getEraFromDate(rg["first-release-date"]),
          });
          if (enrichedAlbums.length >= limit) break;
        }
      }
    }
  }

  return enrichedAlbums.slice(0, limit);
};

export const getGenreTopArtists = async (genre: string, limit: number = 10) => {
  return await getTopArtistsByTag(genre, limit);
};
