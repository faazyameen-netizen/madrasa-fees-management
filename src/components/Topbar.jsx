import { User } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Topbar({ title, backTo, backLabel }) {
  return (
    <div className="topbar">
      <div className="topbar-title">
        <h1>{title}</h1>
        {backTo && (
          <div>
            <Link className="back-link" to={backTo}>
              {backLabel}
            </Link>
          </div>
        )}
      </div>
      <div className="topbar-profile">
        <div className="avatar-circle">
          <User size={18} />
        </div>
        Admin
      </div>
    </div>
  )
}
