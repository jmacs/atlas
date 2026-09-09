import {Alert} from '../../ui/Alert.tsx';
import {Button} from '../../ui/Button.tsx';
import {DescriptionList, DescriptionListItem} from '../../ui/DescriptionList.tsx';
import {DialogContent, DialogFooter, DialogHeader} from '../../ui/Dialog.tsx';
import {CatalogCard, CatalogContent, type CatalogStatusView} from './CatalogStatus.tsx';
import type {
  CollectionUpdaterPreviewSummary,
  CollectionUpdaterPreviewTotals,
} from './collection-updater-presentation.ts';

export type CollectionUpdaterRunDialogProps =
  | {kind: 'catalog_unavailable'; catalog: CatalogStatusView}
  | {kind: 'library_unavailable'; catalog: CatalogStatusView; message: string}
  | {kind: 'no_enabled'; catalog: CatalogStatusView}
  | {
      kind: 'preview';
      catalog: CatalogStatusView;
      totals: CollectionUpdaterPreviewTotals;
      collections: CollectionUpdaterPreviewSummary[];
      missingCollectionIds: string[];
    };

export function CollectionUpdaterRunDialog(props: CollectionUpdaterRunDialogProps) {
  const canQueue =
    props.kind === 'preview' &&
    props.totals.additions > 0 &&
    props.missingCollectionIds.length === 0;
  return (
    <>
      <DialogHeader
        title="Preview and run"
        titleId="collection-updater-run-dialog-title"
        message="Confirm the saved enabled updaters before scheduling their run."
      />
      <DialogContent>
        <div class="space-y-5">
          <Alert variant="info">
            This preview uses the cached catalog. The action reloads the saved updaters and
            refreshes Jellyfin before making changes, so its results may differ.
          </Alert>
          <CatalogCard>
            <CatalogContent
              catalog={props.catalog}
              showRefresh={props.kind === 'catalog_unavailable'}
            />
          </CatalogCard>
          {props.kind === 'catalog_unavailable' ? (
            <Alert variant="warning">
              Preview is unavailable. Refresh the catalog, then open this dialog again.
            </Alert>
          ) : null}
          {props.kind === 'library_unavailable' ? (
            <Alert variant="error">{props.message}</Alert>
          ) : null}
          {props.kind === 'no_enabled' ? (
            <Alert variant="info">
              No saved Collection Updaters are enabled, so there is nothing to run.
            </Alert>
          ) : null}
          {props.kind === 'preview' ? <PreviewContents {...props} /> : null}
        </div>
      </DialogContent>
      <DialogFooter>
        <Button data-dialog-close variant="secondary">
          Cancel
        </Button>
        <form action="/jellyfin/collection-updaters/run" method="post">
          <Button type="submit" disabled={!canQueue}>
            Queue run
          </Button>
        </form>
      </DialogFooter>
    </>
  );
}

function PreviewContents({
  totals,
  collections,
  missingCollectionIds,
}: Extract<CollectionUpdaterRunDialogProps, {kind: 'preview'}>) {
  return (
    <>
      <DescriptionList class="grid-cols-2">
        <DescriptionListItem label="Collections with changes">
          <span class="type-heading-3">{totals.changedCollections}</span>
        </DescriptionListItem>
        <DescriptionListItem label="Proposed additions">
          <span class="type-heading-3">{totals.additions}</span>
        </DescriptionListItem>
      </DescriptionList>
      {missingCollectionIds.length ? (
        <Alert variant="warning">
          The following targets are missing from the cached catalog:{' '}
          {missingCollectionIds.join(', ')}. Refresh the catalog or edit the updaters before
          queueing a run.
        </Alert>
      ) : null}
      {!collections.length && !missingCollectionIds.length ? (
        <Alert variant="info">
          The cached catalog shows that every matching movie is already in its target collection.
          There are no changes to queue.
        </Alert>
      ) : null}
      {collections.length ? (
        <div class="space-y-4" aria-label="Collections with proposed changes">
          {collections.map((collection) => (
            <section class="rounded-card border border-border p-4">
              <h3 class="type-heading-3">{collection.collection.name}</h3>
              <p class="type-body-small mt-1 text-muted">
                {collection.additionCount} {collection.additionCount === 1 ? 'movie' : 'movies'}{' '}
                would be added.
              </p>
              <ol class="mt-3 space-y-1" aria-label={`Movies for ${collection.collection.name}`}>
                {collection.movieSample.map((movie) => (
                  <li class="type-body-small text-foreground" data-movie-id={movie.id}>
                    {movie.label}
                  </li>
                ))}
              </ol>
              {collection.omittedMovieCount ? (
                <p class="type-caption mt-2 text-muted">
                  {collection.omittedMovieCount} additional matches are not shown.
                </p>
              ) : null}
            </section>
          ))}
        </div>
      ) : null}
    </>
  );
}
