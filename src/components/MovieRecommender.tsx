"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Genre, Movie, Recommendation, UserRating } from "@/lib/types";
import { GenrePicker } from "./GenrePicker";
import { MovieCard } from "./MovieCard";
import { RecommendationsBlock } from "./RecommendationPanel";

const RATINGS_KEY = "movie-rec-ratings";
const GENRES_KEY = "movie-rec-genres";

function loadRatings(): UserRating[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    return raw ? (JSON.parse(raw) as UserRating[]) : [];
  } catch {
    return [];
  }
}

function loadGenres(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GENRES_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function saveRatings(ratings: UserRating[]) {
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
}

function saveGenres(genreIds: number[]) {
  localStorage.setItem(GENRES_KEY, JSON.stringify(genreIds));
}

export function MovieRecommender() {
  const [phase, setPhase] = useState<"loading" | "pick-genres" | "main">(
    "loading",
  );
  const [favoriteGenres, setFavoriteGenres] = useState<number[]>([]);
  const [pickerSelection, setPickerSelection] = useState<number[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [contentRecs, setContentRecs] = useState<Recommendation[]>([]);
  const [collabRecs, setCollabRecs] = useState<Recommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  const ratingMap = useMemo(
    () => Object.fromEntries(ratings.map((r) => [r.movieId, r.rating])),
    [ratings],
  );

  const loadCatalog = useCallback(async (genreIds: number[]) => {
    setLoadingMovies(true);
    const q = genreIds.length > 0 ? `?genres=${genreIds.join(",")}` : "";
    const res = await fetch(`/api/movies${q}`);
    const data = await res.json();
    setMovies(data.movies ?? []);
    setLoadingMovies(false);
  }, []);

  const fetchRecommendations = useCallback(
    async (catalog: Movie[], userRatings: UserRating[], genreIds: number[]) => {
      if (catalog.length === 0) return;
      setRecsLoading(true);
      try {
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ratings: userRatings,
            catalog,
            genreIds,
          }),
        });
        const data = await res.json();
        setContentRecs(data.content ?? []);
        setCollabRecs(data.collaborative ?? []);
      } catch {
        setContentRecs([]);
        setCollabRecs([]);
      } finally {
        setRecsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const savedGenres = loadGenres();
    setRatings(loadRatings());
    fetch("/api/genres")
      .then((r) => r.json())
      .then((d) => setAllGenres(d.genres ?? []));

    if (savedGenres.length >= 2) {
      setFavoriteGenres(savedGenres);
      setPhase("main");
      loadCatalog(savedGenres);
    } else {
      setPhase("pick-genres");
    }
  }, [loadCatalog]);

  useEffect(() => {
    if (phase !== "main" || movies.length === 0) return;
    const t = setTimeout(() => {
      fetchRecommendations(movies, ratings, favoriteGenres);
    }, 300);
    return () => clearTimeout(t);
  }, [phase, movies, ratings, favoriteGenres, fetchRecommendations]);

  const handleContinueFromPicker = () => {
    saveGenres(pickerSelection);
    setFavoriteGenres(pickerSelection);
    setPhase("main");
    loadCatalog(pickerSelection);
  };

  const handleChangeGenres = () => {
    setPickerSelection(favoriteGenres);
    setPhase("pick-genres");
  };

  const handleRate = (movieId: number, rating: number) => {
    setRatings((prev) => {
      const next =
        rating === 0
          ? prev.filter((r) => r.movieId !== movieId)
          : [
              ...prev.filter((r) => r.movieId !== movieId),
              { movieId, rating },
            ];
      saveRatings(next);
      return next;
    });
  };

  const togglePickerGenre = (id: number) => {
    setPickerSelection((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const ratedCount = ratings.length;
  const genreNames = allGenres
    .filter((g) => favoriteGenres.includes(g.id))
    .map((g) => g.name);

  if (phase === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  if (phase === "pick-genres") {
    return (
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-12 sm:px-6">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            CineMatch
          </h1>
        </header>
        <GenrePicker
          genres={allGenres}
          selected={pickerSelection}
          onToggle={togglePickerGenre}
          onContinue={handleContinueFromPicker}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          CineMatch
        </h1>
        {genreNames.length > 0 && (
          <p className="mt-2 text-sm text-zinc-400">
            Showing{" "}
            <span className="text-zinc-200">
              {genreNames.slice(0, 3).join(", ")}
              {genreNames.length > 3 ? "…" : ""}
            </span>
            <button
              type="button"
              onClick={handleChangeGenres}
              className="ml-2 text-amber-500/90 underline-offset-2 hover:underline"
            >
              Change
            </button>
          </p>
        )}
        <p className="mt-1 text-xs text-zinc-500">
          Step 2 · {ratedCount} rated · recommendations from API
        </p>
      </header>

      <div className="space-y-12">
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-100">
              Rate what you&apos;ve seen
            </h2>
            <span className="text-xs text-zinc-500">Scroll →</span>
          </div>
          {loadingMovies ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Loading movies…
            </p>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 [scrollbar-width:thin]">
              <div className="flex snap-x snap-mandatory gap-3">
                {movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="w-32 shrink-0 snap-start sm:w-36"
                  >
                    <MovieCard
                      movie={movie}
                      userRating={ratingMap[movie.id] ?? 0}
                      onRate={handleRate}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <RecommendationsBlock
          content={contentRecs}
          collaborative={collabRecs}
          ratings={ratingMap}
          onRate={handleRate}
          ratedCount={ratedCount}
          loading={recsLoading}
        />
      </div>
    </div>
  );
}
