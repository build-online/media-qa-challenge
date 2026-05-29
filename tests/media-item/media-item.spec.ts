import { test, expect } from '../../fixtures/auth.fixture';
import { MEDIA_ITEM } from '../../helpers/selectors';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'https://media.tithelyqa.com';
const KNOWN_ITEM_URL = BASE_URL + '/media/122';

test.describe('Media Item', () => {
  test('@smoke MEDIA-1: media item detail page loads with title and preview', async ({ guestPage }) => {
    await guestPage.goto(KNOWN_ITEM_URL, { waitUntil: 'networkidle' });

    expect(guestPage.url()).toContain('/media/122');
    await expect(guestPage).toHaveTitle(/Random Foods/i);
    await expect(guestPage.locator(MEDIA_ITEM.title)).toBeVisible();
    await expect(guestPage.locator(MEDIA_ITEM.title)).toContainText(/\w{3,}/);
    // Covers both image assets (img) and video assets (video / iframe player)
    await expect(guestPage.locator(MEDIA_ITEM.preview).first()).toBeVisible();
  });

  test('MEDIA-2: Related Media section appears with at least one item card and type label', async ({ guestPage }) => {
    await guestPage.goto(KNOWN_ITEM_URL, { waitUntil: 'networkidle' });

    // "Related Media" section heading is visible
    await expect(guestPage.locator(MEDIA_ITEM.relatedMediaHeading)).toBeVisible();

    // At least one media item card with image is present
    await expect(guestPage.locator(MEDIA_ITEM.relatedMediaLink).first()).toBeVisible();
    const cardCount = await guestPage.locator(MEDIA_ITEM.relatedMediaLink).count();
    expect(cardCount).toBeGreaterThanOrEqual(1);
    await expect(guestPage.locator(MEDIA_ITEM.relatedMediaImage).first()).toBeVisible();

    // Each card shows a type label (Photo / Video / Graphic / Social Media)
    await expect(guestPage.locator(MEDIA_ITEM.relatedMediaType).first()).toBeVisible();
    await expect(guestPage.locator(MEDIA_ITEM.relatedMediaType).first()).toContainText(
      /Photo|Video|Graphic|Social Media/i
    );
  });

  test('MEDIA-3: download button is hidden for unauthenticated users', async ({ guestPage }) => {
    await guestPage.goto(KNOWN_ITEM_URL, { waitUntil: 'networkidle' });

    await expect(guestPage.locator(MEDIA_ITEM.downloadButton)).not.toBeVisible();
    await expect(guestPage.locator(MEDIA_ITEM.loginToDownload)).toBeVisible();
    await expect(guestPage.locator(MEDIA_ITEM.loginToDownload)).toHaveAttribute('href', /auth\/login/);
  });

  test('@smoke MEDIA-4: download button is visible for authenticated users', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(KNOWN_ITEM_URL, { waitUntil: 'networkidle' });

    await expect(authenticatedPage.locator(MEDIA_ITEM.downloadButton)).toBeVisible();
    await expect(authenticatedPage.locator(MEDIA_ITEM.downloadButton)).toContainText(/Download/i);
  });

  test('MEDIA-5: favorite button triggers login redirect for unauthenticated users', async ({ guestPage }) => {
    await guestPage.goto(KNOWN_ITEM_URL, { waitUntil: 'networkidle' });

    await expect(guestPage.locator(MEDIA_ITEM.favoriteButton).first()).toBeVisible();

    // Clicking the favorite as a guest fires a GET /auth/login request (XHR-based auth check).
    // The page URL stays the same (no hard navigation), but the auth gate is triggered.
    const [authRequest] = await Promise.all([
      guestPage.waitForRequest(req => req.url().includes('/auth/login')),
      guestPage.locator(MEDIA_ITEM.favoriteButton).first().click(),
    ]);

    expect(authRequest.url()).toContain('/auth/login');
  });

  test('MEDIA-6: related collections section renders with image cards', async ({ guestPage }) => {
    await guestPage.goto(KNOWN_ITEM_URL, { waitUntil: 'networkidle' });

    await expect(guestPage.locator(MEDIA_ITEM.relatedHeading)).toBeVisible();
    await expect(guestPage.locator(MEDIA_ITEM.relatedCollectionLink).first()).toBeVisible();
    await expect(guestPage.locator(MEDIA_ITEM.relatedCollectionImage).first()).toBeVisible();
  });

  test('MEDIA-7: report issue form submits POST to the issue endpoint', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(KNOWN_ITEM_URL, { waitUntil: 'networkidle' });

    await expect(authenticatedPage.locator(MEDIA_ITEM.reportIssueButton)).toBeVisible();

    // Intercept the POST to prevent test data reaching the server
    await authenticatedPage.route('**/issue', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      } else {
        route.continue();
      }
    });

    await authenticatedPage.locator(MEDIA_ITEM.reportIssueButton).click();

    // Select an issue type (required to enable Submit) and fill the description
    await expect(authenticatedPage.locator(MEDIA_ITEM.issueTypeLabel).first()).toBeVisible();
    await authenticatedPage.locator(MEDIA_ITEM.issueTypeLabel).first().click();
    await authenticatedPage.locator(MEDIA_ITEM.issueTextarea).first().fill('Automated test report — please ignore');

    // Register the context-level listener BEFORE clicking Submit.
    // locator.click() throws "Target page closed" because the form POST causes a page
    // navigation — so we use evaluate(el.click()) to fire the event without waiting for
    // action completion, and listen at BrowserContext level which survives navigation.
    const requestPromise = authenticatedPage.context().waitForEvent('request', {
      predicate: req => req.url().includes('/issue') && req.method() === 'POST',
    });
    await authenticatedPage.locator(MEDIA_ITEM.issueSubmit).first().evaluate((el: HTMLElement) => el.click());

    const issueRequest = await requestPromise;
    expect(issueRequest.method()).toBe('POST');
    expect(issueRequest.url()).toContain('/issue');
  });

  test('MEDIA-8: export dialog opens from the image editor', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(KNOWN_ITEM_URL, { waitUntil: 'networkidle' });

    // "Open Editor" is a <div> overlay on the media thumbnail (not a <button>)
    await expect(authenticatedPage.locator(MEDIA_ITEM.editorTrigger).first()).toBeVisible();
    await authenticatedPage.locator(MEDIA_ITEM.editorTrigger).first().click();

    // Export button appears inside the image editor on the same page
    await expect(authenticatedPage.locator(MEDIA_ITEM.editorExportButton).first()).toBeVisible();
    await authenticatedPage.locator(MEDIA_ITEM.editorExportButton).first().click();

    // The export dialog (styled-components, sc-* classes) signals its open state via
    // aria-hidden="false". Dialog body content loads asynchronously via a third-party
    // editor SDK and is not reliably available in headless — we assert the dialog opened.
    const dialog = authenticatedPage.locator(MEDIA_ITEM.exportDialog).first();
    await dialog.waitFor({ state: 'attached' });
    await expect(dialog).toHaveAttribute('aria-hidden', 'false');
  });
});
