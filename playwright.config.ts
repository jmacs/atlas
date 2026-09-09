import 'dotenv/config';
import {defineConfig, devices} from '@playwright/test';
import {PLAYWRIGHT_APPDATA_DIR, PLAYWRIGHT_PORT} from './e2e/environment.ts';
import {FIXTURE_TOKEN} from './fixtures/jellyfin.ts';

const baseURL = `http://127.0.0.1:${PLAYWRIGHT_PORT}`;
const jellyfinFixtureURL = `${baseURL}/__fixtures/jellyfin`;
const fixtureNetworkGuard = new URL('./fixtures/network-guard.ts', import.meta.url).href;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  outputDir: '.local/playwright/results',
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', {outputFolder: '.local/playwright/report', open: 'never'}]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  webServer: {
    command: 'npm run dev',
    env: {
      ATLAS_APPDATA_DIR: PLAYWRIGHT_APPDATA_DIR,
      FIXTURES: 'true',
      JELLYFIN_API_KEY: FIXTURE_TOKEN,
      JELLYFIN_SERVER: jellyfinFixtureURL,
      NODE_OPTIONS: `--import=${fixtureNetworkGuard}`,
      PORT: String(PLAYWRIGHT_PORT),
    },
    url: baseURL,
    reuseExistingServer: false,
  },
});
