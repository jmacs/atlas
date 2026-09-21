import {Hono} from 'hono';

import {createMovieRequestQueue, type MovieRequest} from '#lib/cinefile/movie-requests.ts';
import {CONFIG} from '#lib/config.ts';
import {createCatalogStore} from '#lib/jellyfin/catalog.ts';
import {getMovieDbMovie, type MovieDbMovieDetails} from '#lib/movie-db/movie-details.ts';
import {searchMovieDb} from '#lib/movie-db/movie-search.ts';
import type {AtlasApp, AtlasEnv} from '../../system/contracts.ts';
import {logger} from '../../system/logger.ts';
import {Alert} from '../../ui/Alert.tsx';
import {Toast} from '../../ui/Toast.tsx';
import {CinefileHomePage} from './CinefileHomePage.tsx';
import {
  CinefileMoviePage,
  MovieRequestAction,
  type CatalogStatus,
  type CinefileMovie,
  type CinefileMovieDetails,
  type MovieRequestStatus,
} from './CinefileMovie.tsx';
import {CinefileSearchPage} from './CinefileSearchPage.tsx';
import {CinefileTmdbSearchPage} from './CinefileTmdbSearchPage.tsx';
import {CinefileLayout} from './CinefileLayout.tsx';
import {CinefileRequestsPage} from './CinefileRequestsPage.tsx';

const app = new Hono<AtlasEnv>();
const movieRequests = createMovieRequestQueue();
const CATALOG_SEARCH_RESULT_LIMIT = 50;
const TMDB_SEARCH_RESULT_LIMIT = 25;

app.get('/', (c) => c.html(<CinefileHomePage />));
app.get('/search', (c) => c.html(<CinefileSearchPage status="form" />));

app.get('/search/results', async (c) => {
  const query = c.req.query('q')?.trim();
  if (!query) {
    return c.html(<CinefileSearchPage status="form" />);
  }

  const catalog = await createCatalogStore().read();
  if (catalog.kind !== 'ready') {
    return c.html(<CinefileSearchPage query={query} status="unavailable" />);
  }
  const normalizedQuery = query.toLocaleLowerCase();
  const matches = catalog.catalog.movies.filter((movie) =>
    movie.name.toLocaleLowerCase().includes(normalizedQuery),
  );
  const results = matches
    .slice(0, CATALOG_SEARCH_RESULT_LIMIT)
    .map((movie) => catalogMovie(movie.id, movie.name, movie.year));
  const status = matches.length === 0 ? 'empty' : 'results';
  return c.html(
    <CinefileSearchPage
      query={query}
      resultCount={matches.length}
      results={results}
      status={status}
    />,
  );
});

app.get('/movies/catalog/:movieId', async (c) => {
  const catalog = await createCatalogStore().read();
  const movie =
    catalog.kind === 'ready'
      ? catalog.catalog.movies.find((item) => item.id === c.req.param('movieId'))
      : undefined;
  if (!movie) {
    return c.notFound();
  }
  const movieDbDetails =
    movie.tmdbId === undefined ? undefined : await optionalMovieDbMovie(movie.tmdbId);
  return c.html(
    <CinefileLayout title={movie.name}>
      <CinefileMoviePage movie={catalogMoviePage(movie, movieDbDetails)} />
    </CinefileLayout>,
  );
});

app.get('/tmdb-search', (c) => c.html(<CinefileTmdbSearchPage status="form" />));

app.get('/requests', async (c) => {
  try {
    const requests = await movieRequests.read();
    const movies = requests
      .toSorted((left, right) => right.requestedAt.localeCompare(left.requestedAt))
      .map((request) => requestedMovie(request));
    const status = movies.length === 0 ? 'empty' : 'results';
    return c.html(<CinefileRequestsPage movies={movies} status={status} />);
  } catch (error) {
    logger.error({err: error}, 'Loading Cinefile movie requests failed');
    return c.html(<CinefileRequestsPage movies={[]} status="error" />, 502);
  }
});

app.get('/tmdb-search/results', async (c) => {
  const query = c.req.query('q')?.trim();
  if (!query) {
    return c.html(<CinefileTmdbSearchPage status="form" />);
  }
  try {
    const [movies, catalog] = await Promise.all([
      searchMovieDb(query),
      createCatalogStore().read(),
    ]);
    const catalogTmdbIds =
      catalog.kind === 'ready'
        ? new Set(
            catalog.catalog.movies.flatMap(({tmdbId}) => (tmdbId === undefined ? [] : [tmdbId])),
          )
        : new Set<number>();
    const results = movies
      .slice(0, TMDB_SEARCH_RESULT_LIMIT)
      .map((movie) => movieDbMovie(movie, catalogTmdbIds.has(movie.id)));
    const status = results.length === 0 ? 'empty' : 'results';
    return c.html(<CinefileTmdbSearchPage query={query} results={results} status={status} />);
  } catch {
    return c.html(<CinefileTmdbSearchPage query={query} status="error" />, 502);
  }
});

app.get('/movies/tmdb/:movieId', async (c) => {
  const movieId = Number(c.req.param('movieId'));
  if (!Number.isSafeInteger(movieId) || movieId <= 0) {
    return c.notFound();
  }
  const [movie, catalog] = await Promise.all([
    optionalMovieDbMovie(movieId),
    createCatalogStore().read(),
  ]);
  if (movie === undefined) {
    return c.html(
      <CinefileLayout title="Movie unavailable">
        <Alert variant="warning">
          TMDB movie details are unavailable right now. Please try again later.
        </Alert>
      </CinefileLayout>,
      502,
    );
  }
  let catalogStatus: CatalogStatus = 'unavailable';
  if (catalog.kind === 'ready') {
    catalogStatus = catalog.catalog.movies.some(({tmdbId}) => tmdbId === movieId)
      ? 'included'
      : 'not-included';
  }
  let requestStatus: MovieRequestStatus | undefined;
  let requestReadFailed = false;
  if (catalogStatus === 'not-included') {
    try {
      const requests = await movieRequests.read();
      requestStatus = requests.some(({tmdbId}) => tmdbId === movieId)
        ? 'requested'
        : 'not-requested';
    } catch (error) {
      requestStatus = 'unavailable';
      requestReadFailed = true;
      logger.error({err: error, movieId}, 'Loading Cinefile movie requests failed');
    }
  }
  return c.html(
    <CinefileLayout
      title={movie.title}
      notifications={
        requestReadFailed ? (
          <Toast variant="error">The movie request queue could not be loaded.</Toast>
        ) : undefined
      }
    >
      <CinefileMoviePage movie={movieDbMoviePage(movie, catalogStatus, requestStatus)} />
    </CinefileLayout>,
  );
});

app.post('/movies/tmdb/:movieId/request', async (c) => {
  const movieId = validMovieId(c.req.param('movieId'));
  if (movieId === undefined) {
    return c.notFound();
  }
  try {
    const [movie, catalog] = await Promise.all([
      getMovieDbMovie(movieId),
      createCatalogStore().read(),
    ]);
    if (catalog.kind !== 'ready') {
      throw new Error('The Jellyfin catalog is unavailable.');
    }
    if (catalog.catalog.movies.some(({tmdbId}) => tmdbId === movieId)) {
      throw new Error('The movie is already in the Jellyfin catalog.');
    }
    await movieRequests.add({
      posterPath: movie.posterPath ?? null,
      title: movie.title,
      tmdbId: movie.id,
      year: movie.year ?? null,
    });
    return c.html(
      <>
        <MovieRequestAction oob status="requested" tmdbId={movieId} />
        <Toast oob variant="success">
          {movie.title} was added to the request queue.
        </Toast>
      </>,
    );
  } catch (error) {
    logger.error({err: error, movieId}, 'Adding Cinefile movie request failed');
    return c.html(
      <Toast oob variant="error">
        The movie could not be added to the request queue. Try again.
      </Toast>,
    );
  }
});

app.delete('/movies/tmdb/:movieId/request', async (c) => {
  const movieId = validMovieId(c.req.param('movieId'));
  if (movieId === undefined) {
    return c.notFound();
  }
  try {
    await movieRequests.remove(movieId);
    return c.html(
      <>
        <MovieRequestAction oob status="not-requested" tmdbId={movieId} />
        <Toast oob variant="success">
          The movie was removed from the request queue.
        </Toast>
      </>,
    );
  } catch (error) {
    logger.error({err: error, movieId}, 'Removing Cinefile movie request failed');
    return c.html(
      <Toast oob variant="error">
        The movie could not be removed from the request queue. Try again.
      </Toast>,
    );
  }
});

function catalogMovie(id: string, title: string, year?: number): CinefileMovie {
  return {
    href: `/cinefile/movies/catalog/${id}`,
    id,
    posterUrl: `${CONFIG.JELLYFIN_SERVER}/Items/${encodeURIComponent(id)}/Images/Primary?maxWidth=342`,
    title,
    ...(year === undefined ? {} : {year}),
  };
}

function movieDbMovie(
  movie: Awaited<ReturnType<typeof searchMovieDb>>[number],
  isInCatalog = false,
): CinefileMovie {
  return {
    href: `/cinefile/movies/tmdb/${movie.id}`,
    id: String(movie.id),
    ...(isInCatalog ? {isInCatalog: true} : {}),
    ...(movie.posterPath === undefined
      ? {}
      : {posterUrl: `https://image.tmdb.org/t/p/w342${movie.posterPath}`}),
    title: movie.title,
    ...(movie.year === undefined ? {} : {year: movie.year}),
  };
}

function requestedMovie(request: MovieRequest): CinefileMovie {
  return {
    href: `/cinefile/movies/tmdb/${request.tmdbId}`,
    id: String(request.tmdbId),
    ...(request.posterPath === null
      ? {}
      : {posterUrl: `https://image.tmdb.org/t/p/w342${request.posterPath}`}),
    requestedAt: request.requestedAt,
    title: request.title,
    ...(request.year === null ? {} : {year: request.year}),
  };
}

type CatalogMovieRecord = {
  genres?: string[];
  id: string;
  name: string;
  tmdbId?: number;
  year?: number;
};

function catalogMoviePage(
  movie: CatalogMovieRecord,
  movieDbDetails?: MovieDbMovieDetails,
): CinefileMovieDetails {
  if (movieDbDetails !== undefined) {
    return movieDbMoviePage(movieDbDetails, 'included');
  }
  return {
    catalogStatus: 'included',
    detailSource: 'catalog',
    genres: movie.genres ?? [],
    posterUrl: jellyfinImageUrl(movie.id, 'Primary', 500),
    backdropUrl: jellyfinImageUrl(movie.id, 'Backdrop/0', 1280),
    title: movie.name,
    ...(movie.year === undefined ? {} : {year: movie.year}),
  };
}

function movieDbMoviePage(
  movie: MovieDbMovieDetails,
  catalogStatus: CatalogStatus,
  requestStatus?: MovieRequestStatus,
): CinefileMovieDetails {
  return {
    catalogStatus,
    detailSource: 'tmdb',
    genres: movie.genres,
    title: movie.title,
    ...(requestStatus === undefined ? {} : {request: {status: requestStatus, tmdbId: movie.id}}),
    ...(movie.backdropPath === undefined
      ? {}
      : {backdropUrl: `https://image.tmdb.org/t/p/w1280${movie.backdropPath}`}),
    ...(movie.posterPath === undefined
      ? {}
      : {posterUrl: `https://image.tmdb.org/t/p/w500${movie.posterPath}`}),
    ...(movie.overview === undefined ? {} : {overview: movie.overview}),
    ...(movie.rating === undefined ? {} : {rating: movie.rating}),
    ...(movie.runtimeMinutes === undefined ? {} : {runtimeMinutes: movie.runtimeMinutes}),
    ...(movie.tagline === undefined ? {} : {tagline: movie.tagline}),
    ...(movie.year === undefined ? {} : {year: movie.year}),
  };
}

function validMovieId(value: string): number | undefined {
  const movieId = Number(value);
  return Number.isSafeInteger(movieId) && movieId > 0 ? movieId : undefined;
}

async function optionalMovieDbMovie(movieId: number): Promise<MovieDbMovieDetails | undefined> {
  try {
    return await getMovieDbMovie(movieId);
  } catch (error) {
    logger.error({err: error, movieId}, 'Loading TMDB movie details failed');
    return undefined;
  }
}

function jellyfinImageUrl(itemId: string, imageType: string, maxWidth: number): string {
  return `${CONFIG.JELLYFIN_SERVER}/Items/${encodeURIComponent(itemId)}/Images/${imageType}?maxWidth=${maxWidth}`;
}

export const cinefileApp: AtlasApp = {
  id: 'cinefile',
  isPublic: true,
  mountPath: '/cinefile',
  app,
};
