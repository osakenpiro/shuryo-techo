import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir: '.', testMatch: 'gate.spec.mjs', workers: 1, retries: 0,
  reporter: 'list', use: {baseURL: 'http://127.0.0.1:8765', browserName: 'chromium'},
  webServer: {
    command: 'python3 -m http.server 8765 --bind 127.0.0.1 --directory ../..',
    url: 'http://127.0.0.1:8765/equipment-wishlist/sync/', reuseExistingServer: false, timeout: 10000
  }
});
