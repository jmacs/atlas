import {
  validateDummyActionPayload,
  type DummyOutcome,
  type DummyPayload,
} from '#lib/actions/submission.ts';

type DummyFormResult =
  | {valid: true; payload: DummyPayload}
  | {valid: false; interval: string; turns: string; outcome: string; error: string};

export function parseDummyForm(body: Record<string, unknown>): DummyFormResult {
  const interval = typeof body.intervalMs === 'string' ? body.intervalMs : '';
  const turns = typeof body.turns === 'string' ? body.turns : '';
  const outcome = typeof body.outcome === 'string' ? body.outcome : '';
  const payload = {
    intervalMs: Number(interval),
    turns: Number(turns),
    outcome: outcome as DummyOutcome,
  };
  try {
    validateDummyActionPayload(payload);
    return {valid: true, payload};
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {valid: false, interval, turns, outcome, error: message};
  }
}
