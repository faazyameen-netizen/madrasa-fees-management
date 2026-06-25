import { Menu, Moon } from 'lucide-react'

export default function MobileTopbar({ onOpenMenu }) {
  return (
    <div className="mobile-topbar">
      <button
        className="mobile-menu-btn"
        onClick={onOpenMenu}
        aria-label="Open menu"
        type="button"
      >
        <Menu size={20} />
      </button>

      <div className="mobile-topbar-brand">
        <Moon size={16} color="#fff" />
        <span>MADRASA</span>
      </div>
    </div>
  )
}