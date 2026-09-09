import {mkdirSync, mkdtempSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {drizzle} from 'drizzle-orm/node-sqlite';
import {expect, test} from 'vitest';
import {CONFIG} from '#lib/config.ts';
import {migrateDatabase} from '#lib/database/migrate.ts';
import {createActionRepository} from './scheduler.db.ts';

test('queued payloads survive reopening; ties are stable and claims cannot be repeated', () => {
  const root = join(CONFIG.paths.appData, 'tests');
  mkdirSync(root, {recursive: true});
  const directory = mkdtempSync(join(root, 'queue-'));
  const path = join(directory, 'atlas.sqlite');
  let sqlite = new DatabaseSync(path);
  try {
    migrateDatabase(sqlite);
    const first = createActionRepository(drizzle({client: sqlite})).insertAction('test', {
      value: 1,
    });
    const second = createActionRepository(drizzle({client: sqlite})).insertAction('test', {
      value: 2,
    });
    sqlite.prepare('UPDATE scheduler_actions SET queued_at = ?').run('2026-01-01T00:00:00.000Z');
    sqlite.close();
    sqlite = new DatabaseSync(path);
    migrateDatabase(sqlite);
    const repository = createActionRepository(drizzle({client: sqlite}));
    expect(repository.getAction(first)?.payload).toEqual({value: 1});
    const ordered = [first, second].sort();
    expect(repository.claimNextAction()?.id).toBe(ordered[0]);
    expect(repository.claimNextAction()?.id).toBe(ordered[1]);
    expect(repository.claimNextAction()).toBeUndefined();
    expect(sqlite.isTransaction).toBe(false);
    repository.finishAction(first, {
      status: 'failed',
      result: {completed: 1},
      error: {message: 'Failed'},
    });
    expect(() =>
      repository.finishAction(first, {status: 'succeeded', result: null, error: null}),
    ).toThrow('Could not finalize');
    expect(repository.getAction(first)?.result).toEqual({completed: 1});
    sqlite.close();
    sqlite = new DatabaseSync(path);
    migrateDatabase(sqlite);
    expect(createActionRepository(drizzle({client: sqlite})).getAction(first)).toMatchObject({
      status: 'failed',
      result: {completed: 1},
      error: {message: 'Failed'},
    });
  } finally {
    sqlite.close();
    rmSync(directory, {recursive: true});
  }
});

test('a failed claim rolls back its running transition', () => {
  const sqlite = new DatabaseSync(':memory:');
  try {
    migrateDatabase(sqlite);
    const repository = createActionRepository(drizzle({client: sqlite}));
    const id = repository.insertAction('test', {});
    sqlite.exec(
      `CREATE TRIGGER reject_claim BEFORE UPDATE ON scheduler_actions BEGIN SELECT RAISE(ABORT, 'Claim failed'); END`,
    );
    expect(() => repository.claimNextAction()).toThrow(
      expect.objectContaining({
        cause: expect.objectContaining({message: 'Claim failed'}),
      }),
    );
    expect(sqlite.isTransaction).toBe(false);
    expect(repository.getAction(id)?.status).toBe('queued');
  } finally {
    sqlite.close();
  }
});
