import {expect, it} from 'vitest';
import {baselineCatalog, collections, movies} from './catalog.ts';
import {createCatalog} from '../lib/jellyfin/_internal/catalog.ts';
import {validateCatalog} from '../lib/jellyfin/_internal/catalog-validation.ts';

it('provides a valid baseline with every movie genre and decade represented by a collection', () => {
  const catalog = createCatalog(baselineCatalog, '2026-01-01T00:00:00Z');
  expect(validateCatalog(catalog)).toEqual(catalog);
  for (let decade = 1940; decade <= 2020; decade += 10) {
    const members = movies.filter((movie) => Math.floor(movie.year / 10) * 10 === decade);
    expect(members.length).toBeGreaterThanOrEqual(2);
    expect(collections.find((collection) => collection.name === `${decade}s`)?.movieIds).toEqual(
      members.map((movie) => movie.id),
    );
  }
  for (const genre of new Set(movies.flatMap((movie) => movie.genres))) {
    expect(collections.find((collection) => collection.name === genre)?.movieIds).toEqual(
      movies.filter((movie) => movie.genres.includes(genre)).map((movie) => movie.id),
    );
  }
});
