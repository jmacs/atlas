import {randomUUID} from 'node:crypto';
import {readFile, rm} from 'node:fs/promises';
import {expect, test} from 'vitest';
import {actionLogPath} from './logger.ts';
import {ActionFailure, ActionInterruption} from './action.ts';
import {runAction} from './dummy.action.ts';

test('action is directly callable without a worker and closes its complete log before returning', async () => {
  const actionId = randomUUID();
  try {
    const result = await runAction({
      actionId,
      payload: {intervalMs: 10, turns: 3, outcome: 'succeeded'},
    });
    expect(result.intervalMs).toBe(10);
    expect(result.turns).toBe(3);
    expect(result.outcome).toBe('succeeded');
    expect(result.elapsedMs).toBeGreaterThanOrEqual(30);
    const lines = (await readFile(actionLogPath(actionId), 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    expect(lines.map((line) => line.message)).toEqual([
      'Dummy action started',
      'Dummy action progress',
      'Dummy action progress',
      'Dummy action progress',
      'Dummy action completed',
    ]);
    expect(
      lines.filter((line) => line.message === 'Dummy action progress').map((line) => line.turn),
    ).toEqual([1, 2, 3]);
    expect(lines.every((line) => line.actionId === actionId)).toBe(true);
  } finally {
    await rm(actionLogPath(actionId), {force: true});
  }
});

test.each([
  {intervalMs: -1, turns: 1},
  {intervalMs: 300001, turns: 1},
  {intervalMs: 1.5, turns: 1},
  {intervalMs: '10', turns: 1},
  {intervalMs: 10, turns: 0},
  {intervalMs: 10, turns: 1001},
  {intervalMs: 10, turns: 1.5},
  {intervalMs: 1000, turns: 301},
  {intervalMs: 10, turns: 1},
  {intervalMs: 10, turns: 1, outcome: 'unknown'},
  {intervalMs: 10, turns: 1, outcome: 'succeeded', command: 'ignored'},
])('rejects invalid input at the action boundary: %j', async (payload) => {
  const actionId = randomUUID();
  await expect(runAction({actionId, payload})).rejects.toThrow('Choose a whole interval');
  await expect(readFile(actionLogPath(actionId))).rejects.toMatchObject({code: 'ENOENT'});
});

test('rejects an invalid identity before constructing action resources', async () => {
  await expect(
    runAction({actionId: '../invalid', payload: {intervalMs: 1, turns: 1, outcome: 'succeeded'}}),
  ).rejects.toThrow('Invalid action UUID');
});

test.each([
  ['failed', ActionFailure, 'Dummy action was configured to fail.'],
  ['interrupted', ActionInterruption, 'Dummy action was configured to interrupt.'],
] as const)('reports a configured %s outcome', async (outcome, errorType, message) => {
  const actionId = randomUUID();
  try {
    await expect(
      runAction({actionId, payload: {intervalMs: 1, turns: 1, outcome}}),
    ).rejects.toMatchObject({name: errorType.name, message, result: {outcome}});
    const lines = (await readFile(actionLogPath(actionId), 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    expect(lines.at(-1)?.message).toBe(`Dummy action ${outcome}`);
  } finally {
    await rm(actionLogPath(actionId), {force: true});
  }
});
