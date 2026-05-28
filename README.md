# Tithely Media — E2E Test Suite

## Overview

Playwright + TypeScript E2E test suite for [https://media.tithelyqa.com](https://media.tithelyqa.com). Covers auth, home, collections, sermon kits, media items, search, favorites, my media, and profile.

## Prerequisites

- Node.js v20 or higher
- npm v9 or higher
- Access to the [https://media.tithelyqa.com](https://media.tithelyqa.com) QA environment

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/build-online/media-qa-challenge.git
   cd media-qa-challenge
   ```

2. Install dependencies:
   ```bash
   npm ci
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install chromium firefox
   ```

## Environment Setup

A `.env` file is required to run the tests. It is never committed to the repository.

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `BASE_URL` | Target environment URL (e.g. `https://media.tithelyqa.com`) |
| `TEST_USER_EMAIL` | Email of the test user account |
| `TEST_USER_PASSWORD` | Password of the test user account |
| `API_TOKEN` | JWT token used to inject the authenticated session |

### How to get the API_TOKEN

1. Open [https://media.tithelyqa.com](https://media.tithelyqa.com) in your browser
2. Log in manually via the SSO flow
3. Open DevTools → **Application** → **Cookies** → select `media.tithelyqa.com`
4. Copy the value of the `session_token` cookie
5. Paste it as `API_TOKEN` in your `.env` file

## Authentication Strategy

The app uses Tithe.ly SSO (external provider) protected by reCAPTCHA, which makes programmatic login through the UI not possible.

The solution is to inject three cookies directly from an existing browser session. The setup project reads these cookies from `.env`, injects them into a Playwright context, navigates to the app to validate the session, and saves the full browser state to `playwright/.auth/user.json`. All tests reuse that saved state.

### Required cookies

| Env var | Cookie name | Description |
|---|---|---|
| `SESSION_TOKEN` | `session_token` | JWT issued after SSO |
| `LARAVEL_SESSION` | `tithely_media_staging_session` | Laravel server-side session |
| `XSRF_TOKEN` | `XSRF-TOKEN` | CSRF protection token |

### How to get the cookie values

1. Open [https://media.tithelyqa.com](https://media.tithelyqa.com) in your browser
2. Log in manually via the SSO flow
3. Open **DevTools → Application → Cookies → media.tithelyqa.com**
4. Copy the values for `session_token`, `tithely_media_staging_session`, and `XSRF-TOKEN`
5. Paste them into `.env` as `SESSION_TOKEN`, `LARAVEL_SESSION`, and `XSRF_TOKEN`

Then run the setup:

```bash
npx playwright test --project=setup
```

### Refreshing the session

Cookies expire periodically. When tests start failing with unexpected redirects to the login page or auth errors, repeat the steps above to get fresh cookie values and run the setup again.

### CI/CD

Add `SESSION_TOKEN`, `LARAVEL_SESSION`, and `XSRF_TOKEN` as secrets in **GitHub → Settings → Secrets and variables → Actions**. The CI pipeline reads them automatically via environment variables.

## Running Tests

```bash
# Run all tests (chromium + firefox)
npx playwright test

# Run only chromium
npx playwright test --project=chromium

# Run only the auth setup
npx playwright test --project=setup

# Run a specific test file
npx playwright test tests/home/home.spec.ts

# Run tests matching a tag
npx playwright test --grep @smoke

# Interactive UI mode
npx playwright test --ui

# View HTML report
npx playwright show-report
```

## Project Structure

```
.
├── fixtures/
│   ├── auth.setup.ts       # Runs once: injects JWT cookie and saves storageState
│   └── auth.fixture.ts     # Exports authenticatedPage and guestPage fixtures
├── helpers/
│   ├── api.ts              # Generic API client using Authorization: Bearer token
│   └── selectors.ts        # Shared CSS/testid selectors
├── tests/
│   ├── auth/               # Authentication flow tests
│   ├── home/               # Home page tests
│   ├── collections/        # Collections browse and detail tests
│   ├── sermon-kits/        # Sermon kits tests
│   ├── media-item/         # Individual media item tests
│   ├── search/             # Search functionality tests
│   ├── favorites/          # Favorites management tests
│   ├── my-media/           # Church media and folder tests
│   └── profile/            # Profile settings tests
├── playwright/.auth/       # Saved session state (gitignored)
├── playwright.config.ts
└── .env                    # Local secrets (gitignored, never commit)
```

## Fixtures

Import `test` and `expect` from the auth fixture instead of `@playwright/test`:

```typescript
import { test, expect } from '../../fixtures/auth.fixture';

test('example authenticated test', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/favorites');
  // already logged in
});

test('example guest test', async ({ guestPage }) => {
  await guestPage.goto('/home');
  // not logged in
});
```

- **`authenticatedPage`** — opens a browser context with the saved session state, user is already logged in
- **`guestPage`** — opens a fresh browser context with no session, user is a visitor

## CI/CD

The GitHub Actions pipeline (`.github/workflows/playwright.yml`) runs on every push and pull request to `main` and `master`.

- Chromium and Firefox run in **parallel** as separate jobs
- Each job runs the `setup` project first to generate the session, then runs its browser
- The HTML report is uploaded as an artifact **only on failure**, retained for 7 days

### Required secrets

Configure these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `BASE_URL` | Target environment URL |
| `SESSION_TOKEN` | `session_token` cookie value |
| `LARAVEL_SESSION` | `tithely_media_staging_session` cookie value |
| `XSRF_TOKEN` | `XSRF-TOKEN` cookie value |

## Tagging Convention

Use `@smoke` to mark critical happy-path tests that validate core functionality. These are the tests that should pass on every PR before merging.

```typescript
test('@smoke home page loads for authenticated user', async ({ authenticatedPage }) => {
  // ...
});
```

Run only smoke tests:

```bash
npx playwright test --grep @smoke
```
