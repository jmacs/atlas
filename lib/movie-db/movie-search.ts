import {CONFIG} from '#lib/config.ts';

export type MovieDbSearchResult = {
  id: number;
  posterPath?: string;
  title: string;
  year?: number;
};

type TmdbSearchResponse = {
  results: Array<{
    id: number;
    poster_path: string | null;
    release_date: string;
    title: string;
  }>;
};

export async function searchMovieDb(query: string): Promise<MovieDbSearchResult[]> {
  const url = new URL('https://api.themoviedb.org/3/search/movie');
  url.searchParams.set('query', query);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('language', 'en-US');

  const response = await fetch(url, {
    headers: {Authorization: `Bearer ${CONFIG.TMDB_TOKEN}`},
  });
  if (!response.ok) {
    throw new Error(`TMDB search failed with status ${response.status}.`);
  }

  const body = (await response.json()) as TmdbSearchResponse;
  return body.results.map((movie) => ({
    id: movie.id,
    ...(movie.poster_path === null ? {} : {posterPath: movie.poster_path}),
    title: movie.title,
    ...releaseYear(movie.release_date),
  }));
}

function releaseYear(releaseDate: string): {year?: number} {
  const year = Number(releaseDate.slice(0, 4));
  return Number.isInteger(year) ? {year} : {};
}
