import {readFileSync} from 'node:fs';

type Media = {id: string; name: string; year: number; genres: string[]};
type Collection = {
  id: string;
  name: string;
  serverId: string;
  movieIds: string[];
  seriesIds: string[];
};
function read<T>(name: string): T {
  return JSON.parse(readFileSync(new URL(`./data/${name}.json`, import.meta.url), 'utf8')) as T;
}
export const movies = read<Media[]>('movies');
export const series = read<Media[]>('series');
export const collections = read<Collection[]>('collections');
export const baselineCatalog = {
  movies,
  series,
  collections: collections.map(({id, name, serverId}) => ({id, name, serverId})),
  collectionMovieIds: Object.fromEntries(collections.map((c) => [c.id, c.movieIds])),
  collectionSeriesIds: Object.fromEntries(collections.map((c) => [c.id, c.seriesIds])),
};
