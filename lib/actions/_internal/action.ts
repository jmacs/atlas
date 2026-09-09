import {actionError, capturePayload, captureResult, validateActionId} from './contracts.ts';
import type {ActionError, JsonValue, WorkerData} from './contracts.ts';
import {createActionLogger} from './logger.ts';
import type {ActionLogger} from './logger.ts';

export type ActionOperation<TResult = unknown> = (data: WorkerData) => Promise<TResult>;

export type {ActionLogger} from './logger.ts';

type PayloadValidator<TPayload extends object> = (value: unknown) => asserts value is TPayload;

export class ActionFailure extends Error {
  readonly error: ActionError;
  readonly result: JsonValue;

  constructor(error: ActionError, result: JsonValue) {
    super(error.message);
    this.name = 'ActionFailure';
    this.error = error;
    this.result = result;
  }
}

export class ActionInterruption extends ActionFailure {
  constructor(error: ActionError, result: JsonValue) {
    super(error, result);
    this.name = 'ActionInterruption';
  }
}

export function failAction(error: unknown, result: unknown): never {
  throw new ActionFailure(actionError(error), captureResult(result));
}

export function interruptAction(error: unknown, result: unknown): never {
  throw new ActionInterruption(actionError(error), captureResult(result));
}

export function defineAction<TPayload extends object, TResult>(
  validatePayload: PayloadValidator<TPayload>,
  operation: (payload: TPayload, logger: ActionLogger) => Promise<TResult>,
): ActionOperation<TResult> {
  return async (data) => {
    validateActionId(data.actionId);
    const payload = capturePayload(data.payload);
    validatePayload(payload);
    const {logger, close} = await createActionLogger(data.actionId);
    try {
      return await operation(payload, logger);
    } finally {
      await close();
    }
  };
}
