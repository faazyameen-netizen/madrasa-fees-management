import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Eye } from 'lucide-react'
import { supabase } from '../supabaseClient.js'
import Topbar from '../components/Topbar.jsx'

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

function badgeClass(status) {
  if (status === 'Paid') return 'badge badge-active'
  if (status === 'Partial') return 'badge badge-partial'
  return 'badge badge-inactive'
}

export default function InvoicesList() {
  const navigate = useNavigate()

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Defaults to the current month/year, so landing here mid-month
  // immediately shows where things stand right now.
  const [monthFilter, setMonthFilter] = useState(currentMonth)
  const [yearFilter, setYearFilter] = useState(currentYear)
  const [statusFilter, setStatusFilter] = useState('All Status')

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

  // Summary numbers are calculated from the filtered (month+year) set,
  // not the whole table, so they reflect whichever month you're looking at.
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

  return (
    <>
      <Topbar title="Invoices" />
      <div className="page-content">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 16,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <select
              className="filter-select"
              value={monthFilter}
              onChange={(e) => setMonthFilter(Number(e.target.value))}
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(Number(e.target.value))}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Status</option>
              <option>Unpaid</option>
              <option>Partial</option>
              <option>Paid</option>
            </select>
          </div>

          <Link to="/invoices/generate" className="btn btn-primary">
            <Plus size={16} /> Generate Monthly Invoices
          </Link>
        </div>

        {error && <div className="banner-error">{error}</div>}

        <div className="summary-grid">
          <div className="summary-card">
            <span className="summary-label">Total Invoices</span>
            <span className="summary-value">{summary.totalInvoices}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Collected</span>
            <span className="summary-value summary-success">
              {formatRupees(summary.collected)}
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Pending</span>
            <span className="summary-value summary-danger">
              {formatRupees(summary.pending)}
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Partial Payments</span>
            <span className="summary-value">{summary.partialCount}</span>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading-state">Loading invoices...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              No invoices found for {MONTH_NAMES[monthFilter - 1]} {yearFilter}.
              {' '}Generate monthly invoices to get started.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Student</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Pending Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const pending = Number(inv.total_amount) - Number(inv.paid_amount)
                  return (
                    <tr key={inv.id}>
                      <td>{inv.invoice_no}</td>
                      <td>
                        {inv.students?.full_name || '—'}
                        {inv.students?.roll_no ? ` (${inv.students.roll_no})` : ''}
                      </td>
                      <td>{formatRupees(inv.total_amount)}</td>
                      <td>{formatRupees(inv.paid_amount)}</td>
                      <td>{formatRupees(pending)}</td>
                      <td>
                        <span className={badgeClass(inv.status)}>{inv.status}</span>
                      </td>
                      <td>
                        <div className="action-icons">
                          <button
                            title="View Details"
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                          >
                            <Eye size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}