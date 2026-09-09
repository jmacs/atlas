import {ArrowLeft} from '@lucide/icons';

import {Alert} from '../../ui/Alert.tsx';
import {Button, buttonClassNames} from '../../ui/Button.tsx';
import {Dialog, DialogContent, DialogFooter, DialogHeader} from '../../ui/Dialog.tsx';
import {Icon} from '../../ui/Icon.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {Table, type TableColumn} from '../../ui/Table.tsx';
import {JellyfinLayout} from './JellyfinLayout.tsx';
import type {
  CatalogBrowserCollection,
  CatalogBrowserMovie,
  CatalogBrowserView,
  CatalogCollectionMembersView,
  CatalogMovieMembershipView,
} from './catalog-browser-presentation.ts';

export type CatalogBrowserPageProps = {catalog: CatalogBrowserView};

const collectionColumns: readonly TableColumn<CatalogBrowserCollection>[] = [
  {
    id: 'name',
    header: 'Collection',
    cell: (collection) => (
      <Button
        variant="ghost"
        class="h-auto justify-start px-0 py-1 text-left"
        aria-label={`View ${collection.name} members`}
        hx-get={`/jellyfin/catalog/collections/${encodeURIComponent(collection.id)}`}
        hx-target="#catalog-detail-dialog > .dialog__panel"
        hx-swap="innerHTML"
        hx-disabled-elt="this"
      >
        {collection.name}
      </Button>
    ),
  },
  {
    id: 'movies',
    header: 'Movies',
    headerClass: 'text-right',
    cellClass: 'text-right',
    cell: (c) => c.movies,
  },
  {
    id: 'series',
    header: 'Series',
    headerClass: 'text-right',
    cellClass: 'text-right',
    cell: (c) => c.series,
  },
];

const movieColumns: readonly TableColumn<CatalogBrowserMovie>[] = [
  {
    id: 'name',
    header: 'Movie',
    cell: (movie) => (
      <Button
        variant="ghost"
        class="h-auto justify-start px-0 py-1 text-left"
        aria-label={`View ${movie.name} memberships`}
        hx-get={`/jellyfin/catalog/movies/${encodeURIComponent(movie.id)}`}
        hx-target="#catalog-detail-dialog > .dialog__panel"
        hx-swap="innerHTML"
        hx-disabled-elt="this"
      >
        {movie.name}
      </Button>
    ),
  },
  {id: 'year', header: 'Year', cell: (movie) => movie.year ?? '—'},
  {id: 'genres', header: 'Genres', cell: (movie) => movie.genres.join(', ') || '—'},
];

export function CatalogBrowserPage({catalog}: CatalogBrowserPageProps) {
  return (
    <JellyfinLayout activePath="/jellyfin/catalog" title="Catalog">
      <a href="/jellyfin" class={buttonClassNames('ghost', 'sm', 'mb-6 px-0 hover:bg-transparent')}>
        <Icon icon={ArrowLeft} size={16} />
        Back to Jellyfin
      </a>
      <PageHeader
        title="Catalog"
        description="Browse the collections and movies in Atlas's cached Jellyfin snapshot."
      />
      {catalog.kind === 'available' ? (
        <CatalogTables catalog={catalog} />
      ) : (
        <Alert variant="warning">
          The cached catalog is unavailable. Return to Jellyfin and refresh it before browsing.
        </Alert>
      )}
    </JellyfinLayout>
  );
}

function CatalogTables({catalog}: {catalog: Extract<CatalogBrowserView, {kind: 'available'}>}) {
  return (
    <div class="space-y-10">
      <section aria-labelledby="catalog-collections-heading" class="space-y-4">
        <div>
          <h2 id="catalog-collections-heading" class="type-heading-2">
            Collections ({catalog.collections.length})
          </h2>
          <p class="type-body-small mt-1 text-muted">
            Open a collection to inspect its cached movie and series members.
          </p>
        </div>
        <Table
          caption="Cached Jellyfin collections"
          columns={collectionColumns}
          data={catalog.collections}
        />
      </section>

      <section aria-labelledby="catalog-movies-heading" class="space-y-4">
        <div>
          <h2 id="catalog-movies-heading" class="type-heading-2">
            Movies ({catalog.movies.length})
          </h2>
          <p class="type-body-small mt-1 text-muted">
            Every movie currently available to Atlas's Jellyfin tools.
          </p>
        </div>
        <Table caption="Cached Jellyfin movies" columns={movieColumns} data={catalog.movies} />
      </section>

      <Dialog
        id="catalog-detail-dialog"
        class="h-[min(44rem,calc(100dvh-3rem))] max-w-2xl"
        aria-labelledby="catalog-detail-dialog-title"
      />
    </div>
  );
}

export function CatalogCollectionMembers({catalog}: {catalog: CatalogCollectionMembersView}) {
  if (catalog.kind !== 'available') {
    return (
      <>
        <DialogHeader title="Collection unavailable" titleId="catalog-detail-dialog-title" />
        <DialogContent>
          <Alert variant="warning">
            This collection could not be read from the cached catalog. Close this dialog and try
            again after refreshing.
          </Alert>
        </DialogContent>
        <DialogFooter>
          <Button data-dialog-close variant="secondary">
            Close
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader
        title={catalog.collection.name}
        message={`${catalog.movies.length} movies and ${catalog.series.length} series in the cached collection.`}
        titleId="catalog-detail-dialog-title"
      />
      <DialogContent>
        <div class="space-y-8">
          <MemberList title={`Movies (${catalog.movies.length})`} members={catalog.movies} />
          <MemberList title={`Series (${catalog.series.length})`} members={catalog.series} />
        </div>
      </DialogContent>
      <DialogFooter>
        <Button data-dialog-close variant="secondary">
          Close
        </Button>
      </DialogFooter>
    </>
  );
}

export function CatalogMovieMembership({catalog}: {catalog: CatalogMovieMembershipView}) {
  if (catalog.kind !== 'available') {
    return (
      <>
        <DialogHeader title="Movie unavailable" titleId="catalog-detail-dialog-title" />
        <DialogContent>
          <Alert variant="warning">
            This movie could not be read from the cached catalog. Close this dialog and try again
            after refreshing.
          </Alert>
        </DialogContent>
        <DialogFooter>
          <Button data-dialog-close variant="secondary">
            Close
          </Button>
        </DialogFooter>
      </>
    );
  }

  const year = catalog.movie.year === undefined ? 'Year unavailable' : String(catalog.movie.year);
  const genres = catalog.movie.genres.length ? catalog.movie.genres.join(', ') : 'No genres';
  return (
    <>
      <DialogHeader
        title={catalog.movie.name}
        message={`${year} · ${genres}`}
        titleId="catalog-detail-dialog-title"
      />
      <DialogContent>
        <MemberList
          title={`Collections (${catalog.collections.length})`}
          members={catalog.collections}
        />
      </DialogContent>
      <DialogFooter>
        <Button data-dialog-close variant="secondary">
          Close
        </Button>
      </DialogFooter>
    </>
  );
}

function MemberList({title, members}: {title: string; members: {id: string; label: string}[]}) {
  return (
    <section class="space-y-3">
      <h3 class="type-heading-3">{title}</h3>
      {members.length ? (
        <ul class="divide-y divide-border rounded-lg border border-border">
          {members.map((member) => (
            <li class="type-body-small px-4 py-3">{member.label}</li>
          ))}
        </ul>
      ) : (
        <p class="type-body-small text-muted">No members.</p>
      )}
    </section>
  );
}
