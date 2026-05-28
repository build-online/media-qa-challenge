import { test, expect } from '../../fixtures/auth.fixture';
import { MEDIA_CARD, NAV, HOME } from '../../helpers/selectors';

const BASE_URL = process.env.BASE_URL || 'https://media.tithelyqa.com';

test.describe('Home Page', () => {
  test('@smoke HOME-1: home page loads and shows media item cards', async ({ guestPage }) => {
    await guestPage.goto(BASE_URL + '/home', { waitUntil: 'networkidle' });

    await expect(guestPage).toHaveTitle(/Tithe\.?ly Media/i);
    await expect(guestPage.locator(MEDIA_CARD.link).first()).toBeVisible();
    const count = await guestPage.locator(MEDIA_CARD.link).count();
    expect(count).toBeGreaterThan(3);
  });

  test('HOME-2: home page shows category cards with images', async ({ guestPage }) => {
    await guestPage.goto(BASE_URL + '/home', { waitUntil: 'networkidle' });

    await expect(guestPage.locator(HOME.categoryCard).first()).toBeVisible();
    await expect(guestPage.locator(HOME.categoryCard).first().locator('img')).toBeVisible();
    expect(await guestPage.locator(HOME.categoryCard).count()).toBeGreaterThan(0);
    await expect(guestPage.locator(HOME.categoryCard).first()).toContainText(/.+/);
  });

  test('HOME-3: sidebar navigation contains all section links', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/home', { waitUntil: 'networkidle' });

    await expect(authenticatedPage.locator(NAV.allMedia).first()).toBeVisible();
    await expect(authenticatedPage.locator(NAV.collections).first()).toBeVisible();
    await expect(authenticatedPage.locator(NAV.sermonKits).first()).toBeVisible();
    await expect(authenticatedPage.locator(NAV.favorites).first()).toBeVisible();
    await expect(authenticatedPage.locator(NAV.myMedia).first()).toBeVisible();
    await expect(authenticatedPage.locator(NAV.graphics).first()).toBeVisible();
    await expect(authenticatedPage.locator(NAV.video).first()).toBeVisible();
    await expect(authenticatedPage.locator(NAV.socialMedia).first()).toBeVisible();
    await expect(authenticatedPage.locator(NAV.photos).first()).toBeVisible();
    // Note: /search is not a nav link in this app - search is an input in the hero banner
    // Validating search input presence as equivalent to the spec requirement
    await expect(authenticatedPage.locator('input[placeholder*="Search" i]').first()).toBeVisible();
  });
});
