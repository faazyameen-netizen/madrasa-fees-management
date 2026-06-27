import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
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
  const [studentSearch, setStudentSearch] = useState('')
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
    const search = studentSearch.trim().toLowerCase()
    return payments.filter((p) => {
      const matchesFrom = !fromDate || p.payment_date >= fromDate
      const matchesTo = !toDate || p.payment_date <= toDate
      const matchesMode = modeFilter === 'All Modes' || p.payment_mode === modeFilter
      const matchesStudent = !search ||
        (p.invoices?.students?.full_name || '').toLowerCase().includes(search) ||
        (p.invoices?.students?.roll_no || '').toLowerCase().includes(search)
      return matchesFrom && matchesTo && matchesMode && matchesStudent
    })
  }, [payments, fromDate, toDate, modeFilter, studentSearch])

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

  return (
    <>
      <Topbar title="Payments" />
      <div className="page-content">
        <p style={{ color: '#6b7184', marginTop: -8, marginBottom: 20 }}>
          A complete history of every payment recorded across all students.
        </p>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: 11,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9aa1b5',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search student by name or roll no…"
            value={studentSearch}
            onChange={(e) => resetToFirstPage(setStudentSearch)(e.target.value)}
            style={{ paddingLeft: 34, paddingRight: studentSearch ? 34 : 12, width: '100%', boxSizing: 'border-box' }}
          />
          {studentSearch && (
            <button
              onClick={() => resetToFirstPage(setStudentSearch)('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 2,
                color: '#9aa1b5',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, flex: 2, minWidth: 0 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#6b7184' }}>From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => resetToFirstPage(setFromDate)(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#6b7184' }}>To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => resetToFirstPage(setToDate)(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <select
            className="filter-select"
            value={modeFilter}
            onChange={(e) => resetToFirstPage(setModeFilter)(e.target.value)}
            style={{ flex: 1, minWidth: 0, alignSelf: 'flex-end' }}
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

        {loading ? (
          <div className="card">
            <div className="loading-state">Loading payments...</div>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="card">
            <div className="empty-state">No payments found for this filter.</div>
          </div>
        ) : (
          <div className="card-list">
            {pageItems.map((p) => (
              <div key={p.id} className="data-card">
                <div className="data-card-top">
                  <p className="data-card-title">{formatRupees(p.amount)}</p>
                  <span className="badge" style={{ background: '#f0f1f5', color: '#1f2330' }}>
                    {p.payment_mode}
                  </span>
                </div>
                <p className="data-card-subtitle" style={{ marginTop: 6 }}>
                  {p.invoices?.students?.full_name || '—'}
                  {p.invoices?.invoice_no ? ` · ${p.invoices.invoice_no}` : ''}
                </p>
                <p style={{ fontSize: 11, color: '#9aa1b5', margin: '2px 0 0' }}>
                  {formatDate(p.payment_date)}
                  {p.note ? ` · ${p.note}` : ''}
                </p>
              </div>
            ))}

            {filtered.length > 0 && (
              <div className="table-footer mobile-pagination">
                <span>
                  {(currentPage - 1) * PAGE_SIZE + 1}-
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{' '}
                  {filtered.length}
                </span>
                <div className="pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}