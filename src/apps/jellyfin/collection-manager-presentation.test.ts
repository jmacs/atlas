import type {CatalogReadResult} from '#lib/jellyfin/catalog.ts';
import {expect, test} from 'vitest';

import {
  collectionManagerCollectionItems,
  collectionManagerMovieItems,
  collectionManagerSelection,
  resolveCollectionManagerSelection,
} from './collection-manager-presentation.ts';

const catalog = {
  kind: 'ready',
  catalog: {
    version: 1,
    collections: [{id: 'classics', name: 'Classics', serverId: 'server'}],
    movies: [
      {id: 'arrival', name: 'Arrival', year: 2016, genres: ['Drama', 'Science Fiction']},
      {id: 'heat', name: 'Heat', year: 1995, genres: []},
    ],
    series: [],
    collectionMovieIds: {},
    movieCollectionIds: {},
    collectionSeriesIds: {},
    seriesCollectionIds: {},
    baseSnapshot: {pulledAt: '2026-01-02T03:04:05.000Z', collections: [], movies: [], series: []},
  },
} satisfies CatalogReadResult;

test('searches cached collections and movies with useful movie labels', () => {
  expect(collectionManagerCollectionItems(catalog, 'CLASS')).toEqual([
    {value: 'classics', name: 'Classics'},
  ]);
  expect(collectionManagerMovieItems(catalog, '2016')).toEqual([
    {
      value: 'arrival',
      name: 'Arrival (2016)',
      description: 'Drama, Science Fiction',
    },
  ]);
});

test('resolves a valid selection and removes duplicate movie IDs', () => {
  expect(
    resolveCollectionManagerSelection(catalog, 'classics', ['arrival', 'heat', 'arrival']),
  ).toEqual({
    kind: 'valid',
    collectionId: 'classics',
    collectionName: 'Classics',
    movieIds: ['arrival', 'heat'],
  });
});

test('rejects unknown catalog IDs and empty movie selections', () => {
  expect(resolveCollectionManagerSelection(catalog, 'missing', ['arrival'])).toMatchObject({
    kind: 'invalid',
  });
  expect(resolveCollectionManagerSelection(catalog, 'classics', [])).toMatchObject({
    kind: 'invalid',
  });
  expect(resolveCollectionManagerSelection(catalog, 'classics', ['missing'])).toMatchObject({
    kind: 'invalid',
  });
});

test('rebuilds known selections after a rejected submission', () => {
  expect(collectionManagerSelection(catalog, 'classics', ['heat', 'missing', 'heat'])).toEqual({
    collection: {value: 'classics', name: 'Classics'},
    movies: [{value: 'heat', name: 'Heat (1995)'}],
  });
});
