import { test as base, expect, Page } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

type MyFixtures = {
  authenticatedPage: Page;
  guestPage: Page;
};

export const test = base.extend<MyFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  guestPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
