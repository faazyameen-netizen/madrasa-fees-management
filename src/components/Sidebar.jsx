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
  X,
} from 'lucide-react'

const disabledItems = [
  { label: 'Dashboard', icon: Home },
  { label: 'Reports', icon: BarChart2 },
  { label: 'Settings', icon: Settings },
]

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <aside className={'sidebar' + (mobileOpen ? ' sidebar-open' : '')}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Moon size={18} color="#fff" />
        </div>
        <div className="sidebar-brand-text">
          <strong>MADRASA</strong>
          <span>FEES MANAGEMENT</span>
        </div>
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close menu"
          type="button"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          onClick={onClose}
          className={({ isActive }) =>
            'sidebar-item' + (isActive ? ' active' : '')
          }
        >
          <Users size={18} />
          Students
        </NavLink>

        <NavLink
          to="/courses"
          onClick={onClose}
          className={({ isActive }) =>
            'sidebar-item' + (isActive ? ' active' : '')
          }
        >
          <BookOpen size={18} />
          Courses
        </NavLink>

        <NavLink
          to="/fees-desk"
          onClick={onClose}
          className={({ isActive }) =>
            'sidebar-item' + (isActive ? ' active' : '')
          }
        >
          <Wallet size={18} />
          Fees Desk
        </NavLink>

        <NavLink
          to="/scholarship"
          onClick={onClose}
          className={({ isActive }) =>
            'sidebar-item' + (isActive ? ' active' : '')
          }
        >
          <Award size={18} />
          Scholarship
        </NavLink>

        <NavLink
          to="/invoices"
          onClick={onClose}
          className={({ isActive }) =>
            'sidebar-item' + (isActive ? ' active' : '')
          }
        >
          <FileText size={18} />
          Invoices
        </NavLink>

        <NavLink
          to="/payments"
          onClick={onClose}
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