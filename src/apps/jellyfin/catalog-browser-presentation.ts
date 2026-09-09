import type {CatalogReadResult} from '#lib/jellyfin/catalog.ts';

import type {CatalogStatusView} from './CatalogStatus.tsx';
import {catalogStatusForPage} from './collection-updater-presentation.ts';

type UnavailableCatalog = Extract<CatalogStatusView, {kind: 'unavailable'}>;

export type CatalogBrowserCollection = {
  id: string;
  name: string;
  movies: number;
  series: number;
};

export type CatalogBrowserMovie = {
  id: string;
  name: string;
  year?: number;
  genres: string[];
};

export type CatalogBrowserView =
  | UnavailableCatalog
  | {
      kind: 'available';
      collections: CatalogBrowserCollection[];
      movies: CatalogBrowserMovie[];
    };

export type CatalogCollectionMembersView =
  | UnavailableCatalog
  | {kind: 'not_found'}
  | {
      kind: 'available';
      collection: {id: string; name: string};
      movies: {id: string; label: string}[];
      series: {id: string; label: string}[];
    };

export type CatalogMovieMembershipView =
  | UnavailableCatalog
  | {kind: 'not_found'}
  | {
      kind: 'available';
      movie: {id: string; name: string; year?: number; genres: string[]};
      collections: {id: string; label: string}[];
    };

export function catalogBrowserForPage(catalog: CatalogReadResult): CatalogBrowserView {
  if (catalog.kind !== 'ready') {
    return catalogStatusForPage(catalog) as UnavailableCatalog;
  }

  return {
    kind: 'available',
    collections: catalog.catalog.collections
      .map(({id, name}) => ({
        id,
        name,
        movies: catalog.catalog.collectionMovieIds[id]?.length ?? 0,
        series: catalog.catalog.collectionSeriesIds[id]?.length ?? 0,
      }))
      .sort(byName),
    movies: catalog.catalog.movies
      .map(({id, name, year, genres}) => ({
        id,
        name,
        ...(year === undefined ? {} : {year}),
        genres,
      }))
      .sort(byName),
  };
}

export function catalogCollectionMembersForPage(
  catalog: CatalogReadResult,
  collectionId: string,
): CatalogCollectionMembersView {
  if (catalog.kind !== 'ready') {
    return catalogStatusForPage(catalog) as UnavailableCatalog;
  }

  const collection = catalog.catalog.collections.find(({id}) => id === collectionId);
  if (!collection) {
    return {kind: 'not_found'};
  }

  const movies = new Map(catalog.catalog.movies.map((movie) => [movie.id, movie] as const));
  const series = new Map(catalog.catalog.series.map((item) => [item.id, item] as const));
  return {
    kind: 'available',
    collection,
    movies: memberLabels(catalog.catalog.collectionMovieIds[collectionId] ?? [], movies),
    series: memberLabels(catalog.catalog.collectionSeriesIds[collectionId] ?? [], series),
  };
}

export function catalogMovieMembershipForPage(
  catalog: CatalogReadResult,
  movieId: string,
): CatalogMovieMembershipView {
  if (catalog.kind !== 'ready') {
    return catalogStatusForPage(catalog) as UnavailableCatalog;
  }

  const movie = catalog.catalog.movies.find(({id}) => id === movieId);
  if (!movie) {
    return {kind: 'not_found'};
  }

  const collections = new Map(
    catalog.catalog.collections.map((collection) => [collection.id, collection] as const),
  );
  return {
    kind: 'available',
    movie,
    collections: (catalog.catalog.movieCollectionIds[movieId] ?? [])
      .map((collectionId) => collections.get(collectionId))
      .filter(
        (collection): collection is NonNullable<typeof collection> => collection !== undefined,
      )
      .map(({id, name}) => ({id, label: name}))
      .sort((left, right) => left.label.localeCompare(right.label)),
  };
}

function memberLabels(
  ids: readonly string[],
  items: ReadonlyMap<string, {id: string; name: string; year?: number}>,
): {id: string; label: string}[] {
  return ids
    .map((id) => items.get(id))
    .filter((item): item is {id: string; name: string; year?: number} => item !== undefined)
    .map((item) => ({
      id: item.id,
      label: item.year === undefined ? item.name : `${item.name} (${item.year})`,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function byName<T extends {name: string}>(left: T, right: T): number {
  return left.name.localeCompare(right.name);
}
