import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect, test} from 'vitest';

import {archiveAndClearApplicationLog} from './application-log.ts';

test('archives and recreates the application log', async () => {
  const archiveDirectory = await mkdtemp(join(tmpdir(), 'atlas-log-'));
  const logPath = join(archiveDirectory, 'atlas.log');
  try {
    await writeFile(logPath, 'first entry\n');

    const result = await archiveAndClearApplicationLog({archiveDirectory, logPath, timestamp: 123});

    expect(result).toEqual({archivePath: join(archiveDirectory, 'atlas.123.log'), archived: true});
    await expect(readFile(result.archivePath, 'utf8')).resolves.toBe('first entry\n');
    await expect(readFile(logPath, 'utf8')).resolves.toBe('');
  } finally {
    await rm(archiveDirectory, {force: true, recursive: true});
  }
});
