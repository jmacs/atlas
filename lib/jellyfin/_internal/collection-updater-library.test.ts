import {mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, describe, expect, test} from 'vitest';
import {createCollectionUpdaterLibrary} from './collection-updater-library.ts';
import {createCollectionUpdaterStore} from './collection-updater-store.ts';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, {recursive: true})));
});

describe('collection updater store', () => {
  test('treats a missing file as empty and never trusts malformed or invalid saved documents', async () => {
    const path = await updaterPath();
    const store = createCollectionUpdaterStore(path);
    await expect(store.read()).resolves.toEqual([]);

    for (const value of [
      '{not json',
      JSON.stringify([{id: '', enabled: true, ...updater('a')}]),
      JSON.stringify([{id: 'one', enabled: 'yes', ...updater('a')}]),
      JSON.stringify([
        {id: 'one', enabled: true, ...updater('a')},
        {id: 'one', enabled: false, ...updater('b')},
      ]),
      JSON.stringify([{id: 'one', enabled: true, ...updater('a', [])}]),
    ]) {
      await writeFile(path, value);
      await expect(store.read()).rejects.toThrow('Saved collection updaters');
    }
  });

  test('validates before replacement and cleans up a temporary file after rename failure', async () => {
    const path = await updaterPath();
    const store = createCollectionUpdaterStore(path);
    const previous = [{id: 'one', enabled: true, ...updater('a')}];
    await store.replace(previous);
    const before = await readFile(path, 'utf8');

    await expect(store.replace([{id: 'one', enabled: true, ...updater('a', [])}])).rejects.toThrow(
      'must not be empty',
    );
    await expect(readFile(path, 'utf8')).resolves.toBe(before);

    const destinationDirectory = await updaterPath('blocked.json');
    await mkdir(destinationDirectory);
    const failingStore = createCollectionUpdaterStore(destinationDirectory);
    await expect(failingStore.replace(previous)).rejects.toThrow();
    const parentContents = await readdir(join(destinationDirectory, '..'));
    expect(parentContents.filter((name) => name.endsWith('.collection-updaters.json'))).toEqual([]);
  });
});

describe('collection updater library', () => {
  test('replaces the complete saved document after validating it', async () => {
    const path = await updaterPath();
    const library = createCollectionUpdaterLibrary({store: createCollectionUpdaterStore(path)});
    const proposed = [
      {id: 'one', enabled: true, collectionId: 'a', conditions: [yearCondition()]},
      {id: 'two', enabled: false, collectionId: 'b', conditions: [yearCondition()]},
    ];

    const replaced = await library.replace(proposed);
    expect(replaced).toEqual(proposed);
    expect(await library.list()).toEqual(proposed);

    expect(await library.replace([{...proposed[0], enabled: 'yes'}])).toMatchObject({
      code: 'collection_updater_invalid',
      path: 'collectionUpdaters[0].enabled',
    });
    expect(await library.list()).toEqual(proposed);
  });
});

function updater(collectionId: string, conditions = [yearCondition()]) {
  return {collectionId, conditions};
}

function yearCondition() {
  return {field: 'movie.year' as const, operator: 'gte' as const, value: 2000};
}

async function updaterPath(name = 'collection-updaters.json'): Promise<string> {
  const directory = await (
    await import('node:fs/promises')
  ).mkdtemp(join(tmpdir(), 'atlas-updaters-'));
  directories.push(directory);
  return join(directory, name);
}
