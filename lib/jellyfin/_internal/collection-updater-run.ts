import {createCatalog, type Catalog} from './catalog.ts';
import type {CatalogStore} from './catalog-store.ts';
import {validateCatalog} from './catalog-validation.ts';
import {
  applyCollectionUpdaterPlan,
  type CollectionUpdaterExecutionProgress,
} from './collection-updater-execution.ts';
import {planCollectionUpdaterRun} from './collection-updater-plan.ts';
import type {CollectionUpdater} from './collection-updater.ts';
import type {JellyfinCatalogPullProgress, JellyfinGateway} from './jellyfin-gateway.ts';

export type CollectionUpdaterRunProgress =
  | {phase: 'initial_refresh'; progress: JellyfinCatalogPullProgress}
  | {phase: 'planning'; collectionCount: number}
  | ({phase: 'updating'} & CollectionUpdaterExecutionProgress)
  | {phase: 'final_refresh'; changeCount: number; progress: JellyfinCatalogPullProgress};

export type CollectionUpdaterRunOutcome =
  | {kind: 'no_changes'; collectionId: string; collectionName: string}
  | {kind: 'applied'; collectionId: string; collectionName: string; changeCount: number}
  | {kind: 'failed'; collectionId: string; collectionName: string; error: {message: string}}
  | {kind: 'not_attempted'; collectionId: string; collectionName: string};

type RunFailure =
  | {kind: 'initial_refresh_failed'; message: string}
  | {kind: 'targets_missing'; message: string; collectionIds: string[]}
  | {kind: 'write_failed'; message: string}
  | {kind: 'final_refresh_failed'; message: string};

type RunReportBase = {
  outcomes: CollectionUpdaterRunOutcome[];
  successfulChangeCount: number;
  initialCatalogPulledAt?: string;
  finalCatalogPulledAt?: string;
  catalogMayBeStale: boolean;
  finalRefreshError?: {message: string};
};

export type CollectionUpdaterRunReport =
  | (RunReportBase & {status: 'succeeded'})
  | (RunReportBase & {status: 'failed'; failure: RunFailure});

export type JellyfinCollectionUpdatersPayload = Record<string, never>;

export function validateJellyfinCollectionUpdatersPayload(
  value: unknown,
): asserts value is JellyfinCollectionUpdatersPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length) {
    throw new Error('Collection Updater action payload must be an empty object.');
  }
}

export async function runCollectionUpdaters({
  gateway,
  store,
  updaters,
  report,
  now = () => new Date(),
}: {
  gateway: JellyfinGateway;
  store: CatalogStore;
  updaters: readonly CollectionUpdater[];
  report?: (progress: CollectionUpdaterRunProgress) => void;
  now?: () => Date;
}): Promise<CollectionUpdaterRunReport> {
  if (!updaters.length) {
    return successReport([], 0);
  }

  let initialCatalog: Catalog;
  try {
    initialCatalog = await pullAndInstallCatalog(gateway, store, now, (progress) =>
      report?.({phase: 'initial_refresh', progress}),
    );
  } catch (error) {
    const message = toError(error).message;
    return failedReport({kind: 'initial_refresh_failed', message});
  }

  const plan = planCollectionUpdaterRun(initialCatalog, updaters);
  if ('code' in plan) {
    return {
      ...failedReport({
        kind: 'targets_missing',
        message: 'One or more target collections are missing from Jellyfin.',
        collectionIds: plan.collectionIds,
      }),
      initialCatalogPulledAt: initialCatalog.baseSnapshot.pulledAt,
    };
  }
  report?.({phase: 'planning', collectionCount: plan.length});
  const execution = await applyCollectionUpdaterPlan({
    writer: gateway,
    plan,
    progress: (progress) => report?.({phase: 'updating', ...progress}),
  });
  const outcomes = execution.outcomes.map(serializableOutcome);
  const writeFailure = outcomes.find((outcome) => outcome.kind === 'failed');

  let finalCatalogPulledAt: string | undefined;
  let finalRefreshError: {message: string} | undefined;
  if (execution.successfulChangeCount > 0) {
    try {
      const finalCatalog = await pullAndInstallCatalog(gateway, store, now, (progress) =>
        report?.({
          phase: 'final_refresh',
          changeCount: execution.successfulChangeCount,
          progress,
        }),
      );
      finalCatalogPulledAt = finalCatalog.baseSnapshot.pulledAt;
    } catch (error) {
      finalRefreshError = {message: toError(error).message};
    }
  }

  const base: RunReportBase = {
    outcomes,
    successfulChangeCount: execution.successfulChangeCount,
    initialCatalogPulledAt: initialCatalog.baseSnapshot.pulledAt,
    ...(finalCatalogPulledAt === undefined ? {} : {finalCatalogPulledAt}),
    catalogMayBeStale: finalRefreshError !== undefined,
    ...(finalRefreshError === undefined ? {} : {finalRefreshError}),
  };
  if (writeFailure?.kind === 'failed') {
    return {
      ...base,
      status: 'failed',
      failure: {kind: 'write_failed', message: writeFailure.error.message},
    };
  }
  if (finalRefreshError) {
    return {
      ...base,
      status: 'failed',
      failure: {kind: 'final_refresh_failed', message: finalRefreshError.message},
    };
  }
  return {...base, status: 'succeeded'};
}

async function pullAndInstallCatalog(
  gateway: JellyfinGateway,
  store: CatalogStore,
  now: () => Date,
  report: (progress: JellyfinCatalogPullProgress) => void,
): Promise<Catalog> {
  const remote = await gateway.pullCatalog(report);
  const catalog = createCatalog(remote, now().toISOString());
  const validated = validateCatalog(catalog);
  if ('code' in validated) {
    throw validated.cause ?? new Error('Invalid catalog.');
  }
  await store.replace(validated);
  return validated;
}

function serializableOutcome(
  outcome: Awaited<ReturnType<typeof applyCollectionUpdaterPlan>>['outcomes'][number],
): CollectionUpdaterRunOutcome {
  if (outcome.kind !== 'failed') {
    return outcome;
  }
  return {
    kind: outcome.kind,
    collectionId: outcome.collectionId,
    collectionName: outcome.collectionName,
    error: {message: toError(outcome.cause).message},
  };
}

function successReport(
  outcomes: CollectionUpdaterRunOutcome[],
  successfulChangeCount: number,
): CollectionUpdaterRunReport {
  return {
    status: 'succeeded',
    outcomes,
    successfulChangeCount,
    catalogMayBeStale: false,
  };
}

function failedReport(failure: RunFailure): CollectionUpdaterRunReport {
  return {
    status: 'failed',
    failure,
    outcomes: [],
    successfulChangeCount: 0,
    catalogMayBeStale: false,
  };
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}
