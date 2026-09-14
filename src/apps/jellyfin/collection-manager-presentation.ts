import type {CatalogReadResult} from '#lib/jellyfin/catalog.ts';

import type {TypeaheadItem} from '../../ui/Typeahead.tsx';

const TYPEAHEAD_RESULT_LIMIT = 20;

export type CollectionManagerSelection = {
  collection: TypeaheadItem;
  movies: TypeaheadItem[];
};

export type CollectionManagerSelectionResult =
  | {kind: 'valid'; collectionId: string; collectionName: string; movieIds: string[]}
  | {kind: 'invalid'; message: string};

export function collectionManagerCollectionItems(
  catalog: CatalogReadResult,
  query: string,
): TypeaheadItem[] {
  if (catalog.kind !== 'ready') {
    return [];
  }
  const normalizedQuery = query.trim().toLowerCase();
  return catalog.catalog.collections
    .filter(({id, name}) => `${name} ${id}`.toLowerCase().includes(normalizedQuery))
    .slice(0, TYPEAHEAD_RESULT_LIMIT)
    .map(({id, name}) => ({value: id, name}));
}

export function collectionManagerMovieItems(
  catalog: CatalogReadResult,
  query: string,
): TypeaheadItem[] {
  if (catalog.kind !== 'ready') {
    return [];
  }
  const normalizedQuery = query.trim().toLowerCase();
  return catalog.catalog.movies
    .filter(({id, name, year}) =>
      `${name} ${year === undefined ? '' : year} ${id}`.toLowerCase().includes(normalizedQuery),
    )
    .slice(0, TYPEAHEAD_RESULT_LIMIT)
    .map(movieTypeaheadItem);
}

export function collectionManagerSelection(
  catalog: CatalogReadResult,
  collectionId: string | undefined,
  movieIds: readonly string[],
): CollectionManagerSelection {
  if (catalog.kind !== 'ready') {
    return {collection: emptyCollection(), movies: []};
  }
  const collection = catalog.catalog.collections.find(({id}) => id === collectionId);
  const movies = new Map(catalog.catalog.movies.map((movie) => [movie.id, movie] as const));
  return {
    collection: collection ? {value: collection.id, name: collection.name} : emptyCollection(),
    movies: unique(movieIds).flatMap((id) => {
      const movie = movies.get(id);
      return movie ? [movieTypeaheadItem(movie)] : [];
    }),
  };
}

export function resolveCollectionManagerSelection(
  catalog: CatalogReadResult,
  collectionId: string | undefined,
  movieIds: readonly string[],
): CollectionManagerSelectionResult {
  if (catalog.kind !== 'ready') {
    return {
      kind: 'invalid',
      message: 'The cached catalog is unavailable. Refresh it before updating a collection.',
    };
  }
  const collection = catalog.catalog.collections.find(({id}) => id === collectionId);
  if (!collection) {
    return {kind: 'invalid', message: 'Choose a collection from the cached catalog.'};
  }
  const uniqueMovieIds = unique(movieIds);
  if (!uniqueMovieIds.length) {
    return {kind: 'invalid', message: 'Choose at least one movie to add.'};
  }
  const catalogMovieIds = new Set(catalog.catalog.movies.map(({id}) => id));
  if (uniqueMovieIds.some((id) => !catalogMovieIds.has(id))) {
    return {
      kind: 'invalid',
      message:
        'One or more selected movies are not in the cached catalog. Choose the movies again.',
    };
  }
  return {
    kind: 'valid',
    collectionId: collection.id,
    collectionName: collection.name,
    movieIds: uniqueMovieIds,
  };
}

function movieTypeaheadItem(movie: {
  id: string;
  name: string;
  year?: number;
  genres: readonly string[];
}): TypeaheadItem {
  const name = movie.year === undefined ? movie.name : `${movie.name} (${movie.year})`;
  return {
    value: movie.id,
    name,
    ...(movie.genres.length ? {description: movie.genres.join(', ')} : {}),
  };
}

function emptyCollection(): TypeaheadItem {
  return {value: '', name: ''};
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
