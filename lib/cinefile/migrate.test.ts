import {mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, beforeEach, expect, test} from 'vitest';

import {migrateCinefileRequests} from './migrate.ts';

let directory: string;
let path: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'atlas-cinefile-migration-'));
  path = join(directory, 'requests.json');
});

afterEach(async () => {
  await rm(directory, {recursive: true, force: true});
});

test('backs up and migrates a legacy request array', async () => {
  const legacy = '[{"id":"one","tmdbId":42}]';
  await writeFile(path, legacy);

  const result = await migrateCinefileRequests(path);

  expect(result).toMatchObject({status: 'migrated', migratedRequests: 1});
  await expect(readFile(path, 'utf8')).resolves.toBe(
    '{"schema":1,"requests":[{"id":"one","tmdbId":42,"kind":"movie"}]}',
  );
  const backup = (await readdir(directory)).find((name) =>
    name.startsWith('requests.json.backup-'),
  );
  expect(backup).toBeDefined();
  await expect(readFile(join(directory, backup!), 'utf8')).resolves.toBe(legacy);
});

test('does not rewrite or back up an up-to-date request document', async () => {
  const current = '{"schema":1,"requests":[]}';
  await writeFile(path, current);

  await expect(migrateCinefileRequests(path)).resolves.toEqual({status: 'up-to-date'});
  await expect(readdir(directory)).resolves.toEqual(['requests.json']);
});

test('does nothing when the request file does not exist', async () => {
  await expect(migrateCinefileRequests(path)).resolves.toEqual({status: 'missing'});
});
