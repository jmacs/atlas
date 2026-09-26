import {CONFIG} from '#lib/config.ts';

export type MovieDbTvSearchResult = {
  id: number;
  posterPath?: string;
  title: string;
  year?: number;
};

type TmdbSearchResponse = {
  results: Array<{
    first_air_date: string;
    id: number;
    name: string;
    poster_path: string | null;
  }>;
};

export async function searchMovieDbTv(query: string): Promise<MovieDbTvSearchResult[]> {
  const url = new URL('https://api.themoviedb.org/3/search/tv');
  url.searchParams.set('query', query);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('language', 'en-US');

  const response = await fetch(url, {
    headers: {Authorization: `Bearer ${CONFIG.TMDB_TOKEN}`},
  });
  if (!response.ok) {
    throw new Error(`TMDB TV search failed with status ${response.status}.`);
  }

  const body = (await response.json()) as TmdbSearchResponse;
  return body.results.map((series) => ({
    id: series.id,
    title: series.name,
    ...(series.poster_path === null ? {} : {posterPath: series.poster_path}),
    ...releaseYear(series.first_air_date),
  }));
}

function releaseYear(releaseDate: string): {year?: number} {
  const year = Number(releaseDate.slice(0, 4));
  return Number.isInteger(year) ? {year} : {};
}
