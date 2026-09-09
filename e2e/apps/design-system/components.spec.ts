import {expect, test} from '@playwright/test';
import {ComponentsPage} from './components.pom.ts';

test('sortable table headers replace the table with rows in the requested order', async ({
  page,
}) => {
  const components = new ComponentsPage(page);
  await components.goto();

  await expect(components.columnHeader('Server')).toHaveAttribute('aria-sort', 'ascending');
  await expect.poll(() => components.rowNames()).toEqual(['Archive', 'Atlas', 'Backup']);

  await components.sortBy('Server');

  await expect(components.columnHeader('Server')).toHaveAttribute('aria-sort', 'descending');
  await expect.poll(() => components.rowNames()).toEqual(['Backup', 'Atlas', 'Archive']);

  await components.sortBy('Storage');

  await expect(components.columnHeader('Storage')).toHaveAttribute('aria-sort', 'ascending');
  await expect.poll(() => components.rowNames()).toEqual(['Backup', 'Atlas', 'Archive']);
  await expect(components.columnHeader('Status').getByRole('button')).toHaveCount(0);
});

test('server-rendered toasts stack and can be dismissed', async ({page}) => {
  const components = new ComponentsPage(page);
  await components.goto();

  const successMessage = 'Your settings were saved successfully.';
  const errorMessage = 'Atlas could not connect to the server.';
  await components.toastButton('Success toast').click();
  const success = components.notification(successMessage);
  await expect(success).toBeVisible();

  await components.toastButton('Error toast').click();
  const error = components.notification(errorMessage);
  await expect(error).toBeVisible();
  await expect(components.notifications.getByRole('status')).toHaveCount(1);
  await expect(components.notifications.getByRole('alert')).toHaveCount(1);

  await error.getByRole('button', {name: 'Dismiss notification'}).click();
  await expect(error).toHaveCount(0);
  await expect(success).toBeVisible();
});

test('toast lifetime pauses while hovered and resumes after the pointer leaves', async ({page}) => {
  await page.clock.install();
  const components = new ComponentsPage(page);
  await components.goto();

  await components.toastButton('Info toast').click();
  const toast = components.notification('A new Atlas version is available.');
  await toast.hover();
  await page.clock.runFor(10_000);
  await expect(toast).toBeVisible();

  await components.toastButton('Info toast').hover();
  await page.clock.runFor(5_000);
  await expect(toast).toHaveCount(0);
});

test('toast lifetime pauses while focused and resumes when focus leaves', async ({page}) => {
  await page.clock.install();
  const components = new ComponentsPage(page);
  await components.goto();

  await components.toastButton('Warning toast').click();
  const toast = components.notification('Storage is nearing its configured capacity.');
  await toast.getByRole('button', {name: 'Dismiss notification'}).focus();
  await page.clock.runFor(10_000);
  await expect(toast).toBeVisible();

  await components.toastButton('Warning toast').focus();
  await page.clock.runFor(5_000);
  await expect(toast).toHaveCount(0);
});

test('an HTMX-loaded dialog remains usable when reopened and restores focus', async ({page}) => {
  const components = new ComponentsPage(page);
  await components.goto();

  await components.openDialog('Medium');
  await expect(components.modal).toBeVisible();
  await components.email.fill('first@example.com');
  await components.cancelDialog();
  await expect(components.modal).toBeHidden();
  await expect(components.launchDialogButton('Medium')).toBeFocused();

  await components.openDialog('Medium');
  await expect(components.email).toHaveValue('');
  await components.email.fill('second@example.com');
  await components.closeDialog();
  await expect(components.modal).toBeHidden();
  await expect(components.launchDialogButton('Medium')).toBeFocused();

  await page.setViewportSize({width: 390, height: 844});
  await components.openDialog('Medium');
  await expect(components.email).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(components.modal).toBeHidden();
  await expect(components.launchDialogButton('Medium')).toBeFocused();
});
