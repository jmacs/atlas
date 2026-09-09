import {Hono} from 'hono';
import {collections, movies, series} from './catalog.ts';

export const FIXTURE_TOKEN = 'atlas-fixture-token';

export function createJellyfinFixture(): Hono {
  const app = new Hono();

  app.get('/Items', (c) => {
    const parent = c.req.query('parentId');
    const kind = c.req.queries('includeItemTypes')?.join(',');
    const collection = collections.find((item) => item.id === parent);
    let items:
      {id: string; name: string; type: string; year?: number; genres?: string[]}[] | undefined;
    if (parent && collection && kind === 'Movie,Series') {
      items = [
        ...movies
          .filter((item) => collection.movieIds.includes(item.id))
          .map((item) => ({...item, type: 'Movie'})),
        ...series
          .filter((item) => collection.seriesIds.includes(item.id))
          .map((item) => ({...item, type: 'Series'})),
      ];
    } else if (!parent && kind === 'BoxSet') {
      items = collections.map((item) => ({...item, type: 'BoxSet'}));
    } else if (!parent && kind === 'Movie') {
      items = movies.map((item) => ({...item, type: 'Movie'}));
    } else if (!parent && kind === 'Series') {
      items = series.map((item) => ({...item, type: 'Series'}));
    }
    if (!items) {
      return c.json({error: 'Unknown fixture item query'}, 400);
    }
    const start = Number(c.req.query('startIndex') ?? 0);
    const limit = Number(c.req.query('limit') ?? 500);
    return c.json({
      Items: items.slice(start, start + limit).map((item) => ({
        Id: item.id,
        Name: item.name,
        Type: item.type,
        ServerId: 'fixture-server',
        ...('year' in item ? {ProductionYear: item.year, Genres: item.genres} : {}),
      })),
      TotalRecordCount: items.length,
    });
  });

  return app;
}
