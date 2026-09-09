import {expect, test} from '@playwright/test';
import {QuickNav} from './quick-nav.pom.ts';

test('shortcut, dismissal, description search, and keyboard navigation', async ({page}) => {
  await page.goto('/design-system/components');
  const nav = new QuickNav(page);
  for (const shortcut of ['Control+k', 'Meta+k']) {
    await page.keyboard.press(shortcut);
    await expect(nav.search).toBeFocused();
    await nav.search.press('Escape');
    await expect(nav.dialog).toBeHidden();
    await expect(nav.trigger).toBeFocused();
  }
  await nav.trigger.click();
  await nav.search.fill('  PALETTES  ');
  const option = nav.option('Design system / Color palettes');
  await expect(option).toBeVisible();
  await expect(option).toHaveAccessibleDescription(
    'Explore the palettes and semantic colors that give Atlas its visual identity.',
  );
  await expect(option.getByText('/design-system/colors', {exact: true})).toBeVisible();
  await nav.search.press('ArrowDown');
  await nav.search.press('Enter');
  await expect(page).toHaveURL('/design-system/colors');
});
