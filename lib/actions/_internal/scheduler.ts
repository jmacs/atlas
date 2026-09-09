import {Worker} from 'node:worker_threads';
import {actionError, capturePayload, captureResult, validateActionId} from './contracts.ts';
import type {ActionError, WorkerMessage} from './contracts.ts';
import type {ActionOutcome, ActionRepository} from './scheduler.db.ts';
import {CONFIG} from '#lib/config.ts';
import {cleanupExpiredActions} from './retention.ts';
import type {ActionCleanupSummary} from './retention.ts';

export const actionEntries = {
  'actions.dummy': new URL('./dummy.action.ts', import.meta.url),
  'jellyfin.collection-updaters.run': new URL(
    '../../jellyfin/_internal/collection-updater.action.ts',
    import.meta.url,
  ),
} as const;

export {actionRepository} from './scheduler.db.ts';

export type ActionEntries = Readonly<Record<string, URL>>;

type SchedulerOptions = {
  repository: ActionRepository;
  entries: ActionEntries;
  pollIntervalMs?: number;
  shutdownGraceMs?: number;
  onError: (error: unknown) => void;
};

function completionError(value: unknown): ActionError {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    !('message' in value) ||
    typeof value.message !== 'string' ||
    ('stack' in value && value.stack !== undefined && typeof value.stack !== 'string')
  ) {
    throw new Error('Invalid worker report');
  }
  const error = value as {message: string; stack?: string};
  return error.stack === undefined
    ? {message: error.message}
    : {message: error.message, stack: error.stack};
}

function completionMessage(value: unknown): WorkerMessage {
  if (!value || typeof value !== 'object' || !('type' in value)) {
    throw new Error('Invalid worker report');
  }
  if (value.type === 'succeeded' && 'result' in value) {
    return {type: 'succeeded', result: captureResult(value.result)};
  }
  if ((value.type === 'failed' || value.type === 'interrupted') && 'error' in value) {
    const error = completionError(value.error);
    if ('result' in value && value.result !== undefined) {
      return {type: value.type, error, result: captureResult(value.result)};
    }
    return {type: value.type, error};
  }
  throw new Error('Invalid worker report');
}

export function createScheduler({
  repository,
  entries,
  pollIntervalMs = 1000,
  shutdownGraceMs = 5000,
  onError,
}: SchedulerOptions) {
  if (!Number.isInteger(pollIntervalMs) || pollIntervalMs < 1) {
    throw new Error('Invalid poll interval');
  }
  let timer: ReturnType<typeof setInterval> | undefined;
  let cleanupTimer: ReturnType<typeof setInterval> | undefined;
  let cleanupInFlight: Promise<ActionCleanupSummary> | undefined;
  let stopping = false;
  let started = false;
  let guarded = false;
  let halted = false;
  let active: {worker: Worker; done: Promise<void>; interrupt: () => void} | undefined;
  let stopPromise: Promise<void> | undefined;
  const workerEntryPoint = new URL('./entry.ts', import.meta.url);

  function actionModuleFor(type: string) {
    if (!Object.hasOwn(entries, type)) {
      throw new Error(`Unknown action type: ${type}`);
    }
    return entries[type];
  }

  function halt(error: unknown) {
    halted = true;
    if (timer) {
      clearInterval(timer);
    }
    onError(error);
  }

  function finish(id: string, outcome: ActionOutcome) {
    try {
      repository.finishAction(id, outcome);
      guarded = false;
      if (outcome.error) {
        onError(new Error(`Action ${id}: ${outcome.error.message}`));
      }
    } catch (error) {
      // Keep the guard held if the durable outcome is uncertain.
      guarded = true;
      halt(error);
    }
  }

  function tick() {
    if (!started || stopping || halted || guarded) {
      return;
    }
    guarded = true;
    let action;
    try {
      action = repository.claimNextAction();
    } catch (error) {
      halt(error);
      return;
    }
    if (!action) {
      guarded = false;
      return;
    }
    const id = action.id;
    let worker: Worker;
    try {
      validateActionId(id);
      const actionModule = actionModuleFor(action.type);
      const payload = capturePayload(action.payload);
      worker = new Worker(workerEntryPoint, {
        workerData: {actionModule: actionModule.href, actionId: id, payload},
        // Native Node TypeScript works in development and production without inherited tsx hooks.
        execArgv: [],
      });
    } catch (error) {
      finish(id, {status: 'failed', result: null, error: actionError(error)});
      return;
    }
    let report: WorkerMessage | undefined;
    let failure: unknown;
    let interrupted = false;
    let resolveDone: () => void;
    const done = new Promise<void>((resolve) => {
      resolveDone = resolve;
    });
    active = {
      worker,
      done,
      interrupt: () => {
        interrupted = true;
      },
    };
    worker.on('message', (value: unknown) => {
      try {
        if (report) {
          throw new Error('Worker sent more than one completion report');
        }
        report = completionMessage(value);
      } catch (error) {
        failure = error;
      }
    });
    worker.on('error', (error) => {
      failure = error;
    });
    worker.once('exit', (code) => {
      let outcome: ActionOutcome;
      const result = report?.result ?? null;
      if (interrupted) {
        outcome = {
          status: 'interrupted',
          result,
          error: {message: 'Shutdown grace period expired; completion is uncertain.'},
        };
      } else if (failure || code !== 0 || !report) {
        outcome = {
          status: 'failed',
          result,
          error: actionError(
            failure ??
              new Error(
                `Worker exited with code ${code}${report ? '' : ' without a completion report'}`,
              ),
          ),
        };
      } else if (report.type === 'failed') {
        outcome = {status: 'failed', result, error: report.error};
      } else if (report.type === 'interrupted') {
        outcome = {status: 'interrupted', result, error: report.error};
      } else {
        outcome = {status: 'succeeded', result, error: null};
      }
      finish(id, outcome);
      active = undefined;
      resolveDone();
    });
  }

  function cleanup() {
    if (!started || stopping) {
      throw new Error('Scheduler is not running');
    }
    if (!cleanupInFlight) {
      cleanupInFlight = cleanupExpiredActions({repository}).finally(() => {
        cleanupInFlight = undefined;
      });
    }
    return cleanupInFlight;
  }

  function triggerCleanup() {
    void cleanup().catch(onError);
  }

  return {
    submitAction(type: string, payload: unknown) {
      actionModuleFor(type);
      return repository.insertAction(type, capturePayload(payload));
    },
    start() {
      if (started || stopping) {
        throw new Error('Scheduler cannot be started twice');
      }
      repository.recoverRunningActions();
      started = true;
      timer = setInterval(tick, pollIntervalMs);
      triggerCleanup();
      cleanupTimer = setInterval(triggerCleanup, CONFIG.ACTION_CLEANUP_INTERVAL_MS);
    },
    tick,
    stop() {
      if (stopPromise) {
        return stopPromise;
      }
      stopping = true;
      if (timer) {
        clearInterval(timer);
      }
      if (cleanupTimer) {
        clearInterval(cleanupTimer);
      }
      stopPromise = (async () => {
        await cleanupInFlight?.catch(onError);
        const current = active;
        if (!current) {
          return;
        }
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([
            current.done,
            new Promise<void>((resolve) => {
              timeout = setTimeout(resolve, shutdownGraceMs);
            }),
          ]);
          if (active === current) {
            current.interrupt();
            await current.worker.terminate();
            await current.done;
          }
        } finally {
          clearTimeout(timeout);
        }
      })();
      return stopPromise;
    },
    cleanup,
  };
}

export type ActionScheduler = ReturnType<typeof createScheduler>;
