import {setTimeout} from 'node:timers/promises';
import {failAction} from '../action.ts';
import type {WorkerData} from '../contracts.ts';

export async function runAction(data: WorkerData) {
  switch (data.payload.mode) {
    case 'throw':
      throw new Error('Worker exploded');
    case 'empty':
      process.exit(0);
    case 'failed':
      throw new Error('Partial failure');
    case 'reported-failure':
      failAction(new Error('Partial failure'), {
        applied: [{id: 'first'}],
        failed: [{id: 'second', reason: 'Unavailable'}],
        notAttempted: [{id: 'third'}],
      });
    case 'invalid-result':
      return {value: NaN};
    case 'error-result':
      return {value: new Error('Not durable')};
    case 'crash-after-report':
      setImmediate(() => {
        throw new Error('Cleanup failed');
      });
      return {completed: 2};
    case 'hang':
      await setTimeout(60_000);
      return data;
    default:
      await setTimeout(100);
      return data;
  }
}
