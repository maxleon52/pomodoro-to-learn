import { Flame, LogIn, ChevronLeft, ChevronRight, Play, Pause, Zap, RotateCcw, CheckCircle } from 'lucide-react'
import './timer-screen.css'

// Raio do círculo de progresso em pixels.
// O SVG tem 280x280; os círculos internos têm 240px de diâmetro com 18px de traço.
// Raio do centro do traço = (240 / 2) - (18 / 2) = 111
const RADIUS = 111

// Comprimento total da circunferência — usado para animar o arco de progresso.
// A técnica: stroke-dasharray = comprimento total; stroke-dashoffset = quanto "esconder".
// Com offset = 0, o arco está completo. Com offset = CIRCUMFERENCE, o arco está vazio.
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Props recebidas pelo componente — todas vêm do App.tsx.
// O componente é puramente visual: não sabe nada de timers, só recebe valores e callbacks.
interface TimerScreenProps {
  timeLeft: number         // segundos restantes
  totalTime: number        // duração total da sessão em segundos
  isRunning: boolean       // true = a contar; false = pausado/parado
  phase: string            // texto da fase atual, ex: "Foco"
  hasStarted: boolean      // true quando o timer já iniciou (mostra botões reset/finish)
  ready: boolean           // true quando os dados iniciais (storage + worker) já carregaram
  category: string         // nome da categoria de estudo actualmente seleccionada
  pomodoroName: string     // nome do pomodoro seleccionado
  questions: string[]      // perguntas ainda não respondidas (só o enunciado)
  isCompleted: boolean     // true quando todas as perguntas do pomodoro foram respondidas
  showConfirm: boolean     // quando true exibe o diálogo de confirmação de troca de pomodoro
  pomodoroCount: number    // total de pomodoros criados (0 = empty state)
  pomodoroIndex: number    // índice do pomodoro activo (base 0)
  onPlay: () => void           // play / pause
  onReset: () => void          // reinicia a sessão
  onFinish: () => void         // força o fim da sessão (vai para o quiz)
  onPrevCategory: () => void   // navega para a categoria anterior
  onNextCategory: () => void   // navega para a categoria seguinte
  onConfirmSwitch: () => void   // confirma a troca de pomodoro (reinicia o timer)
  onCancelSwitch: () => void    // cancela a troca de pomodoro
  onRestartPomodoro: () => void // reinicia o progresso do pomodoro (limpa perguntas respondidas)
}

export default function TimerScreen({
  timeLeft,
  totalTime,
  isRunning,
  phase,
  hasStarted,
  ready,
  category,
  pomodoroName,
  questions,
  isCompleted,
  showConfirm,
  pomodoroCount,
  pomodoroIndex,
  onPlay,
  onReset,
  onFinish,
  onPrevCategory,
  onNextCategory,
  onConfirmSwitch,
  onCancelSwitch,
  onRestartPomodoro,
}: TimerScreenProps) {
  // Percentagem de tempo restante (0 a 1).
  // Protege divisão por zero quando totalTime ainda não está definido.
  const progress = totalTime > 0 ? Math.min(1, Math.max(0, timeLeft / totalTime)) : 1

  // Quanto do arco SVG deve ficar "escondido" para representar o progresso.
  // offset = 0 → arco completo (início da sessão)
  // offset = CIRCUMFERENCE → arco vazio (sessão terminada)
  const offset = CIRCUMFERENCE * (1 - progress)

  // Formata os segundos em MM:SS com zeros à esquerda (ex: 4 → "04")
  const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const ss = (timeLeft % 60).toString().padStart(2, '0')

  return (
    <div className="timer-screen">
      {/* Barra superior: logótipo + botão de definições */}
      <div className="topbar">
        <div className="brand">
          <Flame size={22} color="#FF6B6B" fill="#FF6B6B" />
          <span className="brand-name">PomodoLearn</span>
        </div>
        <button className="login-btn" aria-label="Entrar" disabled title="Em breve">
          <LogIn size={16} color="#6B7280" />
          <span>Entrar</span>
        </button>
      </div>

      {/* Secção do temporizador circular */}
      {/* O SVG fica posicionado de forma absoluta; o timer-inner sobrepõe-se ao centro */}
      <div className="timer-section">
        <svg width="280" height="280" className="timer-svg" aria-hidden="true">
          {/* Anel exterior de brilho — efeito decorativo, baixa opacidade */}
          <circle cx="140" cy="140" r="124" fill="none" stroke="#FF6B6B" strokeWidth="32" strokeOpacity="0.05" />

          {/* Pista cinzenta — fundo do arco de progresso */}
          <circle cx="140" cy="140" r={RADIUS} fill="none" stroke="#EBEBEB" strokeWidth="18" />

          {/* Arco de progresso vermelho
              - rotate(-90): faz o arco começar no topo (12h) em vez da direita (3h)
              - stroke-dashoffset anima suavemente com transition 1s linear */}
          <circle
            cx="140" cy="140" r={RADIUS}
            fill="none"
            stroke="#FF6B6B"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 140 140)"
            style={{ filter: 'drop-shadow(0 0 8px rgba(255,107,107,0.4))', transition: ready ? 'stroke-dashoffset 1s linear' : 'none' }}
          />
        </svg>

        {/* Texto do tempo e fase, sobreposto ao centro do SVG */}
        <div className="timer-inner">
          <span className="timer-display">{mm}:{ss}</span>
          <span className="timer-phase">{phase}</span>
        </div>
      </div>

      {/* Controlos: categoria ◀ | [reset] | play/pause | [finish] | categoria ▶
          Os botões reset e finish só aparecem após o timer ter iniciado */}
      <div className={`controls${hasStarted ? ' controls--active' : ''}`}>
        {/* Navega para a categoria anterior */}
        <button className="ctrl-btn ctrl-category" onClick={onPrevCategory} aria-label="Categoria anterior" disabled={pomodoroCount <= 1}>
          <ChevronLeft size={20} color={pomodoroCount <= 1 ? '#D1D5DB' : '#6B7280'} />
        </button>

        {/* Reiniciar — visível apenas quando o timer já iniciou */}
        {hasStarted && (
          <button className="ctrl-btn ctrl-secondary" onClick={onReset} aria-label="Reiniciar sessão">
            <RotateCcw size={18} color="#6B7280" />
          </button>
        )}

        {/* Botão principal — alterna entre Play e Pause consoante o estado */}
        <button className="ctrl-btn ctrl-primary" onClick={onPlay} aria-label={isRunning ? 'Pausar' : 'Iniciar'}>
          {isRunning
            ? <Pause size={28} color="#FFFFFF" fill="#FFFFFF" />
            : <Play size={28} color="#FFFFFF" fill="#FFFFFF" />}
        </button>

        {/* Finalizar — visível apenas quando o timer já iniciou */}
        {hasStarted && (
          <button className="ctrl-btn ctrl-secondary" onClick={onFinish} aria-label="Finalizar sessão">
            <CheckCircle size={18} color="#6B7280" />
          </button>
        )}

        {/* Navega para a categoria seguinte */}
        <button className="ctrl-btn ctrl-category" onClick={onNextCategory} aria-label="Categoria seguinte" disabled={pomodoroCount <= 1}>
          <ChevronRight size={20} color={pomodoroCount <= 1 ? '#D1D5DB' : '#6B7280'} />
        </button>
      </div>

      {pomodoroCount > 1 && (
        <div className="pomodoro-indicator">
          {pomodoroIndex + 1} / {pomodoroCount}
        </div>
      )}

      {/* Diálogo de confirmação — aparece por cima quando o utilizador tenta trocar
          de categoria com o timer em execução */}
      {showConfirm && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-box">
            <p className="confirm-title">Trocar de pomodoro?</p>
            <p className="confirm-body">
              O timer está em execução. Trocar de pomodoro vai reiniciar a sessão actual.
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn confirm-cancel" onClick={onCancelSwitch}>
                Continuar a estudar
              </button>
              <button className="confirm-btn confirm-ok" onClick={onConfirmSwitch}>
                Trocar e reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card de pré-visualização / empty states */}
      <div className="review-card">
        {pomodoroCount === 0 ? (
          <div className="card-empty">
            <span className="card-empty-icon">🍅</span>
            <span className="card-empty-title">Nenhum pomodoro criado</span>
            <span className="card-empty-sub">Crie um pomodoro na aba abaixo para começar.</span>
          </div>
        ) : (
          <>
            <div className="card-header">
              <span className="card-label">Próxima revisão</span>
              <div className="subject-tag">
                <Zap size={12} color="#FF6B6B" fill="#FF6B6B" />
                <span>{category}</span>
              </div>
            </div>
            <div className="card-divider" />
            {isCompleted ? (
              <div className="card-completed">
                <span className="card-completed-title">🎉 Pomodoro concluído!</span>
                <span className="card-completed-sub">Todas as perguntas foram respondidas.</span>
                <button className="card-restart-btn" onClick={onRestartPomodoro}>
                  Reiniciar ciclo
                </button>
              </div>
            ) : questions.length === 0 ? (
              <div className="card-empty">
                <span className="card-empty-icon">📭</span>
                <span className="card-empty-title">Sem perguntas</span>
                <span className="card-empty-sub">Adicione perguntas a este pomodoro para ativar a revisão.</span>
              </div>
            ) : (
              <div className="card-content">
                <p className="pomodoro-name">{pomodoroName}</p>
                <ul className="question-list">
                  {questions.map((q, i) => (
                    <li key={i} className="question-list-item">
                      <span className="question-list-index">{i + 1}</span>
                      <span className="question-list-text">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
