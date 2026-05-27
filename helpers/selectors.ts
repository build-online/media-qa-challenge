export const NAV_LINKS = {
  collections: 'a[href="/collections"]',
  sermonKits: 'a[href="/sermon-kits"]',
  search: 'a[href="/search"]',
  myMedia: 'a[href="/my-media"]',
  favorites: 'a[href="/favorites"]',
};

export const AUTH = {
  loginButton: '[data-testid="login-button"], a[href="/auth/login"]',
  registerButton: '[data-testid="register-button"], a[href="/auth/register"]',
};

export const MEDIA_CARD = {
  container: '[data-testid="media-card"], .media-card',
  title: '[data-testid="media-card-title"], .media-card__title',
  image: '[data-testid="media-card-image"], .media-card__image img',
};

export const SEARCH = {
  input: 'input[type="search"], input[placeholder*="Search" i], [data-testid="search-input"]',
  emptyStateText: /no results|no matches|nothing found|couldn.?t find|0 results/i,
  filterButton: '[data-testid="filter-button"], button:has-text("Filter")',
  mediaTypeOption:
    '[data-testid="filter-media-type"], [role="menuitem"]:has-text("Media type"), button:has-text("Media type")',
  mediaTypeDropdown:
    '[data-testid="media-type-dropdown"], button[aria-haspopup]:has-text("Media type"), select[name="media_type"]',
  photoOption:
    '[data-testid="media-type-photo"], [role="option"]:has-text("Photo"), li:has-text("Photo")',
  applyFilterButton:
    '[data-testid="apply-filter"], button:has-text("Apply filter"), button:has-text("Apply")',
};
