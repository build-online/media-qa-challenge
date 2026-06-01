import { test, expect } from '../../fixtures/auth.fixture';
import type { Page } from '@playwright/test';
import { MEDIA_CARD, SEARCH, FAVORITES } from '../../helpers/selectors';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'https://media.tithelyqa.com';

// Each test favorites its own media so they don't race on shared favorite state
const SEARCH_TERMS = {
  fav1: 'Test',
  fav2: 'Email',
  fav3: 'Easter',
};



// /favorites' main grid loads after networkidle (the SPA fetches the user's favorites separately
// from the page navigation), and the favorite-button DOM swap on /media/X is also async. Default
// 5s expect timeout is too tight for either — use this for the relevant assertions.
const SPA_RENDER_TIMEOUT = 15_000;

// Search on home, open the first media result, return its title (img alt)
async function openFirstMediaResult(page: Page, term: string): Promise<string> {
  // domcontentloaded — /home has 4 lazy-loaded grids + sidebar count polling, so networkidle
  // never fires within 30s. The toBeVisible(input) auto-wait below confirms Vue has mounted the
  // search input (and its @keydown handler) before we type/submit.
  await page.goto(BASE_URL + '/home', { waitUntil: 'domcontentloaded' });

  const input = page.locator(SEARCH.input).first();
  await expect(input).toBeVisible({ timeout: SPA_RENDER_TIMEOUT });
  await page.waitForTimeout(1200);
  await input.fill(term);
  await input.press('Enter');

  const card = page.locator(MEDIA_CARD.link).filter({ visible: true }).first();
  // Bumped from default 5s to SPA_RENDER_TIMEOUT (15s) — gives the search request + result
  // render enough time on slower runs and parallel-project loads.
  await expect(card).toBeVisible({ timeout: SPA_RENDER_TIMEOUT });
  const title = (await card.locator('img').getAttribute('alt')) ?? '';
  await card.click();
  await page.waitForURL(/\/media\//, { waitUntil: 'domcontentloaded' });
  return title;
}

// Idempotently toggle the favorite button on the current media detail page into the desired state
async function setFavorite(page: Page, favorited: boolean): Promise<void> {
  const button = page.locator(FAVORITES.favoriteButton).first();
  await expect(button).toBeVisible({ timeout: SPA_RENDER_TIMEOUT });
  const isFavorited = (await page.locator(FAVORITES.favoritedButton).count()) > 0;
  const clicked = isFavorited !== favorited;

  if (clicked) {
    // Brief settle for Vue to bind the heart's @click handler. The toBeVisible above only
    // confirms the button is in the DOM — Vue's reactivity may still be mounting after a
    // domcontentloaded navigation on a cold context. Without this wait, the click event
    // dispatches but no @click listener catches it and the heart never flips. 400ms is enough
    // for Vue mount even on the first test (where JS isn't cached yet).
    await page.waitForTimeout(1200);
    await button.click();
  }

  // Verify visual state. If the server returns a 302 to /favorites (Inertia POST handlers
  // commonly redirect to the index after a state change for both favorite AND unfavorite), the
  // page navigates away mid-assertion — that IS the successful toggle confirmation in either
  // direction. (Previous version only tolerated this for unfavorite; chromium follows the redirect
  // synchronously on favorite POSTs too, blowing up setFavorite(true).)
  const expected = favorited ? FAVORITES.favoritedButton : FAVORITES.unfavoritedButton;
  try {
    await expect(page.locator(expected).first()).toBeVisible({ timeout: SPA_RENDER_TIMEOUT });
  } catch (err) {
    // Inertia POSTs sometimes return a 302 to /favorites mid-assertion — the redirect navigation
    // may complete slightly AFTER toBeVisible times out, so checking page.url() immediately can
    // miss it. waitForURL polls for up to 3s, catching the redirect-as-success case reliably.
    try {
      await page.waitForURL(/\/favorites/, { timeout: 3_000 });
      return; // 302 redirect to /favorites IS the toggle confirmation (either direction)
    } catch {
      throw err;
    }
  }
}

// The favorites-page card matching a given title (via its image alt text)
function favoritedCard(page: Page, title: string) {
  return page.locator(MEDIA_CARD.link, { has: page.getByAltText(title, { exact: true }) });
}

// Empty the favorites page entirely — open each remaining favorite and unfavorite it. Used by
// FAV-4 to clear any items leaked by failed past runs so the empty-state assertion has a chance.
async function unfavoriteAll(page: Page): Promise<void> {
  await page.goto(BASE_URL + '/favorites?filter[type]=all', { waitUntil: 'networkidle', timeout: 10_000 }).catch(() => undefined);
  await expect(page.locator('main h4').first()).toBeVisible({ timeout: SPA_RENDER_TIMEOUT });

  while ((await page.locator(MEDIA_CARD.link).count()) > 0) {
    await page.locator(MEDIA_CARD.link).first().click();
    await page.waitForURL(/\/media\//, { waitUntil: 'domcontentloaded' });
    await setFavorite(page, false);

    await page.goto(BASE_URL + '/favorites?filter[type]=all', { waitUntil: 'networkidle', timeout: 10_000 }).catch(() => undefined);
    await expect(page.locator('main h4').first()).toBeVisible({ timeout: SPA_RENDER_TIMEOUT });
  }
}

// Go to favorites, open the matching card and unfavorite it. No-op if it isn't there
async function unfavoriteFromFavorites(page: Page, title: string): Promise<void> {
  await page.goto(BASE_URL + '/favorites?filter[type]=all', { waitUntil: 'networkidle', timeout: 10_000 }).catch(() => undefined);
  const cards = favoritedCard(page, title);
  if ((await cards.count()) === 0) return;
  await cards.first().click();
  // Default waitUntil is 'load', which hangs on chromium for /media/X pages (continuous SPA traffic)
  await page.waitForURL(/\/media\//, { waitUntil: 'domcontentloaded' });
  await setFavorite(page, false);
}

test.describe('Favorites', () => {

  test('FAV-1: favorites page shows saved items', async ({ authenticatedPage }) => {
    const title = await openFirstMediaResult(authenticatedPage, SEARCH_TERMS.fav1);
    await setFavorite(authenticatedPage, true);

    await authenticatedPage.goto(BASE_URL + '/favorites?filter[type]=all', { waitUntil: 'networkidle', timeout: 10_000 }).catch(() => undefined);
    await expect(favoritedCard(authenticatedPage, title).first()).toBeVisible({ timeout: SPA_RENDER_TIMEOUT });
  });

  test('@smoke FAV-2: toggling favorite on an item adds it to favorites', async ({ authenticatedPage }) => {
    const title = await openFirstMediaResult(authenticatedPage, SEARCH_TERMS.fav2);
    await setFavorite(authenticatedPage, true);

    await authenticatedPage.goto(BASE_URL + '/favorites?filter[type]=all', { waitUntil: 'networkidle', timeout: 10_000 }).catch(() => undefined);
    await expect(favoritedCard(authenticatedPage, title).first()).toBeVisible({ timeout: SPA_RENDER_TIMEOUT });
  });

  test('FAV-3: toggling favorite off removes it from favorites', async ({ authenticatedPage }) => {
    const title = await openFirstMediaResult(authenticatedPage, SEARCH_TERMS.fav3);
    await setFavorite(authenticatedPage, true);

    await unfavoriteFromFavorites(authenticatedPage, title);

    await authenticatedPage.goto(BASE_URL + '/favorites?filter[type]=all', { waitUntil: 'networkidle', timeout: 10_000 }).catch(() => undefined);
    await expect(favoritedCard(authenticatedPage, title)).toHaveCount(0, { timeout: SPA_RENDER_TIMEOUT });
  });

  test('FAV-4: favorites page shows empty state when no items saved', async ({ authenticatedPage }) => {
    // Self-clean the account before asserting empty state 
    await unfavoriteAll(authenticatedPage);
    await authenticatedPage.goto(BASE_URL + '/favorites?filter[type]=all', { waitUntil: 'networkidle', timeout: 10_000 }).catch(() => undefined);
    await expect(authenticatedPage.locator('main h4').first()).toContainText('(0)', { timeout: SPA_RENDER_TIMEOUT });
  });
});
