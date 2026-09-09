import {raw} from 'hono/html';

import {Accordion} from '../../ui/Accordion.tsx';
import {Alert} from '../../ui/Alert.tsx';
import {Badge} from '../../ui/Badge.tsx';
import {Button} from '../../ui/Button.tsx';
import {Card} from '../../ui/Card.tsx';
import {Dialog} from '../../ui/Dialog.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {Toast} from '../../ui/Toast.tsx';
import {CollectionUpdaterDraftDialog} from './CollectionUpdaterDraftDialog.tsx';
import {JellyfinLayout} from './JellyfinLayout.tsx';
import type {CollectionUpdaterEditorViewModel} from './collection-updater-presentation.ts';

export type CollectionUpdaterEditorPageProps = {
  catalogAvailable: boolean;
  feedback?: {kind: 'success' | 'error'; message: string};
  initiallyDirty?: boolean;
  updaters: CollectionUpdaterEditorViewModel[];
};

export function CollectionUpdaterEditorPage(props: CollectionUpdaterEditorPageProps) {
  return (
    <JellyfinLayout
      activePath="/jellyfin/collection-updaters"
      title="Collection Updaters"
      scripts={['/scripts/apps/jellyfin/collection-updater-editor.js']}
      notifications={
        props.feedback ? (
          <Toast variant={props.feedback.kind}>{props.feedback.message}</Toast>
        ) : undefined
      }
    >
      <PageHeader
        title="Collection Updaters"
        description="Build ordered rules that add matching movies to Jellyfin collections."
      />
      {!props.catalogAvailable ? (
        <Alert variant="warning">
          The cached catalog is unavailable. Existing targets are retained, but new targets cannot
          be selected.
        </Alert>
      ) : null}
      <div
        class="max-w-4xl space-y-6"
        data-initially-dirty={props.initiallyDirty ? 'true' : 'false'}
        {...{'x-data': 'collectionUpdaterEditor'}}
      >
        <script type="application/json" {...{'x-ref': 'updatersData'}}>
          {raw(serializeJsonForScript(props.updaters))}
        </script>
        <data value={String(props.catalogAvailable)} {...{'x-ref': 'catalogAvailable'}} />
        <section aria-labelledby="saved-updaters-heading" class="space-y-4">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                id="saved-updaters-heading"
                class="type-heading-2"
                {...{'x-text': 'updaterCountLabel()'}}
              >
                Collection updaters
              </h2>
              <p class="type-body-small mt-1 text-muted" {...{'x-text': 'disabledCountLabel()'}} />
            </div>
            <Button
              disabled={!props.catalogAvailable}
              {...{'x-on:click': 'openNewUpdater($event.currentTarget)'}}
            >
              New updater
            </Button>
          </div>

          <template {...{'x-if': 'updaters.length === 0'}}>
            <Card>
              <p class="type-body text-foreground">No Collection Updaters are configured.</p>
            </Card>
          </template>

          <div class="space-y-4">
            <template
              {...{'x-for': '(updater, updaterIndex) in updaters', 'x-bind:key': 'updater.id'}}
            >
              <Accordion
                title={
                  <span class="flex items-center gap-3 text-left">
                    <Badge variant="neutral">
                      <span {...{'x-text': 'updaterIndex + 1'}} />
                    </Badge>
                    <span class="type-heading-3" {...{'x-text': 'targetName(updater)'}} />
                  </span>
                }
                {...{
                  'x-bind:id': '`collection-updater-${updater.id}`',
                  'x-bind:class': "updater.enabled ? '' : 'bg-background opacity-60'",
                }}
              >
                <article
                  class="space-y-5"
                  {...{'x-bind:aria-label': '`${targetName(updater)} updater details`'}}
                >
                  <div class="flex flex-wrap items-center justify-between gap-4">
                    <p class="type-body-small text-muted">
                      <span class="type-control-small text-foreground">ID:</span>{' '}
                      <span {...{'x-text': 'updater.collection.id'}} />
                    </p>
                    <Badge variant="accent" {...{'x-show': 'updater.enabled'}}>
                      Enabled
                    </Badge>
                    <Badge variant="neutral" {...{'x-show': '!updater.enabled'}}>
                      Disabled
                    </Badge>
                  </div>
                  <ol
                    class="space-y-2"
                    {...{'x-bind:aria-label': '`Conditions for ${targetName(updater)}`'}}
                  >
                    <template
                      {...{
                        'x-for': '(condition, conditionIndex) in updater.conditions',
                        'x-bind:key': '`${updater.id}-${conditionIndex}`',
                      }}
                    >
                      <li class="type-body-small flex gap-3 text-foreground">
                        <span
                          class="type-control-small w-14 shrink-0 text-muted"
                          {...{'x-text': "conditionIndex === 0 ? 'WHERE' : 'AND'"}}
                        />
                        <span {...{'x-text': 'conditionSummary(condition)'}} />
                      </li>
                    </template>
                  </ol>
                  <div class="flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      {...{'x-on:click': 'openUpdater(updater.id, $event.currentTarget)'}}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      {...{'x-on:click': 'updater.enabled = !updater.enabled'}}
                    >
                      <span {...{'x-text': "updater.enabled ? 'Disable' : 'Enable'"}} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      {...{
                        'x-on:click': 'moveUpdater(updater.id, -1)',
                        'x-bind:disabled': 'updaterIndex === 0',
                      }}
                    >
                      Move up
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      {...{
                        'x-on:click': 'moveUpdater(updater.id, 1)',
                        'x-bind:disabled': 'updaterIndex === updaters.length - 1',
                      }}
                    >
                      Move down
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      {...{'x-on:click': 'removeUpdater(updater.id)'}}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              </Accordion>
            </template>
          </div>
        </section>

        <form action="/jellyfin/collection-updaters/save" method="post">
          <input
            type="hidden"
            name="updaters"
            value={JSON.stringify(props.updaters)}
            {...{'x-effect': '$el.value = serializedUpdaters()'}}
          />
          <div class="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <div>
              <Button
                variant="secondary"
                isLoading="htmx"
                hx-get="/jellyfin/collection-updaters/run"
                hx-target="#collection-updater-run-dialog > .dialog__panel"
                hx-swap="innerHTML"
                hx-disabled-elt="this"
                {...{
                  'x-bind:aria-disabled': "isDirty() ? 'true' : undefined",
                  'x-bind:disabled': 'isDirty()',
                }}
              >
                Preview and run
              </Button>
              <p class="type-caption mt-2 text-warning" {...{'x-show': 'isDirty()'}}>
                Save your changes or reload the page before previewing.
              </p>
            </div>
            <Button type="submit" {...{'x-bind:disabled': '!isDirty()'}}>
              Save changes
            </Button>
          </div>
        </form>
        <CollectionUpdaterDraftDialog />
        <Dialog
          id="collection-updater-run-dialog"
          class="max-w-3xl"
          aria-labelledby="collection-updater-run-dialog-title"
        />
      </div>
    </JellyfinLayout>
  );
}

function serializeJsonForScript(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}
