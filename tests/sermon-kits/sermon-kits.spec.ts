import { test, expect } from '../../fixtures/auth.fixture';
import { SERMON_KITS } from '../../helpers/selectors';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'https://media.tithelyqa.com';

// Stable sermon kit seeded in the QA environment (Test Sermon Kit - QA, 7 items)
const KNOWN_SERMON_KIT = {
  uuid: '65f18297-a7e2-484e-8e34-b7b3f75955f3',
  name: 'Test Sermon Kit - QA',
  minItemCount: 7,
};

test.describe('Sermon Kits', () => {
  test('@smoke SK-1: sermon kits page renders kit cards', async ({ guestPage }) => {
    // Sermon kits are surfaced via the search filter, not a dedicated /sermon-kits route
    await guestPage.goto(BASE_URL + '/search?filter[type]=sermon-kit', { waitUntil: 'networkidle' });

    // Confirm we are on the sermon-kit filtered view (browsers may percent-encode the brackets)
    await expect(guestPage).toHaveURL(/(?:filter\[type\]|filter%5Btype%5D)=sermon-kit/);

    // Search page renders kits as direct links — no div.items-grid wrapper like Collections
    const cards = guestPage.locator(SERMON_KITS.card);
    await expect(cards.first()).toBeVisible();
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('SK-2: sermon kit detail page shows title and item list', async ({ guestPage }) => {
    await guestPage.goto(`${BASE_URL}/sermon-kits/${KNOWN_SERMON_KIT.uuid}`, { waitUntil: 'networkidle' });

    await expect(guestPage).toHaveURL(new RegExp(`/sermon-kits/${KNOWN_SERMON_KIT.uuid}`));

    const heading = guestPage.locator('main h1, main h2').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(KNOWN_SERMON_KIT.name, { ignoreCase: true });

    // Scope to main to avoid matching nav/header /media/ links
    const mediaItems = guestPage.locator('main a[href*="/media/"]');
    await expect(mediaItems.first()).toBeVisible();
    expect(await mediaItems.count()).toBeGreaterThanOrEqual(KNOWN_SERMON_KIT.minItemCount);
  });
});
