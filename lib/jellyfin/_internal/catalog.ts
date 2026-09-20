export type CatalogCollection = {id: string; name: string; serverId: string; etag?: string};

export type CatalogMovie = {
  id: string;
  name: string;
  year?: number;
  premiereDate?: string;
  genres: string[];
  etag?: string;
};

export type CatalogSeries = {
  id: string;
  name: string;
  year?: number;
  premiereDate?: string;
  genres: string[];
  etag?: string;
};

export type CatalogSnapshotItem = {id: string; etag?: string};

export type CatalogSnapshot = {
  pulledAt: string;
  collections: CatalogSnapshotItem[];
  movies: CatalogSnapshotItem[];
  series: CatalogSnapshotItem[];
};

export type Catalog = {
  version: 1;
  collections: CatalogCollection[];
  movies: CatalogMovie[];
  series: CatalogSeries[];
  collectionMovieIds: Record<string, string[]>;
  movieCollectionIds: Record<string, string[]>;
  collectionSeriesIds: Record<string, string[]>;
  seriesCollectionIds: Record<string, string[]>;
  baseSnapshot: CatalogSnapshot;
};

export type RemoteCatalog = {
  collections: CatalogCollection[];
  movies: CatalogMovie[];
  series: CatalogSeries[];
  collectionMovieIds: Record<string, string[]>;
  collectionSeriesIds: Record<string, string[]>;
};

export function createCatalog(remote: RemoteCatalog, pulledAt: string): Catalog {
  const collectionMovieIds = reconciledMembershipIndex(
    remote.collectionMovieIds,
    remote.collections,
    remote.movies,
  );
  const collectionSeriesIds = reconciledMembershipIndex(
    remote.collectionSeriesIds,
    remote.collections,
    remote.series,
  );
  return {
    version: 1,
    collections: remote.collections,
    movies: remote.movies,
    series: remote.series,
    collectionMovieIds,
    movieCollectionIds: reverseIndex(collectionMovieIds),
    collectionSeriesIds,
    seriesCollectionIds: reverseIndex(collectionSeriesIds),
    baseSnapshot: {
      pulledAt,
      collections: snapshotItems(remote.collections),
      movies: snapshotItems(remote.movies),
      series: snapshotItems(remote.series),
    },
  };
}

function reconciledMembershipIndex(
  memberships: Readonly<Record<string, readonly string[]>>,
  collections: readonly {id: string}[],
  items: readonly {id: string}[],
): Record<string, string[]> {
  const collectionIds = new Set(collections.map(({id}) => id));
  const itemIds = new Set(items.map(({id}) => id));
  return Object.fromEntries(
    Object.entries(memberships)
      .filter(([collectionId]) => collectionIds.has(collectionId))
      .map(([collectionId, ids]) => [collectionId, ids.filter((id) => itemIds.has(id))]),
  );
}

export function movieLabel(movie: CatalogMovie): string {
  return movie.year === undefined ? movie.name : `${movie.name} (${movie.year})`;
}

/** Returns the first violated catalog invariant, if any. */
export function catalogInvariantViolation(catalog: Catalog): Error | undefined {
  if (hasDuplicateIds(catalog.collections)) {
    return new Error('Catalog collection IDs must be unique.');
  }
  if (hasDuplicateIds(catalog.movies)) {
    return new Error('Catalog movie IDs must be unique.');
  }
  if (hasDuplicateIds(catalog.series)) {
    return new Error('Catalog series IDs must be unique.');
  }

  const collectionIds = new Set(catalog.collections.map(({id}) => id));
  const movieIds = new Set(catalog.movies.map(({id}) => id));
  const seriesIds = new Set(catalog.series.map(({id}) => id));
  const movieViolation = indexViolation(
    catalog.collectionMovieIds,
    catalog.movieCollectionIds,
    collectionIds,
    movieIds,
    'movie',
  );
  if (movieViolation !== undefined) {
    return movieViolation;
  }
  const seriesViolation = indexViolation(
    catalog.collectionSeriesIds,
    catalog.seriesCollectionIds,
    collectionIds,
    seriesIds,
    'series',
  );
  return seriesViolation;
}

function snapshotItems(items: readonly {id: string; etag?: string}[]): CatalogSnapshotItem[] {
  return items.map(({id, etag}) => ({id, ...(etag === undefined ? {} : {etag})}));
}

function reverseIndex(
  index: Readonly<Record<string, readonly string[]>>,
): Record<string, string[]> {
  const reverse: Record<string, string[]> = {};
  for (const [collectionId, itemIds] of Object.entries(index)) {
    for (const itemId of itemIds) {
      (reverse[itemId] ??= []).push(collectionId);
    }
  }
  return reverse;
}

function indexViolation(
  forward: Readonly<Record<string, readonly string[]>>,
  reverse: Readonly<Record<string, readonly string[]>>,
  collectionIds: ReadonlySet<string>,
  itemIds: ReadonlySet<string>,
  itemName: 'movie' | 'series',
): Error | undefined {
  for (const [collectionId, ids] of Object.entries(forward)) {
    if (!collectionIds.has(collectionId)) {
      return new Error(`Catalog collection ${itemName} index has an unknown collection ID.`);
    }
    if (hasDuplicates(ids)) {
      return new Error(`Catalog collection ${itemName} index has duplicate ${itemName} IDs.`);
    }
    if (ids.some((id) => !itemIds.has(id))) {
      return new Error(`Catalog collection ${itemName} index has an unknown ${itemName} ID.`);
    }
  }
  for (const [itemId, ids] of Object.entries(reverse)) {
    if (!itemIds.has(itemId)) {
      return new Error(`Catalog ${itemName} collection index has an unknown ${itemName} ID.`);
    }
    if (hasDuplicates(ids)) {
      return new Error(`Catalog ${itemName} collection index has duplicate collection IDs.`);
    }
    if (ids.some((id) => !collectionIds.has(id))) {
      return new Error(`Catalog ${itemName} collection index has an unknown collection ID.`);
    }
  }
  if (!setEquals(membershipKeys(forward), reverseMembershipKeys(reverse))) {
    return new Error(
      `Catalog ${itemName === 'movie' ? '' : 'series '}membership indexes do not agree.`,
    );
  }
  return undefined;
}

function hasDuplicateIds(items: readonly {id: string}[]): boolean {
  return hasDuplicates(items.map(({id}) => id));
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function membershipKeys(index: Readonly<Record<string, readonly string[]>>): Set<string> {
  return new Set(
    Object.entries(index).flatMap(([collectionId, ids]) =>
      ids.map((id) => `${collectionId}\u0000${id}`),
    ),
  );
}

function reverseMembershipKeys(index: Readonly<Record<string, readonly string[]>>): Set<string> {
  return new Set(
    Object.entries(index).flatMap(([id, collectionIds]) =>
      collectionIds.map((collectionId) => `${collectionId}\u0000${id}`),
    ),
  );
}

function setEquals(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  return left.size === right.size && [...left].every((value) => right.has(value));
}
