import type {PlannedCollectionUpdater} from './collection-updater-plan.ts';

export type CollectionMembershipWriter = {
  addMoviesToCollection(collectionId: string, movieIds: readonly string[]): Promise<void>;
};
export type CollectionUpdaterRunOutcome =
  | {kind: 'no_changes'; collectionId: string; collectionName: string}
  | {kind: 'applied'; collectionId: string; collectionName: string; changeCount: number}
  | {kind: 'failed'; collectionId: string; collectionName: string; cause: unknown}
  | {kind: 'not_attempted'; collectionId: string; collectionName: string};
export type CollectionUpdaterExecutionResult = {
  outcomes: CollectionUpdaterRunOutcome[];
  successfulChangeCount: number;
};
export type CollectionUpdaterExecutionProgress = {
  index: number;
  total: number;
  collectionId: string;
  collectionName: string;
};

export async function applyCollectionUpdaterPlan({
  writer,
  plan,
  progress,
}: {
  writer: CollectionMembershipWriter;
  plan: readonly PlannedCollectionUpdater[];
  progress?: (progress: CollectionUpdaterExecutionProgress) => void;
}): Promise<CollectionUpdaterExecutionResult> {
  const outcomes: CollectionUpdaterRunOutcome[] = [];
  let successfulChangeCount = 0;
  let failed = false;
  for (const [index, updater] of plan.entries()) {
    if (failed) {
      outcomes.push({
        kind: 'not_attempted',
        collectionId: updater.collectionId,
        collectionName: updater.collectionName,
      });
      continue;
    }
    if (!updater.movieIds.length) {
      outcomes.push({
        kind: 'no_changes',
        collectionId: updater.collectionId,
        collectionName: updater.collectionName,
      });
      continue;
    }
    progress?.({
      index,
      total: plan.length,
      collectionId: updater.collectionId,
      collectionName: updater.collectionName,
    });
    try {
      await writer.addMoviesToCollection(updater.collectionId, updater.movieIds);
      successfulChangeCount += updater.movieIds.length;
      outcomes.push({
        kind: 'applied',
        collectionId: updater.collectionId,
        collectionName: updater.collectionName,
        changeCount: updater.movieIds.length,
      });
    } catch (cause) {
      failed = true;
      outcomes.push({
        kind: 'failed',
        collectionId: updater.collectionId,
        collectionName: updater.collectionName,
        cause,
      });
    }
  }
  return {outcomes, successfulChangeCount};
}
