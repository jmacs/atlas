import {validateDummyPayload} from './_internal/dummy.action.ts';
import type {DummyOutcome, DummyPayload} from './_internal/dummy.action.ts';
import {validateJellyfinCollectionUpdatersPayload} from '#lib/jellyfin/collection-updater-execution.ts';
import type {ActionScheduler} from './scheduling.ts';

export type {DummyOutcome, DummyPayload};

export type ActionSubmitter = {
  submitDummy(payload: DummyPayload): string;
  submitJellyfinCollectionUpdaters(): string;
};

export function createActionSubmitter(scheduler: ActionScheduler): ActionSubmitter {
  return {
    submitDummy(payload: DummyPayload) {
      validateDummyPayload(payload);
      return scheduler.submitAction('actions.dummy', payload);
    },
    submitJellyfinCollectionUpdaters() {
      const payload = {};
      validateJellyfinCollectionUpdatersPayload(payload);
      return scheduler.submitAction('jellyfin.collection-updaters.run', payload);
    },
  };
}

export function validateDummyActionPayload(payload: unknown): asserts payload is DummyPayload {
  validateDummyPayload(payload);
}
