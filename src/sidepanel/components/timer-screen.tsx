import { Flame, Settings2, SkipBack, Play, Pause, SkipForward, Timer, Zap } from 'lucide-react'
import './timer-screen.css'

// Raio do círculo de progresso em pixels.
// O SVG tem 280x280; os círculos internos têm 240px de diâmetro com 18px de traço.
// Raio do centro do traço = (240 / 2) - (18 / 2) = 111
const RADIUS = 111

// Comprimento total da circunferência — usado para animar o arco de progresso.
// A técnica: stroke-dasharray = comprimento total; stroke-dashoffset = quanto "esconder".
// Com offset = 0, o arco está completo. Com offset = CIRCUMFERENCE, o arco está vazio.
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Props recebidas pelo componente — todas vêm do App.tsx (ou futuramente do service worker).
// O componente é só visual: não sabe nada de timers, só recebe valores e callbacks.
interface TimerScreenProps {
  timeLeft: number      // segundos restantes
  totalTime: number     // duração total da sessão em segundos
  isRunning: boolean    // true = a contar; false = pausado/parado
  phase: string         // texto da fase atual, ex: "Foco"
  onPlay: () => void        // chamado ao clicar play/pause
  onSkipBack: () => void    // chamado ao clicar reiniciar
  onSkipForward: () => void // chamado ao clicar saltar
}

export default function TimerScreen({
  timeLeft,
  totalTime,
  isRunning,
  phase,
  onPlay,
  onSkipBack,
  onSkipForward,
}: TimerScreenProps) {
  // Percentagem de tempo restante (0 a 1).
  // Protege divisão por zero quando totalTime ainda não está definido.
  const progress = totalTime > 0 ? timeLeft / totalTime : 1

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
        <button className="settings-btn" aria-label="Definições">
          <Settings2 size={18} color="#6B7280" />
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
            style={{ filter: 'drop-shadow(0 0 8px rgba(255,107,107,0.4))', transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        {/* Texto do tempo e fase, sobreposto ao centro do SVG */}
        <div className="timer-inner">
          <span className="timer-display">{mm}:{ss}</span>
          <span className="timer-phase">{phase}</span>
        </div>
      </div>

      {/* Controlos: reiniciar | play/pause | saltar */}
      <div className="controls">
        <button className="ctrl-btn ctrl-secondary" onClick={onSkipBack} aria-label="Reiniciar">
          <SkipBack size={22} color="#6B7280" />
        </button>

        {/* Botão principal — alterna entre Play e Pause consoante o estado */}
        <button className="ctrl-btn ctrl-primary" onClick={onPlay} aria-label={isRunning ? 'Pausar' : 'Iniciar'}>
          {isRunning
            ? <Pause size={30} color="#FFFFFF" fill="#FFFFFF" />
            : <Play size={30} color="#FFFFFF" fill="#FFFFFF" />}
        </button>

        <button className="ctrl-btn ctrl-secondary" onClick={onSkipForward} aria-label="Saltar">
          <SkipForward size={22} color="#6B7280" />
        </button>
      </div>

      {/* Card de pré-visualização da próxima pergunta de revisão
          Por agora os dados são estáticos; serão ligados ao storage futuramente */}
      <div className="review-card">
        <div className="card-header">
          <span className="card-label">Próxima revisão</span>
          <div className="time-badge">
            <Timer size={12} color="#9CA3AF" />
            <span>+5 min</span>
          </div>
        </div>
        <div className="card-divider" />
        <div className="card-content">
          <div className="subject-tag">
            <Zap size={12} color="#FF6B6B" fill="#FF6B6B" />
            <span>Programação</span>
          </div>
          <p className="question-text">O que é uma Promise em JavaScript?</p>
          {/* Texto de dica — oculta a resposta até o timer acabar */}
          <p className="hint-text">Toque para revelar após o timer</p>
        </div>
      </div>
    </div>
  )
}
