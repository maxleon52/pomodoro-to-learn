// Fases do ciclo Pomodoro
export type Phase = 'idle' | 'focusing' | 'quiz_pending'

// Estado do timer — persiste em chrome.storage.local e é a fonte da verdade
export interface TimerState {
  phase: Phase
  // Timestamp (ms) em que o alarme vai disparar. null quando parado ou em idle.
  endTime: number | null
  // Segundos restantes — autoritativo quando pausado; calculado a partir de endTime quando running
  timeLeft: number
  running: boolean
}

// Mensagens que o side panel envia ao service worker
export type WorkerMessage =
  | { type: 'GET_STATE' }
  | { type: 'START'; duration: number }  // inicia o timer com X segundos
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' }   // volta ao estado idle
  | { type: 'SKIP' }    // força o fim da sessão (activa quiz_pending)
