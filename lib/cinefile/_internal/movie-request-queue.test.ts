import {readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {mkdtemp} from 'node:fs/promises';
import {afterEach, beforeEach, expect, test} from 'vitest';

import {createMovieRequestQueue} from '../movie-requests.ts';

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
  const queue = createMovieRequestQueue(path);

  await expect(queue.read()).resolves.toEqual([]);
  await expect(readFile(path, 'utf8')).resolves.toBe('[]');
});

test('adds complete request metadata once and removes it by TMDB ID', async () => {
  const queue = createMovieRequestQueue(path);
  const movie = {posterPath: '/arrival.jpg', title: 'Arrival', tmdbId: 329865, year: 2016};

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

  await queue.remove(movie.tmdbId);

  await expect(queue.read()).resolves.toEqual([]);
});

test('preserves a missing TMDB release year as null', async () => {
  const queue = createMovieRequestQueue(path);

  const request = await queue.add({
    posterPath: null,
    title: 'Unreleased Movie',
    tmdbId: 123,
    year: null,
  });

  expect(request.year).toBeNull();
  expect(request.posterPath).toBeNull();
  await expect(readFile(path, 'utf8')).resolves.toContain('"year":null');
});

test('rejects an invalid saved request document', async () => {
  const queue = createMovieRequestQueue(path);
  await queue.read();
  await writeFile(path, '{not json');

  await expect(queue.read()).rejects.toThrow('Movie requests contain invalid JSON.');
});
