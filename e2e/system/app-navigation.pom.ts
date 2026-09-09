import type {Locator, Page} from '@playwright/test';

export class AppNavigation {
  readonly menu: Locator;
  readonly designSystemPages: Locator;
  readonly openButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.menu = page.getByRole('navigation', {name: 'Apps', exact: true});
    this.designSystemPages = this.menu.getByRole('list', {name: 'Design system pages'});
    this.openButton = page.getByRole('button', {name: 'Open navigation'});
    this.closeButton = page.getByRole('button', {name: 'Close navigation'});
  }

  link(name: string) {
    return this.menu.getByRole('link', {name, exact: true});
  }

  async open() {
    await this.openButton.click();
  }
}
