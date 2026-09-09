import type {SavedCollectionUpdater} from '#lib/jellyfin/collection-updaters.ts';

export type ProposedUpdaterTargetError = {
  path: string;
  message: string;
};

export function validateProposedUpdaterTargets(
  value: unknown,
  savedUpdaters: readonly SavedCollectionUpdater[],
  catalogCollectionIds: readonly string[],
): ProposedUpdaterTargetError | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const savedById = new Map(savedUpdaters.map((updater) => [updater.id, updater]));
  const catalogIds = new Set(catalogCollectionIds);
  for (const [index, entry] of value.entries()) {
    if (
      typeof entry !== 'object' ||
      entry === null ||
      !('id' in entry) ||
      !('collectionId' in entry) ||
      typeof entry.id !== 'string' ||
      typeof entry.collectionId !== 'string'
    ) {
      continue;
    }
    const collectionId = entry.collectionId.trim();
    const saved = savedById.get(entry.id);
    if (!catalogIds.has(collectionId) && saved?.collectionId !== collectionId) {
      return {
        path: `collectionUpdaters[${index}].collectionId`,
        message: 'choose a target from the current cached catalog or retain its saved target.',
      };
    }
  }
  return undefined;
}
