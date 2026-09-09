import type {Locator, Page} from '@playwright/test';

export class ActionDemoPage {
  readonly page: Page;
  readonly interval: Locator;
  readonly turns: Locator;
  readonly outcome: Locator;
  readonly submit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.interval = page.getByRole('spinbutton', {name: 'Interval (milliseconds)'});
    this.turns = page.getByRole('spinbutton', {name: 'Number of turns'});
    this.outcome = page.getByRole('combobox', {name: 'End state'});
    this.submit = page.getByRole('button', {name: 'Run dummy action'});
  }
  async runDummy(
    intervalMs: number,
    outcome: 'succeeded' | 'failed' | 'interrupted' = 'succeeded',
    turns = 1,
  ): Promise<string> {
    await this.page.goto('/actions/demo');
    await this.interval.fill(String(intervalMs));
    await this.turns.fill(String(turns));
    await this.outcome.selectOption(outcome);
    await this.submit.click();
    await this.page.waitForURL(/\/actions\/[0-9a-f-]+$/);
    const id = new URL(this.page.url()).pathname.split('/').at(-1);
    if (!id) {
      throw new Error('Action submission did not navigate to an action run.');
    }
    return id;
  }
}
