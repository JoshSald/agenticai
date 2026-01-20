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
      "Tell me about an artist or album you love.",
    state: input.state,
  };
}
