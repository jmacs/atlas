import {expect, test, vi} from 'vitest';
import type {ActionScheduler} from './scheduling.ts';
import {createActionSubmitter} from './submission.ts';

const actionId = '00000000-0000-0000-0000-000000000000' as ReturnType<
  ActionScheduler['submitAction']
>;

function createSchedulerStub(): ActionScheduler {
  return {
    submitAction: vi.fn<ActionScheduler['submitAction']>(() => actionId),
    start: vi.fn(),
    tick: vi.fn(),
    stop: vi.fn(async () => {}),
    cleanup: vi.fn(async () => ({logsDeleted: 0, recordsDeleted: 0})),
  };
}

test('semantic action methods validate before submitting to the scheduler', () => {
  const scheduler = createSchedulerStub();
  const actions = createActionSubmitter(scheduler);

  expect(() => actions.submitDummy({intervalMs: -1, turns: 1, outcome: 'succeeded'})).toThrow(
    'Choose a whole interval',
  );
  expect(scheduler.submitAction).not.toHaveBeenCalled();
});

test('semantic action methods submit the registered action type and payload', () => {
  const scheduler = createSchedulerStub();
  const actions = createActionSubmitter(scheduler);
  const payload = {intervalMs: 1, turns: 1, outcome: 'succeeded' as const};

  expect(actions.submitDummy(payload)).toBe(actionId);
  expect(scheduler.submitAction).toHaveBeenCalledWith('actions.dummy', payload);

  expect(actions.submitJellyfinCollectionUpdaters()).toBe(actionId);
  expect(scheduler.submitAction).toHaveBeenCalledWith('jellyfin.collection-updaters.run', {});
});
