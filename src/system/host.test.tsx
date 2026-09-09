import {expect, test} from 'vitest';

import {createHost} from './host.tsx';

function testHost() {
  return createHost({
    apps: [],
    dependencies: {
      actions: {
        submitDummy: () => 'unused',
        submitJellyfinCollectionUpdaters: () => 'unused',
      },
      scheduler: {cleanup: async () => ({logsDeleted: 0, recordsDeleted: 0})},
    },
    staticPaths: [],
  });
}

test('rejects oversized request bodies before route parsing', async () => {
  const response = await testHost().request('/login', {
    method: 'POST',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({padding: 'x'.repeat(16_384)}),
  });

  expect(response.status).toBe(413);
  await expect(response.text()).resolves.toBe('Request body exceeds 16 KiB.');
});

test('authentication bypass accepts login submissions and preserves safe destinations', async () => {
  const response = await testHost().request('/login', {
    method: 'POST',
    body: new URLSearchParams({next: '/design-system/components'}),
  });

  expect(response.status).toBe(303);
  expect(response.headers.get('location')).toBe('/design-system/components');
});
