import {beforeEach, describe, expect, test, vi} from 'vitest';

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
  beforeEach(() => {
    sdk.addToCollection.mockReset();
    sdk.getItems.mockReset();
  });

  test('adds all selected movie IDs to the selected collection', async () => {
    sdk.addToCollection.mockResolvedValue({});
    const gateway = createJellyfinGateway({server: 'http://jellyfin.test', apiKey: 'key'});

    await gateway.addMoviesToCollection('classics', ['godzilla', 'kong']);

    expect(sdk.addToCollection).toHaveBeenCalledWith({
      collectionId: 'classics',
      ids: ['godzilla', 'kong'],
    });
  });

  test('paginates catalog records and pulls each collection membership in order', async () => {
    const movies = Array.from({length: 501}, (_, index) => ({
      Id: `movie-${index}`,
      Name: `Movie ${index}`,
      Type: BaseItemKind.Movie,
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
      expect(request).toMatchObject({recursive: true, collapseBoxSetItems: false});
    }
    expect(
      sdk.getItems.mock.calls
        .filter(
          ([request]) => request.includeItemTypes[0] === BaseItemKind.Movie && !request.parentId,
        )
        .map(([request]) => request.startIndex),
    ).toEqual([0, 500]);
  });

  test('disables box set collapsing and excludes collections from the movie catalog', async () => {
    sdk.getItems.mockImplementation(async ({includeItemTypes, parentId, collapseBoxSetItems}) => {
      if (parentId) {
        return {data: {Items: [], TotalRecordCount: 0}};
      }
      if (includeItemTypes[0] === BaseItemKind.BoxSet) {
        return {
          data: {
            Items: [
              {
                Id: 'watchlist',
                Name: 'Watchlist',
                ServerId: 'server',
                Type: BaseItemKind.BoxSet,
              },
            ],
            TotalRecordCount: 1,
          },
        };
      }
      if (includeItemTypes[0] === BaseItemKind.Movie) {
        return collapseBoxSetItems === false
          ? {
              data: {
                Items: [
                  {Id: 'actual-movie', Name: 'Actual Movie', Type: BaseItemKind.Movie},
                  {Id: 'action', Name: 'Action', Type: BaseItemKind.BoxSet},
                ],
                TotalRecordCount: 2,
              },
            }
          : {
              data: {
                Items: [{Id: 'action', Name: 'Action', Type: BaseItemKind.BoxSet}],
                TotalRecordCount: 1,
              },
            };
      }
      return {data: {Items: [], TotalRecordCount: 0}};
    });

    const catalog = await createJellyfinGateway({
      server: 'http://jellyfin.test',
      apiKey: 'key',
    }).pullCatalog();

    expect(catalog.collections.map(({id}) => id)).toEqual(['watchlist']);
    expect(catalog.movies.map(({id}) => id)).toEqual(['actual-movie']);
  });
});
