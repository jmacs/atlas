import {expect, test} from '@playwright/test';
import {Typeahead} from '../../ui/typeahead.pom.ts';

test.beforeEach(async ({page}) => {
  await page.goto('/design-system/components');
});

test('gallery examples expose named, keyboard-operable comboboxes', async ({page}) => {
  const city = new Typeahead(page, 'City');
  const cities = new Typeahead(page, 'Cities');

  await expect(city.trigger).toHaveAccessibleName('City: Select city');
  await expect(city.trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(city.trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(cities.trigger).toHaveAccessibleName('Cities: 1 selected');

  await city.open();
  await expect(city.dialog).toHaveAccessibleName('Select city');
  await expect(city.search).toHaveAccessibleName('Search city');
  await expect(city.search).toHaveAttribute('aria-autocomplete', 'list');
  await expect(city.search).toHaveAttribute('aria-expanded', 'true');
  await expect(city.listbox).not.toHaveAttribute('aria-multiselectable');

  const listboxId = await city.listbox.getAttribute('id');
  expect(listboxId).not.toBeNull();
  await expect(city.search).toHaveAttribute('aria-controls', listboxId!);

  await city.search.fill('toronto');
  await expect(city.status).toHaveText('1 results');
  await expect(city.option('Toronto, ON')).toHaveAccessibleDescription('Ontario');
  await expect(city.option('Toronto, ON')).toHaveAttribute('aria-selected', 'false');

  await city.search.press('ArrowDown');
  const torontoId = await city.option('Toronto, ON').getAttribute('id');
  await expect(city.search).toHaveAttribute('aria-activedescendant', torontoId!);

  await city.cancel();
  await expect(city.dialog).toBeHidden();
  await expect(city.trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(city.trigger).toBeFocused();

  await cities.open();
  await expect(cities.listbox).toHaveAttribute('aria-multiselectable', 'true');
  await expect(cities.option('Halifax, NS')).toHaveAttribute('aria-selected', 'true');
  await expect(cities.status).toHaveText('Type to search');
});

test('draft selection commits only on Apply and submits IDs through HTMX', async ({page}) => {
  const picker = new Typeahead(page);
  await picker.open();
  await expect(picker.option('Halifax, NS')).toHaveAttribute('aria-selected', 'true');
  await expect(picker.dialog.getByRole('status')).toHaveText('Type to search');
  await picker.search.fill('  TOR  ');
  await expect(picker.option('Toronto, ON').getByText('Ontario', {exact: true})).toBeVisible();
  await expect(picker.option('Toronto, ON')).toHaveAccessibleDescription('Ontario');
  await picker.option('Toronto, ON').click();
  await expect(picker.trigger).toHaveAccessibleName('Cities: 1 selected');
  await picker.cancel();
  await picker.open();
  await expect(picker.options).toHaveCount(1);
  await picker.search.fill('tor');
  await picker.option('Toronto, ON').click();
  await picker.apply();
  await expect(picker.trigger).toHaveAccessibleName('Cities: 2 selected');
  await expect(page.getByText('2 committed cities')).toBeVisible();
  await expect(picker.trigger).toBeFocused();
  await page.getByRole('button', {name: 'Submit cities'}).click();
  await expect(page.getByLabel('Notifications', {exact: true})).toContainText(
    'Selected cities: Halifax, NS; Toronto, ON.',
  );
  await picker.open();
  await picker.option('Halifax, NS').click();
  await picker.option('Toronto, ON').click();
  await picker.apply();
  await expect(picker.trigger).toHaveAccessibleName('Cities: Select cities');
  await page.getByRole('button', {name: 'Submit cities'}).click();
  await expect(page.getByLabel('Notifications', {exact: true})).toContainText(
    'No cities selected.',
  );
});

test('keyboard selection can be cancelled or applied', async ({page}) => {
  const picker = new Typeahead(page);
  await picker.open();
  await picker.search.fill('on');
  await expect(picker.option('Toronto, ON')).toBeVisible();
  await picker.search.press('Enter');
  await expect(picker.options.filter({hasText: 'Toronto'})).toHaveAttribute(
    'aria-selected',
    'false',
  );
  await picker.search.press('ArrowDown');
  await expect(picker.search).toBeFocused();
  await expect(picker.search).toHaveAttribute('aria-activedescendant', /typeahead-/);
  await picker.search.press('Enter');
  await picker.search.press('Escape');
  await expect(picker.trigger).toHaveAccessibleName('Cities: 1 selected');
  await expect(picker.trigger).toBeFocused();
  await picker.open();
  await picker.search.press('ArrowDown');
  await picker.search.press('Enter');
  await picker.apply();
  await expect(picker.trigger).toHaveAccessibleName('Cities: Select cities');
});

test('single selection commits immediately and picker stacks above an HTMX inserted dialog', async ({
  page,
}) => {
  await page.getByRole('button', {name: 'Open city dialog'}).click();
  const parent = page.getByRole('dialog', {name: 'City preferences', exact: true});
  const picker = new Typeahead(page, 'Destination');
  await picker.open();
  await expect(picker.dialog.getByRole('button', {name: 'Apply', exact: true})).toHaveCount(0);
  await picker.search.fill('on');
  await picker.option('Toronto, ON').click();
  await expect(picker.dialog).toBeHidden();
  await expect(picker.trigger).toHaveAccessibleName('Destination: Toronto, ON');
  await expect(picker.trigger).toBeFocused();
  await picker.open();
  await picker.search.fill('moncton');
  await expect(picker.option('Moncton, NB')).toBeVisible();
  await picker.search.press('ArrowDown');
  await picker.search.press('Enter');
  await expect(picker.dialog).toBeHidden();
  await expect(picker.trigger).toHaveAccessibleName('Destination: Moncton, NB');
  await picker.open();
  await picker.option('Moncton, NB').click();
  await expect(picker.dialog).toBeHidden();
  await expect(picker.trigger).toHaveAccessibleName('Destination: Select destination');
  await expect(parent).toBeVisible();
  await picker.open();
  await picker.search.press('Escape');
  await expect(parent).toBeVisible();
  await expect(picker.trigger).toBeFocused();
  await parent.getByRole('button', {name: 'Done'}).click();
  await expect(parent).toBeHidden();
});
