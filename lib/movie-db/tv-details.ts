import {CONFIG} from '#lib/config.ts';

export type MovieDbTvDetails = {
  backdropPath?: string;
  episodeRuntimeMinutes?: number;
  genres: string[];
  id: number;
  numberOfEpisodes: number;
  numberOfSeasons: number;
  overview?: string;
  posterPath?: string;
  rating?: number;
  tagline?: string;
  title: string;
  year?: number;
};

type TmdbTvDetailsResponse = {
  backdrop_path: string | null;
  episode_run_time: number[];
  first_air_date: string;
  genres: Array<{name: string}>;
  id: number;
  name: string;
  number_of_episodes: number;
  number_of_seasons: number;
  overview: string;
  poster_path: string | null;
  tagline: string;
  vote_average: number;
};

export async function getMovieDbTv(tvId: number): Promise<MovieDbTvDetails> {
  const url = new URL(`https://api.themoviedb.org/3/tv/${tvId}`);
  url.searchParams.set('language', 'en-US');

  const response = await fetch(url, {
    headers: {Authorization: `Bearer ${CONFIG.TMDB_TOKEN}`},
  });
  if (!response.ok) {
    throw new Error(`TMDB TV request failed with status ${response.status}.`);
  }

  const series = (await response.json()) as TmdbTvDetailsResponse;
  const episodeRuntimeMinutes = series.episode_run_time.find((runtime) => runtime > 0);
  return {
    genres: series.genres.map(({name}) => name),
    id: series.id,
    numberOfEpisodes: series.number_of_episodes,
    numberOfSeasons: series.number_of_seasons,
    title: series.name,
    ...(series.backdrop_path === null ? {} : {backdropPath: series.backdrop_path}),
    ...(episodeRuntimeMinutes === undefined ? {} : {episodeRuntimeMinutes}),
    ...(series.overview.trim() === '' ? {} : {overview: series.overview}),
    ...(series.poster_path === null ? {} : {posterPath: series.poster_path}),
    ...(series.tagline.trim() === '' ? {} : {tagline: series.tagline}),
    ...(series.vote_average > 0 ? {rating: series.vote_average} : {}),
    ...releaseYear(series.first_air_date),
  };
}

function releaseYear(releaseDate: string): {year?: number} {
  const year = Number(releaseDate.slice(0, 4));
  return Number.isInteger(year) ? {year} : {};
}
