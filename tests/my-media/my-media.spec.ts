import { test, expect } from '../../fixtures/auth.fixture';
import type { Page } from '@playwright/test';
import { MY_MEDIA } from '../../helpers/selectors';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'https://media.tithelyqa.com';

// 1x1 transparent PNG used as the upload payload — avoids needing a fixture file on disk
const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

// Create a folder via the real Create-Folder modal
async function createFolder(page: Page, name: string): Promise<void> {
  await page.locator(MY_MEDIA.newFolderButton).first().click();
  await page.locator(MY_MEDIA.folderNameInput).first().fill(name);
  await page.locator(MY_MEDIA.createFolderSubmit).first().click();
}

// The folder name <p> label
function folderByName(page: Page, name: string) {
  return page.locator(MY_MEDIA.folderName).filter({ hasText: name });
}

// The outer card <div> wrapping a folder's label + visual (so we can scope the 3-dot menu to it)
function folderCardByName(page: Page, name: string) {
  return folderByName(page, name).locator('xpath=..').first();
}

test.describe('My Media', () => {
  test('@smoke MYMEDIA-1: My Media page loads for authenticated user', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/my-media', { waitUntil: 'networkidle' });

    await expect(authenticatedPage.locator(MY_MEDIA.heading)).toContainText(/My Media/i);
    // The account has folders — assert the first folder label is visible. (Combining with an
    // empty-state `.or()` triggers a strict-mode violation because hidden infinite-status prompts
    // ("No results :(") also match by text even though they have display:none.)
    await expect(authenticatedPage.locator(MY_MEDIA.folderName).first()).toBeVisible();
  });

  test('MYMEDIA-2: create a new folder', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/my-media', { waitUntil: 'networkidle' });

    const folderName = `qa-folder-${Date.now()}`;

    const [response] = await Promise.all([
      authenticatedPage.waitForResponse(
        r => r.url().includes('/church-media/folders') && r.request().method() === 'POST',
      ),
      createFolder(authenticatedPage, folderName),
    ]);
    // Inertia POSTs return 302 on success (redirect to refreshed page), so response.ok() is false
    // even though the create succeeded. Accept any non-error status (2xx + 3xx).
    expect(response.status()).toBeLessThan(400);

    await expect(folderByName(authenticatedPage, folderName).first()).toBeVisible();
  });

  test('MYMEDIA-3: rename a folder', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/my-media', { waitUntil: 'networkidle' });

    const original = `qa-rename-${Date.now()}`;
    const renamed = `${original}-edited`;
    await createFolder(authenticatedPage, original);
    await expect(folderByName(authenticatedPage, original).first()).toBeVisible();

    // Newly-created folders land at the bottom of the overflow-auto grid — scroll the 3-dot
    // trigger into view before clicking, and force the click in case Vue's hover state interferes.
    const menuTrigger = folderCardByName(authenticatedPage, original).locator(MY_MEDIA.folderMenuTrigger).first();
    await menuTrigger.scrollIntoViewIfNeeded();
    await menuTrigger.click({ force: true });
    await authenticatedPage.locator(MY_MEDIA.renameOption).first().click();

    // Real Rename modal: same input[name="folder_name"], submit text "Rename"
    await authenticatedPage.locator(MY_MEDIA.folderNameInput).first().fill(renamed);
    await authenticatedPage.locator(MY_MEDIA.renameFolderSubmit).first().click();

    await expect(folderByName(authenticatedPage, renamed).first()).toBeVisible();
  });

  test('MYMEDIA-4: delete a folder', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/my-media', { waitUntil: 'networkidle' });

    const folderName = `qa-delete-${Date.now()}`;
    await createFolder(authenticatedPage, folderName);
    await expect(folderByName(authenticatedPage, folderName).first()).toBeVisible();

    // Open menu → Delete, then real confirm dialog: "Are you sure..." + "Yes, I want to delete".
    // Newly-created folders land at the bottom of an overflow-auto grid — scroll into view first.
    const menuTrigger = folderCardByName(authenticatedPage, folderName).locator(MY_MEDIA.folderMenuTrigger).first();
    await menuTrigger.scrollIntoViewIfNeeded();
    await menuTrigger.click({ force: true });
    await authenticatedPage.locator(MY_MEDIA.deleteOption).first().click();

    await expect(authenticatedPage.locator(MY_MEDIA.deleteDialogHeading)).toBeVisible();
    await authenticatedPage.locator(MY_MEDIA.confirmDeleteButton).first().click();

    await expect(folderByName(authenticatedPage, folderName)).toHaveCount(0);
  });

  test('MYMEDIA-5: upload a church media item', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/my-media', { waitUntil: 'networkidle' });

    // Enter the first folder (folders are click-to-open cards; the inner div.p-5 is the click target)
    await authenticatedPage.locator('main div.p-5.cursor-pointer').first().click();
    await expect(authenticatedPage.locator(MY_MEDIA.insideFolderBody)).toBeVisible();

    const items = authenticatedPage.locator(MY_MEDIA.churchItem);
    const before = await items.count();

    // Open dropzone then set the file on the hidden <input name="files" class="input-file">
    await authenticatedPage.locator(MY_MEDIA.uploadFileButton).first().click();
    await authenticatedPage.locator(MY_MEDIA.uploadInput).first().setInputFiles({
      name: 'qa-upload.png',
      mimeType: 'image/png',
      buffer: ONE_PX_PNG,
    });

    // The uploaded item appears as a new church item card inside the folder
    await expect(items).toHaveCount(before + 1);
  });

  // TODO: church-item heart in the hover overlay doesn't trigger the toggle-favorite endpoint
  // when force-clicked. The favorite action probably routes through the item detail/modal,
  // not the card-overlay heart. Investigate the real UI flow and rewrite when known.
  test.skip('@smoke MYMEDIA-6: church item favorite toggle hits the toggle-favorite endpoint', async () => {});

  test('MYMEDIA-7: move a church item to another folder', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/my-media', { waitUntil: 'networkidle' });

    // Requires ≥2 folders + 1 item (account has both). Item 3-dot menu + "Move" option are
    // placeholders; the move dialog itself is real (vue-select combobox + Move submit).
    const items = authenticatedPage.locator(MY_MEDIA.churchItem);
    const before = await items.count();
    const item = items.first();
    await expect(item).toBeVisible();
    await item.hover();
    await item.locator(MY_MEDIA.itemMenuTrigger).first().click({ force: true });
    await authenticatedPage.locator(MY_MEDIA.moveOption).first().click();

    // Move dialog: preview + "Choose a folder" combobox
    await expect(authenticatedPage.locator(MY_MEDIA.moveDialogPreview)).toBeVisible();
    await authenticatedPage.locator(MY_MEDIA.moveCombobox).first().click();
    await authenticatedPage.locator(MY_MEDIA.moveDestinationOption).first().click();
    await authenticatedPage.locator(MY_MEDIA.confirmMoveButton).first().click();

    // Dialog closes on successful move; the source view loses the item
    await expect(authenticatedPage.locator(MY_MEDIA.moveCombobox)).toHaveCount(0);
    await expect(items).toHaveCount(before - 1);
  });

  test('MYMEDIA-8: delete a church item', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/my-media', { waitUntil: 'networkidle' });

    const items = authenticatedPage.locator(MY_MEDIA.churchItem);
    const initial = await items.count();

    const item = items.first();
    await item.hover();
    await item.locator(MY_MEDIA.itemMenuTrigger).first().click({ force: true });
    await authenticatedPage.locator(MY_MEDIA.deleteOption).first().click();

    // Reuses the same confirm dialog ("Are you sure you want to delete this item?" / "Yes, I want to delete")
    await expect(authenticatedPage.locator(MY_MEDIA.deleteDialogHeading)).toBeVisible();
    await authenticatedPage.locator(MY_MEDIA.confirmDeleteButton).first().click();
    await authenticatedPage.waitForLoadState('networkidle');

    // The grid re-renders lazily after the server responds — give it more room than the 5s default
    await expect(items).toHaveCount(initial - 1, { timeout: 15_000 });
  });
});
