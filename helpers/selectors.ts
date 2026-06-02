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
  mediaTypeDropdown:'[data-testid="filter-type-select"], [dusk="filter-type-select"], select[name="media_type"]',
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

// /my-media — all selectors are from the real DOM. The 3-dot dropdown menus (folder + item) share
// one component (outer panel + each option = div.p-2.flex with <p class="text-xs text-yank">Label</p>);
// create/rename modals share input[name="folder_name"]; the delete confirm dialog is shared by
// folder + item delete.
export const MY_MEDIA = {
  heading: 'main h4', // "My Media (16)" at root, "<Folder name> (n)" inside a folder
  insideFolderBody: '#inside-folder-body', // unique container shown only inside /my-media/:folder
  backButton: 'p.text-xs:has-text("Back")',
  newFolderButton: 'button:has-text("New Folder")',
  uploadFileButton: 'button:has-text("Upload File")',
  uploadInput: 'input[type="file"][name="files"]', // dropzone input revealed by Upload File
  folderName: 'main p.text-center.text-payne', // folder label (folders are click-to-open divs, no href)
  churchItem: 'main div[id="parent"]', // church item card (the app reuses id="parent")
  churchItemImage: 'main div[id="parent"] img',
  emptyStateText: /No more items to display|No results/i,
  // Create + rename folder modals (real DOM — both share input[name="folder_name"])
  folderNameInput: 'input[name="folder_name"]',
  createFolderSubmit: 'form button[type="submit"]:has-text("Create")',
  renameFolderSubmit: 'form button[type="submit"]:has-text("Rename")',
  // Folder card 3-dot trigger (distinct from the item trigger, which uses right-2 top-2 hover:bg-payneMiddle)
  folderMenuTrigger: 'div.absolute.right-0.top-4.hover\\:bg-smoke.rounded-xl',
  // Church-item 3-dot trigger (display:none until the card is hovered). Relative — intended to be
  // used as `item.locator(MY_MEDIA.itemMenuTrigger)` scoped to a churchItem locator.
  itemMenuTrigger: 'div.hidden-child',
  // 3-dot dropdown options share a single component (outer panel = div.p-2, each option =
  // div.p-2.flex with <p class="text-xs text-yank">Label</p>). div.p-2.flex avoids matching
  // the outer panel itself. Same component drives the folder menu too.
  renameOption: 'div.p-2.flex:has-text("Rename")',
  deleteOption: 'div.p-2.flex:has-text("Delete")',
  moveOption: 'div.p-2.flex:has-text("Move")',
  itemEditOption: 'div.p-2.flex:has-text("Edit")',
  itemDownloadLink: 'a[dusk="download-button"]',
  // Delete confirm dialog (shared for folder + item delete)
  confirmDeleteButton: 'form button[type="submit"]:has-text("Yes, I want to delete")',
  deleteDialogHeading: 'h2:has-text("Are you sure you want to delete")',
  // Move-into-folder dialog (real — vue-select combobox + submit button)
  moveDialogPreview: 'div.h-32.w-32 img', // item thumbnail at top of the move dialog
  moveCombobox: '[role="combobox"], .vs__dropdown-toggle',
  moveDestinationOption: 'ul[role="listbox"] li, .vs__dropdown-option',
  confirmMoveButton: 'button[type="submit"]:has-text("Move")',
};

// /profile-settings/details — Profile Details form (real). The password page reuses input[name=...]
// patterns; the success toast is vue-toastification's `.v-toast__item--success`.
export const PROFILE = {
  // Sidebar navigation between sub-pages
  detailsLink: 'a[href*="/profile-settings/details"]',
  passwordLink: 'a[href*="/profile-settings/password"]',
  // Profile Details form (real)
  firstNameInput: 'input[name="first_name"]',
  lastNameInput: 'input[name="last_name"]',
  emailInput: 'input[id="email"]',
  saveButton: 'button[type="submit"]:has-text("Save Details")',
  // vue-toastification success toast (auto-dismisses with v-toast--fade-out)
  successMessage: '.v-toast__item--success, .toast-success, [class*="toast"][class*="success"]',
  // Password form (real)
  currentPasswordInput: 'input[name="current_password"]',
  newPasswordInput: 'input[name="password"]',
  confirmPasswordInput: 'input[name="password_confirmation"]',
  changePasswordButton: 'button[type="submit"]:has-text("Update Password")',
  // Mismatched-confirmation error DOM not yet captured — guess covers the likely toast variants + Tailwind inline error
  validationError: '.v-toast__item--error, .v-toast__item--warning, [class*="text-red"]',
};
