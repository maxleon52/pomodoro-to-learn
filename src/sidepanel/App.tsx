import { useState, useEffect, useRef } from 'react'
import './styles/global.css'
import TimerScreen from './components/timer-screen'
import QuizScreen from './components/quiz-screen'
import CategoriesScreen from './components/categories-screen'
import QuestionsScreen from './components/questions-screen'
import PomodoroScreen from './components/pomodoro-screen'
import BottomNav, { type Screen } from './components/bottom-nav'
import type { TimerState, WorkerMessage } from '../shared/types'

// Duração padrão de uma sessão: 25 minutos em segundos
const DEFAULT_DURATION = 25 * 60

// Dados placeholder — serão unificados via lift state quando persistência for implementada
const CATEGORIES = [
  { id: '1', name: 'Programação', color: '#FF6B6B', emoji: '💻' },
  { id: '2', name: 'Inglês',      color: '#6366F1', emoji: '🌍' },
  { id: '3', name: 'Entrevistas', color: '#22C55E', emoji: '🎓' },
]

const QUESTIONS = [
  { id: '1', categoryId: '1', question: 'O que é uma closure em JavaScript?',       options: ['Tipo de variável global', 'Função com acesso ao escopo externo', 'Tipo de loop', 'Método de array']                         as [string,string,string,string], correctAnswer: 'B' as const },
  { id: '2', categoryId: '2', question: "What is the past tense of 'go'?",          options: ['Goed', 'Went', 'Gone', 'Going']                                                                                              as [string,string,string,string], correctAnswer: 'B' as const },
  { id: '3', categoryId: '3', question: 'Qual a diferença entre TCP e UDP?',        options: ['TCP é mais rápido', 'TCP garante entrega; UDP não', 'UDP é mais seguro', 'São protocolos de email']                          as [string,string,string,string], correctAnswer: 'B' as const },
  { id: '4', categoryId: '1', question: 'O que é uma Promise em JavaScript?',       options: ['Função assíncrona', 'Objeto que representa valor futuro', 'Tipo de loop', 'Método de ordenação']                            as [string,string,string,string], correctAnswer: 'B' as const },
  { id: '5', categoryId: '2', question: "How do you use 'despite' in a sentence?",  options: ['Despite I was tired', 'Despite being tired', 'Despite of being tired', 'Despite to be tired']                               as [string,string,string,string], correctAnswer: 'B' as const },
]

const POMODOROS = [
  { id: '1', name: 'Estudar Inglês',      categoryId: '2', questionIds: ['2', '5'] },
  { id: '2', name: 'Treinar Entrevistas', categoryId: '3', questionIds: ['3'] },
  { id: '3', name: 'Revisão Programação', categoryId: '1', questionIds: ['1', '4'] },
]

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

  // Índice do pomodoro actualmente seleccionado
  const [pomodoroIndex, setPomodoroIndex] = useState(0)

  // Quando não é null, guarda o índice pendente e mostra o diálogo de confirmação
  const [pendingPomodoro, setPendingPomodoro] = useState<number | null>(null)

  // Dados derivados do pomodoro activo
  const activePomodoro = POMODOROS[pomodoroIndex]
  const activeCategory = CATEGORIES.find(c => c.id === activePomodoro.categoryId)!
  const activeQuestions = activePomodoro.questionIds
    .map(id => QUESTIONS.find(q => q.id === id)?.question ?? '')
    .filter(Boolean)
  const activeQuizQuestion = QUESTIONS.find(q => q.id === activePomodoro.questionIds[0])

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

  // Navega para o pomodoro anterior ou seguinte no array circular.
  // Se o timer estiver a correr, guarda o índice pendente e exibe o diálogo de confirmação.
  function switchPomodoro(next: number) {
    if (workerState.running) {
      setPendingPomodoro(next)
    } else {
      setPomodoroIndex(next)
    }
  }

  function handlePrevCategory() {
    switchPomodoro((pomodoroIndex - 1 + POMODOROS.length) % POMODOROS.length)
  }

  function handleNextCategory() {
    switchPomodoro((pomodoroIndex + 1) % POMODOROS.length)
  }

  // Utilizador confirmou a troca — reinicia o timer e muda de pomodoro
  async function handleConfirmSwitch() {
    if (pendingPomodoro === null) return
    await handleReset()
    setPomodoroIndex(pendingPomodoro)
    setPendingPomodoro(null)
  }

  // Utilizador cancelou — descarta a mudança pendente
  function handleCancelSwitch() {
    setPendingPomodoro(null)
  }

  // Conclui o quiz e volta ao estado idle
  async function handleQuizDone() {
    const state = await sendToWorker({ type: 'RESET' })
    setWorkerState(state)
    setTimeLeft(DEFAULT_DURATION)
  }

  function renderScreen() {
    // Quiz sobrepõe-se a qualquer tela quando a sessão terminou
    if (workerState.phase === 'quiz_pending' && activeQuizQuestion) {
      return (
        <QuizScreen
          question={activeQuizQuestion.question}
          options={activeQuizQuestion.options}
          correctAnswer={activeQuizQuestion.correctAnswer}
          category={activeCategory.name}
          onDone={handleQuizDone}
        />
      )
    }

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
            category={activeCategory.name}
            pomodoroName={activePomodoro.name}
            questions={activeQuestions}
            showConfirm={pendingPomodoro !== null}
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
