import { NextResponse } from "next/server";
import { MOCK_GENRES } from "@/lib/mock-movies";
import { fetchGenres, isTmdbConfigured } from "@/lib/tmdb";

export async function GET() {
  try {
    if (!isTmdbConfigured()) {
      return NextResponse.json({ genres: MOCK_GENRES, source: "mock" });
    }
    const genres = await fetchGenres();
    return NextResponse.json({ genres, source: "tmdb" });
  } catch {
    return NextResponse.json({ genres: MOCK_GENRES, source: "mock" });
  }
}
