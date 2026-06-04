"use client";

type Props = {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md";
};

export function StarRating({ value, onChange, size = "md" }: Props) {
  const starClass = size === "sm" ? "text-base" : "text-lg";

  return (
    <div
      className="flex gap-0.5"
      role="group"
      aria-label={`Rate ${value || "unrated"} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          className={`${starClass} transition-colors hover:scale-110 ${
            star <= value ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"
          }`}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
