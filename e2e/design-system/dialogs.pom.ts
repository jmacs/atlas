import type {Locator, Page} from '@playwright/test';

export class DialogsPage {
  private readonly page: Page;
  readonly modal: Locator;
  readonly email: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByRole('dialog', {name: 'Invite team member'});
    this.email = this.modal.getByLabel('Email address');
  }

  launchButton(size: string) {
    return this.page.getByRole('button', {name: `${size} dialog`, exact: true});
  }

  async goto() {
    await this.page.goto('/design-system/dialogs');
  }

  async open(size: string) {
    await this.launchButton(size).click();
  }

  async cancel() {
    await this.modal.getByRole('button', {name: 'Cancel', exact: true}).click();
  }

  async close() {
    await this.modal.getByRole('button', {name: 'Close dialog', exact: true}).click();
  }

  async escape() {
    await this.page.keyboard.press('Escape');
  }
}
