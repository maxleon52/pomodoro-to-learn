import { useState } from 'react'
import './styles/global.css'
import TimerScreen from './components/timer-screen'

// Duração padrão de uma sessão Pomodoro: 25 minutos em segundos.
// Futuramente este valor virá do chrome.storage.local (configurável pelo utilizador).
const DEFAULT_TIME = 25 * 60

// App é o componente raiz do side panel.
// Responsabilidade atual: gerir o estado local do timer e decidir qual tela mostrar.
// Quando o service worker estiver implementado, o estado virá de lá via chrome.runtime.sendMessage.
export default function App() {
  // timeLeft: segundos restantes na sessão atual
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME)

  // isRunning: controla se o timer está a contar ou pausado
  const [isRunning, setIsRunning] = useState(false)

  // Alterna entre iniciar e pausar o timer.
  // Por agora apenas troca o estado visual — a contagem real virá do service worker.
  function handlePlay() {
    setIsRunning((v) => !v)
  }

  // Reinicia a sessão para o tempo total e para o timer.
  function handleSkipBack() {
    setTimeLeft(DEFAULT_TIME)
    setIsRunning(false)
  }

  // Salta para o fim da sessão (útil para testar o fluxo de quiz sem esperar).
  function handleSkipForward() {
    setTimeLeft(0)
    setIsRunning(false)
  }

  return (
    <TimerScreen
      timeLeft={timeLeft}
      totalTime={DEFAULT_TIME}
      isRunning={isRunning}
      phase="Foco"
      onPlay={handlePlay}
      onSkipBack={handleSkipBack}
      onSkipForward={handleSkipForward}
    />
  )
}
