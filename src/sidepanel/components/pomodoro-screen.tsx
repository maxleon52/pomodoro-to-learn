import { useState } from 'react'
import { Search, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import type { Category, Question, Pomodoro } from '../../shared/types'
import './pomodoro-screen.css'

interface PomodoroScreenProps {
  categories: Category[]
  questions: Question[]
  pomodoros: Pomodoro[]
  onAdd: (p: Omit<Pomodoro, 'id'>) => void
  onEdit: (p: Pomodoro) => void
  onDelete: (id: string) => void
}

export default function PomodoroScreen({ categories, questions, pomodoros, onAdd, onEdit, onDelete }: PomodoroScreenProps) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formCategoryId, setFormCategoryId] = useState(categories[0]?.id ?? '')
  const [formQuestionIds, setFormQuestionIds] = useState<string[]>([])
  const [formSearch, setFormSearch] = useState('')
  const [formDuration, setFormDuration] = useState(25)

  const filtered = pomodoros.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const formQuestions = questions.filter(
    q => q.categoryId === formCategoryId &&
         q.question.toLowerCase().includes(formSearch.toLowerCase())
  )

  function openNew() {
    setEditingId(null)
    setFormName('')
    setFormCategoryId(categories[0]?.id ?? '')
    setFormQuestionIds([])
    setFormSearch('')
    setFormDuration(25)
    setShowForm(true)
  }

  function openEdit(p: Pomodoro) {
    setEditingId(p.id)
    setFormName(p.name)
    setFormCategoryId(p.categoryId)
    setFormQuestionIds([...p.questionIds])
    setFormSearch('')
    setFormDuration(p.duration ?? 25)
    setShowForm(true)
  }

  function handleSave() {
    if (!formName.trim()) return
    if (editingId) {
      onEdit({ id: editingId, name: formName.trim(), categoryId: formCategoryId, questionIds: formQuestionIds, duration: formDuration })
    } else {
      onAdd({ name: formName.trim(), categoryId: formCategoryId, questionIds: formQuestionIds, duration: formDuration })
    }
    setShowForm(false)
  }

  function confirmDelete() {
    if (confirmDeleteId) onDelete(confirmDeleteId)
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
    return categories.find(c => c.id === id)
  }

  if (showForm) {
    const allVisibleSelected =
      formQuestions.length > 0 &&
      formQuestions.every(q => formQuestionIds.includes(q.id))

    return (
      <div className="pm-screen pm-screen--form">
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
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`pm-cat-pill${formCategoryId === cat.id ? ' pm-cat-pill--active' : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>

            {/* Duração */}
            <label className="pm-field-label">Duração da sessão</label>
            <div className="pm-duration-row">
              <button
                className="pm-duration-btn"
                onClick={() => setFormDuration(prev => Math.max(5, prev - 5))}
                disabled={formDuration <= 5}
              >
                −
              </button>
              <span className="pm-duration-value">{formDuration} min</span>
              <button
                className="pm-duration-btn"
                onClick={() => setFormDuration(prev => prev + 5)}
              >
                +
              </button>
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
              disabled={!formName.trim() || formQuestionIds.length === 0}
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
                <button className="pm-action-btn" onClick={() => setConfirmDeleteId(p.id)}>
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
