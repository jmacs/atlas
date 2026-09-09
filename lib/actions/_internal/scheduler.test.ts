import {readFile, writeFile, mkdir, rm} from 'node:fs/promises';
import {dirname} from 'node:path';
import {actionLogPath} from './logger.ts';
import {drizzle} from 'drizzle-orm/node-sqlite';
import {DatabaseSync} from 'node:sqlite';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {createActionRepository} from './scheduler.db.ts';
import {migrateDatabase} from '#lib/database/migrate.ts';
import {createScheduler} from './scheduler.ts';

let sqlite: DatabaseSync;
let repository: ReturnType<typeof createActionRepository>;
let scheduler: ReturnType<typeof createScheduler> | undefined;
const entries = {
  test: new URL('./fixtures/worker.ts', import.meta.url),
  logged: new URL('./fixtures/logged-action.ts', import.meta.url),
  missing: new URL('./fixtures/missing.ts', import.meta.url),
  invalid: new URL('./fixtures/invalid-action.ts', import.meta.url),
  'bad-url': new URL('https://invalid.example/worker.ts'),
} as const;
const reportError = vi.fn();

beforeEach(() => {
  sqlite = new DatabaseSync(':memory:');
  migrateDatabase(sqlite);
  repository = createActionRepository(drizzle({client: sqlite}));
  reportError.mockClear();
});
afterEach(async () => {
  await scheduler?.stop();
  scheduler = undefined;
  sqlite.close();
});
function start() {
  scheduler = createScheduler({
    repository,
    entries,
    onError: reportError,
    pollIntervalMs: 60_000,
    shutdownGraceMs: 10,
  });
  scheduler.start();
  return scheduler;
}

test('history pages are bounded, deterministic, and keep active work visible', () => {
  expect(repository.listActions()).toMatchObject({page: 1, pageCount: 1, history: []});
  const active = repository.insertAction('test', {});
  for (let index = 0; index < 25; index++) {
    const id = repository.insertAction('test', {});
    sqlite
      .prepare("UPDATE scheduler_actions SET status = 'succeeded', finished_at = ? WHERE id = ?")
      .run('2026-09-10T00:00:00Z', id);
  }
  const first = repository.listActions();
  const second = repository.listActions(2);
  expect(first.history).toHaveLength(20);
  expect(second.history).toHaveLength(5);
  expect(new Set([...first.history, ...second.history].map((action) => action.id)).size).toBe(25);
  expect(second.active.map((action) => action.id)).toEqual([active]);
  expect(repository.listActions(999).page).toBe(2);
  expect(repository.listActions(-1).page).toBe(1);
  expect(repository.listActions(NaN).page).toBe(1);
});

test('submission captures immutable inputs and waits for a poll; workers run serially through exit', async () => {
  const service = start();
  const submit = service.submitAction;
  const payload = {mode: 'normal', nested: {value: 1}};
  const first = submit('test', payload);
  payload.nested.value = 2;
  const second = submit('test', payload);
  sqlite
    .prepare('UPDATE scheduler_actions SET queued_at = ? WHERE id = ?')
    .run('2000-01-01', first);
  expect(repository.getAction(first)?.payload).toEqual({mode: 'normal', nested: {value: 1}});
  expect(repository.getAction(first)?.status).toBe('queued');
  service.tick();
  for (let i = 0; i < 20; i++) {
    service.tick();
  }
  expect(repository.getAction(first)?.status).toBe('running');
  expect(repository.getAction(second)?.status).toBe('queued');
  await expect.poll(() => repository.getAction(first)?.status).toBe('succeeded');
  expect(repository.getAction(first)?.result).toEqual({
    actionId: first,
    payload: {mode: 'normal', nested: {value: 1}},
  });
  expect(repository.getAction(second)?.status).toBe('queued');
  service.tick();
  await expect.poll(() => repository.getAction(second)?.status).toBe('succeeded');
});

test.each([
  ['missing', 'normal', 'Cannot find module'],
  ['invalid', 'normal', 'must export runAction'],
  ['bad-url', 'normal', 'scheme in: file'],
  ['test', 'throw', 'Worker exploded'],
  ['test', 'empty', 'without a completion report'],
  ['test', 'failed', 'Partial failure'],
  ['test', 'crash-after-report', 'Cleanup failed'],
  ['unknown', 'normal', 'Unknown action type'],
])(
  'fails %s / %s visibly and frees capacity only for a later tick',
  async (type, mode, message) => {
    const first = repository.insertAction(type, {mode});
    const second = repository.insertAction('test', {});
    sqlite
      .prepare('UPDATE scheduler_actions SET queued_at = ? WHERE id = ?')
      .run('2000-01-01', first);
    const service = start();
    service.tick();
    await expect.poll(() => repository.getAction(first)?.status).toBe('failed');
    expect(repository.getAction(first)?.error?.message).toContain(message);
    expect(repository.getAction(second)?.status).toBe('queued');
    if (mode === 'crash-after-report') {
      expect(repository.getAction(first)?.result).toEqual({completed: 2});
    }
    service.tick();
    await expect.poll(() => repository.getAction(second)?.status).toBe('succeeded');
  },
);

test('persists a deliberate failed report and continues with later queued work', async () => {
  const first = repository.insertAction('test', {mode: 'reported-failure'});
  const second = repository.insertAction('test', {});
  sqlite
    .prepare('UPDATE scheduler_actions SET queued_at = ? WHERE id = ?')
    .run('2000-01-01', first);
  const service = start();

  service.tick();
  await expect.poll(() => repository.getAction(first)?.status).toBe('failed');
  expect(repository.getAction(first)).toMatchObject({
    error: {message: 'Partial failure'},
    result: {
      applied: [{id: 'first'}],
      failed: [{id: 'second', reason: 'Unavailable'}],
      notAttempted: [{id: 'third'}],
    },
  });
  service.tick();
  await expect.poll(() => repository.getAction(second)?.status).toBe('succeeded');
});

test.each(['invalid-result', 'error-result'] as const)(
  'turns an unsupported %s into an ordinary worker failure without a result',
  async (mode) => {
    const service = start();
    const id = service.submitAction('test', {mode});

    service.tick();
    await expect.poll(() => repository.getAction(id)?.status).toBe('failed');
    expect(repository.getAction(id)?.result).toBeNull();
    expect(repository.getAction(id)?.error?.message).toContain('Action result');
  },
);

test.each(['claimNextAction', 'finishAction'] as const)(
  '%s failure halts subsequent dispatch',
  async (method) => {
    const id = repository.insertAction('test', {});
    vi.spyOn(repository, method).mockImplementation(() => {
      throw new Error('Database failure');
    });
    const service = start();
    service.tick();
    await expect.poll(() => reportError.mock.calls.length).toBe(1);
    const second = repository.insertAction('test', {});
    service.tick();
    expect(repository.getAction(second)?.status).toBe('queued');
    expect(repository.getAction(id)?.finishedAt).toBeNull();
  },
);

test('startup interrupts running work, preserves queued work, and never requeues terminals', () => {
  const id = repository.insertAction('test', {});
  repository.claimNextAction();
  const queued = repository.insertAction('test', {});
  start();
  expect(repository.getAction(id)?.status).toBe('interrupted');
  expect(repository.getAction(id)?.error?.message).toContain('External effects');
  expect(repository.getAction(queued)?.status).toBe('queued');
});

test('startup removes runs outside the retention period', async () => {
  const id = repository.insertAction('test', {});
  repository.claimNextAction();
  repository.finishAction(id, {status: 'succeeded', result: null, error: null});
  sqlite
    .prepare('UPDATE scheduler_actions SET finished_at = ? WHERE id = ?')
    .run('2000-01-01T00:00:00.000Z', id);

  start();

  await expect.poll(() => repository.getAction(id)).toBeUndefined();
});

test('failed recovery prevents startup and dispatch', () => {
  const id = repository.insertAction('test', {});
  vi.spyOn(repository, 'recoverRunningActions').mockImplementation(() => {
    throw new Error('Recovery failed');
  });
  scheduler = createScheduler({repository, entries, onError: reportError});
  expect(() => scheduler!.start()).toThrow('Recovery failed');
  scheduler.tick();
  expect(repository.getAction(id)?.status).toBe('queued');
});

test('shutdown confirms termination and interrupts active work while retaining the queue', async () => {
  const id = repository.insertAction('test', {mode: 'hang'});
  const service = start();
  service.tick();
  const queued = repository.insertAction('test', {});
  await service.stop();
  expect(repository.getAction(id)?.status).toBe('interrupted');
  service.tick();
  expect(repository.getAction(queued)?.status).toBe('queued');
});

test('submission rejects unregistered types, nonobjects, oversized and non-JSON payloads', () => {
  const service = start();
  const submit = service.submitAction;
  for (const type of ['unregistered', 'toString', '__proto__']) {
    expect(() => submit(type, {})).toThrow('Unknown action type');
  }
  for (const payload of [
    null,
    [],
    {value: undefined},
    {value: NaN},
    {value: 1n},
    {text: 'x'.repeat(16384)},
  ]) {
    expect(() => submit('test', payload)).toThrow();
  }
  expect(repository.listActions().active).toHaveLength(0);
});

test('a logged fixture action uses native TypeScript imports and writes a complete JSONL log', async () => {
  const service = start();
  const id = service.submitAction('logged', {value: 'test'});
  try {
    service.tick();
    await expect.poll(() => repository.getAction(id)?.status).toBe('succeeded');
    const lines = (await readFile(actionLogPath(id), 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    expect(lines.map((line) => line.message)).toEqual(['Fixture action completed']);
    expect(
      lines.every((line) => line.actionId === id && line.timestamp && line.level === 'info'),
    ).toBe(true);
    expect(repository.getAction(id)?.result).toEqual({value: 'test'});
  } finally {
    await service.stop();
    await rm(actionLogPath(id), {force: true});
  }
});

test('log creation failure is persisted even without usable logs', async () => {
  const service = start();
  const id = service.submitAction('logged', {value: 'test'});
  const path = actionLogPath(id);
  await mkdir(dirname(path), {recursive: true});
  await writeFile(path, 'existing log must not be overwritten');
  try {
    service.tick();
    await expect.poll(() => repository.getAction(id)?.status).toBe('failed');
    expect(repository.getAction(id)?.error?.message).toContain('EEXIST');
    expect(await readFile(path, 'utf8')).toBe('existing log must not be overwritten');
  } finally {
    await service.stop();
    await rm(path, {force: true});
  }
});

test('worker rejects invalid fixture arguments submitted through the low-level scheduler', async () => {
  const service = start();
  const id = service.submitAction('logged', {value: 1});
  expect(repository.getAction(id)?.status).toBe('queued');
  service.tick();
  await expect.poll(() => repository.getAction(id)?.status).toBe('failed');
  expect(repository.getAction(id)?.error?.message).toContain('Choose a string value');
  const next = service.submitAction('test', {});
  service.tick();
  await expect.poll(() => repository.getAction(next)?.status).toBe('succeeded');
});

test('graceful shutdown allows a clean completion and never starts queued work', async () => {
  const id = repository.insertAction('test', {});
  scheduler = createScheduler({
    repository,
    entries,
    onError: reportError,
    pollIntervalMs: 60_000,
    shutdownGraceMs: 2000,
  });
  scheduler.start();
  scheduler.tick();
  const queued = repository.insertAction('test', {});
  await scheduler.stop();
  expect(repository.getAction(id)?.status).toBe('succeeded');
  expect(repository.getAction(queued)?.status).toBe('queued');
});

test('the configured poll timer dispatches work without a producer invoking tick', async () => {
  scheduler = createScheduler({repository, entries, onError: reportError, pollIntervalMs: 20});
  scheduler.start();
  const id = scheduler.submitAction('test', {});
  expect(repository.getAction(id)?.status).toBe('queued');
  await expect.poll(() => repository.getAction(id)?.status).toBe('succeeded');
});

test('a long fixture action stays active and can be interrupted during shutdown', async () => {
  const service = start();
  const id = service.submitAction('test', {mode: 'hang'});
  service.tick();
  await expect.poll(() => repository.getAction(id)?.status).toBe('running');
  await service.stop();
  expect(repository.getAction(id)?.status).toBe('interrupted');
});
