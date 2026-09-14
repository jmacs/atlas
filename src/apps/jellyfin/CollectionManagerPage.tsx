import {ArrowLeft, X} from '@lucide/icons';

import {Alert} from '../../ui/Alert.tsx';
import {Button, buttonClassNames} from '../../ui/Button.tsx';
import {Card} from '../../ui/Card.tsx';
import {Icon} from '../../ui/Icon.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {Toast} from '../../ui/Toast.tsx';
import {Typeahead} from '../../ui/Typeahead.tsx';
import type {CollectionManagerSelection} from './collection-manager-presentation.ts';
import {JellyfinLayout} from './JellyfinLayout.tsx';

export type CollectionManagerPageProps = {
  catalogAvailable: boolean;
  feedback?: {kind: 'success' | 'error'; message: string};
  selection?: CollectionManagerSelection;
};

export function CollectionManagerPage({
  catalogAvailable,
  feedback,
  selection = {collection: {value: '', name: ''}, movies: []},
}: CollectionManagerPageProps) {
  const selectedCollection = selection.collection.value ? [selection.collection] : [];
  return (
    <JellyfinLayout
      activePath="/jellyfin/collection-manager"
      title="Manage Collection"
      scripts={['/scripts/apps/jellyfin/collection-manager.js']}
      notifications={
        feedback ? <Toast variant={feedback.kind}>{feedback.message}</Toast> : undefined
      }
    >
      <a href="/jellyfin" class={buttonClassNames('ghost', 'sm', 'mb-6 px-0 hover:bg-transparent')}>
        <Icon icon={ArrowLeft} size={16} />
        Back to Jellyfin
      </a>
      <PageHeader
        title="Manage Collection"
        description="Choose a Jellyfin collection, build a list of movies, and add them in one update."
      />
      {!catalogAvailable ? (
        <Alert variant="warning">
          The cached catalog is unavailable. Return to Jellyfin and refresh it before managing a
          collection.
        </Alert>
      ) : (
        <form
          action="/jellyfin/collection-manager"
          method="post"
          class="max-w-3xl space-y-6"
          {...{'x-data': 'collectionManager'}}
        >
          <Card
            title="Collection"
            description="Select the collection that should receive the movies."
          >
            <Typeahead
              name="collectionId"
              label="Collection"
              source="/jellyfin/collection-manager/collections"
              selected={selectedCollection}
              {...{
                'x-ref': 'collectionPicker',
                'x-bind:data-selected': 'JSON.stringify(collection ? [collection] : [])',
                'x-on:typeahead-change': 'collection = $event.detail.items[0] ?? null',
              }}
            />
          </Card>

          <Card
            title="Movies to add"
            description="Search as often as needed. Your selected movies stay in the list until you remove them."
          >
            <div class="space-y-5">
              <Typeahead
                name="movieIds"
                label="Movies"
                source="/jellyfin/collection-manager/movies"
                selected={selection.movies}
                multiple
                {...{
                  'x-ref': 'moviePicker',
                  'x-bind:data-selected': 'JSON.stringify(movies)',
                  'x-on:typeahead-change': 'movies = $event.detail.items',
                }}
              />

              <section aria-labelledby="selected-movies-heading" class="space-y-3">
                <h3
                  id="selected-movies-heading"
                  class="type-heading-3"
                  {...{'x-text': 'movieCountLabel()'}}
                >
                  Selected movies ({selection.movies.length})
                </h3>
                <p class="type-body-small text-muted" {...{'x-show': 'movies.length === 0'}}>
                  No movies selected yet.
                </p>
                <ul
                  class="divide-y divide-border rounded-lg border border-border"
                  {...{'x-show': 'movies.length > 0'}}
                >
                  <template {...{'x-for': 'movie in movies', 'x-bind:key': 'movie.value'}}>
                    <li class="flex items-center gap-4 px-4 py-3">
                      <div class="min-w-0 flex-1">
                        <p class="type-body-small text-foreground" {...{'x-text': 'movie.name'}} />
                        <p
                          class="type-caption mt-1 text-muted"
                          {...{'x-show': 'movie.description', 'x-text': 'movie.description'}}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        class="shrink-0 px-2"
                        {...{
                          'x-bind:aria-label': '`Remove ${movie.name}`',
                          'x-on:click': 'removeMovie(movie.value)',
                        }}
                      >
                        <Icon icon={X} size={16} />
                        Remove
                      </Button>
                    </li>
                  </template>
                </ul>
              </section>
            </div>
          </Card>

          <div class="flex justify-end border-t border-border pt-6">
            <Button type="submit" {...{'x-bind:disabled': '!collection || movies.length === 0'}}>
              Update collections
            </Button>
          </div>
        </form>
      )}
    </JellyfinLayout>
  );
}
