import { Flame, BookOpen } from 'lucide-react'
import './questions-screen.css'

export default function QuestionsScreen() {
  return (
    <div className="questions-screen">
      <div className="topbar">
        <div className="brand">
          <Flame size={22} color="#FF6B6B" fill="#FF6B6B" />
          <span className="brand-name">PomodoLearn</span>
        </div>
      </div>

      <div className="screen-header">
        <h1 className="screen-title">Perguntas</h1>
        <p className="screen-subtitle">Seus flashcards de revisão</p>
      </div>

      <div className="empty-state">
        <div className="empty-icon">
          <BookOpen size={40} color="#d1d5db" />
        </div>
        <p className="empty-title">Nenhuma pergunta ainda</p>
        <p className="empty-body">Adicione perguntas para revisar ao final de cada sessão Pomodoro.</p>
        <button className="btn-primary" disabled>
          + Nova pergunta
        </button>
      </div>
    </div>
  )
}
