import type {CollectionUpdater, CollectionUpdaterCondition} from './collection-updater.ts';

export type CollectionUpdaterValidationError = {
  code: 'collection_updater_invalid';
  path: string;
  message: string;
};

export function validateSavedCollectionUpdaters(
  value: unknown,
): CollectionUpdater[] | CollectionUpdaterValidationError {
  if (!Array.isArray(value)) {
    return invalid('collectionUpdaters', 'must be an array.');
  }
  const updaters: CollectionUpdater[] = [];
  for (const [updaterIndex, item] of value.entries()) {
    const updaterPath = `collectionUpdaters[${updaterIndex}]`;
    if (!isRecord(item)) {
      return invalid(updaterPath, 'must be an object.');
    }
    if (typeof item.collectionId !== 'string') {
      return invalid(`${updaterPath}.collectionId`, 'must be a string.');
    }
    const collectionId = item.collectionId.trim();
    if (!collectionId) {
      return invalid(`${updaterPath}.collectionId`, 'must not be empty.');
    }
    if (!Array.isArray(item.conditions)) {
      return invalid(`${updaterPath}.conditions`, 'must be an array.');
    }
    if (!item.conditions.length) {
      return invalid(`${updaterPath}.conditions`, 'must not be empty.');
    }
    const conditions: CollectionUpdaterCondition[] = [];
    for (const [conditionIndex, condition] of item.conditions.entries()) {
      const result = validateCondition(condition, `${updaterPath}.conditions[${conditionIndex}]`);
      if ('code' in result) {
        return result;
      }
      conditions.push(result);
    }
    updaters.push({collectionId, conditions});
  }
  return updaters;
}

function validateCondition(
  value: unknown,
  path: string,
): CollectionUpdaterCondition | CollectionUpdaterValidationError {
  if (!isRecord(value)) {
    return invalid(path, 'must be an object.');
  }
  if (value.field !== 'movie.year' && value.field !== 'movie.genres') {
    return invalid(`${path}.field`, 'is not a supported updater field.');
  }
  if (value.field === 'movie.year') {
    if (!['eq', 'lt', 'gt', 'lte', 'gte', 'between'].includes(value.operator as string)) {
      return invalid(`${path}.operator`, 'is not supported for movie.year.');
    }
    if (value.operator === 'between') {
      if (!finiteNumber(value.start)) {
        return invalid(`${path}.start`, 'must be a finite number.');
      }
      if (!finiteNumber(value.end)) {
        return invalid(`${path}.end`, 'must be a finite number.');
      }
      if (value.start > value.end) {
        return invalid(`${path}.end`, 'must be greater than or equal to start.');
      }
      return {field: value.field, operator: value.operator, start: value.start, end: value.end};
    }
    if (!finiteNumber(value.value)) {
      return invalid(`${path}.value`, 'must be a finite number.');
    }
    const operator = value.operator as 'eq' | 'lt' | 'gt' | 'lte' | 'gte';
    return {field: value.field, operator, value: value.value};
  }
  if (value.operator !== 'includes_any' && value.operator !== 'includes_all') {
    return invalid(`${path}.operator`, 'is not supported for movie.genres.');
  }
  if (!Array.isArray(value.values) || !value.values.length) {
    return invalid(`${path}.values`, 'must be a non-empty array.');
  }
  for (const [index, genre] of value.values.entries()) {
    if (typeof genre !== 'string') {
      return invalid(`${path}.values[${index}]`, 'must be a string.');
    }
  }
  return {field: value.field, operator: value.operator, values: [...value.values]};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
function invalid(path: string, message: string): CollectionUpdaterValidationError {
  return {code: 'collection_updater_invalid', path, message};
}
