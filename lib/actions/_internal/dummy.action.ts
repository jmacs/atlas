import {setTimeout} from 'node:timers/promises';
import {defineAction, failAction, interruptAction} from './action.ts';
import type {ActionLogger} from './action.ts';

export type DummyOutcome = 'succeeded' | 'failed' | 'interrupted';

export type DummyPayload = {
  intervalMs: number;
  turns: number;
  outcome: DummyOutcome;
};

// Interval and turn count are captured at submission; no mutable resources are read.
export function validateDummyPayload(value: unknown): asserts value is DummyPayload {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== 3 ||
    !('intervalMs' in value) ||
    !('turns' in value) ||
    !('outcome' in value) ||
    typeof value.intervalMs !== 'number' ||
    !Number.isInteger(value.intervalMs) ||
    value.intervalMs < 1 ||
    value.intervalMs > 300_000 ||
    typeof value.turns !== 'number' ||
    !Number.isInteger(value.turns) ||
    value.turns < 1 ||
    value.turns > 1000 ||
    (value.outcome !== 'succeeded' &&
      value.outcome !== 'failed' &&
      value.outcome !== 'interrupted') ||
    value.intervalMs * value.turns > 300_000
  ) {
    throw new Error(
      'Choose a whole interval of 1–300000 milliseconds and 1–1000 turns, totaling at most 5 minutes.',
    );
  }
}

async function runDummyAction(payload: DummyPayload, logger: ActionLogger) {
  logger.info(payload, 'Dummy action started');
  const started = Date.now();
  for (let turn = 1; turn <= payload.turns; turn++) {
    await setTimeout(payload.intervalMs);
    logger.info(
      {
        turn,
        turns: payload.turns,
        elapsedMs: Date.now() - started,
      },
      'Dummy action progress',
    );
  }
  const result = {...payload, elapsedMs: Date.now() - started};
  if (payload.outcome === 'failed') {
    logger.error(result, 'Dummy action failed');
    failAction(new Error('Dummy action was configured to fail.'), result);
  }
  if (payload.outcome === 'interrupted') {
    logger.warn(result, 'Dummy action interrupted');
    interruptAction(new Error('Dummy action was configured to interrupt.'), result);
  }
  logger.info(result, 'Dummy action completed');
  return result;
}

export const runAction = defineAction(validateDummyPayload, runDummyAction);
