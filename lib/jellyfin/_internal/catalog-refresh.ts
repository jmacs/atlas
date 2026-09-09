import {createCatalog} from './catalog.ts';
import {validateCatalog} from './catalog-validation.ts';
import type {CatalogStore} from './catalog-store.ts';
import type {JellyfinCatalogPullProgress, JellyfinGateway} from './jellyfin-gateway.ts';

export type CatalogRefreshProgress = JellyfinCatalogPullProgress | {phase: 'saving'};
export type CatalogRefreshResult = {
  pulledAt: string;
  collections: number;
  movies: number;
  series: number;
  durationMs: number;
};

export async function refreshCatalog({
  gateway,
  store,
  report,
  now = () => new Date(),
}: {
  gateway: JellyfinGateway;
  store: CatalogStore;
  report?: (event: CatalogRefreshProgress) => void;
  now?: () => Date;
}): Promise<CatalogRefreshResult> {
  const startedAt = now();
  const remote = await gateway.pullCatalog(report);
  const pulledAt = now().toISOString();
  const catalog = createCatalog(remote, pulledAt);
  const validated = validateCatalog(catalog);
  if ('code' in validated) {
    throw validated.cause ?? new Error('Invalid catalog.');
  }
  report?.({phase: 'saving'});
  await store.replace(validated);
  return {
    pulledAt,
    collections: validated.collections.length,
    movies: validated.movies.length,
    series: validated.series.length,
    durationMs: now().getTime() - startedAt.getTime(),
  };
}
