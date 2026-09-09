import {expect, test} from 'vitest';
import {ActionFailure, ActionInterruption, failAction, interruptAction} from './action.ts';

test('failAction normalizes its error and captures its result before throwing', () => {
  const result = {applied: [{id: 'first'}]};

  try {
    failAction(new Error('Partial failure'), result);
  } catch (error) {
    expect(error).toBeInstanceOf(ActionFailure);
    expect((error as ActionFailure).error.message).toBe('Partial failure');
    expect((error as ActionFailure).result).toEqual(result);
    result.applied[0].id = 'changed';
    expect((error as ActionFailure).result).toEqual({applied: [{id: 'first'}]});
  }
});

test('interruptAction preserves a durable partial result', () => {
  try {
    interruptAction(new Error('Interrupted'), {completed: 1});
  } catch (error) {
    expect(error).toBeInstanceOf(ActionInterruption);
    expect((error as ActionInterruption).error).toMatchObject({message: 'Interrupted'});
    expect((error as ActionInterruption).result).toEqual({completed: 1});
  }
});
