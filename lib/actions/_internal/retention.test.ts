import {DatabaseSync} from 'node:sqlite';
import {drizzle} from 'drizzle-orm/node-sqlite';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {migrateDatabase} from '#lib/database/migrate.ts';
import {createActionRepository} from './scheduler.db.ts';
import {cleanupExpiredActions} from './retention.ts';

let sqlite: DatabaseSync;
let repository: ReturnType<typeof createActionRepository>;

beforeEach(() => {
  sqlite = new DatabaseSync(':memory:');
  migrateDatabase(sqlite);
  repository = createActionRepository(drizzle({client: sqlite}));
});

afterEach(() => sqlite.close());

function finish(id: string, finishedAt: string) {
  repository.claimNextAction();
  repository.finishAction(id, {status: 'succeeded', result: null, error: null});
  sqlite.prepare('UPDATE scheduler_actions SET finished_at = ? WHERE id = ?').run(finishedAt, id);
}

test('removes terminal runs older than the configured retention period and their logs', async () => {
  const expired = repository.insertAction('test', {});
  finish(expired, '2026-07-01T00:00:00.000Z');
  const retained = repository.insertAction('test', {});
  finish(retained, '2026-09-05T00:00:00.000Z');
  const queued = repository.insertAction('test', {});
  const removeLog = vi.fn().mockResolvedValue(undefined);

  await expect(
    cleanupExpiredActions({
      repository,
      now: new Date('2026-09-10T00:00:00.000Z'),
      removeLog,
    }),
  ).resolves.toEqual({logsDeleted: 1, recordsDeleted: 1});

  expect(removeLog).toHaveBeenCalledWith(expired);
  expect(repository.getAction(expired)).toBeUndefined();
  expect(repository.getAction(retained)?.status).toBe('succeeded');
  expect(repository.getAction(queued)?.status).toBe('queued');
});

test('keeps the database record when log deletion fails so a later cleanup can retry', async () => {
  const expired = repository.insertAction('test', {});
  finish(expired, '2026-07-01T00:00:00.000Z');

  await expect(
    cleanupExpiredActions({
      repository,
      now: new Date('2026-09-10T00:00:00.000Z'),
      removeLog: vi.fn().mockRejectedValue(new Error('Disk unavailable')),
    }),
  ).rejects.toThrow('Disk unavailable');

  expect(repository.getAction(expired)?.status).toBe('succeeded');
});
