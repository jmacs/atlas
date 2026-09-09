import {expect, test} from 'vitest';

import {globalApp} from './app.tsx';

test('navigation source lists searchable visible parents and children', async () => {
  const response = await globalApp.app.request('/navigation');
  const {items} = (await response.json()) as {items: Array<{icon?: string; name: string}>};

  expect(items.map(({name}) => name)).toEqual([
    'Actions',
    'Jellyfin',
    'Jellyfin / Catalog',
    'Jellyfin / Collection Updaters',
    'Design system',
    'Design system / Components',
    'Design system / Typography',
    'Design system / Color palettes',
  ]);

  const icon = await globalApp.app.request(items[0]!.icon!.replace('/global', ''));
  expect(icon.headers.get('content-type')).toContain('image/svg+xml');
  expect(await icon.text()).toContain('<svg');

  const empty = await globalApp.app.request('/navigation?q=no-such-page');
  await expect(empty.json()).resolves.toMatchObject({items: []});
});
