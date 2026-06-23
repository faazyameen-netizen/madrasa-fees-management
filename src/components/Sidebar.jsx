import { NavLink } from 'react-router-dom'
import {
  Home,
  Users,
  BookOpen,
  Wallet,
  FileText,
  CreditCard,
  BarChart2,
  Award,
  Settings,
  Moon,
} from 'lucide-react'

// "Students" and "Courses" are real, working routes in this build.
// The rest are shown for visual context but are inactive placeholders.
const disabledItems = [
  { label: 'Dashboard', icon: Home },
  { label: 'Fees Desk', icon: Wallet },
  { label: 'Invoices', icon: FileText },
  { label: 'Payments', icon: CreditCard },
  { label: 'Reports', icon: BarChart2 },
  { label: 'Scholarship', icon: Award },
  { label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Moon size={18} color="#fff" />
        </div>
        <div className="sidebar-brand-text">
          <strong>MADRASA</strong>
          <span>FEES MANAGEMENT</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) =>
            'sidebar-item' + (isActive ? ' active' : '')
          }
        >
          <Users size={18} />
          Students
        </NavLink>

        <NavLink
          to="/courses"
          className={({ isActive }) =>
            'sidebar-item' + (isActive ? ' active' : '')
          }
        >
          <BookOpen size={18} />
          Courses
        </NavLink>

        {disabledItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className="sidebar-item disabled"
            title="Not part of this build yet"
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
