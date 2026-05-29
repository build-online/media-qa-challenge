import { test, expect } from '../../fixtures/auth.fixture';
import type { Page } from '@playwright/test';
import { MEDIA_CARD, SEARCH, FAVORITES } from '../../helpers/selectors';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'https://media.tithelyqa.com';

// Each test favorites its own media so they don't race on shared favorite state — change to real titles
const SEARCH_TERMS = {
  fav1: 'Test',
  fav2: 'Email',
  fav3: 'Easter',
};

// Set by each test once it favorites a media; afterEach cleans it up
let favoritedTitle: string | null = null;

// Search on home, open the first media result, return its title (img alt)
async function openFirstMediaResult(page: Page, term: string): Promise<string> {
  // /home networkidle is flaky on chromium — domcontentloaded + assertion auto-wait is reliable
  await page.goto(BASE_URL + '/home', { waitUntil: 'domcontentloaded' });

  const input = page.locator(SEARCH.input).first();
  await input.fill(term);
  await input.press('Enter');

  const card = page.locator(MEDIA_CARD.link).filter({ visible: true }).first();
  await expect(card).toBeVisible();
  const title = (await card.locator('img').getAttribute('alt')) ?? '';
  await card.click();
  await page.waitForURL(/\/media\//);
  return title;
}

// Idempotently toggle the favorite button on the current media detail page into the desired state
async function setFavorite(page: Page, favorited: boolean): Promise<void> {
  await expect(page.locator(FAVORITES.favoriteButton).first()).toBeVisible();
  const isFavorited = (await page.locator(FAVORITES.favoritedButton).count()) > 0;
  if (isFavorited !== favorited) {
    await page.locator(FAVORITES.favoriteButton).first().click();
  }
  const expected = favorited ? FAVORITES.favoritedButton : FAVORITES.unfavoritedButton;
  await expect(page.locator(expected).first()).toBeVisible();
}

// The favorites-page card matching a given title (via its image alt text)
function favoritedCard(page: Page, title: string) {
  return page.locator(MEDIA_CARD.link, { has: page.getByAltText(title, { exact: true }) });
}

// Go to favorites, open the matching card and unfavorite it. No-op if it isn't there
async function unfavoriteFromFavorites(page: Page, title: string): Promise<void> {
  await page.goto(BASE_URL + '/favorites', { waitUntil: 'networkidle' });
  const cards = favoritedCard(page, title);
  const emptyState = page.getByText(FAVORITES.emptyStateText);
  await expect(cards.first().or(emptyState.first())).toBeVisible();
  if ((await cards.count()) === 0) return;
  await cards.first().click();
  await page.waitForURL(/\/media\//);
  await setFavorite(page, false);
}

test.describe('Favorites', () => {
  test.afterEach(async ({ authenticatedPage }) => {
    if (favoritedTitle) {
      await unfavoriteFromFavorites(authenticatedPage, favoritedTitle);
      favoritedTitle = null;
    }
  });

  test('FAV-1: favorites page shows saved items', async ({ authenticatedPage }) => {
    const title = await openFirstMediaResult(authenticatedPage, SEARCH_TERMS.fav1);
    favoritedTitle = title;
    await setFavorite(authenticatedPage, true);

    await authenticatedPage.goto(BASE_URL + '/favorites', { waitUntil: 'networkidle' });
    await expect(favoritedCard(authenticatedPage, title).first()).toBeVisible();
  });

  test('@smoke FAV-2: toggling favorite on an item adds it to favorites', async ({ authenticatedPage }) => {
    const title = await openFirstMediaResult(authenticatedPage, SEARCH_TERMS.fav2);
    favoritedTitle = title;
    await setFavorite(authenticatedPage, false);

    await authenticatedPage.locator(FAVORITES.favoriteButton).first().click();
    await expect(authenticatedPage.locator(FAVORITES.favoritedButton).first()).toBeVisible();

    await authenticatedPage.goto(BASE_URL + '/favorites', { waitUntil: 'networkidle' });
    await expect(favoritedCard(authenticatedPage, title).first()).toBeVisible();
  });

  test('FAV-3: toggling favorite off removes it from favorites', async ({ authenticatedPage }) => {
    const title = await openFirstMediaResult(authenticatedPage, SEARCH_TERMS.fav3);
    favoritedTitle = title;
    await setFavorite(authenticatedPage, true);

    await unfavoriteFromFavorites(authenticatedPage, title);

    await authenticatedPage.goto(BASE_URL + '/favorites', { waitUntil: 'networkidle' });
    await expect(favoritedCard(authenticatedPage, title)).toHaveCount(0);
  });

  test('FAV-4: favorites page shows empty state when no items saved', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/favorites', { waitUntil: 'networkidle' });

    await expect(authenticatedPage.getByText(FAVORITES.emptyStateText).first()).toBeVisible();
  });
});
