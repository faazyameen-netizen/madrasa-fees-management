import { useEffect, useMemo, useState } from 'react'
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react'
import { supabase } from '../supabaseClient.js'
import Topbar from '../components/Topbar.jsx'
import { PAGE_SIZE } from '../constants.js'

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
  const [page, setPage] = useState(1)

  async function fetchPayments() {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('payments')
      .select('*, invoices(invoice_no, students(full_name, roll_no))')
     .order('created_at', { ascending: false })

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  function resetToFirstPage(setter) {
    return (value) => {
      setter(value)
      setPage(1)
    }
  }

  function pageNumbers() {
    const nums = []
    const last = totalPages
    const cur = currentPage
    const add = (n) => nums.push(n)

    add(1)
    if (cur > 3) nums.push('...')
    for (let n = Math.max(2, cur - 1); n <= Math.min(last - 1, cur + 1); n++) {
      add(n)
    }
    if (cur < last - 2) nums.push('...')
    if (last > 1) add(last)

    return [...new Set(nums)]
  }

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
              onChange={(e) => resetToFirstPage(setFromDate)(e.target.value)}
            />
          </div>
          <div className="form-field" style={{ minWidth: 160 }}>
            <label style={{ fontSize: 12 }}>To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => resetToFirstPage(setToDate)(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={modeFilter}
            onChange={(e) => resetToFirstPage(setModeFilter)(e.target.value)}
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
          ) : pageItems.length === 0 ? (
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
                {pageItems.map((p) => (
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

          {!loading && filtered.length > 0 && (
            <div className="table-footer">
              <span>
                Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{' '}
                {filtered.length} entries
              </span>
              <div className="pagination">
                <button disabled={currentPage === 1} onClick={() => setPage(1)}>
                  <ChevronsLeft size={14} />
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                </button>
                {pageNumbers().map((n, idx) =>
                  n === '...' ? (
                    <span key={`dots-${idx}`} style={{ padding: '0 4px' }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={n}
                      className={n === currentPage ? 'active' : ''}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  )
                )}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(totalPages)}
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}