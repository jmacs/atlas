import {beforeEach, expect, test, vi} from 'vitest';

const catalogStore = vi.hoisted(() => ({read: vi.fn()}));
const searchMovieDb = vi.hoisted(() => vi.fn());

vi.mock('#lib/jellyfin/catalog.ts', () => ({
  createCatalogStore: () => catalogStore,
}));

vi.mock('#lib/config.ts', () => ({
  CONFIG: {JELLYFIN_SERVER: 'https://jellyfin.example.com'},
}));

vi.mock('#lib/movie-db/movie-search.ts', () => ({searchMovieDb}));

import {cinefileApp} from './app.tsx';

beforeEach(() => {
  vi.resetAllMocks();
  catalogStore.read.mockResolvedValue({
    kind: 'ready',
    catalog: {
      movies: [
        {id: 'moon-1', name: 'Moon', year: 2009},
        {id: 'moon-2', name: 'Moonfall', year: 2022},
        {id: 'other', name: 'Sunshine', year: 2007},
      ],
    },
  });
});

test('searches the catalog case-insensitively and renders movie tiles', async () => {
  const response = await cinefileApp.app.request('/search/results?q=MOON');
  const document = await response.text();

  expect(response.status).toBe(200);
  expect(document).toContain('Moon</span>');
  expect(document).toContain('Moonfall</span>');
  expect(document).not.toContain('Sunshine</span>');
  expect(document).toContain('/cinefile/movies/catalog/moon-1');
  expect(document).toContain(
    'https://jellyfin.example.com/Items/moon-1/Images/Primary?maxWidth=342',
  );
  expect(document).toContain('2 matches for “MOON”');
});

test('shows up to 50 catalog matches and summarizes the remaining results', async () => {
  catalogStore.read.mockResolvedValue({
    kind: 'ready',
    catalog: {
      movies: Array.from({length: 52}, (_, index) => ({
        id: `movie-${index + 1}`,
        name: `Movie ${index + 1}`,
        year: 2000 + index,
      })),
    },
  });

  const response = await cinefileApp.app.request('/search/results?q=Movie');
  const document = await response.text();

  expect(response.status).toBe(200);
  expect(document).toContain('/cinefile/movies/catalog/movie-50');
  expect(document).not.toContain('/cinefile/movies/catalog/movie-51');
  expect(document).toContain('52 matches for “Movie”');
  expect(document).toContain('+ 2 more');
  expect(document).toContain('Catelog search results');
});

test('offers a Movie DB search when the catalog has no match', async () => {
  const response = await cinefileApp.app.request('/search/results?q=Arrival');
  const document = await response.text();

  expect(document).toContain('not in your catalog');
  expect(document).toContain('Search for movie on TMDB');
  expect(document).toContain('/cinefile/tmdb-search/results?q=Arrival');
});

test('renders Movie DB results as tiles', async () => {
  searchMovieDb.mockResolvedValue([
    {id: 329865, title: 'Arrival', year: 2016, posterPath: '/arrival.jpg'},
  ]);

  const response = await cinefileApp.app.request('/tmdb-search/results?q=Arrival');
  const document = await response.text();

  expect(response.status).toBe(200);
  expect(searchMovieDb).toHaveBeenCalledWith('Arrival');
  expect(document).toContain('https://image.tmdb.org/t/p/w342/arrival.jpg');
  expect(document).toContain('/cinefile/movies/tmdb/329865?title=Arrival&amp;year=2016');
  expect(document).toContain('1 match for “Arrival”');
  expect(document).toContain('TMDB search results');
});

test('shows no more than 25 Movie DB results', async () => {
  searchMovieDb.mockResolvedValue(
    Array.from({length: 27}, (_, index) => ({
      id: index + 1,
      title: `Movie ${index + 1}`,
      year: 2000 + index,
    })),
  );

  const response = await cinefileApp.app.request('/tmdb-search/results?q=Movie');
  const document = await response.text();

  expect(response.status).toBe(200);
  expect(document).toContain('/cinefile/movies/tmdb/25?title=Movie+25&amp;year=2024');
  expect(document).not.toContain('/cinefile/movies/tmdb/26?');
  expect(document).toContain('25 matches for “Movie”');
});

test('uses the same movie page for catalog and Movie DB movie stubs', async () => {
  const catalogResponse = await cinefileApp.app.request('/movies/catalog/moon-1');
  const movieDbResponse = await cinefileApp.app.request(
    '/movies/tmdb/329865?title=Arrival&year=2016',
  );

  await expect(catalogResponse.text()).resolves.toContain('Movie details are coming soon.');
  await expect(movieDbResponse.text()).resolves.toContain('Movie details are coming soon.');
});
