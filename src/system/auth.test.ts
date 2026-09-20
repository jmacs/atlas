import {expect, test} from 'vitest';

import {isPublicPath} from './auth.tsx';

test('matches public app mount paths at segment boundaries', () => {
  const publicApps = ['/cinefile'] as const;

  expect(isPublicPath('/cinefile', publicApps)).toBe(true);
  expect(isPublicPath('/cinefile/search', publicApps)).toBe(true);
  expect(isPublicPath('/cinefile-admin', publicApps)).toBe(false);
  expect(isPublicPath('/jellyfin', publicApps)).toBe(false);
});
