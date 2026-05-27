import { test, expect } from '../../fixtures/auth.fixture';
import { MEDIA_CARD, SEARCH } from '../../helpers/selectors';

test.describe('Search', () => {
  test('SEARCH-1: search page loads with input visible', async ({ guestPage }) => {
    await guestPage.goto('/search');

    const searchInput = guestPage.locator(SEARCH.input).first();
    await expect(searchInput).toBeVisible();
  });

  test('@smoke SEARCH-2: search returns results for a known keyword', async ({ guestPage }) => {
    await guestPage.goto('/search');

    const searchInput = guestPage.locator(SEARCH.input).first();
    await searchInput.fill('Easter');
    await searchInput.press('Enter');

    const resultCards = guestPage.locator(MEDIA_CARD.container).filter({ visible: true });
    await expect(resultCards.first()).toBeVisible();
    expect(await resultCards.count()).toBeGreaterThan(0);

    const firstTitle = guestPage.locator(MEDIA_CARD.title).first();
    await expect(firstTitle).toBeVisible();
    await expect(firstTitle).toHaveText('Easter');
  });

  test('SEARCH-3: search with no results shows empty state', async ({ guestPage }) => {
    await guestPage.goto('/search');

    const searchInput = guestPage.locator(SEARCH.input).first();
    await searchInput.fill('xyzzy123notreal');
    await searchInput.press('Enter');

    const emptyState = guestPage.getByText(SEARCH.emptyStateText).first();
    await expect(emptyState).toBeVisible();
  });

  test('SEARCH-4: category filter narrows results', async ({ guestPage }) => {
    await guestPage.goto('/search');

    const searchInput = guestPage.locator(SEARCH.input).first();
    await searchInput.fill('Easter');
    await searchInput.press('Enter');

    const resultCards = guestPage.locator(MEDIA_CARD.container).filter({ visible: true });
    await expect(resultCards.first()).toBeVisible();
    const initialCount = await resultCards.count();

    await guestPage.locator(SEARCH.filterButton).first().click();
    await guestPage.locator(SEARCH.mediaTypeOption).first().click();
    await guestPage.locator(SEARCH.mediaTypeDropdown).first().click();
    await guestPage.locator(SEARCH.photoOption).first().click();
    await guestPage.locator(SEARCH.applyFilterButton).first().click();

    await guestPage.waitForLoadState('networkidle');

    const filteredCount = await resultCards.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('SEARCH-5: result card links to correct media item page', async ({ guestPage }) => {
    await guestPage.goto('/search');

    const searchInput = guestPage.locator(SEARCH.input).first();
    await searchInput.fill('Easter');
    await searchInput.press('Enter');

    const firstCard = guestPage.locator(MEDIA_CARD.container).first();
    await expect(firstCard).toBeVisible();

    await firstCard.click();
    await expect(guestPage).toHaveURL(/\/media\/[^/]+/);
  });
});
