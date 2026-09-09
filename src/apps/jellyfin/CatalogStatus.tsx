import {formatDate} from '#lib/utils/dates.ts';
import type {Child} from 'hono/jsx';

import {Alert} from '../../ui/Alert.tsx';
import {Button} from '../../ui/Button.tsx';
import {Card} from '../../ui/Card.tsx';
import {DescriptionList, DescriptionListItem} from '../../ui/DescriptionList.tsx';

export type CatalogStatusView =
  | {kind: 'available'; pulledAt: string; collections: number; movies: number; series: number}
  | {kind: 'unavailable'; reason: 'missing' | 'invalid' | 'unreadable'};

type CatalogCardProps = {children: Child};

export function CatalogCard({children}: CatalogCardProps) {
  return (
    <Card
      id="catalog-card"
      title="Cached catalog"
      description="A local snapshot used for Jellyfin tools and previews."
    >
      {children}
    </Card>
  );
}

type CatalogContentProps = {catalog: CatalogStatusView; showRefresh?: boolean};

export function CatalogContent({catalog, showRefresh = true}: CatalogContentProps) {
  return catalog.kind === 'available' ? (
    <AvailableCatalog catalog={catalog} showRefresh={showRefresh} />
  ) : (
    <UnavailableCatalog catalog={catalog} showRefresh={showRefresh} />
  );
}

function AvailableCatalog({
  catalog,
  showRefresh,
}: {
  catalog: Extract<CatalogStatusView, {kind: 'available'}>;
  showRefresh: boolean;
}) {
  const age = formatAge(catalog.pulledAt);
  return (
    <div class="space-y-5">
      <p class="type-body-small text-muted">
        Last pulled <time dateTime={catalog.pulledAt}>{formatDate(catalog.pulledAt)}</time> ({age}).
      </p>
      <DescriptionList class="grid-cols-3">
        <DescriptionListItem label="Collections">
          <span class="type-heading-3">{catalog.collections}</span>
        </DescriptionListItem>
        <DescriptionListItem label="Movies">
          <span class="type-heading-3">{catalog.movies}</span>
        </DescriptionListItem>
        <DescriptionListItem label="Series">
          <span class="type-heading-3">{catalog.series}</span>
        </DescriptionListItem>
      </DescriptionList>
      {showRefresh ? <RefreshForm /> : null}
    </div>
  );
}

function UnavailableCatalog({
  catalog,
  showRefresh,
}: {
  catalog: Extract<CatalogStatusView, {kind: 'unavailable'}>;
  showRefresh: boolean;
}) {
  const messages = {
    missing: 'No cached catalog is available. Refresh it to use Jellyfin tools and previews.',
    invalid: 'The cached catalog is invalid. Refresh it to recover Jellyfin tools and previews.',
    unreadable:
      'The cached catalog could not be read. Check its storage and refresh it to recover.',
  };
  return (
    <div class="space-y-5">
      <Alert variant="warning">{messages[catalog.reason]}</Alert>
      {showRefresh ? <RefreshForm /> : null}
    </div>
  );
}

function RefreshForm() {
  return (
    <Button
      isLoading="htmx"
      hx-post="/jellyfin/catalog/refresh"
      hx-target="#catalog-card"
      hx-swap="outerHTML"
      hx-disabled-elt="this"
    >
      Refresh catalog
    </Button>
  );
}

function formatAge(pulledAt: string): string {
  const elapsedMs = Date.now() - new Date(pulledAt).getTime();
  if (!Number.isFinite(elapsedMs) || elapsedMs < 60_000) {
    return 'just now';
  }
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
