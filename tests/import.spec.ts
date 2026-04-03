import { test, expect } from './fixtures'
import path from 'path'
import fs from 'fs'

// JSON mínimo válido para testes de import
const VALID_JSON = JSON.stringify([
  {
    categorySlug: 'typescript',
    categoryName: 'TypeScript',
    pomodoroSlug: 'ts-basico',
    pomodoroName: 'TS Básico',
    pomodoroDuration: 25,
    question: 'O que é TypeScript?',
    options: [
      { option: 'A', answer: 'Superset do JavaScript' },
      { option: 'B', answer: 'Um framework' },
      { option: 'C', answer: 'Um bundler' },
      { option: 'D', answer: 'Um transpiler CSS' },
    ],
    correctAnswer: 'A',
    difficulty: 'easy',
  },
  {
    categorySlug: 'typescript',
    categoryName: 'TypeScript',
    pomodoroSlug: 'ts-basico',
    pomodoroName: 'TS Básico',
    pomodoroDuration: 25,
    question: 'O que é uma interface?',
    options: [
      { option: 'A', answer: 'Um contrato de tipos' },
      { option: 'B', answer: 'Uma classe abstrata' },
      { option: 'C', answer: 'Um enum' },
      { option: 'D', answer: 'Um módulo' },
    ],
    correctAnswer: 'A',
    difficulty: 'medium',
  },
])

const INVALID_JSON = JSON.stringify([
  {
    categorySlug: 'js',
    categoryName: 'JS',
    pomodoroSlug: 'js',
    pomodoroName: 'JS',
    pomodoroDuration: 25,
    question: 'Pergunta?',
    options: ['A', 'B', 'C', 'D'], // formato errado — deveria ser objetos
    correctAnswer: 'A',
    difficulty: 'easy',
  },
])

function writeTmp(name: string, content: string) {
  const p = path.resolve(__dirname, name)
  fs.writeFileSync(p, content, 'utf-8')
  return p
}

test.describe('Importação — navegação', () => {
  test('tela Importar é acessível pelo menu', async ({ sidepanel }) => {
    await sidepanel.getByRole('button', { name: 'Importar', exact: true }).click()
    await expect(sidepanel.getByText('Importar Perguntas')).toBeVisible()
  })

  test('exibe área de upload e hint de formato', async ({ sidepanel }) => {
    await sidepanel.getByRole('button', { name: 'Importar', exact: true }).click()
    await expect(sidepanel.getByText('Clique ou arraste um arquivo JSON')).toBeVisible()
    await expect(sidepanel.getByText('Formato esperado')).toBeVisible()
  })
})

test.describe('Importação — validação', () => {
  test('exibe erro para JSON com formato de options inválido', async ({ sidepanel }) => {
    const filePath = writeTmp('__invalid_import.json', INVALID_JSON)
    await sidepanel.getByRole('button', { name: 'Importar', exact: true }).click()
    const input = sidepanel.locator('input[type="file"]')
    await input.setInputFiles(filePath)
    await expect(sidepanel.locator('.imp-error')).toBeVisible()
    fs.unlinkSync(filePath)
  })
})

test.describe('Importação — fluxo completo', () => {
  test('mostra pré-visualização após upload válido', async ({ sidepanel }) => {
    const filePath = writeTmp('__valid_import.json', VALID_JSON)
    await sidepanel.getByRole('button', { name: 'Importar', exact: true }).click()
    const input = sidepanel.locator('input[type="file"]')
    await input.setInputFiles(filePath)

    await expect(sidepanel.getByText('Pré-visualização')).toBeVisible()
    await expect(sidepanel.getByText('TypeScript', { exact: true }).first()).toBeVisible()
    await expect(sidepanel.getByText('TS Básico', { exact: true })).toBeVisible()
    await expect(sidepanel.getByText('O que é TypeScript?', { exact: true })).toBeVisible()
    fs.unlinkSync(filePath)
  })

  test('importa perguntas e cria categoria/pomodoro novos', async ({ sidepanel }) => {
    const filePath = writeTmp('__valid_import2.json', VALID_JSON)
    await sidepanel.getByRole('button', { name: 'Importar', exact: true }).click()
    await sidepanel.locator('input[type="file"]').setInputFiles(filePath)

    await sidepanel.getByRole('button', { name: /Importar \(2\)/ }).click()

    // Toast de confirmação
    await expect(sidepanel.getByText('2 perguntas importadas')).toBeVisible()

    // Categoria criada
    await sidepanel.getByRole('button', { name: 'Categorias', exact: true }).click()
    await expect(sidepanel.locator('.cat-item-name', { hasText: 'TypeScript' })).toBeVisible()

    // Pergunta criada
    await sidepanel.getByRole('button', { name: 'Perguntas', exact: true }).click()
    await expect(sidepanel.getByText('O que é TypeScript?')).toBeVisible()
    await expect(sidepanel.getByText('O que é uma interface?')).toBeVisible()

    fs.unlinkSync(filePath)
  })

  test('item removido na pré-visualização não é importado', async ({ sidepanel }) => {
    const filePath = writeTmp('__valid_import3.json', VALID_JSON)
    await sidepanel.getByRole('button', { name: 'Importar', exact: true }).click()
    await sidepanel.locator('input[type="file"]').setInputFiles(filePath)

    await expect(sidepanel.getByText('Pré-visualização')).toBeVisible()
    // Remove a primeira pergunta
    await sidepanel.locator('.imp-remove-btn').first().click()

    await sidepanel.getByRole('button', { name: /Importar \(1\)/ }).click()

    await sidepanel.getByRole('button', { name: 'Perguntas', exact: true }).click()
    // Só uma pergunta deve existir
    await expect(sidepanel.getByText('O que é TypeScript?')).not.toBeVisible()
    await expect(sidepanel.getByText('O que é uma interface?')).toBeVisible()

    fs.unlinkSync(filePath)
  })

  test('pergunta duplicada aparece com badge "JÁ EXISTE"', async ({ sidepanel }) => {
    // Cria a pergunta manualmente primeiro
    await sidepanel.getByRole('button', { name: 'Categorias', exact: true }).click()
    await sidepanel.locator('.cat-plus-btn').click()
    await sidepanel.getByPlaceholder('Nova categoria...').fill('TypeScript')
    await sidepanel.getByRole('button', { name: 'Adicionar', exact: true }).click()

    await sidepanel.getByRole('button', { name: 'Perguntas', exact: true }).click()
    await sidepanel.locator('.q-plus-btn').click()
    await sidepanel.getByPlaceholder('Ex: Qual a diferença entre let e const?').fill('O que é TypeScript?')
    await sidepanel.getByPlaceholder('Opção A').fill('Superset do JavaScript')
    await sidepanel.getByPlaceholder('Opção B').fill('Um framework')
    await sidepanel.getByPlaceholder('Opção C').fill('Um bundler')
    await sidepanel.getByPlaceholder('Opção D').fill('Um transpiler CSS')
    await sidepanel.getByRole('button', { name: 'Adicionar', exact: true }).click()

    // Importa JSON que inclui essa mesma pergunta
    const filePath = writeTmp('__dup_import.json', VALID_JSON)
    await sidepanel.getByRole('button', { name: 'Importar', exact: true }).click()
    await sidepanel.locator('input[type="file"]').setInputFiles(filePath)

    await expect(sidepanel.getByText('JÁ EXISTE')).toBeVisible()
    fs.unlinkSync(filePath)
  })
})
