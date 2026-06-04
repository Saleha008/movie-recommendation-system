/** Synthetic user profiles built from catalog genre clusters */
export function buildSeedMatrix(
  movies: { id: number; genreIds: number[]; voteAverage: number }[],
): Record<string, Record<number, number>> {
  const byGenre = (ids: number[]) =>
    movies.filter((m) => ids.some((g) => m.genreIds.includes(g)));

  const rate = (list: typeof movies, base: number, spread = 1) => {
    const out: Record<number, number> = {};
    list.slice(0, 12).forEach((m, i) => {
      const bump = (i % 3) * 0.3;
      out[m.id] = Math.min(5, Math.max(1, Math.round(base + spread * bump)));
    });
    return out;
  };

  return {
    "action-fan": rate(byGenre([28, 12, 53]), 4, 0.5),
    "drama-lover": rate(byGenre([18, 10749, 36]), 4.5, 0.3),
    "scifi-nerd": rate(byGenre([878, 14, 9648]), 4.2, 0.4),
    "comedy-buff": rate(byGenre([35, 10751]), 4, 0.6),
    "horror-head": rate(byGenre([27, 53]), 3.8, 0.5),
  };
}
