import type { TimerState, WorkerMessage } from '../shared/types'

// Nome único do alarme — usado para criar, limpar e identificar
const ALARM_NAME = 'pomodoro-end'

// Caminho do ícone para a notificação nativa (PNG copiado de public/ para dist/)
const NOTIFICATION_ICON = 'icon48.png'

// Estado inicial — usado na primeira instalação e após reset
const DEFAULT_STATE: TimerState = {
  phase: 'idle',
  endTime: null,
  timeLeft: 0,
  running: false,
  quizCurrentQuestionId: null,
  quizQuestionStartedAt: null,
}

// ── Helpers de storage ────────────────────────────────────────────────────────

// Lê o estado actual do storage
async function getState(): Promise<TimerState> {
  const result = await chrome.storage.local.get('timerState')
  return (result.timerState as TimerState) ?? DEFAULT_STATE
}

// Grava o estado no storage (o side panel reage via chrome.storage.onChanged)
async function setState(state: TimerState): Promise<void> {
  await chrome.storage.local.set({ timerState: state })
}

// ── Lógica do timer ───────────────────────────────────────────────────────────

// Chamado quando o alarme dispara — transita para quiz_pending e notifica
async function handleAlarmEnd(): Promise<void> {
  const state = await getState()

  await setState({
    ...state,
    phase: 'quiz_pending',
    running: false,
    endTime: null,
    timeLeft: 0,
    quizCurrentQuestionId: null,
    quizQuestionStartedAt: Date.now(),
  })

  // Garante que a notificação anterior foi limpa antes de criar uma nova.
  // Se o ID já existir na bandeja, o create é ignorado silenciosamente pelo Chrome.
  await chrome.notifications.clear('pomodoro-done')
  chrome.notifications.create('pomodoro-done', {
    type: 'basic',
    iconUrl: NOTIFICATION_ICON,
    title: 'Sessão concluída!',
    message: 'Hora de responder às perguntas de revisão.',
  })
}

// Tenta abrir o side panel na janela activa (chamado ao clicar na notificação)
async function openSidePanel(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId })
  }
}

// ── Handlers de mensagem ──────────────────────────────────────────────────────

// Processa cada tipo de mensagem recebida do side panel e devolve o novo estado
async function handleMessage(msg: WorkerMessage): Promise<TimerState> {
  const state = await getState()

  switch (msg.type) {
    case 'GET_STATE':
      // Side panel a abrir — devolve o estado actual para a UI sincronizar
      return state

    case 'START': {
      // Calcula o timestamp exacto do fim e cria o alarme
      const endTime = Date.now() + msg.duration * 1000
      await chrome.alarms.create(ALARM_NAME, { when: endTime })
      const next: TimerState = {
        phase: 'focusing',
        endTime,
        timeLeft: msg.duration,
        running: true,
        quizCurrentQuestionId: null,
        quizQuestionStartedAt: null,
      }
      await setState(next)
      return next
    }

    case 'PAUSE': {
      if (!state.running || !state.endTime) return state
      // Cancela o alarme e guarda o tempo restante para poder fazer resume
      await chrome.alarms.clear(ALARM_NAME)
      const timeLeft = Math.max(0, Math.round((state.endTime - Date.now()) / 1000))
      const next: TimerState = { ...state, running: false, endTime: null, timeLeft }
      await setState(next)
      return next
    }

    case 'RESUME': {
      if (state.running || state.phase !== 'focusing') return state
      // Recria o alarme com o tempo restante que estava guardado
      const endTime = Date.now() + state.timeLeft * 1000
      await chrome.alarms.create(ALARM_NAME, { when: endTime })
      const next: TimerState = { ...state, running: true, endTime }
      await setState(next)
      return next
    }

    case 'RESET': {
      // Cancela o alarme e volta ao estado inicial
      await chrome.alarms.clear(ALARM_NAME)
      await setState(DEFAULT_STATE)
      return DEFAULT_STATE
    }

    case 'SKIP': {
      // Força o fim da sessão — útil para testes e para "saltar" manualmente
      await chrome.alarms.clear(ALARM_NAME)
      await handleAlarmEnd()
      return getState()
    }

    case 'QUIZ_ADVANCE': {
      // Avança para a próxima pergunta do quiz e reinicia o timestamp do timer
      const next: TimerState = {
        ...state,
        quizCurrentQuestionId: msg.questionId,
        quizQuestionStartedAt: Date.now(),
      }
      await setState(next)
      return next
    }
  }
}

// ── Listeners ─────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  // Configura o ícone da toolbar para abrir o side panel directamente
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

  // Inicializa o estado no storage se ainda não existir
  const existing = await chrome.storage.local.get('timerState')
  if (!existing.timerState) {
    await setState(DEFAULT_STATE)
  }
})

// Alarme disparou — sessão terminou
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    handleAlarmEnd()
  }
})

// Utilizador clicou na notificação — abre o side panel com o quiz
chrome.notifications.onClicked.addListener(async (id) => {
  if (id === 'pomodoro-done') {
    chrome.notifications.clear(id)
    await openSidePanel()
  }
})

// Recebe mensagens do side panel de forma assíncrona
// O `return true` é obrigatório para manter o canal aberto até a Promise resolver
chrome.runtime.onMessage.addListener((msg: WorkerMessage, _sender, sendResponse) => {
  handleMessage(msg).then(sendResponse)
  return true
})
