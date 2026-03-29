import { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import './toast.css'

export interface ToastData {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastProps {
  toast: ToastData
  onDone: (id: number) => void
}

function ToastItem({ toast, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const hideTimer = setTimeout(() => setVisible(false), 2200)
    const removeTimer = setTimeout(() => onDone(toast.id), 2600)
    return () => { clearTimeout(hideTimer); clearTimeout(removeTimer) }
  }, [])

  return (
    <div className={`toast toast--${toast.type}${visible ? '' : ' toast--out'}`}>
      {toast.type === 'success'
        ? <CheckCircle size={15} color="#16A34A" />
        : <XCircle size={15} color="#DC2626" />}
      <span>{toast.message}</span>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onDone: (id: number) => void
}

export default function ToastContainer({ toasts, onDone }: ToastContainerProps) {
  if (toasts.length === 0) return null
  return (
    <div className="toast-container">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDone={onDone} />)}
    </div>
  )
}
