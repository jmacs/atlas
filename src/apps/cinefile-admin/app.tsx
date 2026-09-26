import {migrateCinefileRequests} from '#lib/cinefile/migrate.ts';
import {createCinefileRequestQueue} from '#lib/cinefile/requests.ts';
import {getMovieDbMovie} from '#lib/movie-db/movie-details.ts';
import {getMovieDbTv} from '#lib/movie-db/tv-details.ts';
import {Hono} from 'hono';

import type {AtlasApp, AtlasEnv} from '../../system/contracts.ts';
import {logger} from '../../system/logger.ts';
import {CinefileAdminHomePage} from './CinefileAdminHomePage.tsx';
import {MovieRequestDetailPage} from './MovieRequestDetailPage.tsx';
import {MovieRequestsPage} from './MovieRequestsPage.tsx';

const app = new Hono<AtlasEnv>();
const requests = createCinefileRequestQueue();

app.get('/', (c) => c.html(<CinefileAdminHomePage />));

app.post('/migrate', async (c) => {
  try {
    const result = await migrateCinefileRequests();
    if (result.status === 'migrated') {
      return c.html(
        <CinefileAdminHomePage
          migrationStatus="success"
          migrationMessage={`Upgraded ${result.migratedRequests} requests. Backup: ${result.backupPath}`}
        />,
      );
    }
    const migrationMessage =
      result.status === 'missing'
        ? 'There is no requests file to upgrade.'
        : 'The requests file already uses the current schema.';
    return c.html(
      <CinefileAdminHomePage migrationStatus="success" migrationMessage={migrationMessage} />,
    );
  } catch (error) {
    logger.error({err: error}, 'Migrating Cinefile requests failed');
    return c.html(
      <CinefileAdminHomePage
        migrationStatus="error"
        migrationMessage="The request schema could not be upgraded. The original file was preserved."
      />,
      500,
    );
  }
});

app.get('/requests', async (c) => {
  try {
    const savedRequests = await requests.read();
    return c.html(
      <MovieRequestsPage
        status="ready"
        requests={savedRequests.toSorted((left, right) =>
          right.requestedAt.localeCompare(left.requestedAt),
        )}
      />,
    );
  } catch (error) {
    logger.error({err: error}, 'Loading Cinefile Admin requests failed');
    return c.html(<MovieRequestsPage status="error" />, 502);
  }
});

app.get('/requests/:requestId', async (c) => {
  const requestId = c.req.param('requestId');
  let request;
  try {
    const savedRequests = await requests.read();
    request = savedRequests.find(({id}) => id === requestId);
  } catch (error) {
    logger.error({err: error, requestId}, 'Loading Cinefile Admin request failed');
    return c.html(<MovieRequestsPage status="error" />, 502);
  }
  if (request === undefined) {
    return c.notFound();
  }
  try {
    const movie =
      request.kind === 'movie'
        ? await getMovieDbMovie(request.tmdbId)
        : await getMovieDbTv(request.tmdbId);
    return c.html(<MovieRequestDetailPage movie={movie} request={request} />);
  } catch (error) {
    logger.error(
      {err: error, requestId, tmdbId: request.tmdbId},
      'Loading Cinefile Admin TMDB details failed',
    );
    return c.html(<MovieRequestDetailPage request={request} />, 502);
  }
});

export const cinefileAdminApp: AtlasApp = {
  id: 'cinefile-admin',
  mountPath: '/cinefile-admin',
  app,
};
