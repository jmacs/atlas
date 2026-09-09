import {actionEntries, actionRepository, createScheduler} from './_internal/scheduler.ts';

type CreateActionSchedulerOptions = {
  onError: (error: unknown) => void;
  pollIntervalMs?: number;
};

export function createActionScheduler({onError, pollIntervalMs}: CreateActionSchedulerOptions) {
  return createScheduler({
    repository: actionRepository,
    entries: actionEntries,
    onError,
    pollIntervalMs,
  });
}

export type ActionScheduler = ReturnType<typeof createActionScheduler>;
