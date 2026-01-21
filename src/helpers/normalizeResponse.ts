type NormalizeInput = {
  tasteProfile?: any;
  matches?: any[];
  recommendations?: string;
  safeResponse?: string;
  state?: any;
};

export function normalizeResponse(input: NormalizeInput) {
  return {
    tasteProfile: input.tasteProfile ?? null,
    matches: input.matches ?? [],
    recommendations:
      input.recommendations ??
      input.safeResponse ??
      "Tell me about an artist or record you're into right now and I'll line up something you'll vibe with.",
    state: input.state,
  };
}
