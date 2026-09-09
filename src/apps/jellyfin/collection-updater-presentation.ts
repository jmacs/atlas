import type {CatalogReadResult} from '#lib/jellyfin/catalog.ts';
import {
  previewCollectionUpdaterCollections,
  type GroupedCollectionUpdaterPreview,
} from '#lib/jellyfin/collection-updater-preview.ts';
import type {SavedCollectionUpdater} from '#lib/jellyfin/collection-updaters.ts';

import type {CatalogStatusView} from './CatalogStatus.tsx';

export type CollectionRef = {id: string; title: string};

export type CollectionUpdaterEditorViewModel = Omit<SavedCollectionUpdater, 'collectionId'> & {
  collection: CollectionRef;
};

export const PREVIEW_MOVIE_SAMPLE_LIMIT = 10;

export type CollectionUpdaterPreviewSummary = {
  collection: {id: string; name: string};
  additionCount: number;
  movieSample: {id: string; label: string}[];
  omittedMovieCount: number;
};

export type CollectionUpdaterPreviewTotals = {
  enabledUpdaters: number;
  additions: number;
  changedCollections: number;
};

export function catalogStatusForPage(catalog: CatalogReadResult): CatalogStatusView {
  if (catalog.kind === 'ready') {
    return {
      kind: 'available',
      pulledAt: catalog.catalog.baseSnapshot.pulledAt,
      collections: catalog.catalog.collections.length,
      movies: catalog.catalog.movies.length,
      series: catalog.catalog.series.length,
    };
  }
  if (catalog.kind === 'missing') {
    return {kind: 'unavailable', reason: 'missing'};
  }
  return {kind: 'unavailable', reason: catalog.reason === 'invalid' ? 'invalid' : 'unreadable'};
}

export function collectionUpdaterEditorViewModels(
  catalog: CatalogReadResult,
  updaters: readonly SavedCollectionUpdater[],
): CollectionUpdaterEditorViewModel[] {
  const titles = new Map(
    catalog.kind === 'ready' ? catalog.catalog.collections.map(({id, name}) => [id, name]) : [],
  );
  return updaters.map(({collectionId, ...updater}) => ({
    ...updater,
    collection: {id: collectionId, title: titles.get(collectionId) ?? collectionId},
  }));
}

export function collectionTypeaheadItems(catalog: CatalogReadResult, query: string) {
  if (catalog.kind !== 'ready') {
    return [];
  }
  const normalizedQuery = query.trim().toLowerCase();
  return catalog.catalog.collections
    .map(({id, name}) => ({value: id, name, data: {id, title: name} satisfies CollectionRef}))
    .filter(({name, value}) => `${name} ${value}`.toLowerCase().includes(normalizedQuery));
}

export function collectionUpdaterPreviewForPage(
  catalog: Extract<CatalogReadResult, {kind: 'ready'}>['catalog'],
  savedUpdaters: readonly SavedCollectionUpdater[],
): {
  totals: CollectionUpdaterPreviewTotals;
  collections: CollectionUpdaterPreviewSummary[];
  missingCollectionIds: string[];
} {
  const enabled = savedUpdaters
    .filter((updater) => updater.enabled)
    .map(({collectionId, conditions}) => ({collectionId, conditions}));
  const preview = previewCollectionUpdaterCollections(catalog, enabled);
  const collections = preview.ready
    .filter((collection) => collection.movies.length > 0)
    .map(previewSummary);
  return {
    totals: {
      enabledUpdaters: enabled.length,
      additions: collections.reduce((total, collection) => total + collection.additionCount, 0),
      changedCollections: collections.length,
    },
    collections,
    missingCollectionIds: preview.missingCollectionIds,
  };
}

function previewSummary(preview: GroupedCollectionUpdaterPreview): CollectionUpdaterPreviewSummary {
  const movieSample = preview.movies.slice(0, PREVIEW_MOVIE_SAMPLE_LIMIT).map((movie) => ({
    id: movie.id,
    label: movie.year === undefined ? movie.name : `${movie.name} (${movie.year})`,
  }));
  return {
    collection: {id: preview.collection.id, name: preview.collection.name},
    additionCount: preview.movies.length,
    movieSample,
    omittedMovieCount: preview.movies.length - movieSample.length,
  };
}
