import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import Topbar from '../components/Topbar.jsx'

const MODES = ['All Modes', 'Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque']

function formatRupees(value) {
  const num = Number(value) || 0
  return '₹' + num.toLocaleString('en-IN')
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PaymentsHistory() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [modeFilter, setModeFilter] = useState('All Modes')

  async function fetchPayments() {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('payments')
      .select('*, invoices(invoice_no, students(full_name, roll_no))')
      .order('payment_date', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPayments(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesFrom = !fromDate || p.payment_date >= fromDate
      const matchesTo = !toDate || p.payment_date <= toDate
      const matchesMode = modeFilter === 'All Modes' || p.payment_mode === modeFilter
      return matchesFrom && matchesTo && matchesMode
    })
  }, [payments, fromDate, toDate, modeFilter])

  const summary = useMemo(() => {
    const total = filtered.reduce((sum, p) => sum + Number(p.amount), 0)
    return { count: filtered.length, total }
  }, [filtered])

  return (
    <>
      <Topbar title="Payments" />
      <div className="page-content">
        <p style={{ color: '#6b7184', marginTop: -8, marginBottom: 20 }}>
          A complete history of every payment recorded across all students.
        </p>

        <div className="toolbar">
          <div className="form-field" style={{ minWidth: 160 }}>
            <label style={{ fontSize: 12 }}>From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="form-field" style={{ minWidth: 160 }}>
            <label style={{ fontSize: 12 }}>To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
          >
            {MODES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>

        {error && <div className="banner-error">{error}</div>}

        <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <div className="summary-card">
            <span className="summary-label">Total Payments</span>
            <span className="summary-value">{summary.count}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Total Collected</span>
            <span className="summary-value summary-success">
              {formatRupees(summary.total)}
            </span>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading-state">Loading payments...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No payments found for this filter.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Invoice No</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.payment_date)}</td>
                    <td>
                      {p.invoices?.students?.full_name || '—'}
                      {p.invoices?.students?.roll_no
                        ? ` (${p.invoices.students.roll_no})`
                        : ''}
                    </td>
                    <td>{p.invoices?.invoice_no || '—'}</td>
                    <td>{formatRupees(p.amount)}</td>
                    <td>{p.payment_mode}</td>
                    <td>{p.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}