import {expect, test} from 'vitest';
import {captureResult} from './contracts.ts';

test('captures an immutable JSON result', () => {
  const result = {applied: [{id: 'first'}], pending: false};

  const captured = captureResult(result);
  result.applied[0].id = 'changed';

  expect(captured).toEqual({applied: [{id: 'first'}], pending: false});
});

test.each([
  new Error('raw error'),
  {nested: new Error('nested error')},
  {value: NaN},
  {value: Infinity},
  {value: undefined},
  {value: () => {}},
  {value: Symbol('value')},
  {value: 1n},
])('rejects unsupported durable result values: %o', (value) => {
  expect(() => captureResult(value)).toThrow();
});
