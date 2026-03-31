import { test, expect } from './fixtures'

// "Iniciar" e "Reiniciar sessão" ambos contêm "iniciar" — usar exact: true + getByRole
const btnIniciar = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Iniciar', exact: true })
const btnPausar = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Pausar', exact: true })

async function criarDoisPomodoros(page: import('@playwright/test').Page) {
  // Categoria
  await page.getByRole('button', { name: 'Categorias', exact: true }).click()
  await page.locator('.cat-plus-btn').click()
  await page.getByPlaceholder('Nova categoria...').fill('Base')
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click()

  // Pergunta
  await page.getByRole('button', { name: 'Perguntas', exact: true }).click()
  await page.locator('.q-plus-btn').click()
  await page.getByPlaceholder('Ex: Qual a diferença entre let e const?').fill('Pergunta?')
  await page.getByPlaceholder('Opção A').fill('A')
  await page.getByPlaceholder('Opção B').fill('B')
  await page.getByPlaceholder('Opção C').fill('C')
  await page.getByPlaceholder('Opção D').fill('D')
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click()

  // Pomodoro A
  await page.getByRole('button', { name: 'Pomodoro', exact: true }).click()
  await page.locator('.pm-plus-btn').click()
  await page.getByPlaceholder('Ex: Estudar Inglês').fill('Pomodoro A')
  await page.locator('.pm-q-row').first().waitFor({ state: 'visible' })
  await page.locator('.pm-q-row').first().click()
  await expect(page.getByRole('button', { name: 'Adicionar', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click()
  await expect(page.getByText('Pomodoro criado').first()).toBeVisible()

  // Pomodoro B
  await page.locator('.pm-plus-btn').click()
  await page.getByPlaceholder('Ex: Estudar Inglês').fill('Pomodoro B')
  await page.locator('.pm-q-row').first().waitFor({ state: 'visible' })
  await page.locator('.pm-q-row').first().click()
  await expect(page.getByRole('button', { name: 'Adicionar', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click()
  await expect(page.getByText('Pomodoro criado').first()).toBeVisible()

  await page.getByRole('button', { name: 'Timer', exact: true }).click()
}

test.describe('Timer — controles básicos', () => {
  test('exibe 25:00 no estado inicial', async ({ sidepanel }) => {
    await expect(sidepanel.getByText('25:00')).toBeVisible()
  })

  test('play inicia o timer', async ({ sidepanel }) => {
    await btnIniciar(sidepanel).click()
    await expect(btnPausar(sidepanel)).toBeVisible()
    await expect(sidepanel.getByText('Foco')).toBeVisible()
  })

  test('pause para o timer', async ({ sidepanel }) => {
    await btnIniciar(sidepanel).click()
    await btnPausar(sidepanel).click()
    await expect(btnIniciar(sidepanel)).toBeVisible()
  })

  test('reset volta ao estado inicial', async ({ sidepanel }) => {
    await btnIniciar(sidepanel).click()
    await sidepanel.getByLabel('Reiniciar sessão').click()
    await expect(sidepanel.getByText('25:00')).toBeVisible()
    await expect(btnIniciar(sidepanel)).toBeVisible()
  })

  test('botões reset e finish aparecem apenas após iniciar', async ({ sidepanel }) => {
    await expect(sidepanel.getByLabel('Reiniciar sessão')).not.toBeVisible()
    await expect(sidepanel.getByLabel('Finalizar sessão')).not.toBeVisible()
    await btnIniciar(sidepanel).click()
    await expect(sidepanel.getByLabel('Reiniciar sessão')).toBeVisible()
    await expect(sidepanel.getByLabel('Finalizar sessão')).toBeVisible()
  })
})

test.describe('Timer — troca de pomodoro', () => {
  test.beforeEach(async ({ sidepanel }) => {
    await criarDoisPomodoros(sidepanel)
  })

  test('navega entre pomodoros com timer parado', async ({ sidepanel }) => {
    await expect(sidepanel.getByText('1 / 2')).toBeVisible()
    await sidepanel.getByLabel('Categoria seguinte').click()
    await expect(sidepanel.getByText('2 / 2')).toBeVisible()
  })

  test('trocar com timer rodando exibe confirmação', async ({ sidepanel }) => {
    await btnIniciar(sidepanel).click()
    await sidepanel.getByLabel('Categoria seguinte').click()
    await expect(sidepanel.getByText('Trocar de pomodoro?')).toBeVisible()
  })

  test('confirmar troca reseta o timer', async ({ sidepanel }) => {
    await btnIniciar(sidepanel).click()
    await sidepanel.getByLabel('Categoria seguinte').click()
    await sidepanel.getByRole('button', { name: 'Trocar e reiniciar' }).click()
    await expect(sidepanel.getByText('25:00')).toBeVisible()
    await expect(sidepanel.getByText('2 / 2')).toBeVisible()
  })

  test('cancelar troca mantém timer rodando', async ({ sidepanel }) => {
    await btnIniciar(sidepanel).click()
    await sidepanel.getByLabel('Categoria seguinte').click()
    await sidepanel.getByRole('button', { name: 'Continuar a estudar' }).click()
    await expect(btnPausar(sidepanel)).toBeVisible()
    await expect(sidepanel.getByText('1 / 2')).toBeVisible()
  })
})

test.describe('Timer — persistência', () => {
  test('categorias persistem após reload', async ({ sidepanel }) => {
    await sidepanel.getByRole('button', { name: 'Categorias', exact: true }).click()
    await sidepanel.locator('.cat-plus-btn').click()
    await sidepanel.getByPlaceholder('Nova categoria...').fill('Persistência')
    await sidepanel.getByRole('button', { name: 'Adicionar', exact: true }).click()
    await sidepanel.reload()
    await sidepanel.waitForSelector('[data-loaded="true"]')
    await sidepanel.getByRole('button', { name: 'Categorias', exact: true }).click()
    await expect(sidepanel.locator('.cat-item-name', { hasText: 'Persistência' })).toBeVisible()
  })
})
