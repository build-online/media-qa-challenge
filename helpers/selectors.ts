export const NAV_LINKS = {
  collections: 'a[href="/collections"]',
  sermonKits: 'a[href="/sermon-kits"]',
  search: 'a[href="/search"]',
  myMedia: 'a[href="/my-media"]',
  favorites: 'a[href="/favorites"]',
};

export const NAV = {
  allMedia: 'ul.text-payneFire a[href*="/home"]',
  collections: 'ul.text-payneFire a[href*="/collections"]',
  sermonKits: 'ul.text-payneFire a[href*="sermon-kit"]',
  favorites: 'ul.text-payneFire a[href*="/favorites"]',
  myMedia: 'ul.text-payneFire a[href*="/my-media"]',
  graphics: 'ul.text-payneFire a[href*="filter[type]=graphic"]',
  video: 'ul.text-payneFire a[href*="filter[type]=video"]',
  socialMedia: 'ul.text-payneFire a[href*="filter[type]=social"]',
  photos: 'ul.text-payneFire a[href*="filter[type]=photo"]',
  login: 'a[href*="/auth/login"]',
  register: 'a[href*="/auth/register"]',
};

export const AUTH = {
  loginButton: '[data-testid="login-button"], a[href="/auth/login"]',
  registerButton: '[data-testid="register-button"], a[href="/auth/register"]',
};

export const MEDIA_CARD = {
  container: '[data-testid="media-card"], .media-card',
  title: '[data-testid="media-card-title"], .media-card__title',
  link: 'a[href*="/media/"]',
  image: 'a[href*="/media/"] img',
};

export const COLLECTIONS = {
  grid: 'div.items-grid',
  card: 'div.items-grid a',
  image: 'div.items-grid img',
};

export const SERMON_KITS = {
  // Search page renders kits as direct links — no div.items-grid wrapper like Collections
  card: 'main a[href*="/sermon-kits/"]',
  image: 'main a[href*="/sermon-kits/"] img',
};

export const HOME = {
  categoryCard: 'main a[href*="filter[type]"]',
  categoryCardImage: 'main a[href*="filter[type]"] img',
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
