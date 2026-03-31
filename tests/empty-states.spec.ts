import { test, expect } from './fixtures'

test.describe('Empty states', () => {
  test('timer mostra empty state quando não há pomodoros', async ({ sidepanel }) => {
    await expect(sidepanel.getByText('Nenhum pomodoro criado')).toBeVisible()
    await expect(sidepanel.getByText('Crie um pomodoro na aba abaixo para começar.')).toBeVisible()
  })

  test('botões de navegação ficam desabilitados sem pomodoros', async ({ sidepanel }) => {
    await expect(sidepanel.getByLabel('Categoria anterior')).toBeDisabled()
    await expect(sidepanel.getByLabel('Categoria seguinte')).toBeDisabled()
  })

  test('timer exibe 25:00 no estado inicial', async ({ sidepanel }) => {
    await expect(sidepanel.getByText('25:00')).toBeVisible()
  })

  test('play funciona mesmo sem pomodoros', async ({ sidepanel }) => {
    await sidepanel.getByLabel('Iniciar').click()
    await expect(sidepanel.getByLabel('Pausar')).toBeVisible()
  })
})
