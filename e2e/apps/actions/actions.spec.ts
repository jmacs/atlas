import {expect, test} from '@playwright/test';
import {ActionPage} from './action.pom.ts';
import {ActionDemoPage} from './demo.pom.ts';

test('runs, inspects, and reopens a durable action', async ({page}) => {
  const demo = new ActionDemoPage(page);
  const action = new ActionPage(page);
  const id = await demo.runDummy(1);

  await expect(action.status).toHaveText('succeeded');
  await expect(action.connection).toHaveText('All output received');
  await expect(action.logs).toContainText('Dummy action started');
  await expect(action.logs).toContainText('Dummy action progress');
  await expect(action.logs).toContainText('Dummy action completed');
  const originalLogs = await action.logs.textContent();

  const download = page.waitForEvent('download');
  await action.downloadLog.click();
  const log = await download;
  expect(log.suggestedFilename()).toBe(`action-${id}.jsonl`);
  const stream = await log.createReadStream();
  let downloadedLog = '';
  for await (const chunk of stream) {
    downloadedLog += chunk;
  }
  expect(downloadedLog).toContain('Dummy action completed');

  await action.details.click();
  await expect(action.result).toBeVisible();
  await expect(action.result).toContainText('"intervalMs": 1');
  await expect(action.result).toContainText('"outcome": "succeeded"');

  await page.reload();
  await expect(action.status).toHaveText('succeeded');
  await expect(action.connection).toHaveText('All output received');
  await expect(action.logs).toHaveText(originalLogs!);
  await action.details.click();
  await expect(action.result).toContainText('"intervalMs": 1');

  await action.openHistory();
  await expect(action.run(id)).toBeVisible();
  await action.openRun(id);
  await expect(action.status).toHaveText('succeeded');
  await expect(action.connection).toHaveText('All output received');
  await expect(action.logs).toHaveText(originalLogs!);
  await action.details.click();
  await expect(action.result).toContainText('"outcome": "succeeded"');
});

test('shows the terminal result and error from a failed action', async ({page}) => {
  const action = new ActionPage(page);
  await new ActionDemoPage(page).runDummy(1, 'failed');

  await expect(action.status).toHaveText('failed');
  await expect(action.connection).toHaveText('All output received');
  await expect(action.logs).toContainText('Dummy action failed');
  await expect(action.error).toContainText('Dummy action was configured to fail.');

  await action.details.click();
  await expect(action.result).toContainText('"outcome": "failed"');
});

test('finds its submitted run after a controlled history refresh', async ({page, context}) => {
  await page.clock.install();
  const history = new ActionPage(page);
  await page.goto('/actions');

  const submissionPage = await context.newPage();
  const submitted = new ActionPage(submissionPage);
  const id = await new ActionDemoPage(submissionPage).runDummy(1);
  await expect(submitted.status).toHaveText('succeeded');
  await expect(submitted.connection).toHaveText('All output received');

  await expect(history.run(id)).toHaveCount(0);

  const refreshed = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === '/actions/list' && url.searchParams.get('page') === '1';
  });
  await page.clock.runFor(10_000);
  expect((await refreshed).ok()).toBe(true);

  await expect(history.run(id)).toBeVisible();
  await history.openRun(id);
  await expect(history.status).toHaveText('succeeded');
  await history.details.click();
  await expect(history.result).toContainText('"intervalMs": 1');
  await expect(history.result).toContainText('"outcome": "succeeded"');
});
