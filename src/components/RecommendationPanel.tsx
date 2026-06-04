"use client";

import type { Recommendation } from "@/lib/types";
import { MovieCard } from "./MovieCard";

type FilterKind = "content" | "collaborative";

const CONFIG: Record<
  FilterKind,
  {
    title: string;
    tag: string;
    description: string;
    howItWorks: string;
    emptyNeed: string;
    accent: string;
    ring: string;
    badgeBg: string;
  }
> = {
  content: {
    title: "Content-based",
    tag: "Genre + rating profile",
    description:
      "Finds movies similar to what you liked — same genres and comparable TMDB scores.",
    howItWorks: "Cosine similarity on genre features & vote average",
    emptyNeed: "Rate at least 1 movie above to build your taste vector.",
    accent: "text-cyan-400",
    ring: "ring-cyan-500/30",
    badgeBg: "bg-cyan-500/20 text-cyan-300",
  },
  collaborative: {
    title: "Collaborative",
    tag: "Viewers like you",
    description:
      "Finds movies that similar users loved — based on rating patterns, not genres alone.",
    howItWorks: "Pearson correlation → weighted rating prediction",
    emptyNeed: "Rate at least 2 movies so we can match you to similar viewers.",
    accent: "text-violet-400",
    ring: "ring-violet-500/30",
    badgeBg: "bg-violet-500/20 text-violet-300",
  },
};

type SectionProps = {
  kind: FilterKind;
  items: Recommendation[];
  ratings: Record<number, number>;
  onRate: (movieId: number, rating: number) => void;
  ratedCount: number;
  loading?: boolean;
  horizontal?: boolean;
};

function RecommendationCards({
  kind,
  items,
  ratings,
  onRate,
  horizontal,
}: {
  kind: FilterKind;
  items: Recommendation[];
  ratings: Record<number, number>;
  onRate: (movieId: number, rating: number) => void;
  horizontal?: boolean;
}) {
  const card = (rec: Recommendation) => (
    <>
      <MovieCard
        movie={rec.movie}
        userRating={ratings[rec.movie.id] ?? 0}
        onRate={onRate}
        badge={kind === "content" ? "CBF" : "CF"}
        compact
      />
      <p className="mt-1 line-clamp-2 text-[10px] text-zinc-500">{rec.reason}</p>
      <p className="text-[10px] text-zinc-600">
        {kind === "content"
          ? `${(rec.score * 100).toFixed(0)}% taste match`
          : `${(rec.score * 5).toFixed(1)}/5 predicted`}
      </p>
    </>
  );

  if (horizontal) {
    return (
      <div className="-mx-5 overflow-x-auto px-5 pb-1 [scrollbar-width:thin]">
        <div className="flex snap-x snap-mandatory gap-3">
          {items.map((rec) => (
            <div
              key={`${kind}-${rec.movie.id}`}
              className="w-32 shrink-0 snap-start sm:w-36"
            >
              {card(rec)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((rec) => (
        <div key={`${kind}-${rec.movie.id}`}>{card(rec)}</div>
      ))}
    </div>
  );
}

export function FilterRecommendationSection({
  kind,
  items,
  ratings,
  onRate,
  ratedCount,
  loading,
  horizontal,
}: SectionProps) {
  const c = CONFIG[kind];
  const minRatings = kind === "collaborative" ? 2 : 1;
  const unlocked = ratedCount >= minRatings;

  return (
    <section
      className={`rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 ring-1 ${c.ring}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={`text-lg font-semibold ${c.accent}`}>{c.title}</h2>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${c.badgeBg}`}
            >
              {c.tag}
            </span>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
              via /api/recommend
            </span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">{c.description}</p>
          <p className="mt-1 font-mono text-[11px] text-zinc-600">{c.howItWorks}</p>
        </div>
        {horizontal && items.length > 0 && (
          <span className="shrink-0 text-xs text-zinc-500">Scroll →</span>
        )}
      </div>

      <div className="mt-4">
        {loading && (
          <p className="py-6 text-center text-sm text-zinc-500">Computing…</p>
        )}
        {!loading && !unlocked && (
          <p className="rounded-lg border border-dashed border-zinc-700 py-6 text-center text-sm text-zinc-500">
            {c.emptyNeed}
          </p>
        )}
        {!loading && unlocked && items.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-700 py-6 text-center text-sm text-zinc-500">
            No new picks in this list — rate more movies or change your genres.
          </p>
        )}
        {!loading && unlocked && items.length > 0 && (
          <RecommendationCards
            kind={kind}
            items={items}
            ratings={ratings}
            onRate={onRate}
            horizontal={horizontal}
          />
        )}
      </div>
    </section>
  );
}

type RecommendationsBlockProps = {
  content: Recommendation[];
  collaborative: Recommendation[];
  ratings: Record<number, number>;
  onRate: (movieId: number, rating: number) => void;
  ratedCount: number;
  loading: boolean;
};

export function RecommendationsBlock({
  content,
  collaborative,
  ratings,
  onRate,
  ratedCount,
  loading,
}: RecommendationsBlockProps) {
  if (ratedCount === 0 && !loading) {
    return (
      <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Recommendations</h2>
        <p className="text-sm text-zinc-500">
          Rate movies above — both engines run on{" "}
          <code className="text-zinc-400">POST /api/recommend</code> and return
          separate content-based and collaborative lists.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Recommendations</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Two algorithms, two lists — compare how each one picks for you.
        </p>
      </div>
      <FilterRecommendationSection
        kind="collaborative"
        items={collaborative}
        ratings={ratings}
        onRate={onRate}
        ratedCount={ratedCount}
        loading={loading}
      />
      <FilterRecommendationSection
        kind="content"
        items={content}
        ratings={ratings}
        onRate={onRate}
        ratedCount={ratedCount}
        loading={loading}
        horizontal
      />
    </div>
  );
}
