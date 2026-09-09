import type {Locator, Page} from '@playwright/test';

export class ComponentsPage {
  private readonly page: Page;
  readonly table: Locator;
  readonly modal: Locator;
  readonly email: Locator;
  readonly notifications: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.getByRole('table', {name: 'Configured media servers'});
    this.modal = page.getByRole('dialog', {name: 'Invite team member'});
    this.email = this.modal.getByLabel('Email address');
    this.notifications = page.getByLabel('Notifications', {exact: true});
  }

  async goto() {
    await this.page.goto('/design-system/components');
  }

  columnHeader(name: string) {
    return this.table.getByRole('columnheader', {name});
  }

  async rowNames() {
    const rows = await this.table
      .getByRole('row')
      .filter({has: this.page.getByRole('cell')})
      .allTextContents();
    return rows.map((row) => ['Archive', 'Atlas', 'Backup'].find((name) => row.includes(name))!);
  }

  async sortBy(column: string) {
    await this.columnHeader(column).getByRole('button').click();
  }

  toastButton(name: string) {
    return this.page.getByRole('button', {name, exact: true});
  }

  notification(message: string) {
    return this.notifications
      .getByRole('status')
      .filter({hasText: message})
      .or(this.notifications.getByRole('alert').filter({hasText: message}));
  }

  launchDialogButton(size: string) {
    return this.page.getByRole('button', {name: `${size} dialog`, exact: true});
  }

  async openDialog(size: string) {
    await this.launchDialogButton(size).click();
  }

  async cancelDialog() {
    await this.modal.getByRole('button', {name: 'Cancel', exact: true}).click();
  }

  async closeDialog() {
    await this.modal.getByRole('button', {name: 'Close dialog', exact: true}).click();
  }
}
