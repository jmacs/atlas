import {renderToReadableStream} from 'hono/jsx/streaming';
import {expect, test} from 'vitest';

import type {ActionRun} from '#lib/actions/runs.ts';
import {ActionDemoPage} from './ActionDemoPage.tsx';
import {ActionDetailPage} from './ActionDetailPage.tsx';
import {ActionsLayout} from './ActionsLayout.tsx';

async function render(page: Parameters<typeof renderToReadableStream>[0]) {
  return new Response(renderToReadableStream(page)).text();
}

function moduleScripts(document: string) {
  return [...document.matchAll(/<script type="module" src="([^"]+)"><\/script>/g)].map(
    ([, src]) => src,
  );
}

test('selects focused action scripts only for pages that use them', async () => {
  const ordinary = await render(
    <ActionsLayout title="Actions">
      <p>Actions</p>
    </ActionsLayout>,
  );
  const demo = await render(<ActionDemoPage />);
  const action: ActionRun = {
    id: '00000000-0000-4000-8000-000000000000',
    type: 'actions.dummy',
    payload: {intervalMs: 1, turns: 1, outcome: 'succeeded'},
    status: 'succeeded',
    queuedAt: '2026-09-14T12:00:00.000Z',
    startedAt: '2026-09-14T12:00:00.001Z',
    finishedAt: '2026-09-14T12:00:00.002Z',
    result: {outcome: 'succeeded'},
    error: null,
  };
  const detail = await render(<ActionDetailPage action={action} />);

  expect(moduleScripts(ordinary)).toEqual(['/scripts/app.js']);
  expect(moduleScripts(demo)).toEqual([
    '/scripts/app.js',
    '/scripts/apps/actions/action-submit.js',
  ]);
  expect(moduleScripts(detail)).toEqual([
    '/scripts/app.js',
    '/scripts/apps/actions/action-events.js',
  ]);
  expect(detail).toContain('href="/actions/00000000-0000-4000-8000-000000000000/log"');
  expect(detail).toContain('Download log');
});
