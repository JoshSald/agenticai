export function inferPrimaryGenre(genres: string[]): string {
  const lowered = genres.map((g) => g.toLowerCase());

  if (lowered.includes("post-rock")) return "post-rock";

  if (
    lowered.includes("progressive rock") ||
    lowered.includes("art rock") ||
    lowered.includes("psychedelic rock") ||
    lowered.includes("alternative rock")
  ) {
    return "rock";
  }

  if (
    lowered.includes("electronic") ||
    lowered.includes("idm") ||
    lowered.includes("trip hop") ||
    lowered.includes("synth pop") ||
    lowered.includes("synth-pop") ||
    lowered.includes("electronic pop") ||
    lowered.includes("house")
  ) {
    return "electronic";
  }

  if (
    lowered.includes("metal") ||
    lowered.includes("thrash metal") ||
    lowered.includes("power metal") ||
    lowered.includes("progressive metal") ||
    lowered.includes("death metal")
  ) {
    return "metal";
  }

  if (lowered.length === 1 && lowered[0] === "ambient") {
    return "ambient";
  }

  return lowered[0];
}
