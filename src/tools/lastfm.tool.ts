import axios from "axios";

const LASTFM_BASE_URL = "http://ws.audioscrobbler.com/2.0/";

const getApiKey = () => process.env.LASTFM_APIKEY;

interface LastFmArtist {
  name: string;
  match: string;
  mbid?: string;
  url: string;
  image?: string;
}

interface LastFmTrack {
  name: string;
  artist: string;
  mbid?: string;
  url: string;
  listeners: string;
}

interface LastFmTopAlbum {
  name: string;
  artist: string;
  mbid?: string;
  url: string;
  image?: string;
  playcount: string;
}

export const getSimilarArtists = async (
  artistName: string,
  limit: number = 10,
): Promise<LastFmArtist[]> => {
  try {
    const response = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: "artist.getSimilar",
        artist: artistName,
        api_key: getApiKey(),
        limit,
        format: "json",
      },
      timeout: 5000,
    });

    if (response.data.similarartists?.artist) {
      return response.data.similarartists.artist.map((a: any) => ({
        name: a.name,
        match: parseFloat(a.match) || 0,
        mbid: a.mbid,
        url: a.url,
        image: a.image?.[0]?.["#text"],
      }));
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const getTopTracksByTag = async (
  tag: string,
  limit: number = 50,
): Promise<LastFmTrack[]> => {
  try {
    const response = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: "tag.getTopTracks",
        tag,
        api_key: getApiKey(),
        limit,
        format: "json",
      },
      timeout: 5000,
    });

    if (response.data.tracks?.track) {
      const tracks = Array.isArray(response.data.tracks.track)
        ? response.data.tracks.track
        : [response.data.tracks.track];

      return tracks.map((t: any) => ({
        name: t.name,
        artist: t.artist?.name || "Unknown",
        mbid: t.mbid,
        url: t.url,
        listeners: t.listeners || "0",
      }));
    }
    return [];
  } catch (error) {
    console.error(`Last.fm top tracks lookup failed for tag "${tag}":`, error);
    return [];
  }
};

export const getTopAlbumsByTag = async (
  tag: string,
  limit: number = 50,
): Promise<LastFmTopAlbum[]> => {
  try {
    const response = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: "tag.getTopAlbums",
        tag,
        api_key: getApiKey(),
        limit,
        format: "json",
      },
      timeout: 5000,
    });

    if (response.data.albums?.album) {
      const albums = Array.isArray(response.data.albums.album)
        ? response.data.albums.album
        : [response.data.albums.album];

      return albums.map((a: any) => ({
        name: a.name,
        artist: a.artist?.name || "Unknown",
        mbid: a.mbid,
        url: a.url,
        image: a.image?.[3]?.["#text"],
        playcount: a.playcount || "0",
      }));
    }
    return [];
  } catch (error) {
    console.error(`Last.fm top albums lookup failed for tag "${tag}":`, error);
    return [];
  }
};

export const getArtistInfo = async (artistName: string) => {
  try {
    const response = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: "artist.getInfo",
        artist: artistName,
        api_key: getApiKey(),
        format: "json",
      },
      timeout: 5000,
    });

    if (response.data.artist) {
      const artist = response.data.artist;
      return {
        name: artist.name,
        listeners: artist.listeners,
        playcount: artist.playcount,
        tags: artist.tags?.tag
          ? (Array.isArray(artist.tags.tag)
              ? artist.tags.tag
              : [artist.tags.tag]
            ).map((t: any) => t.name || t)
          : [],
        bio: artist.bio?.summary || "",
        mbid: artist.mbid,
        url: artist.url,
      };
    }
    return null;
  } catch (error) {
    console.error(
      `Last.fm artist info lookup failed for "${artistName}":`,
      error,
    );
    return null;
  }
};

export const getTopArtistsByTag = async (
  tag: string,
  limit: number = 50,
): Promise<LastFmArtist[]> => {
  try {
    const response = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: "tag.getTopArtists",
        tag,
        api_key: getApiKey(),
        limit,
        format: "json",
      },
      timeout: 5000,
    });

    if (response.data.artists?.artist) {
      const artists = Array.isArray(response.data.artists.artist)
        ? response.data.artists.artist
        : [response.data.artists.artist];

      return artists.map((a: any) => ({
        name: a.name,
        match: "1", // Tag lookup doesn't have match percentage
        mbid: a.mbid,
        url: a.url,
        image: a.image?.[3]?.["#text"],
      }));
    }
    return [];
  } catch (error) {
    console.error(`Last.fm top artists lookup failed for tag "${tag}":`, error);
    return [];
  }
};
