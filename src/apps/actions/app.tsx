import {Hono} from 'hono';
import {streamSSE} from 'hono/streaming';
import {readActionLog} from '#lib/actions/logs.ts';
import {actionRuns} from '#lib/actions/runs.ts';
import type {AtlasApp, AtlasEnv} from '../../system/contracts.ts';
import {ActionDemoPage} from './ActionDemoPage.tsx';
import {ActionDetailPage} from './ActionDetailPage.tsx';
import {ActionList, ActionsPage} from './ActionsPage.tsx';
import {streamActionEvents} from './events.ts';
import {parseDummyForm} from './forms.ts';

const app = new Hono<AtlasEnv>();

app.get('/', (c) => {
  const page = Number(c.req.query('page') ?? 1);
  const actions = actionRuns.list(page);
  return c.html(<ActionsPage actions={actions} />);
});

app.get('/list', (c) => {
  const page = Number(c.req.query('page') ?? 1);
  const actions = actionRuns.list(page);
  return c.html(<ActionList actions={actions} />);
});

app.get('/demo', (c) => c.html(<ActionDemoPage />));

app.post('/demo', async (c) => {
  const form = parseDummyForm(await c.req.parseBody());
  if (!form.valid) {
    return c.html(<ActionDemoPage {...form} />, 400);
  }
  const id = c.var.actions.submitDummy(form.payload);
  return c.redirect(`/actions/${id}`, 303);
});

app.post('/cleanup', async (c) => {
  const summary = await c.var.scheduler.cleanup();
  return c.json(summary);
});

app.get('/:id', (c) => {
  const action = actionRuns.get(c.req.param('id'));
  if (!action) {
    return c.notFound();
  }
  return c.html(<ActionDetailPage action={action} />);
});

app.get('/:id/events', (c) => {
  const action = actionRuns.get(c.req.param('id'));
  if (!action) {
    return c.notFound();
  }
  c.header('Cache-Control', 'no-cache, no-transform');
  c.header('X-Accel-Buffering', 'no');
  return streamSSE(c, (stream) => streamActionEvents(stream, action));
});

app.get('/:id/log', async (c) => {
  const action = actionRuns.get(c.req.param('id'));
  if (!action) {
    return c.notFound();
  }
  const log = await readActionLog(action.id);
  if (log === undefined) {
    return c.notFound();
  }
  c.header('Content-Type', 'application/x-ndjson; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="action-${action.id}.jsonl"`);
  return c.body(log);
});

export const actionsApp: AtlasApp = {
  id: 'actions',
  mountPath: '/actions',
  app,
};
