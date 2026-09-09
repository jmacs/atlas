import {setTimeout} from 'node:timers/promises';
import {createActionLogReader} from './action-log-reader.ts';
import {isTerminal} from './scheduler.db.ts';
import type {ActionRecord, ActionRepository} from './scheduler.db.ts';
import type {ActionLogReader} from './action-log-reader.ts';

type ActionRunEvent =
  | {type: 'status'; action: ActionRecord; logWarning: string | null}
  | {type: 'log'; record: unknown}
  | {type: 'heartbeat'}
  | {type: 'complete'; action: ActionRecord; logWarning: string | null};

type WatchOptions = {
  id: string;
  signal?: AbortSignal;
  wait?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
};

type WatcherDependencies = {
  repository: Pick<ActionRepository, 'getAction'>;
  createLogReader?: (actionId: string) => ActionLogReader;
};

async function wait(milliseconds: number, signal?: AbortSignal) {
  await setTimeout(milliseconds, undefined, {signal});
}

export function createActionRunWatcher({
  repository,
  createLogReader = createActionLogReader,
}: WatcherDependencies) {
  return async function* watch({
    id,
    signal,
    wait: pause = wait,
  }: WatchOptions): AsyncGenerator<ActionRunEvent> {
    const logs = createLogReader(id);
    let logWarning: string | null = null;
    let lastHeartbeat = Date.now();
    let previousStatus: string | undefined;

    try {
      while (!signal?.aborted) {
        const action = repository.getAction(id);
        if (!action) {
          throw new Error('Action no longer exists');
        }
        if (action.status !== previousStatus) {
          yield {type: 'status', action, logWarning};
          previousStatus = action.status;
        }
        const terminal = isTerminal(action.status);
        if (!logWarning) {
          const read = await logs.read();
          logWarning = read.warning;
          for (const record of read.records) {
            yield {type: 'log', record};
          }
          if (logWarning) {
            yield {type: 'status', action, logWarning};
          }
          if (read.hasData) {
            continue;
          }
        }
        if (terminal) {
          logWarning ??= logs.finish();
          yield {type: 'status', action, logWarning};
          yield {type: 'complete', action, logWarning};
          return;
        }
        if (Date.now() - lastHeartbeat >= 15_000) {
          yield {type: 'heartbeat'};
          lastHeartbeat = Date.now();
        }
        try {
          await pause(250, signal);
        } catch (error) {
          if (signal?.aborted) {
            return;
          }
          throw error;
        }
      }
    } finally {
      await logs.close();
    }
  };
}
