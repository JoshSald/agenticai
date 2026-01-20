export function inferPrimaryGenre(genres: string[]): string {
  const lowered = genres.map((g) => g.toLowerCase());

  // Explicit high-level buckets only
  if (lowered.includes("post-rock")) return "post-rock";

  if (
    lowered.includes("progressive rock") ||
    lowered.includes("art rock") ||
    lowered.includes("psychedelic rock") ||
    lowered.includes("alternative rock")
  ) {
    return "rock";
  }

  // Electronic is electronic, period
  if (
    lowered.includes("electronic") ||
    lowered.includes("idm") ||
    lowered.includes("trip hop") ||
    lowered.includes("synth pop") ||
    lowered.includes("house")
  ) {
    return "electronic";
  }

  // Ambient-only records (rare in your inventory)
  if (lowered.length === 1 && lowered[0] === "ambient") {
    return "ambient";
  }

  // Safe fallback
  return lowered[0];
}
