# CineMatch — Movie Recommendation System

A minimal Next.js app that recommends movies using **content-based** and **collaborative** filtering, powered by [The Movie Database (TMDB)](https://www.themoviedb.org/) API.

## How it works

### Content-based filtering
- Builds a feature vector per movie: genre one-hot encoding + normalized TMDB `vote_average`
- Your profile is a weighted average of vectors for movies you rated (1–5 stars)
- Recommends unrated movies with highest **cosine similarity** to your profile

### Collaborative filtering
- Compares your ratings to **seed user personas** (action, drama, sci-fi, comedy, horror fans) via **Pearson correlation**
- Predicts ratings for unrated titles from the top similar neighbors
- Surfaces movies those neighbors loved that you have not rated yet

## Setup

```bash
npm install
cp .env.example .env.local
# Add TMDB_API_KEY or TMDB_ACCESS_TOKEN to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without API credentials, the app runs on a built-in mock catalog so you can try both algorithms immediately.

## TMDB credentials

1. Create an account at [themoviedb.org](https://www.themoviedb.org/)
2. Request an API key under Settings → API
3. Add to `.env.local`:
   - `TMDB_API_KEY` (v3), or
   - `TMDB_ACCESS_TOKEN` (v4 read token, sent as `Authorization: Bearer`)

## Project structure

```
src/lib/recommendations/   # content.ts, collaborative.ts
src/lib/tmdb.ts            # TMDB fetch helpers
src/app/api/               # movies, genres, recommend routes
src/components/            # UI
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — production server
