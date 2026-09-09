import {expect, test} from 'vitest';
import {renderToReadableStream} from 'hono/jsx/streaming';
import {Document} from './Document.tsx';

async function renderDocument({
  scripts,
  stylesheets,
}: {
  scripts?: `/scripts/${string}.js`[];
  stylesheets?: `/styles/${string}.css`[];
} = {}) {
  const stream = renderToReadableStream(
    <Document title="Test" scripts={scripts} stylesheets={stylesheets}>
      <main>Page</main>
    </Document>,
  );
  return new Response(stream).text();
}

test('renders the import map followed by the shared app script', async () => {
  const document = await renderDocument();

  expect(document).toContain('"htmx.org":"/modules/htmx.org/htmx.esm.js"');
  expect(document).toContain('"alpinejs":"/modules/alpinejs/module.esm.js"');
  expect(document.match(/<script type="module"/g)).toHaveLength(1);
  expect(document).toContain('<script type="module" src="/scripts/app.js"></script>');
  expect(document).toContain('<meta name="atlas-timezone" content="America/Moncton"/>');
});

test('keeps page scripts ordered and emits each module only once', async () => {
  const document = await renderDocument({
    scripts: [
      '/scripts/apps/example/first.js',
      '/scripts/app.js',
      '/scripts/apps/example/second.js',
      '/scripts/apps/example/first.js',
    ],
  });
  const scripts = [...document.matchAll(/<script type="module" src="([^"]+)"><\/script>/g)].map(
    ([, src]) => src,
  );

  expect(scripts).toEqual([
    '/scripts/app.js',
    '/scripts/apps/example/first.js',
    '/scripts/apps/example/second.js',
  ]);
  expect(document.indexOf('type="importmap"')).toBeLessThan(document.indexOf('/scripts/app.js'));
});

test('keeps page stylesheets ordered and emits each one only once', async () => {
  const document = await renderDocument({
    stylesheets: [
      '/styles/apps/example/first.css',
      '/styles/apps/example/second.css',
      '/styles/apps/example/first.css',
    ],
  });
  const stylesheets = [...document.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(
    ([, href]) => href,
  );

  expect(stylesheets).toEqual([
    '/styles/app.css',
    '/styles/apps/example/first.css',
    '/styles/apps/example/second.css',
  ]);
});
