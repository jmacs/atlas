import {expect, test} from '@playwright/test';
import {AppNavigation} from '../../system/app-navigation.pom.ts';

test('navigation reaches apps and nested pages and restores keyboard focus', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  const navigation = new AppNavigation(page);
  await page.goto('/design-system/components');
  await navigation.open();

  await expect(navigation.menu.getByRole('link')).toHaveText([
    'Dashboard',
    'Actions',
    'Jellyfin',
    'Design system',
    'Components',
    'Typography',
    'Color palettes',
  ]);
  await expect(navigation.link('Components')).toHaveAttribute('aria-current', 'page');

  await navigation.link('Typography').click();
  await expect(page).toHaveURL('/design-system/typography');
  await navigation.open();
  await expect(navigation.link('Typography')).toHaveAttribute('aria-current', 'page');

  await navigation.link('Jellyfin').click();
  await expect(page).toHaveURL('/jellyfin');
  await navigation.open();
  await expect(navigation.menu.getByRole('link')).toHaveText([
    'Dashboard',
    'Actions',
    'Jellyfin',
    'Catalog',
    'Manage Collection',
    'Collection Updaters',
    'Design system',
  ]);
  await expect(navigation.link('Jellyfin')).toHaveAttribute('aria-current', 'page');
  await navigation.link('Catalog').click();
  await expect(page).toHaveURL('/jellyfin/catalog');

  await navigation.open();
  await page.keyboard.press('Escape');
  await expect(navigation.menu).toBeHidden();
  await expect(navigation.openButton).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(navigation.menu).toBeVisible();
});
