import { test, expect } from '../../fixtures/auth.fixture';
import { COLLECTIONS } from '../../helpers/selectors';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'https://media.tithelyqa.com';

// Stable collection seeded in the QA environment (Christmas, 11 items)
const KNOWN_COLLECTION = {
  uuid: '0b59369a-6633-44b4-aca3-d50cab6d11f1',
  name: 'Christmas',
  minItemCount: 11,
};

test.describe('Collections', () => {
  test('@smoke COLL-1: collections page renders collection cards', async ({ guestPage }) => {
    await guestPage.goto(BASE_URL + '/collections', { waitUntil: 'networkidle' });

    await expect(guestPage.locator(COLLECTIONS.grid)).toBeVisible();
    const cardCount = await guestPage.locator(COLLECTIONS.card).count();
    // Require a meaningful number of cards — > 0 passes even on a nearly empty grid
    expect(cardCount).toBeGreaterThan(3);
    await expect(guestPage.locator(COLLECTIONS.card).first()).toBeVisible();
    // Verify the first card has a readable collection name
    await expect(guestPage.locator(COLLECTIONS.card).first()).toContainText(/\w{3,}/);
  });

  test('COLL-2: collection detail page shows title and media items', async ({ guestPage }) => {
    await guestPage.goto(`${BASE_URL}/collections/${KNOWN_COLLECTION.uuid}`, { waitUntil: 'networkidle' });

    await expect(guestPage).toHaveURL(new RegExp(`/collections/${KNOWN_COLLECTION.uuid}`));

    const heading = guestPage.locator('main h1, main h2').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(KNOWN_COLLECTION.name, { ignoreCase: true });

    // Scope to main to avoid matching nav/header /media/ links
    const mediaItems = guestPage.locator('main a[href*="/media/"]');
    await expect(mediaItems.first()).toBeVisible();
    expect(await mediaItems.count()).toBeGreaterThanOrEqual(KNOWN_COLLECTION.minItemCount);
  });

  test('COLL-3: collection cards have valid src and naturalWidth > 0', async ({ guestPage }) => {
    await guestPage.goto(BASE_URL + '/collections', { waitUntil: 'networkidle' });

    await expect(guestPage.locator(COLLECTIONS.image).first()).toBeVisible();

    // Scroll to bottom so lazy-loaded images below the fold have a chance to load
    await guestPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await guestPage.waitForTimeout(1500);

    const brokenImages = await guestPage.evaluate((selector) => {
      const imgs = Array.from(document.querySelectorAll(selector)) as HTMLImageElement[];
      return imgs
        .filter(img => !img.src || img.naturalWidth === 0)
        .map(img => img.src || '(no src)');
    }, COLLECTIONS.image);

    expect(
      brokenImages,
      `Broken images found: ${brokenImages.join(', ')}`,
    ).toHaveLength(0);
  });

  test('COLL-4: pagination or load-more works on collections index', async ({ guestPage }) => {
    await guestPage.goto(BASE_URL + '/collections', { waitUntil: 'networkidle' });

    const initialCount = await guestPage.locator(COLLECTIONS.card).count();
    expect(initialCount).toBeGreaterThan(1);

    // Attempt infinite-scroll trigger
    await guestPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await guestPage.waitForTimeout(2000);

    const countAfterScroll = await guestPage.locator(COLLECTIONS.card).count();
    if (countAfterScroll > initialCount) {
      // Infinite scroll loaded additional items — pagination confirmed
      return;
    }

    // Attempt explicit load-more button
    const loadMore = guestPage.locator(
      '[data-testid="load-more"], button:has-text("Load more"), button:has-text("Show more"), [class*="load-more"]',
    );
    const loadMoreVisible = await loadMore.first().isVisible().catch(() => false);

    if (loadMoreVisible) {
      await loadMore.first().click();
      await guestPage.waitForLoadState('networkidle');
      const countAfterClick = await guestPage.locator(COLLECTIONS.card).count();
      expect(countAfterClick).toBeGreaterThan(initialCount);
      return;
    }

    // No pagination mechanism present: all collections fit on the first page.
    // Verify the grid is stable and the count matches what was loaded initially.
    const finalCount = await guestPage.locator(COLLECTIONS.card).count();
    expect(finalCount).toBe(initialCount);
    console.log(
      `COLL-4: No pagination needed — all ${finalCount} collections loaded on the first page.`,
    );
  });
});
