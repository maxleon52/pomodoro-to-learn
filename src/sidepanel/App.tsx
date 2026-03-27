import { useState, useEffect, useRef } from 'react'
import './styles/global.css'
import TimerScreen from './components/timer-screen'
import CategoriesScreen from './components/categories-screen'
import QuestionsScreen from './components/questions-screen'
import PomodoroScreen from './components/pomodoro-screen'
import BottomNav, { type Screen } from './components/bottom-nav'
import type { TimerState, WorkerMessage } from '../shared/types'

// Duração padrão de uma sessão: 25 minutos em segundos
const DEFAULT_DURATION = 25 * 60

// Categorias de estudo disponíveis — futuramente virão do chrome.storage.local
const CATEGORIES = ['Inglês', 'Programação', 'Entrevistas']

// Envia uma mensagem ao service worker e aguarda a resposta com o estado actualizado
function sendToWorker(msg: WorkerMessage): Promise<TimerState> {
  return chrome.runtime.sendMessage(msg)
}

// Calcula os segundos restantes a partir do estado guardado:
// - Se running: deriva do endTime em tempo real
// - Se pausado: usa o timeLeft guardado no storage
function calcTimeLeft(state: TimerState): number {
  if (state.running && state.endTime) {
    return Math.max(0, Math.round((state.endTime - Date.now()) / 1000))
  }
  return state.timeLeft
}

// Converte a fase interna para o texto visível na UI
function phaseLabel(state: TimerState): string {
  if (state.phase === 'focusing') return 'Foco'
  if (state.phase === 'quiz_pending') return 'Concluído'
  return 'Pronto'
}

export default function App() {
  // Tela activa no bottom nav
  const [screen, setScreen] = useState<Screen>('timer')

  // workerState: estado autoritativo vindo do service worker / storage
  const [workerState, setWorkerState] = useState<TimerState>({
    phase: 'idle',
    endTime: null,
    timeLeft: DEFAULT_DURATION,
    running: false,
  })

  // timeLeft: segundos exibidos no ecrã — actualizado pelo intervalo abaixo
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION)

  // Referência ao intervalo de countdown para poder limpá-lo correctamente
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Índice da categoria de estudo actualmente seleccionada
  const [categoryIndex, setCategoryIndex] = useState(0)

  // Quando não é null, guarda o índice pendente e mostra o diálogo de confirmação
  const [pendingCategory, setPendingCategory] = useState<number | null>(null)

  // Ao montar o side panel: pede o estado actual ao worker para sincronizar a UI
  // (o painel pode ter sido fechado e reaberto com o timer a correr)
  useEffect(() => {
    sendToWorker({ type: 'GET_STATE' }).then((state) => {
      setWorkerState(state)
      setTimeLeft(calcTimeLeft(state))
    })
  }, [])

  // Ouve mudanças no storage — reagindo a eventos do worker (ex: alarme disparou)
  // Isto permite que a UI actualize mesmo quando a mensagem vem do alarm handler
  useEffect(() => {
    function onStorageChange(
      changes: Record<string, chrome.storage.StorageChange>
    ) {
      if (changes.timerState) {
        const state = changes.timerState.newValue as TimerState
        setWorkerState(state)
        setTimeLeft(calcTimeLeft(state))
      }
    }
    chrome.storage.onChanged.addListener(onStorageChange)
    return () => chrome.storage.onChanged.removeListener(onStorageChange)
  }, [])

  // Countdown local: quando o timer está a correr, recalcula timeLeft cada segundo
  // Não depende do worker para cada tick — deriva directamente do endTime guardado
  useEffect(() => {
    if (workerState.running && workerState.endTime) {
      intervalRef.current = setInterval(() => {
        const left = Math.max(
          0,
          Math.round((workerState.endTime! - Date.now()) / 1000)
        )
        setTimeLeft(left)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [workerState.running, workerState.endTime])

  // Play/Pause: comportamento depende da fase actual
  async function handlePlay() {
    let state: TimerState
    if (workerState.phase === 'idle') {
      // Primeira vez — inicia com a duração padrão
      state = await sendToWorker({ type: 'START', duration: DEFAULT_DURATION })
    } else if (workerState.running) {
      state = await sendToWorker({ type: 'PAUSE' })
    } else {
      // Estava pausado — retoma de onde parou
      state = await sendToWorker({ type: 'RESUME' })
    }
    setWorkerState(state)
    setTimeLeft(calcTimeLeft(state))
  }

  // Reinicia a sessão completamente
  async function handleReset() {
    const state = await sendToWorker({ type: 'RESET' })
    setWorkerState(state)
    setTimeLeft(DEFAULT_DURATION)
  }

  // Força o fim da sessão — activa quiz_pending imediatamente
  async function handleFinish() {
    const state = await sendToWorker({ type: 'SKIP' })
    setWorkerState(state)
    setTimeLeft(0)
  }

  // Navega para a categoria anterior ou seguinte no array circular.
  // Se o timer estiver a correr, guarda o índice pendente e exibe o diálogo de confirmação.
  function switchCategory(next: number) {
    if (workerState.running) {
      setPendingCategory(next)
    } else {
      setCategoryIndex(next)
    }
  }

  function handlePrevCategory() {
    switchCategory((categoryIndex - 1 + CATEGORIES.length) % CATEGORIES.length)
  }

  function handleNextCategory() {
    switchCategory((categoryIndex + 1) % CATEGORIES.length)
  }

  // Utilizador confirmou a troca — reinicia o timer e muda de categoria
  async function handleConfirmSwitch() {
    if (pendingCategory === null) return
    await handleReset()
    setCategoryIndex(pendingCategory)
    setPendingCategory(null)
  }

  // Utilizador cancelou — descarta a mudança pendente
  function handleCancelSwitch() {
    setPendingCategory(null)
  }

  function renderScreen() {
    switch (screen) {
      case 'categories':
        return <CategoriesScreen />
      case 'questions':
        return <QuestionsScreen />
      case 'pomodoro':
        return <PomodoroScreen />
      default:
        return (
          <TimerScreen
            timeLeft={timeLeft}
            totalTime={DEFAULT_DURATION}
            isRunning={workerState.running}
            phase={phaseLabel(workerState)}
            hasStarted={workerState.phase !== 'idle'}
            category={CATEGORIES[categoryIndex]}
            pomodoroName="Revisão Programação"
            questions={[
              'O que é uma closure em JavaScript?',
              'O que é uma Promise em JavaScript?',
              'Qual a diferença entre let e const?',
            ]}
            showConfirm={pendingCategory !== null}
            onPlay={handlePlay}
            onReset={handleReset}
            onFinish={handleFinish}
            onPrevCategory={handlePrevCategory}
            onNextCategory={handleNextCategory}
            onConfirmSwitch={handleConfirmSwitch}
            onCancelSwitch={handleCancelSwitch}
          />
        )
    }
  }

  return (
    <div className="app-shell">
      <div className="app-content">{renderScreen()}</div>
      <BottomNav active={screen} onChange={setScreen} />
    </div>
  )
}
