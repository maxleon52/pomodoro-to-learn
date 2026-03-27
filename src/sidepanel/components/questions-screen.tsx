import { useState } from 'react'
import { Search, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import './questions-screen.css'

interface Category {
  id: string
  name: string
  color: string
  emoji: string
}

interface Question {
  id: string
  categoryId: string
  question: string
  options: [string, string, string, string]
  correctAnswer: 'A' | 'B' | 'C' | 'D'
}

// TODO: receber do App.tsx quando o estado for elevado (lift state)
const CATEGORIES: Category[] = [
  { id: '1', name: 'Programação', color: '#FF6B6B', emoji: '💻' },
  { id: '2', name: 'Inglês',      color: '#6366F1', emoji: '🌍' },
  { id: '3', name: 'Entrevistas', color: '#22C55E', emoji: '🎓' },
]

const INITIAL_QUESTIONS: Question[] = [
  {
    id: '1',
    categoryId: '1',
    question: 'O que é uma closure em JavaScript?',
    options: [
      'Uma função com acesso ao escopo léxico externo',
      'Um objeto que agrupa dados e comportamentos',
      'Uma estrutura de loop assíncrono',
      'Um tipo especial de array',
    ],
    correctAnswer: 'A',
  },
  {
    id: '2',
    categoryId: '2',
    question: "What is the past tense of 'go'?",
    options: ['Goed', 'Went', 'Gone', 'Going'],
    correctAnswer: 'B',
  },
  {
    id: '3',
    categoryId: '3',
    question: 'Qual a diferença entre TCP e UDP?',
    options: [
      'TCP é orientado a conexão; UDP é sem conexão',
      'UDP é mais lento que TCP',
      'TCP não garante entrega; UDP garante',
      'Não há diferença prática',
    ],
    correctAnswer: 'A',
  },
]

const LETTERS = ['A', 'B', 'C', 'D'] as const

export default function QuestionsScreen() {
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [formQuestion, setFormQuestion] = useState('')
  const [formOptions, setFormOptions] = useState<[string, string, string, string]>(['', '', '', ''])
  const [formCorrect, setFormCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [formCategoryId, setFormCategoryId] = useState(CATEGORIES[0].id)

  const filtered = questions.filter(q =>
    q.question.toLowerCase().includes(search.toLowerCase())
  )

  function openNew() {
    setEditingId(null)
    setFormQuestion('')
    setFormOptions(['', '', '', ''])
    setFormCorrect('A')
    setFormCategoryId(CATEGORIES[0].id)
    setShowForm(true)
  }

  function openEdit(q: Question) {
    setEditingId(q.id)
    setFormQuestion(q.question)
    setFormOptions([...q.options] as [string, string, string, string])
    setFormCorrect(q.correctAnswer)
    setFormCategoryId(q.categoryId)
    setShowForm(true)
  }

  function handleSave() {
    if (!formQuestion.trim()) return
    if (editingId) {
      setQuestions(prev =>
        prev.map(q => q.id === editingId
          ? { ...q, question: formQuestion.trim(), options: formOptions, correctAnswer: formCorrect, categoryId: formCategoryId }
          : q
        )
      )
    } else {
      setQuestions(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          categoryId: formCategoryId,
          question: formQuestion.trim(),
          options: formOptions,
          correctAnswer: formCorrect,
        },
      ])
    }
    setShowForm(false)
  }

  function handleDelete(id: string) {
    setConfirmDeleteId(id)
  }

  function confirmDelete() {
    setQuestions(prev => prev.filter(q => q.id !== confirmDeleteId))
    setConfirmDeleteId(null)
  }

  function setOption(index: number, value: string) {
    const next = [...formOptions] as [string, string, string, string]
    next[index] = value
    setFormOptions(next)
  }

  function getCategoryById(id: string) {
    return CATEGORIES.find(c => c.id === id)
  }

  if (showForm) {
    return (
      <div className="q-screen">
        <div className="q-topbar">
          <button className="q-icon-btn" onClick={() => setShowForm(false)}>
            <ArrowLeft size={22} color="#1A1A1A" />
          </button>
          <span className="q-topbar-title">
            {editingId ? 'Editar Pergunta' : 'Nova Pergunta'}
          </span>
          <div className="q-icon-btn q-icon-btn--ghost" />
        </div>

        <div className="q-form">
          <div className="q-card">
            {/* Categoria */}
            <label className="q-field-label">Categoria</label>
            <div className="q-cat-row">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`q-cat-pill${formCategoryId === cat.id ? ' q-cat-pill--active' : ''}`}
                  style={formCategoryId === cat.id
                    ? { background: '#FF6B6B', color: '#fff', borderColor: '#FF6B6B' }
                    : {}
                  }
                  onClick={() => setFormCategoryId(cat.id)}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>

            {/* Pergunta */}
            <label className="q-field-label">Pergunta</label>
            <div className="q-input-wrap">
              <input
                className="q-input"
                placeholder="Ex: Qual a diferença entre let e const?"
                value={formQuestion}
                onChange={e => setFormQuestion(e.target.value)}
              />
            </div>

            {/* Opções */}
            <label className="q-field-label">Opções de Resposta</label>
            {LETTERS.map((letter, i) => {
              const isCorrect = formCorrect === letter
              return (
                <div key={letter} className="q-option-row">
                  <div
                    className="q-option-badge"
                    style={isCorrect ? { background: '#FF6B6B' } : {}}
                  >
                    <span style={{ color: isCorrect ? '#fff' : '#6B7280' }}>{letter}</span>
                  </div>
                  <div className="q-option-input-wrap">
                    <input
                      className="q-input"
                      placeholder={`Opção ${letter}`}
                      value={formOptions[i]}
                      onChange={e => setOption(i, e.target.value)}
                    />
                  </div>
                </div>
              )
            })}

            {/* Resposta correta */}
            <label className="q-field-label">Resposta Correta</label>
            <div className="q-correct-row">
              {LETTERS.map(letter => {
                const isSelected = formCorrect === letter
                return (
                  <button
                    key={letter}
                    className="q-correct-btn"
                    style={isSelected
                      ? { background: '#FF6B6B', color: '#fff', borderColor: '#FF6B6B' }
                      : {}
                    }
                    onClick={() => setFormCorrect(letter)}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="q-actions">
            <button className="q-btn-cancel" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
            <button
              className="q-btn-add"
              style={{ background: '#FF6B6B' }}
              onClick={handleSave}
              disabled={!formQuestion.trim()}
            >
              {editingId ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="q-screen">
      <div className="q-topbar">
        <div className="q-icon-btn q-icon-btn--ghost" />
        <span className="q-topbar-title">Perguntas</span>
        <button className="q-plus-btn" onClick={openNew}>
          <Plus size={18} color="#fff" />
        </button>
      </div>

      <div className="q-search">
        <Search size={16} color="#9CA3AF" />
        <input
          className="q-search-input"
          placeholder="Buscar pergunta..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <span className="q-count-label">
        {filtered.length} {filtered.length === 1 ? 'pergunta encontrada' : 'perguntas encontradas'}
      </span>

      <div className="q-list">
        {filtered.map(q => {
          const cat = getCategoryById(q.categoryId)
          return (
            <div key={q.id} className="q-item">
              <div className="q-item-top">
                {cat && (
                  <span
                    className="q-item-badge"
                    style={{ background: cat.color + '22', color: cat.color }}
                  >
                    {cat.emoji} {cat.name}
                  </span>
                )}
                <div className="q-item-actions">
                  <button className="q-action-btn" onClick={() => openEdit(q)}>
                    <Pencil size={15} color="#9CA3AF" />
                  </button>
                  <button className="q-action-btn" onClick={() => handleDelete(q.id)}>
                    <Trash2 size={15} color="#FF6B6B" />
                  </button>
                </div>
              </div>
              <p className="q-item-question">{q.question}</p>
              <p className="q-item-answer">
                <span className="q-item-answer-letter">{q.correctAnswer}.</span>{' '}
                {q.options[LETTERS.indexOf(q.correctAnswer)]}
              </p>
            </div>
          )
        })}
      </div>

      {confirmDeleteId !== null && (() => {
        const q = questions.find(x => x.id === confirmDeleteId)!
        return (
          <div className="q-dialog-backdrop">
            <div className="q-dialog">
              <p className="q-dialog-title">Excluir pergunta?</p>
              <p className="q-dialog-question">"{q.question}"</p>
              <p className="q-dialog-body">Essa ação não pode ser desfeita.</p>
              <div className="q-dialog-actions">
                <button className="q-btn-cancel" onClick={() => setConfirmDeleteId(null)}>
                  Cancelar
                </button>
                <button className="q-btn-delete" onClick={confirmDelete}>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
