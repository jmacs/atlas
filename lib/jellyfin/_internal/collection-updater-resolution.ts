import type {CatalogCollection, CatalogMovie} from './catalog.ts';
import type {CatalogView} from './catalog-view.ts';
import type {CollectionUpdater, CollectionUpdaterCondition} from './collection-updater.ts';

export type CollectionUpdaterPreview =
  | {
      kind: 'ready';
      updater: CollectionUpdater;
      collection: CatalogCollection;
      impactedMovieCount: number;
      movies: readonly CatalogMovie[];
    }
  | {kind: 'target_missing'; updater: CollectionUpdater; collectionId: string};

export function resolveCollectionUpdaterPreviews(
  view: CatalogView,
  updaters: readonly CollectionUpdater[],
): CollectionUpdaterPreview[] {
  return updaters.map((updater) => {
    const collection = view.getCollection(updater.collectionId);
    const clonedUpdater = structuredClone(updater);
    if (collection === undefined) {
      return {kind: 'target_missing', updater: clonedUpdater, collectionId: updater.collectionId};
    }
    const existingMovieIds = new Set(view.getMovieIdsInCollection(collection.id));
    const movies = view
      .listMovies()
      .filter(
        (movie) =>
          updater.conditions.every((condition) => movieMatches(movie, condition)) &&
          !existingMovieIds.has(movie.id),
      );
    return {
      kind: 'ready',
      updater: clonedUpdater,
      collection,
      impactedMovieCount: movies.length,
      movies,
    };
  });
}

function movieMatches(movie: CatalogMovie, condition: CollectionUpdaterCondition): boolean {
  if (condition.field === 'movie.year') {
    if (movie.year === undefined) {
      return false;
    }
    switch (condition.operator) {
      case 'eq':
        return movie.year === condition.value;
      case 'lt':
        return movie.year < condition.value;
      case 'gt':
        return movie.year > condition.value;
      case 'lte':
        return movie.year <= condition.value;
      case 'gte':
        return movie.year >= condition.value;
      case 'between':
        return movie.year >= condition.start && movie.year <= condition.end;
    }
  }
  const movieGenres = new Set(movie.genres.map((genre) => genre.toLowerCase()));
  const requestedGenres = new Set(condition.values.map((genre) => genre.toLowerCase()));
  return condition.operator === 'includes_any'
    ? requestedGenres.values().some((genre) => movieGenres.has(genre))
    : requestedGenres.values().every((genre) => movieGenres.has(genre));
}
