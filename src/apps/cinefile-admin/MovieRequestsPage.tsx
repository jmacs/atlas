import {formatDate} from '#lib/utils/dates.ts';
import type {CinefileRequest} from '#lib/cinefile/requests.ts';
import {ChevronRight} from '@lucide/icons';

import {Icon} from '../../ui/Icon.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {CinefileAdminLayout} from './CinefileAdminLayout.tsx';

type MovieRequestsPageProps =
  {status: 'error'} | {requests: readonly CinefileRequest[]; status: 'ready'};

export function MovieRequestsPage(props: MovieRequestsPageProps) {
  return (
    <CinefileAdminLayout activePath="/cinefile-admin/requests" title="Media Requests">
      <PageHeader
        title="Media Requests"
        description="Review every movie and TV series waiting to be added to the collection."
      />
      <MovieRequestList {...props} />
    </CinefileAdminLayout>
  );
}

function MovieRequestList(props: MovieRequestsPageProps) {
  if (props.status === 'error') {
    return (
      <p class="type-body text-danger" role="alert">
        Media requests are unavailable. Please try again.
      </p>
    );
  }
  if (props.requests.length === 0) {
    return (
      <section class="rounded-card border border-border bg-surface px-6 py-12 text-center shadow-sm">
        <h2 class="type-heading-2 text-foreground">No media requests</h2>
        <p class="type-body mt-2 text-muted">New Cinefile requests will appear here.</p>
      </section>
    );
  }
  const rows = props.requests.map((request) => (
    <li key={request.id}>
      <a
        class="group flex items-center gap-5 px-6 py-5 transition hover:bg-surface-raised/50 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
        href={`/cinefile-admin/requests/${encodeURIComponent(request.id)}`}
      >
        <div class="min-w-0 flex-1">
          <h2 class="type-heading-3 truncate group-hover:text-accent">{request.title}</h2>
          <p class="type-caption mt-1.5 text-muted">
            {request.year === null ? null : (
              <>
                <span>{request.year}</span>
                <span class="mx-2" aria-hidden="true">
                  ·
                </span>
              </>
            )}
            <span>TMDB {request.tmdbId}</span>
            <span class="mx-2" aria-hidden="true">
              ·
            </span>
            <span>{request.kind === 'movie' ? 'Movie' : 'TV series'}</span>
          </p>
        </div>
        <time class="type-body-small shrink-0 text-muted" dateTime={request.requestedAt}>
          {formatDate(request.requestedAt)}
        </time>
        <Icon icon={ChevronRight} size={16} class="shrink-0 text-muted" aria-hidden="true" />
      </a>
    </li>
  ));
  return (
    <section aria-label="Media requests">
      <div class="mb-4 flex items-baseline justify-between gap-4">
        <h2 class="type-heading-2">Requests</h2>
        <p class="type-caption text-muted">
          {props.requests.length} {props.requests.length === 1 ? 'request' : 'requests'}
        </p>
      </div>
      <ul class="divide-y divide-border/60 overflow-hidden rounded-card border border-border/70 bg-surface/50">
        {rows}
      </ul>
    </section>
  );
}
