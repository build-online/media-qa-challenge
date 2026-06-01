import { test, expect } from '../../fixtures/auth.fixture';
import { checkA11y, injectAxe } from 'axe-playwright';
import * as dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'https://media.tithelyqa.com';

test.describe('Accessibility', () => {

  // A11Y-1: Scoped to 'critical' impact only per spec requirement.
  // Known serious violations (aria-hidden-focus, color-contrast, link-name, list)
  // are documented below and should be fixed by the development team:
  // - aria-hidden-focus: flickity carousel cells
  // - color-contrast: .text-yankFire, .text-payneHot, .text-payneFire
  // - link-name: media card anchor elements missing discernible text
  // - list: incorrectly structured list elements
  test('A11Y-1: home page has no critical accessibility violations',
  async ({ guestPage }) => {
    await guestPage.goto(BASE_URL + '/home', { waitUntil: 'networkidle' });
    await injectAxe(guestPage);
    await checkA11y(guestPage, undefined, {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa']
        }
      },
      violationCallback: (violations) => {
        violations.forEach(v => {
          console.log(`[A11Y] ${v.impact?.toUpperCase()}: ${v.id} - ${v.description} (${v.nodes.length} nodes)`)
        })
      },
      detailedReport: false,
      includedImpacts: ['critical'],
    });
  });
});
