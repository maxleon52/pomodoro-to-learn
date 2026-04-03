import { test, expect } from './fixtures'

async function goTo(page: import('@playwright/test').Page, screen: string) {
  await page.getByRole('button', { name: screen, exact: true }).click()
}

test.describe('Slug — Categorias', () => {
  test('slug é auto-preenchido a partir do nome', async ({ sidepanel }) => {
    await goTo(sidepanel, 'Categorias')
    await sidepanel.locator('.cat-plus-btn').click()
    await sidepanel.getByPlaceholder('Nova categoria...').fill('JavaScript Básico')

    const slugInput = sidepanel.getByPlaceholder('id-da-categoria')
    await expect(slugInput).toHaveValue('javascript-basico')
  })

  test('slug manual não é sobrescrito ao editar o nome', async ({ sidepanel }) => {
    await goTo(sidepanel, 'Categorias')
    await sidepanel.locator('.cat-plus-btn').click()
    await sidepanel.getByPlaceholder('Nova categoria...').fill('JavaScript')

    const slugInput = sidepanel.getByPlaceholder('id-da-categoria')
    await slugInput.fill('meu-slug-custom')
    await sidepanel.getByPlaceholder('Nova categoria...').fill('JavaScript Avançado')

    // slug manual não deve ter mudado
    await expect(slugInput).toHaveValue('meu-slug-custom')
  })

  test('bloqueia criar categoria com slug duplicado', async ({ sidepanel }) => {
    await goTo(sidepanel, 'Categorias')

    // Cria primeira
    await sidepanel.locator('.cat-plus-btn').click()
    await sidepanel.getByPlaceholder('Nova categoria...').fill('JavaScript')
    await sidepanel.getByRole('button', { name: 'Adicionar', exact: true }).click()

    // Tenta criar segunda com mesmo nome (mesmo slug)
    await sidepanel.locator('.cat-plus-btn').click()
    await sidepanel.getByPlaceholder('Nova categoria...').fill('JavaScript')

    await expect(sidepanel.getByText('Já existe uma categoria com este ID')).toBeVisible()
    await expect(sidepanel.getByRole('button', { name: 'Adicionar', exact: true })).toBeDisabled()
  })
})

test.describe('Slug — Pomodoros', () => {
  test.beforeEach(async ({ sidepanel }) => {
    // Cria categoria e pergunta necessárias
    await goTo(sidepanel, 'Categorias')
    await sidepanel.locator('.cat-plus-btn').click()
    await sidepanel.getByPlaceholder('Nova categoria...').fill('Base')
    await sidepanel.getByRole('button', { name: 'Adicionar', exact: true }).click()

    await goTo(sidepanel, 'Perguntas')
    await sidepanel.locator('.q-plus-btn').click()
    await sidepanel.getByPlaceholder('Ex: Qual a diferença entre let e const?').fill('Pergunta?')
    await sidepanel.getByPlaceholder('Opção A').fill('A')
    await sidepanel.getByPlaceholder('Opção B').fill('B')
    await sidepanel.getByPlaceholder('Opção C').fill('C')
    await sidepanel.getByPlaceholder('Opção D').fill('D')
    await sidepanel.getByRole('button', { name: 'Adicionar', exact: true }).click()
  })

  test('slug é auto-preenchido a partir do nome', async ({ sidepanel }) => {
    await goTo(sidepanel, 'Pomodoro')
    await sidepanel.locator('.pm-plus-btn').click()
    await sidepanel.getByPlaceholder('Ex: Estudar Inglês').fill('Estudar Inglês')

    const slugInput = sidepanel.getByPlaceholder('id-do-pomodoro')
    await expect(slugInput).toHaveValue('estudar-ingles')
  })

  test('bloqueia criar pomodoro com slug duplicado', async ({ sidepanel }) => {
    await goTo(sidepanel, 'Pomodoro')

    // Cria primeiro
    await sidepanel.locator('.pm-plus-btn').click()
    await sidepanel.getByPlaceholder('Ex: Estudar Inglês').fill('Meu Pomodoro')
    await sidepanel.locator('.pm-q-row').first().waitFor({ state: 'visible' })
    await sidepanel.locator('.pm-q-row').first().click()
    await sidepanel.getByRole('button', { name: 'Adicionar', exact: true }).click()

    // Tenta criar segundo com mesmo nome (mesmo slug)
    await sidepanel.locator('.pm-plus-btn').click()
    await sidepanel.getByPlaceholder('Ex: Estudar Inglês').fill('Meu Pomodoro')

    await expect(sidepanel.getByText('Já existe um pomodoro com este ID')).toBeVisible()
    await expect(sidepanel.getByRole('button', { name: 'Adicionar', exact: true })).toBeDisabled()
  })
})
