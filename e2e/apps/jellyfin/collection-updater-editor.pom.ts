import type {Locator, Page} from '@playwright/test';
import {Typeahead} from '../../ui/typeahead.pom.ts';

export type SubmittedUpdater = {
  id: string;
  enabled: boolean;
  collectionId: string;
  conditions: unknown[];
};

export class CollectionUpdaterEditorPom {
  readonly allUpdaters: Locator;
  readonly dialog: Locator;
  readonly newUpdaterButton: Locator;
  readonly page: Page;
  readonly saveChangesButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.allUpdaters = page.locator('details[id^="collection-updater-"]');
    this.dialog = page.getByRole('dialog');
    this.newUpdaterButton = page.getByRole('button', {name: 'New updater'});
    this.saveChangesButton = page.getByRole('button', {name: 'Save changes'});
  }

  async goto() {
    await this.page.goto('/jellyfin/collection-updaters');
  }

  updater(id: string) {
    return this.page.locator(`[id="collection-updater-${id}"]`);
  }

  async createYearUpdater(collection: string, year: string) {
    const existingIds = await this.updaterIds();
    await this.newUpdaterButton.click();
    await this.selectCollection(collection);
    await this.dialog.getByLabel('Release year').fill(year);
    await this.dialog.getByRole('button', {name: 'Save updater'}).click();
    return this.addedUpdaterId(existingIds);
  }

  async selectCollection(title: string) {
    const picker = new Typeahead(this.page, 'Target collection');
    await picker.open();
    await picker.search.fill(title);
    await picker.option(title).click();
  }

  async expand(id: string) {
    const updater = this.updater(id);
    if ((await updater.getAttribute('open')) === null) {
      await updater.locator('summary').click();
    }
  }

  async updaterIds(): Promise<string[]> {
    const updaters = await this.allUpdaters.all();
    const elementIds = await Promise.all(updaters.map((updater) => updater.getAttribute('id')));
    return elementIds.map((id) => id!.replace('collection-updater-', ''));
  }

  async addedUpdaterId(existingIds: string[]): Promise<string> {
    const existing = new Set(existingIds);
    const added = (await this.updaterIds()).filter((id) => !existing.has(id));
    if (added.length !== 1) {
      throw new Error('The newly created updater was not rendered.');
    }
    return added[0]!;
  }

  async captureSave(): Promise<SubmittedUpdater[]> {
    let resolveRequest!: (updaters: SubmittedUpdater[]) => void;
    let rejectRequest!: (error: unknown) => void;
    const requestCaptured = new Promise<SubmittedUpdater[]>((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });

    await this.page.route('**/jellyfin/collection-updaters/save', async (route) => {
      try {
        const form = new URLSearchParams(route.request().postData() ?? '');
        const serialized = form.get('updaters');
        if (serialized === null) {
          throw new Error('The updater save request did not include the updaters form field.');
        }
        const updaters = JSON.parse(serialized) as SubmittedUpdater[];
        await route.fulfill({
          status: 200,
          contentType: 'text/plain',
          body: 'Updater document captured by Playwright.',
        });
        resolveRequest(updaters);
      } catch (error) {
        rejectRequest(error);
        await route.abort();
      }
    });

    await this.saveChangesButton.click();
    return requestCaptured;
  }
}
