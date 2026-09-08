import type {Locator, Page} from '@playwright/test';

export class ComponentsPage {
  private readonly page: Page;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.getByRole('table', {name: 'Configured media servers'});
  }

  async goto() {
    await this.page.goto('/design-system');
  }

  columnHeader(name: string) {
    return this.table.getByRole('columnheader', {name});
  }

  async rowNames() {
    return this.table.locator('tbody tr td:first-child').allTextContents();
  }

  async sortBy(column: string) {
    await this.columnHeader(column).getByRole('button').click();
  }
}
