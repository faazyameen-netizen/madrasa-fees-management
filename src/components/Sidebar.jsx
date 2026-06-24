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

const disabledItems = [
  { label: 'Dashboard', icon: Home },
  { label: 'Reports', icon: BarChart2 },
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

        <NavLink
          to="/fees-desk"
          className={({ isActive }) =>
            'sidebar-item' + (isActive ? ' active' : '')
          }
        >
          <Wallet size={18} />
          Fees Desk
        </NavLink>

        <NavLink
          to="/scholarship"
          className={({ isActive }) =>
            'sidebar-item' + (isActive ? ' active' : '')
          }
        >
          <Award size={18} />
          Scholarship
        </NavLink>
        <NavLink
          to="/invoices"
          className={({ isActive }) =>
            'sidebar-item' + (isActive ? ' active' : '')
          }
        >
          <FileText size={18} />
          Invoices
        </NavLink>
        <NavLink
  to="/payments"
  className={({ isActive }) =>
    'sidebar-item' + (isActive ? ' active' : '')
  }
>
  <CreditCard size={18} />
  Payments
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