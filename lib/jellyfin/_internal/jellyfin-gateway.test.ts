import {describe, expect, test, vi} from 'vitest';

const sdk = vi.hoisted(() => ({
  addToCollection: vi.fn(),
  getItems: vi.fn(),
}));

vi.mock('@jellyfin/sdk/lib/jellyfin.js', () => ({
  Jellyfin: class {
    createApi() {
      return {};
    }
  },
}));
vi.mock('@jellyfin/sdk/lib/utils/api/items-api.js', () => ({
  getItemsApi: () => ({getItems: sdk.getItems}),
}));
vi.mock('@jellyfin/sdk/lib/utils/api/collection-api.js', () => ({
  getCollectionApi: () => ({addToCollection: sdk.addToCollection}),
}));

import {BaseItemKind} from '@jellyfin/sdk/lib/generated-client/models/base-item-kind.js';
import {createJellyfinGateway} from './jellyfin-gateway.ts';

describe('Jellyfin gateway', () => {
  test('paginates catalog records and pulls each collection membership in order', async () => {
    const movies = Array.from({length: 501}, (_, index) => ({
      Id: `movie-${index}`,
      Name: `Movie ${index}`,
      Genres: ['Drama'],
      ProductionYear: 2000 + index,
    }));
    sdk.getItems.mockImplementation(async ({includeItemTypes, parentId, startIndex = 0}) => {
      if (includeItemTypes[0] === BaseItemKind.BoxSet) {
        return {
          data: {
            Items: [
              {Id: 'collection-a', Name: 'A', ServerId: 'server'},
              {Id: 'collection-b', Name: 'B', ServerId: 'server'},
            ],
            TotalRecordCount: 2,
          },
        };
      }
      if (parentId === 'collection-a') {
        return {
          data: {
            Items: [{Id: 'movie-0', Name: 'Movie 0', Type: BaseItemKind.Movie}],
            TotalRecordCount: 1,
          },
        };
      }
      if (parentId === 'collection-b') {
        return {
          data: {
            Items: [{Id: 'series-1', Name: 'Series 1', Type: BaseItemKind.Series}],
            TotalRecordCount: 1,
          },
        };
      }
      if (includeItemTypes[0] === BaseItemKind.Movie) {
        return {
          data: {
            Items: movies.slice(startIndex, startIndex + 500),
            TotalRecordCount: movies.length,
          },
        };
      }
      return {data: {Items: [{Id: 'series-1', Name: 'Series 1', Genres: []}], TotalRecordCount: 1}};
    });
    const progress: string[] = [];
    const catalog = await createJellyfinGateway({
      server: 'http://jellyfin.test',
      apiKey: 'key',
    }).pullCatalog((event) =>
      progress.push(
        event.phase === 'memberships' ? `${event.phase}:${event.collection.id}` : event.phase,
      ),
    );
    expect(catalog.collections.map(({id}) => id)).toEqual(['collection-a', 'collection-b']);
    expect(catalog.movies.map(({id}) => id)).toEqual(movies.map(({Id}) => Id));
    expect(catalog.collectionMovieIds).toEqual({'collection-a': ['movie-0'], 'collection-b': []});
    expect(catalog.collectionSeriesIds).toEqual({'collection-a': [], 'collection-b': ['series-1']});
    expect(progress).toEqual([
      'collections',
      'memberships:collection-a',
      'memberships:collection-b',
      'movies',
      'series',
    ]);
    for (const [request] of sdk.getItems.mock.calls) {
      expect(request).toMatchObject({recursive: true});
    }
    expect(
      sdk.getItems.mock.calls
        .filter(
          ([request]) => request.includeItemTypes[0] === BaseItemKind.Movie && !request.parentId,
        )
        .map(([request]) => request.startIndex),
    ).toEqual([0, 500]);
  });
});
