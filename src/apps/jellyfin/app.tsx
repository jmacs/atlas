import {CONFIG} from '#lib/config.ts';
import {
  createCatalogStore,
  createJellyfinGateway,
  refreshCatalog,
  type CatalogReadResult,
} from '#lib/jellyfin/catalog.ts';
import {
  createCollectionUpdaterLibrary,
  type SavedCollectionUpdater,
} from '#lib/jellyfin/collection-updaters.ts';
import {Hono, type Context} from 'hono';

import type {AtlasApp, AtlasEnv} from '../../system/contracts.ts';
import {Alert} from '../../ui/Alert.tsx';
import {PageHeader} from '../../ui/Page.tsx';
import {Toast} from '../../ui/Toast.tsx';
import type {TypeaheadResponse} from '../../ui/Typeahead.tsx';
import {
  CatalogBrowserPage,
  CatalogCollectionMembers,
  CatalogMovieMembership,
} from './CatalogBrowserPage.tsx';
import {CatalogCard, CatalogContent} from './CatalogStatus.tsx';
import {
  catalogBrowserForPage,
  catalogCollectionMembersForPage,
  catalogMovieMembershipForPage,
} from './catalog-browser-presentation.ts';
import {
  CollectionUpdaterEditorPage,
  type CollectionUpdaterEditorPageProps,
} from './CollectionUpdaterEditorPage.tsx';
import {CollectionUpdaterRunDialog} from './CollectionUpdaterRunDialog.tsx';
import {JellyfinHomePage} from './JellyfinHomePage.tsx';
import {JellyfinLayout} from './JellyfinLayout.tsx';
import {
  catalogStatusForPage,
  collectionTypeaheadItems,
  collectionUpdaterEditorViewModels,
  collectionUpdaterPreviewForPage,
} from './collection-updater-presentation.ts';
import {validateProposedUpdaterTargets} from './collection-updater-save.ts';

const app = new Hono<AtlasEnv>();

app.get('/', async (c) => {
  const catalog = await createCatalogStore().read();
  return c.html(<JellyfinHomePage catalog={catalogStatusForPage(catalog)} />);
});

app.post('/catalog/refresh', async (c) => {
  try {
    const catalog = await refreshCatalog({
      gateway: createJellyfinGateway({
        server: CONFIG.JELLYFIN_SERVER,
        apiKey: CONFIG.JELLYFIN_API_KEY,
      }),
      store: createCatalogStore(),
    });
    return c.html(
      <>
        <CatalogCard>
          <CatalogContent catalog={{kind: 'available', ...catalog}} />
        </CatalogCard>
        <Toast oob variant="success">
          Catalog refreshed successfully.
        </Toast>
      </>,
    );
  } catch {
    const catalog = await createCatalogStore().read();
    return c.html(
      <>
        <CatalogCard>
          <CatalogContent catalog={catalogStatusForPage(catalog)} />
        </CatalogCard>
        <Toast oob variant="error">
          Catalog refresh failed. Check the Jellyfin connection and try again.
        </Toast>
      </>,
    );
  }
});

app.get('/catalog', async (c) => {
  const catalog = await createCatalogStore().read();
  return c.html(<CatalogBrowserPage catalog={catalogBrowserForPage(catalog)} />);
});

app.get('/catalog/collections/:collectionId', async (c) => {
  const catalog = await createCatalogStore().read();
  const members = catalogCollectionMembersForPage(catalog, c.req.param('collectionId'));
  const status = members.kind === 'not_found' ? 404 : 200;
  return c.html(<CatalogCollectionMembers catalog={members} />, status);
});

app.get('/catalog/movies/:movieId', async (c) => {
  const catalog = await createCatalogStore().read();
  const membership = catalogMovieMembershipForPage(catalog, c.req.param('movieId'));
  const status = membership.kind === 'not_found' ? 404 : 200;
  return c.html(<CatalogMovieMembership catalog={membership} />, status);
});

app.get('/collection-updaters', async (c) => {
  const state = await loadState();
  if (state.library.kind === 'unavailable') {
    return unavailableLibraryResponse(c, state.library.message);
  }
  return c.html(
    <CollectionUpdaterEditorPage
      catalogAvailable={state.catalog.kind === 'ready'}
      updaters={collectionUpdaterEditorViewModels(state.catalog, state.library.updaters)}
      feedback={noticeFeedback(c.req.query('notice'))}
    />,
  );
});

app.get('/collection-updaters/collections', async (c) => {
  const catalog = await createCatalogStore().read();
  const search = (c.req.query('q') ?? '').trim();
  return c.json({
    search,
    kind: 'jellyfin.collection',
    items: collectionTypeaheadItems(catalog, search),
  } satisfies TypeaheadResponse);
});

app.get('/collection-updaters/run', async (c) => {
  const state = await loadState();
  if (state.library.kind === 'unavailable') {
    return c.html(
      <CollectionUpdaterRunDialog
        kind="library_unavailable"
        catalog={catalogStatusForPage(state.catalog)}
        message={state.library.message}
      />,
    );
  }
  const catalog = catalogStatusForPage(state.catalog);
  if (state.catalog.kind !== 'ready') {
    return c.html(<CollectionUpdaterRunDialog kind="catalog_unavailable" catalog={catalog} />);
  }
  const preview = collectionUpdaterPreviewForPage(state.catalog.catalog, state.library.updaters);
  if (!preview.totals.enabledUpdaters) {
    return c.html(<CollectionUpdaterRunDialog kind="no_enabled" catalog={catalog} />);
  }
  return c.html(<CollectionUpdaterRunDialog kind="preview" catalog={catalog} {...preview} />);
});

app.post('/collection-updaters/run', async (c) => {
  const state = await loadState();
  if (state.library.kind === 'unavailable' || state.catalog.kind !== 'ready') {
    return c.redirect('/jellyfin/collection-updaters?notice=run-unavailable', 303);
  }
  const preview = collectionUpdaterPreviewForPage(state.catalog.catalog, state.library.updaters);
  if (
    !preview.totals.enabledUpdaters ||
    !preview.totals.additions ||
    preview.missingCollectionIds.length
  ) {
    return c.redirect('/jellyfin/collection-updaters?notice=nothing-to-run', 303);
  }
  const id = c.var.actions.submitJellyfinCollectionUpdaters();
  return c.redirect(`/actions/${id}`, 303);
});

app.post('/collection-updaters/save', async (c) => {
  const serialized = (await c.req.raw.formData()).get('updaters');
  let proposed: unknown;
  try {
    proposed = typeof serialized === 'string' ? JSON.parse(serialized) : undefined;
  } catch {
    proposed = undefined;
  }
  const state = await loadState();
  if (state.library.kind === 'unavailable') {
    return unavailableLibraryResponse(c, state.library.message);
  }
  const storageDocument = collectionUpdaterStorageDocument(proposed);
  const catalogCollectionIds =
    state.catalog.kind === 'ready'
      ? state.catalog.catalog.collections.map((collection) => collection.id)
      : [];
  const targetError = validateProposedUpdaterTargets(
    storageDocument,
    state.library.updaters,
    catalogCollectionIds,
  );
  if (targetError) {
    return saveErrorResponse(
      c,
      state.catalog,
      state.library.updaters,
      storageDocument,
      `Changes were not saved. ${targetError.path}: ${targetError.message}`,
      400,
    );
  }
  try {
    const result = await createCollectionUpdaterLibrary().replace(storageDocument);
    if ('code' in result) {
      return saveErrorResponse(
        c,
        state.catalog,
        state.library.updaters,
        storageDocument,
        `Changes were not saved. ${result.path}: ${result.message}`,
        400,
      );
    }
    return c.redirect('/jellyfin/collection-updaters?notice=saved', 303);
  } catch {
    return saveErrorResponse(
      c,
      state.catalog,
      state.library.updaters,
      storageDocument,
      'Changes could not be saved. Try again.',
      503,
    );
  }
});

function saveErrorResponse(
  c: Context<AtlasEnv>,
  catalog: CatalogReadResult,
  savedUpdaters: SavedCollectionUpdater[],
  proposed: unknown,
  message: string,
  status: 400 | 503,
) {
  const updaters = Array.isArray(proposed) ? proposed : savedUpdaters;
  return c.html(
    <CollectionUpdaterEditorPage
      catalogAvailable={catalog.kind === 'ready'}
      updaters={collectionUpdaterEditorViewModels(catalog, updaters as SavedCollectionUpdater[])}
      feedback={{kind: 'error', message}}
      initiallyDirty
    />,
    status,
  );
}

function collectionUpdaterStorageDocument(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map((updater) => {
    if (
      typeof updater !== 'object' ||
      updater === null ||
      !('collection' in updater) ||
      typeof updater.collection !== 'object' ||
      updater.collection === null ||
      !('id' in updater.collection) ||
      typeof updater.collection.id !== 'string'
    ) {
      return updater;
    }
    const {collection, ...storageUpdater} = updater;
    return {...storageUpdater, collectionId: collection.id};
  });
}

type RequestState = {
  catalog: CatalogReadResult;
  library:
    {kind: 'ready'; updaters: SavedCollectionUpdater[]} | {kind: 'unavailable'; message: string};
};

async function loadState(): Promise<RequestState> {
  const [catalog, library] = await Promise.allSettled([
    createCatalogStore().read(),
    createCollectionUpdaterLibrary().list(),
  ]);
  return {
    catalog:
      catalog.status === 'fulfilled'
        ? catalog.value
        : {kind: 'unavailable', reason: 'read_failed', cause: toError(catalog.reason)},
    library:
      library.status === 'fulfilled'
        ? {kind: 'ready', updaters: library.value}
        : {
            kind: 'unavailable',
            message: 'Saved Collection Updaters are unavailable. Repair the saved file and reload.',
          },
  };
}

function noticeFeedback(notice?: string): CollectionUpdaterEditorPageProps['feedback'] {
  switch (notice) {
    case 'saved':
      return {kind: 'success', message: 'Collection Updater changes saved.'};
    case 'run-unavailable':
      return {
        kind: 'error',
        message: 'The run could not be queued because its saved data is unavailable.',
      };
    case 'nothing-to-run':
      return {
        kind: 'error',
        message:
          'The run could not be queued because the cached preview has no actionable changes.',
      };
    default:
      return undefined;
  }
}

function unavailableLibraryResponse(c: Context<AtlasEnv>, message: string) {
  return c.html(
    <JellyfinLayout
      activePath="/jellyfin/collection-updaters"
      title="Collection Updaters unavailable"
    >
      <PageHeader title="Collection Updaters unavailable" />
      <Alert variant="error">{message}</Alert>
    </JellyfinLayout>,
    503,
  );
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

export const jellyfinApp: AtlasApp = {
  id: 'jellyfin',
  mountPath: '/jellyfin',
  app,
};
