import {beforeEach, expect, test, vi} from 'vitest';

const getMovieDbMovie = vi.hoisted(() => vi.fn());
const getMovieDbTv = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({error: vi.fn()}));
const movieRequests = vi.hoisted(() => ({read: vi.fn()}));
const migrateCinefileRequests = vi.hoisted(() => vi.fn());

vi.mock('#lib/cinefile/requests.ts', () => ({
  createCinefileRequestQueue: () => movieRequests,
}));
vi.mock('#lib/cinefile/migrate.ts', () => ({migrateCinefileRequests}));
vi.mock('#lib/movie-db/movie-details.ts', () => ({getMovieDbMovie}));
vi.mock('#lib/movie-db/tv-details.ts', () => ({getMovieDbTv}));
vi.mock('../../system/logger.ts', () => ({logger}));

import {cinefileAdminApp} from './app.tsx';

const requests = [
  {
    id: 'request-older',
    kind: 'movie',
    posterPath: '/older.jpg',
    requestedAt: '2026-09-18T12:00:00.000Z',
    title: 'Older Movie',
    tmdbId: 1,
    year: 2001,
  },
  {
    id: 'request-newer',
    kind: 'movie',
    posterPath: '/arrival.jpg',
    requestedAt: '2026-09-19T12:00:00.000Z',
    title: 'Arrival',
    tmdbId: 329865,
    year: 2016,
  },
];

beforeEach(() => {
  vi.resetAllMocks();
  movieRequests.read.mockResolvedValue(requests);
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
  getMovieDbTv.mockResolvedValue({
    id: 1399,
    title: 'Game of Thrones',
    year: 2011,
    posterPath: '/got.jpg',
    backdropPath: '/got-backdrop.jpg',
    genres: ['Drama'],
    rating: 8.5,
    episodeRuntimeMinutes: 60,
    numberOfEpisodes: 73,
    numberOfSeasons: 8,
  });
  migrateCinefileRequests.mockResolvedValue({status: 'up-to-date'});
});

test('renders the standard home page with media request navigation', async () => {
  const response = await cinefileAdminApp.app.request('/');
  const document = await response.text();

  expect(response.status).toBe(200);
  expect(document).toContain('Cinefile Admin');
  expect(document).toContain('Media Requests');
  expect(document).toContain('href="/cinefile-admin/requests"');
  expect(document).toContain('Upgrade request schema');
});

test('runs the Cinefile request migration from the admin page', async () => {
  migrateCinefileRequests.mockResolvedValue({
    backupPath: '/data/requests.json.backup',
    migratedRequests: 2,
    status: 'migrated',
  });

  const response = await cinefileAdminApp.app.request('/migrate', {method: 'POST'});
  const document = await response.text();

  expect(response.status).toBe(200);
  expect(migrateCinefileRequests).toHaveBeenCalledOnce();
  expect(document).toContain('Upgraded 2 requests.');
  expect(document).toContain('/data/requests.json.backup');
});

test('lists every request newest first and links to request details', async () => {
  const response = await cinefileAdminApp.app.request('/requests');
  const document = await response.text();

  expect(response.status).toBe(200);
  expect(document.indexOf('Arrival')).toBeLessThan(document.indexOf('Older Movie'));
  expect(document).toContain('href="/cinefile-admin/requests/request-newer"');
  expect(document).toContain('href="/cinefile-admin/requests/request-older"');
  expect(document).toContain('2 requests');
});

test('renders request and movie details with inert action placeholders', async () => {
  const response = await cinefileAdminApp.app.request('/requests/request-newer');
  const document = await response.text();

  expect(response.status).toBe(200);
  expect(getMovieDbMovie).toHaveBeenCalledWith(329865);
  expect(document).toContain('Why are they here?');
  expect(document).toContain('Overview');
  expect(document).toContain('1h 56m');
  expect(document).toContain('7.6 out of 10');
  expect(document).toContain('https://image.tmdb.org/t/p/w1280/arrival-backdrop.jpg');
  expect(document).toContain('Request details');
  expect(document).toContain('request-newer');
  expect(document).toContain('Mark request as complete');
  expect(document).toContain('Search');
  expect(document).not.toContain('hx-post');
});

test('returns not found for an unknown request', async () => {
  const response = await cinefileAdminApp.app.request('/requests/missing');

  expect(response.status).toBe(404);
  expect(getMovieDbMovie).not.toHaveBeenCalled();
});

test('loads TV details for a TV series request', async () => {
  movieRequests.read.mockResolvedValue([
    {
      id: 'request-tv',
      kind: 'tvseries',
      posterPath: '/got.jpg',
      requestedAt: '2026-09-19T12:00:00.000Z',
      title: 'Game of Thrones',
      tmdbId: 1399,
      year: 2011,
    },
  ]);

  const response = await cinefileAdminApp.app.request('/requests/request-tv');
  const document = await response.text();

  expect(response.status).toBe(200);
  expect(getMovieDbTv).toHaveBeenCalledWith(1399);
  expect(getMovieDbMovie).not.toHaveBeenCalled();
  expect(document).toContain('TV series');
  expect(document).toContain('8 seasons');
  expect(document).toContain('1h per episode');
});

test('falls back to saved request data when TMDB is unavailable', async () => {
  const error = new Error('TMDB unavailable');
  getMovieDbMovie.mockRejectedValue(error);

  const response = await cinefileAdminApp.app.request('/requests/request-newer');
  const document = await response.text();

  expect(response.status).toBe(502);
  expect(document).toContain('TMDB details are unavailable.');
  expect(document).toContain('Arrival');
  expect(document).toContain('https://image.tmdb.org/t/p/w500/arrival.jpg');
  expect(logger.error).toHaveBeenCalledWith(
    {err: error, requestId: 'request-newer', tmdbId: 329865},
    'Loading Cinefile Admin TMDB details failed',
  );
});
