import { test, expect } from '../../fixtures/auth.fixture'
import dotenv from 'dotenv'
dotenv.config()

const BASE_URL = process.env.BASE_URL || 'https://media.tithelyqa.com'

test.describe('SEO', () => {

  const pagesToCheck = [
    { name: 'Home', path: '/home' },
    { name: 'Collections', path: '/collections' },
    { name: 'Sermon Kits', path: '/sermon-kits' },
    { name: 'Search', path: '/search' },
    { name: 'Media Item', path: '/media/122' },
    { name: 'Collection Detail', path: '/collections/0b59369a-6633-44b4-aca3-d50cab6d11f1' },
    { name: 'Sermon Kit Detail', path: '/sermon-kits/65f18297-a7e2-484e-8e34-b7b3f75955f3' },
  ]

  for (const { name, path } of pagesToCheck) {
    test(`SEO-1: ${name} page has title and meta description`,
    async ({ guestPage }) => {
      await guestPage.goto(BASE_URL + path, { waitUntil: 'networkidle' })

      // Assert <title> exists and has meaningful content
      const title = await guestPage.title()
      expect(title, `${name}: page title is empty`).toBeTruthy()
      expect(title.length, `${name}: title too short`).toBeGreaterThan(5)
      console.log(`${name} title: "${title}"`)

      // Assert <meta name="description"> exists and has content
      const metaDescription = await guestPage.locator('meta[name="description"]').getAttribute('content')
      expect(
        metaDescription,
        `${name}: meta description is missing or empty`
      ).toBeTruthy()
      expect(
        metaDescription!.length,
        `${name}: meta description too short`
      ).toBeGreaterThan(10)
      console.log(`${name} meta description: "${metaDescription}"`)
    })
  }

  const authPagesToCheck = [
    { name: 'Favorites', path: '/favorites' },
    { name: 'My Media', path: '/my-media' },
    { name: 'Profile Settings', path: '/profile-settings/profile-details' },
  ]

  for (const { name, path } of authPagesToCheck) {
    test(`SEO-1: ${name} page has title and meta description`,
    async ({ authenticatedPage }) => {
      await authenticatedPage.goto(BASE_URL + path, { waitUntil: 'networkidle' })

      const title = await authenticatedPage.title()
      expect(title, `${name}: page title is empty`).toBeTruthy()
      expect(title.length, `${name}: title too short`).toBeGreaterThan(5)
      console.log(`${name} title: "${title}"`)

      const metaDescription = await authenticatedPage.locator('meta[name="description"]').getAttribute('content')
      expect(
        metaDescription,
        `${name}: meta description is missing or empty`
      ).toBeTruthy()
      expect(
        metaDescription!.length,
        `${name}: meta description too short`
      ).toBeGreaterThan(10)
      console.log(`${name} meta description: "${metaDescription}"`)
    })
  }
})
