import { test as setup } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ browser }) => {
  const API_TOKEN = process.env.API_TOKEN;
  const BASE_URL = process.env.BASE_URL;

  if (!API_TOKEN) {
    throw new Error('API_TOKEN environment variable is required');
  }

  const context = await browser.newContext();

  await context.addCookies([
    {
      name: 'session_token',
      value: API_TOKEN,
      domain: 'media.tithelyqa.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
  ]);

  const page = await context.newPage();
  await page.goto(BASE_URL + '/home', { waitUntil: 'networkidle' });
  await context.storageState({ path: authFile });
  await context.close();
});
