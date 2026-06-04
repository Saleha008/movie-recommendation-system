import type { Genre, Movie } from "./types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

export const posterUrl = (path: string | null, size: "w342" | "w500" = "w342") =>
  path ? `${IMAGE_BASE}/${size}${path}` : null;

type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  vote_average: number;
  release_date: string;
};

function getAuthHeaders(): HeadersInit {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    };
  }
  return { accept: "application/json" };
}

function apiKeyQuery(): string {
  const key = process.env.TMDB_API_KEY;
  return key ? `api_key=${key}` : "";
}

async function tmdbFetch<T>(path: string): Promise<T> {
  const separator = path.includes("?") ? "&" : "?";
  const keyPart = apiKeyQuery();
  const url = `${TMDB_BASE}${path}${keyPart ? `${separator}${keyPart}` : ""}`;

  const res = await fetch(url, {
    headers: getAuthHeaders(),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TMDB ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

export function mapMovie(raw: TmdbMovie): Movie {
  return {
    id: raw.id,
    title: raw.title,
    overview: raw.overview,
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    genreIds: raw.genre_ids ?? [],
    voteAverage: raw.vote_average,
    releaseDate: raw.release_date,
  };
}

export async function fetchPopularMovies(pages = 2): Promise<Movie[]> {
  const movies: Movie[] = [];
  for (let page = 1; page <= pages; page++) {
    const data = await tmdbFetch<{ results: TmdbMovie[] }>(
      `/movie/popular?language=en-US&page=${page}`,
    );
    movies.push(...data.results.map(mapMovie));
  }
  return dedupeMovies(movies);
}

export async function fetchMoviesByGenre(
  genreId: number,
  pages = 1,
): Promise<Movie[]> {
  const movies: Movie[] = [];
  for (let page = 1; page <= pages; page++) {
    const data = await tmdbFetch<{ results: TmdbMovie[] }>(
      `/discover/movie?language=en-US&sort_by=vote_average.desc&vote_count.gte=200&with_genres=${genreId}&page=${page}`,
    );
    movies.push(...data.results.map(mapMovie));
  }
  return dedupeMovies(movies);
}

export async function fetchGenres(): Promise<Genre[]> {
  const data = await tmdbFetch<{ genres: Genre[] }>(
    "/genre/movie/list?language=en",
  );
  return data.genres;
}

/** Popular titles plus picks from each chosen genre */
export async function fetchCatalogForGenres(
  genreIds: number[],
): Promise<Movie[]> {
  const popular = await fetchPopularMovies(1);
  if (genreIds.length === 0) return popular;

  const byGenre = await Promise.all(
    genreIds.map((id) => fetchMoviesByGenre(id, 1)),
  );
  return dedupeMovies([...popular, ...byGenre.flat()]);
}

function dedupeMovies(movies: Movie[]): Movie[] {
  const seen = new Set<number>();
  return movies.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

export function isTmdbConfigured(): boolean {
  return Boolean(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY);
}
