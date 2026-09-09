import {describe, expect, it} from 'vitest';
import {Hono} from 'hono';
import {collections} from './catalog.ts';
import {FIXTURE_TOKEN} from './jellyfin.ts';
import {registerFixtures} from './register.ts';

const credential = {Authorization: `MediaBrowser Token="${FIXTURE_TOKEN}"`};

describe('fixture registration', () => {
  it('requires the synthetic credential and terminates unknown fixture paths', async () => {
    const app = new Hono();
    registerFixtures(app);

    expect((await app.request('/__fixtures/jellyfin/Items')).status).toBe(401);
    expect((await app.request('/__fixtures/missing')).status).toBe(401);
    expect((await app.request('/__fixtures/missing', {headers: credential})).status).toBe(404);
    expect((await app.request('/__fixtures/control', {headers: credential})).status).toBe(404);
  });

  it('serves the fixed baseline catalog', async () => {
    const app = new Hono();
    registerFixtures(app);

    const response = await app.request('/__fixtures/jellyfin/Items?includeItemTypes=BoxSet', {
      headers: credential,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      Items: collections.map((collection) => ({Id: collection.id, Name: collection.name})),
      TotalRecordCount: collections.length,
    });
  });
});
