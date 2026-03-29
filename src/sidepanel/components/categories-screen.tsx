import { useState } from 'react'
import { Search, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import type { Category, Question } from '../../shared/types'
import './categories-screen.css'

const COLORS = [
  '#FF6B6B', '#FF9F40', '#FFD166', '#06D6A0', '#118AB2',
  '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#3B82F6',
  '#EF4444', '#22C55E', '#F59E0B', '#0EA5E9', '#84CC16',
]

const EMOJIS = [
  '🎯', '📚', '💡', '🔥', '🚀',
  '💻', '🌍', '🎓', '💪',
  '⚡', '🎵', '🏆', '🔑', '📝', '✨',
]

interface CategoriesScreenProps {
  categories: Category[]
  questions: Question[]
  onAdd: (cat: Omit<Category, 'id'>) => void
  onEdit: (cat: Category) => void
  onDelete: (id: string) => void
}

export default function CategoriesScreen({ categories, questions, onAdd, onEdit, onDelete }: CategoriesScreenProps) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [formName,  setFormName]  = useState('')
  const [formColor, setFormColor] = useState(COLORS[0])
  const [formEmoji, setFormEmoji] = useState(EMOJIS[0])

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  function openNew() {
    setEditingId(null)
    setFormName('')
    setFormColor(COLORS[0])
    setFormEmoji(EMOJIS[0])
    setShowForm(true)
  }

  function openEdit(cat: Category) {
    setEditingId(cat.id)
    setFormName(cat.name)
    setFormColor(cat.color)
    setFormEmoji(cat.emoji)
    setShowForm(true)
  }

  function handleSave() {
    if (!formName.trim()) return
    if (editingId) {
      onEdit({ id: editingId, name: formName.trim(), color: formColor, emoji: formEmoji })
    } else {
      onAdd({ name: formName.trim(), color: formColor, emoji: formEmoji })
    }
    setShowForm(false)
  }

  function confirmDelete() {
    if (confirmDeleteId) onDelete(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  if (showForm) {
    return (
      <div className="cat-screen">
        <div className="cat-topbar">
          <button className="cat-icon-btn" onClick={() => setShowForm(false)}>
            <ArrowLeft size={22} color="#1A1A1A" />
          </button>
          <span className="cat-topbar-title">
            {editingId ? 'Editar Categoria' : 'Nova Categoria'}
          </span>
          <div className="cat-icon-btn cat-icon-btn--ghost" />
        </div>

        <div className="cat-form">
          <div className="cat-card">
            <label className="cat-field-label">Categoria</label>
            <div className="cat-input-wrap">
              <input
                className="cat-input"
                placeholder="Nova categoria..."
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
            </div>
          </div>

          <div className="cat-card">
            <label className="cat-field-label">Cor</label>
            <div className="cat-color-grid">
              {COLORS.map(color => (
                <button
                  key={color}
                  className={`cat-color-swatch${formColor === color ? ' cat-color-swatch--active' : ''}`}
                  style={{ background: color }}
                  onClick={() => setFormColor(color)}
                />
              ))}
            </div>
            <div className="cat-hex-chip">
              <span className="cat-hex-dot" style={{ background: formColor }} />
              <span className="cat-hex-text">{formColor}</span>
            </div>
          </div>

          <div className="cat-card">
            <label className="cat-field-label">Emoji</label>
            <div className="cat-emoji-grid">
              {EMOJIS.map(em => (
                <button
                  key={em}
                  className={`cat-emoji-btn${formEmoji === em ? ' cat-emoji-btn--active' : ''}`}
                  style={formEmoji === em ? { background: formColor + '22' } : {}}
                  onClick={() => setFormEmoji(em)}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="cat-actions">
            <button className="cat-btn-cancel" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
            <button
              className="cat-btn-add"
              style={{ background: formColor }}
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
    <div className="cat-screen">
      <div className="cat-topbar">
        <div className="cat-icon-btn cat-icon-btn--ghost" />
        <span className="cat-topbar-title">Categorias</span>
        <button className="cat-plus-btn" onClick={openNew}>
          <Plus size={18} color="#fff" />
        </button>
      </div>

      <div className="cat-search">
        <Search size={16} color="#9CA3AF" />
        <input
          className="cat-search-input"
          placeholder="Buscar categoria..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <span className="cat-count-label">
        {filtered.length} {filtered.length === 1 ? 'categoria encontrada' : 'categorias encontradas'}
      </span>

      <div className="cat-list">
        {filtered.map(cat => {
          const count = questions.filter(q => q.categoryId === cat.id).length
          return (
            <div key={cat.id} className="cat-item">
              <div className="cat-item-icon" style={{ background: cat.color }}>
                <span>{cat.emoji}</span>
              </div>
              <div className="cat-item-text">
                <span className="cat-item-name">{cat.name}</span>
                <span className="cat-item-sub">{count} {count === 1 ? 'pergunta' : 'perguntas'}</span>
              </div>
              <div className="cat-item-actions">
                <button className="cat-action-btn" onClick={() => openEdit(cat)}>
                  <Pencil size={16} color="#9CA3AF" />
                </button>
                <button className="cat-action-btn" onClick={() => setConfirmDeleteId(cat.id)}>
                  <Trash2 size={16} color="#FF6B6B" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {confirmDeleteId !== null && (() => {
        const cat = categories.find(c => c.id === confirmDeleteId)!
        return (
          <div className="cat-dialog-backdrop">
            <div className="cat-dialog">
              <div className="cat-dialog-icon" style={{ background: cat.color }}>
                {cat.emoji}
              </div>
              <p className="cat-dialog-title">Excluir "{cat.name}"?</p>
              <p className="cat-dialog-body">
                As perguntas dessa categoria serão movidas para{' '}
                <strong>Sem categoria</strong>.
              </p>
              <div className="cat-dialog-actions">
                <button className="cat-btn-cancel" onClick={() => setConfirmDeleteId(null)}>
                  Cancelar
                </button>
                <button className="cat-btn-delete" onClick={confirmDelete}>
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
