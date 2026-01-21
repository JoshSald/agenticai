export const getCoverArtUrl = (releaseId: string): string => {
  return `https://coverartarchive.org/release/${releaseId}/front`;
};

export const getReleaseGroupCoverArtUrl = (releaseGroupId: string): string => {
  return `https://coverartarchive.org/release-group/${releaseGroupId}/front`;
};
