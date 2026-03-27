import { useState } from 'react'
import { Flame, Settings2, Send, CircleCheck, Zap } from 'lucide-react'
import './quiz-screen.css'

type Answer = 'A' | 'B' | 'C' | 'D'

interface QuizScreenProps {
  question: string
  options: [string, string, string, string]
  correctAnswer: Answer
  category: string
  onDone: () => void
}

const LABELS: Answer[] = ['A', 'B', 'C', 'D']

export default function QuizScreen({
  question,
  options,
  correctAnswer,
  category,
  onDone,
}: QuizScreenProps) {
  const [selected, setSelected] = useState<Answer | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  function handleConfirm() {
    if (!selected) return
    if (confirmed) { onDone(); return }
    setConfirmed(true)
  }

  function optClass(letter: Answer) {
    if (!confirmed) return `quiz-opt${selected === letter ? ' quiz-opt--selected' : ''}`
    if (letter === correctAnswer) return 'quiz-opt quiz-opt--correct'
    if (letter === selected) return 'quiz-opt quiz-opt--wrong'
    return 'quiz-opt'
  }

  function badgeClass(letter: Answer) {
    if (!confirmed) return `quiz-badge${selected === letter ? ' quiz-badge--on' : ''}`
    if (letter === correctAnswer) return 'quiz-badge quiz-badge--on'
    if (letter === selected) return 'quiz-badge quiz-badge--on'
    return 'quiz-badge'
  }

  return (
    <div className="quiz-screen">
      {/* Topbar */}
      <div className="quiz-topbar">
        <div className="quiz-brand">
          <Flame size={22} color="#FF6B6B" fill="#FF6B6B" />
          <span className="quiz-brand-name">PomodoLearn</span>
        </div>
        <button className="quiz-settings-btn" aria-label="Definições">
          <Settings2 size={18} color="#6B7280" />
        </button>
      </div>

      {/* Resumo da sessão encerrada */}
      <div className="quiz-mini-row">
        <div className="quiz-mini-ring">
          <span className="quiz-mini-time">00:00</span>
        </div>
        <div className="quiz-mini-text">
          <span className="quiz-mini-title">Sessão encerrada</span>
          <span className="quiz-mini-sub">Responda para continuar</span>
        </div>
        <CircleCheck size={20} color="#FF6B6B" />
      </div>

      {/* Card da questão */}
      <div className="quiz-card">
        <div className="quiz-card-top">
          <span className="quiz-card-label">Hora de responder</span>
          <div className="quiz-cat-badge">
            <Zap size={11} color="#FF6B6B" fill="#FF6B6B" />
            <span>{category}</span>
          </div>
        </div>

        <p className="quiz-question">{question}</p>

        <div className="quiz-opts">
          {LABELS.map((letter, i) => (
            <button
              key={letter}
              className={optClass(letter)}
              onClick={() => !confirmed && setSelected(letter)}
            >
              <span className={badgeClass(letter)}>{letter}</span>
              <span className="quiz-opt-text">{options[i]}</span>
            </button>
          ))}
        </div>

        <div className="quiz-divider" />

        <button
          className="quiz-submit"
          onClick={handleConfirm}
          disabled={!selected}
        >
          <Send size={16} color="#FFFFFF" />
          <span>{confirmed ? 'Continuar' : 'Confirmar Resposta'}</span>
        </button>
      </div>
    </div>
  )
}
