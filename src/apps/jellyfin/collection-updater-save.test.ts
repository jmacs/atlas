import {expect, test} from 'vitest';

import {validateProposedUpdaterTargets} from './collection-updater-save.ts';

const condition = {field: 'movie.year' as const, operator: 'eq' as const, value: 1999};
const saved = [
  {
    id: 'saved-updater',
    enabled: true,
    collectionId: 'missing-saved-target',
    conditions: [condition],
  },
];

test('allows catalog targets and lets an updater retain its own missing saved target', () => {
  const proposed = [
    saved[0],
    {
      id: 'new-updater',
      enabled: true,
      collectionId: 'catalog-target',
      conditions: [condition],
    },
  ];

  expect(validateProposedUpdaterTargets(proposed, saved, ['catalog-target'])).toBeUndefined();
});

test('rejects assigning a missing saved target to another updater', () => {
  const proposed = [
    {
      id: 'new-updater',
      enabled: true,
      collectionId: 'missing-saved-target',
      conditions: [condition],
    },
  ];

  expect(validateProposedUpdaterTargets(proposed, saved, [])).toEqual({
    path: 'collectionUpdaters[0].collectionId',
    message: 'choose a target from the current cached catalog or retain its saved target.',
  });
});
