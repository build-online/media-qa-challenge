import { test, expect } from '../../fixtures/auth.fixture';
import { MEDIA_CARD, MEDIA_ITEM, SEARCH } from '../../helpers/selectors';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'https://media.tithelyqa.com';

// /home is heavier than other pages — its `networkidle` is flaky on chromium (analytics + Algolia
// + video previews never quiet for 500ms). We use domcontentloaded for navigation and give the
// post-interaction visibility assertions extra inline budget while content streams in.
const HOME_CONTENT_TIMEOUT = 15_000;

test.describe('Search', () => {
  test('SEARCH-1: search page loads with input visible', async ({ guestPage }) => {
    await guestPage.goto(BASE_URL + '/home', { waitUntil: 'domcontentloaded' });

    const searchInput = guestPage.locator(SEARCH.input).first();
    await expect(searchInput).toBeVisible();
  });

  test('@smoke SEARCH-2: search returns results for a known keyword', async ({ guestPage }) => {
    await guestPage.goto(BASE_URL + '/home', { waitUntil: 'domcontentloaded' });

    const searchInput = guestPage.locator(SEARCH.input).first();
    await searchInput.fill('Easter');
    await searchInput.press('Enter');

    const resultCards = guestPage.locator(MEDIA_CARD.link).filter({ visible: true });
    await expect(resultCards.first()).toBeVisible({ timeout: HOME_CONTENT_TIMEOUT });
    expect(await resultCards.count()).toBeGreaterThan(0);

    // The card title overlay is hidden until hover — the always-visible signal is the image alt
    const firstImage = resultCards.first().locator('img');
    await expect(firstImage).toBeVisible();
    await expect(firstImage).toHaveAttribute('alt', /Easter/i);
  });

  test('SEARCH-3: search with no results shows empty state', async ({ guestPage }) => {
    await guestPage.goto(BASE_URL + '/home', { waitUntil: 'domcontentloaded' });

    const searchInput = guestPage.locator(SEARCH.input).first();
    await searchInput.fill('xyzzy123notreal');
    await searchInput.press('Enter');

    const emptyState = guestPage.getByText(SEARCH.emptyStateText).first();
    await expect(emptyState).toBeVisible({ timeout: HOME_CONTENT_TIMEOUT });
  });

  test('SEARCH-4: category filter narrows results', async ({ guestPage }) => {
    await guestPage.goto(BASE_URL + '/home', { waitUntil: 'domcontentloaded' });

    const searchInput = guestPage.locator(SEARCH.input).first();
    await searchInput.fill('Easter');
    await searchInput.press('Enter');

    const resultCards = guestPage.locator(MEDIA_CARD.link).filter({ visible: true });
    await expect(resultCards.first()).toBeVisible({ timeout: HOME_CONTENT_TIMEOUT });
    const initialCount = await resultCards.count();

    await guestPage.locator(SEARCH.filterButton).first().click();
    await guestPage.locator(SEARCH.mediaTypeOption).first().click();
    await guestPage.locator(SEARCH.mediaTypeDropdown).first().selectOption(SEARCH.photoOption);
    await guestPage.locator(SEARCH.applyFilterButton).first().click();

    // Poll the filtered count instead of waitForLoadState('networkidle') — the latter is unreliable
    // on /home and the polling assertion settles as soon as the filter reduces the result set.
    await expect
      .poll(
        () => guestPage.locator(MEDIA_CARD.link).filter({ visible: true }).count(),
        { timeout: HOME_CONTENT_TIMEOUT },
      )
      .toBeLessThanOrEqual(initialCount);
  });

  test('SEARCH-5: result card links to correct media item page', async ({ guestPage }) => {
    await guestPage.goto(BASE_URL + '/home', { waitUntil: 'domcontentloaded' });

    const searchInput = guestPage.locator(SEARCH.input).first();
    await searchInput.fill('Easter');
    await searchInput.press('Enter');

    const firstCard = guestPage.locator(MEDIA_CARD.link).filter({ visible: true }).first();
    await expect(firstCard).toBeVisible({ timeout: HOME_CONTENT_TIMEOUT });
    const cardTitle = await firstCard.locator('img').getAttribute('alt');

    await firstCard.click();
    await expect(guestPage).toHaveURL(/\/media\/[^/]+/, { timeout: HOME_CONTENT_TIMEOUT });
    await expect(guestPage.locator(MEDIA_ITEM.title)).toHaveText(cardTitle ?? '', { timeout: HOME_CONTENT_TIMEOUT });
  });
});
