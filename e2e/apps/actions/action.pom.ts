import type {Locator, Page} from '@playwright/test';

export class ActionPage {
  readonly page: Page;
  readonly status: Locator;
  readonly logs: Locator;
  readonly connection: Locator;
  readonly result: Locator;
  readonly allActions: Locator;
  readonly details: Locator;
  readonly error: Locator;
  readonly downloadLog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.status = page.locator('#action-status');
    this.logs = page.getByLabel('Action logs');
    this.connection = page.locator('#action-connection');
    this.result = page.locator('#action-result');
    this.allActions = page.getByRole('link', {name: 'All actions', exact: true});
    this.details = page.getByText('Run details', {exact: false});
    this.error = page.getByRole('region', {name: 'Run error'});
    this.downloadLog = page.getByRole('link', {name: 'Download log', exact: true});
  }

  run(id: string) {
    return this.page.getByRole('link').filter({hasText: `Run ${id.slice(0, 8)}`});
  }

  async openHistory() {
    await this.allActions.click();
    await this.page.waitForURL(/\/actions$/);
  }

  async openRun(id: string) {
    await this.run(id).click();
    await this.page.waitForURL(new RegExp(`/actions/${id}$`));
  }
}
