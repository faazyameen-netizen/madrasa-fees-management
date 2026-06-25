import { NavLink } from 'react-router-dom'
import { Users, Wallet, FileText, CreditCard } from 'lucide-react'

const TABS = [
  { to: '/', label: 'Students', icon: Users, end: true },
  { to: '/fees-desk', label: 'Fees Desk', icon: Wallet },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/payments', label: 'Payments', icon: CreditCard },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            'bottom-nav-item' + (isActive ? ' active' : '')
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}