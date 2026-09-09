import {expect, test} from '@playwright/test';

test.describe('authentication bypass', () => {
  test('redirects the login page to the requested destination', async ({page}) => {
    await page.goto('/login?next=%2Fdesign-system%2Fcomponents');

    await expect(page).toHaveURL(/\/design-system\/components$/);
  });
});
