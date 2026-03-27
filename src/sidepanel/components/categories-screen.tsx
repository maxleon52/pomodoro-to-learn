import { Flame, Tag } from 'lucide-react'
import './categories-screen.css'

export default function CategoriesScreen() {
  return (
    <div className="categories-screen">
      <div className="topbar">
        <div className="brand">
          <Flame size={22} color="#FF6B6B" fill="#FF6B6B" />
          <span className="brand-name">PomodoLearn</span>
        </div>
      </div>

      <div className="screen-header">
        <h1 className="screen-title">Categorias</h1>
        <p className="screen-subtitle">Organize seus estudos por tema</p>
      </div>

      <div className="empty-state">
        <div className="empty-icon">
          <Tag size={40} color="#d1d5db" />
        </div>
        <p className="empty-title">Nenhuma categoria ainda</p>
        <p className="empty-body">Crie categorias para organizar suas perguntas de revisão.</p>
        <button className="btn-primary" disabled>
          + Nova categoria
        </button>
      </div>
    </div>
  )
}
