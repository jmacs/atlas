import type {CollectionUpdaterValidationError} from './collection-updater-validation.ts';
import type {CollectionUpdaterCondition} from './collection-updater.ts';
import {
  validateSavedCollectionUpdaterDocument,
  type CollectionUpdaterStore,
} from './collection-updater-store.ts';

export type SavedCollectionUpdater = {
  id: string;
  enabled: boolean;
  collectionId: string;
  conditions: CollectionUpdaterCondition[];
};

export type CollectionUpdaterLibrary = {
  list(): Promise<SavedCollectionUpdater[]>;
  replace(value: unknown): Promise<SavedCollectionUpdater[] | CollectionUpdaterValidationError>;
};

export function createCollectionUpdaterLibrary(args: {
  store: CollectionUpdaterStore;
}): CollectionUpdaterLibrary {
  return {
    async list() {
      return args.store.read();
    },
    async replace(value) {
      const proposed = validateSavedCollectionUpdaterDocument(value);
      if ('code' in proposed) {
        return proposed;
      }
      await args.store.replace(proposed);
      return proposed;
    },
  };
}
