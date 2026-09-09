import {createActionRunWatcher} from './_internal/run-watcher.ts';
import {actionRepository, isTerminal} from './_internal/scheduler.db.ts';
import type {ActionRecord} from './_internal/scheduler.db.ts';

export type ActionRun = ActionRecord;
export type ActionRunList = ReturnType<typeof actionRepository.listActions>;
export type ActionRunStatus = ActionRun['status'];

const watch = createActionRunWatcher({repository: actionRepository});

export const actionRuns = {
  watch,
  isTerminal,
  get(id: string): ActionRun | undefined {
    return actionRepository.getAction(id);
  },
  list(page?: number): ActionRunList {
    return actionRepository.listActions(page);
  },
};
