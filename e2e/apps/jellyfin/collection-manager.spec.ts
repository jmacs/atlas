import {expect, test} from '@playwright/test';

import {Typeahead} from '../../ui/typeahead.pom.ts';

test('selects a collection and movies, reviews them, and updates Jellyfin', async ({page}) => {
  await page.goto('/jellyfin');
  const refreshResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/jellyfin/catalog/refresh',
  );
  await page.getByRole('button', {name: 'Refresh catalog'}).click();
  expect((await refreshResponse).ok()).toBe(true);

  await page
    .getByRole('navigation', {name: 'Explore Jellyfin tools'})
    .getByRole('link', {name: 'Manage Collection'})
    .click();
  await expect(page).toHaveURL('/jellyfin/collection-manager');

  const collections = new Typeahead(page, 'Collection');
  await collections.open();
  await collections.search.fill('Science Fiction');
  await collections.option('Science Fiction').click();

  const movies = new Typeahead(page, 'Movies');
  await movies.open();
  await movies.search.fill('Moon Men');
  await movies.option('Golly! Moon Men Ate My Rocket (1942)').click();
  await movies.search.fill('Mummy Wore');
  await movies.option('The Mummy Wore Roller Skates (1946)').click();
  await movies.apply();

  await expect(page.getByRole('heading', {name: 'Selected movies (2)'})).toBeVisible();
  const selectedMovies = page.getByRole('region', {name: 'Selected movies (2)'});
  await expect(
    selectedMovies.getByText('Golly! Moon Men Ate My Rocket (1942)', {exact: true}),
  ).toBeVisible();
  await expect(
    selectedMovies.getByText('The Mummy Wore Roller Skates (1946)', {exact: true}),
  ).toBeVisible();

  await page.getByRole('button', {name: 'Update collections'}).click();

  await expect(page).toHaveURL('/jellyfin/collection-manager?notice=updated');
  await expect(
    page.getByRole('status').filter({hasText: 'The selected movies were added to the collection.'}),
  ).toBeVisible();
});
