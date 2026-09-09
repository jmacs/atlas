import {randomUUID} from 'node:crypto';
import {mkdir, rm, writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {afterEach, expect, test} from 'vitest';
import {actionLogPath} from './logger.ts';
import {createActionLogReader} from './action-log-reader.ts';

const paths: string[] = [];

function testLog() {
  const id = randomUUID();
  const path = actionLogPath(id);
  paths.push(path);
  return {id, path};
}

afterEach(async () => {
  await Promise.all(paths.splice(0).map((path) => rm(path, {force: true, recursive: true})));
});

test('treats a missing action log as empty', async () => {
  const {id} = testLog();
  const reader = createActionLogReader(id);

  await expect(reader.read()).resolves.toEqual({records: [], warning: null, hasData: false});
  expect(reader.finish()).toBeNull();
  await reader.close();
});

test('decodes UTF-8 across read boundaries and reports an incomplete final line', async () => {
  const {id, path} = testLog();
  await mkdir(dirname(path), {recursive: true});
  const record = {message: 'x'.repeat(16_371) + '🌿 <script>unsafe()</script>'};
  await writeFile(path, `${JSON.stringify(record)}\n{"message":"unfinished`);
  const reader = createActionLogReader(id);

  const records: unknown[] = [];
  while (true) {
    const read = await reader.read();
    records.push(...read.records);
    if (!read.hasData) {
      break;
    }
  }

  expect(records).toEqual([record]);
  expect(reader.finish()).toBe('The action log ended with an incomplete line.');
  await reader.close();
});

test('reports an unreadable action log without throwing', async () => {
  const {id, path} = testLog();
  await mkdir(path, {recursive: true});
  const reader = createActionLogReader(id);

  const read = await reader.read();

  expect(read.records).toEqual([]);
  expect(read.hasData).toBe(false);
  expect(read.warning).toContain('Could not read action logs');
  expect(reader.finish()).toBe(read.warning);
  await reader.close();
});
