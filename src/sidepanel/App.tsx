import { useState, useEffect, useRef, useMemo } from 'react'
import './styles/global.css'
import TimerScreen from './components/timer-screen'
import QuizScreen from './components/quiz-screen'
import CategoriesScreen from './components/categories-screen'
import QuestionsScreen from './components/questions-screen'
import PomodoroScreen from './components/pomodoro-screen'
import BottomNav, { type Screen } from './components/bottom-nav'
import ToastContainer, { type ToastData } from './components/toast'
import type { TimerState, WorkerMessage, Category, Question, Pomodoro } from '../shared/types'

// Duração padrão de uma sessão: 25 minutos em segundos
const DEFAULT_DURATION = 25 * 60


// Envia uma mensagem ao service worker e aguarda a resposta com o estado actualizado
function sendToWorker(msg: WorkerMessage): Promise<TimerState> {
  return chrome.runtime.sendMessage(msg)
}

// Calcula os segundos restantes a partir do estado guardado
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

  // --- Dados da aplicação (fonte da verdade) ---
  const [categories, setCategories] = useState<Category[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [pomodoros, setPomodoros] = useState<Pomodoro[]>([])
  const [pomodoroIndex, setPomodoroIndex] = useState(0)
  // Perguntas respondidas por pomodoro: { [pomodoroId]: string[] }
  const [answeredIdsMap, setAnsweredIdsMap] = useState<Record<string, string[]>>({})
  // Controla se o carregamento inicial do storage já terminou
  const [dataLoaded, setDataLoaded] = useState(false)

  // --- Toast ---
  const [toasts, setToasts] = useState<ToastData[]>([])
  const toastIdRef = useRef(0)
  function showToast(message: string, type: 'success' | 'error' = 'success') {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
  }
  function removeToast(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // --- Estado do timer ---
  const [workerState, setWorkerState] = useState<TimerState>({
    phase: 'idle', endTime: null, timeLeft: DEFAULT_DURATION, running: false,
  })
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION)
  const [workerReady, setWorkerReady] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [pendingPomodoro, setPendingPomodoro] = useState<number | null>(null)
  // Chave que força remount do QuizScreen ao iniciar nova rodada
  const [roundKey, setRoundKey] = useState(0)

  // --- Valores derivados do pomodoro activo ---
  const safeIndex = pomodoros.length > 0 ? Math.min(pomodoroIndex, pomodoros.length - 1) : 0
  const activePomodoro = pomodoros[safeIndex]
  // Duração da sessão em segundos — usa a duração do pomodoro activo ou o padrão
  const sessionDuration = (activePomodoro?.duration ?? 25) * 60
  const activeCategory = activePomodoro
    ? (categories.find(c => c.id === activePomodoro.categoryId) ?? { id: '', name: 'Sem categoria', color: '#9CA3AF', emoji: '📋' })
    : { id: '', name: 'Sem categoria', color: '#9CA3AF', emoji: '📋' }

  const answeredIds: string[] = activePomodoro ? (answeredIdsMap[activePomodoro.id] ?? []) : []

  // Perguntas ainda não respondidas — recalculado a cada render (fonte da verdade para isCompleted)
  const unansweredFull = activePomodoro
    ? activePomodoro.questionIds
        .map(id => questions.find(q => q.id === id))
        .filter((q): q is Question => !!q && !answeredIds.includes(q.id))
    : []

  const isCompleted = !!activePomodoro && activePomodoro.questionIds.length > 0 && unansweredFull.length === 0
  const remainingQuestionTexts = unansweredFull.map(q => q.question)

  // Ref para ler answeredIdsMap dentro do useMemo sem o tornar dependência
  // (queremos congelar as perguntas no início de cada rodada, não a cada resposta)
  const answeredIdsMapRef = useRef(answeredIdsMap)
  answeredIdsMapRef.current = answeredIdsMap

  // Perguntas congeladas para a rodada actual — só recalcula quando roundKey ou a fase mudam,
  // NÃO quando answeredIdsMap muda (evita encolhimento do array mid-round → tela em branco)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const roundQuestions = useMemo(() => {
    if (workerState.phase !== 'quiz_pending') return []
    const pomId = activePomodoro?.id ?? ''
    const answered = answeredIdsMapRef.current[pomId] ?? []
    return (activePomodoro?.questionIds ?? [])
      .map(id => questions.find(q => q.id === id))
      .filter((q): q is Question => !!q && !answered.includes(q.id))
      .slice(0, 5)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey, workerState.phase, activePomodoro?.id, questions])

  // Carrega dados do chrome.storage.local no arranque
  useEffect(() => {
    chrome.storage.local.get('appData').then(result => {
      if (result.appData) {
        const data = result.appData as {
          categories?: Category[]
          questions?: Question[]
          pomodoros?: Pomodoro[]
          pomodoroIndex?: number
          answeredIds?: Record<string, string[]>
        }
        if (Array.isArray(data.categories) && data.categories.length) setCategories(data.categories)
        if (Array.isArray(data.questions) && data.questions.length) setQuestions(data.questions)
        if (Array.isArray(data.pomodoros) && data.pomodoros.length) setPomodoros(data.pomodoros)
        if (typeof data.pomodoroIndex === 'number') setPomodoroIndex(data.pomodoroIndex)
        if (data.answeredIds && typeof data.answeredIds === 'object') setAnsweredIdsMap(data.answeredIds)
      }
      setDataLoaded(true)
    })
  }, [])

  // Persiste dados sempre que mudam (só após o carregamento inicial)
  useEffect(() => {
    if (!dataLoaded) return
    chrome.storage.local.set({
      appData: { categories, questions, pomodoros, pomodoroIndex, answeredIds: answeredIdsMap },
    })
  }, [dataLoaded, categories, questions, pomodoros, pomodoroIndex, answeredIdsMap])

  // Ao montar: sincroniza UI com o estado do worker
  useEffect(() => {
    sendToWorker({ type: 'GET_STATE' }).then(state => {
      setWorkerState(state)
      const tl = calcTimeLeft(state)
      // Se idle, timeLeft será corrigido pelo efeito abaixo quando sessionDuration carregar
      setTimeLeft(state.phase === 'idle' ? DEFAULT_DURATION : tl)
      setWorkerReady(true)
    })
  }, [])

  // Quando o timer está idle, mantém timeLeft sincronizado com a duração do pomodoro activo.
  // Dispara quando: storage carrega (sessionDuration muda), utilizador troca de pomodoro, etc.
  useEffect(() => {
    if (workerState.phase === 'idle') {
      setTimeLeft(sessionDuration)
    }
  }, [sessionDuration, workerState.phase])

  // Ouve mudanças no storage — reagindo a eventos do worker (ex: alarme disparou)
  useEffect(() => {
    function onStorageChange(changes: Record<string, chrome.storage.StorageChange>) {
      if (changes.timerState) {
        const state = changes.timerState.newValue as TimerState
        setWorkerState(state)
        setTimeLeft(calcTimeLeft(state))
      }
    }
    chrome.storage.onChanged.addListener(onStorageChange)
    return () => chrome.storage.onChanged.removeListener(onStorageChange)
  }, [])

  // Countdown local: recalcula timeLeft cada segundo enquanto o timer corre
  useEffect(() => {
    if (workerState.running && workerState.endTime) {
      intervalRef.current = setInterval(() => {
        const left = Math.max(0, Math.round((workerState.endTime! - Date.now()) / 1000))
        setTimeLeft(left)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [workerState.running, workerState.endTime])

  // Quando todas as perguntas foram respondidas e o quiz dispara, reseta para idle
  useEffect(() => {
    if (workerState.phase === 'quiz_pending' && isCompleted) {
      sendToWorker({ type: 'RESET' }).then(state => {
        setWorkerState(state)
        setTimeLeft(sessionDuration)
      })
    }
  }, [workerState.phase, isCompleted])

  // --- Handlers do timer ---

  async function handlePlay() {
    let state: TimerState
    if (workerState.phase === 'idle') {
      state = await sendToWorker({ type: 'START', duration: sessionDuration })
    } else if (workerState.running) {
      state = await sendToWorker({ type: 'PAUSE' })
    } else {
      state = await sendToWorker({ type: 'RESUME' })
    }
    setWorkerState(state)
    setTimeLeft(calcTimeLeft(state))
  }

  async function handleReset() {
    const state = await sendToWorker({ type: 'RESET' })
    setWorkerState(state)
    setTimeLeft(sessionDuration)
  }

  async function handleFinish() {
    const state = await sendToWorker({ type: 'SKIP' })
    setWorkerState(state)
    setTimeLeft(0)
  }

  // Navega entre pomodoros; se timer activo, guarda pendente e pede confirmação
  function switchPomodoro(next: number) {
    if (workerState.running) {
      setPendingPomodoro(next)
    } else {
      const targetId = pomodoros[next]?.id
      if (targetId) setAnsweredIdsMap(prev => ({ ...prev, [targetId]: [] }))
      setPomodoroIndex(next)
    }
  }

  function handlePrevCategory() {
    if (pomodoros.length <= 1) return
    switchPomodoro((safeIndex - 1 + pomodoros.length) % pomodoros.length)
  }

  function handleNextCategory() {
    if (pomodoros.length <= 1) return
    switchPomodoro((safeIndex + 1) % pomodoros.length)
  }

  async function handleConfirmSwitch() {
    if (pendingPomodoro === null) return
    const targetId = pomodoros[pendingPomodoro]?.id
    await handleReset()
    setPomodoroIndex(pendingPomodoro)
    if (targetId) setAnsweredIdsMap(prev => ({ ...prev, [targetId]: [] }))
    setPendingPomodoro(null)
  }

  function handleCancelSwitch() {
    setPendingPomodoro(null)
  }

  function handleAnswered(questionId: string) {
    if (!activePomodoro) return
    const pomId = activePomodoro.id
    setAnsweredIdsMap(prev => ({ ...prev, [pomId]: [...(prev[pomId] ?? []), questionId] }))
    // Não inicia novo timer — o quiz avança internamente para a próxima pergunta
  }

  async function handleRoundEnd() {
    // Rodada terminada: inicia novo timer de 25min e prepara a próxima rodada
    // Quando o timer acabar e fase virar quiz_pending, o useMemo recomputa roundQuestions
    // com as perguntas restantes (já excluindo as respondidas nesta rodada)
    setRoundKey(prev => prev + 1)
    const state = await sendToWorker({ type: 'START', duration: sessionDuration })
    setWorkerState(state)
    setTimeLeft(sessionDuration)
  }

  function handleRestartPomodoro() {
    if (!activePomodoro) return
    const pomId = activePomodoro.id
    setAnsweredIdsMap(prev => ({ ...prev, [pomId]: [] }))
  }

  // --- CRUD: Categorias ---

  function handleAddCategory(cat: Omit<Category, 'id'>) {
    setCategories(prev => [...prev, { ...cat, id: Date.now().toString() }])
    showToast('Categoria criada')
  }

  function handleEditCategory(cat: Category) {
    setCategories(prev => prev.map(c => c.id === cat.id ? cat : c))
    showToast('Categoria atualizada')
  }

  function handleDeleteCategory(id: string) {
    setCategories(prev => prev.filter(c => c.id !== id))
    setQuestions(prev => prev.map(q => q.categoryId === id ? { ...q, categoryId: '' } : q))
    showToast('Categoria excluída')
  }

  // --- CRUD: Perguntas ---

  function handleAddQuestion(q: Omit<Question, 'id'>) {
    setQuestions(prev => [...prev, { ...q, id: Date.now().toString() }])
    showToast('Pergunta criada')
  }

  function handleEditQuestion(q: Question) {
    setQuestions(prev => prev.map(x => x.id === q.id ? q : x))
    showToast('Pergunta atualizada')
  }

  function handleDeleteQuestion(id: string) {
    setQuestions(prev => prev.filter(q => q.id !== id))
    setPomodoros(prev => prev.map(p => ({ ...p, questionIds: p.questionIds.filter(qid => qid !== id) })))
    showToast('Pergunta excluída')
  }

  // --- CRUD: Pomodoros ---

  function handleAddPomodoro(p: Omit<Pomodoro, 'id'>) {
    setPomodoros(prev => [...prev, { ...p, id: Date.now().toString() }])
    showToast('Pomodoro criado')
  }

  function handleEditPomodoro(p: Pomodoro) {
    setPomodoros(prev => prev.map(x => x.id === p.id ? p : x))
    showToast('Pomodoro atualizado')
  }

  function handleDeletePomodoro(id: string) {
    const currentActiveId = pomodoros[safeIndex]?.id
    const nextPomodoros = pomodoros.filter(p => p.id !== id)
    setPomodoros(nextPomodoros)
    if (currentActiveId !== id) {
      const newIdx = nextPomodoros.findIndex(p => p.id === currentActiveId)
      setPomodoroIndex(Math.max(0, newIdx))
    } else {
      setPomodoroIndex(0)
    }
    showToast('Pomodoro excluído')
  }

  function renderScreen() {
    // Quiz sobrepõe qualquer tela quando há perguntas pendentes na rodada
    if (workerState.phase === 'quiz_pending' && !isCompleted && roundQuestions.length > 0) {
      return (
        <QuizScreen
          key={roundKey}
          questions={roundQuestions}
          category={activeCategory.name}
          onAnswered={handleAnswered}
          onRoundEnd={handleRoundEnd}
        />
      )
    }

    switch (screen) {
      case 'categories':
        return (
          <CategoriesScreen
            categories={categories}
            questions={questions}
            onAdd={handleAddCategory}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        )
      case 'questions':
        return (
          <QuestionsScreen
            categories={categories}
            questions={questions}
            onAdd={handleAddQuestion}
            onEdit={handleEditQuestion}
            onDelete={handleDeleteQuestion}
          />
        )
      case 'pomodoro':
        return (
          <PomodoroScreen
            categories={categories}
            questions={questions}
            pomodoros={pomodoros}
            onAdd={handleAddPomodoro}
            onEdit={handleEditPomodoro}
            onDelete={handleDeletePomodoro}
          />
        )
      default:
        return (
          <TimerScreen
            timeLeft={timeLeft}
            totalTime={sessionDuration}
            isRunning={workerState.running}
            phase={phaseLabel(workerState)}
            hasStarted={workerState.phase !== 'idle'}
            ready={dataLoaded && workerReady}
            category={activeCategory.name}
            pomodoroName={activePomodoro?.name ?? ''}
            questions={remainingQuestionTexts}
            isCompleted={isCompleted}
            showConfirm={pendingPomodoro !== null}
            pomodoroCount={pomodoros.length}
            pomodoroIndex={safeIndex}
            onPlay={handlePlay}
            onReset={handleReset}
            onFinish={handleFinish}
            onPrevCategory={handlePrevCategory}
            onNextCategory={handleNextCategory}
            onConfirmSwitch={handleConfirmSwitch}
            onCancelSwitch={handleCancelSwitch}
            onRestartPomodoro={handleRestartPomodoro}
          />
        )
    }
  }

  return (
    <div className="app-shell" data-loaded={dataLoaded ? 'true' : 'false'}>
      <div className="app-content">{renderScreen()}</div>
      <BottomNav active={screen} onChange={setScreen} />
      <ToastContainer toasts={toasts} onDone={removeToast} />
    </div>
  )
}
