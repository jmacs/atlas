import {beforeEach, expect, test, vi} from 'vitest';

const catalogStore = vi.hoisted(() => ({read: vi.fn()}));
const getMovieDbMovie = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({error: vi.fn()}));
const movieRequests = vi.hoisted(() => ({add: vi.fn(), read: vi.fn(), remove: vi.fn()}));
const searchMovieDb = vi.hoisted(() => vi.fn());

vi.mock('#lib/cinefile/movie-requests.ts', () => ({
  createMovieRequestQueue: () => movieRequests,
}));

vi.mock('#lib/jellyfin/catalog.ts', () => ({
  createCatalogStore: () => catalogStore,
}));

vi.mock('#lib/config.ts', () => ({
  CONFIG: {JELLYFIN_SERVER: 'https://jellyfin.example.com'},
}));

vi.mock('#lib/movie-db/movie-details.ts', () => ({getMovieDbMovie}));
vi.mock('#lib/movie-db/movie-search.ts', () => ({searchMovieDb}));
vi.mock('../../system/logger.ts', () => ({logger}));

import {cinefileApp} from './app.tsx';

beforeEach(() => {
  vi.resetAllMocks();
  catalogStore.read.mockResolvedValue({
    kind: 'ready',
    catalog: {
      movies: [
        {id: 'moon-1', name: 'Moon', tmdbId: 17431, year: 2009, genres: ['Science Fiction']},
        {id: 'moon-2', name: 'Moonfall', year: 2022},
        {id: 'other', name: 'Sunshine', year: 2007},
      ],
    },
  });
  getMovieDbMovie.mockResolvedValue({
    id: 329865,
    title: 'Arrival',
    year: 2016,
    posterPath: '/arrival.jpg',
    backdropPath: '/arrival-backdrop.jpg',
    genres: ['Drama', 'Science Fiction'],
    overview: 'A linguist works with the military to communicate with alien lifeforms.',
    rating: 7.6,
    runtimeMinutes: 116,
    tagline: 'Why are they here?',
  });
  movieRequests.add.mockResolvedValue({
    id: 'request-1',
    title: 'Arrival',
    tmdbId: 329865,
    year: 2016,
  });
  movieRequests.read.mockResolvedValue([]);
  movieRequests.remove.mockResolvedValue(undefined);
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
  expect(document).toContain('/cinefile/movies/tmdb/329865');
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
  expect(document).toContain('/cinefile/movies/tmdb/25');
  expect(document).not.toContain('/cinefile/movies/tmdb/26');
  expect(document).toContain('25 matches for “Movie”');
});

test('uses the same detailed movie page for catalog and Movie DB movies', async () => {
  const catalogResponse = await cinefileApp.app.request('/movies/catalog/moon-1');
  const movieDbResponse = await cinefileApp.app.request('/movies/tmdb/329865');

  const catalogDocument = await catalogResponse.text();
  const movieDbDocument = await movieDbResponse.text();

  expect(getMovieDbMovie).toHaveBeenCalledWith(17431);
  expect(catalogDocument).toContain('In your catalog');
  expect(movieDbDocument).toContain('Not in your catalog');
  expect(movieDbDocument).toContain('Why are they here?');
  expect(movieDbDocument).toContain('Overview');
  expect(movieDbDocument).toContain('1h 56m');
  expect(movieDbDocument).toContain('7.6 out of 10');
  expect(movieDbDocument).toContain('https://image.tmdb.org/t/p/w1280/arrival-backdrop.jpg');
});

test('recognizes a TMDB movie already present in the catalog', async () => {
  const response = await cinefileApp.app.request('/movies/tmdb/17431');

  expect(response.status).toBe(200);
  await expect(response.text()).resolves.toContain('In your catalog');
});

test('falls back to cached catalog information when TMDB details are unavailable', async () => {
  const error = new Error('TMDB unavailable');
  getMovieDbMovie.mockRejectedValueOnce(error);

  const response = await cinefileApp.app.request('/movies/catalog/moon-1');
  const document = await response.text();

  expect(response.status).toBe(200);
  expect(document).toContain('TMDB details are unavailable.');
  expect(document).toContain('Showing the information saved in your catalog.');
  expect(document).toContain('Moon</h1>');
  expect(document).toContain('role="alert"');
  expect(logger.error).toHaveBeenCalledWith(
    {err: error, movieId: 17431},
    'Loading TMDB movie details failed',
  );
});

test('renders a graceful error when a TMDB movie cannot be loaded', async () => {
  const error = new Error('TMDB unavailable');
  getMovieDbMovie.mockRejectedValueOnce(error);

  const response = await cinefileApp.app.request('/movies/tmdb/329865');
  const document = await response.text();

  expect(response.status).toBe(502);
  expect(document).toContain('TMDB movie details are unavailable right now.');
  expect(document).toContain('role="alert"');
  expect(logger.error).toHaveBeenCalledWith(
    {err: error, movieId: 329865},
    'Loading TMDB movie details failed',
  );
});

test('shows an honest status when the catalog cannot be read', async () => {
  catalogStore.read.mockResolvedValue({kind: 'missing'});

  const response = await cinefileApp.app.request('/movies/tmdb/329865');

  expect(response.status).toBe(200);
  await expect(response.text()).resolves.toContain('Catalog unavailable');
});

test('offers a primary get action for a movie missing from the catalog', async () => {
  const response = await cinefileApp.app.request('/movies/tmdb/329865');
  const document = await response.text();

  expect(document).toContain('Get this movie');
  expect(document).toContain('Request that this movie be added to your Jellyfin catalog.');
  expect(document).toContain('hx-post="/cinefile/movies/tmdb/329865/request"');
  expect(document).toContain('bg-accent');
});

test('offers a danger action when the movie is already requested', async () => {
  movieRequests.read.mockResolvedValue([
    {id: 'request-1', title: 'Arrival', tmdbId: 329865, year: 2016},
  ]);

  const response = await cinefileApp.app.request('/movies/tmdb/329865');
  const document = await response.text();

  expect(document).toContain('Remove from request queue');
  expect(document).toContain('hx-delete="/cinefile/movies/tmdb/329865/request"');
  expect(document).toContain('bg-danger');
});

test('adds a movie request and swaps in the remove action', async () => {
  const response = await cinefileApp.app.request('/movies/tmdb/329865/request', {method: 'POST'});
  const document = await response.text();

  expect(movieRequests.add).toHaveBeenCalledWith({
    title: 'Arrival',
    tmdbId: 329865,
    year: 2016,
  });
  expect(document).toContain('Remove from request queue');
  expect(document).toContain('hx-swap-oob="outerHTML"');
  expect(document).toContain('Arrival was added to the request queue.');
});

test('removes a movie request and swaps in the get action', async () => {
  const response = await cinefileApp.app.request('/movies/tmdb/329865/request', {
    method: 'DELETE',
  });
  const document = await response.text();

  expect(movieRequests.remove).toHaveBeenCalledWith(329865);
  expect(document).toContain('Get this movie');
  expect(document).toContain('The movie was removed from the request queue.');
});

test('shows an error toast when a movie request cannot be saved', async () => {
  const error = new Error('disk full');
  movieRequests.add.mockRejectedValue(error);

  const response = await cinefileApp.app.request('/movies/tmdb/329865/request', {method: 'POST'});
  const document = await response.text();

  expect(response.status).toBe(200);
  expect(document).toContain('The movie could not be added to the request queue. Try again.');
  expect(document).toContain('role="alert"');
  expect(logger.error).toHaveBeenCalledWith(
    {err: error, movieId: 329865},
    'Adding Cinefile movie request failed',
  );
});

test('shows an error toast when the movie request queue cannot be read', async () => {
  const error = new Error('invalid requests file');
  movieRequests.read.mockRejectedValue(error);

  const response = await cinefileApp.app.request('/movies/tmdb/329865');
  const document = await response.text();

  expect(document).toContain('The movie request queue could not be loaded.');
  expect(document).toContain('role="alert"');
  expect(document).not.toContain('Get this movie');
  expect(logger.error).toHaveBeenCalledWith(
    {err: error, movieId: 329865},
    'Loading Cinefile movie requests failed',
  );
});
