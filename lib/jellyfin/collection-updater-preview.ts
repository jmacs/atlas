import {createCatalogView} from './_internal/catalog-view.ts';
import {
  resolveCollectionUpdaterPreviews,
  type CollectionUpdaterPreview,
} from './_internal/collection-updater-resolution.ts';
import type {Catalog} from './_internal/catalog.ts';
import {
  groupCollectionUpdaterPreviews,
  type GroupedCollectionUpdaterPreview,
} from './_internal/collection-updater-grouping.ts';
import type {CollectionUpdater} from './_internal/collection-updater.ts';

export type {CollectionUpdaterPreview} from './_internal/collection-updater-resolution.ts';
export type {GroupedCollectionUpdaterPreview};

export function previewCollectionUpdaters(
  catalog: Catalog,
  updaters: readonly CollectionUpdater[],
): CollectionUpdaterPreview[] {
  return resolveCollectionUpdaterPreviews(createCatalogView(catalog), updaters);
}

export function previewCollectionUpdaterCollections(
  catalog: Catalog,
  updaters: readonly CollectionUpdater[],
) {
  return groupCollectionUpdaterPreviews(catalog, previewCollectionUpdaters(catalog, updaters));
}
