import { useState } from 'react'
import { Search, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import './pomodoro-screen.css'

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
}

interface Pomodoro {
  id: string
  name: string
  categoryId: string
  questionIds: string[]
}

// TODO: receber do App.tsx quando o estado for elevado (lift state)
const CATEGORIES: Category[] = [
  { id: '1', name: 'Programação', color: '#FF6B6B', emoji: '💻' },
  { id: '2', name: 'Inglês',      color: '#6366F1', emoji: '🌍' },
  { id: '3', name: 'Entrevistas', color: '#22C55E', emoji: '🎓' },
]

const ALL_QUESTIONS: Question[] = [
  { id: '1', categoryId: '1', question: 'O que é uma closure em JavaScript?' },
  { id: '2', categoryId: '2', question: "What is the past tense of 'go'?" },
  { id: '3', categoryId: '3', question: 'Qual a diferença entre TCP e UDP?' },
  { id: '4', categoryId: '1', question: 'O que é uma Promise em JavaScript?' },
  { id: '5', categoryId: '2', question: "How do you use 'despite' in a sentence?" },
]

const INITIAL_POMODOROS: Pomodoro[] = [
  { id: '1', name: 'Estudar Inglês',       categoryId: '2', questionIds: ['2', '5'] },
  { id: '2', name: 'Treinar Entrevistas',  categoryId: '3', questionIds: ['3'] },
  { id: '3', name: 'Revisão Programação',  categoryId: '1', questionIds: ['1', '4'] },
]

export default function PomodoroScreen() {
  const [pomodoros, setPomodoros] = useState<Pomodoro[]>(INITIAL_POMODOROS)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formCategoryId, setFormCategoryId] = useState(CATEGORIES[0].id)
  const [formQuestionIds, setFormQuestionIds] = useState<string[]>([])
  const [formSearch, setFormSearch] = useState('')

  const filtered = pomodoros.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const formQuestions = ALL_QUESTIONS.filter(
    q => q.categoryId === formCategoryId &&
         q.question.toLowerCase().includes(formSearch.toLowerCase())
  )

  function openNew() {
    setEditingId(null)
    setFormName('')
    setFormCategoryId(CATEGORIES[0].id)
    setFormQuestionIds([])
    setFormSearch('')
    setShowForm(true)
  }

  function openEdit(p: Pomodoro) {
    setEditingId(p.id)
    setFormName(p.name)
    setFormCategoryId(p.categoryId)
    setFormQuestionIds([...p.questionIds])
    setFormSearch('')
    setShowForm(true)
  }

  function handleSave() {
    if (!formName.trim()) return
    if (editingId) {
      setPomodoros(prev =>
        prev.map(p => p.id === editingId
          ? { ...p, name: formName.trim(), categoryId: formCategoryId, questionIds: formQuestionIds }
          : p
        )
      )
    } else {
      setPomodoros(prev => [
        ...prev,
        { id: Date.now().toString(), name: formName.trim(), categoryId: formCategoryId, questionIds: formQuestionIds },
      ])
    }
    setShowForm(false)
  }

  function handleDelete(id: string) {
    setConfirmDeleteId(id)
  }

  function confirmDelete() {
    setPomodoros(prev => prev.filter(p => p.id !== confirmDeleteId))
    setConfirmDeleteId(null)
  }

  function toggleQuestion(id: string) {
    setFormQuestionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function toggleAll() {
    const ids = formQuestions.map(q => q.id)
    const allSelected = ids.every(id => formQuestionIds.includes(id))
    if (allSelected) {
      setFormQuestionIds(prev => prev.filter(id => !ids.includes(id)))
    } else {
      setFormQuestionIds(prev => [...new Set([...prev, ...ids])])
    }
  }

  function handleCategoryChange(catId: string) {
    setFormCategoryId(catId)
    setFormQuestionIds([])
    setFormSearch('')
  }

  function getCategoryById(id: string) {
    return CATEGORIES.find(c => c.id === id)
  }

  if (showForm) {
    const allVisibleSelected =
      formQuestions.length > 0 &&
      formQuestions.every(q => formQuestionIds.includes(q.id))

    return (
      <div className="pm-screen">
        <div className="pm-topbar">
          <button className="pm-icon-btn" onClick={() => setShowForm(false)}>
            <ArrowLeft size={22} color="#1A1A1A" />
          </button>
          <span className="pm-topbar-title">
            {editingId ? 'Editar Pomodoro' : 'Novo Pomodoro'}
          </span>
          <div className="pm-icon-btn pm-icon-btn--ghost" />
        </div>

        <div className="pm-form">
          {/* Nome */}
          <div className="pm-card">
            <label className="pm-field-label">Nome</label>
            <div className="pm-input-wrap">
              <input
                className="pm-input"
                placeholder="Ex: Estudar Inglês"
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
            </div>

            {/* Categoria */}
            <label className="pm-field-label">Categoria</label>
            <div className="pm-cat-row">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`pm-cat-pill${formCategoryId === cat.id ? ' pm-cat-pill--active' : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Perguntas */}
          <div className="pm-card pm-card--grow">
            <div className="pm-q-header">
              <span className="pm-field-label">Perguntas</span>
              <button className="pm-sel-all" onClick={toggleAll}>
                <span className="pm-sel-all-label">Selecionar todas</span>
                <span className={`pm-checkbox${allVisibleSelected ? ' pm-checkbox--checked' : ''}`} />
              </button>
            </div>

            <div className="pm-q-search">
              <Search size={14} color="#9CA3AF" />
              <input
                className="pm-q-search-input"
                placeholder="Buscar pergunta..."
                value={formSearch}
                onChange={e => setFormSearch(e.target.value)}
              />
            </div>

            <div className="pm-q-list">
              {formQuestions.length === 0 && (
                <p className="pm-q-empty">Nenhuma pergunta nessa categoria.</p>
              )}
              {formQuestions.map(q => {
                const checked = formQuestionIds.includes(q.id)
                return (
                  <button
                    key={q.id}
                    className="pm-q-row"
                    onClick={() => toggleQuestion(q.id)}
                  >
                    <span className={`pm-checkbox${checked ? ' pm-checkbox--checked' : ''}`} />
                    <span className="pm-q-text">{q.question}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pm-actions">
            <button className="pm-btn-cancel" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
            <button
              className="pm-btn-add"
              onClick={handleSave}
              disabled={!formName.trim()}
            >
              {editingId ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pm-screen">
      <div className="pm-topbar">
        <div className="pm-icon-btn pm-icon-btn--ghost" />
        <span className="pm-topbar-title">Pomodoros</span>
        <button className="pm-plus-btn" onClick={openNew}>
          <Plus size={18} color="#fff" />
        </button>
      </div>

      <div className="pm-search">
        <Search size={16} color="#9CA3AF" />
        <input
          className="pm-search-input"
          placeholder="Buscar pomodoro..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <span className="pm-count-label">
        {filtered.length} {filtered.length === 1 ? 'pomodoro encontrado' : 'pomodoros encontrados'}
      </span>

      <div className="pm-list">
        {filtered.map(p => {
          const cat = getCategoryById(p.categoryId)
          return (
            <div key={p.id} className="pm-item">
              <div className="pm-item-icon" style={{ background: cat?.color ?? '#9CA3AF' }}>
                <span>{cat?.emoji ?? '📋'}</span>
              </div>
              <div className="pm-item-text">
                <span className="pm-item-name">{p.name}</span>
                <span className="pm-item-sub">{p.questionIds.length} perguntas</span>
              </div>
              <div className="pm-item-actions">
                <button className="pm-action-btn" onClick={() => openEdit(p)}>
                  <Pencil size={16} color="#9CA3AF" />
                </button>
                <button className="pm-action-btn" onClick={() => handleDelete(p.id)}>
                  <Trash2 size={16} color="#FF6B6B" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {confirmDeleteId !== null && (() => {
        const p = pomodoros.find(x => x.id === confirmDeleteId)!
        const cat = getCategoryById(p.categoryId)
        return (
          <div className="pm-dialog-backdrop">
            <div className="pm-dialog">
              <div className="pm-dialog-icon" style={{ background: cat?.color ?? '#9CA3AF' }}>
                {cat?.emoji ?? '📋'}
              </div>
              <p className="pm-dialog-title">Excluir "{p.name}"?</p>
              <p className="pm-dialog-body">Essa ação não pode ser desfeita.</p>
              <div className="pm-dialog-actions">
                <button className="pm-btn-cancel" onClick={() => setConfirmDeleteId(null)}>
                  Cancelar
                </button>
                <button className="pm-btn-delete" onClick={confirmDelete}>
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
