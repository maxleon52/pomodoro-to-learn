import { defineConfig } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'extension',
      use: {
        // launchPersistentContext é usado diretamente no fixture — este projeto
        // serve apenas como agrupador de configurações compartilhadas
      },
    },
  ],
})
