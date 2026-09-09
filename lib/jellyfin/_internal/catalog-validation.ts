import {
  catalogInvariantViolation,
  type Catalog,
  type CatalogCollection,
  type CatalogMovie,
  type CatalogSeries,
  type CatalogSnapshotItem,
} from './catalog.ts';

export type CatalogValidationError = {code: 'catalog_invalid'; cause?: Error};

export function validateCatalog(value: unknown): Catalog | CatalogValidationError {
  if (!isRecord(value)) {
    return invalid('Catalog must be an object.');
  }
  if (value.version !== 1) {
    return invalid('Catalog must have version 1.');
  }
  if (!Array.isArray(value.collections) || !value.collections.every(isCollection)) {
    return invalid('Catalog collections are invalid.');
  }
  if (!Array.isArray(value.movies) || !value.movies.every(isMovie)) {
    return invalid('Catalog movies are invalid.');
  }
  if (!Array.isArray(value.series) || !value.series.every(isSeries)) {
    return invalid('Catalog series are invalid.');
  }
  if (!isStringArrayIndex(value.collectionMovieIds)) {
    return invalid('Catalog collection movie index is invalid.');
  }
  if (!isStringArrayIndex(value.movieCollectionIds)) {
    return invalid('Catalog movie collection index is invalid.');
  }
  if (!isStringArrayIndex(value.collectionSeriesIds)) {
    return invalid('Catalog collection series index is invalid.');
  }
  if (!isStringArrayIndex(value.seriesCollectionIds)) {
    return invalid('Catalog series collection index is invalid.');
  }
  if (!isSnapshot(value.baseSnapshot)) {
    return invalid('Catalog base snapshot is invalid.');
  }
  const catalog: Catalog = {
    version: 1,
    collections: value.collections,
    movies: value.movies,
    series: value.series,
    collectionMovieIds: value.collectionMovieIds,
    movieCollectionIds: value.movieCollectionIds,
    collectionSeriesIds: value.collectionSeriesIds,
    seriesCollectionIds: value.seriesCollectionIds,
    baseSnapshot: value.baseSnapshot,
  };
  const violation = catalogInvariantViolation(catalog);
  return violation === undefined ? catalog : invalid(violation.message);
}

function isCollection(value: unknown): value is CatalogCollection {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.serverId === 'string' &&
    optionalString(value.etag)
  );
}
function isMovie(value: unknown): value is CatalogMovie {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    optionalNumber(value.year) &&
    optionalString(value.premiereDate) &&
    isStringArray(value.genres) &&
    optionalString(value.etag)
  );
}
function isSeries(value: unknown): value is CatalogSeries {
  return isMovie(value);
}
function isSnapshot(value: unknown): value is Catalog['baseSnapshot'] {
  return (
    isRecord(value) &&
    typeof value.pulledAt === 'string' &&
    Array.isArray(value.collections) &&
    value.collections.every(isSnapshotItem) &&
    Array.isArray(value.movies) &&
    value.movies.every(isSnapshotItem) &&
    Array.isArray(value.series) &&
    value.series.every(isSnapshotItem)
  );
}
function isSnapshotItem(value: unknown): value is CatalogSnapshotItem {
  return isRecord(value) && typeof value.id === 'string' && optionalString(value.etag);
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
function isStringArrayIndex(value: unknown): value is Record<string, string[]> {
  return isRecord(value) && Object.values(value).every(isStringArray);
}
function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}
function optionalNumber(value: unknown): boolean {
  return value === undefined || typeof value === 'number';
}
function invalid(message: string): CatalogValidationError {
  return {code: 'catalog_invalid', cause: new Error(message)};
}
