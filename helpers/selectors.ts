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

export const MEDIA_ITEM = {
  title: 'h1.media-title',
  // img covers photos/graphics; video/iframe covers video players
  preview: 'main img, main video, main iframe',
  favoriteButton: 'button.btn.border-2.border-yank',
  downloadButton: 'button[dusk="download-button"]',
  loginToDownload: 'a.bnt-primary:has-text("Login")',
  reportIssueButton: '[dusk="report-issue-button"]',
  issueTypeLabel: 'label.cursor-pointer',
  issueTextarea: 'textarea',
  issueSubmit: 'button:has-text("Submit")',
  // "Related Media" section — individual media item cards
  relatedMediaHeading: 'h4:has-text("Related Media")',
  relatedMediaLink: 'section:has(h4:has-text("Related Media")) a[href*="/media/"]',
  relatedMediaImage: 'section:has(h4:has-text("Related Media")) a[href*="/media/"] img',
  // Type labels (Photo / Video / Graphic) scoped to the Related Media section
  relatedMediaType: 'section:has(h4:has-text("Related Media")) p.text-payneFire.text-sm.font-light.truncate.capitalize',
  // "Also included in these Collections" section — collection cards
  relatedHeading: 'h4:has-text("Also included")',
  relatedCollectionLink: 'section:has(h4:has-text("Also included")) a[href*="/collections/"]',
  relatedCollectionImage: 'section:has(h4:has-text("Also included")) a[href*="/collections/"] img',
  editorTrigger: 'div.cursor-pointer.absolute.bg-black.bg-opacity-70',
  editorExportButton: 'button:has-text("Export")',
  exportDialog: '[data-test="Dialog"]',
};

export const SEARCH = {
  input: 'input[type="search"], input[placeholder*="Search" i], [data-testid="search-input"]',
  emptyStateText: /No Media to Display/i,
  filterButton: '[data-testid="filter-button"], button:has-text("Filter")',
  mediaTypeOption: '[data-testid="filter-type-toggle"], label:has-text("Media Type")',
  mediaTypeDropdown:'[data-testid="filter-type-select"], select[name="media_type"]',
  photoOption:'photo',
  applyFilterButton: '[data-testid="apply-filters-button"], button:has-text("Apply Filters")',
};

export const FAVORITES = {
  // Heart toggle on the media detail page — bg-aquamarine when favorited, border-2 border-yank when not
  favoriteButton: 'button.btn.bg-aquamarine, button.btn.border-2.border-yank',
  favoritedButton: 'button.btn.bg-aquamarine',
  unfavoritedButton: 'button.btn.border-2.border-yank',
  // Favorites page empty state
  emptyStateText: /No more media to display/i,
};

// NOTE: My Media selectors are placeholders pending real-DOM inspection — refine like SEARCH/FAVORITES were.
export const MY_MEDIA = {
  // Folder cards on /my-media (each links into /my-media/:folder)
  folderCard: '[dusk="folder-card"], main a[href*="/my-media/"]',
  emptyStateText: /No more items to display /i,
  newFolderButton: '[dusk="new-folder-button"], button:has-text("New Folder"), button:has-text("Create Folder")',
  folderNameInput: '[dusk="folder-name-input"], input[name="name"], input[placeholder*="folder" i]',
  saveFolderButton: '[dusk="save-folder-button"], button:has-text("Create"), button:has-text("Save")',
  // Per-folder context menu actions
  folderMenuButton: '[dusk="folder-menu"], button[aria-haspopup="menu"]',
  renameOption: '[dusk="folder-rename"], [role="menuitem"]:has-text("Rename"), button:has-text("Rename")',
  renameInput: '[dusk="folder-rename-input"], input[name="name"]',
  deleteOption: '[dusk="folder-delete"], [role="menuitem"]:has-text("Delete"), button:has-text("Delete")',
  confirmDeleteButton: '[dusk="confirm-delete"], button:has-text("Delete"), button:has-text("Confirm")',
  // Church item upload + cards inside a folder
  uploadInput: 'input[type="file"]',
  churchItem: '[dusk="church-item"], main a[href*="/media/"]',
  churchItemImage: '[dusk="church-item"] img, main a[href*="/media/"] img',
  churchItemFavoriteButton: 'button.btn.bg-aquamarine, button.btn.border-2.border-yank',
  moveOption: '[dusk="item-move"], [role="menuitem"]:has-text("Move"), button:has-text("Move")',
  moveDestinationOption: '[dusk="move-destination"], [role="option"], li',
  confirmMoveButton: '[dusk="confirm-move"], button:has-text("Move"), button:has-text("Confirm")',
  itemDeleteOption: '[dusk="item-delete"], [role="menuitem"]:has-text("Delete"), button:has-text("Delete")',
};

// NOTE: Profile selectors are placeholders pending real-DOM inspection — refine like SEARCH/FAVORITES were.
export const PROFILE = {
  nameInput: '[dusk="profile-name"], input[name="name"], input[name="first_name"]',
  emailInput: '[dusk="profile-email"], input[name="email"], input[type="email"]',
  saveButton: '[dusk="profile-save"], button:has-text("Save")',
  successMessage: '[dusk="toast-success"], [role="status"], .toast-success, .alert-success',
  currentPasswordInput: 'input[name="current_password"], input[name="old_password"]',
  newPasswordInput: 'input[name="password"], input[name="new_password"]',
  confirmPasswordInput: 'input[name="password_confirmation"], input[name="confirm_password"]',
  changePasswordButton: '[dusk="change-password"], button:has-text("Change Password"), button:has-text("Update Password")',
  validationError: '[dusk="validation-error"], [role="alert"], .invalid-feedback, .text-red, .error',
};
