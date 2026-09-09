import {expect, test} from 'vitest';

import {designSystemApp} from './app.tsx';

test('city search normalizes its query and returns the source contract', async () => {
  const response = await designSystemApp.app.request('/components/typeahead/cities?q=%20TOR%20');

  await expect(response.json()).resolves.toEqual({
    search: 'TOR',
    kind: 'design-system.city',
    items: [
      {
        value: 'toronto-on',
        name: 'Toronto, ON',
        description: 'Ontario',
        data: {provinceCode: 'ON', populationYear: 2021},
      },
      {value: 'victoria-bc', name: 'Victoria, BC', description: 'British Columbia'},
    ],
  });
});

test('city submission rejects unknown IDs', async () => {
  const response = await designSystemApp.app.request('/components/typeahead', {
    method: 'POST',
    body: new URLSearchParams({cities: 'unknown'}),
  });

  expect(response.status).toBe(422);
  expect(await response.text()).toContain('Select valid, unique city IDs.');
});
