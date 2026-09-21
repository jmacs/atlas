import {CONFIG} from '#lib/config.ts';

export type MovieDbMovieDetails = {
  backdropPath?: string;
  genres: string[];
  id: number;
  overview?: string;
  posterPath?: string;
  rating?: number;
  runtimeMinutes?: number;
  tagline?: string;
  title: string;
  year?: number;
};

type TmdbMovieDetailsResponse = {
  backdrop_path: string | null;
  genres: Array<{name: string}>;
  id: number;
  overview: string;
  poster_path: string | null;
  release_date: string;
  runtime: number | null;
  tagline: string;
  title: string;
  vote_average: number;
};

export async function getMovieDbMovie(movieId: number): Promise<MovieDbMovieDetails> {
  const url = new URL(`https://api.themoviedb.org/3/movie/${movieId}`);
  url.searchParams.set('language', 'en-US');

  const response = await fetch(url, {
    headers: {Authorization: `Bearer ${CONFIG.TMDB_TOKEN}`},
  });
  if (!response.ok) {
    throw new Error(`TMDB movie request failed with status ${response.status}.`);
  }

  const movie = (await response.json()) as TmdbMovieDetailsResponse;
  return {
    id: movie.id,
    title: movie.title,
    genres: movie.genres.map(({name}) => name),
    ...(movie.backdrop_path === null ? {} : {backdropPath: movie.backdrop_path}),
    ...(movie.poster_path === null ? {} : {posterPath: movie.poster_path}),
    ...(movie.overview.trim() === '' ? {} : {overview: movie.overview}),
    ...(movie.tagline.trim() === '' ? {} : {tagline: movie.tagline}),
    ...(movie.runtime === null ? {} : {runtimeMinutes: movie.runtime}),
    ...(movie.vote_average > 0 ? {rating: movie.vote_average} : {}),
    ...releaseYear(movie.release_date),
  };
}

function releaseYear(releaseDate: string): {year?: number} {
  const year = Number(releaseDate.slice(0, 4));
  return Number.isInteger(year) ? {year} : {};
}
