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
