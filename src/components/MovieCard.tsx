"use client";

import Image from "next/image";
import type { Movie } from "@/lib/types";
import { posterUrl } from "@/lib/tmdb";
import { StarRating } from "./StarRating";

type Props = {
  movie: Movie;
  userRating?: number;
  onRate: (movieId: number, rating: number) => void;
  badge?: string;
  compact?: boolean;
};

export function MovieCard({
  movie,
  userRating = 0,
  onRate,
  badge,
  compact,
}: Props) {
  const src = posterUrl(movie.posterPath, compact ? "w342" : "w500");

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 transition hover:border-zinc-600 ${
        compact ? "" : "shadow-lg shadow-black/20"
      }`}
    >
      <div className="relative aspect-[2/3] w-full bg-zinc-800">
        {src ? (
          <Image
            src={src}
            alt={movie.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, 200px"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-zinc-500">
            {movie.title}
          </div>
        )}
        {badge && (
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300 backdrop-blur">
            {badge}
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs text-zinc-200 backdrop-blur">
          {movie.voteAverage.toFixed(1)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-zinc-100">
          {movie.title}
        </h3>
        {!compact && (
          <p className="line-clamp-2 text-xs text-zinc-500">{movie.overview}</p>
        )}
        <StarRating
          value={userRating}
          onChange={(r) => onRate(movie.id, r)}
          size="sm"
        />
      </div>
    </article>
  );
}
