import {renderToReadableStream} from 'hono/jsx/streaming';
import {expect, test} from 'vitest';
import {CollectionUpdaterRunDialog} from './CollectionUpdaterRunDialog.tsx';

async function render(page: Parameters<typeof renderToReadableStream>[0]) {
  return new Response(renderToReadableStream(page)).text();
}

const catalog = {
  kind: 'available' as const,
  pulledAt: '2026-09-14T12:00:00.000Z',
  collections: 2,
  movies: 3,
  series: 0,
};

test('renders only changed collections and enables queueing', async () => {
  const document = await render(
    <CollectionUpdaterRunDialog
      kind="preview"
      catalog={catalog}
      totals={{enabledUpdaters: 3, additions: 2, changedCollections: 1}}
      missingCollectionIds={[]}
      collections={[
        {
          collection: {id: 'changed', name: 'Changed'},
          additionCount: 2,
          movieSample: [
            {id: 'one', label: 'One (2000)'},
            {id: 'two', label: 'Two (2010)'},
          ],
          omittedMovieCount: 0,
        },
      ]}
    />,
  );

  expect(document).toContain('Changed');
  expect(document).toContain('2 movies would be added.');
  const queueButton = document.match(/<button[^>]*type="submit"[^>]*>Queue run<\/button>/)?.[0];
  expect(queueButton).toBeDefined();
  expect(queueButton).not.toMatch(/\sdisabled(?:[=\s>])/);
});

test('disables queueing and explains an empty preview', async () => {
  const document = await render(
    <CollectionUpdaterRunDialog
      kind="preview"
      catalog={catalog}
      totals={{enabledUpdaters: 2, additions: 0, changedCollections: 0}}
      missingCollectionIds={[]}
      collections={[]}
    />,
  );

  expect(document).toContain('There are no changes to queue.');
  expect(document).toMatch(
    /<button[^>]*type="submit"[^>]*\sdisabled(?:[=\s>])[^>]*>Queue run<\/button>/,
  );
});

test('disables queueing when a target is missing', async () => {
  const document = await render(
    <CollectionUpdaterRunDialog
      kind="preview"
      catalog={catalog}
      totals={{enabledUpdaters: 1, additions: 1, changedCollections: 1}}
      missingCollectionIds={['missing']}
      collections={[
        {
          collection: {id: 'changed', name: 'Changed'},
          additionCount: 1,
          movieSample: [{id: 'one', label: 'One'}],
          omittedMovieCount: 0,
        },
      ]}
    />,
  );

  expect(document).toContain('missing');
  expect(document).toMatch(
    /<button[^>]*type="submit"[^>]*\sdisabled(?:[=\s>])[^>]*>Queue run<\/button>/,
  );
});
