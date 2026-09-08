import 'dotenv/config';
import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: '.local/playwright/results',
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', {outputFolder: '.local/playwright/report', open: 'never'}]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/design-system/dialogs',
    reuseExistingServer: !process.env.CI,
  },
});
