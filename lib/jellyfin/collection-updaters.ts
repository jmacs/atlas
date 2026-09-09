import {createCollectionUpdaterLibrary as createInternalCollectionUpdaterLibrary} from './_internal/collection-updater-library.ts';
import type {CollectionUpdaterLibrary} from './_internal/collection-updater-library.ts';
import {createCollectionUpdaterStore} from './_internal/collection-updater-store.ts';

export {
  type CollectionUpdaterLibrary,
  type SavedCollectionUpdater,
} from './_internal/collection-updater-library.ts';
export type {
  CollectionUpdater,
  CollectionUpdaterCondition,
} from './_internal/collection-updater.ts';
export type {CollectionUpdaterValidationError} from './_internal/collection-updater-validation.ts';

export function createCollectionUpdaterLibrary(): CollectionUpdaterLibrary {
  return createInternalCollectionUpdaterLibrary({store: createCollectionUpdaterStore()});
}
