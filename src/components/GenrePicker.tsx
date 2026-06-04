"use client";

import type { Genre } from "@/lib/types";

const PICKER_GENRES = [
  "action",
  "comedy",
  "drama",
  "horror",
  "romance",
  "science fiction",
  "sci-fi",
  "thriller",
  "animation",
];

function matchesPicker(name: string): boolean {
  const n = name.toLowerCase();
  return PICKER_GENRES.some(
    (p) => n === p || n.includes(p) || p.includes(n),
  );
}

type Props = {
  genres: Genre[];
  selected: number[];
  onToggle: (id: number) => void;
  onContinue: () => void;
};

export function GenrePicker({
  genres,
  selected,
  onToggle,
  onContinue,
}: Props) {
  const options = genres.filter((g) => matchesPicker(g.name));

  const display = options.length > 0 ? options : genres.slice(0, 8);
  const canContinue = selected.length >= 2;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8 text-center">
        <span className="text-xs font-medium text-amber-500">Step 1 of 2</span>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
          What do you like to watch?
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Pick at least two genres. We&apos;ll show movies to rate and build your
          recommendations from there.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {display.map((g) => {
          const active = selected.includes(g.id);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onToggle(g.id)}
              className={`rounded-xl border px-4 py-4 text-sm font-medium transition ${
                active
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-200"
                  : "border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {g.name}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className="mt-8 w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue
      </button>
      {!canContinue && (
        <p className="mt-2 text-center text-xs text-zinc-500">
          Select {2 - selected.length} more
        </p>
      )}
    </div>
  );
}
