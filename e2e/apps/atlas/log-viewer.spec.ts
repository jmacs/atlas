import {expect, test} from '@playwright/test';

test('opens and dismisses the clear log confirmation', async ({page}) => {
  await page.goto('/atlas/log-viewer');

  await page.getByRole('button', {name: 'Clear log', exact: true}).click();

  const dialog = page.getByRole('dialog', {name: 'Clear Atlas log confirmation', exact: true});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('The current log will be archived')).toBeVisible();

  await dialog.getByRole('button', {name: 'Cancel', exact: true}).click();
  await expect(dialog).toBeHidden();
});
