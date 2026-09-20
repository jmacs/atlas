import {readFile} from 'node:fs/promises';
import {Hono} from 'hono';

import {CONFIG} from '#lib/config.ts';
import type {AtlasApp, AtlasEnv} from '../../system/contracts.ts';
import {Confirm} from '../../ui/Confirm.tsx';
import {Icon} from '../../ui/Icon.tsx';
import {TextLogViewer} from '../../ui/TextLogViewer.tsx';
import {Toast} from '../../ui/Toast.tsx';
import type {TypeaheadResponse} from '../../ui/Typeahead.tsx';
import {navigation} from '../navigation.ts';
import {AtlasHomePage} from './AtlasHomePage.tsx';
import {LogViewerPage} from './LogViewerPage.tsx';
import {archiveAndClearApplicationLog} from './application-log.ts';

const entries = navigation
  .filter((item) => !item.hidden)
  .flatMap((parent) => [
    parent,
    ...(parent.children ?? [])
      .filter((child) => !child.hidden)
      .map((child) => ({
        ...child,
        label: `${parent.label} / ${child.label}`,
      })),
  ]);
const navigationItems = entries.map((item, index) => ({
  value: item.href,
  name: item.label,
  description: item.description,
  href: item.href,
  icon: item.icon ? `/atlas/navigation/icons/${index}` : undefined,
}));
const searchableItems = navigationItems.map((item) => ({
  item,
  text: `${item.name} ${item.description ?? ''}`.toLowerCase(),
}));

const app = new Hono<AtlasEnv>();

app.get('/', (c) => c.html(<AtlasHomePage />));

app.get('/log-viewer', async (c) => {
  const log = await readApplicationLog();
  return c.html(<LogViewerPage log={log} />);
});

app.get('/log-viewer/clear-confirmation', (c) =>
  c.html(
    <Confirm
      title="Clear Atlas log?"
      message="The current log will be archived and replaced with a new empty log file."
      confirmLabel="Clear log"
      confirmVariant="danger"
      confirmButtonProps={{
        'hx-post': '/atlas/log-viewer/clear',
        'hx-target': '#clear-log-dialog .dialog__panel',
        'hx-swap': 'none',
      }}
    />,
  ),
);

app.post('/log-viewer/clear', async (c) => {
  await archiveAndClearApplicationLog({
    archiveDirectory: CONFIG.paths.logs,
    logPath: CONFIG.paths.applicationLog,
  });
  c.header('X-Atlas-Dialog-Response', 'true');
  return c.html(
    <>
      <TextLogViewer
        id="atlas-log-viewer"
        hx-swap-oob="outerHTML"
        title="Atlas log"
        regionLabel="Atlas application log"
        emptyMessage="No log entries yet."
        log=""
      />
      <Toast oob variant="success">
        Atlas log cleared.
      </Toast>
    </>,
  );
});

app.get('/navigation', (c) => {
  const search = (c.req.query('q') ?? '').trim();
  const query = search.toLowerCase();
  const items = searchableItems.filter(({text}) => text.includes(query)).map(({item}) => item);
  return c.json({search, kind: 'atlas.navigation', items} satisfies TypeaheadResponse);
});

app.get('/navigation/icons/:index', (c) => {
  const icon = entries[Number(c.req.param('index'))]?.icon;
  if (!icon) {
    return c.notFound();
  }
  c.header('Content-Type', 'image/svg+xml');
  return c.body((<Icon icon={icon} xmlns="http://www.w3.org/2000/svg" />).toString());
});

export const atlasApp: AtlasApp = {id: 'atlas', mountPath: '/atlas', app};

async function readApplicationLog() {
  try {
    return await readFile(CONFIG.paths.applicationLog, 'utf8');
  } catch (error) {
    if (isMissingFile(error)) {
      return '';
    }
    throw error;
  }
}

function isMissingFile(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}
