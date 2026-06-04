import { NextRequest, NextResponse } from "next/server";
import {
  collaborativeRecommendations,
  contentBasedRecommendations,
} from "@/lib/recommendations";
import { MOCK_MOVIES } from "@/lib/mock-movies";
import type { Movie, UserRating } from "@/lib/types";
import { fetchCatalogForGenres, isTmdbConfigured } from "@/lib/tmdb";

function mockCatalogForGenres(genreIds: number[]): Movie[] {
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

async function resolveCatalog(
  catalog?: Movie[],
  genreIds?: number[],
): Promise<Movie[]> {
  if (catalog && catalog.length > 0) return catalog;
  if (!isTmdbConfigured()) return mockCatalogForGenres(genreIds ?? []);
  try {
    return genreIds && genreIds.length > 0
      ? await fetchCatalogForGenres(genreIds)
      : mockCatalogForGenres([]);
  } catch {
    return mockCatalogForGenres(genreIds ?? []);
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    ratings?: UserRating[];
    mode?: "content" | "collaborative" | "both";
    genreIds?: number[];
    catalog?: Movie[];
  };

  const ratings = body.ratings ?? [];
  const catalog = await resolveCatalog(body.catalog, body.genreIds);

  const content = contentBasedRecommendations(catalog, ratings);
  const collaborative = collaborativeRecommendations(catalog, ratings);

  if (body.mode === "content") {
    return NextResponse.json({
      recommendations: content,
      mode: "content",
      algorithm: "content-based",
    });
  }
  if (body.mode === "collaborative") {
    return NextResponse.json({
      recommendations: collaborative,
      mode: "collaborative",
      algorithm: "collaborative",
    });
  }

  return NextResponse.json({
    content,
    collaborative,
    meta: {
      contentAlgorithm:
        "Cosine similarity on genre vectors + TMDB vote average",
      collaborativeAlgorithm:
        "Pearson correlation with similar viewer profiles",
      catalogSize: catalog.length,
      ratedCount: ratings.length,
    },
  });
}
