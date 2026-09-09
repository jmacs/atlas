export type CollectionUpdaterCondition =
  | {field: 'movie.year'; operator: 'eq' | 'lt' | 'gt' | 'lte' | 'gte'; value: number}
  | {field: 'movie.year'; operator: 'between'; start: number; end: number}
  | {field: 'movie.genres'; operator: 'includes_any' | 'includes_all'; values: string[]};

export type CollectionUpdater = {collectionId: string; conditions: CollectionUpdaterCondition[]};
