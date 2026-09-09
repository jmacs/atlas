import type {Catalog} from './catalog.ts';
import {createCatalogView} from './catalog-view.ts';
import {groupCollectionUpdaterPreviews} from './collection-updater-grouping.ts';
import type {CollectionUpdater} from './collection-updater.ts';
import {resolveCollectionUpdaterPreviews} from './collection-updater-resolution.ts';

export type PlannedCollectionUpdater = {
  collectionId: string;
  collectionName: string;
  movieIds: string[];
};
export type CollectionUpdaterPlanError = {
  code: 'collection_updater_targets_missing';
  collectionIds: string[];
};

export function planCollectionUpdaterRun(
  catalog: Catalog,
  updaters: readonly CollectionUpdater[],
): PlannedCollectionUpdater[] | CollectionUpdaterPlanError {
  const previews = resolveCollectionUpdaterPreviews(createCatalogView(catalog), updaters);
  const grouped = groupCollectionUpdaterPreviews(catalog, previews);
  if (grouped.missingCollectionIds.length) {
    return {
      code: 'collection_updater_targets_missing',
      collectionIds: grouped.missingCollectionIds,
    };
  }
  return grouped.ready.map((preview) => ({
    collectionId: preview.collection.id,
    collectionName: preview.collection.name,
    movieIds: preview.movies.map((movie) => movie.id),
  }));
}
