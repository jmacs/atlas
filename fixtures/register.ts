import type {Context, Env, MiddlewareHandler} from 'hono';
import {Hono} from 'hono';
import {createJellyfinFixture, FIXTURE_TOKEN} from './jellyfin.ts';

const FIXTURE_NAMESPACE = '/__fixtures';

export function registerFixtures<E extends Env>(app: Hono<E>): void {
  const fixtures = new Hono();

  app.use(FIXTURE_NAMESPACE, fixtureCredentials);
  app.use(`${FIXTURE_NAMESPACE}/*`, fixtureCredentials);
  fixtures.route('/jellyfin', createJellyfinFixture());

  app.route(FIXTURE_NAMESPACE, fixtures);
  app.all(`${FIXTURE_NAMESPACE}/*`, fixtureNotFound);
  app.all(FIXTURE_NAMESPACE, fixtureNotFound);
}

const fixtureCredentials: MiddlewareHandler = async (c, next) => {
  if (!hasFixtureCredential(c)) {
    return c.json({error: 'Fixture credentials required.'}, 401);
  }
  await next();
  return undefined;
};

function hasFixtureCredential(c: Context): boolean {
  const authorization = c.req.header('Authorization');
  return authorization?.includes(`Token="${FIXTURE_TOKEN}"`) ?? false;
}

function fixtureNotFound(c: Context) {
  return c.json({error: 'Fixture route not found.'}, 404);
}
