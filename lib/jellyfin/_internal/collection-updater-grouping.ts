import type {Catalog} from './catalog.ts';
import type {CollectionUpdaterPreview} from './collection-updater-resolution.ts';

export type GroupedCollectionUpdaterPreview = {
  kind: 'ready';
  collection: Extract<CollectionUpdaterPreview, {kind: 'ready'}>['collection'];
  movies: Extract<CollectionUpdaterPreview, {kind: 'ready'}>['movies'];
};

export function groupCollectionUpdaterPreviews(
  catalog: Catalog,
  previews: readonly CollectionUpdaterPreview[],
): {ready: GroupedCollectionUpdaterPreview[]; missingCollectionIds: string[]} {
  const missingCollectionIds: string[] = [];
  const missingSeen = new Set<string>();
  const groups = new Map<
    string,
    {collection: GroupedCollectionUpdaterPreview['collection']; movieIds: Set<string>}
  >();

  for (const preview of previews) {
    if (preview.kind === 'target_missing') {
      if (!missingSeen.has(preview.collectionId)) {
        missingCollectionIds.push(preview.collectionId);
        missingSeen.add(preview.collectionId);
      }
      continue;
    }
    const group = groups.get(preview.collection.id) ?? {
      collection: preview.collection,
      movieIds: new Set<string>(),
    };
    for (const movie of preview.movies) {
      group.movieIds.add(movie.id);
    }
    groups.set(preview.collection.id, group);
  }

  return {
    ready: [...groups.values()].map(({collection, movieIds}) => ({
      kind: 'ready',
      collection,
      movies: catalog.movies.filter((movie) => movieIds.has(movie.id)),
    })),
    missingCollectionIds,
  };
}
