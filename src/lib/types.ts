export type Movie = {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  genreIds: number[];
  voteAverage: number;
  releaseDate: string;
};

export type Genre = {
  id: number;
  name: string;
};

export type UserRating = {
  movieId: number;
  rating: number; // 1–5
};

export type Recommendation = {
  movie: Movie;
  score: number;
  reason: string;
};

export type RecommendationMode = "content" | "collaborative";
