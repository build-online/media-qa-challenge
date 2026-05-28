import { test, expect } from '../../fixtures/auth.fixture';
import { NAV } from '../../helpers/selectors';

const BASE_URL = process.env.BASE_URL || 'https://media.tithelyqa.com';

test.describe('Authentication', () => {
  test('@smoke AUTH-1: unauthenticated user visiting /auth/login redirects to SSO', async ({ guestPage }) => {
    await guestPage.goto(BASE_URL + '/auth/login', { waitUntil: 'networkidle' });

    expect(guestPage.url()).not.toContain('media.tithelyqa.com/auth/login');
    expect(guestPage.url()).toMatch(/tithelyqa\.com|accounts\.|sso\./);
  });

  test('@smoke AUTH-2: authenticated user on /home does not see login button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/home', { waitUntil: 'networkidle' });

    await expect(authenticatedPage.locator('a[href*="/auth/login"]')).toHaveCount(0);
    await expect(authenticatedPage.locator('a[href*="/auth/register"]')).toHaveCount(0);
    await expect(authenticatedPage.locator(NAV.myMedia).first()).toBeVisible();
  });

  test('AUTH-3: unauthenticated user visiting /favorites is redirected', async ({ guestPage }) => {
    await guestPage.goto(BASE_URL + '/favorites', { waitUntil: 'networkidle' });

    const finalUrl = guestPage.url();
    expect(finalUrl).not.toBe(BASE_URL + '/favorites');
    expect(finalUrl).toMatch(/\/auth\/login|tithely\.com|auth\./);
  });
});
