import { useState, useEffect, useRef } from 'react'
import { Flame, LogIn, Send, CircleCheck, Zap } from 'lucide-react'
import './quiz-screen.css'

type Answer = 'A' | 'B' | 'C' | 'D'
const LABELS: Answer[] = ['A', 'B', 'C', 'D']
const QUESTION_TIME = 60 // segundos por pergunta

export interface QuizQuestion {
  id: string
  question: string
  options: [string, string, string, string]
  correctAnswer: Answer
}

interface QuizScreenProps {
  questions: QuizQuestion[]   // até 5 perguntas da rodada
  category: string
  onAnswered: (questionId: string) => void  // usuário respondeu → encerra rodada
  onRoundEnd: () => void                    // todas as perguntas expiraram → encerra rodada
}

interface QuizState {
  currentIndex: number
  selected: Answer | null
  confirmed: boolean
  timeLeft: number
}

export default function QuizScreen({ questions, category, onAnswered, onRoundEnd }: QuizScreenProps) {
  const [quiz, setQuiz] = useState<QuizState>({
    currentIndex: 0,
    selected: null,
    confirmed: false,
    timeLeft: QUESTION_TIME,
  })

  // Refs para evitar stale closures nos efeitos do timer
  const onRoundEndRef = useRef(onRoundEnd)
  const onAnsweredRef = useRef(onAnswered)
  const questionsLenRef = useRef(questions.length)
  useEffect(() => { onRoundEndRef.current = onRoundEnd }, [onRoundEnd])
  useEffect(() => { onAnsweredRef.current = onAnswered }, [onAnswered])
  useEffect(() => { questionsLenRef.current = questions.length }, [questions.length])

  // Countdown — reinicia quando muda de pergunta ou quando é confirmada
  useEffect(() => {
    if (quiz.confirmed) return
    const id = setInterval(() => {
      setQuiz(prev => {
        if (prev.confirmed) return prev
        return { ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [quiz.currentIndex, quiz.confirmed])

  // Quando o tempo esgota: avança para a próxima pergunta ou encerra a rodada
  useEffect(() => {
    if (quiz.timeLeft > 0 || quiz.confirmed) return
    const next = quiz.currentIndex + 1
    if (next < questionsLenRef.current) {
      setQuiz({ currentIndex: next, selected: null, confirmed: false, timeLeft: QUESTION_TIME })
    } else {
      onRoundEndRef.current()
    }
  }, [quiz.timeLeft, quiz.confirmed, quiz.currentIndex])

  const currentQuestion = questions[quiz.currentIndex]

  function handleConfirm() {
    if (!quiz.selected) return
    if (quiz.confirmed) {
      onAnsweredRef.current(currentQuestion.id)
      // Avança para a próxima pergunta da rodada ou encerra se for a última
      const next = quiz.currentIndex + 1
      if (next < questionsLenRef.current) {
        setQuiz({ currentIndex: next, selected: null, confirmed: false, timeLeft: QUESTION_TIME })
      } else {
        onRoundEndRef.current()
      }
      return
    }
    setQuiz(prev => ({ ...prev, confirmed: true }))
  }

  function optClass(letter: Answer) {
    if (!quiz.confirmed) return `quiz-opt${quiz.selected === letter ? ' quiz-opt--selected' : ''}`
    if (letter === currentQuestion.correctAnswer) return 'quiz-opt quiz-opt--correct'
    if (letter === quiz.selected) return 'quiz-opt quiz-opt--wrong'
    return 'quiz-opt'
  }

  function badgeClass(letter: Answer) {
    if (!quiz.confirmed) return `quiz-badge${quiz.selected === letter ? ' quiz-badge--on' : ''}`
    if (letter === currentQuestion.correctAnswer) return 'quiz-badge quiz-badge--on'
    if (letter === quiz.selected) return 'quiz-badge quiz-badge--on'
    return 'quiz-badge'
  }

  const mm = Math.floor(quiz.timeLeft / 60).toString().padStart(2, '0')
  const ss = (quiz.timeLeft % 60).toString().padStart(2, '0')

  return (
    <div className="quiz-screen">
      {/* Topbar */}
      <div className="quiz-topbar">
        <div className="quiz-brand">
          <Flame size={22} color="#FF6B6B" fill="#FF6B6B" />
          <span className="quiz-brand-name">PomodoLearn</span>
        </div>
        <button className="quiz-login-btn" aria-label="Entrar" disabled title="Em breve">
          <LogIn size={16} color="#6B7280" />
          <span>Entrar</span>
        </button>
      </div>

      {/* Resumo da sessão encerrada + countdown da pergunta */}
      <div className="quiz-mini-row">
        <div className="quiz-mini-ring">
          <span className="quiz-mini-time">{mm}:{ss}</span>
        </div>
        <div className="quiz-mini-text">
          <span className="quiz-mini-title">Sessão encerrada</span>
          <span className="quiz-mini-sub">Responda para continuar</span>
        </div>
        <CircleCheck size={20} color="#FF6B6B" />
      </div>

      {/* Progresso da rodada */}
      <div className="quiz-progress">
        <span className="quiz-progress-label">
          Pergunta {quiz.currentIndex + 1} de {questions.length}
        </span>
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

        <p className="quiz-question">{currentQuestion.question}</p>

        <div className="quiz-opts">
          {LABELS.map((letter, i) => (
            <button
              key={letter}
              className={optClass(letter)}
              onClick={() => !quiz.confirmed && setQuiz(prev => ({ ...prev, selected: letter }))}
            >
              <span className={badgeClass(letter)}>{letter}</span>
              <span className="quiz-opt-text">{currentQuestion.options[i]}</span>
            </button>
          ))}
        </div>

        <div className="quiz-divider" />

        <button
          className="quiz-submit"
          onClick={handleConfirm}
          disabled={!quiz.selected}
        >
          <Send size={16} color="#FFFFFF" />
          <span>{quiz.confirmed ? 'Continuar' : 'Confirmar Resposta'}</span>
        </button>
      </div>
    </div>
  )
}
