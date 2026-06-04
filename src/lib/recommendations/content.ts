import type { Movie, Recommendation, UserRating } from "../types";

/** Genre IDs present in catalog → index for feature vector */
function buildGenreIndex(movies: Movie[]): Map<number, number> {
  const ids = new Set<number>();
  for (const m of movies) {
    for (const g of m.genreIds) ids.add(g);
  }
  const sorted = [...ids].sort((a, b) => a - b);
  return new Map(sorted.map((id, i) => [id, i]));
}

/** [genre one-hot..., normalized vote_average] */
function movieVector(
  movie: Movie,
  genreIndex: Map<number, number>,
  dim: number,
): number[] {
  const vec = new Array(dim + 1).fill(0);
  for (const g of movie.genreIds) {
    const idx = genreIndex.get(g);
    if (idx !== undefined) vec[idx] = 1;
  }
  vec[dim] = movie.voteAverage / 10;
  return vec;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function addWeighted(
  acc: number[],
  vec: number[],
  weight: number,
): void {
  for (let i = 0; i < acc.length; i++) {
    acc[i] += vec[i] * weight;
  }
}

export function contentBasedRecommendations(
  catalog: Movie[],
  userRatings: UserRating[],
  limit = 12,
): Recommendation[] {
  if (userRatings.length === 0) return [];

  const ratedIds = new Set(userRatings.map((r) => r.movieId));
  const ratingMap = new Map(userRatings.map((r) => [r.movieId, r.rating]));
  const genreIndex = buildGenreIndex(catalog);
  const dim = genreIndex.size;

  const profile = new Array(dim + 1).fill(0);
  let totalWeight = 0;

  for (const movie of catalog) {
    const rating = ratingMap.get(movie.id);
    if (rating === undefined) continue;
    const vec = movieVector(movie, genreIndex, dim);
    addWeighted(profile, vec, rating);
    totalWeight += rating;
  }

  if (totalWeight > 0) {
    for (let i = 0; i < profile.length; i++) profile[i] /= totalWeight;
  }

  const candidates = catalog
    .filter((m) => !ratedIds.has(m.id))
    .map((movie) => {
      const vec = movieVector(movie, genreIndex, dim);
      const score = cosine(profile, vec);
      const genreOverlap = movie.genreIds.filter((g) =>
        catalog
          .filter((c) => ratingMap.has(c.id))
          .some((c) => c.genreIds.includes(g)),
      ).length;
      return {
        movie,
        score,
        reason:
          genreOverlap > 0
            ? `Matches your genre & rating taste (${(score * 100).toFixed(0)}% similar)`
            : `Similar rating profile (${(score * 100).toFixed(0)}% match)`,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return candidates;
}
