import {expect, test} from '@playwright/test';
import {ComponentsPage} from './components.pom.ts';

test('form fields associate labels and validation state with their controls', async ({page}) => {
  const components = new ComponentsPage(page);
  await components.goto();

  const serverName = page.getByLabel('Server name');
  await expect(serverName).toHaveAttribute('id', 'server-name');
  await expect(serverName).toHaveAttribute('aria-describedby', 'server-name-validation');
  await expect(serverName).not.toHaveAttribute('aria-invalid');

  const serverUrl = page.getByLabel('Server URL');
  await expect(serverUrl).toHaveAttribute('aria-invalid', 'true');
  await expect(serverUrl).toHaveAttribute('aria-describedby', 'server-url-validation');
  await expect(page.locator('#server-url-validation')).toHaveText('Enter a valid URL.');

  const serverNotes = page.getByLabel('Notes');
  await expect(serverNotes).toHaveAttribute('id', 'server-notes');
  await expect(serverNotes).toHaveAttribute('aria-describedby', 'server-notes-validation');
});

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

  await page.getByRole('button', {name: 'Success toast'}).click();
  await expect(page.getByRole('status')).toHaveText('Your settings were saved successfully.');

  await page.getByRole('button', {name: 'Error toast'}).click();
  const notifications = page.getByLabel('Notifications');
  await expect(notifications.locator('[data-toast]')).toHaveCount(2);
  await expect(notifications.locator('[data-toast]').first()).toContainText(
    'Atlas could not connect to the server.',
  );

  await notifications
    .getByRole('alert')
    .getByRole('button', {name: 'Dismiss notification'})
    .click();
  await expect(notifications.getByRole('alert')).toHaveCount(0);
  await expect(notifications.getByRole('status')).toHaveCount(1);
});

test('toasts animate out before they are automatically removed', async ({page}) => {
  const components = new ComponentsPage(page);
  await components.goto();

  await page.addStyleTag({
    content: ".toast[data-state='leaving'] { animation-duration: 1s !important; }",
  });
  await page.getByRole('button', {name: 'Info toast'}).click();

  const toast = page.getByRole('status');
  await expect(toast).toHaveAttribute('data-state', 'leaving', {timeout: 5500});
  await expect(toast).toHaveCSS('animation-name', 'toast-out');
  await expect
    .poll(() => toast.evaluate((element) => Number(getComputedStyle(element).opacity)))
    .toBeLessThan(0.8);
  await expect(toast).toHaveCount(0);
});
