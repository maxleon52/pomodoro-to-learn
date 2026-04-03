import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import type { Category, Question, Pomodoro } from '../../shared/types'
import './import-screen.css'

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

interface RawOption {
  option: 'A' | 'B' | 'C' | 'D'
  answer: string
}

interface RawItem {
  categorySlug: string
  categoryName: string
  pomodoroSlug: string
  pomodoroName: string
  pomodoroDuration: number
  question: string
  options: [RawOption, RawOption, RawOption, RawOption]
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface ImportPayload {
  items: RawItem[]
}

interface ParsedQuestion {
  raw: RawItem
  isDuplicate: boolean
  key: string // índice como string para rastrear remoção
}

interface ImportScreenProps {
  categories: Category[]
  questions: Question[]
  pomodoros: Pomodoro[]
  onImport: (payload: ImportPayload) => void
}

const DIFFICULTIES = new Set(['easy', 'medium', 'hard'])
const CORRECT_ANSWERS = new Set(['A', 'B', 'C', 'D'])

function validate(data: unknown): RawItem[] {
  if (!Array.isArray(data)) throw new Error('O JSON deve ser um array de objetos.')
  if (data.length === 0) throw new Error('O array está vazio.')

  return data.map((item, i) => {
    const prefix = `Item ${i + 1}:`
    if (typeof item !== 'object' || item === null) throw new Error(`${prefix} deve ser um objeto.`)
    const o = item as Record<string, unknown>

    const req = (key: string) => {
      if (typeof o[key] !== 'string' || !(o[key] as string).trim())
        throw new Error(`${prefix} campo "${key}" é obrigatório e deve ser texto.`)
      return (o[key] as string).trim()
    }

    const categorySlug    = req('categorySlug')
    const categoryName    = req('categoryName')
    const pomodoroSlug    = req('pomodoroSlug')
    const pomodoroName    = req('pomodoroName')
    const question        = req('question')
    const correctAnswer   = req('correctAnswer')
    const difficulty      = req('difficulty')

    if (!CORRECT_ANSWERS.has(correctAnswer))
      throw new Error(`${prefix} "correctAnswer" deve ser A, B, C ou D.`)
    if (!DIFFICULTIES.has(difficulty))
      throw new Error(`${prefix} "difficulty" deve ser easy, medium ou hard.`)

    const duration = o['pomodoroDuration']
    if (typeof duration !== 'number' || !Number.isInteger(duration) || duration < 1)
      throw new Error(`${prefix} "pomodoroDuration" deve ser um número inteiro ≥ 1.`)

    const options = o['options']
    if (!Array.isArray(options) || options.length !== 4)
      throw new Error(`${prefix} "options" deve ser um array com exatamente 4 itens.`)

    const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const
    const parsedOptions = options.map((opt, j) => {
      if (typeof opt !== 'object' || opt === null)
        throw new Error(`${prefix} options[${j}] deve ser um objeto com "option" e "answer".`)
      const o2 = opt as Record<string, unknown>
      const letter = o2['option']
      const answer = o2['answer']
      if (letter !== OPTION_LETTERS[j])
        throw new Error(`${prefix} options[${j}].option deve ser "${OPTION_LETTERS[j]}".`)
      if (typeof answer !== 'string' || !answer.trim())
        throw new Error(`${prefix} options[${j}].answer é obrigatório e deve ser texto.`)
      return { option: letter as 'A' | 'B' | 'C' | 'D', answer: answer.trim() }
    }) as [RawOption, RawOption, RawOption, RawOption]

    return {
      categorySlug,
      categoryName,
      pomodoroSlug,
      pomodoroName,
      pomodoroDuration: duration,
      question,
      options: parsedOptions,
      correctAnswer: correctAnswer as 'A' | 'B' | 'C' | 'D',
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
    }
  })
}

const HINT = `[
  {
    "categorySlug": "javascript",
    "categoryName": "JavaScript",
    "pomodoroSlug": "js-basico",
    "pomodoroName": "JS Básico",
    "pomodoroDuration": 25,
    "question": "O que é closure?",
    "options": [
      { "option": "A", "answer": "Acesso ao escopo externo" },
      { "option": "B", "answer": "Não retorna valor" },
      { "option": "C", "answer": "Um tipo de loop" },
      { "option": "D", "answer": "Um objeto global" }
    ],
    "correctAnswer": "A",
    "difficulty": "medium"
  }
]`

export default function ImportScreen({ categories, questions, pomodoros, onImport }: ImportScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedQuestion[] | null>(null)
  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  function reset() {
    setParsed(null)
    setExcluded(new Set())
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleFile(file: File) {
    setError(null)
    setParsed(null)
    setExcluded(new Set())

    if (file.size > MAX_SIZE) {
      setError('Arquivo muito grande. Limite: 2 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string)
        const items = validate(data)
        const existingQuestions = new Set(questions.map(q => q.question.trim().toLowerCase()))
        const pq: ParsedQuestion[] = items.map((raw, i) => ({
          raw,
          isDuplicate: existingQuestions.has(raw.question.trim().toLowerCase()),
          key: String(i),
        }))
        setParsed(pq)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao processar o arquivo.')
      }
    }
    reader.onerror = () => setError('Erro ao ler o arquivo.')
    reader.readAsText(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function remove(key: string) {
    setExcluded(prev => new Set([...prev, key]))
  }

  function handleConfirm() {
    if (!parsed) return
    const included = parsed.filter(pq => !excluded.has(pq.key)).map(pq => pq.raw)
    if (included.length === 0) return
    onImport({ items: included })
    reset()
  }

  // Derivados para a pré-visualização
  const included = parsed ? parsed.filter(pq => !excluded.has(pq.key)) : []

  const existingCategorySlugs = new Set(categories.map(c => c.slug))
  const existingPomodoroSlugs = new Set(pomodoros.map(p => p.slug))

  const newCategories = [
    ...new Map(
      included
        .filter(pq => !existingCategorySlugs.has(pq.raw.categorySlug))
        .map(pq => [pq.raw.categorySlug, { slug: pq.raw.categorySlug, name: pq.raw.categoryName }])
    ).values(),
  ]

  const newPomodoros = [
    ...new Map(
      included
        .filter(pq => !existingPomodoroSlugs.has(pq.raw.pomodoroSlug))
        .map(pq => [pq.raw.pomodoroSlug, { slug: pq.raw.pomodoroSlug, name: pq.raw.pomodoroName, duration: pq.raw.pomodoroDuration }])
    ).values(),
  ]

  const duplicateCount = included.filter(pq => pq.isDuplicate).length

  if (parsed) {
    return (
      <div className="imp-screen">
        <div className="imp-topbar">
          <span className="imp-topbar-title">Pré-visualização</span>
        </div>

        {newCategories.length > 0 && (
          <div>
            <p className="imp-section-title">Categorias ({newCategories.length} nova{newCategories.length !== 1 ? 's' : ''})</p>
            <div className="imp-section-list">
              {newCategories.map(cat => (
                <div key={cat.slug} className="imp-item">
                  <div className="imp-item-body">
                    <span className="imp-item-name">{cat.name}</span>
                    <span className="imp-item-sub">{cat.slug}</span>
                  </div>
                  <span className="imp-badge-new">NOVA</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {newPomodoros.length > 0 && (
          <div>
            <p className="imp-section-title">Pomodoros ({newPomodoros.length} novo{newPomodoros.length !== 1 ? 's' : ''})</p>
            <div className="imp-section-list">
              {newPomodoros.map(p => (
                <div key={p.slug} className="imp-item">
                  <div className="imp-item-body">
                    <span className="imp-item-name">{p.name}</span>
                    <span className="imp-item-sub">{p.slug} · {p.duration} min</span>
                  </div>
                  <span className="imp-badge-new">NOVO</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="imp-section-title">
            Perguntas ({included.length}{duplicateCount > 0 ? ` · ${duplicateCount} duplicada${duplicateCount !== 1 ? 's' : ''}` : ''})
          </p>
          <div className="imp-section-list">
            {parsed.map(pq => {
              if (excluded.has(pq.key)) return null
              return (
                <div key={pq.key} className={`imp-item${pq.isDuplicate ? ' imp-item--duplicate' : ''}`}>
                  <div className="imp-item-body">
                    <span className="imp-item-name">{pq.raw.question}</span>
                    <span className="imp-item-sub">{pq.raw.categoryName} · {pq.raw.pomodoroName} · {pq.raw.difficulty}</span>
                  </div>
                  {pq.isDuplicate && <span className="imp-badge-dup">JÁ EXISTE</span>}
                  <button className="imp-remove-btn" onClick={() => remove(pq.key)} aria-label="Remover">
                    <X size={16} />
                  </button>
                </div>
              )
            })}
            {included.length === 0 && (
              <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '12px 0' }}>
                Nenhuma pergunta selecionada.
              </p>
            )}
          </div>
        </div>

        <div className="imp-actions">
          <button className="imp-btn-cancel" onClick={reset}>Cancelar</button>
          <button
            className="imp-btn-confirm"
            onClick={handleConfirm}
            disabled={included.length === 0}
          >
            Importar {included.length > 0 ? `(${included.length})` : ''}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="imp-screen">
      <div className="imp-topbar">
        <span className="imp-topbar-title">Importar Perguntas</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      <div
        className="imp-upload-area"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
      >
        <Upload size={32} className="imp-upload-icon" />
        <span className="imp-upload-title">Clique ou arraste um arquivo JSON</span>
        <span className="imp-upload-sub">Limite de 2 MB</span>
      </div>

      {error && <div className="imp-error">{error}</div>}

      <div className="imp-hint">
        <p className="imp-hint-title">Formato esperado</p>
        <pre className="imp-hint-code">{HINT}</pre>
      </div>
    </div>
  )
}
