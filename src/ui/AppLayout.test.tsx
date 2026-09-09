import {renderToReadableStream} from 'hono/jsx/streaming';
import {expect, test} from 'vitest';

import {AppLayout} from './AppLayout.tsx';

test('renders one notification region outside the page content', async () => {
  const stream = renderToReadableStream(
    <AppLayout activePath="/" appName="Test" appHref="/" navigation={[]}>
      <p>Page content</p>
    </AppLayout>,
  );
  const document = await new Response(stream).text();
  const mainEnd = document.indexOf('</main>');
  const notificationRegion = document.indexOf('aria-label="Notifications"');

  expect(document.match(/aria-label="Notifications"/g)).toHaveLength(1);
  expect(notificationRegion).toBeGreaterThan(mainEnd);
});
