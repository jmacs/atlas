import {expect, test} from '@playwright/test';

import {CollectionUpdaterEditorPom} from './collection-updater-editor.pom.ts';

test.beforeEach(async ({page}) => {
  await page.goto('/jellyfin');
  await page.getByRole('button', {name: 'Refresh catalog'}).click();
  await expect(
    page.getByRole('status').filter({hasText: 'Catalog refreshed successfully.'}),
  ).toBeVisible();
});

test('corrects a draft and submits ordered conditions', async ({page}) => {
  const editor = new CollectionUpdaterEditorPom(page);
  await editor.goto();

  const existingIds = await editor.updaterIds();
  await editor.newUpdaterButton.click();
  await editor.selectCollection('Comedy');
  await editor.dialog.getByRole('button', {name: 'Remove'}).click();
  await editor.dialog.getByRole('button', {name: 'Save updater'}).click();

  await expect(editor.dialog).toBeVisible();
  await expect(
    editor.dialog.getByRole('alert').filter({hasText: 'The updater could not be applied.'}),
  ).toContainText('Add at least one condition.');

  await editor.dialog.getByRole('button', {name: 'Add condition'}).click();
  await editor.dialog.getByLabel('Release year').fill('2001');
  await editor.dialog.getByRole('button', {name: 'Add condition'}).click();
  const secondCondition = editor.dialog.getByRole('group', {name: 'Condition 2'});
  await secondCondition.getByLabel('Field').selectOption('movie.genres');
  await secondCondition.getByLabel('Genres (comma separated)').fill('Comedy, Drama');
  await secondCondition.getByRole('button', {name: 'Move up'}).click();
  await editor.dialog.getByRole('button', {name: 'Save updater'}).click();

  const createdId = await editor.addedUpdaterId(existingIds);
  const submitted = await editor.captureSave();
  expect(submitted.find(({id}) => id === createdId)).toEqual({
    id: createdId,
    enabled: true,
    collectionId: 'genre-comedy',
    conditions: [
      {field: 'movie.genres', operator: 'includes_any', values: ['Comedy', 'Drama']},
      {field: 'movie.year', operator: 'eq', value: 2001},
    ],
  });
});

test('discards an isolated edit before submitting the corrected updater', async ({page}) => {
  const editor = new CollectionUpdaterEditorPom(page);
  await editor.goto();
  const updaterId = await editor.createYearUpdater('Science Fiction', '2023');
  const updater = editor.updater(updaterId);

  await editor.expand(updaterId);
  const editButton = updater.getByRole('button', {name: 'Edit'});
  await editButton.click();
  await editor.dialog.getByLabel('Release year').fill('1984');
  await page.keyboard.press('Escape');

  await expect(editor.dialog).not.toBeVisible();
  await expect(editButton).toBeFocused();
  await editButton.click();
  await expect(editor.dialog.getByLabel('Release year')).toHaveValue('2023');
  await editor.dialog.getByLabel('Release year').fill('2005');
  await editor.dialog.getByRole('button', {name: 'Save updater'}).click();

  await expect(updater.getByText('Release year is 2005')).toBeVisible();
  const submitted = await editor.captureSave();
  expect(submitted.find(({id}) => id === updaterId)).toEqual({
    id: updaterId,
    enabled: true,
    collectionId: 'genre-science-fiction',
    conditions: [{field: 'movie.year', operator: 'eq', value: 2005}],
  });
});

test('enables, orders, and deletes staged updaters before submitting', async ({page}) => {
  const editor = new CollectionUpdaterEditorPom(page);
  await editor.goto();
  const comedyId = await editor.createYearUpdater('Comedy', '1999');
  const ninetiesId = await editor.createYearUpdater('1990s', '1990');

  await editor.expand(comedyId);
  const comedy = editor.updater(comedyId);
  await comedy.getByRole('button', {name: 'Disable'}).click();
  await expect(comedy.getByText('Disabled', {exact: true})).toBeVisible();
  await comedy.getByRole('button', {name: 'Enable'}).click();
  await expect(comedy.getByText('Enabled', {exact: true})).toBeVisible();

  await editor.expand(ninetiesId);
  await editor.updater(ninetiesId).getByRole('button', {name: 'Move up'}).click();
  const orderedIds = await editor.updaterIds();
  expect(orderedIds.indexOf(ninetiesId)).toBe(orderedIds.indexOf(comedyId) - 1);

  await editor.updater(comedyId).getByRole('button', {name: 'Delete'}).click();
  await expect(editor.updater(comedyId)).toHaveCount(0);

  const submitted = await editor.captureSave();
  expect(submitted.some(({id}) => id === comedyId)).toBe(false);
  expect(submitted.find(({id}) => id === ninetiesId)).toEqual({
    id: ninetiesId,
    enabled: true,
    collectionId: 'decade-1990',
    conditions: [{field: 'movie.year', operator: 'eq', value: 1990}],
  });
});

test('persists a newly saved updater across reload', async ({page}) => {
  const editor = new CollectionUpdaterEditorPom(page);
  await editor.goto();
  const updaterId = await editor.createYearUpdater('Fantasy', '1987');

  await editor.saveChangesButton.click();
  await expect(page).toHaveURL(/\/jellyfin\/collection-updaters\?notice=saved$/);
  await expect(page.getByRole('status')).toHaveText('Collection Updater changes saved.');

  await page.reload();
  await editor.expand(updaterId);
  await expect(editor.updater(updaterId).getByText('Release year is 1987')).toBeVisible();

  await editor.updater(updaterId).getByRole('button', {name: 'Delete'}).click();
  await editor.saveChangesButton.click();
  await expect(page).toHaveURL(/\/jellyfin\/collection-updaters\?notice=saved$/);
  await page.reload();
  await expect(editor.updater(updaterId)).toHaveCount(0);
});
