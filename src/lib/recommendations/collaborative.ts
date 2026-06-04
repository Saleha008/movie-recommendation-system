import type { Movie, Recommendation, UserRating } from "../types";
import { buildSeedMatrix } from "../seed-users";

function pearson(
  a: Record<number, number>,
  b: Record<number, number>,
): number {
  const common: number[] = [];
  for (const id of Object.keys(a)) {
    const mid = Number(id);
    if (b[mid] !== undefined) common.push(mid);
  }
  if (common.length < 2) return 0;

  const ratingsA = common.map((id) => a[id]);
  const ratingsB = common.map((id) => b[id]);
  const meanA = ratingsA.reduce((s, v) => s + v, 0) / ratingsA.length;
  const meanB = ratingsB.reduce((s, v) => s + v, 0) / ratingsB.length;

  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < common.length; i++) {
    const da = ratingsA[i] - meanA;
    const db = ratingsB[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA) * Math.sqrt(denB);
  return den === 0 ? 0 : num / den;
}

function userVector(
  ratings: UserRating[] | Record<number, number>,
): Record<number, number> {
  if (Array.isArray(ratings)) {
    return Object.fromEntries(ratings.map((r) => [r.movieId, r.rating]));
  }
  return ratings;
}

export function collaborativeRecommendations(
  catalog: Movie[],
  userRatings: UserRating[],
  limit = 12,
): Recommendation[] {
  if (userRatings.length < 2) return [];

  const current = userVector(userRatings);
  const ratedIds = new Set(Object.keys(current).map(Number));
  const seedMatrix = buildSeedMatrix(catalog);

  const neighbors: { name: string; sim: number; ratings: Record<number, number> }[] =
    [];

  for (const [name, ratings] of Object.entries(seedMatrix)) {
    const sim = pearson(current, ratings);
    if (sim > 0) neighbors.push({ name, sim, ratings });
  }

  neighbors.sort((a, b) => b.sim - a.sim);
  const topNeighbors = neighbors.slice(0, 3);

  if (topNeighbors.length === 0) return [];

  const predictions: { movieId: number; predicted: number; reason: string }[] =
    [];

  for (const movie of catalog) {
    if (ratedIds.has(movie.id)) continue;

    let weightedSum = 0;
    let simSum = 0;
    const fans: string[] = [];

    for (const { name, sim, ratings } of topNeighbors) {
      const r = ratings[movie.id];
      if (r !== undefined) {
        weightedSum += sim * r;
        simSum += sim;
        fans.push(name.replace("-", " "));
      }
    }

    if (simSum === 0) continue;
    const predicted = weightedSum / simSum;
    predictions.push({
      movieId: movie.id,
      predicted,
      reason:
        fans.length > 0
          ? `Liked by users with similar taste (${fans.slice(0, 2).join(", ")})`
          : "Predicted from similar viewers",
    });
  }

  const movieMap = new Map(catalog.map((m) => [m.id, m]));

  return predictions
    .sort((a, b) => b.predicted - a.predicted)
    .slice(0, limit)
    .map((p) => ({
      movie: movieMap.get(p.movieId)!,
      score: p.predicted / 5,
      reason: `${p.reason} · est. ${p.predicted.toFixed(1)}/5`,
    }))
    .filter((r) => r.movie);
}
