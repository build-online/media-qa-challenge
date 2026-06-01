import { test as setup, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ browser }) => {
  const SESSION_TOKEN   = process.env.SESSION_TOKEN;
  const LARAVEL_SESSION = process.env.LARAVEL_SESSION;
  const XSRF_TOKEN      = process.env.XSRF_TOKEN;
  const BASE_URL        = process.env.BASE_URL || 'https://media.tithelyqa.com';

  if (!SESSION_TOKEN) {
    throw new Error('SESSION_TOKEN is required — copy session_token cookie value from DevTools → Application → Cookies');
  }
  if (!LARAVEL_SESSION) {
    throw new Error('LARAVEL_SESSION is required — copy tithely_media_staging_session cookie value from DevTools → Application → Cookies');
  }
  if (!XSRF_TOKEN) {
    throw new Error('XSRF_TOKEN is required — copy XSRF-TOKEN cookie value from DevTools → Application → Cookies');
  }

  const context = await browser.newContext();

  await context.addCookies([
    {
      name: 'session_token',
      value: SESSION_TOKEN,
      domain: 'media.tithelyqa.com',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'None',
    },
    {
      name: 'tithely_media_staging_session',
      value: LARAVEL_SESSION,
      domain: 'media.tithelyqa.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
    {
      name: 'XSRF-TOKEN',
      value: XSRF_TOKEN,
      domain: 'media.tithelyqa.com',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
  ]);

  const page = await context.newPage();
  await page.goto(BASE_URL + '/home', { waitUntil: 'networkidle' });

  // The SPA briefly renders the guest UI (with "Login" + "Sign Up Free") while it validates the
  // injected session cookies against the backend. Auto-wait for the visible Login button to
  // disappear (i.e. for Vue to finish hydrating the authenticated state) before saving the
  // storage state — replaces the single-shot `.count()` check that intermittently caught the
  // page mid-hydration.
  try {
    await expect(page.locator('a[href*="/auth/login"]').filter({ visible: true })).toHaveCount(0, {
      timeout: 15_000,
    });
  } catch {
    throw new Error('Auth failed: Login button still visible after 15s — refresh SESSION_TOKEN, LARAVEL_SESSION and XSRF_TOKEN in .env');
  }
  console.log('Auth successful');

  await context.storageState({ path: authFile });
  await context.close();
});
