import {expect, test} from 'vitest';

import {atlasApp} from './app.tsx';

test('navigation source lists searchable visible parents and children', async () => {
  const response = await atlasApp.app.request('/navigation');
  const {items} = (await response.json()) as {items: Array<{icon?: string; name: string}>};

  expect(items.map(({name}) => name)).toEqual(
    expect.arrayContaining(['Atlas', 'Atlas / Log Viewer']),
  );

  const icon = await atlasApp.app.request(items[0]!.icon!.replace('/atlas', ''));
  expect(icon.headers.get('content-type')).toContain('image/svg+xml');
  expect(await icon.text()).toContain('<svg');

  const empty = await atlasApp.app.request('/navigation?q=no-such-page');
  await expect(empty.json()).resolves.toMatchObject({items: []});
});
