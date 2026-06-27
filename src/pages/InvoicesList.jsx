import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { supabase } from '../supabaseClient.js'
import Topbar from '../components/Topbar.jsx'
import { PAGE_SIZE } from '../constants.js'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const currentDate = new Date()
const currentMonth = currentDate.getMonth() + 1
const currentYear = currentDate.getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1]

function formatRupees(value) {
  const num = Number(value) || 0
  return '₹' + num.toLocaleString('en-IN')
}

function statusCardClass(status) {
  if (status === 'Paid') return 'data-card status-card-paid'
  if (status === 'Partial') return 'data-card status-card-partial'
  return 'data-card status-card-unpaid'
}

// Inline summary card — guaranteed 2×2 grid regardless of global CSS
function SummaryCard({ label, value, valueStyle }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e8eaf0',
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <span style={{ fontSize: 11, color: '#9aa1b5', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span style={{ fontSize: 20, fontWeight: 700, color: '#1f2330', lineHeight: 1.2, ...valueStyle }}>
        {value}
      </span>
    </div>
  )
}

export default function InvoicesList() {
  const navigate = useNavigate()

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [monthFilter, setMonthFilter] = useState(currentMonth)
  const [yearFilter, setYearFilter] = useState(currentYear)
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [page, setPage] = useState(1)

  async function fetchInvoices() {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('invoices')
      .select('*, students(full_name, roll_no)')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setInvoices(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesMonth = inv.month === monthFilter
      const matchesYear = inv.year === yearFilter
      const matchesStatus = statusFilter === 'All Status' || inv.status === statusFilter
      return matchesMonth && matchesYear && matchesStatus
    })
  }, [invoices, monthFilter, yearFilter, statusFilter])

  const summary = useMemo(() => {
    const monthOnly = invoices.filter(
      (inv) => inv.month === monthFilter && inv.year === yearFilter
    )
    const totalInvoices = monthOnly.length
    const collected = monthOnly.reduce((sum, inv) => sum + Number(inv.paid_amount), 0)
    const pending = monthOnly.reduce(
      (sum, inv) => sum + (Number(inv.total_amount) - Number(inv.paid_amount)),
      0
    )
    const partialCount = monthOnly.filter((inv) => inv.status === 'Partial').length
    return { totalInvoices, collected, pending, partialCount }
  }, [invoices, monthFilter, yearFilter])

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
      <Topbar title="Invoices" />
      <div className="page-content">

        {/* FILTERS ROW */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
          <select
            className="filter-select"
            style={{ flex: 2 }}
            value={monthFilter}
            onChange={(e) => resetToFirstPage(setMonthFilter)(Number(e.target.value))}
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>

          <select
            className="filter-select"
            style={{ flex: 1 }}
            value={yearFilter}
            onChange={(e) => resetToFirstPage(setYearFilter)(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            className="filter-select"
            style={{ flex: 1.5 }}
            value={statusFilter}
            onChange={(e) => resetToFirstPage(setStatusFilter)(e.target.value)}
          >
            <option>All Status</option>
            <option>Unpaid</option>
            <option>Partial</option>
            <option>Paid</option>
          </select>
        </div>

        {/* GENERATE BUTTON */}
        <div style={{ marginBottom: 18 }}>
          <Link to="/invoices/generate" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', boxSizing: 'border-box' }}>
            <Plus size={16} /> Generate Monthly Invoices
          </Link>
        </div>

        {error && <div className="banner-error">{error}</div>}

        {/* SUMMARY CARDS — explicit 2×2 inline grid, never overridden by CSS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 18,
        }}>
          <SummaryCard
            label="Total Invoices"
            value={summary.totalInvoices}
          />
          <SummaryCard
            label="Collected"
            value={formatRupees(summary.collected)}
            valueStyle={{ color: '#1a7a45' }}
          />
          <SummaryCard
            label="Pending"
            value={formatRupees(summary.pending)}
            valueStyle={{ color: '#c0392b' }}
          />
          <SummaryCard
            label="Partial Payments"
            value={summary.partialCount}
          />
        </div>

        {loading ? (
          <div className="card">
            <div className="loading-state">Loading invoices...</div>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              No invoices found for {MONTH_NAMES[monthFilter - 1]} {yearFilter}.
              {' '}Generate monthly invoices to get started.
            </div>
          </div>
        ) : (
          <div className="card-list">
            {pageItems.map((inv) => {
              const pending = Number(inv.total_amount) - Number(inv.paid_amount)
              return (
                <div
                  key={inv.id}
                  className={statusCardClass(inv.status)}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                >
                  <div className="data-card-top">
                    <div>
                      <p className="data-card-title">{inv.invoice_no}</p>
                      <p className="data-card-subtitle">{inv.students?.full_name || '—'}</p>
                    </div>
                    <span className="status-card-pill">{inv.status}</span>
                  </div>

                  <div className="data-card-summary">
                    <div className="summary-item">
                      <span className="summary-item-label">Total</span>
                      <span className="summary-item-value">{formatRupees(inv.total_amount)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-item-label">Paid</span>
                      <span className="summary-item-value success">{formatRupees(inv.paid_amount)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-item-label">Pending</span>
                      <span className="summary-item-value danger">{formatRupees(pending)}</span>
                    </div>
                  </div>
                </div>
              )
            })}

            {filtered.length > 0 && (
              <div className="table-footer mobile-pagination">
                <span>
                  {(currentPage - 1) * PAGE_SIZE + 1}-
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="pagination">
                  <button disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft size={14} />
                  </button>
                  <button disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
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