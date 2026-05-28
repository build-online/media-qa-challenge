import { test as setup } from '@playwright/test';
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

  const isAuthenticated = await page.locator('a[href*="/my-media"]').count() > 0;
  if (!isAuthenticated) {
    throw new Error('Auth failed: check SESSION_TOKEN, LARAVEL_SESSION and XSRF_TOKEN in .env');
  }
  console.log('Auth successful');

  await context.storageState({ path: authFile });
  await context.close();
});
