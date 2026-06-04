import { NextRequest, NextResponse } from "next/server";
import { MOCK_MOVIES } from "@/lib/mock-movies";
import {
  fetchCatalogForGenres,
  fetchPopularMovies,
  isTmdbConfigured,
} from "@/lib/tmdb";

function parseGenreIds(param: string | null): number[] {
  if (!param) return [];
  return param
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0);
}

function mockCatalogForGenres(genreIds: number[]) {
  if (genreIds.length === 0) return MOCK_MOVIES;
  const matched = MOCK_MOVIES.filter((m) =>
    genreIds.some((g) => m.genreIds.includes(g)),
  );
  const popular = MOCK_MOVIES.slice(0, 6);
  const seen = new Set<number>();
  return [...matched, ...popular].filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

export async function GET(request: NextRequest) {
  const genresParam = request.nextUrl.searchParams.get("genres");
  const genreIds = parseGenreIds(genresParam);

  try {
    if (!isTmdbConfigured()) {
      const movies = mockCatalogForGenres(genreIds);
      return NextResponse.json({
        movies,
        source: "mock",
        message: "Add TMDB_API_KEY or TMDB_ACCESS_TOKEN to .env.local for live data",
      });
    }

    const movies =
      genreIds.length > 0
        ? await fetchCatalogForGenres(genreIds)
        : await fetchPopularMovies(3);

    return NextResponse.json({ movies, source: "tmdb" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch movies";
    return NextResponse.json(
      { movies: MOCK_MOVIES, source: "mock", error: message },
      { status: 200 },
    );
  }
}
