import {parentPort, workerData} from 'node:worker_threads';
import {actionError, captureResult} from './contracts.ts';
import type {WorkerData, WorkerMessage} from './contracts.ts';
import {ActionFailure, ActionInterruption} from './action.ts';
import type {ActionOperation} from './action.ts';

type EntryData = WorkerData & {actionModule: string};
type ActionModule = {runAction: ActionOperation};

function entryData(value: unknown): EntryData {
  if (
    !value ||
    typeof value !== 'object' ||
    !('actionModule' in value) ||
    typeof value.actionModule !== 'string' ||
    !('actionId' in value) ||
    !('payload' in value)
  ) {
    throw new Error('Invalid action worker data');
  }
  return value as EntryData;
}

async function loadAction(url: string) {
  const action: unknown = await import(url);
  if (
    !action ||
    typeof action !== 'object' ||
    !('runAction' in action) ||
    typeof action.runAction !== 'function'
  ) {
    throw new Error('Action module must export runAction');
  }
  return action as ActionModule;
}

if (!parentPort) {
  throw new Error('Actions must be dispatched through the Atlas scheduler');
}

let message: WorkerMessage;
try {
  const {actionModule, actionId, payload} = entryData(workerData);
  const action = await loadAction(actionModule);
  message = {type: 'succeeded', result: captureResult(await action.runAction({actionId, payload}))};
} catch (error) {
  if (error instanceof ActionInterruption) {
    message = {type: 'interrupted', error: error.error, result: error.result};
  } else if (error instanceof ActionFailure) {
    message = {type: 'failed', error: error.error, result: error.result};
  } else {
    message = {type: 'failed', error: actionError(error)};
  }
}
parentPort.postMessage(message);
parentPort.close();
