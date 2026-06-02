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

// Per-test registry of folder names this test created. Tests that don't create folders leave it
// empty, so the afterEach is a no-op for them.
let createdFolders: string[] = [];

// Best-effort UI cleanup: navigate to /my-media, scroll until the folder attaches, then open its
// 3-dot menu and confirm delete. If the folder no longer exists (already deleted by the test's
// own inline cleanup, or never created on a failed run), returns silently.
async function deleteFolderUI(page: Page, name: string): Promise<void> {
  await page.goto(BASE_URL + '/my-media', { waitUntil: 'networkidle' });
  for (let i = 0; i < 8; i++) {
    if (await folderByName(page, name).count() > 0) break;
    await page.evaluate(() => {
      window.scrollTo(0, 9_999_999);
      document
        .querySelectorAll('main, [class*="overflow-auto"], [class*="overflow-y"], #inside-folder-body')
        .forEach(el => { (el as HTMLElement).scrollTo(0, 9_999_999); });
    });
    await page.waitForTimeout(500);
  }
  if ((await folderByName(page, name).count()) === 0) return;
  await folderByName(page, name).first().scrollIntoViewIfNeeded();
  const trigger = folderCardByName(page, name).locator(MY_MEDIA.folderMenuTrigger).first();
  await trigger.waitFor({ state: 'visible', timeout: 10_000 });
  await trigger.click({ force: true });
  await page.locator(MY_MEDIA.deleteOption).first().click();
  await page.locator(MY_MEDIA.confirmDeleteButton).first().click();
}

test.describe('My Media', () => {
  test.beforeEach(() => {
    createdFolders = [];
  });

  test.afterEach(async ({ authenticatedPage }) => {
    // Only runs for tests that pushed a folder name into the registry. Best-effort: errors here
    // shouldn't mask the actual test result, so each delete is wrapped in try/catch.
    for (const name of createdFolders) {
      try {
        await deleteFolderUI(authenticatedPage, name);
      } catch {
        // ignore — folder may already be gone or the page may be in a bad state
      }
    }
    createdFolders = [];
  });

  test('@smoke MYMEDIA-1: My Media page loads for authenticated user', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/my-media', { waitUntil: 'networkidle' });

    await expect(authenticatedPage.locator(MY_MEDIA.heading)).toContainText(/My Media/i);
    // The account has folders — assert the first folder label is visible. 
    await expect(authenticatedPage.locator(MY_MEDIA.folderName).first()).toBeVisible();
  });

  test('MYMEDIA-2: create a new folder', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/my-media', { waitUntil: 'networkidle' });

    const folderName = `qa-folder-${Date.now()}`;
    createdFolders.push(folderName);

    const [response] = await Promise.all([
      authenticatedPage.waitForResponse(
        r => r.url().includes('/church-media/folders') && r.request().method() === 'POST',
      ),
      createFolder(authenticatedPage, folderName),
    ]);
    // Inertia POSTs return 302 on success (redirect to refreshed page), so response.ok() is false
    // even though the create succeeded. Accept any non-error status (2xx + 3xx).
    expect(response.status()).toBeLessThan(400);


    //new folder can land past the first infinite-scroll batch. Scroll multiple potential containers, in a
    // loop, until the folder attaches (or fail explicitly via the toBeVisible below).
    await authenticatedPage.reload({ waitUntil: 'networkidle' })
    for (let i = 0; i < 15; i++) {
      if (await folderByName(authenticatedPage, folderName).count() > 0) break
      await authenticatedPage.evaluate(() => {
        window.scrollTo(0, 9_999_999)
        document
          .querySelectorAll('main, [class*="overflow-auto"], [class*="overflow-y"], #inside-folder-body')
          .forEach(el => { (el as HTMLElement).scrollTo(0, 9_999_999) })
      })
      await authenticatedPage.waitForTimeout(800)
    }
    await expect(folderByName(authenticatedPage, folderName).first()).toBeVisible({ timeout: 10_000 });

    //clean up 
    await folderByName(authenticatedPage, folderName).first().scrollIntoViewIfNeeded();
    const menuTrigger3 = folderCardByName(authenticatedPage, folderName).locator(MY_MEDIA.folderMenuTrigger).first();
    await menuTrigger3.waitFor({ state: 'visible', timeout: 10_000 });
    await menuTrigger3.click({ force: true });
    await authenticatedPage.locator(MY_MEDIA.deleteOption).first().click();

    await expect(authenticatedPage.locator(MY_MEDIA.deleteDialogHeading)).toBeVisible();
    await authenticatedPage.locator(MY_MEDIA.confirmDeleteButton).first().click();

    await expect(folderByName(authenticatedPage, folderName)).toHaveCount(0);
  });

  test('MYMEDIA-3: rename a folder', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/my-media', { waitUntil: 'networkidle' });

    const original = `qa-rename-${Date.now()}`;
    const renamed = `${original}-edited`;
    createdFolders.push(original);
    await createFolder(authenticatedPage, original);
    // The grid sorts alphabetically; with 30+ accumulated test folders, the new `qa-rename-…`
    // lands at the very bottom of vue-infinite-loading's list. window.scrollTo on a body with
    // hidden overflow may be a no-op, and a single scroll only triggers one batch — so scroll
    // multiple potential containers, repeatedly, until the folder attaches.
    await authenticatedPage.reload({ waitUntil: 'networkidle' })
    for (let i = 0; i < 15; i++) {
      if (await folderByName(authenticatedPage, original).count() > 0) break
      await authenticatedPage.evaluate(() => {
        window.scrollTo(0, 9_999_999)
        document
          .querySelectorAll('main, [class*="overflow-auto"], [class*="overflow-y"], #inside-folder-body')
          .forEach(el => { (el as HTMLElement).scrollTo(0, 9_999_999) })
      })
      await authenticatedPage.waitForTimeout(800)
    }
    await expect(folderByName(authenticatedPage, original).first()).toBeVisible({ timeout: 10_000 });

    // Now scroll the row into view so the SPA hydrates the rest of the card (including the trigger).
    await folderByName(authenticatedPage, original).first().scrollIntoViewIfNeeded();
    const menuTrigger = folderCardByName(authenticatedPage, original).locator(MY_MEDIA.folderMenuTrigger).first();
    await menuTrigger.waitFor({ state: 'visible', timeout: 10_000 });
    await menuTrigger.click({ force: true });
    await authenticatedPage.locator(MY_MEDIA.renameOption).first().click();

    // Real Rename modal: same input[name="folder_name"], submit text "Rename"
    await authenticatedPage.locator(MY_MEDIA.folderNameInput).first().fill(renamed);
    await authenticatedPage.locator(MY_MEDIA.renameFolderSubmit).first().click();
    createdFolders.push(renamed);

    const menuTrigger2 = folderCardByName(authenticatedPage, renamed).locator(MY_MEDIA.folderMenuTrigger).first();
    await menuTrigger2.scrollIntoViewIfNeeded();
    await expect(folderByName(authenticatedPage, renamed).first()).toBeVisible();

    //clean up 
    await folderByName(authenticatedPage, renamed).first().scrollIntoViewIfNeeded();
    const menuTrigger3 = folderCardByName(authenticatedPage, renamed).locator(MY_MEDIA.folderMenuTrigger).first();
    await menuTrigger3.waitFor({ state: 'visible', timeout: 10_000 });
    await menuTrigger3.click({ force: true });
    await authenticatedPage.locator(MY_MEDIA.deleteOption).first().click();

    await expect(authenticatedPage.locator(MY_MEDIA.deleteDialogHeading)).toBeVisible();
    await authenticatedPage.locator(MY_MEDIA.confirmDeleteButton).first().click();

    await expect(folderByName(authenticatedPage, renamed)).toHaveCount(0);
  });

  test('MYMEDIA-4: delete a folder', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/my-media', { waitUntil: 'networkidle' });

    const folderName = `qa-delete-${Date.now()}`;
    createdFolders.push(folderName);
    await createFolder(authenticatedPage, folderName);
    await expect(folderByName(authenticatedPage, folderName).first()).toBeVisible();

    // Open menu → Delete, then real confirm dialog: "Are you sure..." + "Yes, I want to delete".
    // The infinite-scroll grid renders the folder name <p> early but only finishes hydrating the
    // rest of the card (including the 3-dot trigger) once the row is near the viewport. Scroll the
    // name into view first so the SPA hydrates the card, then wait for the trigger before clicking.
    await folderByName(authenticatedPage, folderName).first().scrollIntoViewIfNeeded();
    const menuTrigger = folderCardByName(authenticatedPage, folderName).locator(MY_MEDIA.folderMenuTrigger).first();
    await menuTrigger.waitFor({ state: 'visible', timeout: 10_000 });
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

    //clean up
    const itemsDelete = authenticatedPage.locator(MY_MEDIA.churchItem);
    const initial = await items.count();

    const item = items.last();
    await item.hover();
    await item.locator(MY_MEDIA.itemMenuTrigger).first().click({ force: true });
    await authenticatedPage.locator(MY_MEDIA.deleteOption).first().click();

    // Reuses the same confirm dialog ("Are you sure you want to delete this item?" / "Yes, I want to delete")
    await expect(authenticatedPage.locator(MY_MEDIA.deleteDialogHeading)).toBeVisible();
    await authenticatedPage.locator(MY_MEDIA.confirmDeleteButton).first().click();
    await authenticatedPage.waitForLoadState('networkidle');

    // The grid re-renders lazily after the server responds — give it more room than the 5s default
    await expect(itemsDelete).toHaveCount(initial - 1, { timeout: 15_000 });
  });

  test('@smoke MYMEDIA-6: church item favorite toggle hits the toggle-favorite endpoint', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(BASE_URL + '/my-media', { waitUntil: 'networkidle' });

    // Enter the first folder so we have a stable inside-folder context to upload into.
    await authenticatedPage.locator('main div.p-5.cursor-pointer').first().click();
    await expect(authenticatedPage.locator(MY_MEDIA.insideFolderBody)).toBeVisible();

    // Upload a file so we have a known just-created church item to favorite (and clean up).
    const items = authenticatedPage.locator(MY_MEDIA.churchItem);
    const before = await items.count();
    await authenticatedPage.locator(MY_MEDIA.uploadFileButton).first().click();
    await authenticatedPage.locator(MY_MEDIA.uploadInput).first().setInputFiles({
      name: 'qa-fav.png',
      mimeType: 'image/png',
      buffer: ONE_PX_PNG,
    });
    await expect(items).toHaveCount(before + 1, { timeout: 15_000 });

    // The new item appears at the end of the grid — scroll to it and hover to reveal the overlay.
    const newItem = items.last();
    await newItem.scrollIntoViewIfNeeded();
    await expect(newItem).toBeVisible();
    await newItem.hover();

    // The heart button has two visual states sharing the same wrapper button: outline (unfavorited,
    // svg path d="M4.318…") and filled (favorited, svg path d="M3.172…"). A freshly-uploaded item
    // starts unfavorited, but accepting both keeps the test resilient if state ever differs.
    const heart = newItem
      .locator('button:has(svg path[d^="M4.318"]), button:has(svg path[d^="M3.172"])')
      .first();
    const [response] = await Promise.all([
      authenticatedPage.waitForResponse(
        r => /\/church-media\/items\/.*toggle-favorite/.test(r.url()) && r.request().method() === 'PATCH',
      ),
      heart.click({ force: true }),
    ]);
    expect(response.status()).toBeLessThan(400);

    // Cleanup: delete the uploaded item via its 3-dot menu (same pattern as MYMEDIA-8).
    await newItem.hover();
    await newItem.locator(MY_MEDIA.itemMenuTrigger).first().click({ force: true });
    await authenticatedPage.locator(MY_MEDIA.deleteOption).first().click();
    await expect(authenticatedPage.locator(MY_MEDIA.deleteDialogHeading)).toBeVisible();
    await authenticatedPage.locator(MY_MEDIA.confirmDeleteButton).first().click();
    await expect(items).toHaveCount(before, { timeout: 15_000 });
  });

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

    // Enter the first folder (folders are click-to-open cards; the inner div.p-5 is the click target)
    await authenticatedPage.locator('main div.p-5.cursor-pointer').first().click();
    await expect(authenticatedPage.locator(MY_MEDIA.insideFolderBody)).toBeVisible();

    const add = authenticatedPage.locator(MY_MEDIA.churchItem);
    const before = await add.count();

    // Open dropzone then set the file on the hidden <input name="files" class="input-file">
    await authenticatedPage.locator(MY_MEDIA.uploadFileButton).first().click();
    await authenticatedPage.locator(MY_MEDIA.uploadInput).first().setInputFiles({
      name: 'qa-upload.png',
      mimeType: 'image/png',
      buffer: ONE_PX_PNG,
    });

    // The uploaded item appears as a new church item card inside the folder
    await expect(add).toHaveCount(before + 1);
    const items = authenticatedPage.locator(MY_MEDIA.churchItem);
    const initial = await items.count();

    const item = items.last();
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
