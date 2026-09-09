import {expect, test} from '@playwright/test';
import {AppNavigation} from '../../system/app-navigation.pom.ts';

const destinations = [
  {
    href: '/design-system/components',
    label: 'Components',
  },
  {
    href: '/design-system/typography',
    label: 'Typography',
  },
  {
    href: '/design-system/colors',
    label: 'Color palettes',
  },
];

test('overview exposes each design system page and opens a representative destination', async ({
  page,
}) => {
  const navigation = new AppNavigation(page);
  await page.goto('/design-system');
  await expect(page.getByRole('heading', {level: 1})).toHaveText('Design system');

  const grid = page.getByRole('navigation', {name: 'Explore the design system'});
  for (const {href, label} of destinations) {
    await expect(grid.getByRole('link', {name: new RegExp(`^${label}`)})).toHaveAttribute(
      'href',
      href,
    );
  }

  await grid.getByRole('link', {name: /^Components/}).click();
  await expect(page).toHaveURL('/design-system/components');
  await navigation.open();
  await expect(navigation.link('Components')).toHaveAttribute('aria-current', 'page');
});
