import { useState } from 'react'
import { Search, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import type { Category, Question } from '../../shared/types'
import './questions-screen.css'

const LETTERS = ['A', 'B', 'C', 'D'] as const

interface QuestionsScreenProps {
  categories: Category[]
  questions: Question[]
  onAdd: (q: Omit<Question, 'id'>) => void
  onEdit: (q: Question) => void
  onDelete: (id: string) => void
}

export default function QuestionsScreen({ categories, questions, onAdd, onEdit, onDelete }: QuestionsScreenProps) {
  const [search, setSearch] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [formQuestion, setFormQuestion] = useState('')
  const [formOptions, setFormOptions] = useState<[string, string, string, string]>(['', '', '', ''])
  const [formCorrect, setFormCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [formCategoryId, setFormCategoryId] = useState(categories[0]?.id ?? '')
  const [formDifficulty, setFormDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  const filtered = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = filterCategoryId ? q.categoryId === filterCategoryId : true
    return matchesSearch && matchesCategory
  })

  function openNew() {
    setEditingId(null)
    setFormQuestion('')
    setFormOptions(['', '', '', ''])
    setFormCorrect('A')
    setFormCategoryId(categories[0]?.id ?? '')
    setFormDifficulty('medium')
    setShowForm(true)
  }

  function openEdit(q: Question) {
    setEditingId(q.id)
    setFormQuestion(q.question)
    setFormOptions([...q.options] as [string, string, string, string])
    setFormCorrect(q.correctAnswer)
    setFormCategoryId(q.categoryId)
    setFormDifficulty(q.difficulty ?? 'medium')
    setShowForm(true)
  }

  function handleSave() {
    if (!formQuestion.trim()) return
    if (editingId) {
      onEdit({ id: editingId, categoryId: formCategoryId, question: formQuestion.trim(), options: formOptions, correctAnswer: formCorrect, difficulty: formDifficulty })
    } else {
      onAdd({ categoryId: formCategoryId, question: formQuestion.trim(), options: formOptions, correctAnswer: formCorrect, difficulty: formDifficulty })
    }
    setShowForm(false)
  }

  function confirmDelete() {
    if (confirmDeleteId) onDelete(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  function setOption(index: number, value: string) {
    const next = [...formOptions] as [string, string, string, string]
    next[index] = value
    setFormOptions(next)
  }

  function getCategoryById(id: string) {
    return categories.find(c => c.id === id)
  }

  if (showForm) {
    return (
      <div className="q-screen">
        <div className="q-sticky-header">
          <div className="q-topbar">
            <button className="q-icon-btn" onClick={() => setShowForm(false)}>
              <ArrowLeft size={22} color="#1A1A1A" />
            </button>
            <span className="q-topbar-title">
              {editingId ? 'Editar Pergunta' : 'Nova Pergunta'}
            </span>
            <div className="q-icon-btn q-icon-btn--ghost" />
          </div>
        </div>

        <div className="q-form">
          <div className="q-card">
            {/* Categoria */}
            <label className="q-field-label">Categoria</label>
            <div className="q-cat-row">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`q-cat-pill${formCategoryId === cat.id ? ' q-cat-pill--active' : ''}`}
                  style={formCategoryId === cat.id
                    ? { background: cat.color, color: '#fff', borderColor: cat.color }
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

            {/* Dificuldade */}
            <label className="q-field-label">Dificuldade</label>
            <div className="q-diff-row">
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <button
                  key={d}
                  className={`q-diff-btn q-diff-btn--${d}${formDifficulty === d ? ' q-diff-btn--active' : ''}`}
                  onClick={() => setFormDifficulty(d)}
                >
                  {d === 'easy' ? 'Fácil' : d === 'medium' ? 'Médio' : 'Difícil'}
                </button>
              ))}
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
      {/* Cabeçalho fixo */}
      <div className="q-sticky-header">
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

        {/* Filtro por categoria */}
        {categories.length > 0 && (
          <div className="q-filter-row">
            {categories.map(cat => {
              const active = filterCategoryId === cat.id
              return (
                <button
                  key={cat.id}
                  className={`q-filter-pill${active ? ' q-filter-pill--active' : ''}`}
                  style={active ? { background: cat.color } : {}}
                  onClick={() => setFilterCategoryId(active ? null : cat.id)}
                >
                  {cat.emoji} {cat.name}
                </button>
              )
            })}
          </div>
        )}

        <span className="q-count-label">
          {filtered.length} {filtered.length === 1 ? 'pergunta encontrada' : 'perguntas encontradas'}
        </span>
      </div>

      {/* Lista com scroll */}
      <div className="q-list">
        {filtered.map(q => {
          const cat = getCategoryById(q.categoryId)
          return (
            <div key={q.id} className="q-item">
              <div className="q-item-top">
                <div className="q-item-badges">
                  {cat && (
                    <span
                      className="q-item-badge"
                      style={{ background: cat.color + '22', color: cat.color }}
                    >
                      {cat.emoji} {cat.name}
                    </span>
                  )}
                  {q.difficulty && (
                    <span className={`q-diff-badge q-diff-badge--${q.difficulty}`}>
                      {q.difficulty === 'easy' ? 'Fácil' : q.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                    </span>
                  )}
                </div>
                <div className="q-item-actions">
                  <button className="q-action-btn" onClick={() => openEdit(q)}>
                    <Pencil size={15} color="#9CA3AF" />
                  </button>
                  <button className="q-action-btn" onClick={() => setConfirmDeleteId(q.id)}>
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
