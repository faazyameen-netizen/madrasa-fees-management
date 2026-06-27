import { useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import { Moon } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const loginError = await login(email, password)
    setLoading(false)
    if (loginError) {
      setError('Invalid email or password.')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f6fa',
      }}
    >
      <div
        className="card form-card"
        style={{ width: 360, maxWidth: '90vw' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div className="sidebar-brand-icon" style={{ background: '#0b1730' }}>
            <Moon size={18} color="#fff" />
          </div>
          <div>
            <strong style={{ display: 'block', fontSize: 16 }}>MADRASA</strong>
            <span style={{ fontSize: 12, color: '#6b7184' }}>FEES MANAGEMENT</span>
          </div>
        </div>

        {error && <div className="banner-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field" style={{ marginBottom: 16 }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yourmadrasa.com"
              required
            />
          </div>

          <div className="form-field" style={{ marginBottom: 24 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}