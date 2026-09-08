import {expect, test} from '@playwright/test';

test.describe('authentication bypass', () => {
  test('redirects the login page to the requested destination', async ({page}) => {
    await page.goto('/login?next=%2Fdesign-system%2Fcomponents');

    await expect(page).toHaveURL(/\/design-system\/components$/);
  });

  test('accepts a login submission without credentials', async ({request}) => {
    const response = await request.post('/login', {
      form: {next: '/design-system/dialogs'},
      maxRedirects: 0,
    });

    expect(response.status()).toBe(303);
    expect(response.headers().location).toBe('/design-system/dialogs');
  });
});
