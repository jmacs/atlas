import {expect, test} from '@playwright/test';
import {DialogsPage} from './dialogs.pom.ts';

test('all dialog sizes load, open, close, and restore focus', async ({page}) => {
  const dialogs = new DialogsPage(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await dialogs.goto();

  const widths: number[] = [];
  for (const size of ['Compact', 'Medium', 'Large']) {
    await dialogs.open(size);
    await expect(dialogs.modal).toBeVisible();
    await expect(dialogs.email).toBeVisible();
    const bounds = await dialogs.modal.boundingBox();
    widths.push(bounds!.width);
    await dialogs.cancel();
    await expect(dialogs.modal).toBeHidden();
    await expect(dialogs.launchButton(size)).toBeFocused();

    await dialogs.open(size);
    await expect(dialogs.modal).toBeVisible();
    await dialogs.close();
    await expect(dialogs.modal).toBeHidden();
    await expect(dialogs.launchButton(size)).toBeFocused();

    await dialogs.open(size);
    await expect(dialogs.modal).toBeVisible();
    await dialogs.escape();
    await expect(dialogs.modal).toBeHidden();
    await expect(dialogs.launchButton(size)).toBeFocused();
  }

  expect(widths[0]).toBeLessThan(widths[1]!);
  expect(widths[1]).toBeLessThan(widths[2]!);
  expect(errors).toEqual([]);
});

test('dialogs fill the mobile viewport without rounded corners', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  const dialogs = new DialogsPage(page);
  await dialogs.goto();

  for (const size of ['Compact', 'Medium', 'Large']) {
    await dialogs.open(size);

    await expect(dialogs.modal).toHaveCSS('width', '390px');
    await expect(dialogs.modal).toHaveCSS('height', '844px');
    await expect(dialogs.modal).toHaveCSS('border-top-left-radius', '0px');
    await expect(dialogs.modal.locator('.dialog__panel')).toHaveCSS(
      'border-top-left-radius',
      '0px',
    );

    await dialogs.cancel();
  }
});
