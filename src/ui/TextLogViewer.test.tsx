import {renderToReadableStream} from 'hono/jsx/streaming';
import {expect, test} from 'vitest';

import {TextLogViewer} from './TextLogViewer.tsx';

async function renderViewer(log: string) {
  const stream = renderToReadableStream(
    <TextLogViewer title="Atlas log" emptyMessage="No log entries yet." log={log} />,
  );
  return new Response(stream).text();
}

test('renders plain-text log content', async () => {
  await expect(renderViewer('[info] Atlas started')).resolves.toContain('[info] Atlas started');
});

test('renders an empty message when the log has no content', async () => {
  await expect(renderViewer('')).resolves.toContain('No log entries yet.');
});
