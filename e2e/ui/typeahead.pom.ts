import type {Locator, Page} from '@playwright/test';

export class Typeahead {
  readonly dialog: Locator;
  readonly listbox: Locator;
  readonly options: Locator;
  readonly search: Locator;
  readonly status: Locator;
  readonly trigger: Locator;

  constructor(page: Page, label = 'Cities') {
    this.trigger = page.getByRole('button', {name: new RegExp(`^${label}:`)});
    this.dialog = page.getByRole('dialog', {
      name: `Select ${label.toLowerCase()}`,
      exact: true,
    });
    this.search = this.dialog.getByRole('combobox');
    this.options = this.dialog.getByRole('option');
    this.listbox = this.dialog.getByRole('listbox', {name: label, exact: true});
    this.status = this.dialog.getByRole('status');
  }

  option(name: string) {
    return this.dialog.getByRole('option', {name, exact: true});
  }

  async open() {
    await this.trigger.click();
  }

  async apply() {
    await this.dialog.getByRole('button', {name: 'Apply', exact: true}).click();
  }

  async cancel() {
    await this.dialog.getByRole('button', {name: 'Cancel', exact: true}).click();
  }
}
