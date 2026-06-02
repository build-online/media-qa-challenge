import { test, expect } from '../../fixtures/auth.fixture';
import { PROFILE } from '../../helpers/selectors';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'https://media.tithelyqa.com';
const PROFILE_DETAILS_URL = BASE_URL + '/profile-settings/details';
const PROFILE_PASSWORD_URL = BASE_URL + '/profile-settings/password';

test.describe('Profile Settings', () => {
  test('@smoke PROFILE-1: profile details page loads with pre-populated fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(PROFILE_DETAILS_URL, { waitUntil: 'networkidle' });

    
    const firstName = authenticatedPage.locator(PROFILE.firstNameInput);
    const email = authenticatedPage.locator(PROFILE.emailInput);
    await expect(firstName).toBeVisible();
    await expect(email).toBeVisible();
    await expect(firstName).not.toHaveValue('');
    await expect(email).not.toHaveValue('');
  });

  test('PROFILE-2: update profile details persists after reload', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(PROFILE_DETAILS_URL, { waitUntil: 'networkidle' });

    const firstName = authenticatedPage.locator(PROFILE.firstNameInput);
    const original = await firstName.inputValue();
    const updated = 'QA test';

    try {
      await firstName.clear();
      await firstName.fill(updated);
      await authenticatedPage.locator(PROFILE.saveButton).click();
      await expect(authenticatedPage.locator(PROFILE.successMessage).first()).toBeVisible({ timeout: 10_000 });

      // Updated value survives a page reload 
      await authenticatedPage.reload({ waitUntil: 'networkidle' });
      await expect(authenticatedPage.locator(PROFILE.firstNameInput)).toHaveValue(updated);
    } finally {
      // Restore the original first name so the account is left unmodified
      await authenticatedPage.locator(PROFILE.firstNameInput).fill(original);
      await authenticatedPage.locator(PROFILE.saveButton).click();
    }
  });

  test('PROFILE-3: password change with mismatched confirmation is rejected with a 422', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(PROFILE_PASSWORD_URL, { waitUntil: 'domcontentloaded' });

    await authenticatedPage.locator(PROFILE.currentPasswordInput).fill('CurrentPass123!');
    await authenticatedPage.locator(PROFILE.newPasswordInput).fill('NewPass123!');
    await authenticatedPage.locator(PROFILE.confirmPasswordInput).fill('DifferentPass123!');

    // The server returns 422 + a JSON `errors` object when the confirmation doesn't match. The
    // Inertia client has no handler for that response shape and renders the raw JSON in a dev
    // error overlay iframe — so the response is the most reliable signal that validation rejected.
    const [response] = await Promise.all([
      authenticatedPage.waitForResponse(
        r => r.url().includes('/profile-settings/password') && r.request().method() !== 'GET',
      ),
      authenticatedPage.locator(PROFILE.changePasswordButton).click(),
    ]);

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.success).toBe(false);
    // The mismatched-confirmation message is reported under the `password` field
    const passwordErrors = ((body.errors ?? {}).password ?? []).join(' ');
    expect(passwordErrors).toMatch(/confirmation does not match/i);
  });

  test('PROFILE-4: password change with valid data submits to the server', async ({ authenticatedPage }) => {
    await authenticatedPage.goto(PROFILE_PASSWORD_URL, { waitUntil: 'domcontentloaded' });

    // SAFETY: abort the password-change request so the test user's real password is NOT changed —
    // a real change would invalidate the saved session for every subsequent run. We can't fake a
    // proper Inertia success response without server cooperation, so we don't assert the success
    // toast here; we verify the form submitted with the expected payload instead.
    await authenticatedPage.route('**/profile-settings/password', route => {
      if (route.request().method() !== 'GET') {
        route.abort();
      } else {
        route.continue();
      }
    });

    await authenticatedPage.locator(PROFILE.currentPasswordInput).fill('CurrentPass123!'); // todo password deberia estar encriptada
    await authenticatedPage.locator(PROFILE.newPasswordInput).fill('NewSecurePass456!');
    await authenticatedPage.locator(PROFILE.confirmPasswordInput).fill('NewSecurePass456!');

    const [request] = await Promise.all([
      authenticatedPage.waitForRequest(
        r => r.url().includes('/profile-settings/password') && r.method() !== 'GET',
      ),
      authenticatedPage.locator(PROFILE.changePasswordButton).click(),
    ]);

    const payload = request.postData() ?? '';
    expect(payload).toMatch(/current_password/);
    expect(payload).toMatch(/password_confirmation/);
    expect(payload).toContain('NewSecurePass456!');
  });
});
