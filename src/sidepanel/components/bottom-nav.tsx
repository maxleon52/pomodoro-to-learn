import { Timer, BookOpen, Tag, Coffee, Upload } from 'lucide-react'
import './bottom-nav.css'

export type Screen = 'timer' | 'questions' | 'categories' | 'pomodoro' | 'import'

interface BottomNavProps {
  active: Screen
  onChange: (screen: Screen) => void
}

const ITEMS: { screen: Screen; icon: React.ReactNode; label: string }[] = [
  {
    screen: 'timer',
    icon: <Timer size={22} />,
    label: 'Timer',
  },
  {
    screen: 'questions',
    icon: <BookOpen size={22} />,
    label: 'Perguntas',
  },
  {
    screen: 'categories',
    icon: <Tag size={22} />,
    label: 'Categorias',
  },
  {
    screen: 'pomodoro',
    icon: <Coffee size={22} />,
    label: 'Pomodoro',
  },
  {
    screen: 'import',
    icon: <Upload size={22} />,
    label: 'Importar',
  },
]

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {ITEMS.map(({ screen, icon, label }) => (
        <button
          key={screen}
          className={`bottom-nav-item${active === screen ? ' bottom-nav-item--active' : ''}`}
          onClick={() => onChange(screen)}
          aria-label={label}
          aria-current={active === screen ? 'page' : undefined}
        >
          <span className="bottom-nav-icon">{icon}</span>
          <span className="bottom-nav-label">{label}</span>
        </button>
      ))}
    </nav>
  )
}
