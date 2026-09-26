import {readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {mkdtemp} from 'node:fs/promises';
import {afterEach, beforeEach, expect, test} from 'vitest';

import {createCinefileRequestQueue} from '../requests.ts';

let directory: string;
let path: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'atlas-cinefile-requests-'));
  path = join(directory, 'cinefile', 'requests.json');
});

afterEach(async () => {
  await rm(directory, {recursive: true, force: true});
});

test('lazily creates an empty request file when first read', async () => {
  const queue = createCinefileRequestQueue(path);

  await expect(queue.read()).resolves.toEqual([]);
  await expect(readFile(path, 'utf8')).resolves.toBe('{"schema":1,"requests":[]}');
});

test('adds complete request metadata once and removes it by TMDB ID', async () => {
  const queue = createCinefileRequestQueue(path);
  const movie = {
    kind: 'movie' as const,
    posterPath: '/arrival.jpg',
    title: 'Arrival',
    tmdbId: 329865,
    year: 2016,
  };

  const [first, duplicate] = await Promise.all([queue.add(movie), queue.add(movie)]);

  expect(first).toEqual({
    id: expect.stringMatching(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    ),
    requestedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    ...movie,
  });
  expect(duplicate).toEqual(first);
  await expect(queue.read()).resolves.toEqual([first]);

  await queue.remove(movie.kind, movie.tmdbId);

  await expect(queue.read()).resolves.toEqual([]);
});

test('preserves a missing TMDB release year as null', async () => {
  const queue = createCinefileRequestQueue(path);

  const request = await queue.add({
    kind: 'movie',
    posterPath: null,
    title: 'Unreleased Movie',
    tmdbId: 123,
    year: null,
  });

  expect(request.year).toBeNull();
  expect(request.posterPath).toBeNull();
  const document = JSON.parse(await readFile(path, 'utf8')) as {requests: Array<{year: unknown}>};
  expect(document.requests[0]?.year).toBeNull();
});

test('rejects an invalid saved request document', async () => {
  const queue = createCinefileRequestQueue(path);
  await queue.read();
  await writeFile(path, '{not json');

  await expect(queue.read()).rejects.toThrow('Cinefile requests contain invalid JSON.');
});

test('allows a movie and TV series to share a TMDB ID', async () => {
  const queue = createCinefileRequestQueue(path);

  await queue.add({kind: 'movie', posterPath: null, title: 'Movie', tmdbId: 42, year: null});
  await queue.add({kind: 'tvseries', posterPath: null, title: 'Series', tmdbId: 42, year: null});

  await expect(queue.read()).resolves.toEqual([
    expect.objectContaining({kind: 'movie', tmdbId: 42}),
    expect.objectContaining({kind: 'tvseries', tmdbId: 42}),
  ]);
});
