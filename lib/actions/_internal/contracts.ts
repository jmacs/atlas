export type WorkerData<TPayload extends object = Record<string, unknown>> = {
  actionId: string;
  payload: TPayload;
};

export type JsonValue = null | boolean | number | string | JsonValue[] | {[key: string]: JsonValue};

export type ActionError = {message: string; stack?: string};
export type WorkerMessage =
  | {type: 'succeeded'; result: JsonValue}
  | {type: 'failed' | 'interrupted'; error: ActionError; result?: JsonValue};

export function actionError(error: unknown): ActionError {
  if (error instanceof Error) {
    return {message: error.message, stack: error.stack};
  }
  return {message: String(error)};
}

export function validateActionId(id: unknown): asserts id is string {
  if (
    typeof id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  ) {
    throw new Error('Invalid action UUID');
  }
}

export function capturePayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Action payload must be a JSON object');
  }
  const json = JSON.stringify(payload, (_key, value) => {
    if (
      value === undefined ||
      typeof value === 'function' ||
      typeof value === 'symbol' ||
      (typeof value === 'number' && !Number.isFinite(value))
    ) {
      throw new Error('Action payload must be JSON serializable');
    }
    return value;
  });
  if (Buffer.byteLength(json) > 16_384) {
    throw new Error('Action payload exceeds 16 KiB');
  }
  const captured: unknown = JSON.parse(json);
  if (!captured || typeof captured !== 'object' || Array.isArray(captured)) {
    throw new Error('Action payload must be a JSON object');
  }
  return captured as Record<string, unknown>;
}

function rejectUnsupportedResultValues(value: unknown, seen = new Set<object>()): void {
  if (value instanceof Error) {
    throw new Error('Action result must not contain Error instances');
  }
  if (
    value === undefined ||
    typeof value === 'function' ||
    typeof value === 'symbol' ||
    typeof value === 'bigint' ||
    (typeof value === 'number' && !Number.isFinite(value))
  ) {
    throw new Error('Action result must be JSON serializable');
  }
  if (!value || typeof value !== 'object') {
    return;
  }
  if (seen.has(value)) {
    throw new Error('Action result must be JSON serializable');
  }
  seen.add(value);
  for (const key of Object.keys(value)) {
    rejectUnsupportedResultValues((value as Record<string, unknown>)[key], seen);
  }
  seen.delete(value);
}

export function captureResult(value: unknown): JsonValue {
  rejectUnsupportedResultValues(value);
  let json: string | undefined;
  try {
    json = JSON.stringify(value, (_key, nested) => {
      if (
        nested instanceof Error ||
        nested === undefined ||
        typeof nested === 'function' ||
        typeof nested === 'symbol' ||
        typeof nested === 'bigint' ||
        (typeof nested === 'number' && !Number.isFinite(nested))
      ) {
        throw new Error('Action result must be JSON serializable');
      }
      return nested;
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Action result must be JSON serializable') {
      throw error;
    }
    throw new Error('Action result must be JSON serializable');
  }
  if (json === undefined) {
    throw new Error('Action result must be JSON serializable');
  }
  return JSON.parse(json) as JsonValue;
}
