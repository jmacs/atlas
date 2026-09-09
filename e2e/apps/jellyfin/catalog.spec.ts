import {expect, test} from '@playwright/test';

test('refreshes, persists, and browses the fixed Jellyfin catalog', async ({page}) => {
  await page.goto('/jellyfin');

  const refreshResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/jellyfin/catalog/refresh',
  );
  await page.getByRole('button', {name: 'Refresh catalog'}).click();
  expect((await refreshResponse).ok()).toBe(true);
  await expect(
    page.getByRole('status').filter({hasText: 'Catalog refreshed successfully.'}),
  ).toBeVisible();
  await expectCatalogCounts(page);

  await page.reload();
  await expectCatalogCounts(page);

  await page
    .getByRole('navigation', {name: 'Explore Jellyfin tools'})
    .getByRole('link', {name: 'Catalog'})
    .click();
  await expect(page).toHaveURL('/jellyfin/catalog');
  await expect(page.getByRole('heading', {name: 'Collections (16)'})).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Movies (27)'})).toBeVisible();
  const movieButton = page.getByRole('button', {
    name: 'View Golly! Moon Men Ate My Rocket memberships',
  });
  await expect(movieButton).toBeVisible();

  const collectionButton = page.getByRole('button', {name: 'View Science Fiction members'});
  await collectionButton.click();
  const dialog = page.getByRole('dialog', {name: 'Science Fiction'});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Golly! Moon Men Ate My Rocket (1942)')).toBeVisible();
  await expect(dialog.getByText('Moon Patrol: The Saturday Serials (1953)')).toBeVisible();
  await dialog.getByRole('button', {name: 'Close', exact: true}).click();
  await expect(dialog).not.toBeVisible();
  await expect(collectionButton).toBeFocused();

  await movieButton.click();
  const movieDialog = page.getByRole('dialog', {name: 'Golly! Moon Men Ate My Rocket'});
  await expect(movieDialog).toBeVisible();
  await expect(movieDialog.getByRole('heading', {name: 'Collections (3)'})).toBeVisible();
  await expect(movieDialog.getByText('1940s', {exact: true})).toBeVisible();
  await expect(movieDialog.getByText('Comedy', {exact: true})).toBeVisible();
  await expect(movieDialog.getByText('Science Fiction', {exact: true})).toBeVisible();
  await movieDialog.getByRole('button', {name: 'Close', exact: true}).click();
  await expect(movieButton).toBeFocused();
});

async function expectCatalogCounts(page: import('@playwright/test').Page) {
  const catalog = page.locator('#catalog-card');
  await expect(catalog.getByText('16', {exact: true})).toBeVisible();
  await expect(catalog.getByText('27', {exact: true})).toBeVisible();
  await expect(catalog.getByText('3', {exact: true})).toBeVisible();
}
