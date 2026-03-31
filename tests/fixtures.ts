import { test as base, chromium, type BrowserContext } from '@playwright/test'
import path from 'path'

export interface ExtensionFixtures {
  context: BrowserContext
  extensionId: string
  sidepanel: import('@playwright/test').Page
}

export const test = base.extend<ExtensionFixtures>({
  context: async ({}, use) => {
    const extensionPath = path.resolve(__dirname, '../dist')
    const userDataDir = path.resolve(__dirname, '../.playwright-profile')
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    })
    await use(context)
    await context.close()
  },

  extensionId: async ({ context }, use) => {
    const worker = context.serviceWorkers()[0]
      ?? await context.waitForEvent('serviceworker')
    const extensionId = worker.url().split('/')[2]
    await use(extensionId)
  },

  sidepanel: async ({ context, extensionId }, use) => {
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`)
    // Espera o App terminar de hidratar do storage (inclusive o useEffect de persistência)
    // ANTES de limpar — evita race condition onde o App reescreve dados após o clear()
    await page.waitForSelector('[data-loaded="true"]', { timeout: 10000 })
    await page.evaluate(async () => { await chrome.storage.local.clear() })
    await page.reload()
    // Aguarda nova hidratação (agora com storage vazio)
    await page.waitForSelector('[data-loaded="true"]', { timeout: 10000 })
    await use(page)
    await page.close()
  },
})

export { expect } from '@playwright/test'
