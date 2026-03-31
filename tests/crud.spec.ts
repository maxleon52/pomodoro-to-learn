import { test, expect } from './fixtures'

async function goTo(page: import('@playwright/test').Page, screen: 'Timer' | 'Perguntas' | 'Categorias' | 'Pomodoro') {
  await page.getByRole('button', { name: screen, exact: true }).click()
}

async function criarCategoria(page: import('@playwright/test').Page, nome = 'Teste') {
  await goTo(page, 'Categorias')
  await page.locator('.cat-plus-btn').click()
  await page.getByPlaceholder('Nova categoria...').fill(nome)
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click()
}

async function criarPergunta(page: import('@playwright/test').Page, enunciado = 'Pergunta de teste?') {
  await goTo(page, 'Perguntas')
  await page.locator('.q-plus-btn').click()
  await page.getByPlaceholder('Ex: Qual a diferença entre let e const?').fill(enunciado)
  await page.getByPlaceholder('Opção A').fill('Opção 1')
  await page.getByPlaceholder('Opção B').fill('Opção 2')
  await page.getByPlaceholder('Opção C').fill('Opção 3')
  await page.getByPlaceholder('Opção D').fill('Opção 4')
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click()
}

test.describe('CRUD — Categorias', () => {
  test('cria categoria e mostra toast', async ({ sidepanel }) => {
    await goTo(sidepanel, 'Categorias')
    await sidepanel.locator('.cat-plus-btn').click()
    await sidepanel.getByPlaceholder('Nova categoria...').fill('TypeScript')
    await sidepanel.getByRole('button', { name: 'Adicionar', exact: true }).click()

    await expect(sidepanel.locator('.cat-item-name', { hasText: 'TypeScript' })).toBeVisible()
    await expect(sidepanel.getByText('Categoria criada')).toBeVisible()
  })

  test('edita categoria e mostra toast', async ({ sidepanel }) => {
    await criarCategoria(sidepanel, 'Original')
    await sidepanel.locator('.cat-action-btn').first().click()
    await sidepanel.getByPlaceholder('Nova categoria...').fill('Editado')
    await sidepanel.getByRole('button', { name: 'Salvar', exact: true }).click()

    await expect(sidepanel.locator('.cat-item-name', { hasText: 'Editado' })).toBeVisible()
    await expect(sidepanel.getByText('Categoria atualizada')).toBeVisible()
  })

  test('exclui categoria e mostra toast', async ({ sidepanel }) => {
    // Não usar 'Excluir' como nome — conflita com o texto do botão de confirmar
    await criarCategoria(sidepanel, 'ParaRemover')
    await sidepanel.locator('.cat-action-btn').nth(1).click()
    await sidepanel.locator('.cat-dialog').waitFor({ state: 'visible' })
    await sidepanel.getByRole('button', { name: 'Excluir', exact: true }).click()

    await expect(sidepanel.locator('.cat-item-name', { hasText: 'ParaRemover' })).not.toBeVisible()
    await expect(sidepanel.getByText('Categoria excluída')).toBeVisible()
  })
})

test.describe('CRUD — Perguntas', () => {
  test.beforeEach(async ({ sidepanel }) => {
    await criarCategoria(sidepanel)
  })

  test('cria pergunta e mostra toast', async ({ sidepanel }) => {
    await goTo(sidepanel, 'Perguntas')
    await sidepanel.locator('.q-plus-btn').click()
    await sidepanel.getByPlaceholder('Ex: Qual a diferença entre let e const?').fill('O que é TypeScript?')
    await sidepanel.getByPlaceholder('Opção A').fill('Um superset do JavaScript')
    await sidepanel.getByPlaceholder('Opção B').fill('Uma linguagem nova')
    await sidepanel.getByPlaceholder('Opção C').fill('Um framework')
    await sidepanel.getByPlaceholder('Opção D').fill('Um bundler')
    await sidepanel.getByRole('button', { name: 'Adicionar', exact: true }).click()

    await expect(sidepanel.getByText('O que é TypeScript?')).toBeVisible()
    await expect(sidepanel.getByText('Pergunta criada')).toBeVisible()
  })

  test('exclui pergunta e mostra toast', async ({ sidepanel }) => {
    await criarPergunta(sidepanel, 'Pergunta para remover?')
    await sidepanel.locator('.q-action-btn').nth(1).click()
    await sidepanel.getByRole('button', { name: 'Excluir', exact: true }).click()

    await expect(sidepanel.getByText('Pergunta excluída')).toBeVisible()
  })
})

test.describe('CRUD — Pomodoros', () => {
  test.beforeEach(async ({ sidepanel }) => {
    await criarCategoria(sidepanel)
    await criarPergunta(sidepanel)
  })

  test('cria pomodoro e mostra toast', async ({ sidepanel }) => {
    await goTo(sidepanel, 'Pomodoro')
    await sidepanel.locator('.pm-plus-btn').click()
    await sidepanel.getByPlaceholder('Ex: Estudar Inglês').fill('Meu Pomodoro')
    await sidepanel.locator('.pm-q-row').first().waitFor({ state: 'visible' })
    await sidepanel.locator('.pm-q-row').first().click()
    await expect(sidepanel.getByRole('button', { name: 'Adicionar', exact: true })).toBeEnabled()
    await sidepanel.getByRole('button', { name: 'Adicionar', exact: true }).click()

    await expect(sidepanel.locator('.pm-item-name', { hasText: 'Meu Pomodoro' })).toBeVisible()
    await expect(sidepanel.getByText('Pomodoro criado')).toBeVisible()
  })

  test('exclui pomodoro e mostra toast', async ({ sidepanel }) => {
    await goTo(sidepanel, 'Pomodoro')
    await sidepanel.locator('.pm-plus-btn').click()
    await sidepanel.getByPlaceholder('Ex: Estudar Inglês').fill('ParaRemover')
    await sidepanel.locator('.pm-q-row').first().waitFor({ state: 'visible' })
    await sidepanel.locator('.pm-q-row').first().click()
    await expect(sidepanel.getByRole('button', { name: 'Adicionar', exact: true })).toBeEnabled()
    await sidepanel.getByRole('button', { name: 'Adicionar', exact: true }).click()

    await sidepanel.locator('.pm-action-btn').nth(1).click()
    await sidepanel.getByRole('button', { name: 'Excluir', exact: true }).click()

    await expect(sidepanel.getByText('Pomodoro excluído')).toBeVisible()
  })
})
