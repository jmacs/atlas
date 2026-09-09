import type {Locator, Page} from '@playwright/test';

export class QuickNav {
  readonly dialog: Locator;
  readonly search: Locator;
  readonly trigger: Locator;

  constructor(page: Page) {
    this.trigger = page.getByRole('button', {name: 'Quick navigation', exact: true});
    this.dialog = page.getByRole('dialog', {name: 'Select quick navigation', exact: true});
    this.search = this.dialog.getByRole('combobox');
  }

  option(name: string) {
    return this.dialog.getByRole('option', {name, exact: true});
  }
}
