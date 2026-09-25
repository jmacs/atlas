import {createMovieRequestQueue} from '#lib/cinefile/movie-requests.ts';
import {getMovieDbMovie} from '#lib/movie-db/movie-details.ts';
import {Hono} from 'hono';

import type {AtlasApp, AtlasEnv} from '../../system/contracts.ts';
import {logger} from '../../system/logger.ts';
import {CinefileAdminHomePage} from './CinefileAdminHomePage.tsx';
import {MovieRequestDetailPage} from './MovieRequestDetailPage.tsx';
import {MovieRequestsPage} from './MovieRequestsPage.tsx';

const app = new Hono<AtlasEnv>();
const movieRequests = createMovieRequestQueue();

app.get('/', (c) => c.html(<CinefileAdminHomePage />));

app.get('/requests', async (c) => {
  try {
    const requests = await movieRequests.read();
    return c.html(
      <MovieRequestsPage
        status="ready"
        requests={requests.toSorted((left, right) =>
          right.requestedAt.localeCompare(left.requestedAt),
        )}
      />,
    );
  } catch (error) {
    logger.error({err: error}, 'Loading Cinefile Admin movie requests failed');
    return c.html(<MovieRequestsPage status="error" />, 502);
  }
});

app.get('/requests/:requestId', async (c) => {
  const requestId = c.req.param('requestId');
  let request;
  try {
    const requests = await movieRequests.read();
    request = requests.find(({id}) => id === requestId);
  } catch (error) {
    logger.error({err: error, requestId}, 'Loading Cinefile Admin movie request failed');
    return c.html(<MovieRequestsPage status="error" />, 502);
  }
  if (request === undefined) {
    return c.notFound();
  }
  try {
    const movie = await getMovieDbMovie(request.tmdbId);
    return c.html(<MovieRequestDetailPage movie={movie} request={request} />);
  } catch (error) {
    logger.error(
      {err: error, movieId: request.tmdbId, requestId},
      'Loading Cinefile Admin TMDB movie details failed',
    );
    return c.html(<MovieRequestDetailPage request={request} />, 502);
  }
});

export const cinefileAdminApp: AtlasApp = {
  id: 'cinefile-admin',
  mountPath: '/cinefile-admin',
  app,
};
