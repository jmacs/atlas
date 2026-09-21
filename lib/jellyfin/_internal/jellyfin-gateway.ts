import {Jellyfin} from '@jellyfin/sdk/lib/jellyfin.js';
import {getCollectionApi} from '@jellyfin/sdk/lib/utils/api/collection-api.js';
import {getItemsApi} from '@jellyfin/sdk/lib/utils/api/items-api.js';
import {BaseItemKind} from '@jellyfin/sdk/lib/generated-client/models/base-item-kind.js';
import {ItemFields} from '@jellyfin/sdk/lib/generated-client/models/item-fields.js';
import type {BaseItemDto} from '@jellyfin/sdk/lib/generated-client/models/base-item-dto.js';
import type {BaseItemKind as BaseItemKindValue} from '@jellyfin/sdk/lib/generated-client/models/base-item-kind.js';
import type {CatalogCollection, CatalogMovie, CatalogSeries, RemoteCatalog} from './catalog.ts';

const PAGE_SIZE = 500;

export type JellyfinCatalogPullProgress =
  | {phase: 'collections'}
  | {phase: 'memberships'; collection: CatalogCollection; index: number; total: number}
  | {phase: 'movies'}
  | {phase: 'series'};

export type JellyfinGateway = {
  pullCatalog(progress?: (event: JellyfinCatalogPullProgress) => void): Promise<RemoteCatalog>;
  addMoviesToCollection(collectionId: string, movieIds: readonly string[]): Promise<void>;
};

export function createJellyfinGateway({
  server,
  apiKey,
}: {
  server: string;
  apiKey: string;
}): JellyfinGateway {
  const jellyfin = new Jellyfin({
    clientInfo: {name: 'Atlas', version: '1.0.0'},
    deviceInfo: {name: 'Atlas', id: 'atlas'},
  });
  const api = jellyfin.createApi(server, apiKey);
  const itemsApi = getItemsApi(api);
  const collectionApi = getCollectionApi(api);

  async function pullItems(args: {
    includeItemTypes: BaseItemKindValue[];
    parentId?: string;
  }): Promise<BaseItemDto[]> {
    const items: BaseItemDto[] = [];
    for (let startIndex = 0; ; startIndex += PAGE_SIZE) {
      const response = await itemsApi.getItems({
        includeItemTypes: args.includeItemTypes,
        parentId: args.parentId,
        recursive: true,
        collapseBoxSetItems: false,
        startIndex,
        limit: PAGE_SIZE,
        fields: [ItemFields.Etag, ItemFields.Genres, ItemFields.ProviderIds],
      });
      const page = response.data.Items ?? [];
      items.push(...page);
      if (page.length < PAGE_SIZE || items.length >= (response.data.TotalRecordCount ?? 0)) {
        return items;
      }
    }
  }

  return {
    async pullCatalog(progress) {
      progress?.({phase: 'collections'});
      const collections = (await pullItems({includeItemTypes: [BaseItemKind.BoxSet]}))
        .map(toCollection)
        .filter((item): item is CatalogCollection => item !== undefined);
      const collectionMovieIds: Record<string, string[]> = {};
      const collectionSeriesIds: Record<string, string[]> = {};
      for (const [index, collection] of collections.entries()) {
        progress?.({phase: 'memberships', collection, index: index + 1, total: collections.length});
        const members = await pullItems({
          includeItemTypes: [BaseItemKind.Movie, BaseItemKind.Series],
          parentId: collection.id,
        });
        collectionMovieIds[collection.id] = members.flatMap((item) =>
          item.Type === BaseItemKind.Movie && typeof item.Id === 'string' ? [item.Id] : [],
        );
        collectionSeriesIds[collection.id] = members.flatMap((item) =>
          item.Type === BaseItemKind.Series && typeof item.Id === 'string' ? [item.Id] : [],
        );
      }
      progress?.({phase: 'movies'});
      const movies = (await pullItems({includeItemTypes: [BaseItemKind.Movie]}))
        .map(toMovie)
        .filter((item): item is CatalogMovie => item !== undefined);
      progress?.({phase: 'series'});
      const series = (await pullItems({includeItemTypes: [BaseItemKind.Series]}))
        .map(toSeries)
        .filter((item): item is CatalogSeries => item !== undefined);
      return {collections, movies, series, collectionMovieIds, collectionSeriesIds};
    },
    async addMoviesToCollection(collectionId, movieIds) {
      if (movieIds.length === 0) {
        return;
      }
      await collectionApi.addToCollection({collectionId, ids: [...movieIds]});
    },
  };
}

function toCollection(item: BaseItemDto): CatalogCollection | undefined {
  if (!hasIdAndName(item) || typeof item.ServerId !== 'string') {
    return undefined;
  }
  return {...idAndName(item), serverId: item.ServerId, ...optionalEtag(item)};
}

function toMovie(item: BaseItemDto): CatalogMovie | undefined {
  if (item.Type !== BaseItemKind.Movie) {
    return undefined;
  }
  const movie = toMediaItem(item);
  return movie === undefined ? undefined : {...movie, ...optionalTmdbId(item)};
}

function toSeries(item: BaseItemDto): CatalogSeries | undefined {
  return item.Type === BaseItemKind.Series ? toMediaItem(item) : undefined;
}

function toMediaItem(item: BaseItemDto): CatalogMovie | undefined {
  if (!hasIdAndName(item)) {
    return undefined;
  }
  return {
    ...idAndName(item),
    ...(typeof item.ProductionYear === 'number' ? {year: item.ProductionYear} : {}),
    ...(typeof item.PremiereDate === 'string' ? {premiereDate: item.PremiereDate} : {}),
    genres: (item.Genres ?? []).filter((genre): genre is string => typeof genre === 'string'),
    ...optionalEtag(item),
  };
}

function hasIdAndName(item: BaseItemDto): item is BaseItemDto & {Id: string; Name: string} {
  return typeof item.Id === 'string' && typeof item.Name === 'string';
}

function idAndName(item: BaseItemDto & {Id: string; Name: string}): {id: string; name: string} {
  return {id: item.Id, name: item.Name};
}

function optionalEtag(item: BaseItemDto): {etag?: string} {
  return typeof item.Etag === 'string' ? {etag: item.Etag} : {};
}

function optionalTmdbId(item: BaseItemDto): {tmdbId?: number} {
  const tmdbId = Number(item.ProviderIds?.Tmdb);
  return Number.isSafeInteger(tmdbId) && tmdbId > 0 ? {tmdbId} : {};
}
